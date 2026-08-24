import React from 'react';
import type { ColumnEntity } from '@vastuplan/shared';
import { useProjectStore } from '../../stores/projectStore';

interface ColumnInspectorProps {
  column: ColumnEntity;
  unit: string;
}

const COLUMN_PRESETS = [
  { label: '9 × 9 in', w: 0.75, d: 0.75 },
  { label: '9 × 12 in', w: 0.75, d: 1.0 },
  { label: '12 × 12 in', w: 1.0, d: 1.0 },
  { label: '12 × 18 in', w: 1.0, d: 1.5 },
];

export const ColumnInspector: React.FC<ColumnInspectorProps> = ({ column, unit }) => {
  const { updateEntity } = useProjectStore();
  const unitLabel = unit === 'feet' ? 'ft' : 'm';

  const handlePresetSelect = (w: number, d: number) => {
    updateEntity(column.id, {
      dimensions: { width: w, height: d },
      properties: { ...column.properties, width: w, depth: d },
    });
  };

  return (
    <div className="p-3 animate-slide-in-right">
      <div className="border-b border-panel-border pb-2 mb-3">
        <span className="text-2xs font-semibold tracking-widest uppercase text-brand-400">
          Column Properties
        </span>
        <p className="text-text-primary text-xs font-mono-numbers mt-0.5 truncate">
          ID: {column.id}
        </p>
      </div>

      <div className="space-y-3">
        <div className="inspector-field">
          <label className="inspector-label">Shape</label>
          <div className="grid grid-cols-2 gap-1">
            <button
              className={`btn btn-xs ${
                column.properties.shape !== 'circle' ? 'btn-primary' : 'btn-secondary'
              }`}
              onClick={() => updateEntity(column.id, { properties: { ...column.properties, shape: 'rectangle' } })}
            >
              Rectangular
            </button>
            <button
              className={`btn btn-xs ${
                column.properties.shape === 'circle' ? 'btn-primary' : 'btn-secondary'
              }`}
              onClick={() => updateEntity(column.id, { properties: { ...column.properties, shape: 'circle' } })}
            >
              Circular
            </button>
          </div>
        </div>

        {/* Standard Architectural Presets */}
        <div className="inspector-field">
          <label className="inspector-label">Standard Presets</label>
          <div className="grid grid-cols-2 gap-1">
            {COLUMN_PRESETS.map((p) => (
              <button
                key={p.label}
                className="btn btn-2xs btn-ghost border border-panel-border"
                onClick={() => handlePresetSelect(p.w, p.d)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="inspector-label">Width ({unitLabel})</label>
            <input
              type="number"
              step="0.25"
              min="0.5"
              className="input-base font-mono-numbers"
              value={column.properties.width}
              onChange={(e) => {
                const w = parseFloat(e.target.value) || 0.75;
                updateEntity(column.id, {
                  dimensions: { ...column.dimensions, width: w },
                  properties: { ...column.properties, width: w },
                });
              }}
            />
          </div>
          <div>
            <label className="inspector-label">Depth ({unitLabel})</label>
            <input
              type="number"
              step="0.25"
              min="0.5"
              className="input-base font-mono-numbers"
              value={column.properties.depth}
              onChange={(e) => {
                const d = parseFloat(e.target.value) || 0.75;
                updateEntity(column.id, {
                  dimensions: { ...column.dimensions, height: d },
                  properties: { ...column.properties, depth: d },
                });
              }}
            />
          </div>
        </div>

        <div className="inspector-field border-t border-panel-border/60 pt-2">
          <label className="inspector-label">Rotation</label>
          <div className="grid grid-cols-4 gap-1">
            {[0, 90, 180, 270].map((rot) => (
              <button
                key={rot}
                className={`btn btn-xs ${
                  (column.rotation || 0) === rot ? 'btn-primary' : 'btn-secondary'
                }`}
                onClick={() => updateEntity(column.id, { rotation: rot })}
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
