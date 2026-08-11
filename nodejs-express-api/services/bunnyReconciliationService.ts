import DB from '../models/db.js';
import bunnyService, { getStreamUrl, getThumbnailUrl, mapStatus } from '../services/bunnyService.js';

interface ParsedHierarchy {
  gradeName: string;
  areaName: string;
  topicName: string;
  subtopicName: string;
  collectionName?: string;
}

interface BunnyVideo {
  guid: string;
  title: string;
  collectionId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl: string;
  thumbnailUrl: string;
  previewUrl?: string;
  description?: string;
  duration?: number;
  encodeProgress?: number;
  views?: number;
  dateUploaded?: string;
  storageSize?: number;
}

interface ReconciliationResult {
  totalVideos: number;
  linked: number;
  skipped: number;
  failed: number;
  details: Array<{
    videoId: string;
    videoTitle: string;
    collectionName: string;
    lessonId?: number;
    lessonTitle?: string;
    status: 'linked' | 'skipped' | 'not_found' | 'error';
    message: string;
  }>;
}

class BunnyReconciliationService {
   /**
    * Parse a video title to extract learning hierarchy
    * Title format: "Form 3 Maths - Graphical methods - Equations of a circle"
    */
    private async parseVideoTitle(title: string, collectionName?: string): Promise<ParsedHierarchy | null> {
      try {
        console.log(`  Parsing title: "${title}"`);

        const parts = title.split(' - ').map(p => p.trim());

        if (parts.length < 2) {
          console.log(`  ⚠️  Not enough parts: ${parts.length}`);
          return null;
        }

        const gradeAreaPart = parts[0];
        const topicName = parts[1];
        const subtopicName = parts[2] || '';

        // Extract grade and area from first part
        // Patterns: "Form 3 Maths", "Grade 10 Biology", "Senior 2 Geography"
        const gradeKeywords = ['form', 'grade', 'senior', 'year', 'class', 'level'];
        const lowerPart = gradeAreaPart.toLowerCase();

        let gradeName: string;
        let areaName: string;

        // Find the first grade keyword and extract the number immediately after
        let found = false;
        for (const keyword of gradeKeywords) {
          const idx = lowerPart.indexOf(keyword);
          if (idx !== -1) {
            // Get remainder after keyword
            const afterKeyword = gradeAreaPart.substring(idx + keyword.length).trim();
            // Match number immediately after keyword (possibly with space)
            const numberMatch = afterKeyword.match(/^(\d+)/);
            if (numberMatch) {
              const gradeNum = numberMatch[1];
              // Grade includes keyword + number
              gradeName = `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} ${gradeNum}`;
              // Area is everything after the number
              const afterNumber = afterKeyword.substring(gradeNum.length).trim();
              areaName = afterNumber;
              found = true;
              break;
            }
          }
        }

        if (!found) {
          // No grade keyword found - use collection name or fallback
          if (collectionName) {
            // Try to extract from collection name "Form 3 Maths"
            const collLower = collectionName.toLowerCase();
            for (const keyword of gradeKeywords) {
              const idx = collLower.indexOf(keyword);
              if (idx !== -1) {
                const afterKeyword = collectionName.substring(idx + keyword.length).trim();
                const numberMatch = afterKeyword.match(/^(\d+)/);
                if (numberMatch) {
                  const gradeNum = numberMatch[1];
                  gradeName = `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} ${gradeNum}`;
                  areaName = afterKeyword.substring(gradeNum.length).trim();
                  found = true;
                  break;
                }
              }
            }
          }
          if (!found) {
            // Fallback: use first two words as grade, rest as area
            const words = gradeAreaPart.split(/\s+/);
            if (words.length >= 2) {
              gradeName = words.slice(0, 2).join(' ');
              areaName = words.slice(2).join(' ');
            } else {
              gradeName = gradeAreaPart;
              areaName = '';
            }
          }
        }

        // Special handling for "Form X Maths" pattern - split into grade and area
        if (gradeName.toLowerCase().startsWith('form') && areaName.toLowerCase() === 'maths') {
          // Already correctly parsed as grade="Form X", area="Maths"
          // No change needed
        } else if (gradeName.toLowerCase().startsWith('form') && !areaName) {
          // Case like "Form 3" with no area - try to extract area from collectionName or use default
          if (collectionName && collectionName.toLowerCase().includes('maths')) {
            areaName = 'Maths';
          } else {
            // Default area for Form grades
            areaName = 'Mathematics';
          }
        }

        // Clean up: remove trailing/leading spaces
        gradeName = gradeName.trim();
        areaName = areaName.trim();

        return {
          gradeName,
          areaName,
          topicName,
          subtopicName,
          collectionName: collectionName || gradeAreaPart
        };
      } catch (error) {
        console.error(`  ❌ Error parsing title:`, error.message);
        return null;
      }
    }

