import axios from 'axios';
import type { Project, SubTask, Task, Note, StorageStats, TaskTemplate, ApiResponse } from '@/types';

// Use local proxy to bypass CORS
const API_URL = '/api/proxy';

// ============================================
// PROJECTS API
// ============================================
export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const response = await axios.get(`${API_URL}?action=getAllProjects`);
    return response.data;
  },

  create: async (data: Partial<Project>): Promise<ApiResponse> => {
    const response = await axios.post(
      `${API_URL}?action=createProject`,
      data
    );
    return response.data;
  },

  update: async (data: Partial<Project>): Promise<ApiResponse> => {
    const response = await axios.post(
      `${API_URL}?action=updateProject`,
      data
    );
    return response.data;
  },

  delete: async (projectId: string): Promise<ApiResponse> => {
    const response = await axios.post(
      `${API_URL}?action=deleteProject`,
      { projectId }
    );
    return response.data;
  },

  archive: async (projectId: string): Promise<ApiResponse> => {
    const response = await axios.post(
      `${API_URL}?action=archiveProject`,
      { projectId }
    );
    return response.data;
  },

  downloadAndDelete: async (projectId: string): Promise<ApiResponse & { downloadUrl?: string }> => {
    const response = await axios.post(
      `${API_URL}?action=downloadAndDeleteProject`,
      { projectId }
    );
    return response.data;
  }
};

// ============================================
// SUB-TASKS API
// ============================================
export const subTasksApi = {
  getByTask: async (taskId: string): Promise<SubTask[]> => {
    const response = await axios.get(
      `${API_URL}?action=getSubTasksByTask&taskId=${taskId}`
    );
    return response.data;
  },

  create: async (data: Partial<SubTask>): Promise<ApiResponse> => {
    const response = await axios.post(
      `${API_URL}?action=createSubTask`,
      data
    );
    return response.data;
  },

  update: async (data: Partial<SubTask>): Promise<ApiResponse> => {
    const response = await axios.post(
      `${API_URL}?action=updateSubTask`,
      data
    );
    return response.data;
  },

  delete: async (subTaskId: string): Promise<ApiResponse> => {
    const response = await axios.post(
      `${API_URL}?action=deleteSubTask`,
      { subTaskId }
    );
    return response.data;
  },

  toggleStatus: async (subTaskId: string): Promise<ApiResponse> => {
    const response = await axios.post(
      `${API_URL}?action=toggleSubTaskStatus`,
      { subTaskId }
    );
    return response.data;
  }
};

// ============================================
// TASKS API
// ============================================
export const tasksApi = {
  getAll: async (): Promise<Task[]> => {
    const response = await axios.get(`${API_URL}?action=getAllTasks`);
    return response.data;
  },

  getByProject: async (projectId: string): Promise<Task[]> => {
    const response = await axios.get(
      `${API_URL}?action=getTasksByProject&projectId=${projectId}`
    );
    return response.data;
  },

  getByDate: async (date: string): Promise<Task[]> => {
    const response = await axios.get(
      `${API_URL}?action=getTasksByDate&date=${date}`
    );
    return response.data;
  },

  search: async (query: string): Promise<Task[]> => {
    const response = await axios.get(
      `${API_URL}?action=searchTasks&query=${encodeURIComponent(query)}`
    );
    return response.data;
  },

  create: async (data: Partial<Task>): Promise<ApiResponse> => {
    const response = await axios.post(
      `${API_URL}?action=createTask`,
      data
    );
    return response.data;
  },

  update: async (data: Partial<Task>): Promise<ApiResponse> => {
    const response = await axios.post(
      `${API_URL}?action=updateTask`,
      data
    );
    return response.data;
  },

  delete: async (taskId: string): Promise<ApiResponse> => {
    const response = await axios.post(
      `${API_URL}?action=deleteTask`,
      { taskId }
    );
    return response.data;
  }
};

// ============================================
// NOTES API
// ============================================
export const notesApi = {
  getAll: async (): Promise<Note[]> => {
    const response = await axios.get(`${API_URL}?action=getAllNotes`);
    return response.data;
  },

  get: async (noteId: string): Promise<Note> => {
    const response = await axios.get(
      `${API_URL}?action=getNote&noteId=${noteId}`
    );
    return response.data;
  },

  create: async (data: Partial<Note>): Promise<ApiResponse> => {
    const response = await axios.post(
      `${API_URL}?action=createNote`,
      data
    );
    return response.data;
  },

  update: async (data: Partial<Note>): Promise<ApiResponse> => {
    const response = await axios.post(
      `${API_URL}?action=updateNote`,
      data
    );
    return response.data;
  },

  delete: async (noteId: string): Promise<ApiResponse> => {
    const response = await axios.post(
      `${API_URL}?action=deleteNote`,
      { noteId }
    );
    return response.data;
  }
};

// ============================================
// TEMPLATES API
// ============================================
export const templatesApi = {
  getAll: async (): Promise<TaskTemplate[]> => {
    const response = await axios.get(`${API_URL}?action=getTemplates`);
    return response.data;
  },

  createFromTemplate: async (templateId: string, projectId: string, startDate: string): Promise<ApiResponse> => {
    const response = await axios.post(
      `${API_URL}?action=createFromTemplate`,
      { templateId, projectId, startDate }
    );
    return response.data;
  }
};

// ============================================
// DATA MANAGEMENT API
// ============================================
export const dataApi = {
  getStorageStats: async (): Promise<StorageStats> => {
    const response = await axios.get(`${API_URL}?action=getStorageStats`);
    return response.data;
  },

  exportAllData: async (): Promise<ApiResponse & { downloadUrl?: string }> => {
    const response = await axios.post(`${API_URL}?action=exportAllData`);
    return response.data;
  },

  importData: async (jsonData: string): Promise<ApiResponse> => {
    const response = await axios.post(
      `${API_URL}?action=importData`,
      { jsonData }
    );
    return response.data;
  },

  createBackup: async (): Promise<ApiResponse> => {
    const response = await axios.post(`${API_URL}?action=createBackup`);
    return response.data;
  }
};

// ============================================
// ANALYTICS API
// ============================================
export const analyticsApi = {
  getWeekly: async (): Promise<{ date: string; created: number; completed: number }[]> => {
    const response = await axios.get(`${API_URL}?action=getWeeklyAnalytics`);
    return response.data;
  },

  updateTimeSpent: async (taskId: string, minutes: number): Promise<ApiResponse> => {
    const response = await axios.post(
      `${API_URL}?action=updateTimeSpent`,
      { taskId, minutes }
    );
    return response.data;
  }
};
