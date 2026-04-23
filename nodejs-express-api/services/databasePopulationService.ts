import DB from '../models/db.js';

interface S3Object {
  Key: string;
  Size: number;
  LastModified?: Date;
  ETag?: string;
}

interface FolderHierarchy {
  level_name: string;
  grade_name: string;
  area_name: string;
}

interface LearningLevel {
  level_id: number;
  name: string;
}

interface Grade {
  id: number;
  name: string;
  level_id: number;
}

interface LearningArea {
  id: number;
  name: string;
  grade_id: number;
  color: string;
  icon: string;
}

interface Topic {
  topic_id: number;
  name: string;
  area_id: number;
}

interface Subtopic {
  subtopic_id: number;
  name: string;
  topic_id: number;
}

interface Lesson {
  id?: number;
  area_id: number;
  topic_id: number;
  subtopic_id: number;
  title: string;
  description: string;
  s3_key: string;
  s3_url: string;
  file: string;
  filename: string;
  file_size: number;
  duration: number;
  thumbnail_url: string | null;
  price: number;
  is_preview_available: boolean;
  preview_duration: number;
  sort_order: number;
  is_active: boolean;
}

class DatabasePopulationService {
  getFolderToHierarchyMap(): Record<string, FolderHierarchy> {
    return {
      'Grade 7 Maths': { 
        level_name: 'Junior Secondary', 
        grade_name: 'Grade 7', 
        area_name: 'Mathematics' 
      },
      'Grade 8 Business': { 
        level_name: 'Junior Secondary', 
        grade_name: 'Grade 8', 
        area_name: 'Business Studies' 
      },
      'Grade 8 Kiswahili': { 
        level_name: 'Junior Secondary', 
        grade_name: 'Grade 8', 
        area_name: 'Kiswahili' 
      },
      'Form 3 Biology': { 
        level_name: 'Senior Secondary', 
        grade_name: 'Form 3', 
        area_name: 'Biology' 
      },
      'Form 3 Chemistry': { 
        level_name: 'Senior Secondary', 
        grade_name: 'Form 3', 
        area_name: 'Chemistry' 
      },
      'Form 3 Kiswahili': { 
        level_name: 'Senior Secondary', 
        grade_name: 'Form 3', 
        area_name: 'Kiswahili' 
      },
      'Form 3 Maths': { 
        level_name: 'Senior Secondary', 
        grade_name: 'Form 3', 
        area_name: 'Mathematics' 
      },
      'Form 3 Physics': { 
        level_name: 'Senior Secondary', 
        grade_name: 'Form 3', 
        area_name: 'Physics' 
      },
      'Form 4 Biology': { 
        level_name: 'Senior Secondary', 
        grade_name: 'Form 4', 
        area_name: 'Biology' 
      },
      'Form 4 Chemistry': { 
        level_name: 'Senior Secondary', 
        grade_name: 'Form 4', 
        area_name: 'Chemistry' 
      },
      'Form 4 Maths': { 
        level_name: 'Senior Secondary', 
        grade_name: 'Form 4', 
        area_name: 'Mathematics' 
      },
      'Form 4 Physics': { 
        level_name: 'Senior Secondary', 
        grade_name: 'Form 4', 
        area_name: 'Physics' 
      },
      'Form 3 4 Kiswahili': { 
        level_name: 'Senior Secondary', 
        grade_name: 'Form 3 & 4', 
        area_name: 'Kiswahili' 
      },
      'BTC Lessons': { 
        level_name: 'General', 
        grade_name: 'All Grades', 
        area_name: 'General Education' 
      }
    };
  }

  async checkExistingHierarchy(): Promise<{ levels: LearningLevel[]; grades: Grade[]; learningAreas: LearningArea[]; topics: Topic[]; subtopics: Subtopic[]; lessons: number }> {
    try {
      console.log('Checking existing database hierarchy...');
      
      const levels = await DB.LearningLevels.findAll({ raw: true });
      const grades = await DB.Grades.findAll({ raw: true });
      const areas = await DB.LearningAreas.findAll({ raw: true });
      const topics = await DB.Topics.findAll({ raw: true });
      const subtopics = await DB.Subtopics.findAll({ raw: true });
      const lessons = await DB.Lessons.count();
      
      console.log(`Levels: ${levels.length}, Grades: ${grades.length}, Areas: ${areas.length}, Topics: ${topics.length}, Subtopics: ${subtopics.length}, Lessons: ${lessons}`);
      
      return { levels, grades, learningAreas: areas, topics, subtopics, lessons };
    } catch (error) {
      console.error('Error checking existing hierarchy:', error);
      throw error;
    }
  }

