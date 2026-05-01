import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import DB from '../models/db.js';
import bunnyService from '../services/bunnyService.js';

const router = Router();

// Get platform-appropriate temp directory
const getTempDir = (): string => {
  const envDir = process.env.TEMP_DIR;
  if (envDir) return envDir;

  if (process.platform === 'win32') {
    return process.env.TEMP || process.env.TMP || 'C:\\Temp';
  }
  return '/tmp';
};

const TEMP_DIR = getTempDir();

// Configure multer for memory storage (file buffer)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB max per file
    files: 50, // Max 50 files per upload
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      'video/x-matroska',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only video files are allowed.`));
    }
  },
});

interface UploadJob {
  id: string;
  filename: string;
  originalName: string;
  lessonId?: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  bunnyVideoId?: string;
  bunnyStoragePath?: string;
  startedAt: string;
  completedAt?: string;
}

const uploadJobs = new Map<string, UploadJob>();

function cleanupOldJobs() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  for (const [jobId, job] of uploadJobs.entries()) {
    if (job.completedAt && new Date(job.completedAt) < oneHourAgo) {
      uploadJobs.delete(jobId);
    }
  }
}

setInterval(cleanupOldJobs, 30 * 60 * 1000);

router.post(
  '/upload',
  upload.array('videos', 50),
  async (req: Request, res: Response) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No video files provided' });
      }

      const files = req.files as Express.Multer.File[];
      const results = [];

      for (const file of files) {
        const jobId = crypto.randomBytes(12).toString('hex');
        const safeFilename = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        const job: UploadJob = {
          id: jobId,
          filename: safeFilename,
          originalName: file.originalname,
          status: 'pending',
          progress: 0,
          startedAt: new Date().toISOString(),
        };

        uploadJobs.set(jobId, job);

        // Store file buffer temporarily (could use temp file)
        const tempPath = path.join(TEMP_DIR, `upload_${jobId}`);
        fs.writeFileSync(tempPath, file.buffer);

        results.push({
          jobId,
          filename: safeFilename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        });
      }

      return res.json({
        success: true,
        message: `${files.length} file(s) received, starting upload`,
        uploads: results,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
);

router.post('/process/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = uploadJobs.get(jobId as string);

    if (!job) {
      return res.status(404).json({ error: 'Upload job not found' });
    }

    if (job.status === 'completed' || job.status === 'processing') {
      return res.status(400).json({ error: 'Upload already processed' });
    }

    job.status = 'processing';
    job.progress = 10;

    const tempPath = path.join(TEMP_DIR, `upload_${jobId}`);

    if (!fs.existsSync(tempPath)) {
      job.status = 'failed';
      job.error = 'Temporary file not found';
      return res.status(404).json({ error: job.error });
    }

    try {
      job.progress = 30;

      // Upload to Bunny Stream
      const streamVideo = await bunnyService.uploadToStream(tempPath, {
        title: job.originalName.replace(/\.[^/.]+$/, ''),
      });

      job.progress = 80;
      job.bunnyVideoId = streamVideo.guid;

      // Clean up temp file
      fs.unlinkSync(tempPath);

      job.progress = 100;
      job.status = 'completed';
      job.completedAt = new Date().toISOString();

      return res.json({
        success: true,
        jobId,
        message: 'Video uploaded to Bunny Stream',
        videoId: streamVideo.guid,
        status: streamVideo.status,
      });
    } catch (err: any) {
      // Clean up temp file on error
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }

      job.status = 'failed';
      job.error = err.message;
      job.completedAt = new Date().toISOString();

      throw err;
    }
  } catch (error: any) {
    console.error('Error processing upload:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/process-batch', async (req: Request, res: Response) => {
  try {
    const { jobIds } = req.body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({ error: 'jobIds array required' });
    }

    const results = [];

    for (const jobId of jobIds) {
      const job = uploadJobs.get(jobId);
      if (!job || job.status !== 'pending') {
        results.push({ jobId, status: 'skipped', reason: 'Not found or already processed' });
        continue;
      }

      try {
        const tempPath = path.join(TEMP_DIR, `upload_${jobId}`);
        if (!fs.existsSync(tempPath)) {
          job.status = 'failed';
          job.error = 'Temporary file not found';
          results.push({ jobId, status: 'failed', error: job.error });
          continue;
        }

        job.status = 'processing';
        job.progress = 30;

        const streamVideo = await bunnyService.uploadToStream(tempPath, {
          title: job.originalName.replace(/\.[^/.]+$/, ''),
        });

        fs.unlinkSync(tempPath);

        job.progress = 100;
        job.status = 'completed';
        job.completedAt = new Date().toISOString();
        job.bunnyVideoId = streamVideo.guid;

        results.push({
          jobId,
          status: 'completed',
          videoId: streamVideo.guid,
          transcodingStatus: streamVideo.status,
        });
      } catch (err: any) {
        const tempPath = path.join(TEMP_DIR, `upload_${jobId}`);
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }

        job.status = 'failed';
        job.error = err.message;
        job.completedAt = new Date().toISOString();

        results.push({ jobId, status: 'failed', error: err.message });
      }
    }

    return res.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('Error processing batch:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.get('/jobs', async (req: Request, res: Response) => {
  try {
    cleanupOldJobs();
    const jobs = Array.from(uploadJobs.values());
    return res.json({ success: true, count: jobs.length, jobs });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/job/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = uploadJobs.get(jobId as string);

    if (!job) {
      return res.status(404).json({ error: 'Upload job not found' });
    }

    return res.json({ success: true, job });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/attach-to-lesson', async (req: Request, res: Response) => {
  try {
    const { jobId, lessonId, title } = req.body;

    if (!jobId || !lessonId) {
      return res.status(400).json({ error: 'jobId and lessonId required' });
    }

    const job = uploadJobs.get(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Upload job not found' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Upload not completed yet' });
    }

    if (!job.bunnyVideoId) {
      return res.status(400).json({ error: 'No Bunny video ID associated with this upload' });
    }

    const lesson = await DB.Lessons.findOne({
      where: { id: lessonId },
      raw: true,
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const updates: any = {
      bunny_video_id: job.bunnyVideoId,
      storage_path: job.bunnyStoragePath || null,
      transcoding_status: 'processing',
    };

    if (title) {
      updates.title = title;
    }

    await DB.Lessons.update(updates, { where: { id: lessonId } });

    return res.json({
      success: true,
      message: 'Video attached to lesson',
      lesson: { ...lesson, ...updates },
    });
  } catch (error: any) {
    console.error('Error attaching to lesson:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/create-lesson-from-upload', async (req: Request, res: Response) => {
  try {
    const { jobId, title, description, areaId, levelId, topicId, subtopicId, price } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: 'jobId required' });
    }

    const job = uploadJobs.get(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Upload job not found' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Upload not completed yet' });
    }

    if (!job.bunnyVideoId) {
      return res.status(400).json({ error: 'No Bunny video ID associated with this upload' });
    }

    const lessonData: any = {
      title: title || job.originalName.replace(/\.[^/.]+$/, ''),
      description: description || 'Uploaded via admin panel',
      bunny_video_id: job.bunnyVideoId,
      transcoding_status: 'processing',
      thumbnail_url: bunnyService.getThumbnailUrl(job.bunnyVideoId),
    };

    if (areaId) lessonData.area_id = areaId;
    if (levelId) lessonData.level_id = levelId;
    if (topicId) lessonData.topic_id = topicId;
    if (subtopicId) lessonData.subtopic_id = subtopicId;
    if (price !== undefined) lessonData.price = price;

    const [newLesson] = await DB.Lessons.create(lessonData, {
      returning: true,
      fields: ['id', 'title', 'bunny_video_id', 'thumbnail_url'],
    });

    return res.json({
      success: true,
      message: 'Lesson created from upload',
      lesson: newLesson,
    });
  } catch (error: any) {
    console.error('Error creating lesson from upload:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
