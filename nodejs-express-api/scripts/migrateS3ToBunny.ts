#!/usr/bin/env node
/**
 * S3 to Bunny.net Migration Script
 * 
 * This script migrates videos from AWS S3 to Bunny.net Stream
 * Run with: npx ts-node scripts/migrateS3ToBunny.ts
 */

import DB from '../models/db.js';
import bunnyService from '../services/bunnyService.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

interface Lesson {
  id: number;
  title: string;
  s3_key: string | null;
  s3_url: string | null;
  storage_path: string | null;
  bunny_url: string | null;
  bunny_video_id: string | null;
  transcoding_status: string;
}

async function downloadFromS3(s3Key: string, localPath: string): Promise<boolean> {
  try {
    // Use AWS SDK to download from S3
    // This requires AWS credentials in .env
    const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
    
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'af-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET || '',
      Key: s3Key,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('No body in S3 response');
    }

    // Convert stream to buffer and save to file
    const chunks: Uint8Array[] = [];
    const stream = response.Body as any;
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    fs.writeFileSync(localPath, buffer);
    
    return true;
  } catch (error) {
    console.error(`Error downloading from S3 (${s3Key}):`, error);
    return false;
  }
}

async function migrateLesson(lesson: Lesson): Promise<void> {
  console.log(`\nProcessing lesson ${lesson.id}: ${lesson.title}`);
  
  // Skip if already migrated
  if (lesson.bunny_video_id && lesson.transcoding_status === 'completed') {
    console.log(`  ⏭️  Skipping - already migrated (video_id: ${lesson.bunny_video_id})`);
    return;
  }

  const s3Key = lesson.storage_path || lesson.s3_key;
  if (!s3Key) {
    console.log(`  ❌ No S3 key found, skipping`);
    return;
  }

  // Create temp file path
  const tempDir = os.tmpdir();
  const fileName = path.basename(s3Key);
  const localPath = path.join(tempDir, `migrate_${lesson.id}_${fileName}`);

  try {
    // Step 1: Download from S3
    console.log(`  ⬇️  Downloading from S3: ${s3Key}`);
    const downloaded = await downloadFromS3(s3Key, localPath);
    
    if (!downloaded) {
      console.log(`  ❌ Failed to download from S3`);
      return;
    }

    // Step 2: Upload to Bunny Stream
    console.log(`  ⬆️  Uploading to Bunny Stream...`);
    const uploadResult = await bunnyService.uploadVideo(localPath, {
      title: lesson.title || `Lesson ${lesson.id}`,
    });

    // Step 3: Update database
    const updateData: any = {
      bunny_url: uploadResult.videoUrl,
      transcoding_status: uploadResult.status || 'processing',
    };

    if (uploadResult.guid) {
      updateData.bunny_video_id = uploadResult.guid;
    }

    await DB.Lessons.update(updateData, { where: { id: lesson.id } });
    
    console.log(`  ✅ Migrated successfully!`);
    console.log(`     Video ID: ${uploadResult.guid || 'N/A'}`);
    console.log(`     URL: ${uploadResult.videoUrl}`);
    console.log(`     Status: ${uploadResult.status || 'processing'}`);

    // Clean up temp file
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }

  } catch (error: any) {
    console.error(`  ❌ Migration failed:`, error.message);
    
    // Update status to failed
    await DB.Lessons.update(
      { transcoding_status: 'failed' },
      { where: { id: lesson.id } }
    );
  }
}

async function main() {
  console.log('🚀 Starting S3 to Bunny.net Migration\n');
  console.log('=' .repeat(50));

  try {
    // Get all lessons with S3 keys that haven't been migrated
    const lessons = await DB.Lessons.findAll({
      where: {
        [DB.op.or]: [
          { storage_path: { [DB.op.not]: null } },
          { s3_key: { [DB.op.not]: null } },
        ],
        [DB.op.or]: [
          { bunny_video_id: null },
          { transcoding_status: { [DB.op.not]: 'completed' } },
        ],
      },
      raw: true,
    }) as unknown as Lesson[];

    console.log(`Found ${lessons.length} lessons to migrate\n`);

    if (lessons.length === 0) {
      console.log('✅ No lessons need migration');
      process.exit(0);
    }

    // Process lessons sequentially to avoid overwhelming APIs
    let successCount = 0;
    let failCount = 0;

    for (const lesson of lessons) {
      try {
        await migrateLesson(lesson);
        successCount++;
      } catch (error) {
        failCount++;
      }
      
      // Small delay between migrations
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '='.repeat(50));
    console.log('🏁 Migration Complete!');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📊 Total: ${lessons.length}`);

    process.exit(0);
  } catch (error: any) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  main();
}
