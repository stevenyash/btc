import b2hService from '../services/b2hIntegrationService.ts';

// Test the B2H integration service
async function testWebhook() {
  console.log('[B2H Test] Testing webhook call...');
  console.log('[B2H Test] Service configured:', b2hService.isConfigured());

  // Test with a sample referral code and amount
  const testReferralCode = 'TEST_REFERRAL_123';
  const testAction = 'SUBSCRIPTION_PURCHASE';
  const testAmount = 1500;

  try {
    const result = await b2hService.sendConversionWebhook(
      testReferralCode,
      testAction,
      testAmount
    );
    console.log('[B2H Test] Webhook result:', result);
  } catch (error) {
    console.error('[B2H Test] Webhook failed:', error);
  }
}

// Run test
testWebhook().catch(console.error);