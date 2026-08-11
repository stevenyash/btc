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
    this.config = {
      apiBaseUrl: process.env.B2H_API_BASE_URL || 'https://api.bitshustlehubs.co.ke/api',
      apiKey: process.env.B2H_API_KEY || '',
      webhookSecret: process.env.B2H_WEBHOOK_SECRET || '',
      platformId: process.env.B2H_PLATFORM_ID || 'your_b2h_platform_id_here',
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

  async setReferralRate(tier: string, action: string, rate: number): Promise<B2HResponse> {
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

  async sendConversionWebhook(
    referralCode: string,
    action: string,
    amount: number,
  ): Promise<B2HResponse> {
    if (!referralCode || referralCode === 'NULL' || referralCode === 'null') {
      console.log('[B2H] Skipping webhook - no referral code');
      return { success: false, message: 'No referral code provided' };
    }

    const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const payload: ConversionPayload = {
      referral_code: referralCode,
      action,
      platform_id: this.config.platformId,
      conversion_status: 'CONVERTED',
      amount,
      converted_at: now,
      timestamp: now,
    };

    const signature = this.signPayload(payload as unknown as Record<string, unknown>);

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
        payload,
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

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.webhookSecret) {
      console.error('[B2H] No webhook secret configured');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  isConfigured(): boolean {
    return !!(this.config.apiBaseUrl && this.config.apiKey && this.config.platformId);
  }
}

export const b2hService = new B2HIntegrationService();
export default b2hService;
