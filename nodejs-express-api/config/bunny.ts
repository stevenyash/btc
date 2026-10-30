/**
 * Bunny.net Configuration
 * Centralized configuration for Bunny Stream API
 */

export const bunnyConfig = {
  // Library access key (for API calls)
  apiKey: process.env.BUNNY_API_KEY || '',

  // Video library ID
  libraryId: process.env.BUNNY_VIDEO_LIBRARY_ID || '',

  // Stream embed token authentication key (separate from the API access key)
  streamTokenAuthKey: process.env.BUNNY_STREAM_TOKEN_AUTH_KEY || '',

  // Storage zone ID (for Bunny Storage operations)
  storageZoneId: process.env.BUNNY_STORAGE_ZONE_ID || '',

  // Stream API base URL
  streamBaseUrl: (process.env.BUNNY_STREAM_BASE_URL || 'https://video.bunnycdn.com').replace(/\/$/, ''),

  // Storage API base URL
  storageBaseUrl: (process.env.BUNNY_STORAGE_BASE_URL || 'https://storage.bunnycdn.com').replace(/\/$/, ''),

  // Pull zone base URL (for video playback)
  pullZoneBaseUrl: process.env.BUNNY_PULL_ZONE_BASE_URL || 'https://vz-8217e52e-f0d.b-cdn.net',

  // Security key for token generation (optional - required for secure URLs)
  pullZoneSecurityKey: process.env.BUNNY_PULL_ZONE_SECURITY_KEY || '',

  // Default token expiration (seconds)
  defaultTokenExpiry: 3600, // 1 hour

  // Default token settings
  tokenDefaults: {
    maxPlaysPerToken: 0, // 0 = unlimited
    allowCountryRestrictions: false,
  },
};

/**
 * Validate Bunny configuration
 */
export function validateBunnyConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!bunnyConfig.apiKey) {
    errors.push('BUNNY_API_KEY is required');
  }

  if (!bunnyConfig.libraryId) {
    errors.push('BUNNY_VIDEO_LIBRARY_ID is required');
  }

  // pullZoneSecurityKey is optional but needed for secure URLs
  if (!bunnyConfig.pullZoneSecurityKey) {
    errors.push('BUNNY_PULL_ZONE_SECURITY_KEY is recommended for secure video URLs');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default bunnyConfig;
