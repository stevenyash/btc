import { useMemo, useState } from 'react';
import { Search, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { BunnyVideo, Level, Grade, Area, Topic, Subtopic } from '@/types/bunny-sync';

interface LinkVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  bunnyVideos: BunnyVideo[];
  selectedVideo: BunnyVideo | null;
  onVideoSelect: (video: BunnyVideo) => void;
  linkModalVideoSearch: string;
  onLinkModalVideoSearchChange: (value: string) => void;
  levels: Level[];
  grades: Grade[];
  areas: Area[];
  topics: Topic[];
  subtopics: Subtopic[];
  selectedLevelId: number | '';
  selectedGradeId: number | '';
  selectedAreaId: number | '';
  selectedTopicId: number | '';
  selectedSubtopicId: number | '';
  onLevelChange: (id: number | '') => void;
  onGradeChange: (id: number | '') => void;
  onAreaChange: (id: number | '') => void;
  onTopicChange: (id: number | '') => void;
  onSubtopicChange: (id: number | '') => void;
  onCreateArea: (name: string) => Promise<'created' | 'existing'>;
  onCreateTopic: (name: string) => Promise<'created' | 'existing'>;
  onCreateSubtopic: (name: string) => Promise<'created' | 'existing'>;
  onLink: () => Promise<void>;
  isLinking: boolean;
  getTranscodingBadge: (status: string) => React.ReactNode;
}

