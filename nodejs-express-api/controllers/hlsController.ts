import { Router, Request, Response } from 'express';
import DB from '../models/db.js';
import BunnyHelper from '../helpers/bunnyHelper.js';
import bunnyConfig from '../config/bunny.js';

const router = Router();

/**
 * Get video manifest URLs (HLS, MP4, thumbnail)
 * @route GET /manifest/:videoId
 */
router.get('/manifest/:videoId', async (req: Request, res: Response) => {
  try {
    const videoId = String(req.params.videoId);

    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    const hlsUrl = BunnyHelper.getSecureVideoUrl(videoId, {}, true).url;
    const mp4Url = BunnyHelper.getSecureVideoUrl(videoId, {}, false).url;
    const thumbnailUrl = `${bunnyConfig.pullZoneBaseUrl}/${videoId}/thumbnail/0`;

    res.json({
      success: true,
      video_id: videoId,
      hls_url: hlsUrl,
      mp4_url: mp4Url,
      thumbnail_url: thumbnailUrl,
      expiresAt: Date.now() + 3600000
    });
  } catch (error: any) {
    console.error('Manifest error:', error);
    res.status(500).json({
      error: 'Failed to get video manifest',
      message: error.message
    });
  }
});

/**
 * Get secure stream URL for lesson
 * @route GET /stream/:recid
 */
router.get('/stream/:recid', async (req: Request, res: Response) => {
  try {
    const recid = parseInt(String(req.params.recid), 10);
    if (isNaN(recid)) {
      return res.status(400).json({ error: 'Invalid lesson ID' });
    }
    const { expiresIn = 3600 } = req.query;

    const record: any = await DB.Lessons.findOne({
      where: { id: recid },
      raw: true,
    });

    if (!record) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const videoId = record.bunny_video_id;
    const storagePath = record.storage_path || record.s3_key;

    if (!videoId && !storagePath) {
      return res.status(400).json({ error: 'Video not available' });
    }

     const expiresInNum = parseInt(expiresIn as string, 10);
     // Extract client IP, but skip IP binding for localhost/private IPs
     const rawClientIp = req.ip || req.socket.remoteAddress || undefined;
     const isLocalOrPrivate = rawClientIp === '::1' || 
                              rawClientIp === '127.0.0.1' ||
                              rawClientIp?.startsWith('192.168.') ||
                              rawClientIp?.startsWith('10.') ||
                              rawClientIp?.startsWith('172.');
     const clientIp = isLocalOrPrivate ? undefined : rawClientIp;

    let videoUrl: string;
    let hlsUrl: string | null = null;

    if (videoId) {
      // Get secure HLS URL with directory token for segment inheritance
      const hlsResult = BunnyHelper.getSecureVideoUrl(videoId, {
        expiresIn: expiresInNum,
        userIp: clientIp
      }, true);
      
      videoUrl = hlsResult.url;
      hlsUrl = hlsResult.hlsUrl;
    } else {
      // Storage-based video
      const storageResult = BunnyHelper.getSecureStorageUrl(storagePath, {
        expiresIn: expiresInNum
      });
      
      videoUrl = storageResult.url;
    }

    res.json({
      success: true,
      video_id: videoId,
      video_url: videoUrl,
      hls_url: hlsUrl,
      thumbnail_url: videoId ? `${bunnyConfig.pullZoneBaseUrl}/${videoId}/thumbnail/0` : record.thumbnail_url,
      expiresAt: Date.now() + (expiresInNum * 1000),
    });
  } catch (error: any) {
    console.error('Stream error:', error);
    res.status(500).json({
      error: 'Failed to generate stream URL',
      message: error.message
    });
  }
});

export default router;