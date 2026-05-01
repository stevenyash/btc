# ⚠️ PRODUCTION DEPLOYMENT REQUIRED

## Issue
The production server at `backend.bitstutorconnect.co.ke` is still running the OLD code without the queue management system, causing 502 Bad Gateway errors.

## What's Already Done (Local)
✅ Modified: `nodejs-express-api/controllers/migrationController.ts`  
✅ TypeScript check: Passed (0 errors)  
✅ Code is ready for deployment  

## What Needs to Happen (Production)

The file `nodejs-express-api/controllers/migrationController.ts` on the **production server** must be updated with the queue-based migration system.

### Changes Required on Production Server

**File:** `nodejs-express-api/controllers/migrationController.ts`

**Add Queue System (after line 38):**
```typescript
// Migration queue to prevent server overload
const MAX_CONCURRENT_MIGRATIONS = 2;
const pendingQueue: Array<{ lessonId: number; jobId: string }> = [];
let activeMigrations = 0;

function processMigrationQueue() {
  // Process pending migrations up to the concurrent limit
  while (activeMigrations < MAX_CONCURRENT_MIGRATIONS && pendingQueue.length > 0) {
    const item = pendingQueue.shift();
    if (item) {
      activeMigrations++;
      
      DB.Lessons.findOne({ where: { id: item.lessonId }, raw: true })
        .then((lesson) => {
          if (!lesson) {
            throw new Error('Lesson not found');
          }
          return migrateLesson(lesson, item.jobId);
        })
        .catch((err) => {
          console.error(`Migration failed for lesson ${item.lessonId}:`, err);
          const job = migrationJobs.get(item.jobId);
          if (job) {
            job.status = 'failed';
            job.error = err.message;
            job.completedAt = new Date().toISOString();
          }
        })
        .finally(() => {
          activeMigrations--;
          // Process next item in queue after a short delay
          setTimeout(processMigrationQueue, 1000);
        });
    }
  }
}
```

**Modify Single Migration Endpoint (around line 197):**
```typescript
router.post('/migrate/:lessonId', async (req: Request, res: Response) => {
  try {
    // ... existing validation code ...
    
    // Check if already in pending queue (ADD THIS)
    const alreadyInQueue = pendingQueue.some(item => item.lessonId === lesson.id);
    if (existingActiveJob || alreadyInQueue) {
      return res.status(400).json({ error: 'Lesson is already being migrated or is queued' });
    }
    
    const jobId = crypto.randomBytes(8).toString('hex');
    const job: MigrationJob = {
      id: jobId,
      lessonId: lesson.id,
      status: 'pending',  // Changed from 'processing'
      progress: 0,
      startedAt: new Date().toISOString(),
    };
    
    migrationJobs.set(jobId, job);
    
    // Add to queue instead of starting immediately (CHANGE THIS)
    pendingQueue.push({ lessonId: lesson.id, jobId });
    processMigrationQueue();
    
    return res.json({
      success: true,
      jobId,
      message: 'Migration queued',  // Changed from 'Migration started'
      job,
    });
  } catch (error: any) {
    // ... error handling ...
  }
});
```

**Modify Batch Migration Endpoint (around line 257):**
```typescript
router.post('/migrate-batch', async (req: Request, res: Response) => {
  try {
    // ... existing code ...
    
    for (const lessonId of lessonIds) {
      // ... existing validation ...
      
      // Check if already in pending queue (ADD THIS)
      const alreadyInQueue = pendingQueue.some(item => item.lessonId === lesson.id);
      if (existingActiveJob || alreadyInQueue) {
        continue;
      }
      
      const jobId = crypto.randomBytes(8).toString('hex');
      const job: MigrationJob = {
        id: jobId,
        lessonId: lesson.id,
        status: 'pending',  // Changed from 'processing'
        progress: 0,
        startedAt: new Date().toISOString(),
      };
      
      migrationJobs.set(jobId, job);
      pendingQueue.push({ lessonId: lesson.id, jobId });  // Add to queue
      jobs.push({ jobId, lessonId: lesson.id });
    }
    
    // Start processing the queue (ADD THIS)
    processMigrationQueue();
    
    return res.json({
      success: true,
      message: `Queued ${jobs.length} migration jobs (processing ${MAX_CONCURRENT_MIGRATIONS} at a time)`,  // Updated message
      jobs,
    });
  } catch (error: any) {
    // ... error handling ...
  }
});
```

## Deployment Steps

### 1. Update Production Server Files
```bash
# On the production server:
cd /path/to/nodejs-express-api

# Backup original file (recommended)
cp controllers/migrationController.ts controllers/migrationController.ts.backup

# Copy the updated file from this repository
# (Use SCP, SFTP, or your preferred method)
```

### 2. Restart the Production Server
```bash
# If using PM2:
pm2 restart nodejs-express-api

# If using systemd:
sudo systemctl restart btc-backend

# Or manually (not recommended for production)
node app.ts
```

### 3. Verify Deployment
```bash
# Check server is running
curl http://localhost:8060/health

# Test migration endpoint
curl http://localhost:8060/api/migration/jobs
```

## Expected Outcome After Deployment

### Before Deployment (Current)
- ❌ 502 Bad Gateway on batch migrations
- ❌ Server overload with concurrent operations
- ❌ Most migrations fail

### After Deployment
- ✅ Batch migrations queue properly
- ✅ Only 2 concurrent migrations (prevents overload)
- ✅ All migrations complete successfully
- ✅ Server remains stable

## Rollback Plan

If issues occur after deployment:

```bash
# Restore original file
cp controllers/migrationController.ts.backup controllers/migrationController.ts

# Restart server
pm2 restart nodejs-express-api

# Or systemd
sudo systemctl restart btc-backend
```

## Frontend Notes

⚠️ **No frontend changes required!** The existing `MigrationAdminPage.tsx` already handles:
- Displaying queued vs. processing status
- Polling for job updates every 3 seconds
- Showing queue position and progress

The frontend will automatically work with the updated backend.

## Monitoring After Deployment

Check these metrics to ensure the fix is working:

1. **API Response Times**: `/jobs` endpoint should respond quickly
2. **Active Migrations**: Never exceeds 2 (check `/jobs` response)
3. **Queue Size**: Should decrease over time (not grow)
4. **Error Rate**: Should be 0% for migration endpoints
5. **Server Resources**: CPU/memory should be stable

## Support

If you encounter issues after deployment:

1. Check server logs: `pm2 logs` or `journalctl -u btc-backend`
2. Verify file was updated correctly: `diff migrationController.ts migrationController.ts.backup`
3. Test with small batch first: 5-10 lessons
4. Monitor queue processing: Watch `/api/migration/jobs` response

---

**File Location:** `nodejs-express-api/controllers/migrationController.ts`  
**Lines Changed:** ~60 lines (queue system + 2 endpoint modifications)  
**Risk Level:** Low (backward compatible, no database changes)  
**Downtime Required:** Yes (server restart needed)  

**Ready for deployment to production server at `backend.bitstutorconnect.co.ke`** 🚀