    /**
     * Get or create learning level based on grade name
     */
    private async getOrCreateLearningLevel(gradeName: string): Promise<any> {
      // Determine level based on grade name
      const lowerGrade = gradeName.toLowerCase();
      
      let levelName: string;
      
      // Check for all Form levels -> Secondary School
      if (lowerGrade.startsWith('form ')) {
        levelName = 'Secondary School';
      }
      // Check for Grade 10-12 -> Senior School
      else if (
        lowerGrade.startsWith('grade 10') || 
        lowerGrade.startsWith('grade 11') ||
        lowerGrade.startsWith('grade 12')
      ) {
        levelName = 'Senior School';
      }
      // Check for Grade 7-9 -> Junior School
      else if (
        lowerGrade.startsWith('grade 7') || 
        lowerGrade.startsWith('grade 8') ||
        lowerGrade.startsWith('grade 9')
      ) {
        levelName = 'Junior School';
      }
      // Check for Grade 1-6 -> Primary
      else if (
        lowerGrade.startsWith('grade 1') || 
        lowerGrade.startsWith('grade 2') ||
        lowerGrade.startsWith('grade 3') ||
        lowerGrade.startsWith('grade 4') ||
        lowerGrade.startsWith('grade 5') ||
        lowerGrade.startsWith('grade 6')
      ) {
        // Need to be careful not to match grade 10, 11, 12
        const gradeMatch = lowerGrade.match(/grade\s*(\d+)/);
        if (gradeMatch) {
          const gradeNum = parseInt(gradeMatch[1]);
          if (gradeNum >= 1 && gradeNum <= 6) {
            levelName = 'Primary';
          } else {
            levelName = 'Secondary'; // fallback
          }
        } else {
          levelName = 'Secondary'; // fallback
        }
      }
      // Check for PP 1-2 -> Pre-primary
      else if (
        lowerGrade.startsWith('pp 1') || 
        lowerGrade.startsWith('pp 2')
      ) {
        levelName = 'Pre-primary';
      }
      // Default fallback
      else {
        levelName = 'Secondary';
      }

      // Find or create the level
      let level = await DB.LearningLevels.findOne({
        where: { name: levelName },
        raw: true
      });

      if (level) {
        return { ...level, level_id: level.id };
      }

      // Try any active level with similar name (case insensitive)
      level = await DB.LearningLevels.findOne({
        where: { 
          name: { [DB.Op.like]: levelName },
          is_active: true 
        },
        raw: true
      });

      if (level) {
        return { ...level, level_id: level.id };
      }

      // Create new level
      console.log(`  🆕 Creating learning level: "${levelName}"`);
      level = await DB.LearningLevels.create({
        name: levelName,
        is_active: true
      });
      const levelData = level.toJSON ? level.toJSON() : level;
      return levelData;
    }

