import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import validateFormData from '../helpers/validate_form.js';
import DB from '../models/db.ts';
import uploader from '../helpers/uploader.js';
import bunnyVideoDelivery from '../services/bunnyVideoDelivery.js';
import { validateLessonAccess, validateLessonCreate, validateLessonUpdate } from '../middleware/validationMiddleware.js';
import { streamLimiter, generalLimiter, uploadLimiter } from '../middleware/rateLimiters.js';
import config from '../config/lessons.js';
import jwt from 'jsonwebtoken';

const router = Router();

router.use(generalLimiter);

async function beforeAdd(postdata: any, req: any) {
  console.log('Before add - preparing lesson data:', postdata);

  if (postdata.topic_id) {
    const topic = await DB.Topics.findOne({
      where: { topic_id: postdata.topic_id },
      raw: true
    });
    if (!topic) {
      throw new Error('Invalid topic ID');
    }
  }

  if (postdata.subtopic_id) {
    const subtopic = await DB.Subtopics.findOne({
      where: { subtopic_id: postdata.subtopic_id },
      raw: true
    });
    if (!subtopic) {
      throw new Error('Invalid subtopic ID');
    }
  }
}

async function afterAdd(record: any, req: any) {
  try {
    console.log('Starting afterAdd - lesson:', record.id);
    if (record.file) {
      const options = {
        title: record.title || 'Untitled Lesson',
        description: record.description || '',
        visibility: record.is_preview_available ? 'public' : 'private'
      };
      
      const uploadResult = await bunnyVideoDelivery.uploadVideo(
        record.file,
        record.filename || `lesson_${record.id}.mp4`,
        options
      );

      await DB.Lessons.update(
        {
          s3_key: uploadResult.key,
          s3_url: uploadResult.url,
          file_size: uploadResult.size
        },
        { where: { id: record.id } }
      );

      uploader.deleteRecordFiles(record.file, 'file');
    }
  } catch (error: any) {
    console.error('Error in afterAdd:', error.message);
  }
}

router.get(['/', '/index/:fieldname?/:fieldvalue?'], async (req: Request, res: Response) => {
  try {
    const query: any = {};
    const queryFilters: any[] = [];
    const where: any = {};
    const replacements: any = {};

    const fieldName = req.params.fieldname;
    const fieldValue = req.params.fieldvalue;

    if (fieldName) {
      queryFilters.push(DB.filterBy(fieldName, fieldValue));
    }

    const search = req.query.search;
    if (search) {
      const searchFields = DB.Lessons.searchFields();
      where[DB.op.or] = searchFields;
      replacements.search = `%${search}%`;
    }

    if (queryFilters.length) {
      where[DB.op.and] = queryFilters;
    }

    query.raw = true;
    query.where = where;
    query.replacements = replacements;
    query.order = DB.getOrderBy(req, 'id', 'desc');
    query.attributes = DB.Lessons.listFields();

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await DB.Lessons.paginate(query, page, limit);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/view/:recid', async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid || null;
    const query: any = {};
    const where: any = {};

    where['id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.Lessons.viewFields();

    const record: any = await DB.Lessons.findOne(query);
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    if (record.s3_key) {
      record.dataValues.video_url = bunnyVideoDelivery.generatePublicUrl(record.s3_key);
    }

    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/stream-url/:recid', streamLimiter, validateLessonAccess, async (req: Request, res: Response) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const recid = req.params.recid;
    const { expiresIn = 3600 } = req.query;

    const record: any = await DB.Lessons.findOne({
      where: { id: recid },
      include: [
        { model: DB.LearningAreas, as: 'learning_area', attributes: ['id', 'name'] },
        { model: DB.Topics, as: 'topic', attributes: ['topic_id', 'name'] },
        { model: DB.Subtopics, as: 'subtopic', attributes: ['subtopic_id', 'name'] }
      ]
    });

    if (!record) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    if (!record.s3_key) {
      return res.status(400).json({ error: 'Lesson video not available' });
    }

    const user_id = req.user?.id || req.query.user_id;
    const expiresInNum = parseInt(expiresIn as string);

    const secureData = bunnyVideoDelivery.generateSecureUrl(
      record.s3_key,
      user_id?.toString() || 'guest',
      recid,
      {
        expiresIn: expiresInNum,
        disableDownload: true,
        maxPlays: 3
      }
    );

    return res.json({
      success: true,
      video_url: secureData.signedUrl,
      is_hls: false,
      thumbnail_url: record.thumbnail_url,
      title: record.title,
      duration: record.duration,
      area: record.learning_area?.name,
      topic: record.topic?.name,
      subtopic: record.subtopic?.name,
      expires_in: expiresInNum,
      security: secureData.security
    });
  } catch (err) {
    console.error('Error in stream-url:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/edit/:recid', [
  body('title').optional({ nullable: true, checkFalsy: true }),
  body('file').optional({ nullable: true, checkFalsy: true }),
  body('is_preview_available').optional({ nullable: true, checkFalsy: true }),
  body('description').optional({ nullable: true, checkFalsy: true }),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid;
    const modeldata = (req as any).getValidFormData({ includeOptionals: true });

    if (modeldata.file !== undefined) {
      const fileInfo = uploader.moveUploadedFiles(modeldata.file, 'file');
      modeldata.file = fileInfo.filepath;
      modeldata.filename = fileInfo.filename;

      const options = {
        title: modeldata.title || 'Untitled Lesson',
        description: modeldata.description || '',
        visibility: modeldata.is_preview_available ? 'public' : 'private'
      };

      const uploadResult = await bunnyVideoDelivery.uploadVideo(
        modeldata.file,
        modeldata.filename,
        options
      );

      modeldata.s3_key = uploadResult.key;
      modeldata.s3_url = uploadResult.url;
      modeldata.file_size = uploadResult.size;

      const oldRecord = await DB.Lessons.findOne({ where: { id: recid } });
      if (oldRecord && oldRecord.s3_key) {
        try {
          await bunnyVideoDelivery.deleteVideo(oldRecord.s3_key);
        } catch (deleteError: any) {
          console.warn('Could not delete old video:', deleteError.message);
        }
      }

      uploader.deleteRecordFiles(modeldata.file, 'file');
    }

    const where: any = { id: recid };
    await DB.Lessons.update(modeldata, { where });
    
    const query: any = { raw: true, where, attributes: DB.Lessons.editFields() };
    const record = await DB.Lessons.findOne(query);
    
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/delete/:recid', async (req: Request, res: Response) => {
  try {
    const recid = (req.params.recid || '').split(',');
    const query: any = {};
    const where: any = { id: recid };
    query.raw = true;
    query.where = where;

    const records: any[] = await DB.Lessons.findAll(query);

    for (const record of records) {
      if (record.s3_key) {
        try {
          await bunnyVideoDelivery.deleteVideo(record.s3_key);
        } catch (err: any) {
          console.error('Error deleting video:', err.message);
        }
      }
      uploader.deleteRecordFiles(record.file, 'file');
    }

    await DB.Lessons.destroy(query);
    return res.json(recid);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
