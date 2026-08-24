import React from 'react';
import type { DoorEntity, DoorProperties } from '@vastuplan/shared';
import { useProjectStore } from '../../stores/projectStore';  
import { validateWallOccupancy, calculateHostedPosition } from '../../utils/architectural';

interface DoorInspectorProps {
  door: DoorEntity;
  unit: string;
}

export const DoorInspector: React.FC<DoorInspectorProps> = ({ door, unit }) => {
  const { updateEntity, currentProject } = useProjectStore();
  const unitLabel = unit === 'feet' ? 'ft' : 'm';

  const floor = currentProject?.floors[0];
  const hostWall = floor?.entities.find((e) => e.id === door.properties.hostWallId);

  const handleUpdate = (updates: Partial<DoorEntity['properties']>) => {
    const updatedProps = { ...door.properties, ...updates };

    // If offset or width changed, validate against host wall
    if (hostWall && hostWall.type === 'wall') {
      const otherHosted = (floor?.entities || []).filter(
        (e) =>
          (e.type === 'door' || e.type === 'window') &&
          (e.properties as { hostWallId?: string }).hostWallId === hostWall.id
      ) as unknown as { id: string; properties: { offsetAlongWall: number; width: number } }[];

      const val = validateWallOccupancy(
        (hostWall.properties as unknown as { startX: number; startY: number; endX: number; endY: number }),
        otherHosted,
        updatedProps.offsetAlongWall,
        updatedProps.width,
        door.id
      );

      if (!val.valid) {
        alert(val.reason || 'Invalid door placement on wall');
        return;
      }

      // Recalculate world position and rotation
      const { position, rotation } = calculateHostedPosition(
        (hostWall.properties as unknown as { startX: number; startY: number; endX: number; endY: number }),
        updatedProps.offsetAlongWall
      );

      updateEntity(door.id, {
        position,
        rotation,
        dimensions: { ...door.dimensions, width: updatedProps.width },
        properties: updatedProps,
      });
      return;
    }

    updateEntity(door.id, { properties: updatedProps });
  };

  const handleDoorRoleChange = (newRole: DoorProperties['doorRole']) => {
    const entities = floor?.entities || [];

    // Enforce single main-entrance per floor:
    // If setting this door to main-entrance, demote any existing main-entrance door
    if (newRole === 'main-entrance') {
      const existingMainEntrance = entities.find(
        (e) =>
          e.type === 'door' &&
          e.id !== door.id &&
          (e as DoorEntity).properties.doorRole === 'main-entrance'
      );
      if (existingMainEntrance) {
        // Automatically demote the previous main entrance to 'other'
        updateEntity(existingMainEntrance.id, {
          properties: {
            ...(existingMainEntrance as DoorEntity).properties,
            doorRole: 'other',
          },
        });
      }
    }

    handleUpdate({ doorRole: newRole });
  };

  return (
    <div className="p-3 animate-slide-in-right">
      <div className="border-b border-panel-border pb-2 mb-3">
        <span className="text-2xs font-semibold tracking-widest uppercase text-brand-400">
          Door Properties
        </span>
        <p className="text-text-primary text-xs font-mono-numbers mt-0.5 truncate">
          ID: {door.id}
        </p>
      </div>

      <div className="space-y-3">
        {/* Door Role (for Vastu analysis) */}
        <div className="inspector-field">
          <label className="inspector-label">Door Role</label>
          <select
            className={`input-base text-xs ${
              door.properties.doorRole === 'main-entrance'
                ? 'border-brand-500/60 bg-brand-900/20 text-brand-400'
                : ''
            }`}
            value={door.properties.doorRole || 'interior'}
            onChange={(e) => handleDoorRoleChange(e.target.value as DoorProperties['doorRole'])}
          >
            <option value="interior">Interior Door</option>
            <option value="main-entrance">⭐ Main Entrance</option>
            <option value="service">Service / Back Door</option>
            <option value="other">Other</option>
          </select>
          {door.properties.doorRole === 'main-entrance' && (
            <p className="text-brand-400/70 text-[9px] mt-1">
              ✓ This door is marked as the main entrance for Vastu analysis.
            </p>
          )}
        </div>

        {/* Door Type */}
        <div className="inspector-field">
          <label className="inspector-label">Door Type</label>
          <select
            className="input-base text-xs"
            value={door.properties.doorType || 'single'}
            onChange={(e) => handleUpdate({ doorType: e.target.value as any })}
          >
            <option value="single">Single Swing</option>
            <option value="double">Double Swing</option>
            <option value="sliding">Sliding</option>
            <option value="folding">Folding</option>
          </select>
        </div>

        {/* Width Presets */}
        <div className="inspector-field">
          <label className="inspector-label">Width ({unitLabel})</label>
          <input
            type="number"
            step="0.5"
            min="2"
            max="10"
            className="input-base font-mono-numbers mb-1.5"
            value={door.properties.width}
            onChange={(e) => handleUpdate({ width: parseFloat(e.target.value) || 3 })}
          />
          <div className="flex flex-wrap gap-1">
            {[2.5, 3, 3.5, 4, 5, 6].map((w) => (
              <button
                key={w}
                className={`btn btn-2xs ${door.properties.width === w ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => handleUpdate({ width: w })}
              >
                {w} {unitLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Offset Along Host Wall */}
        <div className="inspector-field">
          <label className="inspector-label">Offset Along Wall ({unitLabel})</label>
          <input
            type="number"
            step="0.5"
            min="0"
            className="input-base font-mono-numbers"
            value={door.properties.offsetAlongWall.toFixed(1)}
            onChange={(e) => handleUpdate({ offsetAlongWall: parseFloat(e.target.value) || 0 })}
          />
        </div>

        {/* Swing Direction & Orientation */}
        <div className="grid grid-cols-2 gap-2 border-t border-panel-border/60 pt-2">
          <div>
            <label className="inspector-label">Swing Side</label>
            <select
              className="input-base text-xs"
              value={door.properties.swingDirection || 'left'}
              onChange={(e) => handleUpdate({ swingDirection: e.target.value as any })}
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div>
            <label className="inspector-label">Swing Direction</label>
            <select
              className="input-base text-xs"
              value={door.properties.swingOrientation || 'inward'}
              onChange={(e) => handleUpdate({ swingOrientation: e.target.value as any })}
            >
              <option value="inward">Inward</option>
              <option value="outward">Outward</option>
            </select>
          </div>
        </div>

        {/* Host Wall Info */}
        <div className="bg-canvas-bg rounded p-2 border border-panel-border text-2xs text-text-muted">
          <span className="font-medium text-text-secondary block mb-0.5">Host Wall</span>
          Attached to: <code className="font-mono text-brand-400">{door.properties.hostWallId}</code>
        </div>
      </div>
    </div>
  );
};
