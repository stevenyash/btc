import DB from '../models/db.js';
import bunnyService, { getStreamUrl, getThumbnailUrl, mapStatus } from '../services/bunnyService.js';

interface ParsedHierarchy {
  gradeName: string;
  areaName: string;
  topicName?: string;
  subtopicName: string;
  collectionName?: string;
}

function normalizeMatchName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeLearningAreaName(value: string): string {
  const normalized = normalizeMatchName(value);
  if (normalized === 'math' || normalized === 'maths') return 'mathematics';
  return normalized;
}

function nameSimilarity(leftValue: string, rightValue: string): number {
  const left = normalizeMatchName(leftValue);
  const right = normalizeMatchName(rightValue);
  const longest = Math.max(left.length, right.length);
  if (longest === 0) return 1;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i++) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= right.length; j++) {
      const above = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return 1 - previous[right.length] / longest;
}

function strictParseVideoTitle(title: string): ParsedHierarchy | null {
  const stem = title.replace(/\.[^/.]+$/, '').trim();
  const parts = stem.split(/\s+-\s+/).map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return null;

  const prefix = parts[0].match(/^(grade\s+\d+|form\s+\d+|senior\s+\d+|year\s+\d+|class\s+\d+)\s+(.+)$/i);
  if (!prefix || !prefix[2].trim()) return null;

  // For 3+ part titles (Grade Area - Topic - Subtopic), use parts[1] as topic and rest as subtopic.
  if (parts.length >= 3) {
    return {
      gradeName: prefix[1],
      areaName: prefix[2].trim(),
      topicName: parts[1],
      subtopicName: parts.slice(2).join(' - ').trim(),
    };
  }

  // 2-part title: Grade Area - Lesson title; no topic was provided.
  return {
    gradeName: prefix[1],
    areaName: prefix[2].trim(),
    topicName: undefined,
    subtopicName: parts[1],
  };
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

async function getAllStreamVideos(): Promise<BunnyVideo[]> {
  const videos: BunnyVideo[] = [];
  const seenVideoIds = new Set<string>();
  let page = 1;
  let expectedTotal = Number.POSITIVE_INFINITY;

  while (videos.length < expectedTotal) {
    const response = await bunnyService.getStreamVideos(page, 100);
    const pageVideos = response.items || response.videos || [];
    if (pageVideos.length === 0) break;

    let addedOnPage = 0;
    for (const video of pageVideos) {
      if (!video.guid || seenVideoIds.has(video.guid)) continue;
      seenVideoIds.add(video.guid);
      videos.push({
        ...video,
        status: typeof video.status === 'number' ? mapStatus(video.status) : video.status || 'processing',
        videoUrl: video.videoUrl || getStreamUrl(video.guid),
        thumbnailUrl: video.thumbnailUrl || getThumbnailUrl(video.guid),
      });
      addedOnPage++;
    }
    if (addedOnPage === 0) break;

    const totalItems = Number(response.totalItems);
    const itemsPerPage = Number(response.itemsPerPage) || 100;
    if (Number.isFinite(totalItems) && totalItems > 0) {
      expectedTotal = totalItems;
    } else if (pageVideos.length < itemsPerPage) {
      break;
    }
    page++;
  }

  return videos;
}

interface ReconciliationResult {
  dryRun: boolean;
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
          name: { [DB.op.like]: levelName },
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
        where: { name: { [DB.op.like]: cleanName } },
        raw: true
      });
     if (grade) return grade;

     // Extract standard format (Form 3, Grade 10, etc.)
     const gradeMatch = cleanName.match(/(Form|Grade|Class|Year)\s*(\d+)/i);
     if (gradeMatch) {
        const standardName = `${gradeMatch[1]} ${gradeMatch[2]}`;
        grade = await DB.Grades.findOne({
          where: { name: { [DB.op.like]: `%${standardName}%` } },
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
      if (normalizeLearningAreaName(cleanName) === 'mathematics') {
        cleanName = 'Mathematics';
      }

      // Try exact match
      let area = await DB.LearningAreas.findOne({
        where: { name: cleanName, grade_id: gradeId },
        raw: true
      });
      if (area) return area;

      // Try case-insensitive
      area = await DB.LearningAreas.findOne({
        where: {
          name: { [DB.op.like]: cleanName },
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
            name: { [DB.op.like]: withoutNumber },
            grade_id: gradeId
          },
          raw: true
        });
        if (area) return area;
      }

      const candidateAreas = await DB.LearningAreas.findAll({
        where: { grade_id: gradeId },
        attributes: ['id', 'name'],
        raw: true,
      });
      const rankedAreas = candidateAreas
        .map((candidate: any) => ({
          area: candidate,
          score: nameSimilarity(
            normalizeLearningAreaName(cleanName),
            normalizeLearningAreaName(candidate.name || '')
          ),
        }))
        .sort((left: any, right: any) => right.score - left.score);
      if (
        rankedAreas[0]?.score >= 0.8 &&
        (!rankedAreas[1] || rankedAreas[0].score - rankedAreas[1].score >= 0.08)
      ) {
        return rankedAreas[0].area;
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
      // Handle undefined/null topicName - create a "General" topic instead of crashing
      if (!topicName || typeof topicName !== 'string') {
        console.log(`  ⚠️  Topic name is empty/undefined, using "General" topic`);
        topicName = 'General';
      }
      
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
          name: { [DB.op.like]: cleanName },
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
          name: { [DB.op.like]: cleanName },
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
        if (videoData?.guid && lesson.bunny_video_id && lesson.bunny_video_id !== videoData.guid) {
          throw new Error(`Lesson is already linked to Bunny video ${lesson.bunny_video_id}`);
        }

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

        if (!parsed.topicName) {
          const targetName = normalizeMatchName(parsed.subtopicName);
          const lessons = await DB.Lessons.findAll({
            where: { area_id: area.id, is_active: true },
            include: [{
              model: DB.Subtopics,
              as: 'subtopic',
              attributes: ['subtopic_id', 'name'],
              required: false,
            }],
          });
          const matchingLessons = lessons.filter((lesson: any) => {
            const data = lesson.toJSON();
            return normalizeMatchName(data.title || '') === targetName ||
              normalizeMatchName(data.subtopic?.name || '') === targetName;
          });
          if (matchingLessons.length > 1) {
            throw new Error(`More than one existing lesson matches "${parsed.subtopicName}"`);
          }
          if (matchingLessons.length === 1) {
            const existingLesson: any = matchingLessons[0];
            const data = existingLesson.toJSON();
            if (data.bunny_video_id && data.bunny_video_id !== video.guid) {
              throw new Error(`Lesson is already linked to Bunny video ${data.bunny_video_id}`);
            }
            const updateData: any = {
              bunny_video_id: video.guid,
              video_guid: video.guid,
              bunny_url: video.videoUrl || getStreamUrl(video.guid),
              thumbnail_url: video.thumbnailUrl || getThumbnailUrl(video.guid),
              primary_thumbnail: video.thumbnailUrl || getThumbnailUrl(video.guid),
              transcoding_status: video.status || 'pending',
            };
            if (video.previewUrl) updateData.preview_url = video.previewUrl;
            if (video.description) updateData.description = video.description;
            if (video.duration !== undefined) updateData.duration = video.duration;
            if (video.collectionId) updateData.collection_id = video.collectionId;
            if (video.encodeProgress !== undefined) updateData.encode_progress = video.encodeProgress;
            if (video.views !== undefined) updateData.views = video.views;
            if (video.dateUploaded) updateData.date_uploaded = new Date(video.dateUploaded);
            await existingLesson.update(updateData);
            return { lesson: await DB.Lessons.findByPk(data.id), created: false };
          }
        }

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

       const existingLesson = await DB.Lessons.findOne({
         where: {
           area_id: area.id,
           topic_id: topic.topic_id,
           subtopic_id: subtopicId ?? undefined,
           is_active: true,
         },
         attributes: ['id'],
         raw: true,
       });

       // Step 5: Get or create lesson with full video metadata
       const lesson = await this.getOrCreateLesson(
         parsed.subtopicName,
         area.id,
         topic.topic_id,
         subtopicId,
         video
       );

       const created = !existingLesson;
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
    const { dryRun = false } = options;
    const result: ReconciliationResult = {
      dryRun,
      totalVideos: 0,
      linked: 0,
      skipped: 0,
      failed: 0,
      details: [],
    };

    const [collectionsResponse, lessons] = await Promise.all([
      bunnyService.getStreamCollections(),
      DB.Lessons.findAll({
        attributes: ['id', 'title', 'bunny_video_id', 'area_id', 'topic_id', 'subtopic_id', 'is_active'],
        include: [
          {
            model: DB.LearningAreas,
            as: 'learning_area',
            attributes: ['id', 'name', 'grade_id'],
            include: [{
              model: DB.Grades,
              as: 'grade_info',
              attributes: ['id', 'name'],
            }],
          },
          { model: DB.Topics, as: 'topic', attributes: ['topic_id', 'name'] },
          { model: DB.Subtopics, as: 'subtopic', attributes: ['subtopic_id', 'name'] },
        ],
      }),
    ]);
    const collections = collectionsResponse.items || collectionsResponse.collections || [];
    const collectionNames = new Map(collections.map((collection: any) => [collection.guid, collection.name]));
    const lessonRows = lessons.map((lesson: any) => lesson.toJSON());
    const linkedLessonByVideoId = new Map<string, any>();
    for (const lesson of lessonRows) {
      if (lesson.bunny_video_id) linkedLessonByVideoId.set(lesson.bunny_video_id, lesson);
    }

    const videos = await getAllStreamVideos();

    const plans: Array<{
      video: BunnyVideo;
      collectionName: string;
      lesson?: any;
      message: string;
      status: 'linked' | 'skipped' | 'not_found' | 'error';
    }> = [];
    const proposedLessonCounts = new Map<number, number>();

    for (const video of videos) {
      result.totalVideos++;
      const collectionName = collectionNames.get(video.collectionId || '') || '';
      const alreadyLinked = linkedLessonByVideoId.get(video.guid);
      if (alreadyLinked) {
        plans.push({
          video,
          collectionName,
          lesson: alreadyLinked,
          message: `Already linked to lesson #${alreadyLinked.id}`,
          status: 'skipped',
        });
        continue;
      }

      const parsed = strictParseVideoTitle(video.title);
      if (!parsed) {
        plans.push({
          video,
          collectionName,
          message: 'Title does not match a supported grade / learning-area / topic format',
          status: 'not_found',
        });
        continue;
      }

      const gradeKey = normalizeMatchName(parsed.gradeName);
        const gradeCandidates = lessonRows.filter((lesson: any) =>
          lesson.is_active &&
          normalizeMatchName(lesson.learning_area?.grade_info?.name || '') === gradeKey
        );

      const areaCandidates = new Map<number, { name: string; score: number }>();
      for (const lesson of gradeCandidates) {
        const area = lesson.learning_area;
        if (!area) continue;
        const score = nameSimilarity(
          normalizeLearningAreaName(parsed.areaName),
          normalizeLearningAreaName(area.name || '')
        );
        const previous = areaCandidates.get(area.id);
        if (!previous || score > previous.score) {
          areaCandidates.set(area.id, { name: area.name, score });
        }
      }
      const rankedAreas = [...areaCandidates.entries()]
        .map(([id, candidate]) => ({ id, ...candidate }))
        .sort((left, right) => right.score - left.score);
      const bestArea = rankedAreas[0];
      if (!bestArea || bestArea.score < 0.8) {
        plans.push({
          video,
          collectionName,
          message: `No confident learning-area match for "${parsed.areaName}" under "${parsed.gradeName}"`,
          status: 'not_found',
        });
        continue;
      }
      if (rankedAreas[1] && bestArea.score - rankedAreas[1].score < 0.08) {
        plans.push({
          video,
          collectionName,
          message: `Learning-area match is ambiguous: ${rankedAreas.slice(0, 2).map((area) => area.name).join(' / ')}`,
          status: 'skipped',
        });
        continue;
      }

      const targetName = normalizeMatchName(parsed.subtopicName);
      const possibleLessons = gradeCandidates.filter((lesson: any) => {
        if (lesson.area_id !== bestArea.id) return false;
        if (parsed.topicName && normalizeMatchName(lesson.topic?.name || '') !== normalizeMatchName(parsed.topicName)) {
          return false;
        }
        return normalizeMatchName(lesson.subtopic?.name || '') === targetName ||
          normalizeMatchName(lesson.title || '') === targetName;
      });
      if (possibleLessons.length === 0) {
        plans.push({
          video,
          collectionName,
          message: `No existing lesson matches "${parsed.subtopicName}" under ${bestArea.name}`,
          status: 'not_found',
        });
        continue;
      }
      if (possibleLessons.length > 1) {
        plans.push({
          video,
          collectionName,
          message: `More than one existing lesson matches "${parsed.subtopicName}"`,
          status: 'skipped',
        });
        continue;
      }

      const lesson = possibleLessons[0];
      if (lesson.bunny_video_id && lesson.bunny_video_id !== video.guid) {
        plans.push({
          video,
          collectionName,
          lesson,
          message: `Lesson is already linked to Bunny video ${lesson.bunny_video_id}`,
          status: 'skipped',
        });
        continue;
      }

      proposedLessonCounts.set(lesson.id, (proposedLessonCounts.get(lesson.id) || 0) + 1);
      plans.push({
        video,
        collectionName,
        lesson,
        message: dryRun ? 'Unambiguous existing lesson match; would link' : 'Unambiguous existing lesson match',
        status: 'linked',
      });
    }

    for (const plan of plans) {
      if (plan.status === 'linked' && plan.lesson && (proposedLessonCounts.get(plan.lesson.id) || 0) > 1) {
        plan.status = 'skipped';
        plan.message = 'Multiple Bunny videos match this lesson; no video was linked';
      }
    }

    for (const plan of plans) {
      if (plan.status === 'linked' && plan.lesson && !dryRun) {
        const transaction = await DB.Lessons.sequelize.transaction();
        try {
          const currentLesson = await DB.Lessons.findByPk(plan.lesson.id, {
            transaction,
            lock: transaction.LOCK.UPDATE,
          });
          const duplicateLink = await DB.Lessons.findOne({
            where: {
              bunny_video_id: plan.video.guid,
              id: { [DB.op.ne]: plan.lesson.id },
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
          });
          if (!currentLesson || duplicateLink || currentLesson.bunny_video_id) {
            await transaction.rollback();
            plan.status = 'skipped';
            plan.message = duplicateLink
              ? `Bunny video is already linked to lesson #${duplicateLink.id}`
              : 'Lesson was linked or changed while reconciliation was running';
          } else {
            await currentLesson.update({
              bunny_video_id: plan.video.guid,
              video_guid: plan.video.guid,
              bunny_url: plan.video.videoUrl || getStreamUrl(plan.video.guid),
              thumbnail_url: plan.video.thumbnailUrl || getThumbnailUrl(plan.video.guid),
              transcoding_status: plan.video.status || 'pending',
            }, { transaction });
            await transaction.commit();
            plan.message = 'Linked to existing lesson';
          }
        } catch (error) {
          await transaction.rollback();
          plan.status = 'error';
          plan.message = error instanceof Error ? error.message : String(error);
        }
      }

      if (plan.status === 'linked') result.linked++;
      else if (plan.status === 'not_found' || plan.status === 'error') result.failed++;
      else result.skipped++;

      result.details.push({
        videoId: plan.video.guid,
        videoTitle: plan.video.title,
        collectionName: plan.collectionName,
        lessonId: plan.lesson?.id,
        lessonTitle: plan.lesson?.title,
        status: plan.status,
        message: plan.message,
      });
    }

    return result;
  }

  /**
   * Fetch Bunny videos and create/link lessons from their parsed learning hierarchy.
   */
  async mapAllVideosToLessons(): Promise<ReconciliationResult> {
    const result: ReconciliationResult = {
      dryRun: false,
      totalVideos: 0,
      linked: 0,
      skipped: 0,
      failed: 0,
      details: [],
    };

    const [collectionsResponse, linkedLessons] = await Promise.all([
      bunnyService.getStreamCollections(),
      DB.Lessons.findAll({
        attributes: ['id', 'title', 'bunny_video_id'],
        where: { bunny_video_id: { [DB.op.not]: null, [DB.op.ne]: '' } },
        raw: true,
      }),
    ]);
    const collections = collectionsResponse.items || collectionsResponse.collections || [];
    const collectionNames = new Map<string, string>(
      collections.map((collection: any) => [collection.guid, collection.name])
    );
    const linkedLessonByVideoId = new Map<string, any>(
      linkedLessons
        .filter((lesson: any) => lesson.bunny_video_id)
        .map((lesson: any) => [lesson.bunny_video_id, lesson])
    );

    const videos = await getAllStreamVideos();

    for (const video of videos) {
      result.totalVideos++;
      const collectionName = collectionNames.get(video.collectionId || '') || '';
      const existingLink = linkedLessonByVideoId.get(video.guid);
      if (existingLink) {
        result.skipped++;
        result.details.push({
          videoId: video.guid,
          videoTitle: video.title,
          collectionName,
          lessonId: existingLink.id,
          lessonTitle: existingLink.title,
          status: 'skipped',
          message: `Already linked to lesson #${existingLink.id}`,
        });
        continue;
      }

      const parsed = strictParseVideoTitle(video.title);
      if (!parsed) {
        result.failed++;
        result.details.push({
          videoId: video.guid,
          videoTitle: video.title,
          collectionName,
          status: 'not_found',
          message: 'Title does not match a supported grade / learning-area / topic format',
        });
        continue;
      }

      try {
        const { lesson, created } = await this.findOrCreateLessonByHierarchy(parsed, video);
        linkedLessonByVideoId.set(video.guid, lesson);
        result.linked++;
        result.details.push({
          videoId: video.guid,
          videoTitle: video.title,
          collectionName,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          status: 'linked',
          message: created ? 'Created lesson and linked Bunny video' : 'Linked Bunny video to existing lesson',
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const isConflict = message.startsWith('Lesson is already linked to Bunny video ');
        if (isConflict) result.skipped++;
        else result.failed++;
        result.details.push({
          videoId: video.guid,
          videoTitle: video.title,
          collectionName,
          status: isConflict ? 'skipped' : 'error',
          message,
        });
      }
    }

    return result;
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
         where: { bunny_video_id: { [DB.op.not]: null } },
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
        where: { bunny_video_id: { [DB.op.not]: null } },
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
