import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import validateFormData from '../helpers/validate_form.js';
import DB from '../models/db.js';
import uploader from '../helpers/uploader.js';
import BunnyHelper from '../helpers/bunnyHelper.js';
import bunnyService from '../services/bunnyService.js';
import bunnyConfig from '../config/bunny.js';
import { validateLessonAccess, canStreamLesson } from '../middleware/validateLessonAccess.js';
import { streamLimiter, generalLimiter, uploadLimiter } from '../middleware/rateLimiters.js';
import jwt from 'jsonwebtoken';
import utils from '../helpers/utils.js';
import {
  LessonAccessLimitError,
  heartbeatSubscriberDevice,
  recordSubscriberWatchTime,
  releaseSubscriberDevice,
} from '../services/classAccessService.js';

const router = Router();

// Log video access endpoint
router.post('/log-access/:recid', async (req: Request, res: Response) => {
    try {
      const { recid } = req.params;
      const { watch_time, completion_percentage } = req.body;
      const userId = req.user?.id?.toString() || req.body.user_id || 'guest';

      // Note: logAccess method is specific to bunnyService and not abstracted in BunnyHelper
      // Keeping direct call for this specialized logging functionality
      bunnyService.logAccess({
        videoKey: `lesson_${recid}`,
        userId,
        lessonId: String(recid),
        action: 'stream',
        timestamp: new Date().toISOString(),
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
      });

      // Update lesson access log with watch time if provided
      if (watch_time !== undefined) {
        await DB.LessonAccessLogs.update(
          {
            watch_time,
            completion_percentage,
            status: completion_percentage >= 100 ? 'completed' : 'active',
            completed_at: completion_percentage >= 100 ? new Date() : null,
          },
          {
            where: {
              lesson_id: recid,
              status: 'active',
            },
            order: [['accessed_at', 'DESC']],
            limit: 1,
          }
        );
      }

      return res.json({ success: true });
    } catch (error: any) {
      console.error('Error logging access:', error);
      return res.status(500).json({ error: error.message });
    }
  });

// Update subscriber lesson balance (decrement based on watch time)
router.post('/update-balance', async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (req.isAdmin || req.isSuperadmin) {
        return res.json({ success: true, unmetered: true });
      }

      const { lessonId, watchTimeSeconds, deviceId } = req.body;

      if (!Number.isInteger(Number(lessonId)) || Number(lessonId) <= 0 ||
          !Number.isFinite(Number(watchTimeSeconds)) || Number(watchTimeSeconds) <= 0 ||
          Number(watchTimeSeconds) > 300 ||
          typeof deviceId !== 'string' || !/^[a-zA-Z0-9_-]{16,128}$/.test(deviceId)) {
        return res.status(400).json({ error: 'Valid lessonId, deviceId, and watchTimeSeconds (1-300) are required' });
      }

      const result = await recordSubscriberWatchTime(
        Number(req.user.id),
        Number(lessonId),
        Math.floor(Number(watchTimeSeconds)),
        deviceId
      );

      return res.json({
        success: true,
        remaining_watch_time_seconds: result.remainingWatchTimeSeconds,
        lessons_used: result.lessonsUsed,
        total_lessons: result.totalLessons,
        exhausted: result.remainingWatchTimeSeconds <= 0,
      });
    } catch (error: any) {
      if (error instanceof LessonAccessLimitError) {
        return res.status(403).json({ error: error.message, code: error.code, details: error.details });
      }
      console.error('Error updating lesson balance:', error);
      return res.status(500).json({ error: error.message });
    }
  });

router.get('/access/:recid', validateLessonAccess, (req: Request, res: Response) => {
  const access = (req as any).lessonAccess;
  return res.json({
    success: true,
    access_mode: access?.accessMode || 'preview',
    remaining_watch_time_seconds: access?.maxWatchTime ?? null,
    lesson_track_id: access?.lessonTrackId ?? null,
  });
});

router.delete('/device-session', async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const deviceId = req.body?.device_id;
  if (typeof deviceId !== 'string' || !/^[a-zA-Z0-9_-]{16,128}$/.test(deviceId)) {
    return res.status(400).json({ error: 'Valid device_id is required' });
  }
  try {
    await releaseSubscriberDevice(Number(req.user.id), deviceId);
    return res.json({ success: true });
  } catch (error) {
    console.error('Failed to release playback device:', error);
    return res.status(500).json({ error: 'Failed to release playback device' });
  }
});

