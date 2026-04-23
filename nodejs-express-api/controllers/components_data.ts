import { Router, Request, Response } from 'express';
import DB from '../models/db.ts';

const router = Router();

// Get learning levels
router.get('/learninglevels', async (req: Request, res: Response) => {
  try {
    const levels = await DB.LearningLevels.findAll({
      attributes: ['level_id', 'name'],
      raw: true
    });
    return res.json({ success: true, data: levels });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get grades by level
router.get('/grades_by_level/:levelId', async (req: Request, res: Response) => {
  try {
    const levelId = req.params.levelId;
    const grades = await DB.Grades.findAll({
      where: { level_id: levelId },
      attributes: ['id', 'name'],
      raw: true
    });
    return res.json({ success: true, data: grades });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get learning areas
router.get('/learningareas', async (req: Request, res: Response) => {
  try {
    const areas = await DB.LearningAreas.findAll({
      attributes: ['id', 'name', 'color', 'icon'],
      raw: true
    });
    return res.json({ success: true, data: areas });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get lessons with filters
router.get('/lessons', async (req: Request, res: Response) => {
  try {
    const { area_id, grade_id, topic_id, subtopic_id } = req.query;
    const where: any = {};
    
    if (area_id) where.learning_area_id = area_id;
    if (grade_id) where.grade_id = grade_id;
    
    const lessons = await DB.Lessons.findAll({
      where,
      include: [
        { model: DB.LearningAreas, as: 'learning_area', attributes: ['id', 'name'] },
        { model: DB.Topics, as: 'topic', attributes: ['topic_id', 'name'] },
        { model: DB.Subtopics, as: 'subtopic', attributes: ['subtopic_id', 'name'] }
      ],
      attributes: ['id', 'title', 'description', 'thumbnail_url', 'duration', 'is_preview_available'],
      limit: 50,
      raw: true
    });
    
    return res.json({ success: true, data: lessons });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get subscription types
router.get('/subscription_types', async (req: Request, res: Response) => {
  try {
    const types = await DB.SubscriptionTypes.findAll({
      attributes: ['id', 'name', 'membership_fee', 'months'],
      raw: true
    });
    return res.json({ success: true, data: types });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get packages
router.get('/packages_public', async (req: Request, res: Response) => {
  try {
    const packages = await DB.Packages.findAll({
      include: [
        { model: DB.SubscriptionTypes, as: 'subscription_type' }
      ],
      raw: true
    });
    return res.json({ success: true, data: packages });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Guest lesson status check
router.get('/guest_lesson_status', async (req: Request, res: Response) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }
    
    return res.json({
      success: true,
      can_access: true,
      phone_verified: true
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Lesson fees
router.get('/lesson_fees', async (req: Request, res: Response) => {
  try {
    const setting = await DB.LessonSetting.findOne({
      where: { subscription_type: 'non_subscribed' }
    });
    
    return res.json({
      success: true,
      fee: setting?.lesson_fee || 0
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
