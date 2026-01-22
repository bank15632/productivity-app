'use client';

import { useEffect, useState } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import TaskCard from './TaskCard';
import type { Task } from '@/types';
import { ListFilter, SortAsc, X, Calendar, Flag, Tag } from 'lucide-react';
import { useProjectStore } from '@/store/useProjectStore';
import toast from 'react-hot-toast';

interface TaskListProps {
  projectId?: string;
  showFilters?: boolean;
}

type SortField = 'due_date' | 'priority' | 'created_at';
type FilterStatus = 'all' | 'ToDo' | 'Doing' | 'Done';

export default function TaskList({ projectId, showFilters = true }: TaskListProps) {
  const { tasks, loading, fetchTasks, updateTask } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();
  const [sortBy, setSortBy] = useState<SortField>('due_date');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [fetchTasks, fetchProjects]);

  // Filter tasks
  let filteredTasks = projectId
    ? tasks.filter((t) => t.project_id === projectId)
    : tasks;

  if (filterStatus !== 'all') {
    filteredTasks = filteredTasks.filter((t) => t.status === filterStatus);
  }

  if (filterPriority !== 'all') {
    filteredTasks = filteredTasks.filter((t) => t.priority === filterPriority);
  }

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'due_date') {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    if (sortBy === 'priority') {
      const priorityOrder = { High: 0, Medium: 1, Low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    if (sortBy === 'created_at') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return 0;
  });

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleSaveEdit = async () => {
    if (!editingTask) return;

    setEditLoading(true);
    try {
      await updateTask(editingTask);
      toast.success('Task updated!');
      setEditingTask(null);
    } catch {
      toast.error('Failed to update task');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      {showFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="ToDo">To Do</option>
              <option value="Doing">Doing</option>
              <option value="Done">Done</option>
            </select>
          </div>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="due_date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="created_at">Created</option>
            </select>
          </div>

          {/* Count */}
          <span className="ml-auto text-sm text-gray-500">
            {sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Task List */}
      {sortedTasks.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center">
          <p className="text-gray-500">No tasks found</p>
          <p className="mt-1 text-sm text-gray-400">
            Click &quot;New Task&quot; to create one
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEditTask}
            />
          ))}
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4 shadow-xl sm:p-6">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Task</h2>
              <button
                onClick={() => setEditingTask(null)}
                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  placeholder="Task title..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <textarea
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  placeholder="Description (optional)"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Project & Priority Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Project */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Project
                  </label>
                  <select
                    value={editingTask.project_id || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, project_id: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">No project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    <Flag className="mr-1 inline h-4 w-4" />
                    Priority
                  </label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as 'High' | 'Medium' | 'Low' })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {/* Status & Due Date Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Status */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as 'ToDo' | 'Doing' | 'Done' })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ToDo">To Do</option>
                    <option value="Doing">Doing</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    <Calendar className="mr-1 inline h-4 w-4" />
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={editingTask.due_date || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  <Tag className="mr-1 inline h-4 w-4" />
                  Tags
                </label>
                <input
                  type="text"
                  value={editingTask.tags || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, tags: e.target.value })}
                  placeholder="#work, #urgent"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editLoading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