  async populateDatabaseFromS3(s3Files: S3Object[], cloudFrontDomain: string): Promise<{ success: boolean; createdCount: number }> {
    try {
      console.log('Populating database from S3 files...');
      
      await this.checkExistingHierarchy();
      
      const folderMap = this.getFolderToHierarchyMap();
      let createdCount = 0;
      
      const filesByFolder = this.groupFilesByFolder(s3Files);
      
      for (const [folderName, files] of Object.entries(filesByFolder)) {
        const hierarchy = folderMap[folderName];
        
        if (!hierarchy) {
          console.log(`No hierarchy mapping for folder: ${folderName}`);
          continue;
        }
        
        console.log(`Processing ${folderName}: ${files.length} files`);
        
        const level = await this.getOrCreateLevel(hierarchy.level_name);
        const grade = await this.getOrCreateGrade(hierarchy.grade_name, level.level_id);
        const area = await this.getOrCreateArea(hierarchy.grade_name, grade.id);
        
        for (const file of files) {
          await this.createLessonFromFile(file, area, cloudFrontDomain);
          createdCount++;
        }
        
        console.log(`Created ${files.length} lessons`);
      }
      
      console.log(`Database population completed: ${createdCount} lessons created`);
      return { success: true, createdCount };
    } catch (error) {
      console.error('Error populating database:', error);
      throw error;
    }
  }

  groupFilesByFolder(s3Files: S3Object[]): Record<string, S3Object[]> {
    const filesByFolder: Record<string, S3Object[]> = {};
    
    s3Files.forEach(file => {
      if (file.Key.endsWith('/')) return;
      
      const folder = file.Key.split('/')[0];
      if (!filesByFolder[folder]) {
        filesByFolder[folder] = [];
      }
      filesByFolder[folder].push(file);
    });
    
    return filesByFolder;
  }

  async getOrCreateLevel(levelName: string): Promise<LearningLevel> {
    let level = await DB.LearningLevels.findOne({
      where: { name: levelName }
    });
    
    if (!level) {
      level = await DB.LearningLevels.create({
        name: levelName,
        description: `${levelName} Level`,
        sort_order: await this.getNextSortOrder(DB.LearningLevels),
        is_active: true
      });
      console.log(`Created new level: ${levelName}`);
    }
    
    return level as LearningLevel;
  }

  async getOrCreateGrade(gradeName: string, levelId: number): Promise<Grade> {
    let grade = await DB.Grades.findOne({
      where: { 
        name: gradeName,
        level_id: levelId
      }
    });
    
    if (!grade) {
      grade = await DB.Grades.create({
        name: gradeName,
        description: `${gradeName} Grade`,
        level_id: levelId,
        sort_order: await this.getNextSortOrder(DB.Grades),
        is_active: true
      });
      console.log(`Created new grade: ${gradeName}`);
    }
    
    return grade as Grade;
  }

  async getOrCreateArea(areaName: string, gradeId: number): Promise<LearningArea> {
    let area = await DB.LearningAreas.findOne({
      where: { 
        name: areaName,
        grade_id: gradeId
      }
    });
    
    if (!area) {
      area = await DB.LearningAreas.create({
        name: areaName,
        description: `${areaName} Learning Area`,
        grade_id: gradeId,
        color: this.getRandomColor(),
        icon: 'book',
        is_active: true
      });
      console.log(`Created new area: ${areaName}`);
    }
    
    return area as LearningArea;
  }

  async getOrCreateTopicAndSubtopic(areaId: number, filename: string): Promise<{ topic: Topic; subtopic: Subtopic }> {
    const { topicName, subtopicName } = this.extractTopicAndSubtopic(filename);
    
    let topic = await DB.Topics.findOne({
      where: { 
        name: topicName,
        area_id: areaId
      }
    });
    
    if (!topic) {
      topic = await DB.Topics.create({
        name: topicName,
        area_id: areaId
      });
    }
    
    let subtopic = await DB.Subtopics.findOne({
      where: { 
        name: subtopicName,
        topic_id: topic.topic_id
      }
    });
    
    if (!subtopic) {
      subtopic = await DB.Subtopics.create({
        name: subtopicName,
        topic_id: topic.topic_id
      });
    }
    
    return { topic: topic as Topic, subtopic: subtopic as Subtopic };
  }

