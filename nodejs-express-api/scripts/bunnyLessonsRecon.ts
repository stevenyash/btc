#!/usr/bin/env node
/**
 * Bunny ↔ Lessons Reconciliation & Cleanup Script
 *
 * Syncs videos from Bunny.net Stream to local lessons table.
 *
 * Usage:
 *   npx tsx scripts/bunnyLessonsRecon.ts [--reconcile] [--cleanup] [--dry-run] [--force]
 *
 * Modes:
 *   --reconcile    Map Bunny videos to lessons (default)
 *   --cleanup      Remove bunny_video_id references that no longer exist in Bunny
 *
 * Options:
 *   --dry-run      Preview changes without updating database
 *   --force        Overwrite existing bunny_video_id links (reconcile only)
 *
 * Examples:
 *   # Dry run reconciliation
 *   npx tsx scripts/bunnyLessonsRecon.ts --reconcile --dry-run
 *
 *   # Actually link videos
 *   npx tsx scripts/bunnyLessonsRecon.ts --reconcile
 *
 *   # Cleanup orphaned references (dry-run)
 *   npx tsx scripts/bunnyLessonsRecon.ts --cleanup --dry-run
 *
 *   # Actually remove orphaned references
 *   npx tsx scripts/bunnyLessonsRecon.ts --cleanup
 */

// Load environment variables FIRST (must be before any other imports)
import 'dotenv/config';

import bunnyReconciliationService from '../services/bunnyReconciliationService.js';

async function main() {
  const reconcile = process.argv.includes('--reconcile');
  const cleanup = process.argv.includes('--cleanup');
  const dryRun = process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');

  // Default to reconcile if no mode specified
  const mode = !reconcile && !cleanup ? 'reconcile' : (reconcile ? 'reconcile' : 'cleanup');

  console.log('🔄 Bunny ↔ Lessons ' + (mode === 'reconcile' ? 'Reconciliation' : 'Cleanup') + '\n');
  console.log('='.repeat(60));
  console.log(`Mode: ${mode === 'reconcile' ? '🔗 Reconciliation' : '🧹 Cleanup'}`);
  console.log(`Operation: ${dryRun ? '🔍 DRY RUN' : '⚡ LIVE'}`);
  if (mode === 'reconcile') {
    console.log(`Force: ${force ? 'Yes (overwrite)' : 'No (skip linked)'}`);
  }
  console.log('');

  try {
    let result;

    if (mode === 'reconcile') {
      result = await bunnyReconciliationService.reconcile({ dryRun, force });
    } else {
      result = await bunnyReconciliationService.cleanupOrphaned({ dryRun });
    }

    // Summary
    console.log('');
    console.log('='.repeat(60));
    console.log('📊 SUMMARY\n');

    if (mode === 'reconcile') {
      console.log(`   Total videos: ${result.totalVideos}`);
      console.log(`   ✅ Linked: ${result.linked}`);
      console.log(`   ⏭️  Skipped: ${result.skipped}`);
      console.log(`   ❌ Failed: ${result.failed}`);
    } else {
      console.log(`   Total checked: ${result.totalChecked}`);
      console.log(`   ✅ Still valid: ${result.skipped}`);
      console.log(`   🗑️  Orphaned: ${result.orphaned}`);
      console.log(`   🧹 Cleaned: ${result.cleaned}`);
      console.log(`   ❌ Errors: ${result.errors}`);
    }

    console.log('');

    if (dryRun) {
      console.log('🔍 This was a dry run. No database changes were made.');
      console.log(`   Remove --dry-run to apply ${mode === 'reconcile' ? 'reconciliation' : 'cleanup'}.\n`);
    } else {
      console.log(`✅ ${mode === 'reconcile' ? 'Reconciliation' : 'Cleanup'} ${dryRun ? 'simulated' : 'applied'} successfully.\n`);
    }

    // Exit code based on failures
    const hasFailures = mode === 'reconcile' ? result.failed > 0 : result.errors > 0;
    if (hasFailures) {
      console.log('⚠️  Some operations failed. Check the details above.\n');
      process.exit(1);
    }

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
