import { create } from 'zustand';
import { tasksApi } from '@/lib/api';
import type { Task } from '@/types';
import axios from 'axios';

interface TaskStore {
  tasks: Task[];
  loading: boolean;
  error: string | null;

  fetchTasks: () => Promise<void>;
  fetchByProject: (projectId: string) => Promise<void>;
  fetchByDate: (date: string) => Promise<void>;
  createTask: (data: Partial<Task>) => Promise<{ id?: string; calendarEventId?: string }>;
  updateTask: (data: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  searchTasks: (query: string) => Promise<void>;

  getTaskById: (taskId: string) => Task | undefined;
  filterByStatus: (status: Task['status']) => Task[];
  filterByPriority: (priority: Task['priority']) => Task[];
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

  fetchByProject: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const tasks = await tasksApi.getByProject(projectId);
      set({ tasks: Array.isArray(tasks) ? tasks : [], loading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch tasks';
      set({ error: message, loading: false });
    }
  },

  fetchByDate: async (date) => {
    set({ loading: true, error: null });
    try {
      const tasks = await tasksApi.getByDate(date);
      set({ tasks: Array.isArray(tasks) ? tasks : [], loading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch tasks';
      set({ error: message, loading: false });
    }
  },

  createTask: async (data) => {
    set({ loading: true });
    try {
      let calendarEventId: string | undefined;

      // If task has due_date, create Google Calendar event first
      if (data.due_date) {
        try {
          const startDate = new Date(data.due_date);
          if (data.due_time) {
            const [hours, minutes] = data.due_time.split(':');
            startDate.setHours(parseInt(hours), parseInt(minutes));
          } else {
            startDate.setHours(9, 0, 0, 0); // Default to 9:00 AM
          }

          const endDate = new Date(startDate);
          endDate.setHours(endDate.getHours() + 1); // Default 1 hour duration

          const calendarResponse = await axios.post('/api/calendar', {
            action: 'create',
            event: {
              title: data.title,
              description: data.description || '',
              start: startDate.toISOString(),
              end: endDate.toISOString(),
              allDay: !data.due_time,
            },
          });

          if (calendarResponse.data.success && calendarResponse.data.event?.id) {
            calendarEventId = calendarResponse.data.event.id;
            console.log('Created calendar event:', calendarEventId);
          }
        } catch (calendarError) {
          // Log but don't fail the whole operation if calendar create fails
          console.error('Failed to create calendar event:', calendarError);
        }
      }

      // Create task with calendar_event_id
      const result = await tasksApi.create({
        ...data,
        calendar_event_id: calendarEventId,
      });

      await get().fetchTasks();
      set({ loading: false });
      return { id: result.id, calendarEventId };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create task';
      set({ error: message, loading: false });
      throw error;
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
      throw error;
    }
  },

  deleteTask: async (taskId) => {
    set({ loading: true });
    try {
      // Find the task to get calendar_event_id before deleting
      const task = get().tasks.find(t => t.id === taskId);

      // Delete from database first
      await tasksApi.delete(taskId);

      // If task has calendar_event_id, delete from Google Calendar too
      if (task?.calendar_event_id) {
        try {
          await axios.post('/api/calendar', {
            action: 'delete',
            eventId: task.calendar_event_id
          });
          console.log('Deleted calendar event:', task.calendar_event_id);
        } catch (calendarError) {
          // Log but don't fail the whole operation if calendar delete fails
          console.error('Failed to delete calendar event:', calendarError);
        }
      }

      await get().fetchTasks();
      set({ loading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete task';
      set({ error: message, loading: false });
      throw error;
    }
  },

  searchTasks: async (query) => {
    set({ loading: true, error: null });
    try {
      const tasks = await tasksApi.search(query);
      set({ tasks: Array.isArray(tasks) ? tasks : [], loading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to search tasks';
      set({ error: message, loading: false });
    }
  },

  getTaskById: (taskId) => {
    return get().tasks.find((task) => task.id === taskId);
  },

  filterByStatus: (status) => {
    return get().tasks.filter((task) => task.status === status);
  },

  filterByPriority: (priority) => {
    return get().tasks.filter((task) => task.priority === priority);
  },
}));
