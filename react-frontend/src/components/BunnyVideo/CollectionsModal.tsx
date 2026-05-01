import React, { useState } from 'react';
import { Search, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Collection } from '@/types/bunny-sync';

interface CollectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  onSearchChange: (value: string) => void;
}

export const CollectionsModal: React.FC<CollectionsModalProps> = ({
  isOpen,
  onClose,
  collections,
  onSearchChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filtered = collections.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold">Bunny Collections (Learning Hierarchy)</h3>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            ✕
          </Button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onSearchChange(e.target.value);
              }}
              className="flex-1 p-2 border rounded-md text-sm"
            />
          </div>
        </div>
        <div className="overflow-y-auto max-h-[70vh] px-6 pb-6">
          {collections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <HardDrive className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No collections found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((collection) => (
                <div key={collection.guid} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{collection.name}</p>
                      <p className="text-xs text-gray-500 font-mono mt-1">ID: {collection.guid}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-4 w-4" />
                      {collection.videoCount} videos
                    </span>
                    <span>{Math.round(collection.totalSize / 1024 / 1024)} MB</span>
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
