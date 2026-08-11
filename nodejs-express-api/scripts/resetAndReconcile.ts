#!/usr/bin/env tsx
/**
 * Truncate all learning hierarchy tables and re-run reconciliation
 *
 * WARNING: This will DELETE ALL DATA in these tables:
 * - lessons, subtopics, topics, learning_areas, grades
 *
 * Usage: node scripts/resetAndReconcile.ts [--dry-run] [--force]
 */

// Load environment variables FIRST (must be before any other imports)
import 'dotenv/config';

import DB from '../models/db.js';
import bunnyReconciliationService from '../services/bunnyReconciliationService.js';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');

  console.log('🔄 FULL RESET & RECONCILIATION\n');
  console.log('='.repeat(60));
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN' : '⚡ LIVE'}`);
  console.log(`Force: ${force ? 'Yes' : 'No'}`);
  console.log('');

  if (!dryRun) {
    console.log('⚠️  WARNING: This will permanently delete:');
    console.log('   - All lessons (video mappings)');
    console.log('   - All subtopics');
    console.log('   - All topics');
    console.log('   - All learning areas');
    console.log('   - All grades');
    console.log('');
    console.log('Press Ctrl+C within 5 seconds to cancel...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  try {
    // Step 1: Truncate all hierarchy tables (in reverse dependency order)
    console.log('\n🗑️  Truncating tables...\n');

    if (!dryRun) {
      await DB.Lessons.destroy({ where: {} });
      console.log('   ✅ lessons truncated');

      await DB.Subtopics.destroy({ where: {} });
      console.log('   ✅ subtopics truncated');

      await DB.Topics.destroy({ where: {} });
      console.log('   ✅ topics truncated');

      await DB.LearningAreas.destroy({ where: {} });
      console.log('   ✅ learning_areas truncated');

      await DB.Grades.destroy({ where: {} });
      console.log('   ✅ grades truncated');
    } else {
      console.log('   🔍 Dry run: Would truncate lessons, subtopics, topics, learning_areas, grades');
    }

    console.log('\n✅ Truncation complete.\n');

    // Step 2: Run reconciliation to rebuild from Bunny
    console.log('🔄 Starting reconciliation...\n');
    const result = await bunnyReconciliationService.reconcile({ dryRun, force });

    // Summary
    console.log('');
    console.log('='.repeat(60));
    console.log('📊 FINAL SUMMARY\n');
    console.log(`   Total videos: ${result.totalVideos}`);
    console.log(`   ✅ Linked: ${result.linked}`);
    console.log(`   ⏭️  Skipped: ${result.skipped}`);
    console.log(`   ❌ Failed: ${result.failed}`);
    console.log('');

    if (dryRun) {
      console.log('🔍 This was a dry run. No database changes were made.');
      console.log('   Remove --dry-run to apply reset + reconciliation.\n');
    } else {
      console.log('✅ Reset & reconciliation completed successfully.\n');
    }

    // Exit code based on failures
    if (result.failed > 0) {
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
