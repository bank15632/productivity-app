'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Flag, Tag, MapPin, FolderOpen } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { useProjectStore } from '@/store/useProjectStore';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import toast from 'react-hot-toast';

interface QuickAddTaskProps {
  onClose: () => void;
  defaultProjectId?: string;
  defaultDate?: string;
}

export default function QuickAddTask({ onClose, defaultProjectId, defaultDate }: QuickAddTaskProps) {
  const { createTask } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: defaultProjectId || '',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    due_date: defaultDate || '',
    due_time: '',
    time_estimate: 0,
    tags: '',
    location_url: '',
    has_subtasks: false,
  });

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    setLoading(true);
    try {
      const result = await createTask({
        ...formData,
        status: 'ToDo',
        created_from: 'Web',
      });

      // Show success message with calendar sync info
      if (formData.due_date && result.calendarEventId) {
        toast.success('Task created & synced to Google Calendar! 📅');
      } else if (formData.due_date) {
        toast.success('Task created! (Connect Google Calendar to auto-sync)');
      } else {
        toast.success('Task created!');
      }

      onClose();
    } catch {
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LoadingOverlay isLoading={loading} message="กำลังดำเนินการ..." />

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4 shadow-xl sm:p-6">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">New Task</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Task title..."
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description (optional)"
                rows={2}
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Project */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                <FolderOpen className="mr-1 inline h-4 w-4" />
                Project
              </label>
              <select
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
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

            {/* Has Sub-Tasks Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="has_subtasks"
                checked={formData.has_subtasks}
                onChange={(e) => setFormData({ ...formData, has_subtasks: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="has_subtasks" className="text-sm font-medium text-gray-700">
                Task นี้มี Sub-Tasks (งานย่อย) - สามารถเพิ่มได้ภายหลัง
              </label>
            </div>

            {/* Priority */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                <Flag className="mr-1 inline h-4 w-4" />
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'High' | 'Medium' | 'Low' })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Due Date & Time Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Due Date */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  <Calendar className="mr-1 inline h-4 w-4" />
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Due Time */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.due_time}
                  onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Tags & Location Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Tags */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  <Tag className="mr-1 inline h-4 w-4" />
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="#work, #urgent"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Location URL */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  <MapPin className="mr-1 inline h-4 w-4" />
                  Location
                </label>
                <input
                  type="url"
                  value={formData.location_url}
                  onChange={(e) => setFormData({ ...formData, location_url: e.target.value })}
                  placeholder="Google Maps URL"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
