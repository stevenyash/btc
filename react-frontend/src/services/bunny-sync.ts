import { apiService } from "./api";
import { adminService } from "./admin";
import type {
  BunnyVideo,
  MappingItem,
  SyncedLesson,
  Collection,
  Level,
  Grade,
  Area,
  Topic,
  Subtopic,
  LessonDetail,
  BunnySyncStats,
  MappingStatusResponse,
  FilenameLinkCandidate,
  FilenameBatchLink,
} from "../types/bunny-sync";

const normalizeTranscodingStatus = (status: string | number | undefined): BunnyVideo['transcodingStatus'] => {
  if (status === undefined) {
    return 'pending';
  }
  if (status === 'pending' || status === 'processing' || status === 'completed' || status === 'failed') {
    return status;
  }

  switch (Number(status)) {
    case 0:
    case 1:
      return 'pending';
    case 2:
    case 3:
    case 7:
      return 'processing';
    case 4:
    case 8:
      return 'completed';
    case 5:
    case 6:
    default:
      return 'failed';
  }
};

export const bunnySyncService = {
  // Stats
  fetchStats: async (): Promise<BunnySyncStats> => {
    const response = await apiService.get<{ success: boolean; totalLessons: number; inSync: number; pending: number; noBunnyVideo: number }>(
      "/bunny-sync/stats"
    );
    if (!response.success) {
      throw new Error('Failed to fetch stats');
    }
    return {
      totalLessons: response.totalLessons || 0,
      inSync: response.inSync || 0,
      pending: response.pending || 0,
      noBunnyVideo: response.noBunnyVideo || 0,
    };
  },

  // Bunny videos
  fetchBunnyVideos: async (): Promise<BunnyVideo[]> => {
    const response = await apiService.get<MappingStatusResponse>(
      "/bunny-sync/mapping-status",
      { params: { page: 1, limit: 100 } }
    );
    if (!response.success) {
      throw new Error('Failed to fetch Bunny video mappings');
    }
    return (response.data || []).map((video) => ({
      guid: video.guid,
      title: video.title || '',
      transcodingStatus: normalizeTranscodingStatus(video.status),
      mappedLesson: video.mappedLesson
        ? { id: video.mappedLesson.lessonId, title: video.mappedLesson.lessonTitle }
        : null,
    }));
  },

  // Mapping data
  fetchMappingData: async (): Promise<{ mappingData: MappingItem[]; summary: { total: number; mapped: number; unmapped: number } }> => {
    const response = await apiService.get<MappingStatusResponse>(
      "/bunny-sync/mapping-status",
      { params: { page: 1, limit: 100 } }
    );
    if (!response.success) {
      throw new Error('Failed to fetch mapping status');
    }
    
    const normalized: MappingItem[] = (response.data || []).map((item) => ({
      bunnyVideoId: item.guid,
      title: item.title || '',
      transcodingStatus: normalizeTranscodingStatus(item.status),
      isMapped: item.isMapped,
      mappedLesson: item.mappedLesson
        ? { id: item.mappedLesson.lessonId, title: item.mappedLesson.lessonTitle }
        : undefined,
    }));
    
     return {
       mappingData: normalized,
       summary: {
         total: response.summary?.totalBunnyVideos ?? response.summary?.total ?? 0,
         mapped: response.summary?.mappedVideos ?? response.summary?.mapped ?? 0,
         unmapped: response.summary?.unmappedVideos ?? response.summary?.unmapped ?? 0,
       }
     };
  },

  // Synced lessons
  fetchSyncedLessons: async (): Promise<SyncedLesson[]> => {
    const response = await apiService.get<{
      success: boolean;
      data: Array<{
        id: number;
        title?: string;
        bunny_video_id?: string | null;
        storage_path?: string | null;
        transcoding_status?: string | null;
        sync_status?: string;
        sync_progress?: number;
        thumbnail_url?: string | null;
      }>;
    }>(
      "/bunny-sync/pending",
      { params: { limit: 1000 } }
    );
    if (!response.success) {
      throw new Error('Failed to fetch synced lessons');
    }
    
    return (response.data || []).map((l) => ({
      id: l.id,
      title: l.title || `Lesson #${l.id}`,
      bunny_video_id: l.bunny_video_id || undefined,
      storage_path: l.storage_path || undefined,
      transcoding_status: l.transcoding_status || undefined,
      sync_status: l.sync_status,
      sync_progress: l.sync_progress,
      thumbnail_url: l.thumbnail_url || undefined,
    }));
  },

  syncLesson: async (lessonId: number): Promise<void> => {
    const queued = await apiService.post<{ success: boolean; jobId?: string; error?: string }>(
      `/bunny-sync/sync/${lessonId}`
    );
    if (!queued.success || !queued.jobId) {
      throw new Error(queued.error || 'Failed to queue lesson sync');
    }

    for (let attempt = 0; attempt < 120; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const response = await apiService.get<{
        success: boolean;
        job?: { status: 'pending' | 'processing' | 'completed' | 'failed'; error?: string };
        error?: string;
      }>(`/bunny-sync/job/${queued.jobId}`);

      if (!response.success || !response.job) {
        throw new Error(response.error || 'Failed to retrieve lesson sync status');
      }
      if (response.job.status === 'failed') {
        throw new Error(response.job.error || 'Lesson sync failed');
      }
      if (response.job.status === 'completed') {
        return;
      }
    }

    throw new Error('Timed out waiting for lesson sync to complete');
  },

  syncAllLessons: async (): Promise<number> => {
    const response = await apiService.post<{
      success: boolean;
      jobs?: Array<{ jobId: string; lessonId: number }>;
      error?: string;
    }>("/bunny-sync/sync-all");

    if (!response.success) {
      throw new Error(response.error || 'Failed to queue Bunny lesson sync');
    }

    return response.jobs?.length || 0;
  },

  fetchFilenameLinkPreview: async (): Promise<FilenameLinkCandidate[]> => {
    const response = await apiService.get<{
      success: boolean;
      data?: FilenameLinkCandidate[];
      error?: string;
    }>('/bunny-sync/batch-link-preview');
    if (!response.success) {
      throw new Error(response.error || 'Failed to generate filename match preview');
    }
    return response.data || [];
  },

  batchLinkVideos: async (links: FilenameBatchLink[]): Promise<number> => {
    const response = await apiService.post<{
      success: boolean;
      linked?: number;
      error?: string;
    }>('/bunny-sync/batch-link-from-filenames', { links });
    if (!response.success) {
      throw new Error(response.error || 'Failed to link Bunny videos');
    }
    return response.linked || 0;
  },

  // Collections
  fetchCollections: async (): Promise<Collection[]> => {
    const response = await apiService.get<{ success: boolean; data: Collection[] }>(
      "/bunny-sync/collections"
    );
    if (!response.success) {
      throw new Error('Failed to fetch collections');
    }
    return response.data || [];
  },

  // Learning hierarchy
  fetchLevels: async (): Promise<Level[]> => {
    return adminService.getLearningLevels();
  },

  fetchGradesByLevel: async (levelId: number): Promise<Grade[]> => {
    const grades = await adminService.getAllGrades();
    return grades.filter((grade) => Number(grade.level_id) === levelId);
  },

  fetchAreasByGrade: async (gradeId: number): Promise<Area[]> => {
    const areas = await adminService.getAllLearningAreas();
    return areas.filter((area) => Number(area.grade_id) === gradeId);
  },

  fetchTopicsByArea: async (areaId: number): Promise<Topic[]> => {
    const topics = await adminService.getAllTopics();
    return topics.filter((topic) => Number(topic.area_id) === areaId);
  },

  fetchSubtopicsByTopic: async (topicId: number): Promise<Subtopic[]> => {
    const subtopics = await adminService.getAllSubtopics();
    return subtopics.filter((subtopic) => Number(subtopic.topic_id) === topicId);
  },

  fetchFilteredLessons: async (
    areaId: number | string, 
    topicId?: number | string, 
    subtopicId?: number | string
  ): Promise<LessonDetail[]> => {
    if (!areaId) {
      return [];
    }

    const params = new URLSearchParams();
    params.append('area_id', areaId.toString());
    if (topicId) params.append('topic_id', topicId.toString());
    if (subtopicId) params.append('subtopic_id', subtopicId.toString());

    const response = await apiService.get<{ success: boolean; data: LessonDetail[] }>(
      `/learning-hierarchy/filtered-lessons?${params}`
    );
    
    if (!response.success) {
      throw new Error('Failed to fetch filtered lessons');
    }
    
    return response.data || [];
  },

  // Link video to lesson
  linkVideoToLesson: async (bunnyVideoId: string, lessonId: number): Promise<void> => {
    const response = await apiService.post<{ success: boolean; error?: string }>(
      "/bunny-sync/link-bunny-video",
      { bunnyVideoId, lessonId }
    );
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to link video');
    }
  },

  createLessonFromBunnyVideo: async (input: {
    bunnyVideoId: string;
    levelId: number;
    gradeId: number;
    areaId: number;
    topicId: number;
    subtopicId?: number;
  }): Promise<{
    id: number;
    title: string;
    level: string;
    area: string;
    topic: string;
    subtopic: string;
  }> => {
    try {
      const response = await apiService.post<{
        success: boolean;
        error?: string;
        lesson?: {
          id: number;
          title: string;
          level: string;
          area: string;
          topic: string;
          subtopic: string;
        };
      }>("/bunny-sync/link-bunny-video", input);

      if (!response.success || !response.lesson) {
        throw new Error(response.error || 'Failed to create lesson from Bunny video');
      }
      return response.lesson;
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const response = error.response;
        if (typeof response === 'object' && response !== null) {
          const status = 'status' in response && typeof response.status === 'number'
            ? response.status
            : undefined;
          const data = 'data' in response && typeof response.data === 'object' && response.data !== null
            ? response.data
            : undefined;
          const serverMessage = data && 'error' in data && typeof data.error === 'string'
            ? data.error
            : data && 'message' in data && typeof data.message === 'string'
              ? data.message
              : undefined;
          if (serverMessage?.trim()) throw new Error(serverMessage);
          if (status) {
            throw new Error(`Lesson creation failed (HTTP ${status}); check that the backend is deployed with the lesson-from-Bunny endpoint.`);
          }
        }
      }
      throw error;
    }
  },

  // Collection
  createCollection: async (name: string): Promise<Collection> => {
    const response = await apiService.post<{ success: boolean; data: Collection; error?: string }>(
      "/bunny-sync/collection",
      { name }
    );
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to create collection');
    }
    return response.data;
  },

  assignVideoToCollection: async (videoId: string, collectionId: string | null): Promise<void> => {
    const response = await apiService.post<{ success: boolean; error?: string }>(
      "/bunny-sync/video-to-collection",
      { videoId, collectionId }
    );
    
    if (!response.success) {
      throw new Error(response.error);
    }
  },
};