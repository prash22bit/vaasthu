import React, { useEffect } from 'react';
import { Folder, Plus, Trash2, Check, Loader2 } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { calculateArea, formatArea } from '../../utils/units';
import { FACING_LABELS } from '@vastuplan/shared';

export const ProjectList: React.FC = () => {
  const {
    projects,
    currentProject,
    loadProjects,
    loadProject,
    loadingProjects,
  } = useProjectStore();

  const { openNewProjectModal, openDeleteConfirm, setProjectListOpen } = useUIStore();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleSelectProject = async (id: string) => {
    await loadProject(id);
    setProjectListOpen(false);
  };

  return (
    <div className="absolute top-11 left-0 right-0 z-30 flex justify-center pointer-events-none">
      <div
        className="pointer-events-auto bg-panel-bg border border-panel-border rounded-lg shadow-modal
                   w-80 max-h-[70vh] overflow-hidden flex flex-col animate-fade-in mt-1"
        style={{ marginLeft: '56px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-panel-border">
          <div className="flex items-center gap-2">
            <Folder size={13} className="text-text-muted" />
            <span className="text-text-secondary text-xs font-medium">Projects</span>
            {!loadingProjects && (
              <span className="text-text-muted text-2xs">({projects.length})</span>
            )}
          </div>
          <button
            id="project-list-new-btn"
            className="btn btn-primary btn-sm gap-1"
            onClick={() => {
              setProjectListOpen(false);
              openNewProjectModal();
            }}
          >
            <Plus size={11} />
            <span>New</span>
          </button>
        </div>

        {/* Project list */}
        <div className="overflow-y-auto flex-1">
          {loadingProjects ? (
            <div className="flex items-center justify-center py-8 gap-2 text-text-muted">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-xs">Loading projects…</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4 gap-2">
              <Folder size={24} className="text-text-muted opacity-40" />
              <p className="text-text-muted text-xs">No projects yet</p>
              <button
                className="btn btn-primary btn-sm mt-1"
                onClick={() => {
                  setProjectListOpen(false);
                  openNewProjectModal();
                }}
              >
                Create your first project
              </button>
            </div>
          ) : (
            projects.map((project) => {
              const area = calculateArea(project.plot.width, project.plot.length);
              const isActive = currentProject?.id === project.id;

              return (
                <div
                  key={project.id}
                  className={`
                    flex items-center gap-2 px-3 py-2.5 border-b border-panel-border/50
                    cursor-pointer transition-colors group
                    ${isActive ? 'bg-brand-600/10' : 'hover:bg-surface-raised'}
                  `}
                  onClick={() => handleSelectProject(project.id)}
                >
                  {/* Active indicator */}
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-brand-500' : 'bg-transparent'}`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-medium truncate ${isActive ? 'text-text-primary' : 'text-text-secondary'}`}>
                        {project.name}
                      </span>
                      {isActive && <Check size={10} className="text-brand-500 flex-shrink-0" />}
                    </div>
                    <div className="text-2xs text-text-muted mt-0.5">
                      {project.plot.width} × {project.plot.length} {project.plot.unit === 'feet' ? 'ft' : 'm'}
                      {' · '}
                      {FACING_LABELS[project.plot.facing]}
                      {' · '}
                      {area.toFixed(0)} {project.plot.unit === 'feet' ? 'sq.ft' : 'm²'}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    id={`project-list-delete-${project.id}`}
                    className="btn btn-ghost btn-icon opacity-0 group-hover:opacity-100 transition-opacity text-error hover:text-error"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteConfirm(project.id);
                    }}
                    title="Delete project"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
