import React from 'react';
import type { Project } from '@vastuplan/shared';
import { DesignCanvas } from '../components/canvas/DesignCanvas';
import { calculateArea } from '../utils/units';
import { useCanvasStore } from '../stores/canvasStore';
import { StatusBar } from '../components/ui/StatusBar';

interface WorkspacePageProps {
  project: Project;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({ project }) => {
  const zoom = useCanvasStore((s) => s.zoom);
  const area = calculateArea(project.plot.width, project.plot.length);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Main workspace area */}
      <div className="flex-1 flex overflow-hidden">
        <DesignCanvas project={project} />
      </div>

      {/* Status bar */}
      <StatusBar
        plotInfo={{
          width: project.plot.width,
          length: project.plot.length,
          unit: project.plot.unit,
          facing: project.plot.facing,
          area,
        }}
        zoom={zoom}
      />
    </div>
  );
};
