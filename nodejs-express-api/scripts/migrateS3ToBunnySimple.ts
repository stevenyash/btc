#!/usr/bin/env node
/**
 * S3 to Bunny.net Migration Script (Simple Version)
 * 
 * Run with: npx tsx scripts/migrateS3ToBunnySimple.ts
 */

import { Sequelize, Op } from 'sequelize';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Import BunnyService (we'll call the API directly)
const BUNNY_API_KEY = process.env.BUNNY_API_KEY || 'd14fe46f-d0f5-45c7-b90dd58bf1e0-d37b-4134';
const BUNNY_LIBRARY_ID = process.env.BUNNY_VIDEO_LIBRARY_ID || '644183';
const BUNNY_STREAM_BASE_URL = 'https://video.bunnycdn.com';

// Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'btc',
  process.env.DB_USERNAME || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: false,
  }
);

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

// Bunny Stream API helper
async function uploadToBunnyStream(filePath: string, title: string): Promise<{
  guid: string;
  status: string;
}> {
  // Step 1: Create video entry
  const createResponse = await fetch(
    `${BUNNY_STREAM_BASE_URL}/library/${BUNNY_LIBRARY_ID}/videos`,
    {
      method: 'POST',
      headers: {
        'AccessKey': BUNNY_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description: '',
        collectionId: null,
      }),
    }
  );

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Failed to create video: ${createResponse.status} ${error}`);
  }

  const video = await createResponse.json() as { guid: string };

  // Step 2: Upload video file
  const fileBuffer = fs.readFileSync(filePath);
  const uploadResponse = await fetch(
    `${BUNNY_STREAM_BASE_URL}/library/${BUNNY_LIBRARY_ID}/videos/${video.guid}`,
    {
      method: 'PUT',
      headers: {
        'AccessKey': BUNNY_API_KEY,
      },
      body: fileBuffer,
    }
  );

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    throw new Error(`Failed to upload video: ${uploadResponse.status} ${error}`);
  }

  return {
    guid: video.guid,
    status: 'processing',
  };
}

async function downloadFromS3(s3Key: string, localPath: string): Promise<boolean> {
  try {
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

    const chunks: Uint8Array[] = [];
    const stream = response.Body as any;
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    fs.writeFileSync(localPath, buffer);
    
    return true;
  } catch (error: any) {
    console.error(`Error downloading from S3 (${s3Key}):`, error.message);
    return false;
  }
}

async function migrateLesson(lesson: Lesson): Promise<void> {
  console.log(`\nProcessing lesson ${lesson.id}: ${lesson.title}`);
  
  if (lesson.bunny_video_id && lesson.transcoding_status === 'completed') {
    console.log(`  ⏭️ Skipping - already migrated (video_id: ${lesson.bunny_video_id})`);
    return;
  }

  const s3Key = lesson.storage_path || lesson.s3_key;
  if (!s3Key) {
    console.log(`  ❌ No S3 key found, skipping`);
    return;
  }

  const fileName = path.basename(s3Key);
  const localPath = path.join(os.tmpdir(), `migrate_${lesson.id}_${fileName}`);

  try {
    console.log(`  ⬇️ Downloading from S3: ${s3Key}`);
    const downloaded = await downloadFromS3(s3Key, localPath);
    
    if (!downloaded) {
      console.log(`  ❌ Failed to download from S3`);
      return;
    }

    console.log(`  ⬆️ Uploading to Bunny Stream...`);
    const result = await uploadToBunnyStream(localPath, lesson.title || `Lesson ${lesson.id}`);

    const [updatedRows] = await sequelize.query(
      `UPDATE lessons SET 
        bunny_video_id = ?, 
        bunny_url = ?,
        transcoding_status = ?
      WHERE id = ?`,
      {
        replacements: [
          result.guid,
          `https://vz-8217e52e-f0d.b-cdn.net/${result.guid}`,
          result.status,
          lesson.id,
        ]
      }
    );

    console.log(`  ✅ Migrated successfully!`);
    console.log(`     Video ID: ${result.guid}`);
    console.log(`     Status: ${result.status}`);

    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }

  } catch (error: any) {
    console.error(`  ❌ Migration failed:`, error.message);
    
    await sequelize.query(
      `UPDATE lessons SET transcoding_status = ? WHERE id = ?`,
      {
        replacements: ['failed', lesson.id]
      }
    );
  }
}

async function main() {
  console.log('🚀 Starting S3 to Bunny.net Migration\n');
  console.log('=' .repeat(50));

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    const [lessons] = await sequelize.query(
      `SELECT id, title, s3_key, s3_url, storage_path, bunny_url, bunny_video_id, transcoding_status 
       FROM lessons 
       WHERE (storage_path IS NOT NULL OR s3_key IS NOT NULL)
       AND (bunny_video_id IS NULL OR transcoding_status != 'completed')
       LIMIT 10`
    ) as [Lesson[], any];

    console.log(`Found ${lessons.length} lessons to migrate\n`);

    if (lessons.length === 0) {
      console.log('✅ No lessons need migration');
      process.exit(0);
    }

    let successCount = 0;
    let failCount = 0;

    for (const lesson of lessons) {
      try {
        await migrateLesson(lesson);
        successCount++;
      } catch (error) {
        failCount++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '='.repeat(50));
    console.log('🏁 Migration Complete!');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📊 Total: ${lessons.length}`);

    await sequelize.close();
    process.exit(0);
  } catch (error: any) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

main();
