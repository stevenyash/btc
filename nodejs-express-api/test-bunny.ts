import bunnyService from './services/bunnyService.js';

async function main() {
  try {
    console.log('Fetching stream videos (page 1, 1 item per page)...');
    const videos = await bunnyService.getStreamVideos(1, 1);
    console.log('Videos result:', JSON.stringify(videos, null, 2));
  } catch (error: any) {
    console.error('Error fetching videos:', error.message);
  }

  try {
    console.log('\nFetching stream collections...');
    const collections = await bunnyService.getStreamCollections();
    console.log('Collections result:', JSON.stringify(collections, null, 2));
  } catch (error: any) {
    console.error('Error fetching collections:', error.message);
  }
}

main();
