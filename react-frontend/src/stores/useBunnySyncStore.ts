import { create } from 'zustand';
import type {
  BunnyVideo,
  MappingItem,
  MappingStatusResponse,
  BunnySyncStats,
  SyncedLesson,
  Collection,
  Level,
  Grade,
  Area,
  Topic,
  Subtopic,
  LessonDetail,
} from '@/types/bunny-sync';

const getApiBase = () => process.env.NEXT_PUBLIC_API_URL || '';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export interface BunnySyncState {
  // Stats
  stats: BunnySyncStats;
  statsLoading: boolean;

  // Bunny videos
  bunnyVideos: BunnyVideo[];
  bunnyVideosLoading: boolean;

  // Mapping
  mappingData: MappingItem[];
  mappingSummary: {
    total: number;
    mapped: number;
    unmapped: number;
  };
  mappingLoading: boolean;

  // Synced lessons
  syncedLessons: SyncedLesson[];
  syncedLessonsLoading: boolean;

  // Collections
  collections: Collection[];
  collectionsLoading: boolean;

  // Learning hierarchy
  levels: Level[];
  grades: Grade[];
  areas: Area[];
  topics: Topic[];
  subtopics: Subtopic[];
  hierarchyLoading: boolean;

  // Filtered lessons
  filteredLessons: LessonDetail[];
  filteredLessonsLoading: boolean;

  // Selections
  selectedLevelId: number | '';
  selectedGradeId: number | '';
  selectedAreaId: number | '';
  selectedTopicId: number | '';
  selectedSubtopicId: number | '';
  selectedLessonId: number | '';
  selectedUnmappedVideo: BunnyVideo | null;

  // Actions
  fetchStats: () => Promise<void>;
  fetchBunnyVideos: () => Promise<void>;
  fetchMappingData: () => Promise<void>;
  fetchSyncedLessons: () => Promise<void>;
  fetchCollections: () => Promise<void>;
  fetchLevels: () => Promise<void>;
  fetchGradesByLevel: (levelId: number) => Promise<void>;
  fetchAreasByGrade: (gradeId: number) => Promise<void>;
  fetchTopicsByArea: (areaId: number) => Promise<void>;
  fetchSubtopicsByTopic: (topicId: number) => Promise<void>;
  fetchFilteredLessons: (areaId: number | string, topicId?: number | string, subtopicId?: number | string) => Promise<void>;

  // Selection setters
  setSelectedLevelId: (id: number | '') => void;
  setSelectedGradeId: (id: number | '') => void;
  setSelectedAreaId: (id: number | '') => void;
  setSelectedTopicId: (id: number | '') => void;
  setSelectedSubtopicId: (id: number | '') => void;
  setSelectedLessonId: (id: number | '') => void;
  setSelectedUnmappedVideo: (video: BunnyVideo | null) => void;

  // Link video
  linkVideoToLesson: (bunnyVideoId: string, lessonId: number) => Promise<void>;

  // Collection
  createCollection: (name: string) => Promise<Collection>;
  assignVideoToCollection: (videoId: string, collectionId: string | null) => Promise<void>;

  // Reset
  resetHierarchySelections: () => void;
  resetAll: () => void;
}

