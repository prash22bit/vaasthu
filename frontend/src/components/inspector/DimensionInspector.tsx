import React from 'react';
import type { DimensionEntity } from '@vastuplan/shared';
import { useProjectStore } from '../../stores/projectStore';
import { distanceBetweenPoints, calculateAngle } from '../../utils/geometry';

interface DimensionInspectorProps {
  dimension: DimensionEntity;
  unit: string;
}

export const DimensionInspector: React.FC<DimensionInspectorProps> = ({ dimension, unit }) => {
  const { updateEntity } = useProjectStore();
  const unitLabel = unit === 'feet' ? 'ft' : 'm';

  const p1 = { x: dimension.properties.startX, y: dimension.properties.startY };
  const p2 = { x: dimension.properties.endX, y: dimension.properties.endY };
  const length = distanceBetweenPoints(p1, p2);
  const angle = calculateAngle(p1, p2);

  const handleOffsetChange = (offset: number) => {
    updateEntity(dimension.id, {
      properties: { ...dimension.properties, offset },
    });
  };

  return (
    <div className="p-3 animate-slide-in-right">
      <div className="border-b border-panel-border pb-2 mb-3">
        <span className="text-2xs font-semibold tracking-widest uppercase text-brand-400">
          Dimension Properties
        </span>
        <p className="text-text-primary text-xs font-mono-numbers mt-0.5 truncate">
          ID: {dimension.id}
        </p>
      </div>

      <div className="space-y-3">
        <div className="inspector-field">
          <label className="inspector-label">Measured Distance</label>
          <div className="input-base font-mono-numbers bg-canvas-bg/50 cursor-default text-brand-400 font-semibold">
            {length.toFixed(2)} {unitLabel}
          </div>
        </div>

        <div className="inspector-field">
          <label className="inspector-label">Angle</label>
          <div className="input-base font-mono-numbers bg-canvas-bg/50 cursor-default">
            {angle.toFixed(1)}°
          </div>
        </div>

        <div className="inspector-field">
          <label className="inspector-label">Line Offset ({unitLabel})</label>
          <input
            type="number"
            step="0.5"
            className="input-base font-mono-numbers"
            value={(dimension.properties.offset || 1.5).toFixed(1)}
            onChange={(e) => handleOffsetChange(parseFloat(e.target.value) || 1)}
          />
        </div>

        {dimension.properties.associatedEntityId && (
          <div className="bg-canvas-bg rounded p-2 border border-panel-border text-2xs text-text-muted">
            <span className="font-medium text-text-secondary block mb-0.5">Associative Measurement</span>
            Linked to object: <code className="font-mono">{dimension.properties.associatedEntityId}</code>
          </div>
        )}
      </div>
    </div>
  );
};
