import { Router, Request, Response } from 'express';
import DB from '../models/db.js';
import bunnyService from '../services/bunnyService.js';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const router = Router();

interface MigrationJob {
  id: string;
  lessonId: number;
  lessonTitle: string;
  status: 'pending' | 'downloading' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  bunnyVideoId?: string;
  startedAt: string;
  completedAt?: string;
}

const migrationJobs = new Map<string, MigrationJob>();

function cleanupOldJobs() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  for (const [jobId, job] of migrationJobs.entries()) {
    if (job.completedAt && new Date(job.completedAt) < oneHourAgo) {
      migrationJobs.delete(jobId);
    }
  }
}

setInterval(cleanupOldJobs, 30 * 60 * 1000);

const MAX_CONCURRENT_MIGRATIONS = 2;
const pendingQueue: Array<{ lessonId: number; jobId: string }> = [];
let activeMigrations = 0;

function processMigrationQueue() {
  while (activeMigrations < MAX_CONCURRENT_MIGRATIONS && pendingQueue.length > 0) {
    const item = pendingQueue.shift();
    if (item) {
      activeMigrations++;
      migrateLessonFromS3(item.lessonId, item.jobId)
        .catch((err) => {
          console.error(`Migration failed for lesson ${item.lessonId}:`, err);
          const job = migrationJobs.get(item.jobId);
          if (job) {
            job.status = 'failed';
            job.error = err.message;
            job.completedAt = new Date().toISOString();
          }
        })
        .finally(() => {
          activeMigrations--;
          setTimeout(processMigrationQueue, 1000);
        });
    }
  }
}

