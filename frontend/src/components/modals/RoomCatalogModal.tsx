import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { ROOM_LIBRARY, type RoomPreset } from '../../constants/roomLibrary';
import { useUIStore } from '../../stores/uiStore';

interface RoomCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: RoomPreset) => void;
}

export const RoomCatalogModal: React.FC<RoomCatalogModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Living', 'Bedrooms', 'Kitchen', 'Dining', 'Bathrooms', 'Spiritual', 'Work', 'Storage', 'Outdoor'];

  const filteredPresets =
    selectedCategory === 'All'
      ? ROOM_LIBRARY
      : ROOM_LIBRARY.filter((r) => r.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface border border-panel-border rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="h-12 px-4 border-b border-panel-border flex items-center justify-between bg-panel-header">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary text-sm">Room Catalog Library</span>
            <span className="text-2xs text-text-muted">Select a room template to place</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-panel-border bg-panel-bg px-3 py-1.5 gap-1 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`btn btn-2xs ${
                selectedCategory === cat ? 'btn-primary' : 'btn-ghost text-text-muted'
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Catalog Grid */}
        <div className="p-4 max-h-[60vh] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredPresets.map((preset) => (
            <div
              key={preset.roomType}
              className="border border-panel-border rounded-md p-3 bg-panel-bg/40 hover:bg-panel-bg hover:border-brand-400/50 cursor-pointer transition-all flex flex-col justify-between"
              onClick={() => {
                onSelectPreset(preset);
                onClose();
              }}
            >
              <div>
                <span className="text-2xs font-semibold text-brand-400 tracking-wider uppercase">
                  {preset.category}
                </span>
                <h4 className="text-xs font-semibold text-text-primary mt-0.5">
                  {preset.displayName}
                </h4>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-panel-border/60 pt-2 text-2xs text-text-muted">
                <span>Default: {preset.defaultWidth} × {preset.defaultHeight} ft</span>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
