import { useEffect, useState, useCallback } from 'react';
import type { BunnyVideo, MappingItem, BunnySyncStats, PendingResponse, SyncedLesson, Collection } from '@/types/bunny-sync';
import type { Level, Grade, Area, Topic, Subtopic, LessonDetail } from '@/types/bunny-sync';

const getApiBase = () => process.env.NEXT_PUBLIC_API_URL || '';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

/**
 * Fetch Bunny sync statistics
 */
export const useBunnySyncStats = () => {
  const [stats, setStats] = useState<BunnySyncStats>({
    totalLessons: 0,
    inSync: 0,
    pending: 0,
    noBunnyVideo: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${getApiBase()}/api/bunny-sync/stats`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setStats({
          totalLessons: data.totalLessons || 0,
          inSync: data.inSync || 0,
          pending: data.pending || 0,
          noBunnyVideo: data.noBunnyVideo || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, fetchStats };
};

/**
 * Fetch Bunny videos list
 */
export const useBunnyVideos = () => {
  const [videos, setVideos] = useState<BunnyVideo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${getApiBase()}/api/bunny-sync/bunny-videos?page=1&limit=100`,
        {
          headers: getAuthHeaders(),
        }
      );
      const data = await response.json();
      if (data.success) {
        const normalized = (data.data || []).map((v: any) => ({
          guid: v.guid || v.bunnyVideoId,
          title: v.title || '',
          transcodingStatus: v.status || v.transcodingStatus || 'pending',
          mappedLesson: v.mappedLesson || null,
        }));
        setVideos(normalized);
      }
    } catch (error) {
      console.error('Error fetching Bunny videos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { videos, loading, fetchVideos };
};

/**
 * Fetch mapping status
 */
export const useMappingStatus = () => {
  const [mappingData, setMappingData] = useState<MappingItem[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    mapped: 0,
    unmapped: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchMappingData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${getApiBase()}/api/bunny-sync/mapping-status?page=1&limit=100`,
        {
          headers: getAuthHeaders(),
        }
      );
      const data = await response.json();
      if (data.success) {
        const normalized: MappingItem[] = (data.data || []).map(
          (item: any) => ({
            bunnyVideoId: item.guid || item.bunnyVideoId,
            title: item.title || '',
            transcodingStatus: item.status || item.transcodingStatus || 'pending',
            isMapped: item.isMapped || false,
            mappedLesson: item.mappedLesson || undefined,
          })
        );
        setMappingData(normalized);
        if (data.summary) {
          setSummary({
            total: data.summary.totalBunnyVideos || data.summary.total || 0,
            mapped: data.summary.mappedVideos || data.summary.mapped || 0,
            unmapped: data.summary.unmappedVideos || data.summary.unmapped || 0,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching mapping status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { mappingData, summary, loading, fetchMappingData };
};

/**
 * Fetch synced lessons
 */
export const useSyncedLessons = () => {
  const [lessons, setLessons] = useState<SyncedLesson[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${getApiBase()}/api/bunny-sync/pending?limit=1000`,
        {
          headers: getAuthHeaders(),
        }
      );
      const data: PendingResponse = await response.json();
      if (data.success) {
        const normalized: SyncedLesson[] = (data.data || []).map((l) => ({
          id: l.id,
          title: l.title || `Lesson #${l.id}`,
          bunny_video_id: l.bunny_video_id,
          storage_path: l.storage_path,
          transcoding_status: l.transcoding_status,
          sync_status: l.sync_status,
          sync_progress: l.sync_progress,
          thumbnail_url: undefined,
        }));
        setLessons(normalized);
      }
    } catch (error) {
      console.error('Error fetching synced lessons:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { lessons, loading, fetchLessons };
};

/**
 * Fetch collections
 */
export const useCollections = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${getApiBase()}/api/bunny-sync/collections`,
        {
          headers: getAuthHeaders(),
        }
      );
      const data = await response.json();
      if (data.success) {
        setCollections(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { collections, loading, fetchCollections };
};

/**
 * Create collection
 */
export const useCreateCollection = () => {
  const [loading, setLoading] = useState(false);

  const createCollection = useCallback(
    async (name: string): Promise<Collection | null> => {
      setLoading(true);
      try {
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
        if (data.success) {
          return data.data;
        }
        throw new Error(data.error || 'Failed to create collection');
      } catch (error) {
        console.error('Error creating collection:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { createCollection, loading };
};

/**
 * Assign video to collection
 */
export const useAssignVideoToCollection = () => {
  const [loading, setLoading] = useState(false);

  const assignVideo = useCallback(
    async (videoId: string, collectionId: string | null) => {
      setLoading(true);
      try {
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
        return data;
      } catch (error) {
        console.error('Error assigning video to collection:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { assignVideo, loading };
};

/**
 * Link Bunny video to lesson
 */
export const useLinkVideoToLesson = () => {
  const [loading, setLoading] = useState(false);

  const linkVideo = useCallback(
    async (bunnyVideoId: string, lessonId: number) => {
      setLoading(true);
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
        return data;
      } catch (error) {
        console.error('Error linking video:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { linkVideo, loading };
};

/**
 * Fetch filtered lessons by hierarchy
 */
export const useFilteredLessons = () => {
  const [lessons, setLessons] = useState<LessonDetail[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFilteredLessons = useCallback(
    async (areaId: number | string, topicId?: number | string, subtopicId?: number | string) => {
      if (!areaId) {
        setLessons([]);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('area_id', areaId.toString());
        if (topicId) params.append('topic_id', topicId.toString());
        if (subtopicId) params.append('subtopic_id', subtopicId.toString());

        const response = await fetch(
          `${getApiBase()}/api/learning-hierarchy/filtered-lessons?${params}`,
          {
            headers: getAuthHeaders(),
          }
        );
        const data = await response.json();
        if (data.success) {
          setLessons(data.data || []);
        } else {
          setLessons([]);
        }
      } catch (error) {
        console.error('Error fetching filtered lessons:', error);
        setLessons([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { lessons, loading, fetchFilteredLessons };
};

/**
 * Fetch learning hierarchy data
 */
export const useLearningHierarchy = () => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);

  const fetchLevels = useCallback(async () => {
    try {
      const response = await fetch(
        `${getApiBase()}/api/learning-hierarchy/levels`,
        {
          headers: getAuthHeaders(),
        }
      );
      const data = await response.json();
      if (data.success) {
        setLevels(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching levels:', error);
    }
  }, []);

  const fetchGradesByLevel = useCallback(async (levelId: number) => {
    try {
      const response = await fetch(
        `${getApiBase()}/api/learning-hierarchy/levels/${levelId}/grades`,
        {
          headers: getAuthHeaders(),
        }
      );
      const data = await response.json();
      if (data.success) {
        setGrades(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  }, []);

  const fetchAreasByGrade = useCallback(async (gradeId: number) => {
    try {
      const response = await fetch(
        `${getApiBase()}/api/learning-hierarchy/grades/${gradeId}/areas`,
        {
          headers: getAuthHeaders(),
        }
      );
      const data = await response.json();
      if (data.success) {
        setAreas(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  }, []);

  const fetchTopicsByArea = useCallback(async (areaId: number) => {
    try {
      const response = await fetch(
        `${getApiBase()}/api/learning-hierarchy/areas/${areaId}/topics`,
        {
          headers: getAuthHeaders(),
        }
      );
      const data = await response.json();
      if (data.success) {
        setTopics(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  }, []);

  const fetchSubtopicsByTopic = useCallback(async (topicId: number) => {
    try {
      const response = await fetch(
        `${getApiBase()}/api/learning-hierarchy/topics/${topicId}/subtopics`,
        {
          headers: getAuthHeaders(),
        }
      );
      const data = await response.json();
      if (data.success) {
        setSubtopics(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching subtopics:', error);
    }
  }, []);

  const resetGrades = () => setGrades([]);
  const resetAreas = () => setAreas([]);
  const resetTopics = () => setTopics([]);
  const resetSubtopics = () => setSubtopics([]);

  return {
    levels,
    grades,
    areas,
    topics,
    subtopics,
    fetchLevels,
    fetchGradesByLevel,
    fetchAreasByGrade,
    fetchTopicsByArea,
    fetchSubtopicsByTopic,
    resetGrades,
    resetAreas,
    resetTopics,
    resetSubtopics,
  };
};