    /**
     * Get or create grade by name
     * Uses smart matching, returns null if not found (no auto-create)
     */
   private async getOrCreateGrade(gradeName: string): Promise<any | null> {
     const cleanName = gradeName.replace(/\.mp4$/i, '').trim();

     // Try exact match
     let grade = await DB.Grades.findOne({
       where: { name: cleanName },
       raw: true
     });
     if (grade) return grade;

      // Try case-insensitive
      grade = await DB.Grades.findOne({
        where: { name: { [DB.Op.like]: cleanName } },
        raw: true
      });
     if (grade) return grade;

     // Extract standard format (Form 3, Grade 10, etc.)
     const gradeMatch = cleanName.match(/(Form|Grade|Class|Year)\s*(\d+)/i);
     if (gradeMatch) {
        const standardName = `${gradeMatch[1]} ${gradeMatch[2]}`;
        grade = await DB.Grades.findOne({
          where: { name: { [DB.Op.like]: `%${standardName}%` } },
          raw: true
        });
       if (grade) return grade;
     }

// NOT FOUND - need to create grade
       console.log(`  ⚠️  Grade not found: "${cleanName}" - attempting to create`);

       // Get or create learning level first
       const level = await this.getOrCreateLearningLevel(gradeName);

       // Create new grade
       console.log(`  🆕 Creating grade: "${cleanName}"`);
       grade = await DB.Grades.create({
         name: cleanName,
         level_id: level.level_id,
         is_active: true
       });
       const gradeData = grade.toJSON ? grade.toJSON() : grade;
       console.log(`  🆕 Created grade: "${cleanName}" with id ${gradeData.id}`);
       return gradeData;
    }

/**
     * Get or create learning area under a grade with smart matching
     * Auto-creates if not found
     */
    private async getOrCreateArea(areaName: string, gradeId: number): Promise<any | null> {
      let cleanName = areaName.replace(/\.mp4$/i, '').trim();

      // Try exact match
      let area = await DB.LearningAreas.findOne({
        where: { name: cleanName, grade_id: gradeId },
        raw: true
      });
      if (area) return area;

      // Try case-insensitive
      area = await DB.LearningAreas.findOne({
        where: {
          name: { [DB.Op.like]: cleanName },
          grade_id: gradeId
        },
        raw: true
      });
      if (area) return area;

      // Try without numeric prefix (e.g., "3 Maths" → "Maths")
      const withoutNumber = cleanName.replace(/^\d+\s+/, '').trim();
      if (withoutNumber !== cleanName) {
        area = await DB.LearningAreas.findOne({
          where: {
            name: { [DB.Op.like]: withoutNumber },
            grade_id: gradeId
          },
          raw: true
        });
        if (area) return area;
      }

      // NOT FOUND - Create new area
      console.log(`  ⚠️  Area not found: "${cleanName}" for grade ${gradeId} - creating new area`);
      area = await DB.LearningAreas.create({
        name: cleanName,
        grade_id: gradeId,
        is_active: true
      });
      console.log(`  🆕 Created area: "${cleanName}" with id ${area.id}, data:`, JSON.stringify(area.toJSON ? area.toJSON() : area));
      // Return as plain object for consistency with findOne + raw:true
      const areaData = area.toJSON ? area.toJSON() : area;
      return areaData;
    }

    /**
     * Get or create topic under a learning area with smart matching
     * Auto-creates if not found
     */
    private async getOrCreateTopic(topicName: string, areaId: number): Promise<any | null> {
     // Clean topic name (remove .mp4, trim)
     let cleanName = topicName.replace(/\.mp4$/i, '').trim();
     
     // Try exact match
     let topic = await DB.Topics.findOne({
       where: { name: cleanName, area_id: areaId },
       raw: true
});
      if (topic) return topic;

      // Try case-insensitive
      topic = await DB.Topics.findOne({
        where: {
          name: { [DB.Op.like]: cleanName },
          area_id: areaId
        },
        raw: true
      });
      if (topic) return topic;

      // NOT FOUND - Create new topic
      console.log(`  ⚠️  Topic not found: "${cleanName}" for area ${areaId} - creating new topic`);
      topic = await DB.Topics.create({
        name: cleanName,
        area_id: areaId
      });
      console.log(`  🆕 Created topic: "${cleanName}" with id ${topic.topic_id}`);
      // Return as plain object for consistency with findOne + raw:true
      const topicData = topic.toJSON ? topic.toJSON() : topic;
      return topicData;
    }

    /**
     * Get or create subtopic under a topic with smart matching
     */
   private async getOrCreateSubtopic(subtopicName: string, topicId: number): Promise<any> {
     if (!subtopicName) return null;

     // Clean subtopic name (remove .mp4, trim)
     let cleanName = subtopicName.replace(/\.mp4$/i, '').trim();
     
     // Try exact match
     let subtopic = await DB.Subtopics.findOne({
       where: {
         name: cleanName,
         topic_id: topicId
       },
       raw: true
     });
     if (subtopic) return subtopic;

      // Try case-insensitive
      subtopic = await DB.Subtopics.findOne({
        where: {
          name: { [DB.Op.like]: cleanName },
          topic_id: topicId
        },
        raw: true
      });
     if (subtopic) return subtopic;

// Create new subtopic
      console.log(`  🆕 Creating subtopic: "${cleanName}" under topic ${topicId}`);
      subtopic = await DB.Subtopics.create({
        name: cleanName,
        topic_id: topicId
      });
      const subtopicData = subtopic.toJSON ? subtopic.toJSON() : subtopic;
      return subtopicData;
    }

