import express, { Request, Response } from 'express';
import { b2hService } from '../services/b2hIntegrationService.js';
import DB from '../models/db.js';

const B2HWebhookController = express.Router();

B2HWebhookController.post('/conversion-confirm', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['x-webhook-signature'] as string;

    if (!signature) {
      res.status(401).json({ success: false, error: 'Missing signature' });
      return;
    }

    const isValid = b2hService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      res.status(401).json({ success: false, error: 'Invalid signature' });
      return;
    }

    const { referral_code, action, platform_id, conversion_status, converted_at, metadata } = req.body;

    if (!referral_code || !action || !platform_id || !conversion_status) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    console.log(`[B2H] Conversion confirmation received:`, {
      referral_code,
      action,
      platform_id,
      conversion_status,
      converted_at,
    });

    await DB.B2HConversionLogs.create({
      referral_code,
      action,
      platform_id,
      conversion_status,
      converted_at: new Date(converted_at),
      metadata: metadata || null,
      raw_payload: rawBody,
      status: 'processed',
    });

    res.json({ success: true, message: 'Conversion logged' });
  } catch (error) {
    console.error('[B2H] Conversion webhook error:', error);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

export default B2HWebhookController;
