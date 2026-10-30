import { useMemo } from 'react';
import { CheckCircle, Loader2, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SyncedLesson } from '@/types/bunny-sync';

interface SyncedLessonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: SyncedLesson[];
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: string) => void;
  searchQuery: string;
  filterStatus: string;
  getSyncStatusBadge: (status?: string) => React.ReactNode;
  onSyncLesson: (lessonId: number) => Promise<void>;
  syncingLessonId: number | null;
}

export const SyncedLessonsModal: React.FC<SyncedLessonsModalProps> = ({
  isOpen,
  onClose,
  lessons,
  isLoading,
  onSearchChange,
  onFilterChange,
  searchQuery,
  filterStatus,
  getSyncStatusBadge,
  onSyncLesson,
  syncingLessonId,
}) => {
  const handleClose = () => {
    onClose();
  };

  const filteredLessons = useMemo(() => {
    let filtered = lessons;
    if (searchQuery) {
      filtered = filtered.filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(l => l.sync_status === filterStatus);
    }
    return filtered.sort((a, b) => b.id - a.id);
  }, [lessons, searchQuery, filterStatus]);

  const getFilteredCount = (status: string) => {
    return lessons.filter(l => l.sync_status === status).length;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Synced Lessons List</h3>
            <p className="text-sm text-gray-500 mt-1">
              Showing {filteredLessons.length} of {lessons.length} lessons with videos
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search lessons..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-md text-sm w-64"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => onFilterChange(e.target.value)}
              className="p-2 border rounded-md text-sm"
            >
              <option value="all">All Status ({lessons.length})</option>
              <option value="completed">
                Synced ({getFilteredCount('completed')})
              </option>
              <option value="processing">
                Processing ({getFilteredCount('processing')})
              </option>
              <option value="pending">
                Pending ({getFilteredCount('pending')})
              </option>
              <option value="failed">
                Failed ({getFilteredCount('failed')})
              </option>
            </select>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              ✕
            </Button>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No synced lessons found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">Lesson ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">Sync Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">Bunny Video ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">Transcoding</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">Progress</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLessons.map((lesson) => (
                    <tr key={lesson.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{lesson.id}</td>
                      <td className="px-4 py-3 text-sm max-w-[250px] truncate">{lesson.title}</td>
                      <td className="px-4 py-3">{getSyncStatusBadge(lesson.sync_status)}</td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-gray-600 max-w-[150px] truncate">
                          {lesson.bunny_video_id || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600">
                          {lesson.transcoding_status || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min((lesson.sync_progress || 0), 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{lesson.sync_progress || 0}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={syncingLessonId !== null}
                          onClick={() => onSyncLesson(lesson.id)}
                        >
                          {syncingLessonId === lesson.id ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Syncing</>
                          ) : (
                            <><RefreshCw className="h-4 w-4 mr-2" /> Sync</>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
