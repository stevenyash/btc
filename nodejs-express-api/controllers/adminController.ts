import { Router, Request, Response } from 'express';
import DB from '../models/db.js';
import bunnyService from '../services/bunnyService.js';
import fs from 'fs';

const router = Router();

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

// Get transactions
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await DB.Transactions.findAndCountAll({
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: DB.Users, as: 'user', attributes: ['username', 'email'] }
      ],
      raw: true,
      nest: true
    });

    const transactions = rows.map((t: any) => ({
      id: t.id,
      user: t.user?.username || 'Unknown',
      type: t.transaction_type || 'payment',
      amount: t.amount || 0,
      status: t.status || 'pending',
      created_at: t.created_at
    }));

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

// Commission settings
router.get('/commission-settings', async (req: Request, res: Response) => {
  try {
    const settings = await DB.rawQueryOne('SELECT * FROM system_settings WHERE setting_key LIKE "commission_%" OR setting_key LIKE "point_%" OR setting_key LIKE "min_%" LIMIT 1');
    return res.json(settings || {});
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.put('/commission-settings', async (req: Request, res: Response) => {
  try {
    // Update system settings - this depends on your system_settings table structure
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Grades option list (simple id + name)
router.get('/grades_option_list', async (req: Request, res: Response) => {
  try {
    const grades = await DB.Grades.findAll({
      where: { is_active: true },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
      raw: true
    });
    return res.json(grades);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Subjects/Learning Areas option list (simple id + name)
router.get('/subjects_option_list', async (req: Request, res: Response) => {
  try {
    const subjects = await DB.LearningAreas.findAll({
      where: { is_active: true },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
      raw: true
    });
    return res.json(subjects);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Strands/Topics option list (simple id + name)
router.get('/strands_option_list', async (req: Request, res: Response) => {
  try {
    const strands = await DB.Topics.findAll({
      attributes: ['topic_id', 'name'],
      order: [['name', 'ASC']],
      raw: true
    });
    // Map topic_id to id for frontend compatibility
    const mapped = strands.map(s => ({
      id: s.topic_id,
      name: s.name
    }));
    return res.json(mapped);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Admin Lessons CRUD
router.get('/admin_lessons', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await DB.Lessons.findAndCountAll({
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: DB.LearningAreas, as: 'learning_area', attributes: ['id', 'name'] },
        { model: DB.Topics, as: 'topic', attributes: ['topic_id', 'name'] },
        { model: DB.Subtopics, as: 'subtopic', attributes: ['subtopic_id', 'name'] }
      ],
      raw: true,
      nest: true
    });

    const lessons = rows.map((l: any) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      grade: l.learning_area?.name || '',
      subject: l.learning_area?.name || '',
      strand: l.topic?.name || '',
      subtopic: l.subtopic?.name || '',
      s3_url: l.s3_url,
      s3_key: l.s3_key,
      storage_path: l.storage_path,
      bunny_url: l.bunny_url,
      thumbnail_url: l.thumbnail_url,
      duration_minutes: l.duration,
      file_size_mb: l.file_size ? Math.round(l.file_size / 1048576 * 100) / 100 : undefined,
      file_type: 'video/mp4',
      is_active: l.is_active,
      status: l.is_active ? 'active' : 'inactive',
      created_at: l.created_at,
      updated_at: l.updated_at
    }));

    return res.json({
      data: lessons,
      total: count
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/admin_lessons/:id', async (req: Request, res: Response) => {
  try {
    const lesson = await DB.Lessons.findByPk(req.params.id, {
      include: [
        { model: DB.LearningAreas, as: 'learning_area' },
        { model: DB.Topics, as: 'topic' },
        { model: DB.Subtopics, as: 'subtopic' }
      ],
      raw: true,
      nest: true
    });
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    return res.json({
      ...lesson,
      duration_minutes: lesson.duration,
      file_size_mb: lesson.file_size ? Math.round(lesson.file_size / 1048576 * 100) / 100 : undefined
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/admin_lessons', async (req: Request, res: Response) => {
  try {
    const record = await DB.Lessons.create(req.body);
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.put('/admin_lessons/:id', async (req: Request, res: Response) => {
  try {
    const record = await DB.Lessons.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    await record.update(req.body);
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.patch('/admin_lessons/:id/toggle', async (req: Request, res: Response) => {
  try {
    const record = await DB.Lessons.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    const newStatus = !record.is_active;
    await record.update({ is_active: newStatus });
    return res.json({
      id: record.id,
      is_active: newStatus,
      status: newStatus ? 'active' : 'inactive'
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.delete('/admin_lessons/:id', async (req: Request, res: Response) => {
  try {
    const record = await DB.Lessons.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    await record.destroy();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/admin_lessons/upload', async (req: Request, res: Response) => {
   try {
     // File upload endpoint - expects multipart/form-data
     // Handle file upload to Bunny.net
     if (!req.files || !(req.files as any).video) {
       return res.status(400).json({ error: 'No video file provided' });
     }

     const videoFile = (req.files as any).video;
     const { title, description, area_id, topic_id, subtopic_id, price, is_preview_available, preview_duration } = req.body;

     // Validate required fields
     if (!title) {
       return res.status(400).json({ error: 'Title is required' });
     }

     // Save file temporarily
     const tempPath = `/tmp/${Date.now()}_${videoFile.name}`;
     await videoFile.mv(tempPath);

      try {
        // Upload to Bunny.net Stream
        const streamVideo = await bunnyService.uploadToStream(tempPath, {
          title: title,
          description: description || '',
        });

        // Fetch video metadata to get accurate status and thumbnail info
        const videoMetadata = await bunnyService.getStreamVideo(streamVideo.guid);

        // Create lesson record
        const lesson = await DB.Lessons.create({
          title: title,
          description: description || null,
          area_id: area_id ? parseInt(area_id) : null,
          topic_id: topic_id ? parseInt(topic_id) : null,
          subtopic_id: subtopic_id ? parseInt(subtopic_id) : null,
          bunny_url: videoMetadata.videoUrl || bunnyService.getStreamUrl(videoMetadata.guid),
          bunny_video_id: videoMetadata.guid,
          video_guid: videoMetadata.guid,
          transcoding_status: videoMetadata.status,
          thumbnail_url: videoMetadata.thumbnailUrl || bunnyService.getThumbnailUrl(videoMetadata.guid, 0),
          primary_thumbnail: videoMetadata.thumbnailUrl || bunnyService.getThumbnailUrl(videoMetadata.guid, 0),
          price: price ? parseFloat(price) : 0,
          is_preview_available: is_preview_available === 'true' || is_preview_available === true,
          preview_duration: preview_duration ? parseInt(preview_duration) : 0,
          duration: 0, // Will be updated when video is processed or via webhook
          file_size: videoFile.size,
          is_active: true
        });

       // Clean up temp file
       fs.unlinkSync(tempPath);

       return res.json({
         id: lesson.id,
         title: lesson.title,
         bunny_url: lesson.bunny_url,
         thumbnail_url: lesson.thumbnail_url,
         video_guid: lesson.video_guid,
         transcoding_status: lesson.transcoding_status
       });
     } catch (uploadError) {
       // Clean up temp file on error
       if (fs.existsSync(tempPath)) {
         fs.unlinkSync(tempPath);
       }
       throw uploadError;
     }
   } catch (err) {
     return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
   }
 });

router.get('/admin_lessons/presigned-url', async (req: Request, res: Response) => {
  try {
    const { fileName, fileType } = req.query;
    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'fileName and fileType are required' });
    }
    // Generate presigned URL for S3 upload
    // This should integrate with your S3 service
    return res.status(501).json({ error: 'Presigned URL generation not implemented' });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
