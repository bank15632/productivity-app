'use client';

import { useState, useEffect } from 'react';
import { Clock, Tag, Calendar, MoreVertical, Trash2, Edit, CheckCircle, MapPin, ChevronDown, ChevronUp, Plus, Circle, ListTodo } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { useSubTaskStore } from '@/store/useSubTaskStore';
import { formatDate, getPriorityColor, formatTime } from '@/lib/utils';
import type { Task } from '@/types';
import toast from 'react-hot-toast';
import TaskDetailModal from './TaskDetailModal';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
}

export default function TaskCard({ task, onEdit }: TaskCardProps) {
  const { updateTask, deleteTask, fetchTasks } = useTaskStore();
  const { fetchByTask, createSubTask, deleteSubTask, toggleStatus, getSubTasks, getProgress } = useSubTaskStore();
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [showSubTaskModal, setShowSubTaskModal] = useState(false);

  // Get subtasks and progress for this specific task
  const subTasks = getSubTasks(task.id);
  const progress = getProgress(task.id);

  // Fetch sub-tasks when expanded or has subtasks
  useEffect(() => {
    if ((expanded || task.has_subtasks) && task.id) {
      fetchByTask(task.id);
    }
  }, [expanded, task.id, task.has_subtasks, fetchByTask]);

  const handleToggleStatus = async () => {
    // Toggle task status (complete/incomplete)
    setLoading(true);
    try {
      const newStatus = task.status === 'Done' ? 'ToDo' : 'Done';
      await updateTask({ id: task.id, status: newStatus });
      if (newStatus === 'Done') {
        toast.success('Task completed! 🎉');
      }
    } catch {
      toast.error('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleDelete = async () => {
    setShowMenu(false);
    const confirmed = window.confirm('Are you sure you want to delete this task?');
    if (!confirmed) return;

    setLoading(true);
    try {
      await deleteTask(task.id);
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubTask = async () => {
    if (!newSubTaskTitle.trim()) {
      toast.error('กรุณาใส่ชื่องานย่อย');
      return;
    }

    setLoading(true);
    try {
      await createSubTask({
        parent_task_id: task.id,
        title: newSubTaskTitle.trim(),
      });
      setNewSubTaskTitle('');
      setShowAddInput(false);
      toast.success('เพิ่มงานย่อยเรียบร้อย!');
    } catch {
      toast.error('Failed to add sub-task');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSubTask = async (subTaskId: string) => {
    const result = await toggleStatus(subTaskId);
    if (result && result.percentage === 100) {
      toast.success('🎉 Task เสร็จสมบูรณ์!');
      await fetchTasks();
    }
  };

  const handleDeleteSubTask = async (subTaskId: string) => {
    await deleteSubTask(subTaskId);
    toast.success('ลบงานย่อยเรียบร้อย');
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Done';

  return (
    <div className={`rounded-lg border bg-white shadow-sm transition-all ${task.status === 'Done' ? 'opacity-60' : ''
      } ${isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>

      {/* Main Task Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox for completing task */}
          <button
            onClick={handleToggleStatus}
            disabled={loading}
            className={`mt-0.5 flex-shrink-0 rounded-full p-1 transition-colors ${task.status === 'Done'
              ? 'text-green-600'
              : 'text-gray-400 hover:text-green-600'
              }`}
          >
            <CheckCircle className="h-5 w-5" />
          </button>

          {/* Expand/Collapse Toggle for SubTasks */}
          <button
            onClick={handleToggleExpand}
            className={`mt-0.5 flex-shrink-0 rounded-full p-1 transition-colors ${expanded
                ? 'text-blue-600'
                : task.has_subtasks
                  ? 'text-blue-500 hover:text-blue-600'
                  : 'text-gray-300 hover:text-gray-500'
              }`}
            title={expanded ? 'ซ่อนงานย่อย' : 'แสดง/เพิ่มงานย่อย'}
          >
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`font-semibold text-gray-900 ${task.status === 'Done' ? 'line-through' : ''}`}>
                {task.title}
              </h3>

              {/* Menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                      }}
                    />
                    <div className="absolute right-0 z-20 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          if (onEdit) onEdit(task);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete();
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Progress Bar (for tasks with sub-tasks) */}
            {task.has_subtasks && expanded && subTasks.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">ความคืบหน้า</span>
                  <span className={`font-medium ${progress.percentage === 100 ? 'text-green-600' : 'text-blue-600'}`}>
                    {progress.completed}/{progress.total} ({progress.percentage}%)
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full transition-all duration-300 ${progress.percentage === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              {task.due_date && (
                <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(task.due_date)}</span>
                  {task.due_time && <span>at {task.due_time}</span>}
                </div>
              )}

              {task.time_estimate > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatTime(task.time_estimate)}</span>
                </div>
              )}

              {task.tags && (
                <div className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  <span>{task.tags}</span>
                </div>
              )}

              {task.location_url && (
                <a
                  href={task.location_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  <span>View Location</span>
                </a>
              )}

              {/* Sub-task indicator */}
              {task.has_subtasks && !expanded && (
                <div className="flex items-center gap-1 text-blue-600">
                  <ListTodo className="h-3.5 w-3.5" />
                  <span>มีงานย่อย</span>
                </div>
              )}
            </div>

            {/* Priority Badge */}
            <div className="mt-2">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityColor(
                  task.priority
                )}`}
              >
                {task.priority}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Sub-Tasks Section - show for all tasks when expanded */}
      {expanded && (
        <div className="border-t bg-gray-50 px-4 py-3">
          {/* Sub-Task List */}
          {subTasks.length === 0 ? (
            <div className="py-2 text-center text-sm text-gray-500">
              ยังไม่มีงานย่อย
            </div>
          ) : (
            <ul className="space-y-2">
              {subTasks.map((subTask) => (
                <li
                  key={subTask.id}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${subTask.status === 'Done'
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-white'
                    }`}
                >
                  <button
                    onClick={() => handleToggleSubTask(subTask.id)}
                    className={`flex-shrink-0 transition-colors ${subTask.status === 'Done' ? 'text-green-600' : 'text-gray-400 hover:text-green-600'
                      }`}
                  >
                    {subTask.status === 'Done' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </button>
                  <span className={`flex-1 ${subTask.status === 'Done' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {subTask.title}
                  </span>
                  <button
                    onClick={() => handleDeleteSubTask(subTask.id)}
                    className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Add Sub-Task */}
          {showAddInput ? (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newSubTaskTitle}
                onChange={(e) => setNewSubTaskTitle(e.target.value)}
                placeholder="ชื่องานย่อย..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSubTask();
                  if (e.key === 'Escape') {
                    setShowAddInput(false);
                    setNewSubTaskTitle('');
                  }
                }}
              />
              <button
                onClick={handleAddSubTask}
                disabled={loading}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                เพิ่ม
              </button>
              <button
                onClick={() => {
                  setShowAddInput(false);
                  setNewSubTaskTitle('');
                }}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
              >
                ยกเลิก
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddInput(true)}
              className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
            >
              <Plus className="h-4 w-4" />
              เพิ่มงานย่อย
            </button>
          )}
        </div>
      )}

      {/* SubTask Modal */}
      {showSubTaskModal && (
        <TaskDetailModal
          task={task}
          onClose={() => {
            setShowSubTaskModal(false);
            fetchTasks(); // Refresh tasks to update has_subtasks flag
          }}
        />
      )}
    </div>
  );
}
