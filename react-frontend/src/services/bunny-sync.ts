import { apiService } from "./api";
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
  MappingStatusResponse
} from "../types/bunny-sync";

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
    const response = await apiService.get<{ success: boolean; data: any[] }>(
      "/bunny-sync/bunny-videos",
      { params: { page: 1, limit: 100 } }
    );
    if (!response.success) {
      throw new Error('Failed to fetch Bunny videos');
    }
    return (response.data || []).map((v: any) => ({
      guid: v.guid || v.bunnyVideoId,
      title: v.title || '',
      transcodingStatus: v.status || v.transcodingStatus || 'pending',
      mappedLesson: v.mappedLesson || null,
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
    
    const normalized: MappingItem[] = (response.data || []).map((item: any) => ({
      bunnyVideoId: item.guid || item.bunnyVideoId,
      title: item.title || '',
      transcodingStatus: item.status || item.transcodingStatus || 'pending',
      isMapped: item.isMapped || false,
      mappedLesson: item.mappedLesson || undefined,
    }));
    
     return {
       mappingData: normalized,
       summary: {
         total: response.summary?.total || 0,
         mapped: response.summary?.mapped || 0,
         unmapped: response.summary?.unmapped || 0,
       }
     };
  },

  // Synced lessons
  fetchSyncedLessons: async (): Promise<SyncedLesson[]> => {
    const response = await apiService.get<{ success: boolean; data: any[] }>(
      "/bunny-sync/pending",
      { params: { limit: 1000 } }
    );
    if (!response.success) {
      throw new Error('Failed to fetch synced lessons');
    }
    
    return (response.data || []).map((l: any) => ({
      id: l.id,
      title: l.title || `Lesson #${l.id}`,
      bunny_video_id: l.bunny_video_id,
      storage_path: l.storage_path,
      transcoding_status: l.transcoding_status,
      sync_status: l.sync_status,
      sync_progress: l.sync_progress,
      thumbnail_url: undefined,
    }));
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
    const response = await apiService.get<{ success: boolean; data: Level[] }>(
      "/learning-hierarchy/levels"
    );
    if (!response.success) {
      throw new Error('Failed to fetch levels');
    }
    return response.data || [];
  },

  fetchGradesByLevel: async (levelId: number): Promise<Grade[]> => {
    const response = await apiService.get<{ success: boolean; data: Grade[] }>(
      `/learning-hierarchy/levels/${levelId}/grades`
    );
    if (!response.success) {
      throw new Error('Failed to fetch grades');
    }
    return response.data || [];
  },

  fetchAreasByGrade: async (gradeId: number): Promise<Area[]> => {
    const response = await apiService.get<{ success: boolean; data: Area[] }>(
      `/learning-hierarchy/grades/${gradeId}/areas`
    );
    if (!response.success) {
      throw new Error('Failed to fetch areas');
    }
    return response.data || [];
  },

  fetchTopicsByArea: async (areaId: number): Promise<Topic[]> => {
    const response = await apiService.get<{ success: boolean; data: Topic[] }>(
      `/learning-hierarchy/areas/${areaId}/topics`
    );
    if (!response.success) {
      throw new Error('Failed to fetch topics');
    }
    return response.data || [];
  },

  fetchSubtopicsByTopic: async (topicId: number): Promise<Subtopic[]> => {
    const response = await apiService.get<{ success: boolean; data: Subtopic[] }>(
      `/learning-hierarchy/topics/${topicId}/subtopics`
    );
    if (!response.success) {
      throw new Error('Failed to fetch subtopics');
    }
    return response.data || [];
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