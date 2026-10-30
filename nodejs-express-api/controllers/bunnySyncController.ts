import { Router, Request, Response } from 'express';
import DB from '../models/db.js';
import bunnyService from '../services/bunnyService.js';
import bunnyReconciliationService from '../services/bunnyReconciliationService.js';
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

function normalizeFilenamePart(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function editDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i++) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= right.length; j++) {
      const above = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[right.length];
}

function similarity(left: string, right: string): number {
  const longest = Math.max(left.length, right.length);
  return longest === 0 ? 1 : 1 - editDistance(left, right) / longest;
}

function parseLessonFilename(filename: string) {
  const withoutExtension = filename.replace(/\.[^/.]+$/, '').trim();
  // Support both 3-part and 4-part formats:
  // 3-part: "Grade 7 Area Name - Strand Name" (Grade Area - Subtopic)
  // 4-part: "Grade 7 Area Name - Topic Name - Strand Name" (Grade Area - Topic - Subtopic)
  const match = withoutExtension.match(/^(Grade\s+\d+|Form\s+\d+)\s+(.+?)\s+-\s+(.+)$/i);
  if (!match) return null;
  
  const subtopicAndRest = match[3].trim();
  // Check if there's another " - " separator for 4-part format
  const subtopicParts = subtopicAndRest.split(/\s+-\s+/).map((p: string) => p.trim()).filter(Boolean);
  
  if (subtopicParts.length >= 2) {
    // 4-part format: Grade Area - Topic - Subtopic
    return {
      grade: match[1].trim(),
      area: match[2].trim(),
      topic: subtopicParts[0],
      subtopic: subtopicParts.slice(1).join(' - '),
    };
  }
  
  // 3-part format: Grade Area - Subtopic (no separate topic)
  return {
    grade: match[1].trim(),
    area: match[2].trim(),
    topic: subtopicParts[0], // Use subtopic as topic
    subtopic: subtopicParts[0],
  };
}

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
        bunny_video_id: {
          [DB.op.not]: null,
          [DB.op.ne]: '',
        },
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
        if (err.message?.includes('Video has failed status')) {
          updates.transcoding_status = 'failed';
        } else if (err.message?.includes('(404)')) {
          console.warn(`[Sync ${jobId}] Bunny video ${lesson.bunny_video_id} was not found; clearing orphaned link`);
          updates.bunny_video_id = null;
          updates.transcoding_status = 'pending';
        } else {
          throw err;
        }
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