export const LinkVideoModal: React.FC<LinkVideoModalProps> = ({
  isOpen,
  onClose,
  bunnyVideos,
  selectedVideo,
  onVideoSelect,
  linkModalVideoSearch,
  onLinkModalVideoSearchChange,
  levels,
  grades,
  areas,
  topics,
  subtopics,
  selectedLevelId,
  selectedGradeId,
  selectedAreaId,
  selectedTopicId,
  selectedSubtopicId,
  onLevelChange,
  onGradeChange,
  onAreaChange,
  onTopicChange,
  onSubtopicChange,
  onCreateArea,
  onCreateTopic,
  onCreateSubtopic,
  onLink,
  isLinking,
  getTranscodingBadge,
}) => {
  const [addingItem, setAddingItem] = useState<'area' | 'topic' | 'subtopic' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [isCreatingItem, setIsCreatingItem] = useState(false);

  const unmappedVideos = useMemo(() => 
    bunnyVideos.filter(v => !v.mappedLesson),
    [bunnyVideos]
  );

  const filteredUnmapped = useMemo(() =>
    unmappedVideos.filter(v =>
      v.title.toLowerCase().includes(linkModalVideoSearch.toLowerCase())
    ),
    [unmappedVideos, linkModalVideoSearch]
  );

  if (!isOpen) return null;

  const handleClose = () => {
    setAddingItem(null);
    setNewItemName('');
    onClose();
  };

  const handleCreateItem = async () => {
    const name = newItemName.trim();
    if (!addingItem || !name || isCreatingItem) return;

    setIsCreatingItem(true);
    try {
      const result = addingItem === 'area'
        ? await onCreateArea(name)
        : addingItem === 'topic'
          ? await onCreateTopic(name)
          : await onCreateSubtopic(name);
      setAddingItem(null);
      setNewItemName('');
      toast.success(result === 'created' ? `${addingItem} added` : `Existing ${addingItem} selected`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add hierarchy item');
    } finally {
      setIsCreatingItem(false);
    }
  };

  const renderAddItemInput = (kind: 'area' | 'topic' | 'subtopic', label: string) =>
    addingItem === kind ? (
      <div className="mt-2 flex gap-2">
        <Input
          autoFocus
          value={newItemName}
          onChange={(event) => setNewItemName(event.target.value)}
          placeholder={`New ${label.toLowerCase()} name`}
          maxLength={255}
          disabled={isCreatingItem}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void handleCreateItem();
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          onClick={() => void handleCreateItem()}
          disabled={!newItemName.trim() || isCreatingItem}
        >
          {isCreatingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setAddingItem(null);
            setNewItemName('');
          }}
          disabled={isCreatingItem}
        >
          Cancel
        </Button>
      </div>
    ) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold">Link Unmapped Bunny Video</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
          >
            ✕
          </Button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
          {/* Bunny Video Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700">Select Bunny Video</h4>
              {selectedVideo && (
                <span className="text-xs text-green-600 font-medium">✓ Selected</span>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Bunny videos..."
                value={linkModalVideoSearch}
                onChange={(e) => onLinkModalVideoSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
              />
            </div>
            <div className="border rounded-lg max-h-60 overflow-y-auto bg-gray-50">
              {bunnyVideos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No Bunny videos loaded
                </div>
              ) : (
                <div className="divide-y">
                  {filteredUnmapped.map((video) => (
                    <div
                      key={video.guid}
                      onClick={() => onVideoSelect(video)}
                      className={`p-3 cursor-pointer hover:bg-blue-50 transition-colors ${
                        selectedVideo?.guid === video.guid ? 'bg-blue-100 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            selectedVideo?.guid === video.guid
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedVideo?.guid === video.guid && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{video.title || 'Untitled Video'}</p>
                            <p className="text-xs text-gray-500 font-mono truncate">{video.guid}</p>
                          </div>
                        </div>
                        {getTranscodingBadge(video.transcodingStatus)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {unmappedVideos.length > 0 && (
                <p className="text-xs text-gray-500 p-2">
                  Showing {filteredUnmapped.length} of {unmappedVideos.length} unmapped video(s)
                </p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Select hierarchy for the lesson to be created */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                <select
                  value={selectedLevelId}
                  onChange={(e) => onLevelChange(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2 border rounded-md text-sm"
                >
                  <option value="">Select level...</option>
                  {levels.map((level) => (
                    <option key={level.level_id} value={level.level_id}>
                      {level.name}{level.is_active === false ? ' (inactive)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                <select
                  value={selectedGradeId}
                  onChange={(e) => onGradeChange(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2 border rounded-md text-sm"
                  disabled={!selectedLevelId}
                >
                  <option value="">Select grade...</option>
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}{grade.is_active === false ? ' (inactive)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Learning Area</label>
                <select
                  value={selectedAreaId}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setAddingItem('area');
                      setNewItemName('');
                    } else {
                      setAddingItem(null);
                      onAreaChange(e.target.value ? Number(e.target.value) : '');
                    }
                  }}
                  className="w-full p-2 border rounded-md text-sm"
                  disabled={!selectedGradeId}
                >
                  <option value="">Select area...</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}{area.is_active === false ? ' (inactive)' : ''}
                    </option>
                  ))}
                  <option value="__add_new__">+ Add a new area...</option>
                </select>
                {renderAddItemInput('area', 'Area')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setAddingItem('topic');
                      setNewItemName('');
                    } else {
                      setAddingItem(null);
                      onTopicChange(e.target.value ? Number(e.target.value) : '');
                    }
                  }}
                  className="w-full p-2 border rounded-md text-sm"
                  disabled={!selectedAreaId}
                >
                  <option value="">Select topic...</option>
                  {topics.map((topic) => (
                    <option key={topic.topic_id} value={topic.topic_id}>
                      {topic.name}
                    </option>
                  ))}
                  <option value="__add_new__">+ Add a new topic...</option>
                </select>
                {renderAddItemInput('topic', 'Topic')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtopic</label>
                <select
                  value={selectedSubtopicId}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setAddingItem('subtopic');
                      setNewItemName('');
                    } else {
                      setAddingItem(null);
                      onSubtopicChange(e.target.value ? Number(e.target.value) : '');
                    }
                  }}
                  className="w-full p-2 border rounded-md text-sm"
                  disabled={!selectedTopicId}
                >
                  <option value="">Select subtopic...</option>
                  {subtopics.map((subtopic) => (
                    <option key={subtopic.subtopic_id} value={subtopic.subtopic_id}>
                      {subtopic.name}
                    </option>
                  ))}
                  <option value="__add_new__">+ Add a new subtopic...</option>
                </select>
                {renderAddItemInput('subtopic', 'Subtopic')}
              </div>
            </div>
            {selectedVideo && (
              <p className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                Linking will create a new lesson from this Bunny video's filename under the selected hierarchy.
                {selectedSubtopicId ? '' : ' Subtopic is optional.'}
              </p>
            )}
          </div>

          {selectedVideo && (
            <div className="bg-blue-50 p-4 rounded space-y-2 text-sm border border-blue-200">
              <p className="font-semibold text-blue-800">Video to Link:</p>
              <p><strong>Title:</strong> {selectedVideo.title}</p>
              <p><strong>Bunny ID:</strong> <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{selectedVideo.guid}</code></p>
              <p><strong>Transcoding:</strong> {selectedVideo.transcodingStatus}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={onLink}
              disabled={!selectedVideo || !selectedLevelId || !selectedGradeId || !selectedAreaId || !selectedTopicId || isLinking}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isLinking ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating lesson...</>
              ) : (
                <><CheckCircle className="h-4 w-4 mr-2" /> Create Lesson & Link Video</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
