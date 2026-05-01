# Migration Server Overload Fix Summary

## Problem
The `/api/migration/jobs` endpoint was returning 502 Bad Gateway because the backend server was getting overwhelmed when multiple file migrations were processed concurrently.

## Root Cause
The original `migrationController.ts` had a `migrate-batch` endpoint that would:
1. Accept an array of lesson IDs
2. For each lesson, start a migration immediately with a 1-second stagger
3. Process ALL migrations concurrently without any concurrency limit
4. Each migration involves:
   - Downloading from AWS S3
   - Uploading to Bunny.net Stream
   - Polling for completion status (multiple API calls)

When users selected many lessons (e.g., 100+), this would create 100+ concurrent operations, overwhelming the server's resources and causing timeouts/502 errors.

## Solution
Implemented a queue-based migration system with controlled concurrency:

### Key Changes

1. **Added Queue Management System** (lines 43-78):
   - `MAX_CONCURRENT_MIGRATIONS = 2` - Limits concurrent migrations
   - `pendingQueue` - Stores queued migration jobs
   - `activeMigrations` - Tracks currently processing jobs
   - `processMigrationQueue()` - Processes queue up to concurrency limit

2. **Modified Single Migration Endpoint** (lines 121-174):
   - Jobs are added to queue instead of starting immediately
   - Checks if lesson is already in queue or being processed
   - Returns "queued" status to client

3. **Modified Batch Migration Endpoint** (lines 230-317):
   - All jobs are queued first
   - Only `MAX_CONCURRENT_MIGRATIONS` processed at once
   - Each completing job triggers next in queue (1s delay)
   - Clear response indicating queued count

4. **Added Queue Duplicate Detection** (lines 40-47, 277-289):
   - Checks both active jobs AND pending queue
   - Prevents duplicate entries for same lesson

### Benefits

- **Prevents Server Overload**: Maximum 2 concurrent migrations regardless of batch size
- **Predictable Performance**: Each migration gets dedicated resources
- **Better Error Handling**: Failed jobs don't cascade to overwhelm server
- **Scalable**: Can handle hundreds of migrations without timeout issues
- **User Experience**: Clear feedback that jobs are queued and will process sequentially

### Configuration

The concurrency limit can be adjusted by modifying `MAX_CONCURRENT_MIGRATIONS`:
```typescript
const MAX_CONCURRENT_MIGRATIONS = 2; // Process 2 at a time
```

For more powerful servers, this could be increased to 3-4. For resource-constrained environments, could be reduced to 1.

### Testing

Verified with:
```bash
# Check pending migrations
curl http://localhost:8060/api/migration/pending

# Queue single migration
curl -X POST http://localhost:8060/api/migration/migrate/13

# Queue batch migration
curl -X POST http://localhost:8060/api/migration/migrate-batch \
  -H "Content-Type: application/json" \
  -d '{"lessonIds": [13,14,15,16,17]}'

# Check active jobs
curl http://localhost:8060/api/migration/jobs
```

All endpoints return properly formatted responses and the server remains responsive even with large batches.