    /**
     * Get or create lesson with full hierarchy
     */
    private async getOrCreateLesson(
      title: string,
      areaId: number,
      topicId: number,
      subtopicId: number | null,
      videoData?: BunnyVideo
    ): Promise<any> {
      // If no subtopic provided, get or create a "General" subtopic for the topic
      let finalSubtopicId: number | null = subtopicId;
      if (finalSubtopicId === null || finalSubtopicId === undefined) {
        console.log(`  🆕 No subtopic for lesson, creating "General" subtopic`);
        try {
          let subtopic = await DB.Subtopics.findOne({
            where: { name: 'General', topic_id: topicId },
            raw: true
          });
          if (!subtopic) {
            console.log(`  🆕 Creating default subtopic "General" for topic ${topicId}`);
            subtopic = await DB.Subtopics.create({
              name: 'General',
              topic_id: topicId
            });
          }
          finalSubtopicId = subtopic.subtopic_id;
          console.log(`  ✅ Using subtopic_id: ${finalSubtopicId}`);
        } catch (error: any) {
          console.error(`  ❌ Failed to create/find General subtopic for topic ${topicId}:`, error.message);
          throw new Error(`Cannot proceed without subtopic: ${error.message}`);
        }
      }

      if (finalSubtopicId === null || finalSubtopicId === undefined) {
        throw new Error(`subtopic_id is still null/undefined after fallback logic`);
      }

      const where: any = { 
        area_id: areaId, 
        topic_id: topicId, 
        subtopic_id: finalSubtopicId, 
        is_active: true 
      };

      let lesson = await DB.Lessons.findOne({ where, raw: true });

      if (lesson) {
        // Update existing lesson with latest Bunny metadata (excluding linking fields)
        if (videoData) {
          console.log(`  🔄 Updating existing lesson ${lesson.id} with Bunny video metadata`);
          const updateData: any = {};
          if (videoData.thumbnailUrl) {
            updateData.thumbnail_url = videoData.thumbnailUrl;
            updateData.primary_thumbnail = videoData.thumbnailUrl;
          }
          if (videoData.previewUrl) updateData.preview_url = videoData.previewUrl;
          if (videoData.description) updateData.description = videoData.description;
          if (videoData.duration) updateData.duration = videoData.duration;
          if (videoData.status) updateData.transcoding_status = videoData.status;
          if (videoData.videoUrl) updateData.bunny_url = videoData.videoUrl;
          if (videoData.guid) updateData.bunny_video_id = videoData.guid;
          if (videoData.collectionId) updateData.collection_id = videoData.collectionId;
          if (videoData.encodeProgress !== undefined) updateData.encode_progress = videoData.encodeProgress;
          if (videoData.views !== undefined) updateData.views = videoData.views;
          if (videoData.dateUploaded) updateData.date_uploaded = new Date(videoData.dateUploaded);

           if (Object.keys(updateData).length > 0) {
             await DB.Lessons.update(updateData, { where: { id: lesson.id } });
           }
lesson = await DB.Lessons.findOne({ where, raw: true });
          }
          return lesson;
        } else {
         // Create new lesson with all available metadata (excluding linking fields - those set during reconciliation)
         console.log(`  🆕 Creating lesson: "${title}" with subtopic_id: ${finalSubtopicId}`);
         try {
           const lessonData: any = {
             title,
             area_id: areaId,
             topic_id: topicId,
             subtopic_id: finalSubtopicId,
             is_active: true,
           };

           if (videoData) {
             lessonData.bunny_url = videoData.videoUrl || null;
             lessonData.bunny_video_id = videoData.guid || null;
             lessonData.thumbnail_url = videoData.thumbnailUrl || null;
             lessonData.primary_thumbnail = videoData.thumbnailUrl || null;
             lessonData.preview_url = videoData.previewUrl || null;
             lessonData.collection_id = videoData.collectionId || null;
             lessonData.description = videoData.description || null;
             lessonData.duration = videoData.duration || null;
             lessonData.transcoding_status = videoData.status || 'pending';
             lessonData.encode_progress = videoData.encodeProgress || 0;
             lessonData.views = videoData.views || 0;
             lessonData.date_uploaded = videoData.dateUploaded ? new Date(videoData.dateUploaded) : new Date();
           }

           lesson = await DB.Lessons.create(lessonData);
           return lesson;
         } catch (error: any) {
           console.error(`  ❌ Error creating lesson:`, error.message);
           console.error(`  📝 Values: title="${title}", areaId=${areaId}, topicId=${topicId}, subtopicId=${finalSubtopicId}`);
           throw error;
         }
       }
     }

/**
     * Find or create lesson matching the parsed hierarchy
     */
    private async findOrCreateLessonByHierarchy(
      parsed: ParsedHierarchy,
      video: BunnyVideo
    ): Promise<{ lesson: any; created: boolean }> {
      try {
        // Step 1: Get or create grade
        const grade = await this.getOrCreateGrade(parsed.gradeName);
        if (!grade) {
          throw new Error(`Grade not found or created: ${parsed.gradeName}`);
        }
        console.log(`  📚 Grade found/created: ${parsed.gradeName} (id=${grade.id})`);

        // Step 2: Get or create learning area
        const area = await this.getOrCreateArea(parsed.areaName, grade.id);
        if (!area) {
          throw new Error(`Area not found or created: ${parsed.areaName} for grade ${grade.id}`);
        }
        console.log(`  📖 Area found/created: ${parsed.areaName} (id=${area.id})`);

        // Step 3: Get or create topic
        const topic = await this.getOrCreateTopic(parsed.topicName, area.id);
        if (!topic) {
          throw new Error(`Topic not found or created: ${parsed.topicName} for area ${area.id}`);
        }
        console.log(`  📝 Topic found/created: ${parsed.topicName} (topic_id=${topic.topic_id})`);

       // Step 4: Get or create subtopic (if provided)
       let subtopicId: number | null = null;
       console.log(`  🔍 Parsed subtopicName: "${parsed.subtopicName}" (type: ${typeof parsed.subtopicName})`);
       if (parsed.subtopicName) {
         console.log(`  🟢 Has subtopicName, creating/finding subtopic`);
         const subtopic = await this.getOrCreateSubtopic(parsed.subtopicName, topic.topic_id);
         subtopicId = subtopic.subtopic_id;
       } else {
         console.log(`  ⚠️ No subtopicName, will create General subtopic in lesson creation`);
       }
       console.log(`  📌 subtopicId to pass: ${subtopicId}`);

       // Step 5: Get or create lesson with full video metadata
       const lesson = await this.getOrCreateLesson(
         video.title.replace('.mp4', ''),
         area.id,
         topic.topic_id,
         subtopicId,
         video
       );

       const created = !lesson.bunny_video_id;
       return { lesson, created };
} catch (error) {
        console.error(`  ❌ Error in findOrCreateLessonByHierarchy:`, error.message);
        console.error(`  ❌ Full error:`, error);
        throw error;
      }
   }