  extractTopicAndSubtopic(filename: string): { topicName: string; subtopicName: string } {
    const cleanName = filename.replace('.mp4', '');
    const parts = cleanName.split(' - ');
    
    let topicName = 'General';
    let subtopicName = 'Introduction';
    
    if (parts.length >= 3) {
      topicName = parts[1] || 'General';
      subtopicName = parts[2] || 'Introduction';
    } else if (parts.length === 2) {
      topicName = parts[1] || 'General';
      subtopicName = 'Introduction';
    } else {
      topicName = cleanName;
      subtopicName = 'Introduction';
    }
    
    return { topicName, subtopicName };
  }

  async createLessonFromFile(s3File: S3Object, area: LearningArea, cloudFrontDomain: string): Promise<Lesson> {
    try {
      const s3Key = s3File.Key;
      const filename = s3Key.split('/').pop() || '';
      
      const { topicName, subtopicName } = this.extractTopicAndSubtopic(filename);
      const { topic, subtopic } = await this.getOrCreateTopicAndSubtopic(area.id, filename);
      
      const existingLesson = await DB.Lessons.findOne({
        where: { s3_key: s3Key }
      });
      
      if (existingLesson) {
        console.log(`Lesson already exists: ${topicName} - ${subtopicName}`);
        return existingLesson as Lesson;
      }
      
      const lessonData = {
        area_id: area.id,
        topic_id: topic.topic_id,
        subtopic_id: subtopic.subtopic_id,
        title: topicName,
        description: subtopicName,
        s3_key: s3Key,
        s3_url: `${cloudFrontDomain}/${s3Key}`,
        file: filename,
        filename: filename,
        file_size: s3File.Size || 0,
        duration: 0,
        thumbnail_url: null,
        price: 0.00,
        is_preview_available: false,
        preview_duration: 0,
        sort_order: await this.getNextLessonSortOrder(area.id),
        is_active: true
      };
      
      const lesson = await DB.Lessons.create(lessonData);
      console.log(`Created lesson: ${topicName} - ${subtopicName}`);
      
      return lesson as Lesson;
    } catch (error) {
      console.error(`Error creating lesson for file ${s3File.Key}:`, error);
      throw error;
    }
  }

  async getNextSortOrder(Model: unknown): Promise<number> {
    const lastItem = await (Model as { findOne: (options: unknown) => unknown }).findOne({
      order: [['sort_order', 'DESC']]
    });
    
    return ((lastItem as { sort_order?: number })?.sort_order || 0) + 1;
  }

  async getNextLessonSortOrder(areaId: number): Promise<number> {
    const lastLesson = await DB.Lessons.findOne({
      where: { area_id: areaId },
      order: [['sort_order', 'DESC']]
    });
    
    return ((lastLesson as { sort_order?: number })?.sort_order || 0) + 1;
  }

  getRandomColor(): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  async verifyPopulation(): Promise<{ levels: number; grades: number; areas: number; topics: number; subtopics: number; totalLessons: number; lessonsWithFiles: number }> {
    try {
      const totalLessons = await DB.Lessons.count();
      const lessonsWithFiles = await DB.Lessons.count({
        where: { s3_key: { [DB.Op.ne]: null } }
      });
      
      const levels = await DB.LearningLevels.count();
      const grades = await DB.Grades.count();
      const areas = await DB.LearningAreas.count();
      const topics = await DB.Topics.count();
      const subtopics = await DB.Subtopics.count();
      
      console.log(`Levels: ${levels}, Grades: ${grades}, Areas: ${areas}, Topics: ${topics}, Subtopics: ${subtopics}, Lessons: ${totalLessons}`);
      
      return { levels, grades, areas, topics, subtopics, totalLessons, lessonsWithFiles };
    } catch (error) {
      console.error('Error verifying population:', error);
      throw error;
    }
  }
}

export default new DatabasePopulationService();