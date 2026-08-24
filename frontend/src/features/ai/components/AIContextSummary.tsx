import React from 'react';
import type { Project } from '@vastuplan/shared';
import { useVastuStore } from '../../vastu/vastuStore';
import { useCanvasStore } from '../../../stores/canvasStore';
import { Compass, Box, CheckSquare } from 'lucide-react';

interface AIContextSummaryProps {
  project: Project;
  floorIndex?: number;
}

export const AIContextSummary: React.FC<AIContextSummaryProps> = ({
  project,
  floorIndex = 0,
}) => {
  const vastuAnalysis = useVastuStore((s) => s.vastuAnalysis);
  const selectedEntityIds = useCanvasStore((s) => s.selectedEntityIds);

  const floor = project.floors[floorIndex];
  const entities = floor?.entities || [];
  const rooms = entities.filter((e) => e.type === 'room');
  const walls = entities.filter((e) => e.type === 'wall');

  const selectedEntity =
    selectedEntityIds.length === 1
      ? entities.find((e) => e.id === selectedEntityIds[0])
      : null;

  return (
    <div className="p-2.5 bg-surface/50 border-b border-panel-border space-y-1.5 shrink-0 text-3xs">
      {/* ── Plot Info ── */}
      <div className="flex items-center justify-between text-text-secondary">
        <div className="flex items-center gap-1 font-medium text-text-primary">
          <Compass size={11} className="text-brand-400" />
          <span>
            {project.plot.width} × {project.plot.length} {project.plot.unit}
          </span>
          <span className="text-text-muted capitalize">({project.plot.facing} facing)</span>
        </div>

        {vastuAnalysis ? (
          <span className="font-mono font-semibold text-brand-400">
            🔯 {vastuAnalysis.overallScore}/100
          </span>
        ) : (
          <span className="text-text-muted">🔯 No Vastu</span>
        )}
      </div>

      {/* ── Floor Counts & Selection ── */}
      <div className="flex items-center justify-between text-text-muted">
        <div className="flex items-center gap-2">
          <span>{rooms.length} rooms</span>
          <span>•</span>
          <span>{walls.length} walls</span>
          <span>•</span>
          <span>{entities.length} total</span>
        </div>

        {selectedEntity && (
          <div className="flex items-center gap-1 text-amber-400 font-medium truncate max-w-[110px]">
            <CheckSquare size={10} />
            <span className="truncate">
              {(selectedEntity.properties?.name as string) || selectedEntity.type}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