router.post('/device-session/heartbeat', async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const { device_id: deviceId, lesson_id: lessonId } = req.body || {};
  if (typeof deviceId !== 'string' || !/^[a-zA-Z0-9_-]{16,128}$/.test(deviceId) ||
      !Number.isInteger(Number(lessonId)) || Number(lessonId) <= 0) {
    return res.status(400).json({ error: 'Valid device_id and lesson_id are required' });
  }
  try {
    await heartbeatSubscriberDevice(Number(req.user.id), deviceId, Number(lessonId));
    return res.json({ success: true });
  } catch (error) {
    if (error instanceof LessonAccessLimitError) {
      return res.status(403).json({ error: error.message, code: error.code, details: error.details });
    }
    console.error('Failed to refresh playback device session:', error);
    return res.status(500).json({ error: 'Failed to refresh playback device session' });
  }
});

router.use(generalLimiter);

async function beforeAdd(postdata: any, req: any) {
  console.log('Before add - preparing lesson data:', postdata);

  if (postdata.topic_id) {
    const topic = await DB.Topics.findOne({
      where: { topic_id: postdata.topic_id },
      raw: true
    });
    if (!topic) {
      throw new Error('Invalid topic ID');
    }
  }

  if (postdata.subtopic_id) {
    const subtopic = await DB.Subtopics.findOne({
      where: { subtopic_id: postdata.subtopic_id },
      raw: true
    });
    if (!subtopic) {
      throw new Error('Invalid subtopic ID');
    }
  }
}

async function afterAdd(record: any, req: any) {
   try {
     console.log('Starting afterAdd - lesson:', record.id);
     if (record.file) {
      const uploadResult = await BunnyHelper.handleVideoUpload(
        record.file,
        {
          title: record.title || 'Untitled Lesson',
          useStream: true,
        },
        (filePath) => uploader.deleteRecordFiles(filePath, 'file')
      );

      const updateData: any = {
        storage_path: uploadResult.data.storagePath,
        bunny_url: uploadResult.data.url,
        file_size: uploadResult.data.size,
      };

      if (uploadResult.data.videoId) {
        updateData.bunny_video_id = uploadResult.data.videoId;
        updateData.transcoding_status = uploadResult.data.status || 'processing';
      }

      await DB.Lessons.update(updateData, { where: { id: record.id } });
     }
   } catch (error: any) {
     console.error('Error in afterAdd:', error.message);
   }
 }

