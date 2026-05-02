import fetch from 'node-fetch';

const apiKey = 'd14fe46f-d0f5-45c7-b90dd58bf1e0-d37b-4134';
const libraryId = '644183';
const baseUrl = 'https://video.bunnycdn.com';

async function testBunny() {
  console.log('Testing Bunny Stream API connectivity...\n');

  // Test 1: List videos
  try {
    console.log(`GET ${baseUrl}/library/${libraryId}/videos`);
    const res = await fetch(`${baseUrl}/library/${libraryId}/videos`, {
      headers: { 'AccessKey': apiKey }
    });
    console.log(`Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log(`Response: ${text.substring(0, 200)}`);
  } catch (err: any) {
    console.error('Error:', err.message);
  }

  console.log('\n---\n');

  // Test 2: List collections
  try {
    console.log(`GET ${baseUrl}/library/${libraryId}/collections`);
    const res = await fetch(`${baseUrl}/library/${libraryId}/collections`, {
      headers: { 'AccessKey': apiKey }
    });
    console.log(`Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log(`Response: ${text.substring(0, 200)}`);
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

testBunny();
