import { create } from 'zustand';
import type {
  BunnyVideo,
  MappingItem,
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
import { bunnySyncService } from '@/services/bunny-sync';

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
       const stats = await bunnySyncService.fetchStats();
       set({ stats });
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
       const bunnyVideos = await bunnySyncService.fetchBunnyVideos();
       set({ bunnyVideos });
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
       const { mappingData, summary } = await bunnySyncService.fetchMappingData();
       set({ 
         mappingData,
         mappingSummary: summary
       });
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
       const syncedLessons = await bunnySyncService.fetchSyncedLessons();
       set({ syncedLessons });
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
       const collections = await bunnySyncService.fetchCollections();
       set({ collections });
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
       const levels = await bunnySyncService.fetchLevels();
       set({ levels });
     } catch (error) {
       console.error('Error fetching levels:', error);
     } finally {
       set({ hierarchyLoading: false });
     }
   },

   // Fetch grades by level
   fetchGradesByLevel: async (levelId: number) => {
     try {
       const grades = await bunnySyncService.fetchGradesByLevel(levelId);
       set({ grades });
     } catch (error) {
       console.error('Error fetching grades:', error);
     }
   },

   // Fetch areas by grade
   fetchAreasByGrade: async (gradeId: number) => {
     try {
       const areas = await bunnySyncService.fetchAreasByGrade(gradeId);
       set({ areas });
     } catch (error) {
       console.error('Error fetching areas:', error);
     }
   },

   // Fetch topics by area
   fetchTopicsByArea: async (areaId: number) => {
     try {
       const topics = await bunnySyncService.fetchTopicsByArea(areaId);
       set({ topics });
     } catch (error) {
       console.error('Error fetching topics:', error);
     }
   },

   // Fetch subtopics by topic
   fetchSubtopicsByTopic: async (topicId: number) => {
     try {
       const subtopics = await bunnySyncService.fetchSubtopicsByTopic(topicId);
       set({ subtopics });
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
       const filteredLessons = await bunnySyncService.fetchFilteredLessons(areaId, topicId, subtopicId);
       set({ filteredLessons });
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
       await bunnySyncService.linkVideoToLesson(bunnyVideoId, lessonId);
     } catch (error) {
       console.error('Error linking video:', error);
       throw error;
     }
   },

   // Create collection
   createCollection: async (name: string) => {
     try {
       return await bunnySyncService.createCollection(name);
     } catch (error) {
       console.error('Error creating collection:', error);
       throw error;
     }
   },

   // Assign video to collection
   assignVideoToCollection: async (videoId: string, collectionId: string | null) => {
     try {
       await bunnySyncService.assignVideoToCollection(videoId, collectionId);
     } catch (error) {
       console.error('Error assigning video to collection:', error);
       throw error;
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