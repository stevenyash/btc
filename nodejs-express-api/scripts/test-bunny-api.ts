#!/usr/bin/env tsx
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.BUNNY_API_KEY;
const libraryId = process.env.BUNNY_VIDEO_LIBRARY_ID;
const baseUrl = (process.env.BUNNY_STREAM_BASE_URL || 'https://video.bunnycdn.com').replace(/\/$/, '');

console.log('Testing Bunny Stream API...');
console.log('API Key:', apiKey?.slice(0, 8) + '...');
console.log('Library ID:', libraryId);
console.log('Base URL:', baseUrl);

const url = `${baseUrl}/library/${libraryId}/collections`;
console.log('Request URL:', url);

try {
  const res = await fetch(url, {
    headers: {
      'AccessKey': apiKey || '',
      'Content-Type': 'application/json'
    }
  });
  
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
  
  if (!res.ok) {
    console.error('❌ Request failed');
  } else {
    console.log('✅ Success');
  }
} catch (err: any) {
  console.error('❌ Error:', err.message);
}
