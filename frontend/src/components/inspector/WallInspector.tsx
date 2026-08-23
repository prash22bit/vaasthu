import React from 'react';
import type { WallEntity } from '@vastuplan/shared';
import { useProjectStore } from '../../stores/projectStore';
import { useHistoryStore, createHistoryAction } from '../../stores/historyStore';
import { distanceBetweenPoints, calculateAngle } from '../../utils/geometry';

interface WallInspectorProps {
  wall: WallEntity;
  unit: string;
}

export const WallInspector: React.FC<WallInspectorProps> = ({ wall, unit }) => {
  const { updateEntity, currentProject } = useProjectStore();
  const pushHistory = useHistoryStore((s) => s.push);

  const unitLabel = unit === 'feet' ? 'ft' : 'm';
  const thicknessUnitLabel = unit === 'feet' ? 'in' : 'cm';
  // 1 ft = 12 in, 1 m = 100 cm
  const thicknessFactor = unit === 'feet' ? 12 : 100;

  const p1 = { x: wall.properties.startX, y: wall.properties.startY };
  const p2 = { x: wall.properties.endX, y: wall.properties.endY };
  const length = distanceBetweenPoints(p1, p2);
  const angle = calculateAngle(p1, p2);
  const thicknessInDisplayUnit = (wall.properties.thickness * thicknessFactor).toFixed(1);

  const handleThicknessChange = (newThicknessWorld: number) => {
    const before = [...(currentProject?.floors[0]?.entities || [])];
    updateEntity(wall.id, {
      dimensions: { width: length, height: newThicknessWorld },
      properties: { ...wall.properties, thickness: newThicknessWorld },
    });
    const after = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];
    pushHistory(createHistoryAction('UPDATE_ENTITY', before, after, 'Update wall thickness'));
  };

  const handleStartPosChange = (field: 'startX' | 'startY', value: number) => {
    const newProps = { ...wall.properties, [field]: value };
    const newLength = distanceBetweenPoints(
      { x: newProps.startX, y: newProps.startY },
      { x: newProps.endX, y: newProps.endY }
    );
    const newAngle = calculateAngle(
      { x: newProps.startX, y: newProps.startY },
      { x: newProps.endX, y: newProps.endY }
    );

    updateEntity(wall.id, {
      position: { x: newProps.startX, y: newProps.startY },
      dimensions: { width: newLength, height: newProps.thickness },
      rotation: newAngle,
      properties: newProps,
    });
  };

  const handleEndPosChange = (field: 'endX' | 'endY', value: number) => {
    const newProps = { ...wall.properties, [field]: value };
    const newLength = distanceBetweenPoints(
      { x: newProps.startX, y: newProps.startY },
      { x: newProps.endX, y: newProps.endY }
    );
    const newAngle = calculateAngle(
      { x: newProps.startX, y: newProps.startY },
      { x: newProps.endX, y: newProps.endY }
    );

    updateEntity(wall.id, {
      dimensions: { width: newLength, height: newProps.thickness },
      rotation: newAngle,
      properties: newProps,
    });
  };

  return (
    <div className="p-3 animate-slide-in-right">
      <div className="border-b border-panel-border pb-2 mb-3">
        <span className="text-2xs font-semibold tracking-widest uppercase text-brand-400">
          Wall Properties
        </span>
        <p className="text-text-primary text-xs font-mono-numbers mt-0.5 truncate">
          ID: {wall.id}
        </p>
      </div>

      {/* Geometry */}
      <div className="space-y-3">
        <div className="inspector-field">
          <label className="inspector-label">Length</label>
          <div className="input-base font-mono-numbers bg-canvas-bg/50 cursor-default">
            {length.toFixed(2)} {unitLabel}
          </div>
        </div>

        <div className="inspector-field">
          <label className="inspector-label">Thickness</label>
          <div className="grid grid-cols-3 gap-1 mb-1.5">
            {[
              { label: '4.5 in', val: 4.5 / thicknessFactor },
              { label: '6 in', val: 6.0 / thicknessFactor },
              { label: '9 in', val: 9.0 / thicknessFactor },
            ].map((preset) => (
              <button
                key={preset.label}
                className={`btn btn-xs ${
                  Math.abs(wall.properties.thickness - preset.val) < 0.01
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
                onClick={() => handleThicknessChange(preset.val)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="number"
              step="any"
              className="input-base pr-8 font-mono-numbers"
              value={thicknessInDisplayUnit}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) {
                  handleThicknessChange(val / thicknessFactor);
                }
              }}
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted text-2xs">
              {thicknessUnitLabel}
            </span>
          </div>
        </div>

        <div className="inspector-field">
          <label className="inspector-label">Angle</label>
          <div className="input-base font-mono-numbers bg-canvas-bg/50 cursor-default">
            {angle.toFixed(1)}°
          </div>
        </div>

        {/* Start Point */}
        <div className="border-t border-panel-border/60 pt-2 mt-2">
          <span className="text-2xs font-medium text-text-muted block mb-1">Start Point</span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-2xs text-text-muted">X ({unitLabel})</label>
              <input
                type="number"
                step="any"
                className="input-base font-mono-numbers"
                value={wall.properties.startX.toFixed(2)}
                onChange={(e) => handleStartPosChange('startX', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-2xs text-text-muted">Y ({unitLabel})</label>
              <input
                type="number"
                step="any"
                className="input-base font-mono-numbers"
                value={wall.properties.startY.toFixed(2)}
                onChange={(e) => handleStartPosChange('startY', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        {/* End Point */}
        <div className="border-t border-panel-border/60 pt-2">
          <span className="text-2xs font-medium text-text-muted block mb-1">End Point</span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-2xs text-text-muted">X ({unitLabel})</label>
              <input
                type="number"
                step="any"
                className="input-base font-mono-numbers"
                value={wall.properties.endX.toFixed(2)}
                onChange={(e) => handleEndPosChange('endX', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-2xs text-text-muted">Y ({unitLabel})</label>
              <input
                type="number"
                step="any"
                className="input-base font-mono-numbers"
                value={wall.properties.endY.toFixed(2)}
                onChange={(e) => handleEndPosChange('endY', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
