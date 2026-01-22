import { create } from 'zustand';
import { projectsApi } from '@/lib/api';
import type { Project } from '@/types';

interface ProjectStore {
  projects: Project[];
  loading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  createProject: (data: Partial<Project>) => Promise<void>;
  updateProject: (data: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  archiveProject: (projectId: string) => Promise<void>;

  getProjectById: (projectId: string) => Project | undefined;
  filterByStatus: (status: Project['status']) => Project[];
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const projects = await projectsApi.getAll();
      set({ projects: Array.isArray(projects) ? projects : [], loading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch projects';
      set({ error: message, loading: false });
    }
  },

  createProject: async (data) => {
    set({ loading: true });
    try {
      await projectsApi.create(data);
      await get().fetchProjects();
      set({ loading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create project';
      set({ error: message, loading: false });
    }
  },

  updateProject: async (data) => {
    set({ loading: true });
    try {
      await projectsApi.update(data);
      await get().fetchProjects();
      set({ loading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update project';
      set({ error: message, loading: false });
    }
  },

  deleteProject: async (projectId) => {
    set({ loading: true });
    try {
      await projectsApi.delete(projectId);
      await get().fetchProjects();
      set({ loading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete project';
      set({ error: message, loading: false });
    }
  },

  archiveProject: async (projectId) => {
    set({ loading: true });
    try {
      await projectsApi.archive(projectId);
      await get().fetchProjects();
      set({ loading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to archive project';
      set({ error: message, loading: false });
    }
  },

  getProjectById: (projectId) => {
    return get().projects.find((project) => project.id === projectId);
  },

  filterByStatus: (status) => {
    return get().projects.filter((project) => project.status === status);
  },
}));