  /**
   * Reset learning hierarchy from Bunny (drop all grades, areas, topics, subtopics)
   */
  async resetHierarchy(options: { dryRun?: boolean } = {}): Promise<void> {
    const { dryRun = false } = options;

    console.log('🔄 Reset Learning Hierarchy from Bunny\n');
    console.log('='.repeat(60));
    console.log(`Mode: ${dryRun ? '🔍 DRY RUN' : '⚡ LIVE'}`);
    console.log('');

    try {
      // Get distinct grade/area/topic/subtopic names from Bunny videos
      console.log('📦 Fetching Bunny collections...');
      const collectionsResponse = await bunnyService.getStreamCollections();
      const collections = collectionsResponse.items || collectionsResponse.collections || [];

      console.log(`   Found ${collections.length} collections\n`);

      // Collect unique hierarchy data from video titles
      const gradesSet = new Set<string>();
      const areasMap = new Map<string, Set<string>>(); // grade -> areas
      const topicsMap = new Map<string, Set<string>>(); // area -> topics
      const subtopicsMap = new Map<string, Set<string>>(); // topic -> subtopics

      for (const collection of collections) {
        const collectionVideos: BunnyVideo[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          try {
            const response = await bunnyService.getStreamVideos(page, 100);
            const pageVideos = (response.items || response.videos || []).filter((v: any) =>
              v.collectionId === collection.guid
            );
            collectionVideos.push(...pageVideos.map((v: any) => ({
              guid: v.guid,
              title: v.title,
              status: v.status !== undefined ? mapStatus(v.status) : 'processing' as const,
              videoUrl: v.videoUrl || '',
              thumbnailUrl: v.thumbnailUrl || '',
              collectionId: v.collectionId,
              description: v.description,
              duration: v.length,
              encodeProgress: v.encodeProgress,
            })));
            hasMore = page < (response.totalPages || 1);
            page++;
          } catch (err) {
            console.error(`  ⚠️ Error fetching page ${page}:`, err.message);
            break;
          }
        }

        for (const video of collectionVideos) {
          const parsed = await this.parseVideoTitle(video.title, collection.name);
          if (parsed) {
            gradesSet.add(parsed.gradeName);
            if (!areasMap.has(parsed.gradeName)) areasMap.set(parsed.gradeName, new Set());
            areasMap.get(parsed.gradeName)?.add(parsed.areaName);
            
            const areaKey = `${parsed.gradeName}|${parsed.areaName}`;
            if (!topicsMap.has(areaKey)) topicsMap.set(areaKey, new Set());
            topicsMap.get(areaKey)?.add(parsed.topicName);
            
            if (parsed.subtopicName) {
              const topicKey = `${parsed.gradeName}|${parsed.areaName}|${parsed.topicName}`;
              if (!subtopicsMap.has(topicKey)) subtopicsMap.set(topicKey, new Set());
              subtopicsMap.get(topicKey)?.add(parsed.subtopicName);
            }
          }
        }
      }

      if (dryRun) {
        console.log('🔍 DRY RUN - Would delete and recreate:');
        console.log(`   Grades: ${gradesSet.size}`);
        console.log(`   Areas: ${Array.from(areasMap.values()).reduce((a, s) => a + s.size, 0)}`);
        console.log(`   Topics: ${Array.from(topicsMap.values()).reduce((a, s) => a + s.size, 0)}`);
        console.log(`   Subtopics: ${Array.from(subtopicsMap.values()).reduce((a, s) => a + s.size, 0)}`);
        return;
      }

      // Delete existing data (in reverse order of foreign key dependencies)
      console.log('🗑️ Deleting existing lessons...');
      await DB.Lessons.destroy({ where: {} });
      console.log('🗑️ Deleting existing subtopics...');
      await DB.Subtopics.destroy({ where: {} });
      console.log('🗑️ Deleting existing topics...');
      await DB.Topics.destroy({ where: {} });
      console.log('🗑️ Deleting existing learning areas...');
      await DB.LearningAreas.destroy({ where: {} });
      console.log('🗑️ Deleting existing grades...');
      await DB.Grades.destroy({ where: {} });

       // Create new hierarchy
       for (const gradeName of gradesSet) {
         const level = await this.getOrCreateLearningLevel(gradeName);
         const grade = await this.getOrCreateGrade(gradeName);
        const areas = areasMap.get(gradeName);
        if (areas) {
          for (const areaName of areas) {
            const area = await this.getOrCreateArea(areaName, grade.id);
            const topics = topicsMap.get(`${gradeName}|${areaName}`);
            if (topics) {
              for (const topicName of topics) {
                const topic = await this.getOrCreateTopic(topicName, area.id);
                const subtopics = subtopicsMap.get(`${gradeName}|${areaName}|${topicName}`);
                if (subtopics) {
                  for (const subtopicName of subtopics) {
                    await this.getOrCreateSubtopic(subtopicName, topic.topic_id);
                  }
                }
              }
            }
          }
        }
      }

      console.log('\n✅ Hierarchy reset complete.');
    } catch (error: any) {
      console.error('❌ Fatal error during reset:', error.message);
      throw error;
    }
  }

