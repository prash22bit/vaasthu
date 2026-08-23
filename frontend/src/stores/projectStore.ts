import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Project, CreateProjectPayload, UpdateProjectPayload, SaveStatus, Plot } from '@vastuplan/shared';
import { projectApi } from '../api/projectApi';

interface ProjectStore {
  // State
  projects: Project[];
  currentProject: Project | null;
  saveStatus: SaveStatus;
  loadingProjects: boolean;
  loadingProject: boolean;
  error: string | null;

  // Actions
  loadProjects: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  createProject: (payload: CreateProjectPayload) => Promise<Project>;
  updateProject: (id: string, payload: UpdateProjectPayload) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  updateCurrentProject: (updates: Partial<Project>) => void;
  updateCurrentPlot: (plotUpdates: Partial<Plot>) => void;
  setSaveStatus: (status: SaveStatus) => void;
  clearError: () => void;
  saveCurrentProject: () => Promise<void>;
}

export const useProjectStore = create<ProjectStore>()(
  immer((set, get) => ({
    // ── Initial state ──
    projects: [],
    currentProject: null,
    saveStatus: 'saved',
    loadingProjects: false,
    loadingProject: false,
    error: null,

    // ── Load all projects ──
    loadProjects: async () => {
      set((s) => { s.loadingProjects = true; s.error = null; });
      try {
        const projects = await projectApi.getAll();
        set((s) => { s.projects = projects; s.loadingProjects = false; });
      } catch (err) {
        set((s) => {
          s.error = err instanceof Error ? err.message : 'Failed to load projects';
          s.loadingProjects = false;
        });
      }
    },

    // ── Load single project ──
    loadProject: async (id: string) => {
      set((s) => { s.loadingProject = true; s.error = null; });
      try {
        const project = await projectApi.getById(id);
        set((s) => {
          s.currentProject = project;
          s.loadingProject = false;
          s.saveStatus = 'saved';
        });
      } catch (err) {
        set((s) => {
          s.error = err instanceof Error ? err.message : 'Failed to load project';
          s.loadingProject = false;
        });
      }
    },

    // ── Create project ──
    createProject: async (payload: CreateProjectPayload) => {
      set((s) => { s.error = null; });
      try {
        const project = await projectApi.create(payload);
        set((s) => {
          s.projects.unshift(project);
          s.currentProject = project;
          s.saveStatus = 'saved';
        });
        return project;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create project';
        set((s) => { s.error = message; });
        throw new Error(message);
      }
    },

    // ── Update project ──
    updateProject: async (id: string, payload: UpdateProjectPayload) => {
      set((s) => { s.saveStatus = 'saving'; s.error = null; });
      try {
        const updated = await projectApi.update(id, payload);
        set((s) => {
          s.saveStatus = 'saved';
          // Update in project list
          const idx = s.projects.findIndex((p) => p.id === id);
          if (idx !== -1) s.projects[idx] = updated;
          // Update current project if it's the one being saved
          if (s.currentProject?.id === id) s.currentProject = updated;
        });
      } catch (err) {
        set((s) => {
          s.saveStatus = 'error';
          s.error = err instanceof Error ? err.message : 'Failed to save project';
        });
        throw err;
      }
    },

    // ── Delete project ──
    deleteProject: async (id: string) => {
      try {
        await projectApi.delete(id);
        set((s) => {
          s.projects = s.projects.filter((p) => p.id !== id);
          if (s.currentProject?.id === id) s.currentProject = null;
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete project';
        set((s) => { s.error = message; });
        throw new Error(message);
      }
    },

    // ── Set current project ──
    setCurrentProject: (project: Project | null) => {
      set((s) => { s.currentProject = project; s.saveStatus = 'saved'; });
    },

    // ── Update current project (generic) ──
    updateCurrentProject: (updates: Partial<Project>) => {
      set((s) => {
        if (!s.currentProject) return;
        Object.assign(s.currentProject, updates);
        s.saveStatus = 'unsaved';
      });
    },

    // ── Update current project's plot (for real-time inspector edits) ──
    updateCurrentPlot: (plotUpdates: Partial<Plot>) => {
      set((s) => {
        if (!s.currentProject) return;
        s.currentProject.plot = { ...s.currentProject.plot, ...plotUpdates };
        s.saveStatus = 'unsaved';
      });
    },

    // ── Set save status ──
    setSaveStatus: (status: SaveStatus) => {
      set((s) => { s.saveStatus = status; });
    },

    // ── Clear error ──
    clearError: () => {
      set((s) => { s.error = null; });
    },

    // ── Save current project to backend ──
    saveCurrentProject: async () => {
      const { currentProject } = get();
      if (!currentProject) return;
      const { updateProject } = get();
      await updateProject(currentProject.id, {
        name: currentProject.name,
        plot: currentProject.plot,
        floors: currentProject.floors,
        settings: currentProject.settings,
      });
    },
  }))
);
