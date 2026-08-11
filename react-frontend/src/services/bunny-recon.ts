import { publicApi } from "./api";

/**
 * Bunny Reconciliation Service
 * Handles mapping Bunny videos to lessons and cleanup of orphaned references
 */
export const bunnyReconService = {
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
