import React, { useEffect } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import { useKeyboard } from '../../hooks/useKeyboard';
import { checkHealth } from '../../api/projectApi';
import { Header } from './Header';
import { Toolbar } from './Toolbar';
import { InspectorPanel } from './InspectorPanel';
import { StatusBar } from '../ui/StatusBar';
import { ProjectList } from './ProjectList';
import { NewProjectModal } from '../modals/NewProjectModal';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';
import { WorkspacePage } from '../../pages/WorkspacePage';
import { LandingPage } from '../../pages/LandingPage';
import { calculateArea } from '../../utils/units';
import { useCanvasStore } from '../../stores/canvasStore';
import { VastuPanel } from '../../features/vastu/components/VastuPanel';
import { AIAssistantPanel } from '../../features/ai/components/AIAssistantPanel';

export const AppShell: React.FC = () => {
  const {
    isNewProjectModalOpen,
    isDeleteConfirmOpen,
    isProjectListOpen,
    setProjectListOpen,
    setBackendConnected,
    rightPanelContext,
  } = useUIStore();

  const { currentProject } = useProjectStore();
  const zoom = useCanvasStore((s) => s.zoom);

  // Register global keyboard shortcuts
  useKeyboard();

  // Check backend health on mount
  useEffect(() => {
    checkHealth().then((result) => {
      setBackendConnected(result.connected);
    });
  }, [setBackendConnected]);

  // Close project list when clicking outside
  useEffect(() => {
    if (!isProjectListOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-project-list]') && !target.closest('#header-open-project-btn')) {
        setProjectListOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isProjectListOpen, setProjectListOpen]);

  const plotInfo = currentProject
    ? {
        width: currentProject.plot.width,
        length: currentProject.plot.length,
        unit: currentProject.plot.unit,
        facing: currentProject.plot.facing,
        area: calculateArea(currentProject.plot.width, currentProject.plot.length),
      }
    : undefined;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-canvas-bg">
      {/* ── Header ── */}
      <Header />

      {/* ── Project list dropdown ── */}
      {isProjectListOpen && (
        <div data-project-list>
          <ProjectList />
        </div>
      )}

      {/* ── Main workspace ── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left toolbar */}
        <Toolbar />

        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {currentProject ? (
            <WorkspacePage project={currentProject} />
          ) : (
            <LandingPage />
          )}
        </div>

        {/* Right panel: Contextual (Inspector / Vastu / AI Assistant) */}
        {currentProject && rightPanelContext === 'ai' ? (
          <AIAssistantPanel project={currentProject} floorIndex={0} />
        ) : currentProject && rightPanelContext === 'vastu' ? (
          <VastuPanel project={currentProject} floorIndex={0} />
        ) : currentProject ? (
          <InspectorPanel />
        ) : null}
      </div>

      {/* ── Status bar ── */}
      {currentProject && <StatusBar plotInfo={plotInfo} zoom={zoom} />}

      {/* ── Modals ── */}
      {isNewProjectModalOpen && <NewProjectModal />}
      {isDeleteConfirmOpen && <DeleteConfirmModal />}
    </div>
  );
};
