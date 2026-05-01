# BunnySync Admin Page - Fix Summary

## Problem
The BunnySyncAdminPage was showing all zeros:
- Total Videos: 0
- In Sync: 0  
- Pending: 0
- No Bunny Video: 0

Users had videos in Bunny.net but couldn't see them or link them to lessons.

## Root Cause
1. The `/api/bunny-sync/pending` endpoint only returned lessons where `bunny_video_id IS NOT NULL OR storage_path IS NOT NULL`, excluding lessons without any video reference
2. The page only showed lessons that already had video references, not the total lesson count
3. There was no way to see unlinked Bunny videos and map them to existing lessons

## Solution

### Backend Changes (`nodejs-express-api/controllers/bunnySyncController.ts`)

1. **Added `totalLessons` to pending endpoint response** (line 119, 127)
   - Now queries total count of ALL lessons, not just those with video refs
   - This ensures the "Total Videos" stat shows all lessons regardless of video status

2. **Added `/api/bunny-sync/link-bunny-video` POST endpoint** (line 517+)
   - Links a Bunny video GUID to a lesson ID
   - Checks: video exists in Bunny, lesson exists, video not already linked to another lesson
   - Updates lesson with `bunny_video_id` and sets `transcoding_status = 'processing'`

3. **Enhanced `/api/bunny-sync/mapping-status` endpoint** (line 456+)
   - Returns mapping info for all Bunny videos
   - Includes `isMapped` flag and `mappedLesson` data per video
   - Provides summary: total, mapped, unmapped counts

### Frontend Changes (`react-frontend/src/pages/BunnySyncAdminPage.tsx`)

1. **Added `totalLessonsCount` state** (line 45)
   - Stores the total lesson count from the API

2. **Added `fetchStats()` function** (line 79)
   - Fetches total lesson count from `/api/bunny-sync/pending`
   - Updates `totalLessonsCount` state

3. **Added `fetchUnmappedVideos()` function** (line 151)
   - Fetches unmapped Bunny videos from `/api/bunny-sync/mapping-status`
   - Filters to show only unmapped videos

4. **Added `handleLinkBunnyVideo()` function** (line 398)
   - Calls `/api/bunny-sync/link-bunny-video` endpoint
   - Refreshes data after linking

5. **Added `handleShowUnmapped()` function** (line 461)
   - Shows the unmapped videos modal

6. **Added "Unlinked Bunny" stat card** (line 683-693)
   - Shows count of Bunny videos not linked to any lesson
   - Purple styling matching the Bunny brand

7. **Added "Link Unlinked Videos" action button** (line 731-737)
   - Opens modal to link unmapped videos to lessons

8. **Added `LinkUnlinkedVideosModal` component** (line 1095+)
   - Dropdowns to select Bunny video and lesson
   - Link button with validation
   - Shows video status (pending/processing/completed/failed)

9. **Updated useEffect** (line 335)
   - Added `fetchStats` and `fetchBunnyData` to initialization
   - Ensures stats are loaded on page load

## Result

**Before:**
- Only lessons with existing video refs were shown
- Total Videos count was 0 if no videos linked
- No way to link unlinked Bunny videos

**After:**
- Total Videos shows ALL lessons (totalLessonsCount from API)
- Unlinked Bunny videos visible with "Unlinked Bunny" stat
- "Link Unlinked Videos" button opens modal to map videos to lessons
- Can link any Bunny video to any existing lesson
- After linking, videos can be synced normally

## API Endpoints

- `GET /api/bunny-sync/pending` - Returns `{ success, total, totalLessons, data[] }`
- `GET /api/bunny-sync/mapping-status` - Returns `{ success, data[], summary: { total, mapped, unmapped } }`
- `POST /api/bunny-sync/link-bunny-video` - Body: `{ bunnyVideoId, lessonId }`

## Testing

Both frontend (React/TypeScript) and backend (Node.js/TypeScript) compile without errors:
```bash
cd react-frontend && npx tsc --noEmit  # OK
cd nodejs-express-api && npx tsc --noEmit  # OK
```