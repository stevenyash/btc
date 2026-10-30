import { Router, Request, Response, NextFunction } from 'express';
import DB from '../models/db.js';
import bunnyService from '../services/bunnyService.js';
import fs from 'fs';
import mailer from '../helpers/mailer.js';
import multer from 'multer';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import BunnyHelper from '../helpers/bunnyHelper.js';

const router = Router();

interface AdminPaymentAttempt {
  checkout_request_id: string;
  activation_status: string;
  business_metadata: unknown;
  callback_amount: number | string | null;
  callback_phone: string | null;
}

function parsePaymentMetadata(value: unknown, transactionId: number): Record<string, unknown> {
  let metadata = value;
  if (typeof metadata === 'string') {
    try {
      metadata = JSON.parse(metadata) as unknown;
    } catch {
      throw new Error(`Payment metadata for transaction ${transactionId} is invalid JSON`);
    }
  }
  if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
    throw new Error(`Payment metadata for transaction ${transactionId} is not an object`);
  }
  return metadata as Record<string, unknown>;
}

const lessonUpload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowedTypes = new Set([
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      'video/x-matroska',
    ]);
    callback(null, allowedTypes.has(file.mimetype));
  },
});

function handleLessonUpload(req: Request, res: Response, next: NextFunction) {
  lessonUpload.single('video')(req, res, (error) => {
    if (!error) return next();
    const status = 'code' in error && error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ error: error.message });
  });
}

function serializeAdminLesson(lesson: any) {
  const area = lesson.learning_area;
  const grade = area?.grade_info;
  const topic = lesson.topic;
  const subtopic = lesson.subtopic;

  return {
    ...lesson,
    level: grade?.learning_level?.name || '',
    level_id: grade?.learning_level?.level_id,
    grade: grade?.name || '',
    grade_id: grade?.id,
    area_name: area?.name || '',
    subject: topic?.name || '',
    strand: subtopic?.name || '',
    video_url: lesson.bunny_url || lesson.s3_url || '',
    duration_minutes: lesson.duration ?? undefined,
    file_size_mb: lesson.file_size ? Number(lesson.file_size) / (1024 * 1024) : undefined,
    file_type: path.extname(lesson.filename || lesson.file || '').slice(1),
    status: lesson.is_active ? 'active' : 'inactive',
  };
}

async function findAdminLesson(id: string) {
  return DB.Lessons.findByPk(id, {
    include: [
      {
        model: DB.LearningAreas,
        as: 'learning_area',
        attributes: ['id', 'name', 'grade_id'],
        include: [{
          model: DB.Grades,
          as: 'grade_info',
          attributes: ['id', 'name', 'level_id'],
          include: [{
            model: DB.LearningLevels,
            as: 'learning_level',
            attributes: ['level_id', 'name'],
          }],
        }],
      },
      { model: DB.Topics, as: 'topic', attributes: ['topic_id', 'name'] },
      { model: DB.Subtopics, as: 'subtopic', attributes: ['subtopic_id', 'name'] },
    ],
    raw: true,
    nest: true,
  });
}

interface HierarchyResource {
  path: string;
  model: any;
  idField: string;
  fields: string[];
}

const hierarchyResources: HierarchyResource[] = [
  {
    path: 'learning_levels',
    model: DB.LearningLevels,
    idField: 'level_id',
    fields: ['name', 'description', 'is_active'],
  },
  {
    path: 'grades',
    model: DB.Grades,
    idField: 'id',
    fields: ['name', 'description', 'level_id', 'is_active'],
  },
  {
    path: 'learning_areas',
    model: DB.LearningAreas,
    idField: 'id',
    fields: ['name', 'description', 'grade_id', 'icon', 'color', 'is_active'],
  },
  {
    path: 'topics',
    model: DB.Topics,
    idField: 'topic_id',
    fields: ['name', 'area_id'],
  },
  {
    path: 'subtopics',
    model: DB.Subtopics,
    idField: 'subtopic_id',
    fields: ['name', 'topic_id'],
  },
];

