import DB from '../models/db.js';

interface LearningLevel {
  level_id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
  grades?: Grade[];
}

interface Grade {
  id: number;
  name: string;
  description?: string;
  level_id: number;
  grade?: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
  learning_areas?: LearningArea[];
}

interface LearningArea {
  id: number;
  name: string;
  description?: string;
  grade: number;
  grade_id?: number;
  color?: string;
  icon?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
  lessons?: Lesson[];
}

interface Lesson {
  id: number;
  area_id: number;
  topic_id?: number;
  subtopic_id?: number;
  title: string;
  description?: string;
  s3_key?: string | null;
  s3_url?: string;
  file?: string;
  filename?: string;
  file_size?: number;
  duration?: number;
  thumbnail_url?: string | null;
  bunny_video_id?: string | null;
  transcoding_status?: string | null;
  price?: number;
  is_preview_available?: boolean;
  preview_duration?: number;
  is_active?: boolean;
}

interface Topic {
  topic_id: number;
  name: string;
  area_id?: number;
}

interface Subtopic {
	subtopic_id: number;
	name: string;
	topic_id?: number;
}

interface TopicWithSubtopicCount {
	topic_id: number;
	name: string;
	area_id?: number;
	subtopic_count?: number;
}

class LearningHierarchyService {
  async getLearningLevels(): Promise<LearningLevel[]> {
    try {
      const levels = await DB.LearningLevels.findAll({
        where: { is_active: true },
        order: [['name', 'ASC']],
        raw: true
      });
      return levels;
    } catch (error) {
      console.error('Error getting learning levels:', error);
      throw error;
    }
  }

  async getGradesByLevel(levelId: number): Promise<Grade[]> {
    try {
      const grades = await DB.Grades.findAll({
        where: { 
          level_id: levelId,
          is_active: true 
        },
        order: [['name', 'ASC']],
        raw: true
      });
      return grades;
    } catch (error) {
      console.error('Error getting grades:', error);
      throw error;
    }
  }

  async getLearningAreasByGrade(gradeId: number): Promise<LearningArea[]> {
    try {
      const areas = await DB.LearningAreas.findAll({
        where: { 
          grade_id: gradeId,
          is_active: true 
        },
        order: [['name', 'ASC']],
        raw: true
      });
      return areas;
    } catch (error) {
      console.error('Error getting learning areas:', error);
      throw error;
    }
  }

  async getLessonsByArea(areaId: number): Promise<Lesson[]> {
    try {
      const lessons = await DB.Lessons.findAll({
        where: { 
          area_id: areaId,
          is_active: true,
          bunny_video_id: { [DB.op.not]: null, [DB.op.ne]: '' },
          transcoding_status: 'completed',
        },
        order: [['title', 'ASC']],
        raw: true
      });
      return lessons;
    } catch (error) {
      console.error('Error getting lessons:', error);
      throw error;
    }
  }

  async getCompleteHierarchy(): Promise<LearningLevel[]> {
    try {
      const levels = await this.getLearningLevels();
      
      const hierarchy = await Promise.all(
        levels.map(async (level) => {
          const grades = await this.getGradesByLevel(level.level_id);
          
          const gradesWithAreas = await Promise.all(
            grades.map(async (grade) => {
              const areas = await this.getLearningAreasByGrade(grade.id);
              
              const areasWithLessons = await Promise.all(
                areas.map(async (area) => {
                  const lessons = await this.getLessonsByArea(area.id);
                  return {
                    ...area,
                    lessons
                  };
                })
              );
              
              return {
                ...grade,
                learning_areas: areasWithLessons
              };
            })
          );
          
          return {
            ...level,
            grades: gradesWithAreas
          };
        })
      );
      
      return hierarchy;
    } catch (error) {
      console.error('Error getting complete hierarchy:', error);
      throw error;
    }
  }

  async searchLessons(query: string): Promise<Lesson[]> {
    try {
      const lessons = await DB.Lessons.findAll({
        where: {
          title: {
            [DB.op.like]: `%${query}%`
          },
          is_active: true,
          bunny_video_id: { [DB.op.not]: null, [DB.op.ne]: '' },
          transcoding_status: 'completed',
        },
        order: [['title', 'ASC']],
        raw: true
      });
      
      return lessons;
    } catch (error) {
      console.error('Error searching lessons:', error);
      throw error;
    }
  }

  async getLearningPath(lessonId: number): Promise<{ level: LearningLevel | null; grade: Grade | null; area: LearningArea | null; lesson: Lesson | null }> {
    try {
      const lesson = await DB.Lessons.findOne({
        where: {
          id: lessonId,
          is_active: true,
          bunny_video_id: { [DB.op.not]: null, [DB.op.ne]: '' },
          transcoding_status: 'completed',
        },
        raw: true
      });

      if (!lesson) return { level: null, grade: null, area: null, lesson: null };

      const area = await DB.LearningAreas.findOne({
        where: { id: (lesson as unknown as { area_id: number }).area_id },
        raw: true
      });

      const grade = area ? await DB.Grades.findOne({
        where: { id: (area as unknown as { grade: number }).grade },
        raw: true
      }) : null;

      const level = grade ? await DB.LearningLevels.findOne({
        where: { level_id: (grade as unknown as { level_id: number }).level_id },
        raw: true
      }) : null;

      return {
        level: level as LearningLevel | null,
        grade: grade as Grade | null,
        area: area as LearningArea | null,
        lesson: lesson as Lesson | null
      };
    } catch (error) {
      console.error('Error getting learning path:', error);
      throw error;
    }
  }

  async getPopularLearningAreas(limit = 6): Promise<LearningArea[]> {
    try {
      const areas = await DB.LearningAreas.findAll({
        where: { is_active: true },
        order: [['name', 'ASC']],
        limit: limit,
        raw: true
      });

      return areas;
    } catch (error) {
      console.error('Error getting popular areas:', error);
      throw error;
    }
  }

  async getTopicsByArea(areaId: number): Promise<TopicWithSubtopicCount[]> {
    try {
      const topics = await DB.Topics.findAll({
        where: { area_id: areaId },
        order: [['name', 'ASC']],
        raw: true
      });

      const topicsWithCounts = await Promise.all(
        topics.map(async (topic) => {
          const subtopicCount = await DB.Subtopics.count({
            where: { topic_id: topic.topic_id }
          });
          return {
            ...topic,
            subtopic_count: subtopicCount
          };
        })
      );

      return topicsWithCounts;
    } catch (error) {
      console.error('Error getting topics by area:', error);
      throw error;
    }
  }

  async getSubtopicsByTopic(topicId: number): Promise<Subtopic[]> {
    try {
      const subtopics = await DB.Subtopics.findAll({
        where: { topic_id: topicId },
        order: [['name', 'ASC']],
        raw: true
      });
      return subtopics;
    } catch (error) {
      console.error('Error getting subtopics by topic:', error);
      throw error;
    }
  }
}

export default new LearningHierarchyService();
