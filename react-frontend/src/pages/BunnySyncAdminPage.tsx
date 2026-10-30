/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useRole } from '@/hooks/useRole';
import { bunnyUploadService } from '@/services/bunny-upload';
import { bunnySyncService } from '@/services/bunny-sync';
import { adminService } from '@/services/admin';
import type { FilenameBatchLink } from '@/types/bunny-sync';
import {
  Loader2,
  HardDrive,
  CheckCircle,
  Video,
  Link,
  Unlink,
  RefreshCw,
  ListChecks,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { useBunnySyncStore } from '@/stores/useBunnySyncStore';
import {
  LinkVideoModal,
  CollectionsModal,
  BunnyVideosModal,
  MappingStatusModal,
  SyncedLessonsModal,
  MultiUploadModal,
  BatchFilenameLinkModal,
  getTranscodingBadge,
  getSyncStatusBadge,
} from '@/components/BunnyVideo';

const BunnySyncAdminPage = () => {
  const { isAdmin, isSuperadmin } = useRole();

  const {
    // Stats
    stats,
    fetchStats,

    // Bunny videos
    bunnyVideos,
    bunnyVideosLoading,
    fetchBunnyVideos,

    // Mapping
    mappingData,
    mappingSummary,
    mappingLoading,
    fetchMappingData,

    // Synced lessons
    syncedLessons,
    syncedLessonsLoading,
    fetchSyncedLessons,

    // Collections
    collections,
    fetchCollections,
    createCollection,
    assignVideoToCollection,

    // Learning hierarchy
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

    // Selections
    selectedLevelId,
    selectedGradeId,
    selectedAreaId,
    selectedTopicId,
    selectedSubtopicId,
    selectedUnmappedVideo,
    setSelectedLevelId,
    setSelectedGradeId,
    setSelectedAreaId,
    setSelectedTopicId,
    setSelectedSubtopicId,
    setSelectedUnmappedVideo,
  } = useBunnySyncStore();

  // UI State
  const [showSyncedListModal, setShowSyncedListModal] = useState(false);
  const [showBunnyVideosModal, setShowBunnyVideosModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showCollectionsModal, setShowCollectionsModal] = useState(false);
  const [showMultiUploadModal, setShowMultiUploadModal] = useState(false);
  const [showBatchFilenameLinkModal, setShowBatchFilenameLinkModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [linkModalVideoSearch, setLinkModalVideoSearch] = useState('');
  const [isCreatingBunnyLesson, setIsCreatingBunnyLesson] = useState(false);
  const [syncingLessonId, setSyncingLessonId] = useState<number | null>(null);
  const [syncAllLoading, setSyncAllLoading] = useState(false);
  const [filenameLinkCandidates, setFilenameLinkCandidates] = useState<
    Awaited<ReturnType<typeof bunnySyncService.fetchFilenameLinkPreview>>
  >([]);
  const [filenamePreviewLoading, setFilenamePreviewLoading] = useState(false);
  const [filenameBatchApplying, setFilenameBatchApplying] = useState(false);

  // Multi-upload state
  const [multiUploadHierarchy, setMultiUploadHierarchy] = useState({
    levelId: '',
    gradeId: '',
    areaId: '',
    topicId: '',
    subtopicId: '',
  });
  const [multiUploadFiles, setMultiUploadFiles] = useState<File[]>([]);
  const [multiUploadProgress, setMultiUploadProgress] = useState<Map<string, number>>(new Map());
  const [multiUploadResults, setMultiUploadResults] = useState<Array<any>>([]);
  const [multiUploadCreatingCollection, setMultiUploadCreatingCollection] = useState(false);

  // Initial data load
  useEffect(() => {
    if (isAdmin || isSuperadmin) {
      fetchStats();
      fetchLevels();
    }
  }, [isAdmin, isSuperadmin, fetchStats, fetchLevels]);

  // Cascade effects
  useEffect(() => {
    if (selectedLevelId) {
      fetchGradesByLevel(selectedLevelId);
    } else {
      useBunnySyncStore.getState().grades = [];
    }
  }, [selectedLevelId, fetchGradesByLevel]);

  useEffect(() => {
    if (selectedGradeId) {
      fetchAreasByGrade(selectedGradeId);
    } else {
      useBunnySyncStore.getState().areas = [];
    }
  }, [selectedGradeId, fetchAreasByGrade]);

  useEffect(() => {
    if (selectedAreaId) {
      fetchTopicsByArea(selectedAreaId);
    } else {
      useBunnySyncStore.getState().topics = [];
    }
  }, [selectedAreaId, fetchTopicsByArea]);

  useEffect(() => {
    if (selectedTopicId) {
      fetchSubtopicsByTopic(selectedTopicId);
    } else {
      useBunnySyncStore.getState().subtopics = [];
    }
  }, [selectedTopicId, fetchSubtopicsByTopic]);

   // Handlers
  const handleShowUnmapped = () => {
    fetchMappingData();
    setShowMappingModal(true);
  };

  const handleShowLinkModal = async () => {
    await fetchBunnyVideos();
    setLinkModalVideoSearch('');
    setShowLinkModal(true);
  };

  const handleShowCollections = () => {
    fetchCollections();
    setShowCollectionsModal(true);
  };

  const refreshFilenameLinkPreview = async () => {
    setFilenamePreviewLoading(true);
    try {
      setFilenameLinkCandidates(await bunnySyncService.fetchFilenameLinkPreview());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load filename matches');
    } finally {
      setFilenamePreviewLoading(false);
    }
  };

  const handleShowBatchFilenameLinkModal = async () => {
    setShowBatchFilenameLinkModal(true);
    await refreshFilenameLinkPreview();
  };

  const handleBatchFilenameLink = async (
    links: FilenameBatchLink[]
  ) => {
    setFilenameBatchApplying(true);
    try {
      const linkedCount = await bunnySyncService.batchLinkVideos(links);
      toast.success(`Linked ${linkedCount} Bunny video(s) to lessons`);
      await Promise.all([fetchBunnyVideos(), fetchMappingData(), fetchStats()]);
      setShowBatchFilenameLinkModal(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Batch linking failed');
      await refreshFilenameLinkPreview();
    } finally {
      setFilenameBatchApplying(false);
    }
  };

  const handleCreateArea = async (name: string): Promise<'created' | 'existing'> => {
    if (!selectedGradeId) throw new Error('Select a grade before adding an area');

    const existing = areas.find((area) => area.name.trim().toLowerCase() === name.toLowerCase());
    if (existing) {
      setSelectedAreaId(existing.id);
      return 'existing';
    }

    const created = await adminService.createLearningArea({
      name,
      grade_id: Number(selectedGradeId),
      is_active: true,
    });
    await fetchAreasByGrade(Number(selectedGradeId));
    const areaId = Number(created.id ?? created.area_id);
    if (!Number.isInteger(areaId) || areaId <= 0) {
      throw new Error('Area was created, but the API did not return its ID');
    }
    setSelectedAreaId(areaId);
    return 'created';
  };

  const handleCreateTopic = async (name: string): Promise<'created' | 'existing'> => {
    if (!selectedAreaId) throw new Error('Select a learning area before adding a topic');

    const existing = topics.find((topic) => topic.name.trim().toLowerCase() === name.toLowerCase());
    if (existing) {
      setSelectedTopicId(existing.topic_id);
      return 'existing';
    }

    const created = await adminService.createTopic({
      name,
      area_id: Number(selectedAreaId),
    });
    await fetchTopicsByArea(Number(selectedAreaId));
    const topicId = Number(created.topic_id ?? created.id);
    if (!Number.isInteger(topicId) || topicId <= 0) {
      throw new Error('Topic was created, but the API did not return its ID');
    }
    setSelectedTopicId(topicId);
    return 'created';
  };

  const handleCreateSubtopic = async (name: string): Promise<'created' | 'existing'> => {
    if (!selectedTopicId) throw new Error('Select a topic before adding a subtopic');

    const existing = subtopics.find((subtopic) => subtopic.name.trim().toLowerCase() === name.toLowerCase());
    if (existing) {
      setSelectedSubtopicId(existing.subtopic_id);
      return 'existing';
    }

    const created = await adminService.createSubtopic({
      name,
      topic_id: Number(selectedTopicId),
    });
    await fetchSubtopicsByTopic(Number(selectedTopicId));
    const subtopicId = Number(created.subtopic_id ?? created.id);
    if (!Number.isInteger(subtopicId) || subtopicId <= 0) {
      throw new Error('Subtopic was created, but the API did not return its ID');
    }
    setSelectedSubtopicId(subtopicId);
    return 'created';
  };

  const handleSyncLesson = async (lessonId: number) => {
    setSyncingLessonId(lessonId);
    try {
      await bunnySyncService.syncLesson(lessonId);
      await Promise.all([fetchSyncedLessons(), fetchStats()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lesson sync failed';
      alert(`Lesson sync failed: ${message}`);
      await Promise.all([fetchSyncedLessons(), fetchStats()]);
    } finally {
      setSyncingLessonId(null);
    }
  };

  const handleSyncAllLessons = async () => {
    setSyncAllLoading(true);
    try {
      const queuedCount = await bunnySyncService.syncAllLessons();
      await fetchSyncedLessons();
      setShowSyncedListModal(true);
      alert(
        queuedCount > 0
          ? `Queued ${queuedCount} Bunny-linked lesson(s) for sync. Track their status in this list.`
          : 'All Bunny-linked lessons are already synced or queued.'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to queue Bunny lesson sync';
      alert(message);
    } finally {
      setSyncAllLoading(false);
    }
  };

  const handleLinkBunnyVideo = async () => {
    if (!selectedUnmappedVideo || !selectedLevelId || !selectedGradeId || !selectedAreaId || !selectedTopicId) return;

    setIsCreatingBunnyLesson(true);
    try {
      const lesson = await bunnySyncService.createLessonFromBunnyVideo({
        bunnyVideoId: selectedUnmappedVideo.guid,
        levelId: Number(selectedLevelId),
        gradeId: Number(selectedGradeId),
        areaId: Number(selectedAreaId),
        topicId: Number(selectedTopicId),
        ...(selectedSubtopicId ? { subtopicId: Number(selectedSubtopicId) } : {}),
      });

      try {
        await fetchCollections();

        if (lesson) {
          const collectionName = `${lesson.level} / ${lesson.area} / ${lesson.topic}`;
          let collection = useBunnySyncStore.getState().collections.find((item) => item.name === collectionName);

          if (!collection) {
            const created = await createCollection(collectionName);
            collection = created;
          }

          if (collection) {
            try {
              await assignVideoToCollection(selectedUnmappedVideo.guid, collection.guid);
            } catch (assignErr) {
              console.error('Failed to assign video to collection:', assignErr);
            }
          }
        }
      } catch (collectionErr: any) {
        console.error('Error handling collection assignment:', collectionErr);
      }

      alert('Lesson created and video linked successfully!');
      setShowLinkModal(false);
      setSelectedUnmappedVideo(null);
      setLinkModalVideoSearch('');
      setSelectedLevelId('');
      setSelectedGradeId('');
      setSelectedAreaId('');
      setSelectedTopicId('');
      setSelectedSubtopicId('');
      fetchBunnyVideos();
      fetchMappingData();
      fetchStats();
      fetchCollections();
    } catch (error: any) {
      console.error('Link error:', error);
      alert('Failed to link video: ' + error.message);
    } finally {
      setIsCreatingBunnyLesson(false);
    }
  };

  // Multi-upload handlers
  const handleMultiUploadDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const newFiles = Array.from(e.dataTransfer.files).filter(f =>
      f.type.startsWith('video/') && f.size <= 2 * 1024 * 1024 * 1024
    );
    setMultiUploadFiles(prev => [...prev, ...newFiles]);
  };

  const handleMultiUploadDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeMultiUploadFile = (index: number) => {
    setMultiUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearMultiUpload = () => {
    setMultiUploadFiles([]);
    setMultiUploadResults([]);
    setMultiUploadProgress(new Map());
    setMultiUploadHierarchy({
      levelId: '',
      gradeId: '',
      areaId: '',
      topicId: '',
      subtopicId: '',
    });
  };

  const processMultiUpload = async () => {
    if (multiUploadFiles.length === 0) return;

    const results: any[] = [];
    const progress = new Map(multiUploadProgress);

    let collectionName = '';
    if (multiUploadHierarchy.levelId && multiUploadHierarchy.gradeId && multiUploadHierarchy.areaId) {
      const level = levels.find(l => l.level_id === Number(multiUploadHierarchy.levelId));
      const grade = grades.find(g => g.id === Number(multiUploadHierarchy.gradeId));
      const area = areas.find(a => a.id === Number(multiUploadHierarchy.areaId));
      collectionName = [level?.name, grade?.name, area?.name].filter(Boolean).join(' / ');
    }

    setMultiUploadCreatingCollection(!!collectionName);

    let collectionGuid: string | null = null;
    if (collectionName) {
      try {
        const created = await createCollection(collectionName);
        collectionGuid = created.guid;
      } catch (err) {
        console.error('Error creating collection:', err);
      }
    }

    for (let i = 0; i < multiUploadFiles.length; i++) {
      const file = multiUploadFiles[i];
      progress.set(file.name, 5);
      setMultiUploadProgress(new Map(progress));

      try {
        const formData = new FormData();
        formData.append('videos', file);

        progress.set(file.name, 10);
        setMultiUploadProgress(new Map(progress));

        // Use centralized service with CSRF token and error handling
        const uploadData = await bunnyUploadService.uploadVideo(file);

        if (!uploadData.success || !uploadData.uploads || uploadData.uploads.length === 0) {
          throw new Error('Upload failed');
        }

        const jobId = uploadData.uploads[0].jobId;
        progress.set(file.name, 30);
        setMultiUploadProgress(new Map(progress));

        const processData = await bunnyUploadService.processSingleUpload(jobId);

        if (!processData.success) {
          throw new Error(processData.error || 'Processing failed');
        }

        progress.set(file.name, 80);
        setMultiUploadProgress(new Map(progress));

        const bunnyVideoId = processData.videoId!;

        if (collectionGuid) {
          try {
            await assignVideoToCollection(bunnyVideoId, collectionGuid);
          } catch (err) {
            console.error('Error assigning video to collection:', err);
          }
        }

        progress.set(file.name, 100);
        setMultiUploadProgress(new Map(progress));

        results.push({
          filename: file.name,
          status: 'completed' as const,
          bunnyVideoId,
          collectionName: collectionName || undefined,
        });
      } catch (err: any) {
        progress.set(file.name, 100);
        setMultiUploadProgress(new Map(progress));
        results.push({
          filename: file.name,
          status: 'failed' as const,
          error: err.message,
        });
      }

      setMultiUploadResults([...results]);
    }

    setMultiUploadCreatingCollection(false);
    fetchBunnyVideos();
    fetchCollections();
  };

  const handleMultiUploadHierarchyChange = (key: string, value: string) => {
    setMultiUploadHierarchy(prev => ({
      ...prev,
      [key]: value,
      ...(key === 'levelId' && { gradeId: '', areaId: '', topicId: '', subtopicId: '' }),
      ...(key === 'gradeId' && { areaId: '', topicId: '', subtopicId: '' }),
      ...(key === 'areaId' && { topicId: '', subtopicId: '' }),
      ...(key === 'topicId' && { subtopicId: '' }),
    }));
  };

  if (!isAdmin && !isSuperadmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
          <p className="mt-2 text-gray-600">You need admin access to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <section className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Video className="h-8 w-8" />
                Bunny Video Sync
              </h1>
              <p className="text-slate-300">
                Manage Bunny.net video synchronization and mapping
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="secondary"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleSyncAllLessons}
                disabled={syncAllLoading}
              >
                {syncAllLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {syncAllLoading ? 'Queueing Sync...' : 'Sync Linked Videos'}
              </Button>
              <Button
                variant="secondary"
                className="bg-purple-500 hover:bg-purple-600 text-white"
                onClick={() => {
                  fetchBunnyVideos();
                  setShowBunnyVideosModal(true);
                }}
              >
                <Video className="mr-2 h-4 w-4" />
                View Bunny Videos
              </Button>
              <Button
                variant="secondary"
                className="bg-indigo-500 hover:bg-indigo-600 text-white"
                onClick={handleShowUnmapped}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                View Mapping Status
              </Button>
              <Button
                variant="secondary"
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={handleShowLinkModal}
              >
                <Link className="mr-2 h-4 w-4" />
                Link Unlinked Videos
              </Button>
              <Button
                variant="secondary"
                className="bg-teal-600 hover:bg-teal-700 text-white"
                onClick={() => void handleShowBatchFilenameLinkModal()}
                disabled={filenamePreviewLoading}
              >
                {filenamePreviewLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ListChecks className="mr-2 h-4 w-4" />
                )}
                Batch Link from Filenames
              </Button>
              <Button
                variant="secondary"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setShowMultiUploadModal(true)}
              >
                <Video className="mr-2 h-4 w-4" />
                Batch Upload
              </Button>
              <Button
                variant="secondary"
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
                onClick={async () => {
                  await fetchSyncedLessons();
                  setShowSyncedListModal(true);
                }}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                View Synced List
              </Button>
              <Button
                variant="secondary"
                className="bg-violet-600 hover:bg-violet-700 text-white"
                onClick={handleShowCollections}
              >
                <HardDrive className="mr-2 h-4 w-4" />
                View Collections
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                <HardDrive className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {stats.totalLessons.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total lessons requiring videos
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Sync</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {stats.inSync.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Videos synced with Bunny
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Loader2 className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">
                  {stats.pending.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Videos awaiting upload
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unlinked Bunny</CardTitle>
                <Unlink className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {stats.noBunnyVideo.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Bunny videos not linked
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="shadow-md mb-8">
            <CardHeader>
              <CardTitle>Sync Actions</CardTitle>
              <CardDescription>Manage video synchronization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleShowLinkModal}
              >
                <Link className="mr-2 h-4 w-4" />
                Link Unlinked Videos
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleShowUnmapped}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                View Mapping Status
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => {
                  setShowLinkModal(true);
                  fetchMappingData();
                }}
              >
                <Link className="mr-2 h-4 w-4" />
                Link Unlinked Videos
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setShowMultiUploadModal(true)}
              >
                <Video className="mr-2 h-4 w-4" />
                Batch Upload Videos
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md mb-8">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Current sync status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalLessons}</div>
                  <div className="text-xs text-gray-500">Total Videos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.inSync}</div>
                  <div className="text-xs text-gray-500">In Sync</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
                  <div className="text-xs text-gray-500">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.noBunnyVideo}</div>
                  <div className="text-xs text-gray-500">Unlinked</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Synced Lessons List Modal */}
      <SyncedLessonsModal
        isOpen={showSyncedListModal}
        onClose={() => {
          setShowSyncedListModal(false);
          setSearchQuery('');
          setFilterStatus('all');
        }}
        lessons={syncedLessons}
        isLoading={syncedLessonsLoading}
        onSearchChange={setSearchQuery}
        onFilterChange={setFilterStatus}
        searchQuery={searchQuery}
        filterStatus={filterStatus}
        getSyncStatusBadge={getSyncStatusBadge}
        onSyncLesson={handleSyncLesson}
        syncingLessonId={syncingLessonId}
      />

      {/* Bunny Videos Modal */}
      <BunnyVideosModal
        isOpen={showBunnyVideosModal}
        onClose={() => setShowBunnyVideosModal(false)}
        videos={bunnyVideos}
        isLoading={bunnyVideosLoading}
        getTranscodingBadge={getTranscodingBadge}
      />

      {/* Mapping Status Modal */}
      <MappingStatusModal
        isOpen={showMappingModal}
        onClose={() => setShowMappingModal(false)}
        mappingData={mappingData}
        summary={mappingSummary}
        isLoading={mappingLoading}
        getTranscodingBadge={getTranscodingBadge}
      />

      {/* Link Unmapped Videos Modal */}
      <LinkVideoModal
        isOpen={showLinkModal}
        onClose={() => {
          setShowLinkModal(false);
          setSelectedUnmappedVideo(null);
          setLinkModalVideoSearch('');
          setSelectedLevelId('');
          setSelectedGradeId('');
          setSelectedAreaId('');
          setSelectedTopicId('');
          setSelectedSubtopicId('');
        }}
        bunnyVideos={bunnyVideos}
        selectedVideo={selectedUnmappedVideo}
        onVideoSelect={setSelectedUnmappedVideo}
        linkModalVideoSearch={linkModalVideoSearch}
        onLinkModalVideoSearchChange={setLinkModalVideoSearch}
        levels={levels}
        grades={grades}
        areas={areas}
        topics={topics}
        subtopics={subtopics}
        selectedLevelId={selectedLevelId}
        selectedGradeId={selectedGradeId}
        selectedAreaId={selectedAreaId}
        selectedTopicId={selectedTopicId}
        selectedSubtopicId={selectedSubtopicId}
        onLevelChange={setSelectedLevelId}
        onGradeChange={setSelectedGradeId}
        onAreaChange={setSelectedAreaId}
        onTopicChange={setSelectedTopicId}
        onSubtopicChange={setSelectedSubtopicId}
        onCreateArea={handleCreateArea}
        onCreateTopic={handleCreateTopic}
        onCreateSubtopic={handleCreateSubtopic}
        onLink={handleLinkBunnyVideo}
        isLinking={isCreatingBunnyLesson}
        getTranscodingBadge={getTranscodingBadge}
      />

      <BatchFilenameLinkModal
        isOpen={showBatchFilenameLinkModal}
        onClose={() => setShowBatchFilenameLinkModal(false)}
        candidates={filenameLinkCandidates}
        isLoading={filenamePreviewLoading}
        isApplying={filenameBatchApplying}
        onRefresh={refreshFilenameLinkPreview}
        onApply={handleBatchFilenameLink}
      />

      {/* Collections Modal */}
      <CollectionsModal
        isOpen={showCollectionsModal}
        onClose={() => setShowCollectionsModal(false)}
        collections={collections}
        onSearchChange={() => {}}
      />

      {/* Multi-Upload Modal */}
      <MultiUploadModal
        isOpen={showMultiUploadModal}
        onClose={() => {
          setShowMultiUploadModal(false);
          clearMultiUpload();
        }}
        levels={levels}
        grades={grades}
        areas={areas}
        topics={topics}
        subtopics={subtopics}
        hierarchy={multiUploadHierarchy}
        onHierarchyChange={handleMultiUploadHierarchyChange}
        files={multiUploadFiles}
        onFilesDrop={handleMultiUploadDrop}
        onFilesDragOver={handleMultiUploadDragOver}
        onFileRemove={removeMultiUploadFile}
        onClear={clearMultiUpload}
        onUpload={processMultiUpload}
        progress={multiUploadProgress}
        results={multiUploadResults}
        isCreatingCollection={multiUploadCreatingCollection}
        isUploading={multiUploadResults.length > 0}
      />
    </Layout>
  );
};

export default BunnySyncAdminPage;
