 

/**
 * Bunny.net video interface
 */
export interface BunnyVideo {
  guid: string;
  title: string;
  transcodingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  mappedLesson?: {
    id: number;
    title: string;
  } | null;
}

/**
 * Mapping item (flattened view)
 */
export interface MappingItem {
  bunnyVideoId: string;
  title: string;
  transcodingStatus: string;
  isMapped: boolean;
  mappedLesson?: {
    id: number;
    title: string;
  } | null;
}

/**
 * API response for pending lessons
 */
export interface PendingResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totalLessons: number;
  data: Array<{
    id: number;
    title: string;
    bunny_video_id?: string;
    storage_path?: string;
    transcoding_status?: string;
    sync_status?: string;
    sync_progress?: number;
  }>;
}

/**
 * Synced lesson (from lessons table with Bunny info)
 */
export interface SyncedLesson {
  id: number;
  title: string;
  bunny_video_id?: string;
  storage_path?: string;
  transcoding_status?: string;
  sync_status?: string;
  sync_progress?: number;
  thumbnail_url?: string;
}

/**
 * Bunny collection
 */
export interface Collection {
  guid: string;
  name: string;
  videoCount: number;
  totalSize: number;
}

/**
 * Link/unlink payloads
 */
export interface LinkVideoRequest {
  bunnyVideoId: string;
  lessonId: number;
}

export interface LinkVideoResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface CollectionCreateRequest {
  name: string;
}

export interface CollectionCreateResponse {
  success: boolean;
  data?: Collection;
  error?: string;
}

export interface VideoToCollectionRequest {
  videoId: string;
  collectionId: string | null;
}

/**
 * Stats response
 */
export interface BunnySyncStats {
  totalLessons: number;
  inSync: number;
  pending: number;
  noBunnyVideo: number;
}

export interface ReconciliationDetail {
  videoId: string;
  videoTitle: string;
  collectionName: string;
  lessonId?: number;
  lessonTitle?: string;
  status: 'linked' | 'skipped' | 'not_found' | 'error';
  message: string;
}

export interface ReconciliationResult {
  totalVideos: number;
  linked: number;
  skipped: number;
  failed: number;
  details: ReconciliationDetail[];
}

export interface CleanupDetail {
  lessonId: number;
  lessonTitle: string;
  videoId: string;
  action: 'cleaned' | 'skipped' | 'error';
  message: string;
}

export interface CleanupResult {
  totalChecked: number;
  orphaned: number;
  cleaned: number;
  skipped: number;
  errors: number;
  details: CleanupDetail[];
}

export interface ReconciliationStats {
  totalBunnyVideos: number;
  mappedLessons: number;
  unmappedVideos: number;
  orphanedVideos: number;
}

export interface MappingSummary {
  total: number;
  mapped: number;
  unmapped: number;
  totalBunnyVideos?: number;
  mappedVideos?: number;
  unmappedVideos?: number;
}

export interface MappingStatusResponse {
  success: boolean;
  data: MappingItem[];
  summary: MappingSummary;
}

/**
 * Learning hierarchy types
 */
export interface Level {
  level_id: number;
  name: string;
  description?: string;
}

export interface Grade {
  id: number;
  name: string;
  description?: string;
  level_id: number;
}

export interface Area {
  id: number;
  name: string;
  grade_id: number;
  color?: string;
  icon?: string;
}

export interface Topic {
  topic_id: number;
  area_id: number;
  name: string;
}

export interface Subtopic {
  subtopic_id: number;
  topic_id: number;
  name: string;
}

export interface LessonDetail {
  id: number;
  title: string;
  description?: string;
  duration: number;
  price: number;
  is_preview_available: boolean;
  bunny_video_id?: string;
  thumbnail_url?: string;
  area: string;
  area_id: number;
  topic: string;
  topic_id: number;
  subtopic: string;
  subtopic_id: number;
  grade: string;
  grade_id: number;
  level: string;
  level_id: number;
}

/**
 * Multi-upload result
 */
export interface MultiUploadResult {
  filename: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  bunnyVideoId?: string;
  collectionName?: string;
  error?: string;
}

/**
 * Bunny upload job
 */
export interface BunnyUploadJob {
  jobId: string;
  fileName: string;
  fileSize: number;
}

export interface BunnyUploadResponse {
  success: boolean;
  uploads?: BunnyUploadJob[];
  error?: string;
}

export interface BunnyProcessResponse {
  success: boolean;
  videoId: string;
  error?: string;
}
