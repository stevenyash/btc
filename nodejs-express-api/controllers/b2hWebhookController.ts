import express, { Request, Response } from 'express';
import { b2hService } from '../services/b2hIntegrationService.js';
import DB from '../models/db.js';

const B2HWebhookController = express.Router();

B2HWebhookController.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    const signature = req.get('X-B2H-Signature') || '';
    const eventHeader = req.get('X-B2H-Event') || '';

    if (!rawBody || !signature || !eventHeader) {
      res.status(401).json({ success: false, message: 'Missing raw body or B2H webhook headers' });
      return;
    }

    const isValid = b2hService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Invalid signature' });
      return;
    }

    const event = req.body as {
      event_type?: unknown;
      platform_id?: unknown;
      timestamp?: unknown;
      data?: unknown;
    };
    if (
      !event ||
      typeof event !== 'object' ||
      typeof event.event_type !== 'string' ||
      event.event_type !== eventHeader ||
      typeof event.platform_id !== 'string' ||
      typeof event.timestamp !== 'string' ||
      !event.data ||
      typeof event.data !== 'object'
    ) {
      res.status(400).json({ success: false, message: 'Invalid webhook event payload' });
      return;
    }

    if (!['action.approved', 'commission.paid'].includes(event.event_type)) {
      res.status(400).json({ success: false, message: 'Unsupported webhook event' });
      return;
    }

    const eventData = event.data as Record<string, unknown>;
    if (
      (event.event_type === 'action.approved' && typeof eventData.name !== 'string') ||
      (event.event_type === 'commission.paid' &&
        (typeof eventData.referral_id !== 'string' ||
          typeof eventData.amount !== 'number' ||
          !Number.isFinite(eventData.amount) ||
          typeof eventData.currency !== 'string'))
    ) {
      res.status(400).json({ success: false, message: 'Invalid webhook event data' });
      return;
    }

    const eventTimestamp = Date.parse(event.timestamp);
    if (!Number.isFinite(eventTimestamp) || Math.abs(Date.now() - eventTimestamp) > 5 * 60 * 1000) {
      res.status(401).json({ success: false, message: 'Webhook timestamp is outside the allowed window' });
      return;
    }

    if (!b2hService.isExpectedPlatform(event.platform_id)) {
      res.status(403).json({ success: false, message: 'Webhook platform does not match configuration' });
      return;
    }

    await DB.B2HWebhookEvents.create({
      event_type: event.event_type,
      platform_id: event.platform_id,
      event_timestamp: new Date(eventTimestamp),
      payload: eventData,
      raw_payload: rawBody.toString('utf8'),
    });

    if (event.event_type === 'action.approved') {
      console.log(`[B2H] Action approved: ${eventData.name}`);
    } else {
      console.log('[B2H] Commission paid:', {
        referral_id: eventData.referral_id,
        amount: eventData.amount,
        currency: eventData.currency,
      });
    }
    res.json({ success: true, message: 'Webhook event received' });
  } catch (error) {
    console.error('[B2H] Conversion webhook error:', error);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

export default B2HWebhookController;