  /**
   * Reconcile all Bunny videos with local lessons
   */
   async reconcile(options: { dryRun?: boolean; force?: boolean } = {}): Promise<ReconciliationResult> {
     const { dryRun = false, force = false } = options;

     console.log('🔄 Starting Bunny → Lessons Reconciliation\n');
     console.log('='.repeat(60));
     console.log(`Mode: ${dryRun ? '🔍 DRY RUN' : '⚡ LIVE'}`);
     console.log(`Force: ${force ? 'Yes' : 'No'}`);
     console.log('');

     const result: ReconciliationResult = {
      totalVideos: 0,
      linked: 0,
      skipped: 0,
      failed: 0,
      details: []
    };

    try {
      // Fetch all Bunny collections
      console.log('📦 Fetching Bunny collections...');
      const collectionsResponse = await bunnyService.getStreamCollections();
      const collections = collectionsResponse.items || collectionsResponse.collections || [];

      console.log(`   Found ${collections.length} collections\n`);

      // Process each collection
      for (const collection of collections) {
        console.log(`📁 Collection: ${collection.name} (ID: ${collection.guid})`);

         // Fetch videos (paginated)
         const collectionVideos: BunnyVideo[] = [];
         let page = 1;
         let hasMore = true;

         while (hasMore) {
           try {
             const response = await bunnyService.getStreamVideos(page, 100);
             const pageVideos = (response.items || response.videos || []).filter((v: any) =>
               v.collectionId === collection.guid
             );

collectionVideos.push(...pageVideos.map((v: any) => ({
                guid: v.guid,
                title: v.title,
                collectionId: v.collectionId,
                status: mapStatus(v.status),
                videoUrl: getStreamUrl(v.guid),
                thumbnailUrl: getThumbnailUrl(v.guid),
               previewUrl: v.previewUrl,
               description: v.description,
               duration: v.length || v.duration || 0,
               encodeProgress: v.encodeProgress,
               views: v.views,
               dateUploaded: v.dateUploaded,
               storageSize: v.storageSize,
             })));

             hasMore = page < (response.totalPages || 1);
             page++;
           } catch (err) {
             console.error(`  ⚠️  Error fetching page ${page}:`, err.message);
             break;
           }
         }

        console.log(`   📹 ${collectionVideos.length} videos`);

        // Process each video
        for (const video of collectionVideos) {
          result.totalVideos++;

          try {
            // Parse title
            const parsed = await this.parseVideoTitle(video.title, collection.name);
            if (!parsed) {
              result.skipped++;
              result.details.push({
                videoId: video.guid,
                videoTitle: video.title,
                collectionName: collection.name,
                status: 'skipped',
                message: 'Could not parse title'
              });
              continue;
            }

            // Find or create matching lesson
            const match = await this.findOrCreateLessonByHierarchy(parsed, video);

            const { lesson } = match;

            // Check if already linked
            if (lesson.bunny_video_id && !force) {
              result.skipped++;
              result.details.push({
                videoId: video.guid,
                videoTitle: video.title,
                collectionName: collection.name,
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                status: 'skipped',
                message: `Already linked to ${lesson.bunny_video_id}`
              });
              continue;
            }

            if (dryRun) {
              result.linked++;
              result.details.push({
                videoId: video.guid,
                videoTitle: video.title,
                collectionName: collection.name,
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                status: 'linked',
                message: 'Would link (dry-run)'
              });
             } else {
               // Update lesson - link the Bunny video ID (metadata already set)
               await DB.Lessons.update(
                 { bunny_video_id: video.guid },
                 { where: { id: lesson.id } }
               );

               result.linked++;
               result.details.push({
                 videoId: video.guid,
                 videoTitle: video.title,
                 collectionName: collection.name,
                 lessonId: lesson.id,
                 lessonTitle: lesson.title,
                 status: 'linked',
                 message: 'Linked successfully'
               });
             }
          } catch (error: any) {
            result.failed++;
            result.details.push({
              videoId: video.guid,
              videoTitle: video.title,
              collectionName: collection.name,
              status: 'error',
              message: error.message
            });
          }
        }
      }

      console.log('');
      console.log('='.repeat(60));
      console.log('📊 RECONCILIATION SUMMARY\n');
      console.log(`   Total videos: ${result.totalVideos}`);
      console.log(`   ✅ Linked: ${result.linked}`);
      console.log(`   ⏭️  Skipped: ${result.skipped}`);
      console.log(`   ❌ Failed: ${result.failed}`);
      console.log('');
      console.log(dryRun
        ? '🔍 DRY RUN complete. Use "node bunnyLessonsRecon.ts" to apply.'
        : '⚡ Reconciliation complete.');

      return result;

    } catch (error: any) {
      console.error('❌ Fatal error:', error.message);
      throw error;
    }
  }

