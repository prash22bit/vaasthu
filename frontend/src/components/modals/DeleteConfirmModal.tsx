import React, { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useProject } from '../../hooks/useProject';
import { useProjectStore } from '../../stores/projectStore';

export const DeleteConfirmModal: React.FC = () => {
  const { closeDeleteConfirm, deleteTargetId } = useUIStore();
  const { deleteProject } = useProject();
  const projects = useProjectStore((s) => s.projects);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetProject = projects.find((p) => p.id === deleteTargetId);

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteProject(deleteTargetId);
      closeDeleteConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeDeleteConfirm()}>
      <div className="modal-panel max-w-sm w-full">
        <div className="p-5">
          {/* Icon */}
          <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center mb-4">
            <AlertTriangle size={18} className="text-error" />
          </div>

          <h2 className="text-text-primary font-semibold text-base mb-1">Delete Project</h2>
          <p className="text-text-secondary text-sm mb-1">
            Are you sure you want to delete{' '}
            <span className="text-text-primary font-medium">
              "{targetProject?.name ?? 'this project'}"
            </span>
            ?
          </p>
          <p className="text-text-muted text-xs mb-5">
            This action cannot be undone. The project will be permanently removed from the database.
          </p>

          {error && (
            <div className="bg-error/10 border border-error/30 rounded px-3 py-2 mb-4">
              <p className="text-error text-xs">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              id="delete-confirm-cancel-btn"
              className="btn btn-secondary btn-md flex-1"
              onClick={closeDeleteConfirm}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              id="delete-confirm-delete-btn"
              className="btn btn-danger btn-md flex-1 gap-1.5"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 size={13} />
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
