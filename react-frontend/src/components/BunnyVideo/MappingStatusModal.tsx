import React from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { MappingItem } from '@/types/bunny-sync';

interface MappingStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  mappingData: MappingItem[];
  summary: {
    total: number;
    mapped: number;
    unmapped: number;
  };
  isLoading: boolean;
  getTranscodingBadge: (status: string) => React.ReactNode;
}

export const MappingStatusModal: React.FC<MappingStatusModalProps> = ({
  isOpen,
  onClose,
  mappingData,
  summary,
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
          <h3 className="text-lg font-bold">Mapping Status</h3>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            ✕
          </Button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Bunny Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Mapped</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{summary.mapped}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Unmapped</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{summary.unmapped}</div>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : mappingData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No mapping data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mappingData.map((item) => (
                <div key={item.bunnyVideoId} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-gray-500 font-mono mt-1">ID: {item.bunnyVideoId}</p>
                    </div>
                    {getTranscodingBadge(item.transcodingStatus)}
                  </div>
                  <div className="text-sm">
                    {item.isMapped && item.mappedLesson ? (
                      <p className="text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Mapped to Lesson #{item.mappedLesson.id}: {item.mappedLesson.title}
                      </p>
                    ) : (
                      <p className="text-amber-600 flex items-center gap-1">
                        ⚠ Not mapped to any lesson
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