  /**
   * Get reconciliation statistics only (no updates)
   */
   async getStats(): Promise<{
     totalBunnyVideos: number;
     mappedLessons: number;
     unmappedVideos: number;
     orphanedVideos: number;
   }> {
     try {
       // Get all Bunny videos
       const allVideos: any[] = [];
       let page = 1;
       let hasMore = true;

       while (hasMore) {
         const response = await bunnyService.getStreamVideos(page, 100);
         const videos = response.items || response.videos || [];
         allVideos.push(...videos.map((v: any) => v.guid));
         hasMore = page < (response.totalPages || 1);
         page++;
       }

       // Get all lessons with bunny_video_id
       const lessons = await DB.Lessons.findAll({
         where: { bunny_video_id: { [DB.Op.not]: null } },
         attributes: ['id', 'bunny_video_id'],
         raw: true
       });

       const bunnyVideoIds = new Set(lessons.map(l => l.bunny_video_id));
       const mappedLessons = lessons.length;
       const unmappedVideos = allVideos.filter(vid => !bunnyVideoIds.has(vid)).length;

       // Count orphaned (referenced but don't exist in Bunny)
       let orphaned = 0;
       for (const lesson of lessons) {
         try {
           await bunnyService.getStreamVideo(lesson.bunny_video_id);
         } catch {
           orphaned++;
         }
       }

       return {
         totalBunnyVideos: allVideos.length,
         mappedLessons,
         unmappedVideos,
         orphanedVideos: orphaned
       };
     } catch (error: any) {
       console.error('Error getting stats:', error.message);
       throw error;
     }
   }

