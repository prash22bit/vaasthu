import React from 'react';
import type { GardenEntity } from '@vastuplan/shared';
import { useProjectStore } from '../../stores/projectStore';

interface GardenInspectorProps {
  garden: GardenEntity;
  unit: string;
}

export const GardenInspector: React.FC<GardenInspectorProps> = ({ garden, unit }) => {
  const { updateEntity } = useProjectStore();
  const unitLabel = unit === 'feet' ? 'ft' : 'm';

  const handleUpdate = (updates: Partial<GardenEntity['properties']>) => {
    updateEntity(garden.id, {
      properties: { ...garden.properties, ...updates },
    });
  };

  return (
    <div className="p-3 animate-slide-in-right">
      <div className="border-b border-panel-border pb-2 mb-3">
        <span className="text-2xs font-semibold tracking-widest uppercase text-brand-400">
          Garden Properties
        </span>
        <p className="text-text-primary text-xs font-mono-numbers mt-0.5 truncate">
          ID: {garden.id}
        </p>
      </div>

      <div className="space-y-3">
        <div className="inspector-field">
          <label className="inspector-label">Space Type</label>
          <select
            className="input-base text-xs"
            value={garden.properties.gardenType || 'garden'}
            onChange={(e) => handleUpdate({ gardenType: e.target.value as any })}
          >
            <option value="garden">Lawn / Garden</option>
            <option value="courtyard">Courtyard / Bramhasthan</option>
            <option value="open-space">Open Space</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="inspector-label">Width ({unitLabel})</label>
            <input
              type="number"
              step="1"
              min="4"
              className="input-base font-mono-numbers"
              value={garden.dimensions.width}
              onChange={(e) => {
                const w = parseFloat(e.target.value) || 10;
                updateEntity(garden.id, {
                  dimensions: { ...garden.dimensions, width: w },
                });
              }}
            />
          </div>
          <div>
            <label className="inspector-label">Height ({unitLabel})</label>
            <input
              type="number"
              step="1"
              min="4"
              className="input-base font-mono-numbers"
              value={garden.dimensions.height}
              onChange={(e) => {
                const h = parseFloat(e.target.value) || 15;
                updateEntity(garden.id, {
                  dimensions: { ...garden.dimensions, height: h },
                });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
