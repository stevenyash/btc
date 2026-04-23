import { Router, Request, Response } from 'express';
import bunnyVideoDelivery from '../services/bunnyVideoDelivery.js';

const router = Router();

router.get('/manifest/:outputPrefix', async (req: Request, res: Response) => {
  try {
    const { outputPrefix } = req.params;
    
    if (!outputPrefix) {
      return res.status(400).json({ error: 'outputPrefix is required' });
    }

    const manifestUrl = bunnyVideoDelivery.getPublicHLSManifestUrl(outputPrefix);
    const mp4Url = bunnyVideoDelivery.getPublicMP4Url(`${outputPrefix}.mp4`);

    res.json({
      success: true,
      hls_url: manifestUrl,
      mp4_url: mp4Url,
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

router.get('/stream/:recid', async (req: Request, res: Response) => {
  try {
    const { recid } = req.params;
    const { expiresIn = 3600 } = req.query;

    const secureData = bunnyVideoDelivery.generateSecureUrl(
      `lesson_${recid}.mp4`,
      req.user?.id?.toString() || 'guest',
      recid,
      {
        expiresIn: parseInt(expiresIn as string),
        disableDownload: true,
        maxPlays: 3
      }
    );

    res.json({
      success: true,
      video_url: secureData.signedUrl,
      expiresAt: secureData.expiresAt,
      security: secureData.security
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