for (const resource of hierarchyResources) {
  const serialize = (record: any) => ({
    ...record,
    id: record[resource.idField],
    description: record.description || '',
    is_active: record.is_active ?? true,
    sort_order: record.sort_order ?? 0,
  });

  const pickFields = (body: Record<string, unknown>) =>
    Object.fromEntries(
      resource.fields
        .filter((field) => body[field] !== undefined)
        .map((field) => [field, body[field]])
    );

  router.get(`/${resource.path}`, async (_req: Request, res: Response) => {
    try {
      const records = await resource.model.findAll({
        order: [['name', 'ASC']],
        raw: true,
      });
      return res.json(records.map(serialize));
    } catch (error) {
      console.error(`Error fetching admin ${resource.path}:`, error);
      return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  router.post(`/${resource.path}`, async (req: Request, res: Response) => {
    try {
      const data = pickFields(req.body || {});
      if (typeof data.name !== 'string' || !data.name.trim()) {
        return res.status(400).json({ error: 'A name is required' });
      }
      const record = await resource.model.create(data);
      return res.status(201).json(serialize(record.get({ plain: true })));
    } catch (error) {
      console.error(`Error creating admin ${resource.path} record:`, error);
      return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  router.put(`/${resource.path}/:id`, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'A valid record ID is required' });
      }

      const record = await resource.model.findByPk(id);
      if (!record) {
        return res.status(404).json({ error: `${resource.path} record not found` });
      }

      const data = pickFields(req.body || {});
      await record.update(data);
      return res.json(serialize(record.get({ plain: true })));
    } catch (error) {
      console.error(`Error updating admin ${resource.path} record:`, error);
      return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  router.delete(`/${resource.path}/:id`, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'A valid record ID is required' });
      }

      const record = await resource.model.findByPk(id);
      if (!record) {
        return res.status(404).json({ error: `${resource.path} record not found` });
      }

      await record.destroy();
      return res.json({ success: true });
    } catch (error) {
      console.error(`Error deleting admin ${resource.path} record:`, error);
      return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });
}

