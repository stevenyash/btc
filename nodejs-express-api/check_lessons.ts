import dotenv from 'dotenv';
dotenv.config();
import { sequelize, Op } from './models/basemodel.js';
import Lessons from './models/lessons.js';

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');
    
    const total = await Lessons.count();
    console.log('Total lessons:', total);
    
    const withVideoId = await Lessons.count({
      where: { bunny_video_id: { [Op.not]: null } }
    });
    console.log('With bunny_video_id:', withVideoId);
    
    const withStorage = await Lessons.count({
      where: { storage_path: { [Op.not]: null } }
    });
    console.log('With storage_path:', withStorage);
    
    const withS3Key = await Lessons.count({
      where: { s3_key: { [Op.not]: null } }
    });
    console.log('With s3_key:', withS3Key);
    
    const withS3Url = await Lessons.count({
      where: { s3_url: { [Op.not]: null } }
    });
    console.log('With s3_url:', withS3Url);
    
    // Get a sample
    const sample = await Lessons.findAll({
      attributes: ['id', 'title', 's3_key', 's3_url', 'bunny_video_id', 'storage_path'],
      limit: 3
    });
    console.log('\nSample lessons:', JSON.stringify(sample, null, 2));
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await sequelize.close();
  }
})();
