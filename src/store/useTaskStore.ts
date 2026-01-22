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

// Helper function to create calendar event
async function createCalendarEvent(data: Partial<Task>): Promise<string | undefined> {
  if (!data.due_date) return undefined;

  try {
    // Parse date properly to avoid timezone issues
    const [year, month, day] = data.due_date.split('-').map(Number);
    let startDate: Date;

    if (data.due_time) {
      const [hours, minutes] = data.due_time.split(':').map(Number);
      startDate = new Date(year, month - 1, day, hours, minutes, 0);
    } else {
      startDate = new Date(year, month - 1, day, 9, 0, 0); // Default 9 AM
    }

    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    console.log('[Calendar] Creating event:', {
      title: data.title,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });

    const response = await axios.post('/api/calendar', {
      action: 'create',
      event: {
        title: data.title,
        description: data.description || '',
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        allDay: !data.due_time,
      },
    });

    if (response.data.success && response.data.event?.id) {
      console.log('[Calendar] Event created:', response.data.event.id);
      return response.data.event.id;
    }
  } catch (error) {
    console.error('[Calendar] Failed to create event:', error);
  }
  return undefined;
}

// Helper function to update calendar event
async function updateCalendarEvent(eventId: string, data: Partial<Task>): Promise<boolean> {
  if (!eventId || !data.due_date) return false;

  try {
    const [year, month, day] = data.due_date.split('-').map(Number);
    let startDate: Date;

    if (data.due_time) {
      const [hours, minutes] = data.due_time.split(':').map(Number);
      startDate = new Date(year, month - 1, day, hours, minutes, 0);
    } else {
      startDate = new Date(year, month - 1, day, 9, 0, 0);
    }

    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    console.log('[Calendar] Updating event:', eventId, {
      title: data.title,
      start: startDate.toISOString(),
    });

    const response = await axios.post('/api/calendar', {
      action: 'update',
      eventId: eventId,
      event: {
        title: data.title,
        description: data.description || '',
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        allDay: !data.due_time,
      },
    });

    console.log('[Calendar] Update response:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('[Calendar] Failed to update event:', error);
    return false;
  }
}

// Helper function to delete calendar event
async function deleteCalendarEventHelper(eventId: string): Promise<boolean> {
  if (!eventId) return false;

  try {
    console.log('[Calendar] Deleting event:', eventId);
    const response = await axios.post('/api/calendar', {
      action: 'delete',
      eventId: eventId,
    });
    console.log('[Calendar] Delete response:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('[Calendar] Failed to delete event:', error);
    return false;
  }
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await tasksApi.getAll();
      console.log('[TaskStore] Fetched tasks:', tasks?.length || 0);
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
      // 1. Create calendar event first (if has due_date)
      const calendarEventId = await createCalendarEvent(data);

      // 2. Create task with calendar_event_id
      console.log('[TaskStore] Creating task with calendar_event_id:', calendarEventId);
      const result = await tasksApi.create({
        ...data,
        calendar_event_id: calendarEventId,
      });

      // 3. Refresh tasks
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
      // 1. Get current task to check for calendar_event_id
      const currentTask = get().tasks.find(t => t.id === data.id);
      console.log('[TaskStore] Updating task:', data.id);
      console.log('[TaskStore] Current calendar_event_id:', currentTask?.calendar_event_id);

      // 2. If task has calendar event, update it
      if (currentTask?.calendar_event_id && data.due_date) {
        await updateCalendarEvent(currentTask.calendar_event_id, {
          ...currentTask,
          ...data,
        });
      } else if (!currentTask?.calendar_event_id && data.due_date) {
        // Task didn't have calendar event but now has due_date - create one
        const newEventId = await createCalendarEvent({
          ...currentTask,
          ...data,
        });
        if (newEventId) {
          data.calendar_event_id = newEventId;
        }
      }

      // 3. Update task in database
      await tasksApi.update(data);

      // 4. Refresh tasks
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
      // 1. Get task before deleting to get calendar_event_id
      const task = get().tasks.find(t => t.id === taskId);
      console.log('[TaskStore] Deleting task:', taskId);
      console.log('[TaskStore] Task calendar_event_id:', task?.calendar_event_id);

      // 2. Delete from Google Calendar first (if has calendar_event_id)
      if (task?.calendar_event_id) {
        await deleteCalendarEventHelper(task.calendar_event_id);
      } else {
        console.log('[TaskStore] No calendar_event_id found, skipping calendar delete');
      }

      // 3. Delete from database
      await tasksApi.delete(taskId);

      // 4. Refresh tasks
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
