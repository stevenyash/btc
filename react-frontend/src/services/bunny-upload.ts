import { publicApi } from "./api";

export interface UploadFile {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
}

export interface UploadJob {
  id: string;
  filename: string;
  originalName: string;
  lessonId?: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  bunnyVideoId?: string;
  bunnyStoragePath?: string;
  startedAt: string;
  completedAt?: string;
}

export interface UploadResult {
  jobId: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
}

export interface UploadResponse {
  success: boolean;
  message?: string;
  error?: string;
  uploads: UploadResult[];
}

export interface JobsResponse {
  success: boolean;
  count: number;
  jobs: UploadJob[];
}

export interface ProcessResponse {
  success: boolean;
  error?: string;
  jobId: string;
  message?: string;
  videoId?: string;
  status?: string;
}

export interface BatchProcessResponse {
  success: boolean;
  error?: string;
  results: Array<{
    jobId: string;
    status: 'completed' | 'failed' | 'skipped';
    videoId?: string;
    transcodingStatus?: string;
    error?: string;
  }>;
}

export interface AttachLessonRequest {
  jobId: string;
  lessonId: number;
  title?: string;
}

export interface CreateLessonRequest {
  jobId: string;
  title: string;
  description?: string;
  areaId?: number;
  levelId?: number;
  topicId?: number;
  subtopicId?: number;
  price?: number;
}

export const bunnyUploadService = {
  /**
   * Upload video files to the server for Bunny Stream processing
   * Uses FormData with multipart/form-data and includes CSRF token via publicApi interceptor
   */
  uploadVideos: async (files: File[]): Promise<UploadResponse> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('videos', file);
    });

    const response = await publicApi.post<UploadResponse>('/bunny-upload/upload', formData);
    return response.data;
  },

  /**
   * Get all upload jobs
   */
  getJobs: async (): Promise<JobsResponse> => {
    const response = await publicApi.get<JobsResponse>('/bunny-upload/jobs');
    return response.data;
  },

  /**
   * Get a specific upload job by ID
   */
  getJob: async (jobId: string): Promise<{ success: boolean; job: UploadJob }> => {
    const response = await publicApi.get<{ success: boolean; job: UploadJob }>(
      `/bunny-upload/job/${jobId}`
    );
    return response.data;
  },

  /**
   * Process an upload (upload to Bunny Stream)
   */
  processUpload: async (jobId: string): Promise<ProcessResponse> => {
    const response = await publicApi.post<ProcessResponse>(
      `/bunny-upload/process/${jobId}`
    );
    return response.data;
  },

  /**
   * Process multiple uploads in batch
   */
  processBatch: async (jobIds: string[]): Promise<BatchProcessResponse> => {
    const response = await publicApi.post<BatchProcessResponse>('/bunny-upload/process-batch', {
      jobIds,
    });
    return response.data;
  },

  /**
   * Upload a single video file to the server for Bunny Stream processing
   * Used for multi-upload flow
   */
  uploadVideo: async (file: File): Promise<{ success: boolean; uploads: UploadResult[] }> => {
    const formData = new FormData();
    formData.append('videos', file);

    const response = await publicApi.post<UploadResponse>('/bunny-upload/upload', formData);
    return response.data;
  },

  /**
   * Process a single upload to Bunny Stream
   */
  processSingleUpload: async (jobId: string): Promise<ProcessResponse> => {
    const response = await publicApi.post<ProcessResponse>(
      `/bunny-upload/process/${jobId}`
    );
    return response.data;
  },

  /**
   * Attach an uploaded video to an existing lesson
   */
  attachToLesson: async (request: AttachLessonRequest) => {
    const response = await publicApi.post('/bunny-upload/attach-to-lesson', request);
    return response.data;
  },

  /**
   * Create a new lesson from an uploaded video
   */
  createLessonFromUpload: async (request: CreateLessonRequest) => {
    const response = await publicApi.post('/bunny-upload/create-lesson-from-upload', request);
    return response.data;
  },
};