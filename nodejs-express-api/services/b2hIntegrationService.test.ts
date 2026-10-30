import crypto from 'crypto';
import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { B2HIntegrationService } from './b2hIntegrationService.js';

describe('B2HIntegrationService', () => {
  const originalEnvironment = {
    nodeEnv: process.env.NODE_ENV,
    apiBaseUrl: process.env.B2H_API_BASE_URL,
    devApiBaseUrl: process.env.B2H_DEV_API_BASE_URL,
    apiKey: process.env.B2H_API_KEY,
    webhookSecret: process.env.B2H_WEBHOOK_SECRET,
    platformId: process.env.B2H_PLATFORM_ID,
  };
  let service: B2HIntegrationService;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    process.env.B2H_API_BASE_URL = 'https://b2h.example/api/';
    delete process.env.B2H_DEV_API_BASE_URL;
    process.env.B2H_API_KEY = 'test-api-key';
    process.env.B2H_WEBHOOK_SECRET = 'test-webhook-secret';
    process.env.B2H_PLATFORM_ID = 'test-platform';
    service = new B2HIntegrationService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    for (const [key, value] of Object.entries({
      NODE_ENV: originalEnvironment.nodeEnv,
      B2H_API_BASE_URL: originalEnvironment.apiBaseUrl,
      B2H_DEV_API_BASE_URL: originalEnvironment.devApiBaseUrl,
      B2H_API_KEY: originalEnvironment.apiKey,
      B2H_WEBHOOK_SECRET: originalEnvironment.webhookSecret,
      B2H_PLATFORM_ID: originalEnvironment.platformId,
    })) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('sends and signs the same canonical conversion body', async () => {
    const post = jest.spyOn(axios, 'post').mockResolvedValue({
      data: { success: true },
    } as never);

    await service.sendConversionWebhook(
      'AMB123_REF',
      'SUBSCRIPTION_PURCHASE',
      1500,
      'payment-123',
      'user-456',
      '+254700000000',
    );

    const [url, body, config] = post.mock.calls[0];
    expect(url).toBe('https://b2h.example/api/webhooks/external-conversion');
    expect(typeof body).toBe('string');

    const serializedBody = body as string;
    const payload = JSON.parse(serializedBody) as Record<string, unknown>;
    expect(Object.keys(payload)).toEqual(Object.keys(payload).sort());
    expect(payload).toMatchObject({
      event_id: 'payment-123',
      external_user_id: 'user-456',
      phone: '+254700000000',
      phone_verified: true,
    });

    const expectedSignature = crypto
      .createHmac('sha256', 'test-webhook-secret')
      .update(serializedBody)
      .digest('hex');
    expect(config?.headers?.['X-Webhook-Signature']).toBe(expectedSignature);
  });

  it('rejects malformed webhook signatures without throwing', () => {
    expect(service.verifyWebhookSignature('body', 'invalid')).toBe(false);
    expect(service.verifyWebhookSignature('body', 'a'.repeat(63))).toBe(false);
  });

  it('does not use the production B2H endpoint outside production', () => {
    process.env.NODE_ENV = 'development';
    process.env.B2H_DEV_API_BASE_URL = '';
    service = new B2HIntegrationService();

    expect(service.isConfigured()).toBe(false);
  });
});
