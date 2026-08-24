import React from 'react';
import type { CompoundWallEntity, CompoundWallSegment } from '@vastuplan/shared';
import { useProjectStore } from '../../stores/projectStore';
import { useHistoryStore, createHistoryAction } from '../../stores/historyStore';
import { distanceBetweenPoints } from '../../utils/geometry';
import { Plus, Trash2 } from 'lucide-react';

interface CompoundWallInspectorProps {
  compoundWall: CompoundWallEntity;
  unit: string;
}

export const CompoundWallInspector: React.FC<CompoundWallInspectorProps> = ({
  compoundWall,
  unit,
}) => {
  const { updateEntity, currentProject } = useProjectStore();
  const pushHistory = useHistoryStore((s) => s.push);
  const unitLabel = unit === 'feet' ? 'ft' : 'm';

  const segments = compoundWall.properties.segments || [];

  const handleThicknessChange = (thickness: number) => {
    updateEntity(compoundWall.id, {
      properties: { ...compoundWall.properties, thickness },
    });
  };

  const handleAddSegment = () => {
    const lastSeg = segments[segments.length - 1] || { startX: 0, startY: 0, endX: 40, endY: 0 };
    const newSeg: CompoundWallSegment = {
      id: `seg_${Date.now()}`,
      startX: lastSeg.endX,
      startY: lastSeg.endY,
      endX: lastSeg.endX + 20,
      endY: lastSeg.endY,
    };

    const before = [...(currentProject?.floors[0]?.entities || [])];
    const updatedSegments = [...segments, newSeg];
    updateEntity(compoundWall.id, {
      properties: { ...compoundWall.properties, segments: updatedSegments },
    });
    const after = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];
    pushHistory(createHistoryAction('UPDATE_ENTITY', before, after, 'Add compound wall segment'));
  };

  const handleDeleteSegment = (segId: string) => {
    if (segments.length <= 1) {
      alert('Compound wall must have at least one segment');
      return;
    }
    const before = [...(currentProject?.floors[0]?.entities || [])];
    const updatedSegments = segments.filter((s) => s.id !== segId);
    updateEntity(compoundWall.id, {
      properties: { ...compoundWall.properties, segments: updatedSegments },
    });
    const after = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];
    pushHistory(createHistoryAction('UPDATE_ENTITY', before, after, 'Delete compound wall segment'));
  };

  return (
    <div className="p-3 animate-slide-in-right">
      <div className="border-b border-panel-border pb-2 mb-3">
        <span className="text-2xs font-semibold tracking-widest uppercase text-brand-400">
          Compound Boundary Wall
        </span>
        <p className="text-text-primary text-xs font-mono-numbers mt-0.5 truncate">
          ID: {compoundWall.id}
        </p>
      </div>

      <div className="space-y-3">
        <div className="inspector-field">
          <label className="inspector-label">Wall Thickness ({unitLabel})</label>
          <input
            type="number"
            step="0.25"
            min="0.375"
            className="input-base font-mono-numbers"
            value={compoundWall.properties.thickness || 0.75}
            onChange={(e) => handleThicknessChange(parseFloat(e.target.value) || 0.75)}
          />
        </div>

        {/* Segments List */}
        <div className="border-t border-panel-border/60 pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xs font-medium text-text-muted">
              Boundary Segments ({segments.length})
            </span>
            <button
              className="btn btn-2xs btn-secondary gap-1"
              onClick={handleAddSegment}
            >
              <Plus size={11} />
              <span>Add Segment</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {segments.map((seg, idx) => {
              const len = distanceBetweenPoints(
                { x: seg.startX, y: seg.startY },
                { x: seg.endX, y: seg.endY }
              );
              return (
                <div
                  key={seg.id || `seg_${idx}`}
                  className="bg-canvas-bg rounded p-2 border border-panel-border flex items-center justify-between text-2xs"
                >
                  <div>
                    <span className="font-semibold text-text-primary block">
                      Segment {idx + 1} ({len.toFixed(1)} {unitLabel})
                    </span>
                    <span className="text-text-muted font-mono-numbers">
                      ({seg.startX.toFixed(0)},{seg.startY.toFixed(0)}) → ({seg.endX.toFixed(0)},{seg.endY.toFixed(0)})
                    </span>
                  </div>
                  <button
                    className="p-1 text-text-muted hover:text-error hover:bg-surface-raised rounded transition-colors"
                    onClick={() => handleDeleteSegment(seg.id)}
                    title="Delete Segment"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
