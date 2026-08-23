import React from 'react';
import type { RoomEntity } from '@vastuplan/shared';
import { useProjectStore } from '../../stores/projectStore';
import { useHistoryStore, createHistoryAction } from '../../stores/historyStore';
import { calculateRectangleArea } from '../../utils/geometry';

interface RoomInspectorProps {
  room: RoomEntity;
  unit: string;
}

const ROOM_NAME_PRESETS = [
  'Living Room',
  'Master Bedroom',
  'Bedroom 2',
  'Kitchen',
  'Dining Room',
  'Bathroom',
  'Pooja Room',
  'Balcony',
  'Corridor',
];

export const RoomInspector: React.FC<RoomInspectorProps> = ({ room, unit }) => {
  const { updateEntity, currentProject } = useProjectStore();
  const pushHistory = useHistoryStore((s) => s.push);

  const unitLabel = unit === 'feet' ? 'ft' : 'm';
  const areaUnit = unit === 'feet' ? 'sq.ft' : 'm²';
  const area = calculateRectangleArea(room.dimensions.width, room.dimensions.height);

  const handleNameChange = (name: string) => {
    const before = [...(currentProject?.floors[0]?.entities || [])];
    updateEntity(room.id, {
      properties: { ...room.properties, name },
    });
    const after = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];
    pushHistory(createHistoryAction('UPDATE_ENTITY', before, after, `Rename room to ${name}`));
  };

  const handleDimensionChange = (field: 'width' | 'height', val: number) => {
    if (isNaN(val) || val <= 0) return;
    const before = [...(currentProject?.floors[0]?.entities || [])];
    updateEntity(room.id, {
      dimensions: { ...room.dimensions, [field]: val },
    });
    const after = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];
    pushHistory(createHistoryAction('RESIZE_ENTITY', before, after, `Resize room ${field}`));
  };

  const handlePositionChange = (field: 'x' | 'y', val: number) => {
    if (isNaN(val)) return;
    const before = [...(currentProject?.floors[0]?.entities || [])];
    updateEntity(room.id, {
      position: { ...room.position, [field]: val },
    });
    const after = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];
    pushHistory(createHistoryAction('MOVE_ENTITY', before, after, `Move room ${field}`));
  };

  const handleRotationChange = (rotation: number) => {
    const before = [...(currentProject?.floors[0]?.entities || [])];
    updateEntity(room.id, { rotation });
    const after = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];
    pushHistory(createHistoryAction('ROTATE_ENTITY', before, after, `Rotate room to ${rotation}°`));
  };

  return (
    <div className="p-3 animate-slide-in-right">
      <div className="border-b border-panel-border pb-2 mb-3">
        <span className="text-2xs font-semibold tracking-widest uppercase text-brand-400">
          Room Properties
        </span>
        <p className="text-text-primary text-xs font-mono-numbers mt-0.5 truncate">
          ID: {room.id}
        </p>
      </div>

      <div className="space-y-3">
        {/* Name Input & Presets */}
        <div className="inspector-field">
          <label className="inspector-label">Room Name</label>
          <input
            type="text"
            className="input-base mb-1.5"
            value={room.properties.name || ''}
            onChange={(e) => handleNameChange(e.target.value)}
          />
          <div className="flex flex-wrap gap-1">
            {ROOM_NAME_PRESETS.map((preset) => (
              <button
                key={preset}
                className={`btn btn-2xs ${
                  room.properties.name === preset ? 'btn-primary' : 'btn-ghost'
                }`}
                onClick={() => handleNameChange(preset)}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="inspector-label">Width ({unitLabel})</label>
            <input
              type="number"
              step="any"
              min="0.5"
              className="input-base font-mono-numbers"
              value={room.dimensions.width.toFixed(2)}
              onChange={(e) => handleDimensionChange('width', parseFloat(e.target.value))}
            />
          </div>
          <div>
            <label className="inspector-label">Height ({unitLabel})</label>
            <input
              type="number"
              step="any"
              min="0.5"
              className="input-base font-mono-numbers"
              value={room.dimensions.height.toFixed(2)}
              onChange={(e) => handleDimensionChange('height', parseFloat(e.target.value))}
            />
          </div>
        </div>

        {/* Calculated Area */}
        <div className="bg-canvas-bg rounded p-2.5 border border-panel-border">
          <div className="text-2xs text-text-muted mb-0.5">Calculated Room Area</div>
          <div className="text-text-primary text-sm font-semibold font-mono-numbers">
            {area.toFixed(0)} <span className="text-xs font-normal text-text-muted">{areaUnit}</span>
          </div>
        </div>

        {/* Position */}
        <div className="border-t border-panel-border/60 pt-2">
          <span className="text-2xs font-medium text-text-muted block mb-1">Position (World)</span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-2xs text-text-muted">X ({unitLabel})</label>
              <input
                type="number"
                step="any"
                className="input-base font-mono-numbers"
                value={room.position.x.toFixed(2)}
                onChange={(e) => handlePositionChange('x', parseFloat(e.target.value))}
              />
            </div>
            <div>
              <label className="text-2xs text-text-muted">Y ({unitLabel})</label>
              <input
                type="number"
                step="any"
                className="input-base font-mono-numbers"
                value={room.position.y.toFixed(2)}
                onChange={(e) => handlePositionChange('y', parseFloat(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div className="inspector-field border-t border-panel-border/60 pt-2">
          <label className="inspector-label">Rotation</label>
          <div className="grid grid-cols-4 gap-1">
            {[0, 90, 180, 270].map((rot) => (
              <button
                key={rot}
                className={`btn btn-xs ${
                  (room.rotation || 0) === rot ? 'btn-primary' : 'btn-secondary'
                }`}
                onClick={() => handleRotationChange(rot)}
              >
                {rot}°
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
