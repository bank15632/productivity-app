'use client';

import { create } from 'zustand';
import { subTasksApi } from '@/lib/api';
import type { SubTask } from '@/types';

interface SubTaskStore {
    // Store subtasks per task ID to avoid conflicts between multiple TaskCards
    subTasksByTaskId: Record<string, SubTask[]>;
    currentTaskId: string | null;
    loading: boolean;
    error: string | null;

    fetchByTask: (taskId: string) => Promise<SubTask[]>;
    createSubTask: (data: Partial<SubTask>) => Promise<void>;
    updateSubTask: (data: Partial<SubTask>) => Promise<void>;
    deleteSubTask: (subTaskId: string) => Promise<void>;
    toggleStatus: (subTaskId: string) => Promise<{ completed: number; total: number; percentage: number } | null>;

    getSubTasks: (taskId: string) => SubTask[];
    getProgress: (taskId: string) => { completed: number; total: number; percentage: number };

    // Legacy getter for backward compatibility
    subTasks: SubTask[];
}

export const useSubTaskStore = create<SubTaskStore>((set, get) => ({
    subTasksByTaskId: {},
    currentTaskId: null,
    loading: false,
    error: null,

    // Legacy getter - returns subtasks for current task
    get subTasks() {
        const { currentTaskId, subTasksByTaskId } = get();
        return currentTaskId ? (subTasksByTaskId[currentTaskId] || []) : [];
    },

    fetchByTask: async (taskId: string) => {
        set({ loading: true, error: null, currentTaskId: taskId });
        try {
            const subTasks = await subTasksApi.getByTask(taskId);
            const data = Array.isArray(subTasks) ? subTasks : [];
            set((state) => ({
                subTasksByTaskId: { ...state.subTasksByTaskId, [taskId]: data },
                loading: false
            }));
            return data;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to fetch sub-tasks';
            set((state) => ({
                error: message,
                loading: false,
                subTasksByTaskId: { ...state.subTasksByTaskId, [taskId]: [] }
            }));
            return [];
        }
    },

    createSubTask: async (data) => {
        set({ loading: true });
        try {
            await subTasksApi.create(data);
            if (data.parent_task_id) {
                await get().fetchByTask(data.parent_task_id);
            }
            set({ loading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to create sub-task';
            set({ error: message, loading: false });
        }
    },

    updateSubTask: async (data) => {
        set({ loading: true });
        try {
            await subTasksApi.update(data);
            set({ loading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to update sub-task';
            set({ error: message, loading: false });
        }
    },

    deleteSubTask: async (subTaskId) => {
        // Find subtask in all tasks
        const { subTasksByTaskId } = get();
        let parentTaskId: string | undefined;
        for (const [taskId, subtasks] of Object.entries(subTasksByTaskId)) {
            const found = subtasks.find(st => st.id === subTaskId);
            if (found) {
                parentTaskId = taskId;
                break;
            }
        }

        set({ loading: true });
        try {
            await subTasksApi.delete(subTaskId);
            if (parentTaskId) {
                await get().fetchByTask(parentTaskId);
            }
            set({ loading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to delete sub-task';
            set({ error: message, loading: false });
        }
    },

    toggleStatus: async (subTaskId) => {
        // Find subtask in all tasks
        const { subTasksByTaskId } = get();
        let parentTaskId: string | undefined;
        for (const [taskId, subtasks] of Object.entries(subTasksByTaskId)) {
            const found = subtasks.find(st => st.id === subTaskId);
            if (found) {
                parentTaskId = taskId;
                break;
            }
        }

        set({ loading: true });
        try {
            const response = await subTasksApi.toggleStatus(subTaskId);
            if (parentTaskId) {
                await get().fetchByTask(parentTaskId);
            }
            set({ loading: false });
            // Return progress from API response
            if (response && 'progress' in response) {
                return (response as { progress: { completed: number; total: number; percentage: number } }).progress;
            }
            return null;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to toggle sub-task';
            set({ error: message, loading: false });
            return null;
        }
    },

    getSubTasks: (taskId: string) => {
        return get().subTasksByTaskId[taskId] || [];
    },

    getProgress: (taskId: string) => {
        const subTasks = get().subTasksByTaskId[taskId] || [];
        const completed = subTasks.filter(st => st.status === 'Done').length;
        const total = subTasks.length;
        return {
            completed,
            total,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    },
}));
