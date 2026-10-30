import { useMemo, useState } from 'react';
import { CheckCircle, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FilenameBatchLink, FilenameLinkCandidate } from '@/types/bunny-sync';

interface BatchFilenameLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: FilenameLinkCandidate[];
  isLoading: boolean;
  isApplying: boolean;
  onRefresh: () => Promise<void>;
  onApply: (links: FilenameBatchLink[]) => Promise<void>;
}

export const BatchFilenameLinkModal: React.FC<BatchFilenameLinkModalProps> = ({
  isOpen,
  onClose,
  candidates,
  isLoading,
  isApplying,
  onRefresh,
  onApply,
}) => {
  const linkable = useMemo(() => candidates.filter(
    (candidate) =>
      (candidate.status === 'matched' && candidate.matchedLesson) ||
      (candidate.status === 'create_lesson' && candidate.matchedHierarchy)
  ), [candidates]);
  const [excludedVideoIds, setExcludedVideoIds] = useState<string[]>([]);
  const selectedCount = linkable.filter(
    (candidate) => !excludedVideoIds.includes(candidate.bunnyVideoId)
  ).length;

  if (!isOpen) return null;

  const toggleSelected = (videoId: string) => {
    setExcludedVideoIds((excluded) =>
      excluded.includes(videoId)
        ? excluded.filter((id) => id !== videoId)
        : [...excluded, videoId]
    );
  };

  const handleApply = async () => {
    const links: FilenameBatchLink[] = [];
    for (const candidate of linkable) {
      if (excludedVideoIds.includes(candidate.bunnyVideoId)) continue;
      if (candidate.matchedLesson) {
        links.push({ bunnyVideoId: candidate.bunnyVideoId, lessonId: candidate.matchedLesson.id });
      } else if (candidate.matchedHierarchy) {
        links.push({
          bunnyVideoId: candidate.bunnyVideoId,
          createLesson: {
            levelId: candidate.matchedHierarchy.levelId,
            gradeId: candidate.matchedHierarchy.gradeId,
            areaId: candidate.matchedHierarchy.areaId,
            topicId: candidate.matchedHierarchy.topicId,
            subtopicId: candidate.matchedHierarchy.subtopicId,
            filename: candidate.filename,
          },
        });
      }
    }
    if (links.length > 0) await onApply(links);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="text-lg font-bold">Batch Link Videos from Filenames</h2>
            <p className="mt-1 text-sm text-gray-500">
              Filename format: Grade 7 Area Name - Strand Name.mp4. Review matches before linking.
            </p>
            <p className="mt-1 max-w-3xl text-sm text-amber-800">
              Existing lessons are linked directly. If the hierarchy matches but no lesson exists,
              batch apply creates it from the filename. Missing or ambiguous levels, grades, areas,
              topics, and subtopics must be corrected in the hierarchy first. The filename does not
              include a level, so grade records resolve to their saved level.
            </p>
            <div className="mt-2 flex gap-4 text-sm">
              <a
                href="/admin/learning-hierarchy"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-teal-700 underline hover:text-teal-900"
              >
                Manage levels and hierarchy
              </a>
              <a
                href="/admin/lessons"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-teal-700 underline hover:text-teal-900"
              >
                Manage lessons
              </a>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isApplying}>✕</Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div className="flex gap-4 text-sm">
            <span className="text-green-700">Matched: {candidates.filter((candidate) => candidate.status === 'matched').length}</span>
            <span className="text-blue-700">Will create: {candidates.filter((candidate) => candidate.status === 'create_lesson').length}</span>
            <span className="text-amber-700">Needs review: {candidates.filter((candidate) => candidate.status === 'ambiguous').length}</span>
            <span className="text-red-700">Unmatched: {candidates.filter((candidate) => candidate.status === 'unmatched' || candidate.status === 'lesson_already_linked').length}</span>
            <span className="text-gray-600">Already linked: {candidates.filter((candidate) => candidate.status === 'already_linked').length}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void onRefresh()} disabled={isLoading || isApplying}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh preview
            </Button>
            <Button size="sm" onClick={() => void handleApply()} disabled={!selectedCount || isLoading || isApplying}>
              {isApplying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Link selected ({selectedCount})
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : candidates.length === 0 ? (
            <p className="py-12 text-center text-gray-500">No Bunny videos were found.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="p-3">Link</th>
                  <th className="p-3">Bunny filename</th>
                  <th className="p-3">Parsed hierarchy</th>
                  <th className="p-3">Match result</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => {
                  const canLink =
                    (candidate.status === 'matched' && !!candidate.matchedLesson) ||
                    (candidate.status === 'create_lesson' && !!candidate.matchedHierarchy);
                  return (
                    <tr key={candidate.bunnyVideoId} className="border-t align-top">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={!excludedVideoIds.includes(candidate.bunnyVideoId)}
                          disabled={!canLink || isApplying}
                          onChange={() => toggleSelected(candidate.bunnyVideoId)}
                          aria-label={`Select ${candidate.filename}`}
                        />
                      </td>
                      <td className="max-w-sm break-words p-3">
                        <div className="font-medium">{candidate.filename || 'Untitled'}</div>
                        <code className="text-xs text-gray-500">{candidate.bunnyVideoId}</code>
                      </td>
                      <td className="p-3">
                        {candidate.parsed ? (
                          <div>
                            <div>{candidate.parsed.grade}</div>
                            <div>{candidate.parsed.area}</div>
                            <div>{candidate.parsed.subtopic}</div>
                          </div>
                        ) : <span className="text-gray-400">Filename format not recognized</span>}
                      </td>
                      <td className="p-3">
                        <div className="flex items-start gap-2">
                          {canLink ? (
                            <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="mt-0.5 h-4 w-4 text-amber-600" />
                          )}
                          <div>
                            <div>{candidate.message}</div>
                            {candidate.matchedLesson && (
                              <div className="mt-1 text-xs text-gray-600">
                                Lesson #{candidate.matchedLesson.id}: {candidate.matchedLesson.title}
                              </div>
                            )}
                            {candidate.suggestions?.map((suggestion) => (
                              <div key={suggestion.id} className="mt-1 text-xs text-gray-500">
                                {suggestion.name || suggestion.title}
                                {suggestion.score !== undefined && ` (${Math.round(suggestion.score * 100)}% match)`}
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
