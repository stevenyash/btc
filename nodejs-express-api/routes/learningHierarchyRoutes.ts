import { Router, Request, Response } from 'express';
import learningHierarchyService from '../services/learningHierarchyService.js';
import DB from '../models/db.js';
import utils from '../helpers/utils.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const hierarchy = await learningHierarchyService.getCompleteHierarchy();
    res.json({ success: true, data: hierarchy });
  } catch (error) {
    console.error('Error getting learning hierarchy:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q;
    const queryStr = typeof query === 'string' ? query : Array.isArray(query) ? query[0] : '';
    if (!queryStr) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }
    
    const results = await learningHierarchyService.searchLessons(queryStr as string);
    res.json({ success: true, data: results, query: queryStr });
  } catch (error) {
    console.error('Error searching lessons:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.get('/lessons/:lessonId/path', async (req: Request, res: Response) => {
  try {
    const lessonId = utils.asString(req.params.lessonId);
    const path = await learningHierarchyService.getLearningPath(parseInt(lessonId));
    if (!path) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }
    res.json({ success: true, data: path });
  } catch (error) {
    console.error('Error getting learning path:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.get('/popular-areas', async (req: Request, res: Response) => {
  try {
    const { limit = '6' } = req.query as any;
    const limitStr = String(limit);
    const areas = await learningHierarchyService.getPopularLearningAreas(parseInt(limitStr));
    res.json({ success: true, data: areas });
  } catch (error) {
    console.error('Error getting popular areas:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.get('/levels', async (req: Request, res: Response) => {
  try {
    const levels = await learningHierarchyService.getLearningLevels();
    res.json({ success: true, data: levels });
  } catch (error) {
    console.error('Error getting learning levels:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.get('/levels/:levelId/grades', async (req: Request, res: Response) => {
  try {
    const levelId = utils.asString(req.params.levelId);
    const grades = await learningHierarchyService.getGradesByLevel(parseInt(levelId));
    res.json({ success: true, data: grades });
  } catch (error) {
    console.error('Error getting grades by level:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.get('/grades/:gradeId/areas', async (req: Request, res: Response) => {
  try {
    const gradeId = utils.asString(req.params.gradeId);
    const areas = await learningHierarchyService.getLearningAreasByGrade(parseInt(gradeId));
    res.json({ success: true, data: areas });
  } catch (error) {
    console.error('Error getting learning areas by grade:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.get('/areas/:areaId/topics', async (req: Request, res: Response) => {
  try {
    const areaId = utils.asString(req.params.areaId);
    const topics = await learningHierarchyService.getTopicsByArea(parseInt(areaId));
    res.json({ success: true, data: topics });
  } catch (error) {
    console.error('Error getting topics by area:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.get('/topics/:topicId/subtopics', async (req: Request, res: Response) => {
  try {
    const topicId = utils.asString(req.params.topicId);
    const subtopics = await learningHierarchyService.getSubtopicsByTopic(parseInt(topicId));
    res.json({ success: true, data: subtopics });
  } catch (error) {
    console.error('Error getting subtopics by topic:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.get('/areas/:areaId/lessons', async (req: Request, res: Response) => {
  try {
    const areaId = utils.asString(req.params.areaId);
    const lessons = await learningHierarchyService.getLessonsByArea(parseInt(areaId));
    res.json({ success: true, data: lessons });
  } catch (error) {
    console.error('Error getting lessons by area:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

// Get lessons with full hierarchy details for Bunny Sync linking
router.get('/filtered-lessons', async (req: Request, res: Response) => {
  try {
    const { area_id, topic_id, subtopic_id, search } = req.query;

    const searchStr = typeof search === 'string' ? search : '';
    const searchLower = searchStr.toLowerCase();
    const where: any = { is_active: true };

    if (area_id) where.area_id = area_id;
    if (topic_id) where.topic_id = topic_id;
    if (subtopic_id) where.subtopic_id = subtopic_id;

    const lessons = await DB.Lessons.findAll({
      where,
      include: [
        {
          model: DB.LearningAreas,
          as: 'learning_area',
          attributes: ['id', 'name', 'color'],
          include: [
            {
              model: DB.Grades,
              as: 'grade_info',
              attributes: ['id', 'name'],
              include: [
                {
                  model: DB.LearningLevels,
                  as: 'learning_level',
                  attributes: ['level_id', 'name']
                }
              ]
            }
          ]
        },
        { model: DB.Topics, as: 'topic', attributes: ['topic_id', 'name'] },
        { model: DB.Subtopics, as: 'subtopic', attributes: ['subtopic_id', 'name'] }
      ],
      attributes: [
        'id', 'title', 'description', 'duration', 'price', 
        'is_preview_available', 'bunny_video_id', 'thumbnail_url'
      ],
      order: [['title', 'ASC']]
    });

    // Transform to include flattened hierarchy fields
    const transformedLessons = (lessons as any).map((lesson: any) => {
      const data = lesson.toJSON();
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        duration: data.duration,
        price: data.price,
        is_preview_available: data.is_preview_available,
        bunny_video_id: data.bunny_video_id,
        thumbnail_url: data.thumbnail_url,
        area: data.learning_area?.name || 'N/A',
        area_id: data.learning_area?.id,
        topic: data.topic?.name || 'N/A',
        topic_id: data.topic?.topic_id,
        subtopic: data.subtopic?.name || 'N/A',
        subtopic_id: data.subtopic?.subtopic_id,
        grade: data.learning_area?.grade_info?.name || 'N/A',
        grade_id: data.learning_area?.grade_info?.id,
        level: data.learning_area?.grade_info?.learning_level?.name || 'N/A',
        level_id: data.learning_area?.grade_info?.learning_level?.level_id
      };
    });

    // Apply search filter if provided
    let results = transformedLessons;
    if (searchStr) {
      results = transformedLessons.filter((l: any) =>
        l.title.toLowerCase().includes(searchLower) ||
        l.area.toLowerCase().includes(searchLower) ||
        l.topic.toLowerCase().includes(searchLower) ||
        l.subtopic.toLowerCase().includes(searchLower)
      );
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching filtered lessons:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

export default router;