router.get('/pending', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 1000;
    const cappedLimit = Math.min(limit, 1000);
    const offset = (page - 1) * cappedLimit;

    const { count, rows } = await DB.Lessons.findAndCountAll({
      where: {
        [DB.op.or]: [
          { s3_key: { [DB.op.not]: null } },
          { storage_path: { [DB.op.not]: null } },
        ],
        bunny_video_id: { [DB.op.is]: null },
      },
      attributes: [
        'id', 'title', 's3_key', 'storage_path',
        'thumbnail_url', 'transcoding_status'
      ],
      limit: cappedLimit,
      offset,
      order: [['id', 'ASC']],
    });

    const activeJobsByLessonId = new Map<number, MigrationJob>();
    for (const job of migrationJobs.values()) {
      if (job.status === 'downloading' || job.status === 'uploading' || job.status === 'processing') {
        activeJobsByLessonId.set(job.lessonId, job);
      }
    }

    const lessonsWithStatus = rows.map(lesson => {
      const lessonData = lesson.toJSON();
      const activeJob = activeJobsByLessonId.get(lessonData.id);

      if (activeJob) {
        lessonData.migration_status = activeJob.status;
        lessonData.migration_progress = activeJob.progress;
      } else if (lessonData.bunny_video_id && lessonData.transcoding_status === 'completed') {
        lessonData.migration_status = 'completed';
        lessonData.migration_progress = 100;
      } else {
        lessonData.migration_status = 'pending';
        lessonData.migration_progress = 0;
      }

      return lessonData;
    });

    return res.json({
      success: true,
      total: count,
      page,
      limit: cappedLimit,
      totalPages: Math.ceil(count / cappedLimit),
      data: lessonsWithStatus,
    });
  } catch (error: any) {
    console.error('Error fetching pending migrations:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/migrate/:lessonId', async (req: Request, res: Response) => {
  try {
    const { lessonId } = req.params;

    const lesson = await DB.Lessons.findOne({
      where: { id: lessonId },
      raw: true,
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    if (lesson.bunny_video_id) {
      return res.status(400).json({ error: 'Lesson already migrated to Bunny' });
    }

    const existingActiveJob = Array.from(migrationJobs.values()).find(
      (job) => job.lessonId === lesson.id && !['completed', 'failed'].includes(job.status)
    );

    const alreadyInQueue = pendingQueue.some(item => item.lessonId === lesson.id);

    if (existingActiveJob || alreadyInQueue) {
      return res.status(400).json({ error: 'Lesson is already being migrated or is queued' });
    }

    const jobId = crypto.randomBytes(8).toString('hex');
    const job: MigrationJob = {
      id: jobId,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      status: 'pending',
      progress: 0,
      startedAt: new Date().toISOString(),
    };

    migrationJobs.set(jobId, job);
    pendingQueue.push({ lessonId: lesson.id, jobId });
    processMigrationQueue();

    return res.json({
      success: true,
      jobId,
      message: 'Migration queued',
      job,
    });
  } catch (error: any) {
    console.error('Error starting migration:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/migrate-batch', async (req: Request, res: Response) => {
  try {
    const { lessonIds } = req.body;

    if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
      return res.status(400).json({ error: 'lessonIds array required' });
    }

    const jobs = [];

    for (const lessonId of lessonIds) {
      const lesson = await DB.Lessons.findOne({
        where: { id: lessonId },
        raw: true,
      });

      if (!lesson || lesson.bunny_video_id) {
        continue;
      }

      const existingActiveJob = Array.from(migrationJobs.values()).find(
        (job) => job.lessonId === lesson.id && !['completed', 'failed'].includes(job.status)
      );

      const alreadyInQueue = pendingQueue.some(item => item.lessonId === lesson.id);

      if (existingActiveJob || alreadyInQueue) {
        continue;
      }

      const jobId = crypto.randomBytes(8).toString('hex');
      const job: MigrationJob = {
        id: jobId,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        status: 'pending',
        progress: 0,
        startedAt: new Date().toISOString(),
      };

      migrationJobs.set(jobId, job);
      pendingQueue.push({ lessonId: lesson.id, jobId });
      jobs.push({ jobId, lessonId: lesson.id });
    }

    processMigrationQueue();

    return res.json({
      success: true,
      message: `Queued ${jobs.length} migration jobs (processing ${MAX_CONCURRENT_MIGRATIONS} at a time)`,
      jobs,
    });
  } catch (error: any) {
    console.error('Error starting batch migration:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.get('/jobs', async (req: Request, res: Response) => {
  try {
    cleanupOldJobs();
    const jobs = Array.from(migrationJobs.values());
    return res.json({ success: true, count: jobs.length, jobs });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/job/:jobId', async (req: Request, res: Response) => {
  try {
    const jobId = String(req.params.jobId);
    const job = migrationJobs.get(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Migration job not found' });
    }

    return res.json({ success: true, job });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

async function migrateLessonFromS3(lessonId: number, jobId: string): Promise<void> {
  const job = migrationJobs.get(jobId);
  if (!job) return;

  try {
    const lesson = await DB.Lessons.findOne({
      where: { id: lessonId },
      raw: true,
    });

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    if (lesson.bunny_video_id) {
      job.status = 'completed';
      job.progress = 100;
      job.bunnyVideoId = lesson.bunny_video_id;
      job.completedAt = new Date().toISOString();
      return;
    }

    const s3Key = lesson.storage_path || lesson.s3_key;
    if (!s3Key) {
      throw new Error('No S3 key found for this lesson');
    }

    job.status = 'downloading';
    job.progress = 10;

    const tempDir = os.tmpdir();
    const fileName = path.basename(s3Key);
    const localPath = path.join(tempDir, `migrate_${lessonId}_${crypto.randomBytes(4).toString('hex')}_${fileName}`);

    try {
      const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');

      const s3Client = new S3Client({
        region: process.env.AWS_REGION || 'af-south-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
      });

      const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET || '',
        Key: s3Key,
      });

      const response = await s3Client.send(command);

      if (!response.Body) {
        throw new Error('No body in S3 response');
      }

      const chunks: Uint8Array[] = [];
      const stream = response.Body as any;

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);
      fs.writeFileSync(localPath, buffer);

      job.progress = 40;
    } catch (err: any) {
      throw new Error(`Failed to download from S3: ${err.message}`);
    }

    job.status = 'uploading';
    job.progress = 50;

    try {
      const streamVideo = await bunnyService.uploadToStream(localPath, {
        title: lesson.title,
      });

      job.progress = 90;
      job.bunnyVideoId = streamVideo.guid;
    } catch (err: any) {
      throw new Error(`Failed to upload to Bunny: ${err.message}`);
    } finally {
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }

    await DB.Lessons.update(
      {
        bunny_video_id: job.bunnyVideoId,
        storage_path: null,
        transcoding_status: 'processing',
      },
      { where: { id: lessonId } }
    );

    job.progress = 100;
    job.status = 'completed';
    job.completedAt = new Date().toISOString();

    console.log(`[Migration ${jobId}] ✅ Lesson ${lessonId} migrated to Bunny: ${job.bunnyVideoId}`);
  } catch (error: any) {
    console.error(`[Migration ${jobId}] ❌ Failed:`, error.message);
    job.status = 'failed';
    job.error = error.message;
    job.completedAt = new Date().toISOString();
    throw error;
  }
}

export default router;
