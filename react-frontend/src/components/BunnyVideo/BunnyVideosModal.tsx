import React from 'react';
import { Video, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BunnyVideo } from '@/types/bunny-sync';

interface BunnyVideosModalProps {
  isOpen: boolean;
  onClose: () => void;
  videos: BunnyVideo[];
  isLoading: boolean;
  getTranscodingBadge: (status: string) => React.ReactNode;
}

export const BunnyVideosModal: React.FC<BunnyVideosModalProps> = ({
  isOpen,
  onClose,
  videos,
  isLoading,
  getTranscodingBadge,
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold">Bunny.net Videos</h3>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            ✕
          </Button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No videos found in Bunny.net</p>
            </div>
          ) : (
            <div className="space-y-3">
              {videos.map((video) => (
                <div key={video.guid} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium">{video.title}</p>
                      <p className="text-xs text-gray-500 font-mono mt-1">ID: {video.guid}</p>
                    </div>
                    {getTranscodingBadge(video.transcodingStatus)}
                  </div>
                  <div className="text-sm">
                    {video.mappedLesson ? (
                      <p className="text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Mapped to Lesson #{video.mappedLesson.id}: {video.mappedLesson.title}
                      </p>
                    ) : (
                      <p className="text-amber-600 flex items-center gap-1">
                        <span className="w-4 h-4 border-2 border-amber-600 rounded-full text-xs flex items-center justify-center">⚠</span>
                        Not mapped to any lesson
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