router.get('/grades_option_list', async (_req: Request, res: Response) => {
  try {
    const areas = await DB.LearningAreas.findAll({
      where: { is_active: true },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
      raw: true,
    });
    return res.json(areas);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get('/subjects_option_list', async (_req: Request, res: Response) => {
  try {
    const topics = await DB.Topics.findAll({
      attributes: ['topic_id', 'name'],
      order: [['name', 'ASC']],
      raw: true,
    });
    return res.json(topics.map((topic: any) => ({ id: topic.topic_id, name: topic.name })));
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get('/strands_option_list', async (_req: Request, res: Response) => {
  try {
    const subtopics = await DB.Subtopics.findAll({
      attributes: ['subtopic_id', 'name'],
      order: [['name', 'ASC']],
      raw: true,
    });
    return res.json(subtopics.map((subtopic: any) => ({ id: subtopic.subtopic_id, name: subtopic.name })));
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get('/admin_lessons', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));
    const { count, rows } = await DB.Lessons.findAndCountAll({
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']],
      include: [
        {
          model: DB.LearningAreas,
          as: 'learning_area',
          attributes: ['id', 'name', 'grade_id'],
          include: [{
            model: DB.Grades,
            as: 'grade_info',
            attributes: ['id', 'name', 'level_id'],
            include: [{
              model: DB.LearningLevels,
              as: 'learning_level',
              attributes: ['level_id', 'name'],
            }],
          }],
        },
        { model: DB.Topics, as: 'topic', attributes: ['topic_id', 'name'] },
        { model: DB.Subtopics, as: 'subtopic', attributes: ['subtopic_id', 'name'] },
      ],
      raw: true,
      nest: true,
    });

    return res.json({ data: rows.map(serializeAdminLesson), total: count });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get('/admin_lessons/:id', async (req: Request, res: Response) => {
  try {
    const lesson = await findAdminLesson(String(req.params.id));
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    return res.json(serializeAdminLesson(lesson));
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post('/admin_lessons/upload', handleLessonUpload, async (req: Request, res: Response) => {
  const videoFile = req.file;
  let uploadedVideoId: string | undefined;

  try {
    if (!videoFile) {
      return res.status(400).json({ error: 'A supported video file is required (MP4, MOV, AVI, WebM, or MKV)' });
    }

    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    const areaId = Number(req.body.area_id);
    const topicId = Number(req.body.topic_id);
    const subtopicId = req.body.subtopic_id ? Number(req.body.subtopic_id) : undefined;
    if (!title || !Number.isInteger(areaId) || areaId <= 0 || !Number.isInteger(topicId) || topicId <= 0) {
      return res.status(400).json({ error: 'Title, area_id, and topic_id are required' });
    }
    if (subtopicId !== undefined && (!Number.isInteger(subtopicId) || subtopicId <= 0)) {
      return res.status(400).json({ error: 'subtopic_id must be a positive integer' });
    }

    const [area, topic, subtopic] = await Promise.all([
      DB.LearningAreas.findByPk(areaId),
      DB.Topics.findByPk(topicId),
      subtopicId ? DB.Subtopics.findByPk(subtopicId) : Promise.resolve(null),
    ]);
    if (!area || !topic || topic.area_id !== areaId) {
      return res.status(400).json({ error: 'The selected subject does not belong to the selected grade' });
    }
    if (subtopicId && (!subtopic || subtopic.topic_id !== topicId)) {
      return res.status(400).json({ error: 'The selected strand does not belong to the selected subject' });
    }

    const uploadResult = await BunnyHelper.handleVideoUpload(videoFile.path, { title });
    uploadedVideoId = uploadResult.data.guid;

    const lesson = await DB.Lessons.create({
      title,
      description: typeof req.body.description === 'string' ? req.body.description : '',
      area_id: areaId,
      topic_id: topicId,
      subtopic_id: subtopicId || null,
      bunny_video_id: uploadedVideoId,
      video_guid: uploadedVideoId,
      bunny_url: uploadResult.data.videoUrl,
      thumbnail_url: uploadResult.data.thumbnailUrl,
      filename: videoFile.originalname,
      file_size: videoFile.size,
      price: Number(req.body.price) || 0,
      is_preview_available: req.body.is_preview_available === 'true',
      preview_duration: Number(req.body.preview_duration) || 0,
      is_active: true,
      transcoding_status: uploadResult.data.status || 'processing',
    });

    const savedLesson = await findAdminLesson(String(lesson.id));
    return res.status(201).json(savedLesson ? serializeAdminLesson(savedLesson) : lesson);
  } catch (error) {
    if (uploadedVideoId) await BunnyHelper.handleVideoDeletion(uploadedVideoId);
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  } finally {
    if (videoFile && fs.existsSync(videoFile.path)) {
      await fs.promises.unlink(videoFile.path);
    }
  }
});

router.put('/admin_lessons/:id', async (req: Request, res: Response) => {
  try {
    const lesson = await DB.Lessons.findByPk(String(req.params.id));
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const updates: Record<string, unknown> = {};
    for (const field of ['title', 'description', 'area_id', 'topic_id', 'subtopic_id', 'thumbnail_url', 's3_url']) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    if (req.body.video_url !== undefined) updates.bunny_url = req.body.video_url;
    if (req.body.duration !== undefined) {
      const duration = Number(req.body.duration);
      if (!Number.isFinite(duration) || duration < 0) return res.status(400).json({ error: 'duration must be a non-negative number' });
      updates.duration = duration;
    }
    if (req.body.status !== undefined) {
      if (req.body.status !== 'active' && req.body.status !== 'inactive') {
        return res.status(400).json({ error: 'status must be active or inactive' });
      }
      updates.is_active = req.body.status === 'active';
    }

    await lesson.update(updates);
    const updatedLesson = await findAdminLesson(String(req.params.id));
    return res.json(updatedLesson ? serializeAdminLesson(updatedLesson) : lesson);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.patch('/admin_lessons/:id/toggle', async (req: Request, res: Response) => {
  try {
    const lesson = await DB.Lessons.findByPk(String(req.params.id));
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    await lesson.update({ is_active: !lesson.is_active });
    return res.json({
      id: lesson.id,
      is_active: lesson.is_active,
      status: lesson.is_active ? 'active' : 'inactive',
    });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.delete('/admin_lessons/:id', async (req: Request, res: Response) => {
  try {
    const lesson = await DB.Lessons.findByPk(String(req.params.id));
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    if (lesson.bunny_video_id || lesson.storage_path) {
      const deletion = await BunnyHelper.handleVideoDeletion(lesson.bunny_video_id, lesson.storage_path);
      if (!deletion.success || deletion.data.streamDeleted === false || deletion.data.storageDeleted === false) {
        return res.status(502).json({ error: deletion.error || 'Failed to delete lesson video' });
      }
    }
    await lesson.destroy();
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// Get admin stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalSubscriptions,
      activeSubscriptions,
      totalRevenue,
      pendingPayments
    ] = await Promise.all([
      DB.Users.count(),
      DB.Users.count({ where: { account_status: 'active' } }),
      DB.Subscriptions.count(),
      DB.Subscriptions.count({ where: { status: 'active' } }),
      DB.Transactions.sum('amount', { where: { status: 'success' } }) || 0,
      DB.Transactions.count({ where: { status: 'pending' } })
    ]);

    return res.json({
      total_users: totalUsers,
      active_users: activeUsers,
      total_subscriptions: totalSubscriptions,
      active_subscriptions: activeSubscriptions,
      total_revenue: totalRevenue,
      pending_payments: pendingPayments,
      monthly_growth: 0
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get recent users
router.get('/recent-users', async (req: Request, res: Response) => {
  try {
     const users = await DB.Users.findAll({
       order: [['id', 'DESC']],
       limit: 5,
       raw: true
     });

    const recentUsers = users.map((u: any) => ({
      id: u.id,
      name: u.username || u.first_name || 'Unknown',
      email: u.email || '',
      status: u.account_status || 'active',
      created_at: u.created_at
    }));

    return res.json(recentUsers);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get recent transactions
router.get('/recent-transactions', async (req: Request, res: Response) => {
  try {
    const transactions = await DB.Transactions.findAll({
      order: [['created_at', 'DESC']],
      limit: 5,
      include: [
        { model: DB.Users, as: 'user', attributes: ['username', 'email'] }
      ]
    });

    const recentTransactions = transactions.map((t: any) => ({
      id: t.id,
      user: t.user?.username || 'Unknown',
      type: t.transaction_type || 'payment',
      amount: parseFloat(t.amount) || 0,
      status: t.status || 'pending',
      created_at: t.created_at
    }));

    return res.json(recentTransactions);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get subscription types
router.get('/subscription-types', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await DB.SubscriptionTypes.findAndCountAll({
      limit,
      offset,
      order: [['created_at', 'DESC']],
      raw: true
    });

    return res.json({
      data: rows,
      total: count
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/subscription-types/:id', async (req: Request, res: Response) => {
  try {
    const subscriptionType = await DB.SubscriptionTypes.findByPk(req.params.id, { raw: true });
    if (!subscriptionType) {
      return res.status(404).json({ error: 'Subscription type not found' });
    }
    return res.json(subscriptionType);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/subscription-types', async (req: Request, res: Response) => {
  try {
    const record = await DB.SubscriptionTypes.create(req.body);
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.put('/subscription-types/:id', async (req: Request, res: Response) => {
  try {
    const record = await DB.SubscriptionTypes.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Subscription type not found' });
    }
    await record.update(req.body);
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.delete('/subscription-types/:id', async (req: Request, res: Response) => {
  try {
    const record = await DB.SubscriptionTypes.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Subscription type not found' });
    }
    await record.destroy();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const role = req.query.role as string;
    const status = req.query.status as string;

    const where: any = {};
    if (role) where.user_role_id = role;
    if (status) where.account_status = status;

     const { count, rows } = await DB.Users.findAndCountAll({
       where,
       limit,
       offset,
       order: [['id', 'DESC']],
      include: [
        { model: DB.Roles, as: 'roles', attributes: ['role_name'] }
      ],
      raw: true,
      nest: true
    });

    const users = rows.map((u: any) => ({
      id: u.id,
      name: u.username || u.first_name || 'Unknown',
      email: u.email || '',
      phone: u.phone || '',
      role: u.roles?.role_name || 'user',
      role_id: u.user_role_id,
      status: u.account_status || 'active',
      subscription_code: u.subscription_code || '',
      created_at: u.created_at
    }));

    return res.json({
      users,
      pagination: { total: count }
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await DB.Users.findByPk(req.params.id, {
      include: [{ model: DB.Roles, as: 'roles' }],
      raw: true,
      nest: true
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await DB.Users.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    await user.update(req.body);
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await DB.Users.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    await user.destroy();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/support-tickets', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const where: Record<PropertyKey, unknown> = {};

    if (status) {
      if (!['open', 'in_progress', 'resolved'].includes(status)) {
        return res.status(400).json({ error: 'Invalid support ticket status' });
      }
      where.status = status;
    }
    if (search) {
      where[DB.op.or] = [
        { customer_name: { [DB.op.like]: `%${search}%` } },
        { customer_email: { [DB.op.like]: `%${search}%` } },
        { phone_number: { [DB.op.like]: `%${search}%` } },
        { payment_reference: { [DB.op.like]: `%${search}%` } },
        { subject: { [DB.op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await DB.SupportTickets.findAndCountAll({
      where,
      attributes: [
        'id',
        'customer_name',
        'customer_email',
        'phone_number',
        'payment_reference',
        'category',
        'subject',
        'description',
        'status',
        'admin_response',
        'created_at',
        'updated_at',
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['created_at', 'DESC']],
      raw: true,
    });

    return res.json({
      data: rows.map((ticket: any) => ({
        ...ticket,
        reference: `BTC-${String(ticket.id).padStart(8, '0')}`,
      })),
      total: count,
    });
  } catch (error) {
    console.error('Failed to retrieve support tickets:', error);
    return res.status(500).json({ error: 'Unable to retrieve support tickets' });
  }
});

router.put('/support-tickets/:id', async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return res.status(400).json({ error: 'A valid support ticket ID is required' });
    }

    const ticket = await DB.SupportTickets.findByPk(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }

    const { status, response } = req.body || {};
    if (status !== undefined && !['open', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid support ticket status' });
    }
    if (response !== undefined && (typeof response !== 'string' || response.length > 5000)) {
      return res.status(400).json({ error: 'Response must be 5000 characters or fewer' });
    }
    if (status === undefined && response === undefined) {
      return res.status(400).json({ error: 'Provide a status or customer response to save' });
    }

    const changes: Record<string, unknown> = {};
    if (status !== undefined) {
      changes.status = status;
      changes.resolved_at = status === 'resolved' ? new Date() : null;
    }
    if (response !== undefined) {
      changes.admin_response = response.trim() || null;
    }
    changes.handled_by_user_id = req.user?.id || null;
    await ticket.update(changes);

    return res.json({
      id: ticket.id,
      reference: `BTC-${String(ticket.id).padStart(8, '0')}`,
      status: ticket.status,
      response: ticket.admin_response,
      updated_at: ticket.updated_at,
    });
  } catch (error) {
    console.error('Failed to update support ticket:', error);
    return res.status(500).json({ error: 'Unable to update support ticket' });
  }
});

// Get transactions
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));
    const offset = (page - 1) * limit;
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const filters: any[] = [];

    if (status) {
      const statuses = status.toLowerCase() === 'completed'
        ? ['completed', 'success']
        : [status];
      const fallbackPaymentStatus = {
        [DB.op.and]: [
          { [DB.op.or]: [{ status: { [DB.op.is]: null } }, { status: '' }] },
          { payment_status: status.toLowerCase() === 'success' ? 'completed' : status },
        ],
      };
      filters.push({
        [DB.op.or]: [
          ...statuses.map((value) => ({ status: value })),
          fallbackPaymentStatus,
        ],
      });
    }
    if (search) {
      const like = { [DB.op.like]: `%${search}%` };
      filters.push({
        [DB.op.or]: [
          { phone_number: like },
          { transaction_reference: like },
          { checkout_request_id: like },
          { description: like },
          { status: like },
          { payment_status: like },
          { '$user.username$': like },
          { '$user.email$': like },
        ],
      });
    }

    const { count, rows } = await DB.Transactions.findAndCountAll({
      where: filters.length > 0 ? { [DB.op.and]: filters } : {},
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: DB.Users, as: 'user', attributes: ['username', 'email'] }
      ],
      raw: true,
      nest: true
    });

    const checkoutRequestIds = rows
      .map((transaction: any) => transaction.checkout_request_id)
      .filter((checkoutRequestId: unknown): checkoutRequestId is string =>
        typeof checkoutRequestId === 'string' && checkoutRequestId.length > 0
      );
    const paymentAttempts: AdminPaymentAttempt[] = checkoutRequestIds.length > 0
      ? await DB.MpesaPaymentAttempts.findAll({
        where: { checkout_request_id: checkoutRequestIds },
        attributes: ['checkout_request_id', 'activation_status', 'business_metadata', 'callback_amount', 'callback_phone'],
        raw: true,
      })
      : [];
    const attemptsByCheckoutId = new Map<string, AdminPaymentAttempt>(
      paymentAttempts.map((attempt): [string, AdminPaymentAttempt] => [
        attempt.checkout_request_id,
        attempt,
      ])
    );

    const transactions = rows.map((t: any) => {
      const attempt = attemptsByCheckoutId.get(t.checkout_request_id);
      const metadata = attempt ? parsePaymentMetadata(attempt.business_metadata, t.id) : null;

      const amount = Number(t.amount);
      if (!Number.isFinite(amount)) {
        throw new Error(`Transaction ${t.id} has an invalid amount`);
      }
      const callbackAmount = attempt?.callback_amount == null ? null : Number(attempt.callback_amount);
      if (callbackAmount !== null && !Number.isFinite(callbackAmount)) {
        throw new Error(`Payment callback amount for transaction ${t.id} is invalid`);
      }
      return {
        id: t.id,
        user: t.user?.username || 'Unknown',
        type: t.transaction_type || 'payment',
        amount,
        status: t.status || t.payment_status || 'pending',
        payment_status: t.payment_status || null,
        phone_number: t.phone_number || attempt?.callback_phone || null,
        transaction_reference: t.transaction_reference || null,
        checkout_request_id: t.checkout_request_id || null,
        callback_amount: callbackAmount,
        activation_status: attempt?.activation_status || null,
        activation_type: metadata && typeof metadata.activationType === 'string'
          ? metadata.activationType
          : null,
        lesson_id: metadata && Number.isInteger(Number(metadata.lessonId)) && Number(metadata.lessonId) > 0
          ? Number(metadata.lessonId)
          : null,
        created_at: t.created_at
      };
    });

    return res.json({
      data: transactions,
      total: count
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.put('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const transaction = await DB.Transactions.findByPk(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    await transaction.update(req.body);
    return res.json(transaction);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.delete('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const transaction = await DB.Transactions.findByPk(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    await transaction.destroy();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get marketers
router.get('/marketers', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

     const { count, rows } = await DB.Marketers.findAndCountAll({
       limit,
       offset,
       order: [['join_date', 'DESC']],
      include: [
        { model: DB.Users, as: 'user', attributes: ['username', 'email', 'phone'] }
      ],
      raw: true,
      nest: true
    });

     const marketers = rows.map((m: any) => ({
       id: m.id,
       user_id: m.user_id,
       user_name: m.user?.username || 'Unknown',
       email: m.user?.email || '',
       phone: m.user?.phone || '',
       referral_code: m.referral_code || '',
       total_invites: m.total_invites || 0,
       active_referrals: m.active_referrals || 0,
       total_earnings: m.total_earnings || 0,
       pending_earnings: m.pending_earnings || 0,
       status: m.status || 'active',
       created_at: m.join_date || null
     }));

    return res.json({
      data: marketers,
      total: count
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/marketers', async (req: Request, res: Response) => {
  try {
    const record = await DB.Marketers.create(req.body);
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.put('/marketers/:id', async (req: Request, res: Response) => {
  try {
    const record = await DB.Marketers.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Marketer not found' });
    }
    await record.update(req.body);
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.delete('/marketers/:id', async (req: Request, res: Response) => {
  try {
    const record = await DB.Marketers.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Marketer not found' });
    }
    await record.destroy();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get available users for marketer
router.get('/users-available-for-marketer', async (req: Request, res: Response) => {
  try {
    const users = await DB.Users.findAll({
      where: {
        id: {
          [DB.op.notIn]: DB.raw('(SELECT user_id FROM marketers WHERE user_id IS NOT NULL)')
        }
      },
      attributes: ['id', 'username', 'email'],
      raw: true
    });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Marketer commissions
router.get('/marketer-commissions', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;

    const where: any = {};
    if (status) where.status = status;

    const { count, rows } = await DB.MarketerCommissions.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: DB.Marketers, as: 'marketer' },
        { model: DB.Users, as: 'user' },
        { model: DB.Transactions, as: 'transaction' }
      ],
      raw: true,
      nest: true
    });

    return res.json({
      data: rows,
      total: count
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.put('/marketer-commissions/:id', async (req: Request, res: Response) => {
  try {
    const record = await DB.MarketerCommissions.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Commission not found' });
    }
    await record.update(req.body);
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Marketer withdrawals
router.get('/marketer-withdrawals', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;

    const where: any = {};
    if (status) where.status = status;

    const { count, rows } = await DB.MarketerWithdrawals.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: DB.Marketers, as: 'marketer' }
      ],
      raw: true,
      nest: true
    });

    return res.json({
      data: rows,
      total: count
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.put('/marketer-withdrawals/:id', async (req: Request, res: Response) => {
  try {
    const record = await DB.MarketerWithdrawals.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }
    await record.update(req.body);
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Marketer redemptions
router.get('/marketer-redemptions', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;

    const where: any = {};
    if (status) where.status = status;

    const { count, rows } = await DB.MarketerPointRedemptions.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: DB.Marketers, as: 'marketer' }
      ],
      raw: true,
      nest: true
    });

    return res.json({
      data: rows,
      total: count
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.put('/marketer-redemptions/:id', async (req: Request, res: Response) => {
  try {
    const record = await DB.MarketerPointRedemptions.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Redemption not found' });
    }
    await record.update(req.body);
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Resend marketer credentials
router.post('/marketers/:id/resend-credentials', async (req: Request, res: Response) => {
  try {
    const marketerId = req.params.id;
    const marketer = await DB.Marketers.findByPk(marketerId, {
      include: [
        { model: DB.Users, as: 'user', attributes: ['username', 'email', 'phone'] }
      ]
    });

    if (!marketer) {
      return res.status(404).json({ error: 'Marketer not found' });
    }

    if (!marketer.user) {
      return res.status(400).json({ error: 'Marketer has no associated user' });
    }

    const emailSubject = "Your BTC Marketer Account Credentials";
    const emailBody = `
      <h2>Welcome to BTC Marketer Program!</h2>
      <p>Hello ${marketer.user.username},</p>
      <p>Your marketer account has been activated. Here are your login details:</p>
      <ul>
        <li><strong>Email:</strong> ${marketer.user.email}</li>
        <li><strong>Phone:</strong> ${marketer.user.phone || 'Not provided'}</li>
        <li><strong>Referral Code:</strong> ${marketer.referral_code || 'Not generated yet'}</li>
      </ul>
      <p>You can use your email or phone to log in to the marketer portal.</p>
      <p>Best regards,<br/>BTC Team</p>
    `;

    await mailer.sendMail(marketer.user.email, emailSubject, emailBody);

    return res.json({ success: true, message: 'Credentials resent successfully' });
  } catch (err) {
    console.error('Error resending marketer credentials:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
