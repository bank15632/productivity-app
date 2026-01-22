import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function getRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  return formatDate(date);
}

export function parseTags(tagsString: string): string[] {
  if (!tagsString) return [];
  return tagsString.split(',').map(tag => tag.trim()).filter(Boolean);
}

export function stringifyTags(tags: string[]): string {
  return tags.join(',');
}

export function generateId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}${timestamp}${random}`;
}

export function getPriorityColor(priority: 'High' | 'Medium' | 'Low'): string {
  const colors = {
    High: 'bg-red-100 text-red-800 border-red-200',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Low: 'bg-green-100 text-green-800 border-green-200'
  };
  return colors[priority];
}

export function getStatusColor(status: 'ToDo' | 'Doing' | 'Done'): string {
  const colors = {
    ToDo: 'bg-gray-100 text-gray-800',
    Doing: 'bg-blue-100 text-blue-800',
    Done: 'bg-green-100 text-green-800'
  };
  return colors[status];
}

interface TaskForProgress {
  id: string;
  status: 'ToDo' | 'Doing' | 'Done';
  has_subtasks?: boolean;
}

interface SubTaskForProgress {
  status: 'ToDo' | 'Done';
}

/**
 * Calculate project progress including subtasks
 * - Tasks without subtasks: 0% if not Done, 100% if Done
 * - Tasks with subtasks: use subtask completion percentage
 * - Final progress = average of all task percentages
 */
export function calculateProjectProgress(
  tasks: TaskForProgress[],
  getSubTasksForTask: (taskId: string) => SubTaskForProgress[]
): { progress: number; completed: number; total: number } {
  if (tasks.length === 0) {
    return { progress: 0, completed: 0, total: 0 };
  }

  let totalPercentage = 0;
  let completedTasks = 0;

  for (const task of tasks) {
    if (task.has_subtasks) {
      // Task has subtasks - calculate based on subtask completion
      const subtasks = getSubTasksForTask(task.id);
      if (subtasks.length > 0) {
        const completedSubtasks = subtasks.filter(st => st.status === 'Done').length;
        const subtaskPercentage = (completedSubtasks / subtasks.length) * 100;
        totalPercentage += subtaskPercentage;
        if (subtaskPercentage === 100) {
          completedTasks++;
        }
      } else {
        // No subtasks loaded yet, fallback to task status
        if (task.status === 'Done') {
          totalPercentage += 100;
          completedTasks++;
        }
      }
    } else {
      // Task without subtasks - binary (0% or 100%)
      if (task.status === 'Done') {
        totalPercentage += 100;
        completedTasks++;
      }
    }
  }

  const progress = Math.round(totalPercentage / tasks.length);
  return { progress, completed: completedTasks, total: tasks.length };
}
