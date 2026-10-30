import { useState } from 'react';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Info, RefreshCw, Trash2, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReconciliationResult, CleanupResult, ReconciliationStats } from '@/types/bunny-sync';
import { bunnyReconService } from '@/services/bunny-recon';

interface ReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'reconcile' | 'cleanup' | 'stats';
}

export const ReconciliationModal: React.FC<ReconciliationModalProps> = ({
  isOpen,
  onClose,
  mode,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ReconciliationResult | CleanupResult | ReconciliationStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (!isLoading) {
      setResult(null);
      setError(null);
      onClose();
    }
  };

  const handleRun = async (dryRun: boolean) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let response;
      if (mode === 'reconcile') {
        response = await bunnyReconService.reconcile({ dryRun, force: false });
        setResult(response.data);
      } else if (mode === 'cleanup') {
        response = await bunnyReconService.cleanupOrphaned({ dryRun });
        setResult(response.data);
      } else {
        response = await bunnyReconService.getStats();
        setResult(response.data);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStats = (stats: ReconciliationStats) => (
    <div className="grid grid-cols-2 gap-4 py-4">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">{stats.totalBunnyVideos}</div>
        <div className="text-sm text-gray-600">Total Bunny Videos</div>
      </div>
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <div className="text-2xl font-bold text-green-600">{stats.mappedLessons}</div>
        <div className="text-sm text-gray-600">Mapped Lessons</div>
      </div>
      <div className="text-center p-4 bg-purple-50 rounded-lg">
        <div className="text-2xl font-bold text-purple-600">{stats.unmappedVideos}</div>
        <div className="text-sm text-gray-600">Unmapped Videos</div>
      </div>
      <div className="text-center p-4 bg-red-50 rounded-lg">
        <div className="text-2xl font-bold text-red-600">{stats.orphanedVideos}</div>
        <div className="text-sm text-gray-600">Orphaned References</div>
      </div>
    </div>
  );

  const renderReconciliationResult = (res: ReconciliationResult) => (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600">{res.totalVideos}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">{res.linked}</div>
          <div className="text-xs text-gray-500">{res.dryRun ? 'Would Link' : 'Linked'}</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-amber-600">{res.skipped}</div>
          <div className="text-xs text-gray-500">Skipped</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-red-600">{res.failed}</div>
          <div className="text-xs text-gray-500">Failed</div>
        </div>
      </div>

      {res.details.length > 0 && (
        <div className="mt-4 max-h-64 overflow-y-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left">Video</th>
                <th className="px-3 py-2 text-left">Lesson</th>
                <th className="px-3 py-2 text-left">Decision</th>
              </tr>
            </thead>
            <tbody>
              {res.details.slice(0, 50).map((detail, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-3 py-2 truncate max-w-xs" title={detail.videoTitle}>
                    {detail.videoTitle}
                  </td>
                  <td className="px-3 py-2">
                    {detail.lessonTitle || '-'}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                      detail.status === 'linked' ? 'bg-green-100 text-green-700' :
                      detail.status === 'skipped' ? 'bg-amber-100 text-amber-700' :
                      detail.status === 'not_found' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {detail.status === 'linked' && <CheckCircle className="h-3 w-3" />}
                      {detail.status === 'skipped' && <Info className="h-3 w-3" />}
                      {detail.status === 'not_found' && <AlertTriangle className="h-3 w-3" />}
                      {detail.status === 'error' && <XCircle className="h-3 w-3" />}
                      {detail.status}
                    </span>
                    <p className="mt-1 text-xs text-gray-600">{detail.message}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {res.details.length > 50 && (
            <p className="text-xs text-gray-500 p-2">
              Showing 50 of {res.details.length} results
            </p>
          )}
        </div>
      )}
    </div>
  );

  const renderCleanupResult = (res: CleanupResult) => (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-4">
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600">{res.totalChecked}</div>
          <div className="text-xs text-gray-500">Checked</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">{res.skipped}</div>
          <div className="text-xs text-gray-500">Valid</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-red-600">{res.orphaned}</div>
          <div className="text-xs text-gray-500">Orphaned</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600">{res.cleaned}</div>
          <div className="text-xs text-gray-500">Cleaned</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-amber-600">{res.errors}</div>
          <div className="text-xs text-gray-500">Errors</div>
        </div>
      </div>

      {res.details.length > 0 && (
        <div className="mt-4 max-h-64 overflow-y-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left">Lesson</th>
                <th className="px-3 py-2 text-left">Video ID</th>
                <th className="px-3 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {res.details.slice(0, 50).map((detail, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-3 py-2 truncate max-w-xs" title={detail.lessonTitle}>
                    {detail.lessonTitle}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {detail.videoId}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                      detail.action === 'cleaned' ? 'bg-blue-100 text-blue-700' :
                      detail.action === 'skipped' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {detail.action === 'cleaned' && <CheckCircle className="h-3 w-3" />}
                      {detail.action === 'skipped' && <Info className="h-3 w-3" />}
                      {detail.action === 'error' && <XCircle className="h-3 w-3" />}
                      {detail.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {res.details.length > 50 && (
            <p className="text-xs text-gray-500 p-2">
              Showing 50 of {res.details.length} results
            </p>
          )}
        </div>
      )}
    </div>
  );

  const getTitle = () => {
    switch (mode) {
      case 'reconcile':
        return 'Reconcile Bunny Videos';
      case 'cleanup':
        return 'Cleanup Orphaned References';
      case 'stats':
        return 'Reconciliation Statistics';
      default:
        return '';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'reconcile':
        return 'Match Bunny titles to existing lessons by grade, learning area, topic, and strand';
      case 'cleanup':
        return 'Remove bunny_video_id references for videos that no longer exist in Bunny';
      case 'stats':
        return 'Current mapping status between Bunny videos and lessons';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              {mode === 'reconcile' && <RefreshCw className="h-5 w-5" />}
              {mode === 'cleanup' && <Trash2 className="h-5 w-5" />}
              {mode === 'stats' && <HardDrive className="h-5 w-5" />}
              {getTitle()}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{getDescription()}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={isLoading}>
            ✕
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading && !result && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2">
                {mode === 'reconcile' ? 'Reconciling...' :
                 mode === 'cleanup' ? 'Cleaning up...' : 'Loading...'}
              </span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
              <div className="flex items-start">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {result && !isLoading && (
            mode === 'stats' ? renderStats(result as ReconciliationStats) :
            mode === 'reconcile' ? renderReconciliationResult(result as ReconciliationResult) :
            renderCleanupResult(result as CleanupResult)
          )}

          {!result && !isLoading && !error && mode !== 'stats' && (
            <div className="text-center py-8">
              <Info className="h-12 w-12 mx-auto text-blue-500 mb-4" />
              <p className="text-gray-600 mb-4">
                {mode === 'reconcile'
                  ? 'Reconciliation only links Bunny videos to existing lessons when the grade, learning area, and lesson topic/subtopic produce one unambiguous match. It will not create hierarchy records or lessons, overwrite an existing video link, or choose between duplicate matches. Run Dry Run first and review the results before applying.'
                  : 'This will check all Bunny video references and remove those that no longer exist in Bunny Stream. The lesson record will be preserved, only the video reference is cleared.'}
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex gap-2 justify-end">
            {mode === 'stats' ? (
              <Button onClick={handleClose}>Close</Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                  Cancel
                </Button>
                {!result && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => handleRun(true)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Info className="mr-2 h-4 w-4" />
                      )}
                      Dry Run
                    </Button>
                    <Button
                      onClick={() => handleRun(false)}
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        mode === 'reconcile' ? <RefreshCw className="mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      {isLoading ? 'Running...' : mode === 'reconcile' ? 'Apply Reconciliation' : 'Run Cleanup'}
                    </Button>
                  </>
                )}
                {result && (
                  <Button onClick={handleClose}>Close</Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReconciliationModal;
