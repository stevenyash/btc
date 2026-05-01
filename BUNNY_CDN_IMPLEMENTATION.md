# Bunny CDN Advanced Token Authentication Implementation

## Overview

Implemented Advanced Token Authentication (HMAC-SHA256) for HLS video streaming using directory tokens. This provides secure, expiring URLs for lesson videos with automatic token inheritance for HLS segments.

## Changes Made

### Backend (`nodejs-express-api`)

#### 1. `services/bunnyService.ts`
- Added `generateAdvancedToken()` method implementing HMAC-SHA256 token generation
- Features: expiry, directory tokens (`token_path`), IP locking, geo-restrictions, speed limits, `ignore_params`
- Token format: `HS256-<base64url-hmac>`
- Deprecated old `generateBunnySecureToken()` (MD5-based) but kept for backward compatibility

#### 2. `controllers/lessons.ts` (`/lessons/stream-url/:recid`)
- Updated to use `generateAdvancedToken()` with `token_path` for HLS directory access
- Sets `ignoreParams: true` to allow flexible query parameters
- Optionally includes client IP for IP locking
- Returns tokenized URLs for both manifest and MP4 fallback

#### 3. `controllers/hlsController.ts` (`/hls/stream/:recid`)
- Updated to use `generateAdvancedToken()` with directory tokens
- Maintains compatibility with existing endpoint contract

#### 4. Environment Configuration
- Added `BUNNY_PULL_ZONE_SECURITY_KEY` to `.env.development` and `.env.production`
- Updated `.env.example` with proper Bunny CDN variables

### Frontend (`react-frontend`)

#### `src/pages/GoToClassPage.tsx`
- Existing HLS handling already compatible
- Manifest rewriting appends token query params to all segment URLs
- Works with new HS256 token format without changes

## Token Generation Details

```typescript
const token = bunnyService.generateAdvancedToken(
  `/${videoId}/playlist.m3u8`, // URL path for signature
  {
    expiresIn: 3600,                    // 1 hour expiry
    tokenPath: `/${videoId}/`,           // Directory token for HLS segments
    ignoreParams: true,                 // Ignore additional query params
    userIp: req.ip,                     // Optional: bind to client IP
  }
);
```

Result URL:
```
https://vz-8217e52e-f0d.b-cdn.net/{videoId}/playlist.m3u8?token=HS256-abc123&expires=1234567890&token_path=%2FvideoId%2F
```

## How It Works

1. **Token Generation (Backend)**
   - HMAC-SHA256 of `signaturePath + expires + sortedSigningData + userIp`
   - Uses Pull Zone Security Key as HMAC key
   - Base64URL-encodes result with `HS256-` prefix

2. **Request Flow**
   - User selects lesson → frontend calls `/lessons/stream-url/:id`
   - Backend validates access (subscription/purchase/guest)
   - Backend generates secured URL with advanced token
   - Frontend receives URL and loads via HLS.js (for HLS) or `<video>` (MP4)
   - HLS manifest is rewritten to append token to all segment URLs

3. **CDN Validation**
   - Bunny CDN receives request with token query parameters
   - Recomputes HMAC using security key, request path, and parameters
   - Validates expiry, token_path (directory access), and optional IP/country
   - Serves content if valid

## Security Features Enabled

- ✅ Expiring URLs (default 1 hour)
- ✅ Directory tokens (HLS segment inheritance)
- ✅ Optional IP locking (per-user)
- ✅ Optional geo-restrictions (ready in service)
- ✅ Speed limiting (ready in service)
- ✅ Query parameter flexibility (`ignore_params`)

## Testing

- Build backend: `cd nodejs-express-api && npm run build` ✅
- Build frontend: `cd react-frontend && npm run build` ✅
- Both compile without errors

## Environment Variables Required

```bash
# In .env, .env.development, .env.production
BUNNY_PULL_ZONE_SECURITY_KEY=<your-pull-zone-security-key>
BUNNY_PULL_ZONE=https://vz-8217e52e-f0d.b-cdn.net
```

## Notes

- Deprecated `generateBunnySecureToken()` may be removed in future
- HLS manifest rewriting is retained as a safeguard (ensures token on all URLs)
- For encrypted HLS streams, rewrite logic would need to handle `#EXT-X-KEY` URIs (not currently needed)

## Next Steps (Optional Improvements)

- Implement path-based token embedding (`bcdn_token` in URL path) for stronger HLS inheritance
- Add geo-restriction configuration per lesson or user region
- Add rate limiting per token
- Monitor JA4 fingerprints via `CDN-JA4` header at origin for bot detection

---

**Implementation complete. Ready for integration testing.**
