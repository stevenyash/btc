# Bunny.net Stream Integration Refactoring Todo List

## Phase 1: Analysis & Planning ✅ COMPLETED
- [x] Examine current Bunny.net implementation in existing files
  - Reviewed `nodejs-express-api/services/bunnyService.ts` (359 lines, manual fetch calls)
  - Reviewed `nodejs-express-api/helpers/bunnyHelper.ts` (350+ lines, wrapper utilities)
  - Reviewed `nodejs-express-api/controllers/bunnySyncController.ts` (sync queue management)
  - Reviewed `nodejs-express-api/controllers/bunnyUploadController.ts` (multer upload handling)
  - Reviewed `nodejs-express-api/controllers/bunnyMigrationController.ts` (S3 to Bunny migration)
  - Reviewed `nodejs-express-api/controllers/hlsController.ts` (HLS streaming endpoints)
  - Reviewed `nodejs-express-api/services/bunnyReconciliationService.ts` (reconciliation logic)
- [x] Identify all current API calls to Bunny.net
  - Library/Video CRUD: GET/POST/PUT/DELETE /library/{id}/videos
  - Collections: GET/POST/DELETE /library/{id}/collections
  - Captions: PUT /library/{id}/videos/{videoId}/captions/{lang}
  - Thumbnails: POST /library/{id}/videos/{videoId}/thumbnail
  - Statistics: GET /library/{id}/videos/{videoId}/statistics
  - Transcribe: POST /library/{id}/videos/{videoId}/transcribe
- [x] Map existing functionality to bunnynet-stream library methods
  - Library class: getLibrary, getSingleLibrary, createLibrary, updateLibrary, deleteLibrary
  - Collection class: getCollection, getSingleCollection, createCollection, updateCollection, deleteCollection
  - Video class: getVideos, getSingleVideo, createVideo, updateVideo, upload, reencode, addCaption, setThumbnail, deleteSingleVideo, deleteSingleCaption
  - RFU class: TUS resumable uploads
- [x] Document which operations are currently in use
  - Library management: Basic operations (no library creation/updates found)
  - Collections: Create, update, delete, list
  - Videos: Create, read, update, upload, delete, captions, thumbnails, statistics, transcribe
  - Token generation: Custom implementation with BUNNY_PULL_ZONE_SECURITY_KEY
- [x] Check current authentication method
  - Uses AccessKey header with BUNNY_API_KEY (library access key)
  - Custom token generation for secure URLs using BUNNY_PULL_ZONE_SECURITY_KEY
  - Token includes expiration, IP binding, path restrictions
- [x] Review environment variables
  - Required: BUNNY_API_KEY, BUNNY_VIDEO_LIBRARY_ID
  - Optional: BUNNY_STREAM_BASE_URL (default: https://video.bunnycdn.com)
  - Security: BUNNY_PULL_ZONE_SECURITY_KEY (for token generation)
  - Pull zone hardcoded: https://vz-8217e52e-f0d.b-cdn.net

## Phase 2: Environment Setup ✅ COMPLETED
- [x] Verify `bunnynet-stream` is installed in `package.json` ✅ (v1.0.3 confirmed)
- [x] Check for TypeScript type definitions compatibility ✅ (Built-in types at ./lib/index.d.ts)
- [x] Update environment variables if needed ✅ (Added BUNNY_PULL_ZONE_SECURITY_KEY and BUNNY_PULL_ZONE_BASE_URL to .env.example)
- [x] Create configuration file for Bunny.net credentials ✅ (Created config/bunny.ts with validation)

## Phase 3: Core Service Refactoring ✅ COMPLETED
- [x] Replaced bunnyService.ts with bunnynet-stream implementation ✅
  - Integrated Library, Collection, Video, RFU classes from bunnynet-stream
  - Preserved all legacy method signatures for backward compatibility
  - Maintained token generation (generateAdvancedToken) and file operations
  - Added comprehensive error handling
  - Kept URL generation functions (getStreamUrl, getThumbnailUrl, getHlsManifestUrl, etc.)
  - Implemented watermark and referer operations
  - Added TUS upload support
- [x] All core service methods now use library's built-in authentication ✅
- [x] Reduced bunnyService.ts from 359 to ~280 lines of actual logic (boilerplate eliminated) ✅

## Phase 4: Helper Functions Update ✅ COMPLETED
- [x] Updated bunnyHelper.ts to work with new service ✅
  - Added missing `getSecureStorageUrl()` method (was missing but used in controllers)
  - Updated `validateConfig()` to use bunnyConfig and check BUNNY_PULL_ZONE_SECURITY_KEY
  - Added warnings for default values
  - Imported bunnyConfig for pull zone base URL
- [x] All helper methods maintain backward compatibility ✅
- [x] Error handling preserved with try-catch wrappers ✅

## Phase 5: Controller Updates ✅ COMPLETED
- [x] Verified all controllers use bunnyService methods ✅
  - bunnySyncController: uses getStreamVideo, getThumbnailUrl, getPublicUrl, getStreamVideos, getStreamCollections, create/update/deleteCollection, assignVideoToCollection - all present
  - bunnyUploadController: uses uploadToStream, getThumbnailUrl - all present
  - bunnyMigrationController: uses uploadToStream - present
  - hlsController: uses BunnyHelper (updated with getSecureStorageUrl)
  - lessonsController: uses BunnyHelper and bunnyService.logAccess - present
- [x] No controller code changes needed due to backward compatibility ✅
- [x] All required methods verified in new bunnyService ✅

## Phase 6: Reconciliation Service
- [ ] Refactor `bunnyReconciliationService.ts`
  - Replace manual API calls with library methods
  - Update comparison logic to use library data structures
  - Simplify sync operations

## Phase 7: Testing & Validation
- [ ] Update existing unit tests in `bunnyHelper.test.ts`
- [ ] Create integration tests for library operations
- [ ] Test all CRUD operations for Libraries
- [ ] Test all CRUD operations for Collections
- [ ] Test all Video operations (create, update, upload, delete)
- [ ] Test TUS resumable upload
- [ ] Test error handling and edge cases
- [ ] Verify token authentication works correctly
- [ ] Test with actual Bunny.net API (if credentials available)

## Phase 8: Cleanup & Optimization
- [ ] Remove old HTTP client code (axios/fetch wrappers)
- [ ] Remove unused imports and dependencies
- [ ] Update documentation/comments
- [ ] Remove redundant error handling code
- [ ] Simplify data transformation logic
- [ ] Update any hardcoded API endpoints
- [ ] Ensure all API keys are properly secured

## Phase 9: Frontend Integration (if needed)
- [ ] Check `VideoPlayer.tsx` for any direct Bunny API calls
- [ ] Update video URL generation using library methods
- [ ] Ensure player configuration uses library settings
- [ ] Test video playback with new integration

## Phase 10: Deployment & Monitoring
- [ ] Update deployment scripts if needed
- [ ] Add logging for library operations
- [ ] Monitor for any breaking changes
- [ ] Create rollback plan
- [ ] Update API documentation

## Notes
- The bunnynet-stream library provides: Library, Collection, Video, RFU classes
- Each class handles its own API calls with built-in authentication
- Reduces need for custom HTTP wrappers and manual endpoint construction
- Simplifies error handling and response parsing
- Maintains backward compatibility where possible

## Key Benefits Expected
- Reduced boilerplate code (~70% reduction in Bunny API code)
- Type-safe operations with built-in types
- Simplified maintenance
- Consistent error handling
- Built-in retry logic and optimizations
- Easier to add new Bunny features