router.get(['/', '/index/:fieldname?/:fieldvalue?'], async (req: Request, res: Response) => {
  try {
    const query: any = {};
    const queryFilters: any[] = [];
    const where: any = {};
    const replacements: any = {};

    const fieldName = req.params.fieldname;
    const fieldValue = req.params.fieldvalue;

    if (fieldName) {
      queryFilters.push(DB.filterBy(fieldName, fieldValue));
    }

    const search = req.query.search;
    if (search) {
      const searchFields = DB.Lessons.searchFields();
      where[DB.op.or] = searchFields;
      replacements.search = `%${search}%`;
    }

    if (queryFilters.length) {
      where[DB.op.and] = queryFilters;
    }

    query.raw = true;
    query.where = where;
    query.replacements = replacements;
    query.order = DB.getOrderBy(req, 'id', 'desc');
    query.attributes = DB.Lessons.listFields();

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await DB.Lessons.paginate(query, page, limit);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/view/:recid', async (req: Request, res: Response) => {
   try {
     const recid = req.params.recid || null;
     const query: any = {};
     const where: any = {};

     where['id'] = recid;
     query.raw = false;
     query.where = where;
     query.attributes = DB.Lessons.viewFields();

     const record: any = await DB.Lessons.findOne(query);
     if (!record) {
       return res.status(404).json({ error: "Record not found" });
     }

     const recordData = record.toJSON();
     const videoId = recordData.bunny_video_id;

     if (videoId) {
       const videoResult = BunnyHelper.getSecureVideoUrl(videoId, {}, false);
       const hlsResult = BunnyHelper.getSecureVideoUrl(videoId, {}, true);
       recordData.video_url = videoResult.url;
       recordData.hls_url = hlsResult.url;
     }

     return res.json(recordData);
   } catch (err) {
     return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
   }
 });

router.get('/stream-url/:recid', streamLimiter, validateLessonAccess, async (req: Request, res: Response, next: NextFunction) => {
   try {
     console.log('[DEBUG] /stream-url handler - req.user:', (req as any).user, 'lessonAccess:', (req as any).lessonAccess);
     
     res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
     res.setHeader('Pragma', 'no-cache');
     res.setHeader('Expires', '0');

     const recid = req.params.recid;
     const { expiresIn = 3600 } = req.query;

     const record: any = await DB.Lessons.findOne({
       where: { id: recid },
       include: [
         { model: DB.LearningAreas, as: 'learning_area', attributes: ['id', 'name'] },
         { model: DB.Topics, as: 'topic', attributes: ['topic_id', 'name'] },
         { model: DB.Subtopics, as: 'subtopic', attributes: ['subtopic_id', 'name'] }
       ]
     });

     if (!record) {
       return res.status(404).json({ error: 'Lesson not found' });
     }

     const recordData = record.toJSON();
     const videoId = recordData.bunny_video_id;
     if (!videoId || recordData.transcoding_status !== 'completed') {
       return res.status(409).json({
         success: false,
         error: 'Lesson is not synced and ready in Bunny yet',
         code: 'BUNNY_VIDEO_NOT_SYNCED',
       });
     }

      const user_id = req.user?.id?.toString() || req.query.user_id || 'guest';
      const expiresInNum = parseInt(expiresIn as string);
      // Extract client IP, but skip IP binding for localhost/private IPs
      const rawClientIp = req.ip || req.socket.remoteAddress || undefined;
      // Only use IP for token if it's a public IP (not localhost/private)
      const isLocalOrPrivate = rawClientIp === '::1' || 
                               rawClientIp === '127.0.0.1' ||
                               rawClientIp?.startsWith('192.168.') ||
                               rawClientIp?.startsWith('10.') ||
                               rawClientIp?.startsWith('172.');
      const clientIp = isLocalOrPrivate ? undefined : rawClientIp;

let videoUrl: string;
      let isHls = false;
      let hlsUrl: string | null = null;

      if (videoId) {
        let playData;
        try {
          playData = await bunnyService.getVideoPlayData(videoId, expiresInNum);
        } catch (bunnyError: any) {
          console.error('[ERROR] Failed to retrieve Bunny playback data:', {
            lessonId: recid,
            videoId,
            error: bunnyError instanceof Error ? bunnyError.message : String(bunnyError),
          });
          return res.status(502).json({
            success: false,
            error: 'Unable to retrieve Bunny playback data',
            code: 'BUNNY_PLAYBACK_DATA_UNAVAILABLE',
          });
        }

        if (!playData.isPlayable) {
          return res.status(503).json({
            success: false,
            error: 'Bunny video is not playable yet',
            code: 'BUNNY_VIDEO_NOT_PLAYABLE',
          });
        }

        const playbackUrl = playData.isPlaylistPlayable && playData.videoPlaylistUrl
          ? playData.videoPlaylistUrl
          : playData.originalUrl;
        if (!playbackUrl) {
          return res.status(503).json({
            success: false,
            error: 'Bunny did not provide a playable video URL',
            code: 'BUNNY_PLAYBACK_URL_MISSING',
          });
        }

        const signedUrl = new URL(playbackUrl);
        if (playData.tokenAuthEnabled) {
          if (!bunnyConfig.pullZoneSecurityKey) {
            return res.status(503).json({ error: 'Bunny CDN token authentication is enabled but its security key is not configured' });
          }

          const tokenPath = `/${videoId}/`;
          const tokenQuery = bunnyService.generateAdvancedToken(tokenPath, {
            expiresIn: expiresInNum,
            tokenPath,
            ignoreParams: true,
            userIp: clientIp,
          });
          new URLSearchParams(tokenQuery).forEach((value, key) => {
            signedUrl.searchParams.set(key, value);
          });
        }

        videoUrl = signedUrl.toString();
        isHls = playbackUrl === playData.videoPlaylistUrl;
        hlsUrl = isHls ? videoUrl : null;
        console.log('[DEBUG] Bunny playback data resolved:', {
          videoId,
          isPlayable: playData.isPlayable,
          isPlaylistPlayable: playData.isPlaylistPlayable,
          tokenAuthEnabled: playData.tokenAuthEnabled,
          isHls,
        });
      }

      const lessonAccess = (req as any).lessonAccess;
      const lesson_balance = lessonAccess?.maxWatchTime;

      console.log('[DEBUG] Returning stream response - URL generated:', Boolean(videoUrl), 'is_hls:', isHls, 'lesson_balance:', lesson_balance);

      return res.json({
        success: true,
        video_url: videoUrl,
        is_hls: isHls,
        hls_url: videoId ? hlsUrl : null,
        thumbnail_url: recordData.thumbnail_url,
        title: recordData.title,
        duration: recordData.duration,
        area: recordData.learning_area?.name,
        topic: recordData.topic?.name,
        subtopic: recordData.subtopic?.name,
        expires_in: expiresInNum,
        lesson_balance,
        remaining_watch_time_seconds: lesson_balance,
        access_mode: lessonAccess?.accessMode || 'preview',
      });
   } catch (err) {
     console.error('Error in stream-url:', err);
     return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
   }
 });

router.post('/edit/:recid', [
  body('title').optional({ nullable: true, checkFalsy: true }),
  body('file').optional({ nullable: true, checkFalsy: true }),
  body('is_preview_available').optional({ nullable: true, checkFalsy: true }),
  body('description').optional({ nullable: true, checkFalsy: true }),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid;
    const modeldata = (req as any).getValidFormData({ includeOptionals: true });

     if (modeldata.file !== undefined) {
       const fileInfo = uploader.moveUploadedFiles(modeldata.file, 'file');
       modeldata.file = fileInfo.filepath;
       modeldata.filename = fileInfo.filename;

       const uploadResult = await BunnyHelper.handleVideoUpload(
         modeldata.file,
         {
           title: modeldata.title || 'Untitled Lesson',
           useStream: true,
         },
         (filePath) => uploader.deleteRecordFiles(filePath, 'file')
       );

        if (uploadResult.success) {
          modeldata.storage_path = uploadResult.data.storagePath;
          modeldata.bunny_url = uploadResult.data.url;
          modeldata.file_size = uploadResult.data.size;

          if (uploadResult.data.videoId) {
            modeldata.bunny_video_id = uploadResult.data.videoId;
            modeldata.transcoding_status = uploadResult.data.status || 'processing';
          }
        } else {
          throw new Error('Failed to upload video');
        }

       const oldRecord = await DB.Lessons.findOne({ where: { id: recid } });
       if (oldRecord) {
         try {
           await BunnyHelper.handleVideoDeletion(
             oldRecord.bunny_video_id,
             oldRecord.storage_path
           );
         } catch (deleteError: any) {
           console.warn('Could not delete old video:', deleteError.message);
         }
       }
     }

    const where: any = { id: recid };
    await DB.Lessons.update(modeldata, { where });
    
    const query: any = { raw: false, where, attributes: DB.Lessons.editFields() };
    const record = await DB.Lessons.findOne(query);
    
    return res.json(record?.toJSON());
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/delete/:recid', async (req: Request, res: Response) => {
  try {
    const recid = utils.asString(req.params.recid).split(',');
    const query: any = {};
    const where: any = { id: recid };
    query.raw = false;
    query.where = where;

    const records: any[] = await DB.Lessons.findAll(query);

     for (const record of records) {
       const recordData = record.toJSON();
       if (recordData.bunny_video_id || recordData.storage_path) {
         try {
           await BunnyHelper.handleVideoDeletion(
             recordData.bunny_video_id,
             recordData.storage_path
           );
         } catch (err: any) {
           console.error('Error deleting video:', err.message);
         }
       }
       uploader.deleteRecordFiles(recordData.file, 'file');
     }

    await DB.Lessons.destroy(query);
    return res.json(recid);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