router.get('/batch-link-preview', async (_req: Request, res: Response) => {
  try {
    const videos = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const response = await bunnyService.getStreamVideos(page, 100);
      videos.push(...(response.items || response.videos || []));
      totalPages = Math.max(1, Number(response.totalPages) || 1);
      page++;
    }

    const [lessons, grades, areas, topics, subtopics] = await Promise.all([
      DB.Lessons.findAll({
        attributes: ['id', 'title', 'bunny_video_id', 'area_id', 'topic_id', 'subtopic_id'],
        include: [
          {
            model: DB.LearningAreas,
            as: 'learning_area',
            attributes: ['id', 'name'],
            include: [{
              model: DB.Grades,
              as: 'grade_info',
              attributes: ['id', 'name'],
            }],
          },
          { model: DB.Topics, as: 'topic', attributes: ['topic_id', 'name'] },
          { model: DB.Subtopics, as: 'subtopic', attributes: ['subtopic_id', 'name'] },
        ],
      }),
      DB.Grades.findAll({ attributes: ['id', 'name', 'level_id'], raw: true }),
      DB.LearningAreas.findAll({ attributes: ['id', 'name', 'grade_id'], raw: true }),
      DB.Topics.findAll({ attributes: ['topic_id', 'name', 'area_id'], raw: true }),
      DB.Subtopics.findAll({ attributes: ['subtopic_id', 'name', 'topic_id'], raw: true }),
    ]);

    const lessonRows = lessons.map((lesson: any) => lesson.toJSON());
    const mappedVideoLessons = new Map<string, any>();
    for (const lesson of lessonRows) {
      if (lesson.bunny_video_id) mappedVideoLessons.set(lesson.bunny_video_id, lesson);
    }

    const data = videos.map((video) => {
      const filename = String(video.title || '').trim();
      const parsed = parseLessonFilename(filename);
      const mappedLesson = mappedVideoLessons.get(video.guid);

      if (mappedLesson) {
        return {
          bunnyVideoId: video.guid,
          filename,
          parsed,
          status: 'already_linked',
          message: `Already linked to lesson #${mappedLesson.id}: ${mappedLesson.title}`,
          matchedLesson: { id: mappedLesson.id, title: mappedLesson.title },
        };
      }

      if (!parsed) {
        return {
          bunnyVideoId: video.guid,
          filename,
          parsed: null,
          status: 'unmatched',
          message: 'Expected filename format: Grade 7 Area Name - Strand Name.mp4',
        };
      }

      const matchingGrades = grades.filter((grade: any) =>
        normalizeFilenamePart(grade.name || '').replace(/^grade\s+/, '') ===
        normalizeFilenamePart(parsed.grade).replace(/^grade\s+/, '')
      );
      if (matchingGrades.length === 0) {
        return {
          bunnyVideoId: video.guid,
          filename,
          parsed,
          status: 'unmatched',
          message: `No database grade matches "${parsed.grade}"`,
        };
      }

      const areaCandidates = new Map<number, { name: string; score: number }>();
      for (const grade of matchingGrades) {
        for (const area of areas.filter((candidate: any) => candidate.grade_id === grade.id)) {
        const score = similarity(
          normalizeFilenamePart(parsed.area),
          normalizeFilenamePart(area.name),
        );
        const previous = areaCandidates.get(area.id);
        if (!previous || score > previous.score) {
          areaCandidates.set(area.id, { name: area.name, score });
        }
        }
      }

      const rankedAreas = [...areaCandidates.entries()]
        .map(([id, candidate]) => ({ id, ...candidate }))
        .sort((left, right) => right.score - left.score);
      const bestArea = rankedAreas[0];
      if (!bestArea || bestArea.score < 0.8) {
        return {
          bunnyVideoId: video.guid,
          filename,
          parsed,
          status: 'unmatched',
          message: `No learning area closely matches "${parsed.area}" in ${parsed.grade}`,
          suggestions: rankedAreas.slice(0, 3).map(({ id, name, score }) => ({ id, name, score })),
        };
      }
      if (rankedAreas[1] && bestArea.score - rankedAreas[1].score < 0.05) {
        return {
          bunnyVideoId: video.guid,
          filename,
          parsed,
          status: 'ambiguous',
          message: `Several learning areas match "${parsed.area}"`,
          suggestions: rankedAreas.slice(0, 3).map(({ id, name, score }) => ({ id, name, score })),
        };
      }

      const subtopicName = normalizeFilenamePart(parsed.subtopic);
      const topicName = parsed.topic ? normalizeFilenamePart(parsed.topic) : null;
      
      const matchingSubtopics = subtopics.flatMap((candidate: any) => {
        if (normalizeFilenamePart(candidate.name || '') !== subtopicName) return [];
        const topic = topics.find((item: any) =>
          item.topic_id === candidate.topic_id && item.area_id === bestArea.id
        );
        if (!topic) return [];
        // If we have a parsed topic, verify it matches
        if (topicName && normalizeFilenamePart(topic.name || '') !== topicName) return [];
        return [{ subtopic: candidate, topic }];
      });
      if (matchingSubtopics.length === 0) {
        return {
          bunnyVideoId: video.guid,
          filename,
          parsed,
          status: 'unmatched',
          message: `No topic and subtopic match ${bestArea.name} / ${parsed.subtopic}`,
        };
      }
      if (matchingSubtopics.length > 1) {
        return {
          bunnyVideoId: video.guid,
          filename,
          parsed,
          status: 'ambiguous',
          message: `More than one topic/subtopic matches ${bestArea.name} / ${parsed.subtopic}`,
          suggestions: matchingSubtopics.map(({ subtopic, topic }: any) => ({
            id: subtopic.subtopic_id,
            title: `${topic.name} / ${subtopic.name}`,
          })),
        };
      }

      const { subtopic, topic } = matchingSubtopics[0];
      const grade = matchingGrades.find((item: any) =>
        areas.some((area: any) => area.id === bestArea.id && area.grade_id === item.id)
      );
      if (!grade?.level_id) {
        return {
          bunnyVideoId: video.guid,
          filename,
          parsed,
          status: 'unmatched',
          message: `Grade "${parsed.grade}" is not assigned to a learning level`,
        };
      }
      const matchingLessons = lessonRows.filter((lesson: any) =>
        lesson.area_id === bestArea.id &&
        lesson.topic_id === topic.topic_id &&
        lesson.subtopic_id === subtopic.subtopic_id
      );
      const matchedHierarchy = {
        levelId: grade.level_id,
        gradeId: grade.id,
        areaId: bestArea.id,
        topicId: topic.topic_id,
        subtopicId: subtopic.subtopic_id,
        grade: grade.name,
        area: bestArea.name,
        topic: topic.name,
        subtopic: subtopic.name,
      };

      if (matchingLessons.length > 1) {
        return {
          bunnyVideoId: video.guid,
          filename,
          parsed,
          status: 'ambiguous',
          message: `More than one lesson matches ${bestArea.name} / ${topic.name} / ${subtopic.name}`,
          suggestions: matchingLessons.map((lesson: any) => ({ id: lesson.id, title: lesson.title })),
        };
      }
      if (matchingLessons.length === 0) {
        return {
          bunnyVideoId: video.guid,
          filename,
          parsed,
          status: 'create_lesson',
          message: `Will create a lesson under ${grade.name} / ${bestArea.name} / ${topic.name} / ${subtopic.name}`,
          matchedHierarchy,
        };
      }

      const lesson = matchingLessons[0];
      if (lesson.bunny_video_id && lesson.bunny_video_id !== video.guid) {
        return {
          bunnyVideoId: video.guid,
          filename,
          parsed,
          status: 'lesson_already_linked',
          message: `Matching lesson #${lesson.id} is already linked to another Bunny video`,
          matchedLesson: { id: lesson.id, title: lesson.title },
          matchedHierarchy,
        };
      }

      return {
        bunnyVideoId: video.guid,
        filename,
        parsed,
        status: 'matched',
        message: `Matched ${parsed.grade} / ${bestArea.name} / ${parsed.subtopic}`,
        matchedLesson: { id: lesson.id, title: lesson.title },
        matchedHierarchy,
      };
    });

    const matchedLessonCounts = new Map<string, number>();
    for (const candidate of data) {
      if (candidate.status === 'matched' && candidate.matchedLesson) {
        const key = `lesson:${candidate.matchedLesson.id}`;
        matchedLessonCounts.set(key, (matchedLessonCounts.get(key) || 0) + 1);
      } else if (candidate.status === 'create_lesson' && candidate.matchedHierarchy) {
        const hierarchy = candidate.matchedHierarchy;
        const key = `hierarchy:${hierarchy.areaId}:${hierarchy.topicId}:${hierarchy.subtopicId}`;
        matchedLessonCounts.set(key, (matchedLessonCounts.get(key) || 0) + 1);
      }
    }
    for (const candidate of data) {
      const key = candidate.status === 'matched' && candidate.matchedLesson
        ? `lesson:${candidate.matchedLesson.id}`
        : candidate.status === 'create_lesson' && candidate.matchedHierarchy
          ? `hierarchy:${candidate.matchedHierarchy.areaId}:${candidate.matchedHierarchy.topicId}:${candidate.matchedHierarchy.subtopicId}`
          : null;
      if (key && (matchedLessonCounts.get(key) || 0) > 1) {
        candidate.status = 'ambiguous';
        candidate.message = 'Multiple Bunny videos resolve to the same lesson hierarchy; link one at a time';
      }
    }

    return res.json({
      success: true,
      data,
      summary: {
        total: data.length,
        matched: data.filter((item) => item.status === 'matched').length,
        unmatched: data.filter((item) => item.status === 'unmatched').length,
        ambiguous: data.filter((item) => item.status === 'ambiguous').length,
        alreadyLinked: data.filter((item) => item.status === 'already_linked').length,
      },
    });
  } catch (error: any) {
    console.error('Error generating filename-based Bunny link preview:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/batch-link', async (req: Request, res: Response) => {
  try {
    const requestedLinks = req.body?.links;
    if (!Array.isArray(requestedLinks) || requestedLinks.length === 0 || requestedLinks.length > 500) {
      return res.status(400).json({ error: 'Provide between 1 and 500 Bunny video and lesson links' });
    }

    const links: Array<{ bunnyVideoId: string; lessonId: number }> = [];
    for (const link of requestedLinks) {
      const bunnyVideoId = typeof link?.bunnyVideoId === 'string' ? link.bunnyVideoId.trim() : '';
      const lessonId = Number(link?.lessonId);
      if (!bunnyVideoId || !Number.isInteger(lessonId) || lessonId <= 0) {
        return res.status(400).json({ error: 'Each link requires a Bunny video ID and valid lesson ID' });
      }
      links.push({ bunnyVideoId, lessonId });
    }

    if (
      new Set(links.map((link) => link.bunnyVideoId)).size !== links.length ||
      new Set(links.map((link) => link.lessonId)).size !== links.length
    ) {
      return res.status(400).json({ error: 'A Bunny video and lesson can each appear only once per batch' });
    }

    const transaction = await DB.Lessons.sequelize.transaction();
    try {
      const lessonIds = links.map((link) => link.lessonId);
      const videoIds = links.map((link) => link.bunnyVideoId);
      const lessons = await DB.Lessons.findAll({
        where: { id: { [DB.op.in]: lessonIds } },
        attributes: ['id', 'title', 'bunny_video_id'],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (lessons.length !== links.length) {
        await transaction.rollback();
        return res.status(404).json({ error: 'One or more target lessons were not found' });
      }

      const existingVideoLinks = await DB.Lessons.findAll({
        where: { bunny_video_id: { [DB.op.in]: videoIds } },
        attributes: ['id', 'bunny_video_id'],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const lessonById = new Map(lessons.map((lesson: any) => [Number(lesson.id), lesson]));
      for (const link of links) {
        const lesson: any = lessonById.get(link.lessonId);
        const videoLink: any = existingVideoLinks.find((row: any) => row.bunny_video_id === link.bunnyVideoId);
        if (videoLink && Number(videoLink.id) !== link.lessonId) {
          await transaction.rollback();
          return res.status(409).json({ error: `Bunny video ${link.bunnyVideoId} is already linked to another lesson` });
        }
        if (lesson.bunny_video_id && lesson.bunny_video_id !== link.bunnyVideoId) {
          await transaction.rollback();
          return res.status(409).json({ error: `Lesson #${link.lessonId} is already linked to another Bunny video` });
        }
      }

      for (const link of links) {
        const lesson: any = lessonById.get(link.lessonId);
        if (lesson.bunny_video_id === link.bunnyVideoId) continue;
        await DB.Lessons.update(
          {
            bunny_video_id: link.bunnyVideoId,
            video_guid: link.bunnyVideoId,
            bunny_url: bunnyService.getStreamUrl(link.bunnyVideoId),
            transcoding_status: 'processing',
          },
          { where: { id: link.lessonId }, transaction },
        );
      }

      await transaction.commit();
      return res.json({ success: true, linked: links.length });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error('Error applying filename-based Bunny links:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/batch-link-from-filenames', async (req: Request, res: Response) => {
  try {
    const requestedLinks = req.body?.links;
    if (!Array.isArray(requestedLinks) || requestedLinks.length === 0 || requestedLinks.length > 500) {
      return res.status(400).json({ error: 'Provide between 1 and 500 Bunny video links' });
    }

    const links: Array<{
      bunnyVideoId: string;
      lessonId?: number;
      createLesson?: {
        levelId: number;
        gradeId: number;
        areaId: number;
        topicId: number;
        subtopicId: number;
        filename: string;
      };
    }> = [];

    for (const input of requestedLinks) {
      const bunnyVideoId = typeof input?.bunnyVideoId === 'string' ? input.bunnyVideoId.trim() : '';
      const hasLessonId = input?.lessonId !== undefined && input.lessonId !== null;
      const createInput = input?.createLesson;
      if (!bunnyVideoId || hasLessonId === !!createInput) {
        return res.status(400).json({ error: 'Each link needs either a lesson ID or hierarchy details to create a lesson' });
      }

      if (hasLessonId) {
        const lessonId = Number(input.lessonId);
        if (!Number.isInteger(lessonId) || lessonId <= 0) {
          return res.status(400).json({ error: 'Lesson IDs must be positive integers' });
        }
        links.push({ bunnyVideoId, lessonId });
        continue;
      }

      const createLesson = {
        levelId: Number(createInput.levelId),
        gradeId: Number(createInput.gradeId),
        areaId: Number(createInput.areaId),
        topicId: Number(createInput.topicId),
        subtopicId: Number(createInput.subtopicId),
        filename: typeof createInput.filename === 'string' ? createInput.filename.trim() : '',
      };
      if (
        ![createLesson.levelId, createLesson.gradeId, createLesson.areaId, createLesson.topicId, createLesson.subtopicId]
          .every((id) => Number.isInteger(id) && id > 0) ||
        !createLesson.filename ||
        !parseLessonFilename(createLesson.filename)
      ) {
        return res.status(400).json({ error: 'New lessons require valid hierarchy IDs and a recognized filename' });
      }
      links.push({ bunnyVideoId, createLesson });
    }

    const targetKey = (link: typeof links[number]) => link.lessonId
      ? `lesson:${link.lessonId}`
      : `hierarchy:${link.createLesson!.areaId}:${link.createLesson!.topicId}:${link.createLesson!.subtopicId}`;
    if (
      new Set(links.map((link) => link.bunnyVideoId)).size !== links.length ||
      new Set(links.map(targetKey)).size !== links.length
    ) {
      return res.status(400).json({ error: 'A video and target lesson hierarchy can each appear only once per batch' });
    }

    const transaction = await DB.Lessons.sequelize.transaction();
    try {
      const lessonIds = links.map((link) => link.lessonId).filter((id): id is number => id !== undefined);
      const videoIds = links.map((link) => link.bunnyVideoId);
      const targetLessons = lessonIds.length
        ? await DB.Lessons.findAll({
          where: { id: { [DB.op.in]: lessonIds } },
          attributes: ['id', 'title', 'bunny_video_id'],
          transaction,
          lock: transaction.LOCK.UPDATE,
        })
        : [];
      if (targetLessons.length !== lessonIds.length) {
        const error = new Error('One or more target lessons were not found') as Error & { statusCode: number };
        error.statusCode = 404;
        throw error;
      }

      const existingVideoLinks = await DB.Lessons.findAll({
        where: { bunny_video_id: { [DB.op.in]: videoIds } },
        attributes: ['id', 'bunny_video_id'],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const lessonsById = new Map(targetLessons.map((lesson: any) => [Number(lesson.id), lesson]));
      let createdLessons = 0;

      for (const link of links) {
        const linkedVideo = existingVideoLinks.find((item: any) => item.bunny_video_id === link.bunnyVideoId);
        if (linkedVideo && (!link.lessonId || Number(linkedVideo.id) !== link.lessonId)) {
          const error = new Error(`Bunny video ${link.bunnyVideoId} is already linked`) as Error & { statusCode: number };
          error.statusCode = 409;
          throw error;
        }

        if (link.lessonId) {
          const lesson: any = lessonsById.get(link.lessonId);
          if (lesson.bunny_video_id && lesson.bunny_video_id !== link.bunnyVideoId) {
            const error = new Error(`Lesson #${link.lessonId} is already linked to another video`) as Error & { statusCode: number };
            error.statusCode = 409;
            throw error;
          }
          continue;
        }

        const hierarchy = link.createLesson!;
        const [level, grade, area, topic, subtopic] = await Promise.all([
          DB.LearningLevels.findByPk(hierarchy.levelId, { transaction }),
          DB.Grades.findByPk(hierarchy.gradeId, { transaction }),
          DB.LearningAreas.findByPk(hierarchy.areaId, { transaction }),
          DB.Topics.findByPk(hierarchy.topicId, { transaction }),
          DB.Subtopics.findByPk(hierarchy.subtopicId, { transaction }),
        ]);
        const parsed = parseLessonFilename(hierarchy.filename)!;
        const hierarchyMatches = level && grade && area && topic && subtopic &&
          grade.level_id === hierarchy.levelId &&
          area.grade_id === hierarchy.gradeId &&
          topic.area_id === hierarchy.areaId &&
          subtopic.topic_id === hierarchy.topicId &&
          normalizeFilenamePart(grade.name || '').replace(/^grade\s+/, '') ===
            normalizeFilenamePart(parsed.grade).replace(/^grade\s+/, '') &&
          similarity(normalizeFilenamePart(parsed.area), normalizeFilenamePart(area.name || '')) >= 0.8 &&
          normalizeFilenamePart(parsed.subtopic) === normalizeFilenamePart(subtopic.name || '');
        if (!hierarchyMatches) {
          const error = new Error(`Filename hierarchy no longer matches the selected records: ${hierarchy.filename}`) as Error & { statusCode: number };
          error.statusCode = 409;
          throw error;
        }

        const existingLesson = await DB.Lessons.findOne({
          where: {
            area_id: hierarchy.areaId,
            topic_id: hierarchy.topicId,
            subtopic_id: hierarchy.subtopicId,
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (existingLesson) {
          const error = new Error(`A lesson for this hierarchy now exists (#${existingLesson.id}); refresh the preview`) as Error & { statusCode: number };
          error.statusCode = 409;
          throw error;
        }

        await DB.Lessons.create({
          title: parsed.subtopic,
          area_id: hierarchy.areaId,
          topic_id: hierarchy.topicId,
          subtopic_id: hierarchy.subtopicId,
          bunny_video_id: link.bunnyVideoId,
          video_guid: link.bunnyVideoId,
          bunny_url: bunnyService.getStreamUrl(link.bunnyVideoId),
          filename: hierarchy.filename,
          transcoding_status: 'processing',
          is_active: true,
        }, { transaction });
        createdLessons++;
      }

      for (const link of links.filter((item) => item.lessonId !== undefined)) {
        const lesson: any = lessonsById.get(link.lessonId!);
        if (lesson.bunny_video_id === link.bunnyVideoId) continue;
        await DB.Lessons.update({
          bunny_video_id: link.bunnyVideoId,
          video_guid: link.bunnyVideoId,
          bunny_url: bunnyService.getStreamUrl(link.bunnyVideoId),
          transcoding_status: 'processing',
        }, {
          where: { id: link.lessonId },
          transaction,
        });
      }

      await transaction.commit();
      return res.status(201).json({
        success: true,
        linked: links.length,
        created: createdLessons,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error('Error applying filename-based Bunny links:', error);
    const statusCode = typeof error?.statusCode === 'number' ? error.statusCode : 500;
    return res.status(statusCode).json({ error: error.message });
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

// Create a lesson from an unmapped Bunny video and link it to the selected hierarchy.
router.post('/link-bunny-video', async (req: Request, res: Response) => {
  try {
    const bunnyVideoId = typeof req.body?.bunnyVideoId === 'string'
      ? req.body.bunnyVideoId.trim()
      : '';
    const levelId = Number(req.body?.levelId);
    const gradeId = Number(req.body?.gradeId);
    const areaId = Number(req.body?.areaId);
    const topicId = Number(req.body?.topicId);
    const subtopicId = req.body?.subtopicId ? Number(req.body.subtopicId) : null;

    if (
      !bunnyVideoId ||
      ![levelId, gradeId, areaId, topicId].every((id) => Number.isInteger(id) && id > 0) ||
      (subtopicId !== null && (!Number.isInteger(subtopicId) || subtopicId <= 0))
    ) {
      return res.status(400).json({
        error: 'Bunny video, level, grade, learning area, and topic are required; subtopic is optional',
      });
    }

    const video = await bunnyService.getStreamVideo(bunnyVideoId);
    if (video.guid !== bunnyVideoId || !video.title || video.title === 'Untitled') {
      return res.status(400).json({ error: 'Bunny video has no usable title for creating a lesson' });
    }

    const [level, grade, area, topic, subtopic, existingLesson] = await Promise.all([
      DB.LearningLevels.findByPk(levelId),
      DB.Grades.findByPk(gradeId),
      DB.LearningAreas.findByPk(areaId),
      DB.Topics.findByPk(topicId),
      subtopicId ? DB.Subtopics.findByPk(subtopicId) : Promise.resolve(null),
      DB.Lessons.findOne({ where: { bunny_video_id: bunnyVideoId } }),
    ]);

    if (existingLesson) {
      return res.status(409).json({
        error: `This Bunny video is already linked to lesson #${existingLesson.id}: ${existingLesson.title}`,
        lessonId: existingLesson.id,
      });
    }
    if (!level || !grade || !area || !topic) {
      return res.status(400).json({ error: 'One or more selected hierarchy records no longer exist' });
    }
    if (Number(grade.level_id) !== levelId) {
      return res.status(400).json({ error: `Grade "${grade.name}" is not assigned to level "${level.name}"` });
    }
    if (Number(area.grade_id) !== gradeId) {
      return res.status(400).json({ error: `Learning area "${area.name}" is not assigned to grade "${grade.name}"` });
    }
    if (Number(topic.area_id) !== areaId) {
      return res.status(400).json({ error: `Topic "${topic.name}" is not assigned to learning area "${area.name}"` });
    }
    if (subtopicId && (!subtopic || Number(subtopic.topic_id) !== topicId)) {
      return res.status(400).json({
        error: subtopic
          ? `Subtopic "${subtopic.name}" is not assigned to topic "${topic.name}"`
          : 'Selected subtopic no longer exists',
      });
    }

    const parsedFilename = parseLessonFilename(video.title);
    const lessonTitle = parsedFilename?.subtopic || video.title.replace(/\.[^/.]+$/, '').trim();
    if (!lessonTitle) {
      return res.status(400).json({ error: 'Bunny video title is empty after removing its file extension' });
    }

    const lesson = await DB.Lessons.create({
      title: lessonTitle,
      description: video.description || '',
      area_id: areaId,
      topic_id: topicId,
      subtopic_id: subtopicId,
      bunny_video_id: bunnyVideoId,
      video_guid: bunnyVideoId,
      bunny_url: video.videoUrl || bunnyService.getStreamUrl(bunnyVideoId),
      thumbnail_url: video.thumbnailUrl || null,
      filename: video.title,
      transcoding_status: video.status,
      is_active: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Lesson created and Bunny video linked',
      lesson: {
        id: lesson.id,
        title: lesson.title,
        level: level.name,
        grade: grade.name,
        area: area.name,
        topic: topic.name,
        subtopic: subtopic?.name || '',
        bunny_video_id: bunnyVideoId,
        transcoding_status: video.status,
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

router.post('/reconcile', async (req: Request, res: Response) => {
  try {
    const dryRun = req.body?.dryRun !== false;
    const data = await bunnyReconciliationService.reconcile({ dryRun, force: false });
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error reconciling Bunny videos to lessons:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

router.get('/reconciliation-stats', async (_req: Request, res: Response) => {
  try {
    const data = await bunnyReconciliationService.getStats();
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching Bunny reconciliation statistics:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

router.post('/cleanup-orphaned', async (req: Request, res: Response) => {
  try {
    const dryRun = req.body?.dryRun !== false;
    const data = await bunnyReconciliationService.cleanupOrphaned({ dryRun });
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error cleaning orphaned Bunny references:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Map All - automatically map all Bunny videos to lessons using filename-based matching
router.post('/map-all', async (_req: Request, res: Response) => {
  try {
    const result = await bunnyReconciliationService.mapAllVideosToLessons();
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error mapping all Bunny videos:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;