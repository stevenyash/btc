import crypto from 'crypto';
import axios from 'axios';

interface B2HConfig {
  apiBaseUrl: string;
  apiKey: string;
  webhookSecret: string;
  platformId: string;
}

interface ConversionPayload {
  referral_code: string;
  action: string;
  platform_id: string;
  event_id: string;
  external_user_id: string;
  phone: string;
  phone_verified: boolean;
  conversion_status: 'CONVERTED';
  amount: number;
  converted_at: string;
  timestamp: string;
}

interface B2HResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

export class B2HIntegrationService {
  private config: B2HConfig;

  constructor() {
    const apiBaseUrl = process.env.NODE_ENV === 'production'
      ? process.env.B2H_API_BASE_URL || 'https://api.bitshustlehubs.co.ke/api'
      : process.env.B2H_DEV_API_BASE_URL || '';
    this.config = {
      apiBaseUrl: apiBaseUrl.replace(/\/+$/, ''),
      apiKey: process.env.B2H_API_KEY || '',
      webhookSecret: process.env.B2H_WEBHOOK_SECRET || '',
      platformId: process.env.B2H_PLATFORM_ID || '',
    };

    console.log('[B2H] Integration config initialized:', {
      apiBaseUrl: this.config.apiBaseUrl,
      platformId: this.config.platformId,
      hasApiKey: !!this.config.apiKey,
      hasWebhookSecret: !!this.config.webhookSecret,
    });
  }

  signPayload(payload: Record<string, unknown>): string {
    const sortedKeys = Object.keys(payload).sort();
    const sortedPayload: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      sortedPayload[key] = payload[key];
    }
    const payloadStr = JSON.stringify(sortedPayload);
    return crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payloadStr)
      .digest('hex');
  }

  async registerAction(name: string, displayName: string, description = ''): Promise<B2HResponse> {
    try {
      console.log('[B2H] Registering action:', {
        name,
        displayName,
        apiBaseUrl: this.config.apiBaseUrl,
        platformId: this.config.platformId,
      });

      const response = await axios.post(
        `${this.config.apiBaseUrl}/platform-actions/register`,
        { name, display_name: displayName, description },
        {
          headers: {
            'X-API-Key': this.config.apiKey,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[B2H] Failed to register action:', message);
      throw error;
    }
  }

  async setReferralRate(
    tier: string,
    action: string,
    rate: number,
    isPercentage = false,
  ): Promise<B2HResponse> {
    try {
      console.log('[B2H] Setting referral rate:', {
        tier,
        action,
        rate,
        apiBaseUrl: this.config.apiBaseUrl,
        platformId: this.config.platformId,
      });

      const response = await axios.post(
        `${this.config.apiBaseUrl}/referral-rates`,
        {
          platform_id: this.config.platformId,
          tier,
          action,
          rate,
          is_percentage: isPercentage,
        },
        {
          headers: {
            'X-API-Key': this.config.apiKey,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[B2H] Failed to set referral rate:', message);
      throw error;
    }
  }

  async setWebhookUrl(webhookUrl: string): Promise<B2HResponse> {
    const response = await axios.put(
      `${this.config.apiBaseUrl}/platforms/me/webhook-url`,
      { webhook_url: webhookUrl },
      {
        headers: {
          'X-API-Key': this.config.apiKey,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  }

  async sendConversionWebhook(
    referralCode: string,
    action: string,
    amount: number,
    eventId: string,
    externalUserId: string,
    phone: string,
  ): Promise<B2HResponse> {
    if (!referralCode || referralCode === 'NULL' || referralCode === 'null') {
      console.log('[B2H] Skipping webhook - no referral code');
      return { success: false, message: 'No referral code provided' };
    }
    if (!this.config.webhookSecret || !this.config.platformId) {
      throw new Error('B2H webhook secret and platform ID must be configured');
    }

    const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const payload: ConversionPayload = {
      referral_code: referralCode,
      action,
      platform_id: this.config.platformId,
      event_id: eventId,
      external_user_id: externalUserId,
      phone,
      phone_verified: true,
      conversion_status: 'CONVERTED',
      amount,
      converted_at: now,
      timestamp: now,
    };

    const body = JSON.stringify(
      Object.fromEntries(Object.keys(payload).sort().map((key) => [key, payload[key as keyof ConversionPayload]])),
    );
    const signature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(body)
      .digest('hex');

    console.log('[B2H] Sending conversion webhook:', {
      referralCode,
      action,
      amount,
      apiBaseUrl: this.config.apiBaseUrl,
      platformId: this.config.platformId,
      timestamp: now,
    });

    try {
      const response = await axios.post(
        `${this.config.apiBaseUrl}/webhooks/external-conversion`,
        body,
        {
          headers: {
            'X-Webhook-Signature': signature,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      console.log(
        `[B2H] Conversion webhook sent: action=${action}, referral=${referralCode}`,
      );
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[B2H] Failed to send conversion webhook:', message);
      if (axios.isAxiosError(error)) {
        console.error('[B2H] Response:', error.response?.data);
      }
      throw error;
    }
  }

  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
    if (!this.config.webhookSecret) {
      console.error('[B2H] No webhook secret configured');
      return false;
    }
    if (!/^[a-f0-9]{64}$/i.test(signature)) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    );
  }

  isExpectedPlatform(platformId: string): boolean {
    return !!this.config.platformId && platformId === this.config.platformId;
  }

  isConfigured(): boolean {
    return !!(
      this.config.apiBaseUrl &&
      this.config.apiKey &&
      this.config.webhookSecret &&
      this.config.platformId
    );
  }
}

export const b2hService = new B2HIntegrationService();
export default b2hService;
