# Fix Summary: Bunny Video Sync Admin Page

## Problem
The `BunnySyncAdminPage.tsx` had a **parse error** preventing compilation:
```
[PARSE_ERROR] Error: Cannot assign to this expression
     ╭─[ src/pages/BunnySyncAdminPage.tsx:112:51 ]
     │
 112 │         fetch(\/api/bunny-sync/bunny-videos?page=1&limit=100\, {
```

The backslashes before `/api/` were being interpreted as division operators on the root object.

Additionally, the user reported "i already have vedios in buny but i cant see them listed" - the UI was missing functionality to display Bunny.net videos and their mapping status.

## Root Causes

### 1. Parse Error (Critical)
Three locations had malformed fetch statements with escaped forward slashes and incorrect Authorization headers:
- Line 112: `fetch(\/api/bunny-sync/bunny-videos...)` 
- Line 117: `fetch(\/api/bunny-sync/bunny-collections...)`
- Line 142: `fetch(\/api/bunny-sync/mapping-status...)`
- Authorization headers used `\Bearer \` instead of template literal

### 2. Missing UI Features
- `fetchBunnyData` function existed but was never called
- `fetchMappingData` function existed but was never called
- State variables `showBunnyVideosModal` and `showMappingModal` were declared but never used in JSX
- No buttons in UI to view Bunny.net videos or mapping status
- Bunny videos fetched but never displayed to user

## Changes Made

### File: `react-frontend/src/pages/BunnySyncAdminPage.tsx`

#### 1. Fixed Parse Errors (Lines 109-146)
**Before:**
```typescript
fetch(\/api/bunny-sync/bunny-videos?page=1&limit=100\, {
  headers: {
    Authorization: \Bearer \,
  },
}),
fetch(\/api/bunny-sync/bunny-collections\, {
  headers: {
    Authorization: \Bearer \,
  },
}),
```

**After:**
```typescript
fetch(`/api/bunny-sync/bunny-videos?page=1&limit=100`, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
}),
fetch(`/api/bunny-sync/bunny-collections`, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
}),
```

**And for mapping-status (Line 142):**
```typescript
const response = await fetch(`/api/bunny-sync/mapping-status?page=1&limit=100`, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});
```

#### 2. Simplified fetchBunnyData (Lines 106-127)
Removed fetching collections (using mapping status instead) and set `bunnyVideos` only.

#### 3. Added Import (Line 3)
Added `Video` icon to imports:
```typescript
import { Loader2, HardDrive, CheckCircle, XCircle, AlertCircle, RefreshCw, Trash2, Video } from "lucide-react";
```

#### 4. Cleaned Up State (Lines 32-43)
Removed unused `bunnyCollections` and `showCollectionsModal` state variables.

#### 5. Added Action Buttons (Lines 638-657)
Added two new buttons in the Actions section:
- **View Bunny Videos** (purple) - Fetches and displays Bunny.net videos
- **View Mapping Status** (indigo) - Fetches and displays mapping of Bunny videos to lessons

```typescript
<button
  onClick={() => {
    fetchBunnyData();
    setShowBunnyVideosModal(true);
  }}
  className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 flex items-center gap-2"
>
  <Video className="h-4 w-4" />
  View Bunny Videos
</button>
<button
  onClick={() => {
    fetchMappingData();
    setShowMappingModal(true);
  }}
  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
>
  <CheckCircle className="h-4 w-4" />
  View Mapping Status
</button>
```

#### 6. Added Bunny Videos Modal (Lines 833-896)
Modal displaying all Bunny.net videos with:
- Video GUID
- Title
- Transcoding status (colored badge)
- Mapping status (shows which lesson it's mapped to, or "Unmapped")
- Loading state with spinner

#### 7. Added Mapping Status Modal (Lines 898-962)
Modal displaying mapping overview with:
- Summary cards: Total Bunny Videos, Mapped, Unmapped
- Table showing each Bunny video with:
  - Video title and GUID
  - Transcoding status
  - Mapped lesson (with lesson ID and title) or "Not mapped to any lesson"

## Verification

### Build Status
```bash
cd react-frontend && npm run build
# ✓ Built in 1.13s
# No parse errors
```

### Lint Status
All remaining lint errors are **pre-existing** (not introduced by this fix):
- `any` type usage (existing code style)
- `setState` in useEffect (existing code pattern)
- No new lint errors introduced

## Functionality

Users can now:
1. **See videos in Bunny.net** - Click "View Bunny Videos" to list all videos with their transcoding status and mapping status
2. **See mapping overview** - Click "View Mapping Status" to see which Bunny videos are linked to local lessons
3. **Identify unmapped videos** - Clear visual indication of which Bunny videos need to be linked to lessons
4. **Verify transcoding status** - See if videos are pending, processing, completed, or failed in Bunny.net

The original parse error is fixed, and the UI now provides visibility into Bunny.net videos that the user has but couldn't see before.
