import React, { useCallback } from 'react';
import { Video, HardDrive, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Level, Grade, Area, Topic, Subtopic, MultiUploadResult } from '@/types/bunny-sync';

interface MultiUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  levels: Level[];
  grades: Grade[];
  areas: Area[];
  topics: Topic[];
  subtopics: Subtopic[];
  hierarchy: {
    levelId: string;
    gradeId: string;
    areaId: string;
    topicId: string;
    subtopicId: string;
  };
  onHierarchyChange: (key: string, value: string) => void;
  files: File[];
  onFilesDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onFilesDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onFileRemove: (index: number) => void;
  onClear: () => void;
  onUpload: () => Promise<void>;
  progress: Map<string, number>;
  results: MultiUploadResult[];
  isCreatingCollection: boolean;
  isUploading: boolean;
}

export const MultiUploadModal: React.FC<MultiUploadModalProps> = ({
  isOpen,
  onClose,
  levels,
  grades,
  areas,
  hierarchy,
  onHierarchyChange,
  files,
  onFilesDrop,
  onFilesDragOver,
  onFileRemove,
  onClear,
  onUpload,
  progress,
  results,
  isCreatingCollection,
  isUploading,
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onFilesDrop(e);
    },
    [onFilesDrop]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onFilesDragOver(e);
    },
    [onFilesDragOver]
  );

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Video className="h-6 w-6 text-blue-600" />
            Batch Upload Videos to Bunny Stream
          </h3>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            ✕
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[85vh]">
          {/* Hierarchy Selection */}
          <div className="p-6 border-b bg-gray-50">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Organize into Collection (Optional)
            </h4>
            <p className="text-xs text-gray-500 mb-4">
              Select the learning hierarchy to automatically create a collection (Level / Grade / Area)
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Level</label>
                <select
                  value={hierarchy.levelId}
                  onChange={(e) => onHierarchyChange('levelId', e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                >
                  <option value="">Select...</option>
                  {levels.map((l) => (
                    <option key={l.level_id} value={l.level_id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Grade</label>
                <select
                  value={hierarchy.gradeId}
                  onChange={(e) => onHierarchyChange('gradeId', e.target.value)}
                  disabled={!hierarchy.levelId}
                  className="w-full p-2 border rounded-md text-sm disabled:opacity-50"
                >
                  <option value="">Select...</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Area</label>
                <select
                  value={hierarchy.areaId}
                  onChange={(e) => onHierarchyChange('areaId', e.target.value)}
                  disabled={!hierarchy.gradeId}
                  className="w-full p-2 border rounded-md text-sm disabled:opacity-50"
                >
                  <option value="">Select...</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {hierarchy.levelId && hierarchy.gradeId && hierarchy.areaId && (
              <div className="mt-3 p-2 bg-emerald-50 rounded border border-emerald-200">
                <p className="text-xs text-emerald-700">
                  <span className="font-medium">Collection will be created:</span>{' '}
                  {levels.find(l => l.level_id === Number(hierarchy.levelId))?.name} /{' '}
                  {grades.find(g => g.id === Number(hierarchy.gradeId))?.name} /{' '}
                  {areas.find(a => a.id === Number(hierarchy.areaId))?.name}
                </p>
              </div>
            )}
          </div>

          {/* Drag & Drop Zone */}
          <div className="p-6">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                files.length > 0 ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
            >
              <Video className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 mb-1">Drag and drop video files here</p>
              <p className="text-sm text-gray-400 mb-3">or click to browse files</p>
              <input
                type="file"
                multiple
                accept="video/*"
                onChange={(e) => {
                  const newFiles = Array.from(e.target.files || []).filter(f =>
                    f.type.startsWith('video/') && f.size <= 2 * 1024 * 1024 * 1024
                  );
                  if (newFiles.length > 0) {
                    // File selection handled by parent via onFilesDrop
                    console.warn('File selection - parent should handle state update');
                  }
                }}
                className="hidden"
                id="fileInputMulti"
                disabled={results.length > 0}
              />
              <label
                htmlFor="fileInputMulti"
                className={`inline-block px-4 py-2 bg-blue-600 text-white rounded-md text-sm cursor-pointer hover:bg-blue-700 ${
                  results.length > 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Select Videos
              </label>
              <p className="text-xs text-gray-400 mt-2">Max 2GB per video</p>
            </div>

            {/* Selected Files List */}
            {files.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Selected: {files.length} video(s) ({Math.round(totalSize / 1024 / 1024)} MB)
                  </span>
                  <button
                    onClick={onClear}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Clear all
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {files.map((file, idx) => {
                    const progressVal = progress.get(file.name) || 0;
                    const result = results.find(r => r.filename === file.name);
                    return (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <Video className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm truncate flex-1">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                        <button
                          onClick={() => onFileRemove(idx)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          ✕
                        </button>
                        {(progressVal > 0 || result) && (
                          <div className="flex items-center gap-2 ml-2">
                            {result?.status === 'failed' && (
                              <span className="text-xs text-red-600">❌</span>
                            )}
                            {result?.status === 'completed' && (
                              <span className="text-xs text-emerald-600">✓</span>
                            )}
                            {progressVal > 0 && progressVal < 100 && (
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 transition-all"
                                  style={{ width: `${progressVal}%` }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {isCreatingCollection && (
                  <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating/using collection...
                    </div>
                  </div>
                )}

                <button
                  onClick={onUpload}
                  disabled={files.length === 0 || results.length > 0 || isUploading}
                  className={`mt-4 w-full py-2 rounded-md text-sm ${
                    files.length === 0 || results.length > 0 || isUploading
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isUploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    `Upload ${files.length} Video${files.length > 1 ? 's' : ''}`
                  )}
                </button>

                {results.length > 0 && (
                  <div className="mt-4 text-sm">
                    <p className="font-medium text-gray-700 mb-2">Results:</p>
                    {results.filter(r => r.status === 'completed').length > 0 && (
                      <p className="text-emerald-600">
                        ✓ {results.filter(r => r.status === 'completed').length} uploaded successfully
                      </p>
                    )}
                    {results.filter(r => r.status === 'failed').length > 0 && (
                      <p className="text-red-600">
                        ❌ {results.filter(r => r.status === 'failed').length} failed
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
