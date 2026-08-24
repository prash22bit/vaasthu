import React from 'react';
import type { WindowEntity } from '@vastuplan/shared';
import { useProjectStore } from '../../stores/projectStore';
import { validateWallOccupancy, calculateHostedPosition } from '../../utils/architectural';

interface WindowInspectorProps {
  windowEntity: WindowEntity;
  unit: string;
}

export const WindowInspector: React.FC<WindowInspectorProps> = ({ windowEntity, unit }) => {
  const { updateEntity, currentProject } = useProjectStore();
  const unitLabel = unit === 'feet' ? 'ft' : 'm';

  const floor = currentProject?.floors[0];
  const hostWall = floor?.entities.find((e) => e.id === windowEntity.properties.hostWallId);

  const handleUpdate = (updates: Partial<WindowEntity['properties']>) => {
    const updatedProps = { ...windowEntity.properties, ...updates };

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
        windowEntity.id
      );

      if (!val.valid) {
        alert(val.reason || 'Invalid window placement on wall');
        return;
      }

      const { position, rotation } = calculateHostedPosition(
        (hostWall.properties as unknown as { startX: number; startY: number; endX: number; endY: number }),
        updatedProps.offsetAlongWall
      );

      updateEntity(windowEntity.id, {
        position,
        rotation,
        dimensions: { ...windowEntity.dimensions, width: updatedProps.width },
        properties: updatedProps,
      });
      return;
    }

    updateEntity(windowEntity.id, { properties: updatedProps });
  };

  return (
    <div className="p-3 animate-slide-in-right">
      <div className="border-b border-panel-border pb-2 mb-3">
        <span className="text-2xs font-semibold tracking-widest uppercase text-brand-400">
          Window Properties
        </span>
        <p className="text-text-primary text-xs font-mono-numbers mt-0.5 truncate">
          ID: {windowEntity.id}
        </p>
      </div>

      <div className="space-y-3">
        <div className="inspector-field">
          <label className="inspector-label">Window Type</label>
          <select
            className="input-base text-xs"
            value={windowEntity.properties.windowType || 'sliding'}
            onChange={(e) => handleUpdate({ windowType: e.target.value as any })}
          >
            <option value="sliding">Sliding</option>
            <option value="single">Single Hung</option>
            <option value="double">Double Hung</option>
            <option value="bay">Bay Window</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="inspector-label">Width ({unitLabel})</label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="12"
              className="input-base font-mono-numbers"
              value={windowEntity.properties.width}
              onChange={(e) => handleUpdate({ width: parseFloat(e.target.value) || 4 })}
            />
          </div>
          <div>
            <label className="inspector-label">Height ({unitLabel})</label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="8"
              className="input-base font-mono-numbers"
              value={windowEntity.properties.height || 4}
              onChange={(e) => handleUpdate({ height: parseFloat(e.target.value) || 4 })}
            />
          </div>
        </div>

        <div className="inspector-field">
          <label className="inspector-label">Offset Along Wall ({unitLabel})</label>
          <input
            type="number"
            step="0.5"
            min="0"
            className="input-base font-mono-numbers"
            value={windowEntity.properties.offsetAlongWall.toFixed(1)}
            onChange={(e) => handleUpdate({ offsetAlongWall: parseFloat(e.target.value) || 0 })}
          />
        </div>

        <div className="bg-canvas-bg rounded p-2 border border-panel-border text-2xs text-text-muted">
          <span className="font-medium text-text-secondary block mb-0.5">Host Wall</span>
          Attached to: <code className="font-mono text-brand-400">{windowEntity.properties.hostWallId}</code>
        </div>
      </div>
    </div>
  );
};
