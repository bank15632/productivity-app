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

// Helper: Create calendar event
async function createCalendarEvent(data: Partial<Task>): Promise<string | undefined> {
  if (!data.due_date) return undefined;

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

    console.log('[Calendar] Creating event:', data.title);

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

// Helper: Update calendar event
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

    console.log('[Calendar] Updating event:', eventId);

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

    return response.data.success;
  } catch (error) {
    console.error('[Calendar] Failed to update event:', error);
    return false;
  }
}

// Helper: Delete calendar event by ID
async function deleteCalendarEventById(eventId: string): Promise<boolean> {
  try {
    console.log('[Calendar] Deleting event by ID:', eventId);
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

// Helper: Find and delete calendar events by task title and date
async function findAndDeleteCalendarEvents(task: Task): Promise<void> {
  if (!task.due_date) {
    console.log('[Calendar] Task has no due_date, skipping calendar delete');
    return;
  }

  try {
    // Parse the due_date - handle both YYYY-MM-DD and ISO formats
    let taskDate: Date;
    if (task.due_date.includes('T')) {
      // Full ISO format: 2026-01-22T17:00:00.000Z
      taskDate = new Date(task.due_date);
    } else {
      // Simple format: 2026-01-22
      const [year, month, day] = task.due_date.split('-').map(Number);
      taskDate = new Date(year, month - 1, day);
    }

    // Create time range for the whole day
    const timeMin = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate(), 0, 0, 0);
    const timeMax = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate(), 23, 59, 59);

    console.log('[Calendar] Searching for events to delete:');
    console.log('  - Task title:', task.title);
    console.log('  - Original due_date:', task.due_date);
    console.log('  - Date range:', timeMin.toISOString(), 'to', timeMax.toISOString());

    const response = await axios.get('/api/calendar', {
      params: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
      },
    });

    const events = response.data.events || [];
    console.log('[Calendar] Found events on this date:', events.length);

    // Find all events that match the task title
    const matchingEvents = events.filter((event: { summary?: string; id?: string }) => {
      const eventTitle = event.summary || '';
      // Match exact title or title with [Task] prefix
      return eventTitle === task.title ||
        eventTitle === `[Task] ${task.title}` ||
        eventTitle.includes(task.title);
    });

    console.log('[Calendar] Matching events found:', matchingEvents.length);

    // Delete all matching events
    for (const event of matchingEvents) {
      if (event.id) {
        console.log('[Calendar] Deleting matching event:', event.id, event.summary);
        await deleteCalendarEventById(event.id);
      }
    }

    if (matchingEvents.length === 0) {
      console.log('[Calendar] No matching events found to delete');
    } else {
      console.log('[Calendar] Successfully deleted', matchingEvents.length, 'event(s)');
    }

  } catch (error) {
    console.error('[Calendar] Error searching/deleting events:', error);
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
      // 1. Create calendar event first
      const calendarEventId = await createCalendarEvent(data);

      // 2. Create task with calendar_event_id
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
      const currentTask = get().tasks.find(t => t.id === data.id);

      // Update calendar event if exists
      if (currentTask?.calendar_event_id && data.due_date) {
        await updateCalendarEvent(currentTask.calendar_event_id, {
          ...currentTask,
          ...data,
        });
      } else if (!currentTask?.calendar_event_id && data.due_date) {
        // Create new calendar event if didn't have one
        const newEventId = await createCalendarEvent({
          ...currentTask,
          ...data,
        });
        if (newEventId) {
          data.calendar_event_id = newEventId;
        }
      }

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
      // 1. Get task before deleting
      const task = get().tasks.find(t => t.id === taskId);
      console.log('[TaskStore] Deleting task:', taskId);

      if (!task) {
        console.log('[TaskStore] Task not found in store');
        await tasksApi.delete(taskId);
        await get().fetchTasks();
        set({ loading: false });
        return;
      }

      console.log('[TaskStore] Task title:', task.title);
      console.log('[TaskStore] Task due_date:', task.due_date);
      console.log('[TaskStore] Task calendar_event_id:', task.calendar_event_id);

      // 2. Try to delete by calendar_event_id first
      if (task.calendar_event_id) {
        console.log('[TaskStore] Attempting delete by calendar_event_id');
        await deleteCalendarEventById(task.calendar_event_id);
      }

      // 3. ALSO search and delete by title/date (as backup and for old tasks)
      console.log('[TaskStore] Searching and deleting by title/date...');
      await findAndDeleteCalendarEvents(task);

      // 4. Delete from database
      await tasksApi.delete(taskId);

      // 5. Refresh tasks
      await get().fetchTasks();
      set({ loading: false });

      console.log('[TaskStore] Task deletion complete');
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
