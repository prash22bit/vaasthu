import React from 'react';
import type { GateEntity } from '@vastuplan/shared';
import { useProjectStore } from '../../stores/projectStore';
import { calculateHostedPosition } from '../../utils/architectural';

interface GateInspectorProps {
  gate: GateEntity;
  unit: string;
}

export const GateInspector: React.FC<GateInspectorProps> = ({ gate, unit }) => {
  const { updateEntity, currentProject } = useProjectStore();
  const unitLabel = unit === 'feet' ? 'ft' : 'm';

  const floor = currentProject?.floors[0];
  const hostCW = floor?.entities.find((e) => e.id === gate.properties.hostCompoundWallId);

  const handleUpdate = (updates: Partial<GateEntity['properties']>) => {
    const updatedProps = { ...gate.properties, ...updates };

    if (hostCW && hostCW.type === 'compound-wall') {
      const segments = (hostCW.properties as { segments?: any[] }).segments || [];
      const seg = segments.find((s) => s.id === updatedProps.hostSegmentId) || segments[0];

      if (seg) {
        const { position, rotation } = calculateHostedPosition(seg, updatedProps.offsetAlongWall);
        updateEntity(gate.id, {
          position,
          rotation,
          dimensions: { ...gate.dimensions, width: updatedProps.width },
          properties: updatedProps,
        });
        return;
      }
    }

    updateEntity(gate.id, { properties: updatedProps });
  };

  return (
    <div className="p-3 animate-slide-in-right">
      <div className="border-b border-panel-border pb-2 mb-3">
        <span className="text-2xs font-semibold tracking-widest uppercase text-brand-400">
          Main Gate Properties
        </span>
        <p className="text-text-primary text-xs font-mono-numbers mt-0.5 truncate">
          ID: {gate.id}
        </p>
      </div>

      <div className="space-y-3">
        <div className="inspector-field">
          <label className="inspector-label">Gate Type</label>
          <select
            className="input-base text-xs"
            value={gate.properties.gateType || 'double'}
            onChange={(e) => handleUpdate({ gateType: e.target.value as any })}
          >
            <option value="double">Double Leaf Gate</option>
            <option value="single">Single Leaf Gate</option>
            <option value="sliding">Sliding Gate</option>
          </select>
        </div>

        <div className="inspector-field">
          <label className="inspector-label">Gate Width ({unitLabel})</label>
          <input
            type="number"
            step="1"
            min="4"
            max="20"
            className="input-base font-mono-numbers mb-1.5"
            value={gate.properties.width}
            onChange={(e) => handleUpdate({ width: parseFloat(e.target.value) || 8 })}
          />
          <div className="flex flex-wrap gap-1">
            {[6, 8, 10, 12, 14, 16].map((w) => (
              <button
                key={w}
                className={`btn btn-2xs ${gate.properties.width === w ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => handleUpdate({ width: w })}
              >
                {w} {unitLabel}
              </button>
            ))}
          </div>
        </div>

        <div className="inspector-field">
          <label className="inspector-label">Offset Along Boundary ({unitLabel})</label>
          <input
            type="number"
            step="0.5"
            min="0"
            className="input-base font-mono-numbers"
            value={gate.properties.offsetAlongWall.toFixed(1)}
            onChange={(e) => handleUpdate({ offsetAlongWall: parseFloat(e.target.value) || 0 })}
          />
        </div>

        <div className="bg-canvas-bg rounded p-2 border border-panel-border text-2xs text-text-muted">
          <span className="font-medium text-text-secondary block mb-0.5">Host Boundary</span>
          Attached to: <code className="font-mono text-brand-400">{gate.properties.hostCompoundWallId}</code>
          {gate.properties.hostSegmentId && (
            <span className="block mt-0.5">Segment: <code className="font-mono text-text-secondary">{gate.properties.hostSegmentId}</code></span>
          )}
        </div>
      </div>
    </div>
  );
};
