#!/usr/bin/env tsx
/**
 * Simple test to see if the script runs and database connects
 */

import DB from '../models/db.js';

async function test() {
  console.log('🔧 Starting test...');
  try {
    console.log('📡 Testing database connection...');
    await DB.sequelize.authenticate();
    console.log('✅ Connected to database');
    
    console.log('🔍 Checking lessons table...');
    const count = await DB.Lessons.count();
    console.log(`📊 Lessons count: ${count}`);
    
    console.log('🔍 Checking subtopics table...');
    const subCount = await DB.Subtopics.count();
    console.log(`📊 Subtopics count: ${subCount}`);
    
    console.log('✅ Test completed successfully');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();
