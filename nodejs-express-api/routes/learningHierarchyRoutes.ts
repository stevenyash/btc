import { Router, Request, Response } from 'express';
import learningHierarchyService from '../services/learningHierarchyService.js';

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
    const { q: query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }
    
    const results = await learningHierarchyService.searchLessons(query as string);
    res.json({ success: true, data: results, query });
  } catch (error) {
    console.error('Error searching lessons:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.get('/lessons/:lessonId/path', async (req: Request, res: Response) => {
  try {
    const path = await learningHierarchyService.getLearningPath(parseInt(req.params.lessonId));
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
    const { limit = '6' } = req.query;
    const areas = await learningHierarchyService.getPopularLearningAreas(parseInt(limit as string));
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
    const grades = await learningHierarchyService.getGradesByLevel(parseInt(req.params.levelId));
    res.json({ success: true, data: grades });
  } catch (error) {
    console.error('Error getting grades by level:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.get('/grades/:gradeId/areas', async (req: Request, res: Response) => {
  try {
    const areas = await learningHierarchyService.getLearningAreasByGrade(parseInt(req.params.gradeId));
    res.json({ success: true, data: areas });
  } catch (error) {
    console.error('Error getting learning areas by grade:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

router.get('/areas/:areaId/lessons', async (req: Request, res: Response) => {
  try {
    const lessons = await learningHierarchyService.getLessonsByArea(parseInt(req.params.areaId));
    res.json({ success: true, data: lessons });
  } catch (error) {
    console.error('Error getting lessons by area:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

export default router;