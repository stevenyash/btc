#!/usr/bin/env tsx
/**
 * Minimal test: just import and print
 */

console.log('🔧 Script starting...');

try {
  console.log('📦 Importing DB...');
  import('../models/db.js').then(({ default: DB }) => {
    console.log('✅ DB imported');
    console.log('DB keys:', Object.keys(DB).slice(0, 10));
  }).catch(err => {
    console.error('❌ Import error:', err.message);
  });
} catch (error: any) {
  console.error('❌ Sync error:', error.message);
}

console.log('📝 Script reached end');
