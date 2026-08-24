import React from 'react';
import type { StaircaseEntity } from '@vastuplan/shared';
import { useProjectStore } from '../../stores/projectStore';

interface StaircaseInspectorProps {
  staircase: StaircaseEntity;
  unit: string;
}

export const StaircaseInspector: React.FC<StaircaseInspectorProps> = ({ staircase, unit }) => {
  const { updateEntity } = useProjectStore();
  const unitLabel = unit === 'feet' ? 'ft' : 'm';

  const handleUpdate = (updates: Partial<StaircaseEntity['properties']>) => {
    updateEntity(staircase.id, {
      properties: { ...staircase.properties, ...updates },
    });
  };

  return (
    <div className="p-3 animate-slide-in-right">
      <div className="border-b border-panel-border pb-2 mb-3">
        <span className="text-2xs font-semibold tracking-widest uppercase text-brand-400">
          Staircase Properties
        </span>
        <p className="text-text-primary text-xs font-mono-numbers mt-0.5 truncate">
          ID: {staircase.id}
        </p>
      </div>

      <div className="space-y-3">
        <div className="inspector-field">
          <label className="inspector-label">Staircase Type</label>
          <select
            className="input-base text-xs"
            value={staircase.properties.staircaseType || 'straight'}
            onChange={(e) => handleUpdate({ staircaseType: e.target.value as any })}
          >
            <option value="straight">Straight Flight</option>
            <option value="l-shaped">L-Shaped Flight</option>
            <option value="u-shaped">U-Shaped Dog-Legged</option>
            <option value="spiral">Spiral</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="inspector-label">Width ({unitLabel})</label>
            <input
              type="number"
              step="0.5"
              min="2"
              className="input-base font-mono-numbers"
              value={staircase.dimensions.width}
              onChange={(e) => {
                const w = parseFloat(e.target.value) || 4;
                updateEntity(staircase.id, {
                  dimensions: { ...staircase.dimensions, width: w },
                  properties: { ...staircase.properties, width: w },
                });
              }}
            />
          </div>
          <div>
            <label className="inspector-label">Length ({unitLabel})</label>
            <input
              type="number"
              step="0.5"
              min="4"
              className="input-base font-mono-numbers"
              value={staircase.dimensions.height}
              onChange={(e) => {
                const h = parseFloat(e.target.value) || 12;
                updateEntity(staircase.id, {
                  dimensions: { ...staircase.dimensions, height: h },
                });
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="inspector-label">Step Count</label>
            <input
              type="number"
              step="1"
              min="4"
              max="30"
              className="input-base font-mono-numbers"
              value={staircase.properties.steps || 18}
              onChange={(e) => handleUpdate({ steps: parseInt(e.target.value) || 18 })}
            />
          </div>
          <div>
            <label className="inspector-label">Direction</label>
            <select
              className="input-base text-xs"
              value={staircase.properties.direction || 'up'}
              onChange={(e) => handleUpdate({ direction: e.target.value as any })}
            >
              <option value="up">Climb Up ↑</option>
              <option value="down">Climb Down ↓</option>
            </select>
          </div>
        </div>

        <div className="inspector-field border-t border-panel-border/60 pt-2">
          <label className="inspector-label">Rotation</label>
          <div className="grid grid-cols-4 gap-1">
            {[0, 90, 180, 270].map((rot) => (
              <button
                key={rot}
                className={`btn btn-xs ${
                  (staircase.rotation || 0) === rot ? 'btn-primary' : 'btn-secondary'
                }`}
                onClick={() => updateEntity(staircase.id, { rotation: rot })}
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
