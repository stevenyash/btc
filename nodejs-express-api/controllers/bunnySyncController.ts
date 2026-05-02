import { Router, Request, Response } from 'express';
import DB from '../models/db.js';
import bunnyService from '../services/bunnyService.js';
import crypto from 'crypto';

const router = Router();

interface SyncJob {
  id: string;
  lessonId: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

const syncJobs = new Map<string, SyncJob>();

function cleanupOldJobs() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  for (const [jobId, job] of syncJobs.entries()) {
    if ((job.status === 'completed' || job.status === 'failed') && job.completedAt) {
      const completedTime = new Date(job.completedAt);
      if (completedTime < oneHourAgo) {
        syncJobs.delete(jobId);
      }
    }
  }
}

setInterval(cleanupOldJobs, 30 * 60 * 1000);

const MAX_CONCURRENT_SYNCS = 3;
const pendingQueue: Array<{ lessonId: number; jobId: string }> = [];
let activeSyncs = 0;

function processSyncQueue() {
  while (activeSyncs < MAX_CONCURRENT_SYNCS && pendingQueue.length > 0) {
    const item = pendingQueue.shift();
    if (item) {
      activeSyncs++;

      DB.Lessons.findOne({ where: { id: item.lessonId }, raw: true })
        .then((lesson) => {
          if (!lesson) {
            throw new Error('Lesson not found');
          }
          return syncLesson(lesson, item.jobId);
        })
        .catch((err) => {
          console.error(`Sync failed for lesson ${item.lessonId}:`, err);
          const job = syncJobs.get(item.jobId);
          if (job) {
            job.status = 'failed';
            job.error = err.message;
            job.completedAt = new Date().toISOString();
          }
        })
        .finally(() => {
          activeSyncs--;
          setTimeout(processSyncQueue, 500);
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

    const lessonsNeedingSync = await DB.Lessons.findAndCountAll({
      where: {
        [DB.op.or]: [
          { bunny_video_id: { [DB.op.not]: null } },
          { storage_path: { [DB.op.not]: null } },
        ],
      },
      attributes: [
        'id', 'title', 'bunny_video_id', 'storage_path',
        'thumbnail_url', 'transcoding_status'
      ],
      limit: cappedLimit,
      offset,
      order: [['id', 'ASC']],
    });

    const activeJobsByLessonId = new Map<number, SyncJob>();
    for (const job of syncJobs.values()) {
      if (job.status === 'processing') {
        activeJobsByLessonId.set(job.lessonId, job);
      }
    }

    const lessonsWithStatus = lessonsNeedingSync.rows.map(lesson => {
      const lessonData = lesson.toJSON();
      const activeJob = activeJobsByLessonId.get(lessonData.id);

      if (activeJob) {
        lessonData.sync_status = activeJob.status;
        lessonData.sync_progress = activeJob.progress;
      } else if (lessonData.bunny_video_id && lessonData.transcoding_status === 'completed') {
        lessonData.sync_status = 'completed';
        lessonData.sync_progress = 100;
      } else {
        lessonData.sync_status = 'pending';
        lessonData.sync_progress = 0;
      }

      return lessonData;
    });

    const totalLessonsCount = await DB.Lessons.count();

    return res.json({
      success: true,
      total: lessonsNeedingSync.count,
      page,
      limit: cappedLimit,
      totalPages: Math.ceil(lessonsNeedingSync.count / cappedLimit),
      totalLessons: totalLessonsCount,
      data: lessonsWithStatus,
    });
  } catch (error: any) {
    console.error('Error fetching pending syncs:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/sync/:lessonId', async (req: Request, res: Response) => {
  try {
    const { lessonId } = req.params;

    const lesson = await DB.Lessons.findOne({
      where: { id: lessonId },
      raw: true,
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    if (!lesson.bunny_video_id && !lesson.storage_path) {
      return res.status(400).json({ error: 'Lesson has no Bunny video ID or storage path' });
    }

    const existingActiveJob = Array.from(syncJobs.values()).find(
      (job) => job.lessonId === lesson.id && job.status === 'processing'
    );

    const alreadyInQueue = pendingQueue.some(item => item.lessonId === lesson.id);

    if (existingActiveJob || alreadyInQueue) {
      return res.status(400).json({ error: 'Lesson is already being synced or is queued' });
    }

    const jobId = crypto.randomBytes(8).toString('hex');
    const job: SyncJob = {
      id: jobId,
      lessonId: lesson.id,
      status: 'pending',
      progress: 0,
      startedAt: new Date().toISOString(),
    };

    syncJobs.set(jobId, job);
    pendingQueue.push({ lessonId: lesson.id, jobId });
    processSyncQueue();

    return res.json({
      success: true,
      jobId,
      message: 'Sync queued',
      job,
    });
  } catch (error: any) {
    console.error('Error starting sync:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/sync-all', async (req: Request, res: Response) => {
  try {
    const lessons = await DB.Lessons.findAll({
      where: {
        [DB.op.or]: [
          { bunny_video_id: { [DB.op.not]: null } },
          { storage_path: { [DB.op.not]: null } },
        ],
      },
      raw: true,
    });

    const jobs = [];

    for (const lesson of lessons) {
      const existingActiveJob = Array.from(syncJobs.values()).find(
        (job) => job.lessonId === lesson.id && job.status === 'processing'
      );

      const alreadyInQueue = pendingQueue.some(item => item.lessonId === lesson.id);

      if (existingActiveJob || alreadyInQueue) {
        continue;
      }

      const jobId = crypto.randomBytes(8).toString('hex');
      const job: SyncJob = {
        id: jobId,
        lessonId: lesson.id,
        status: 'pending',
        progress: 0,
        startedAt: new Date().toISOString(),
      };

      syncJobs.set(jobId, job);
      pendingQueue.push({ lessonId: lesson.id, jobId });
      jobs.push({ jobId, lessonId: lesson.id });
    }

    processSyncQueue();

    return res.json({
      success: true,
      message: `Queued ${jobs.length} sync jobs (processing ${MAX_CONCURRENT_SYNCS} at a time)`,
      jobs,
    });
  } catch (error: any) {
    console.error('Error starting batch sync:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.get('/jobs', async (req: Request, res: Response) => {
  try {
    cleanupOldJobs();
    const jobs = Array.from(syncJobs.values());
    return res.json({ success: true, count: jobs.length, jobs });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/job/:jobId', async (req: Request, res: Response) => {
  try {
    const jobId = String(req.params.jobId);
    const job = syncJobs.get(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Sync job not found' });
    }

    return res.json({ success: true, job });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

async function syncLesson(lesson: any, jobId: string): Promise<void> {
  const job = syncJobs.get(jobId);
  if (!job) return;

  try {
    job.status = 'processing';
    job.progress = 20;

    const updates: any = {};

    if (lesson.bunny_video_id) {
      try {
        const video = await bunnyService.getStreamVideo(lesson.bunny_video_id);
        job.progress = 50;

        const thumbnailUrl = bunnyService.getThumbnailUrl(lesson.bunny_video_id);
        if (lesson.thumbnail_url !== thumbnailUrl) {
          updates.thumbnail_url = thumbnailUrl;
        }

        if (lesson.transcoding_status !== video.status) {
          updates.transcoding_status = video.status;
        }

        job.progress = 80;
      } catch (err: any) {
        console.error(`[Sync ${jobId}] Video ${lesson.bunny_video_id} orphaned:`, err.message);
        updates.bunny_video_id = null;
        updates.transcoding_status = 'pending';
      }
    }

    if (lesson.storage_path) {
      try {
        const thumbnailUrl = bunnyService.getPublicUrl(lesson.storage_path);
        if (lesson.thumbnail_url !== thumbnailUrl) {
          updates.thumbnail_url = thumbnailUrl;
        }
      } catch (err: any) {
        if (err.message?.includes('404') || err.message?.includes('not found')) {
          updates.storage_path = null;
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      await DB.Lessons.update(updates, { where: { id: lesson.id } });
    }

    job.progress = 100;
    job.status = 'completed';
    job.completedAt = new Date().toISOString();

    console.log(`[Sync ${jobId}] ✅ Lesson ${lesson.id} synced successfully`);
  } catch (error: any) {
    console.error(`[Sync ${jobId}] ❌ Failed:`, error.message);
    job.status = 'failed';
    job.error = error.message;
    job.completedAt = new Date().toISOString();
    throw error;
  }
}

router.post('/fix-orphaned', async (req: Request, res: Response) => {
  try {
    const lessons = await DB.Lessons.findAll({
      where: {
        bunny_video_id: { [DB.op.not]: null },
      },
      raw: true,
    });

    let fixed = 0;

    for (const lesson of lessons) {
      try {
        await bunnyService.getStreamVideo(lesson.bunny_video_id);
      } catch (err: any) {
        if (err.message?.includes('404') || err.message?.includes('not found')) {
          await DB.Lessons.update(
            { bunny_video_id: null, transcoding_status: 'pending' },
            { where: { id: lesson.id } }
          );
          fixed++;
        }
      }
    }

    return res.json({
      success: true,
      fixed,
      message: `Fixed ${fixed} orphaned Bunny video references`,
    });
  } catch (error: any) {
    console.error('Error fixing orphaned videos:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET all Bunny Stream videos
router.get('/bunny-videos', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const cappedLimit = Math.min(limit, 100);

    const response = await bunnyService.getStreamVideos(page, cappedLimit);
    
    return res.json({
      success: true,
      data: response.items || response.videos || [],
      pagination: {
        page: response.page || page,
        limit: response.itemsPerPage || cappedLimit,
        total: response.totalItems || 0,
        totalPages: response.totalPages || Math.ceil((response.totalItems || 0) / (response.itemsPerPage || cappedLimit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching Bunny videos:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET all Bunny Stream collections
router.get('/bunny-collections', async (req: Request, res: Response) => {
  try {
    const response = await bunnyService.getStreamCollections();
    
    return res.json({
      success: true,
      data: response.items || response.collections || []
    });
  } catch (error: any) {
    console.error('Error fetching Bunny collections:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Create Collection (from lesson hierarchy or manual name)
router.post('/collection', async (req: Request, res: Response) => {
  try {
    const { name, levelName, gradeName, areaName, topicName, subtopicName } = req.body;

    if (!name && !(levelName && gradeName && areaName)) {
      return res.status(400).json({ error: 'Collection name is required, or provide level/grade/area hierarchy' });
    }

    const collectionName = name || [levelName, gradeName, areaName, topicName, subtopicName].filter(Boolean).join(' / ');

    const data = await bunnyService.createCollection(collectionName);
    return res.json({
      success: true,
      message: 'Collection created',
      data
    });
  } catch (error: any) {
    console.error('Error creating collection:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Update Collection name
router.put('/collection/:guid', async (req: Request, res: Response) => {
  try {
    const guid = String(req.params.guid);
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'New name is required' });
    }

    const data = await bunnyService.updateCollection(guid, name);
    return res.json({
      success: true,
      message: 'Collection updated',
      data
    });
  } catch (error: any) {
    console.error('Error updating collection:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Delete Collection
router.delete('/collection/:guid', async (req: Request, res: Response) => {
  try {
    const guid = String(req.params.guid);
    const data = await bunnyService.deleteCollection(guid);
    return res.json({
      success: true,
      message: 'Collection deleted',
      data
    });
  } catch (error: any) {
    console.error('Error deleting collection:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET mapping status - which Bunny videos are mapped to local lessons
router.get('/mapping-status', async (req: Request, res: Response) => {
  try {
    const lessonsWithBunnyIds = await DB.Lessons.findAll({
      where: {
        bunny_video_id: { [DB.op.not]: null }
      },
      attributes: ['id', 'title', 'bunny_video_id'],
      raw: true
    });

    const bunnyVideoToLessonMap = new Map();
    lessonsWithBunnyIds.forEach(lesson => {
      bunnyVideoToLessonMap.set(lesson.bunny_video_id, {
        lessonId: lesson.id,
        lessonTitle: lesson.title
      });
    });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const cappedLimit = Math.min(limit, 100);
    
    const bunnyResponse = await bunnyService.getStreamVideos(page, cappedLimit);
    const bunnyVideos = bunnyResponse.items || bunnyResponse.videos || [];

    const videosWithMappingStatus = bunnyVideos.map(video => ({
      ...video,
      isMapped: bunnyVideoToLessonMap.has(video.guid),
      mappedLesson: bunnyVideoToLessonMap.get(video.guid) || null
    }));

    return res.json({
      success: true,
      data: videosWithMappingStatus,
      pagination: {
        page: bunnyResponse.page || page,
        limit: bunnyResponse.itemsPerPage || cappedLimit,
        total: bunnyResponse.totalItems || 0,
        totalPages: bunnyResponse.totalPages || Math.ceil((bunnyResponse.totalItems || 0) / (bunnyResponse.itemsPerPage || cappedLimit))
      },
      summary: {
        totalBunnyVideos: bunnyResponse.totalItems || 0,
        mappedVideos: lessonsWithBunnyIds.length,
        unmappedVideos: Math.max(0, (bunnyResponse.totalItems || 0) - lessonsWithBunnyIds.length)
      }
    });
  } catch (error: any) {
    console.error('Error fetching mapping status:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET lessons that are not linked to any Bunny video (available for linking)
router.get('/unlinked-lessons', async (req: Request, res: Response) => {
  try {
    const lessons = await DB.Lessons.findAll({
      where: {
        bunny_video_id: { [DB.op.or]: [null, ''] }
      },
      attributes: ['id', 'title'],
      raw: true,
      order: [['id', 'ASC']]
    });
    return res.json({ success: true, data: lessons });
  } catch (error: any) {
    console.error('Error fetching unlinked lessons:', error);
    return res.status(500).json({ error: error.message });
  }
});

// POST link a Bunny video to a lesson
router.post('/link-bunny-video', async (req: Request, res: Response) => {
  try {
    const { bunnyVideoId, lessonId } = req.body;

    if (!bunnyVideoId || !lessonId) {
      return res.status(400).json({ error: 'bunnyVideoId and lessonId are required' });
    }

    const lesson = await DB.Lessons.findOne({
      where: { id: lessonId },
      raw: true
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const existingLesson = await DB.Lessons.findOne({
      where: { 
        bunny_video_id: bunnyVideoId,
        id: { [DB.op.not]: lessonId }
      },
      raw: true
    });

    if (existingLesson) {
      return res.status(400).json({ 
        error: 'This Bunny video is already linked to another lesson',
        existingLessonId: existingLesson.id,
        existingLessonTitle: existingLesson.title
      });
    }

    await DB.Lessons.update(
      { 
        bunny_video_id: bunnyVideoId,
        transcoding_status: 'processing'
      },
      { where: { id: lessonId } }
    );

    return res.json({
      success: true,
      message: 'Bunny video linked to lesson',
      lesson: {
        id: lessonId,
        title: lesson.title,
        bunny_video_id: bunnyVideoId,
        transcoding_status: 'processing'
      }
    });
  } catch (error: any) {
    console.error('Error linking Bunny video:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Assign video to Collection
router.post('/video-to-collection', async (req: Request, res: Response) => {
  try {
    const { videoId, collectionId } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    const data = await bunnyService.assignVideoToCollection(videoId, collectionId || null);
    return res.json({
      success: true,
      message: collectionId ? 'Video assigned to collection' : 'Video removed from collection',
      data
    });
  } catch (error: any) {
    console.error('Error assigning video to collection:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET collections (legacy endpoint for frontend compatibility)
router.get('/collections', async (req: Request, res: Response) => {
  try {
    const response = await bunnyService.getStreamCollections();
    return res.json({
      success: true,
      data: response.items || response.collections || []
    });
  } catch (error: any) {
    console.error('Error fetching collections:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET sync statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const totalLessons = await DB.Lessons.count();
    const inSync = await DB.Lessons.count({
      where: {
        bunny_video_id: { [DB.op.not]: null },
        transcoding_status: 'completed'
      }
    });
    const pending = await DB.Lessons.count({
      where: {
        bunny_video_id: { [DB.op.not]: null },
        transcoding_status: { [DB.op.not]: 'completed' }
      }
    });
    const noBunnyVideo = await DB.Lessons.count({
      where: {
        [DB.op.or]: [
          { bunny_video_id: null },
          { bunny_video_id: '' }
        ]
      }
    });

    return res.json({
      success: true,
      totalLessons,
      inSync,
      pending,
      noBunnyVideo
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;