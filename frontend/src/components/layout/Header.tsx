import React from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { useHistory } from '../../hooks/useHistory';
import { useCanvasStore } from '../../stores/canvasStore';
import {
  Undo2, Redo2, Save, FolderOpen, Plus, ChevronDown,
  Loader2, Wifi, WifiOff
} from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

export const Header: React.FC = () => {
  const { currentProject, saveStatus, saveCurrentProject, error } = useProjectStore();
  const { undo, redo, canUndo, canRedo } = useHistory();
  const { openNewProjectModal, toggleProjectList, isProjectListOpen, backendConnected } = useUIStore();
  const zoom = useCanvasStore((s) => s.zoom);

  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    if (isSaving || !currentProject) return;
    setIsSaving(true);
    try {
      await saveCurrentProject();
    } finally {
      setIsSaving(false);
    }
  };

  const saveLabel = {
    saved: 'Saved',
    saving: 'Saving…',
    unsaved: 'Save',
    error: 'Retry Save',
  }[saveStatus];

  const saveColor = {
    saved: 'text-success',
    saving: 'text-text-muted',
    unsaved: 'text-warning',
    error: 'text-error',
  }[saveStatus];

  return (
    <header className="h-11 bg-panel-header border-b border-panel-border flex items-center px-3 gap-2 shrink-0 z-20">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-3 no-select">
        <div className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center">
          <span className="text-white font-bold text-xs">V</span>
        </div>
        <span className="text-text-primary font-semibold text-sm tracking-tight">VastuPlan</span>
        <span className="text-text-muted text-2xs font-medium bg-surface px-1.5 py-0.5 rounded">
          Phase 1
        </span>
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-panel-border mx-1" />

      {/* Project menu */}
      <div className="flex items-center gap-1">
        <Tooltip content="New Project (N)" side="bottom">
          <button
            id="header-new-project-btn"
            className="btn btn-ghost btn-sm gap-1"
            onClick={openNewProjectModal}
          >
            <Plus size={13} />
            <span className="text-xs">New</span>
          </button>
        </Tooltip>

        <Tooltip content="Open Project" side="bottom">
          <button
            id="header-open-project-btn"
            className={`btn btn-sm gap-1 ${isProjectListOpen ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={toggleProjectList}
          >
            <FolderOpen size={13} />
            <span className="text-xs">Projects</span>
            <ChevronDown size={11} className={`transition-transform ${isProjectListOpen ? 'rotate-180' : ''}`} />
          </button>
        </Tooltip>
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-panel-border mx-1" />

      {/* Project name */}
      {currentProject && (
        <span className="text-text-primary text-sm font-medium truncate max-w-[200px]">
          {currentProject.name}
        </span>
      )}

      <div className="flex-1" />

      {/* Error banner */}
      {error && (
        <span className="text-error text-2xs bg-error/10 px-2 py-1 rounded truncate max-w-[250px]">
          {error}
        </span>
      )}

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5">
        <Tooltip content="Undo (⌘Z)" side="bottom">
          <button
            id="header-undo-btn"
            className="btn btn-ghost btn-icon"
            disabled={!canUndo}
            onClick={undo}
          >
            <Undo2 size={15} />
          </button>
        </Tooltip>
        <Tooltip content="Redo (⌘⇧Z)" side="bottom">
          <button
            id="header-redo-btn"
            className="btn btn-ghost btn-icon"
            disabled={!canRedo}
            onClick={redo}
          >
            <Redo2 size={15} />
          </button>
        </Tooltip>
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-panel-border mx-1" />

      {/* Save button */}
      <Tooltip content="Save Project (⌘S)" side="bottom">
        <button
          id="header-save-btn"
          className={`btn btn-sm gap-1.5 ${saveStatus === 'error' ? 'btn-danger' : 'btn-secondary'}`}
          disabled={!currentProject || saveStatus === 'saving' || isSaving}
          onClick={handleSave}
        >
          {saveStatus === 'saving' || isSaving ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Save size={13} />
          )}
          <span className={`text-xs ${saveColor}`}>{saveLabel}</span>
        </button>
      </Tooltip>

      {/* Separator */}
      <div className="w-px h-5 bg-panel-border mx-1" />

      {/* Connection status */}
      <Tooltip content={backendConnected ? 'Backend connected' : 'Backend disconnected'} side="bottom">
        <div className="flex items-center">
          {backendConnected ? (
            <Wifi size={13} className="text-success" />
          ) : backendConnected === false ? (
            <WifiOff size={13} className="text-error" />
          ) : (
            <Wifi size={13} className="text-text-muted" />
          )}
        </div>
      </Tooltip>
    </header>
  );
};
