import fetch from 'node-fetch';

const apiKey = 'd14fe46f-d0f5-45c7-b90dd58bf1e0-d37b-4134';
const libraryId = '644183';
const baseUrl = 'https://video.bunnycdn.com';

async function testCreateVideo() {
  console.log('Creating video entry in Bunny Stream library...\n');

  try {
    const res = await fetch(`${baseUrl}/library/${libraryId}/videos`, {
      method: 'POST',
      headers: {
        'AccessKey': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Video Upload',
        description: 'Testing upload functionality',
      }),
    });

    console.log(`Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log(`Response: ${text}`);

    if (res.ok) {
      try {
        const data = JSON.parse(text);
        console.log('\nVideo GUID:', data.guid);
      } catch { }
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

testCreateVideo();
