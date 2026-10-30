import b2hService from '../services/b2hIntegrationService.ts';

const payload = {
  action: 'SUBSCRIPTION_PURCHASE',
  amount: 1500,
  conversion_status: 'CONVERTED',
  converted_at: '2026-06-05T06:00:00Z',
  event_id: 'local-signature-check',
  external_user_id: 'local-user',
  phone: '+254700000000',
  phone_verified: true,
  platform_id: 'local-platform',
  referral_code: 'LOCAL_TEST_ONLY',
  timestamp: '2026-06-05T06:00:00Z',
};
const body = JSON.stringify(
  Object.fromEntries(Object.keys(payload).sort().map((key) => [key, payload[key as keyof typeof payload]])),
);
const signature = b2hService.signPayload(payload);

if (!b2hService.verifyWebhookSignature(body, signature)) {
  throw new Error('B2H signature self-check failed');
}

console.log('[B2H Test] Local signature self-check passed; no request was sent.');