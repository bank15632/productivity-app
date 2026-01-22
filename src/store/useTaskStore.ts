import { create } from 'zustand';
import { tasksApi } from '@/lib/api';
import { syncTaskToCalendar, deleteCalendarEvent } from '@/lib/calendarSync';
import type { Task } from '@/types';

interface TaskStore {
  tasks: Task[];
  loading: boolean;
  error: string | null;

  fetchTasks: () => Promise<void>;
  createTask: (data: Partial<Task>, syncToCalendar?: boolean) => Promise<{ calendarEventId?: string }>;
  updateTask: (data: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string, task?: Task) => Promise<void>;

  filterByStatus: (status: Task['status']) => Task[];
  filterByPriority: (priority: Task['priority']) => Task[];
  filterByDate: (date: string) => Task[];
  filterByProject: (projectId: string) => Task[];
  searchTasks: (query: string) => Task[];
  getTaskById: (taskId: string) => Task | undefined;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await tasksApi.getAll();
      set({ tasks: Array.isArray(tasks) ? tasks : [], loading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch tasks';
      set({ error: message, loading: false });
    }
  },

  createTask: async (data, syncToCalendar = true) => {
    set({ loading: true });
    try {
      // First create the task
      const createResponse = await tasksApi.create(data);

      // Auto-sync to Google Calendar if due_date exists and syncToCalendar is true
      let calendarEventId: string | undefined;
      if (syncToCalendar && data.due_date) {
        try {
          const syncResult = await syncTaskToCalendar({
            title: data.title || '',
            description: data.description,
            due_date: data.due_date,
            due_time: data.due_time,
          });
          if (syncResult.success && syncResult.eventId) {
            calendarEventId = syncResult.eventId;
            console.log('Task synced to calendar, event ID:', calendarEventId);

            // Update the task with the calendar event ID
            if (createResponse?.id) {
              await tasksApi.update({
                id: createResponse.id,
                calendar_event_id: calendarEventId,
              });
            }
          } else {
            console.log('Calendar sync skipped or failed:', syncResult.error);
          }
        } catch (syncError) {
          // Don't fail the task creation if calendar sync fails
          console.error('Calendar sync error:', syncError);
        }
      }

      await get().fetchTasks();
      set({ loading: false });

      return { calendarEventId };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create task';
      set({ error: message, loading: false });
      return {};
    }
  },

  updateTask: async (data) => {
    set({ loading: true });
    try {
      await tasksApi.update(data);
      await get().fetchTasks();
      set({ loading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update task';
      set({ error: message, loading: false });
    }
  },

  deleteTask: async (taskId, task) => {
    set({ loading: true });
    try {
      // If task has a calendar event ID, delete it from Google Calendar first
      const taskToDelete = task || get().tasks.find(t => t.id === taskId);
      if (taskToDelete?.calendar_event_id) {
        try {
          console.log('Deleting calendar event:', taskToDelete.calendar_event_id);
          const deleteResult = await deleteCalendarEvent(taskToDelete.calendar_event_id);
          if (deleteResult.success) {
            console.log('Calendar event deleted successfully');
          } else {
            console.log('Failed to delete calendar event:', deleteResult.error);
          }
        } catch (calendarError) {
          console.error('Error deleting calendar event:', calendarError);
          // Continue with task deletion even if calendar delete fails
        }
      }

      await tasksApi.delete(taskId);
      await get().fetchTasks();
      set({ loading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete task';
      set({ error: message, loading: false });
    }
  },

  filterByStatus: (status) => {
    return get().tasks.filter((task) => task.status === status);
  },

  filterByPriority: (priority) => {
    return get().tasks.filter((task) => task.priority === priority);
  },

  filterByDate: (date) => {
    return get().tasks.filter((task) => task.due_date === date);
  },

  filterByProject: (projectId) => {
    return get().tasks.filter((task) => task.project_id === projectId);
  },

  searchTasks: (query) => {
    const lowerQuery = query.toLowerCase();
    return get().tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(lowerQuery) ||
        task.description?.toLowerCase().includes(lowerQuery) ||
        task.tags?.toLowerCase().includes(lowerQuery)
    );
  },

  getTaskById: (taskId) => {
    return get().tasks.find((task) => task.id === taskId);
  },
}));
