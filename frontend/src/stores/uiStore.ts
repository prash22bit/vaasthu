import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ToolId } from '../constants';

interface UIStore {
  activeTool: ToolId;
  isNewProjectModalOpen: boolean;
  isDeleteConfirmOpen: boolean;
  deleteTargetId: string | null;
  isInspectorCollapsed: boolean;
  isToolbarCollapsed: boolean;
  isProjectListOpen: boolean;
  backendConnected: boolean | null; // null = unknown

  // Actions
  setActiveTool: (tool: ToolId) => void;
  openNewProjectModal: () => void;
  closeNewProjectModal: () => void;
  openDeleteConfirm: (projectId: string) => void;
  closeDeleteConfirm: () => void;
  toggleInspector: () => void;
  toggleToolbar: () => void;
  toggleProjectList: () => void;
  setProjectListOpen: (open: boolean) => void;
  setBackendConnected: (connected: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  immer((set) => ({
    activeTool: 'select',
    isNewProjectModalOpen: false,
    isDeleteConfirmOpen: false,
    deleteTargetId: null,
    isInspectorCollapsed: false,
    isToolbarCollapsed: false,
    isProjectListOpen: false,
    backendConnected: null,

    setActiveTool: (tool) => set((s) => { s.activeTool = tool; }),

    openNewProjectModal: () => set((s) => { s.isNewProjectModalOpen = true; }),
    closeNewProjectModal: () => set((s) => { s.isNewProjectModalOpen = false; }),

    openDeleteConfirm: (projectId) => set((s) => {
      s.isDeleteConfirmOpen = true;
      s.deleteTargetId = projectId;
    }),
    closeDeleteConfirm: () => set((s) => {
      s.isDeleteConfirmOpen = false;
      s.deleteTargetId = null;
    }),

    toggleInspector: () => set((s) => { s.isInspectorCollapsed = !s.isInspectorCollapsed; }),
    toggleToolbar: () => set((s) => { s.isToolbarCollapsed = !s.isToolbarCollapsed; }),
    toggleProjectList: () => set((s) => { s.isProjectListOpen = !s.isProjectListOpen; }),
    setProjectListOpen: (open) => set((s) => { s.isProjectListOpen = open; }),
    setBackendConnected: (connected) => set((s) => { s.backendConnected = connected; }),
  }))
);