export const useBunnySyncStore = create<BunnySyncState>()((set, get) => ({
  // Initial state
  stats: {
    totalLessons: 0,
    inSync: 0,
    pending: 0,
    noBunnyVideo: 0,
  },
  statsLoading: false,
  bunnyVideos: [],
  bunnyVideosLoading: false,
  mappingData: [],
  mappingSummary: { total: 0, mapped: 0, unmapped: 0 },
  mappingLoading: false,
  syncedLessons: [],
  syncedLessonsLoading: false,
  collections: [],
  collectionsLoading: false,
  levels: [],
  grades: [],
  areas: [],
  topics: [],
  subtopics: [],
  filteredLessons: [],
  filteredLessonsLoading: false,
  hierarchyLoading: false,
  selectedLevelId: '',
  selectedGradeId: '',
  selectedAreaId: '',
  selectedTopicId: '',
  selectedSubtopicId: '',
  selectedLessonId: '',
  selectedUnmappedVideo: null,

  // Fetch stats
  fetchStats: async () => {
    set({ statsLoading: true });
    try {
      const response = await fetch(`${getApiBase()}/api/bunny-sync/stats`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        set({
          stats: {
            totalLessons: data.totalLessons || 0,
            inSync: data.inSync || 0,
            pending: data.pending || 0,
            noBunnyVideo: data.noBunnyVideo || 0,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      set({ statsLoading: false });
    }
  },

  // Fetch bunny videos
  fetchBunnyVideos: async () => {
    set({ bunnyVideosLoading: true });
    try {
      const response = await fetch(
        `${getApiBase()}/api/bunny-sync/bunny-videos?page=1&limit=100`,
        { headers: getAuthHeaders() }
      );
      const data = await response.json();
      if (data.success) {
        const normalized = (data.data || []).map((v: any) => ({
          guid: v.guid || v.bunnyVideoId,
          title: v.title || '',
          transcodingStatus: v.status || v.transcodingStatus || 'pending',
          mappedLesson: v.mappedLesson || null,
        }));
        set({ bunnyVideos: normalized });
      }
    } catch (error) {
      console.error('Error fetching Bunny videos:', error);
    } finally {
      set({ bunnyVideosLoading: false });
    }
  },

  // Fetch mapping data
  fetchMappingData: async () => {
    set({ mappingLoading: true });
    try {
      const response = await fetch(
        `${getApiBase()}/api/bunny-sync/mapping-status?page=1&limit=100`,
        { headers: getAuthHeaders() }
      );
      const data: MappingStatusResponse = await response.json();
      if (data.success) {
        const normalized: MappingItem[] = (data.data || []).map((item: any) => ({
          bunnyVideoId: item.guid || item.bunnyVideoId,
          title: item.title || '',
          transcodingStatus: item.status || item.transcodingStatus || 'pending',
          isMapped: item.isMapped || false,
          mappedLesson: item.mappedLesson || undefined,
        }));
        set({ 
          mappingData: normalized,
          mappingSummary: data.summary ? {
            total: data.summary.totalBunnyVideos || data.summary.total || 0,
            mapped: data.summary.mappedVideos || data.summary.mapped || 0,
            unmapped: data.summary.unmappedVideos || data.summary.unmapped || 0,
          } : { total: 0, mapped: 0, unmapped: 0 },
        });
      }
    } catch (error) {
      console.error('Error fetching mapping status:', error);
    } finally {
      set({ mappingLoading: false });
    }
  },

  // Fetch synced lessons
  fetchSyncedLessons: async () => {
    set({ syncedLessonsLoading: true });
    try {
      const response = await fetch(
        `${getApiBase()}/api/bunny-sync/pending?limit=1000`,
        { headers: getAuthHeaders() }
      );
      const data = await response.json();
      if (data.success) {
        const normalized: SyncedLesson[] = (data.data || []).map((l: any) => ({
          id: l.id,
          title: l.title || `Lesson #${l.id}`,
          bunny_video_id: l.bunny_video_id,
          storage_path: l.storage_path,
          transcoding_status: l.transcoding_status,
          sync_status: l.sync_status,
          sync_progress: l.sync_progress,
          thumbnail_url: undefined,
        }));
        set({ syncedLessons: normalized });
      }
    } catch (error) {
      console.error('Error fetching synced lessons:', error);
    } finally {
      set({ syncedLessonsLoading: false });
    }
  },

  // Fetch collections
  fetchCollections: async () => {
    set({ collectionsLoading: true });
    try {
      const response = await fetch(
        `${getApiBase()}/api/bunny-sync/collections`,
        { headers: getAuthHeaders() }
      );
      const data = await response.json();
      if (data.success) {
        set({ collections: data.data || [] });
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      set({ collectionsLoading: false });
    }
  },

  // Fetch levels
  fetchLevels: async () => {
    set({ hierarchyLoading: true });
    try {
      const response = await fetch(
        `${getApiBase()}/api/learning-hierarchy/levels`,
        { headers: getAuthHeaders() }
      );
      const data = await response.json();
      if (data.success) {
        set({ levels: data.data || [] });
      }
    } catch (error) {
      console.error('Error fetching levels:', error);
    } finally {
      set({ hierarchyLoading: false });
    }
  },

  // Fetch grades by level
  fetchGradesByLevel: async (levelId: number) => {
    try {
      const response = await fetch(
        `${getApiBase()}/api/learning-hierarchy/levels/${levelId}/grades`,
        { headers: getAuthHeaders() }
      );
      const data = await response.json();
      if (data.success) {
        set({ grades: data.data || [] });
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  },

  // Fetch areas by grade
  fetchAreasByGrade: async (gradeId: number) => {
    try {
      const response = await fetch(
        `${getApiBase()}/api/learning-hierarchy/grades/${gradeId}/areas`,
        { headers: getAuthHeaders() }
      );
      const data = await response.json();
      if (data.success) {
        set({ areas: data.data || [] });
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  },

  // Fetch topics by area
  fetchTopicsByArea: async (areaId: number) => {
    try {
      const response = await fetch(
        `${getApiBase()}/api/learning-hierarchy/areas/${areaId}/topics`,
        { headers: getAuthHeaders() }
      );
      const data = await response.json();
      if (data.success) {
        set({ topics: data.data || [] });
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  },

  // Fetch subtopics by topic
  fetchSubtopicsByTopic: async (topicId: number) => {
    try {
      const response = await fetch(
        `${getApiBase()}/api/learning-hierarchy/topics/${topicId}/subtopics`,
        { headers: getAuthHeaders() }
      );
      const data = await response.json();
      if (data.success) {
        set({ subtopics: data.data || [] });
      }
    } catch (error) {
      console.error('Error fetching subtopics:', error);
    }
  },

  // Fetch filtered lessons
  fetchFilteredLessons: async (areaId: number | string, topicId?: number | string, subtopicId?: number | string) => {
    if (!areaId) {
      set({ filteredLessons: [] });
      return;
    }

    set({ filteredLessonsLoading: true });
    try {
      const params = new URLSearchParams();
      params.append('area_id', areaId.toString());
      if (topicId) params.append('topic_id', topicId.toString());
      if (subtopicId) params.append('subtopic_id', subtopicId.toString());

      const response = await fetch(
        `${getApiBase()}/api/learning-hierarchy/filtered-lessons?${params}`,
        { headers: getAuthHeaders() }
      );
      const data = await response.json();
      if (data.success) {
        set({ filteredLessons: data.data || [] });
      } else {
        set({ filteredLessons: [] });
      }
    } catch (error) {
      console.error('Error fetching filtered lessons:', error);
      set({ filteredLessons: [] });
    } finally {
      set({ filteredLessonsLoading: false });
    }
  },

  // Selection setters
  setSelectedLevelId: (id) => {
    set({ selectedLevelId: id });
    if (!id) {
      get().resetHierarchySelections();
    }
  },

  setSelectedGradeId: (id) => {
    set({ selectedGradeId: id });
    if (!id) {
      set({ areas: [], topics: [], subtopics: [], filteredLessons: [], selectedAreaId: '', selectedTopicId: '', selectedSubtopicId: '', selectedLessonId: '' });
    }
  },

  setSelectedAreaId: (id) => {
    set({ 
      selectedAreaId: id,
      topics: [],
      subtopics: [],
      filteredLessons: [],
      selectedTopicId: '',
      selectedSubtopicId: '',
      selectedLessonId: '',
    });
  },

  setSelectedTopicId: (id) => {
    set({ 
      selectedTopicId: id,
      subtopics: [],
      filteredLessons: [],
      selectedSubtopicId: '',
      selectedLessonId: '',
    });
  },

  setSelectedSubtopicId: (id) => {
    set({ 
      selectedSubtopicId: id,
      filteredLessons: [],
      selectedLessonId: '',
    });
  },

  setSelectedLessonId: (id) => set({ selectedLessonId: id }),

  setSelectedUnmappedVideo: (video) => set({ selectedUnmappedVideo: video }),

  // Link video to lesson
  linkVideoToLesson: async (bunnyVideoId: string, lessonId: number) => {
    try {
      const response = await fetch(
        `${getApiBase()}/api/bunny-sync/link-bunny-video`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ bunnyVideoId, lessonId }),
        }
      );

      if (!response.ok) {
        if (response.status === 400) {
          const data = await response.json();
          throw new Error(data.error || 'This video is already linked to a lesson');
        }
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to link video');
      }
    } catch (error) {
      console.error('Error linking video:', error);
      throw error;
    }
  },

  // Create collection
  createCollection: async (name: string) => {
    const response = await fetch(
      `${getApiBase()}/api/bunny-sync/collection`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ name }),
      }
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to create collection');
    }
    return data.data;
  },

  // Assign video to collection
  assignVideoToCollection: async (videoId: string, collectionId: string | null) => {
    const response = await fetch(
      `${getApiBase()}/api/bunny-sync/video-to-collection`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ videoId, collectionId }),
      }
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error);
    }
  },

  // Reset hierarchy selections
  resetHierarchySelections: () => {
    set({
      selectedGradeId: '',
      selectedAreaId: '',
      selectedTopicId: '',
      selectedSubtopicId: '',
      selectedLessonId: '',
      grades: [],
      areas: [],
      topics: [],
      subtopics: [],
      filteredLessons: [],
    });
  },

  // Reset all
  resetAll: () => {
    set({
      stats: { totalLessons: 0, inSync: 0, pending: 0, noBunnyVideo: 0 },
      statsLoading: false,
      bunnyVideos: [],
      bunnyVideosLoading: false,
      mappingData: [],
      mappingSummary: { total: 0, mapped: 0, unmapped: 0 },
      mappingLoading: false,
      syncedLessons: [],
      syncedLessonsLoading: false,
      collections: [],
      collectionsLoading: false,
      levels: [],
      grades: [],
      areas: [],
      topics: [],
      subtopics: [],
      filteredLessons: [],
      filteredLessonsLoading: false,
      hierarchyLoading: false,
      selectedLevelId: '',
      selectedGradeId: '',
      selectedAreaId: '',
      selectedTopicId: '',
      selectedSubtopicId: '',
      selectedLessonId: '',
      selectedUnmappedVideo: null,
    });
  },
}));