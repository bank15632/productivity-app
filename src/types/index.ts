// ============================================
// PROJECT TYPES
// ============================================
export interface Project {
  id: string;
  name: string;
  description: string;
  category?: string;
  status: 'Active' | 'OnHold' | 'Done' | 'Archived';
  priority: 'High' | 'Medium' | 'Low';
  folder_id: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// ============================================
// TASK TYPES
// ============================================
export interface Task {
  id: string;
  title: string;
  description: string;
  project_id: string;
  status: 'ToDo' | 'Doing' | 'Done';
  priority: 'High' | 'Medium' | 'Low';
  due_date: string;
  due_time: string;
  location_url?: string; // Google Maps link for appointments
  calendar_event_id?: string; // Google Calendar event ID for sync
  time_estimate: number;
  time_spent: number;
  linked_tasks: string;
  tags: string;
  note_id: string;
  is_recurring: boolean;
  recurring_pattern: string;
  parent_task_id: string;
  has_subtasks?: boolean; // Flag to indicate if this task has sub-tasks
  created_at: string;
  updated_at: string;
  completed_at?: string;
  created_from: 'LINE' | 'Web';
}

// ============================================
// SUB-TASK TYPES
// ============================================
export interface SubTask {
  id: string;
  parent_task_id: string;
  title: string;
  status: 'ToDo' | 'Done';
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// ============================================
// NOTE TYPES
// ============================================
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string;
  linked_notes: string;
  linked_tasks: string;
  project_id: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// ATTACHMENT TYPES
// ============================================
export interface Attachment {
  id: string;
  parent_type: 'Task' | 'Note' | 'Project';
  parent_id: string;
  file_type: 'image' | 'pdf' | 'doc' | 'other';
  file_name: string;
  drive_file_id: string;
  drive_url: string;
  file_size: number;
  uploaded_at: string;
  source: 'LINE' | 'Web';
}

// ============================================
// ANALYTICS TYPES
// ============================================
export interface Analytics {
  date: string;
  tasks_created: number;
  tasks_completed: number;
  total_time_spent: number;
  pomodoro_sessions: number;
  productive_hours: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================
export interface ApiResponse<T = unknown> {
  success?: boolean;
  error?: string;
  data?: T;
  id?: string;
}

// ============================================
// TEMPLATE TYPES
// ============================================
export interface TaskTemplate {
  id: string;
  name: string;
  tasks: {
    title: string;
    time_estimate: number;
    priority: 'High' | 'Medium' | 'Low';
  }[];
}

// ============================================
// STORAGE STATS
// ============================================
export interface StorageStats {
  projects: number;
  tasks: number;
  attachments: number;
  total_file_size: number;
  total_file_size_mb: string;
}