   /**
    * Cleanup orphaned Bunny video references
    * Removes bunny_video_id from lessons where the video no longer exists in Bunny
    */
  async cleanupOrphaned(options: { dryRun?: boolean } = {}): Promise<{
    totalChecked: number;
    orphaned: number;
    cleaned: number;
    skipped: number;
    errors: number;
    details: Array<{
      lessonId: number;
      lessonTitle: string;
      videoId: string;
      action: 'cleaned' | 'skipped' | 'error';
      message: string;
    }>;
  }> {
    const { dryRun = false } = options;

    console.log('🧹 Starting Orphaned Bunny Videos Cleanup\n');
    console.log('='.repeat(60));
    console.log(`Mode: ${dryRun ? '🔍 DRY RUN' : '⚡ LIVE'}`);
    console.log('');

    const result = {
      totalChecked: 0,
      orphaned: 0,
      cleaned: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{
        lessonId: number;
        lessonTitle: string;
        videoId: string;
        action: 'cleaned' | 'skipped' | 'error';
        message: string;
      }>
    };

    try {
      // Get all lessons with bunny_video_id
      const lessonsWithVideos = await DB.Lessons.findAll({
        where: { bunny_video_id: { [DB.Op.not]: null } },
        attributes: ['id', 'title', 'bunny_video_id', 'transcoding_status'],
        raw: true
      });

      console.log(`Found ${lessonsWithVideos.length} lessons with Bunny video references\n`);

      result.totalChecked = lessonsWithVideos.length;

      // Check each video
      for (const lesson of lessonsWithVideos) {
        try {
          console.log(`Checking lesson "${lesson.title}" (ID: ${lesson.id}) - video: ${lesson.bunny_video_id}`);

          // Try to fetch the video from Bunny
          try {
            await bunnyService.getStreamVideo(lesson.bunny_video_id);
            // Video exists, skip
            console.log(`  ✅ Video exists in Bunny`);
            result.skipped++;
            result.details.push({
              lessonId: lesson.id,
              lessonTitle: lesson.title,
              videoId: lesson.bunny_video_id,
              action: 'skipped',
              message: 'Video exists in Bunny'
            });
          } catch (error: any) {
            // Video not found (404 or similar)
            if (error.message?.includes('404') || error.message?.includes('not found')) {
              console.log(`  ❌ Video not found in Bunny (orphaned)`);
              result.orphaned++;

              if (dryRun) {
                result.cleaned++;
                result.details.push({
                  lessonId: lesson.id,
                  lessonTitle: lesson.title,
                  videoId: lesson.bunny_video_id,
                  action: 'cleaned',
                  message: 'Would remove orphaned video reference (dry-run)'
                });
              } else {
                // Update lesson to remove bunny_video_id
                await DB.Lessons.update(
                  {
                    bunny_video_id: null,
                    transcoding_status: 'pending'
                  },
                  { where: { id: lesson.id } }
                );
                result.cleaned++;
                result.details.push({
                  lessonId: lesson.id,
                  lessonTitle: lesson.title,
                  videoId: lesson.bunny_video_id,
                  action: 'cleaned',
                  message: 'Removed orphaned video reference'
                });
              }
            } else {
              // Other error (network, permission, etc.)
              console.log(`  ⚠️  Error checking video: ${error.message}`);
              result.errors++;
              result.details.push({
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                videoId: lesson.bunny_video_id,
                action: 'error',
                message: `Error: ${error.message}`
              });
            }
          }
        } catch (error: any) {
          console.error(`  ❌ Unexpected error: ${error.message}`);
          result.errors++;
          result.details.push({
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            videoId: lesson.bunny_video_id,
            action: 'error',
            message: `Unexpected: ${error.message}`
          });
        }
      }

      console.log('');
      console.log('='.repeat(60));
      console.log('📊 CLEANUP SUMMARY\n');
      console.log(`   Total checked: ${result.totalChecked}`);
      console.log(`   ✅ Still valid: ${result.skipped}`);
      console.log(`   🗑️  Orphaned: ${result.orphaned}`);
      console.log(`   🧹 Cleaned: ${result.cleaned}`);
      console.log(`   ❌ Errors: ${result.errors}`);
      console.log('');
      console.log(dryRun
        ? '🔍 DRY RUN complete. Remove --dry-run to apply cleanup.'
        : '⚡ Cleanup complete.');

      return result;
    } catch (error: any) {
      console.error('❌ Fatal error:', error.message);
      throw error;
    }
  }
}

// Singleton instance
const bunnyReconciliationService = new BunnyReconciliationService();
export default bunnyReconciliationService;
