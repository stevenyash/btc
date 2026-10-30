import { publicApi } from "./api";

export interface BunnyMappingResult {
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

/**
 * Bunny Reconciliation Service
 * Handles mapping Bunny videos to lessons and cleanup of orphaned references
 */
export const bunnyReconService = {
  /**
   * Fetch Bunny videos and link confident title matches to existing lessons.
   */
  async mapAllVideosToLessons(): Promise<BunnyMappingResult> {
    const response = await publicApi.post<{ success: boolean; data: BunnyMappingResult }>(
      '/bunny-sync/map-all'
    );
    if (!response.data.success) {
      throw new Error('Failed to map Bunny videos to lessons');
    }
    return response.data.data;
  },

  /**
   * Reconcile Bunny videos with lessons based on title parsing
   */
  async reconcile(options: { dryRun?: boolean; force?: boolean } = {}): Promise<any> {
    const response = await publicApi.post('/bunny-sync/reconcile', {
      dryRun: options.dryRun ?? false,
      force: options.force ?? false,
    });
    return response.data;
  },

  /**
   * Get reconciliation statistics
   */
  async getStats(): Promise<any> {
    const response = await publicApi.get('/bunny-sync/reconciliation-stats');
    return response.data;
  },

  /**
   * Cleanup orphaned Bunny video references
   */
  async cleanupOrphaned(options: { dryRun?: boolean } = {}): Promise<any> {
    const response = await publicApi.post('/bunny-sync/cleanup-orphaned', {
      dryRun: options.dryRun ?? false,
    });
    return response.data;
  },
};

export default bunnyReconService;
