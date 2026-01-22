'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle, Circle, ListTodo, Calendar, Tag, Clock } from 'lucide-react';
import { useSubTaskStore } from '@/store/useSubTaskStore';
import { useTaskStore } from '@/store/useTaskStore';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { formatDate, formatTime, getPriorityColor } from '@/lib/utils';
import type { Task } from '@/types';
import toast from 'react-hot-toast';

interface TaskDetailModalProps {
    task: Task;
    onClose: () => void;
}

export default function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
    const { loading, fetchByTask, createSubTask, deleteSubTask, toggleStatus, getSubTasks, getProgress } = useSubTaskStore();
    const { fetchTasks, updateTask } = useTaskStore();
    const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
    const [showAddInput, setShowAddInput] = useState(false);

    // Get subtasks and progress for this specific task
    const subTasks = getSubTasks(task.id);
    const progress = getProgress(task.id);

    useEffect(() => {
        fetchByTask(task.id);
    }, [task.id, fetchByTask]);

    const handleAddSubTask = async () => {
        if (!newSubTaskTitle.trim()) {
            toast.error('กรุณาใส่ชื่องานย่อย');
            return;
        }

        await createSubTask({
            parent_task_id: task.id,
            title: newSubTaskTitle.trim(),
        });

        // Update task to mark as has_subtasks if this is the first subtask
        if (!task.has_subtasks) {
            await updateTask({ id: task.id, has_subtasks: true });
            await fetchTasks();
        }

        setNewSubTaskTitle('');
        setShowAddInput(false);
        toast.success('เพิ่มงานย่อยเรียบร้อย!');
    };

    const handleToggleStatus = async (subTaskId: string) => {
        const result = await toggleStatus(subTaskId);
        if (result && result.percentage === 100) {
            toast.success('🎉 Task เสร็จสมบูรณ์! งานย่อยครบ 100%');
            await fetchTasks(); // Refresh parent tasks
        }
    };

    const handleDeleteSubTask = async (subTaskId: string) => {
        const confirmed = window.confirm('ต้องการลบงานย่อยนี้?');
        if (!confirmed) return;

        await deleteSubTask(subTaskId);

        // Check if all subtasks are deleted
        const remainingSubTasks = subTasks.filter(st => st.id !== subTaskId);
        if (remainingSubTasks.length === 0 && task.has_subtasks) {
            await updateTask({ id: task.id, has_subtasks: false });
            await fetchTasks();
        }

        toast.success('ลบงานย่อยเรียบร้อย');
    };

    return (
        <>
            <LoadingOverlay isLoading={loading} message="กำลังดำเนินการ..." />

            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl">
                    {/* Header */}
                    <div className="sticky top-0 z-10 border-b bg-white p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ListTodo className="h-5 w-5 text-blue-600" />
                                <h2 className="text-lg font-bold">รายละเอียด Task</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Task Title */}
                        <h3 className="mt-2 text-xl font-semibold text-gray-900">{task.title}</h3>

                        {/* Task Description */}
                        {task.description && (
                            <p className="mt-1 text-sm text-gray-600">{task.description}</p>
                        )}

                        {/* Task Meta Info */}
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            {task.due_date && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{formatDate(task.due_date)}</span>
                                    {task.due_time && <span>เวลา {task.due_time}</span>}
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
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                            </span>
                        </div>

                        {/* Progress Bar */}
                        {subTasks.length > 0 && (
                            <div className="mt-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">ความคืบหน้างานย่อย</span>
                                    <span className={`font-medium ${progress.percentage === 100 ? 'text-green-600' : 'text-blue-600'}`}>
                                        {progress.completed}/{progress.total} ({progress.percentage}%)
                                    </span>
                                </div>
                                <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
                                    <div
                                        className={`h-full transition-all duration-300 ${progress.percentage === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                        style={{ width: `${progress.percentage}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sub-Tasks List */}
                    <div className="p-4">
                        <h4 className="mb-3 font-semibold text-gray-700 flex items-center gap-2">
                            <ListTodo className="h-4 w-4" />
                            งานย่อย (Sub-Tasks)
                        </h4>
                        {subTasks.length === 0 && !showAddInput ? (
                            <div className="py-8 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                                <ListTodo className="mx-auto h-12 w-12 text-gray-300" />
                                <p className="mt-2">ยังไม่มีงานย่อย</p>
                                <p className="text-xs text-gray-400 mt-1">แบ่งงานใหญ่เป็นงานย่อยเพื่อติดตามความคืบหน้าได้ง่ายขึ้น</p>
                                <button
                                    onClick={() => setShowAddInput(true)}
                                    className="mt-3 inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    <Plus className="h-4 w-4" />
                                    เพิ่มงานย่อย
                                </button>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {subTasks.map((subTask) => (
                                    <li
                                        key={subTask.id}
                                        className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${subTask.status === 'Done'
                                                ? 'border-green-200 bg-green-50'
                                                : 'border-gray-200 bg-white hover:bg-gray-50'
                                            }`}
                                    >
                                        <button
                                            onClick={() => handleToggleStatus(subTask.id)}
                                            className={`flex-shrink-0 rounded-full p-1 transition-colors ${subTask.status === 'Done'
                                                    ? 'text-green-600'
                                                    : 'text-gray-400 hover:text-green-600'
                                                }`}
                                        >
                                            {subTask.status === 'Done' ? (
                                                <CheckCircle className="h-5 w-5" />
                                            ) : (
                                                <Circle className="h-5 w-5" />
                                            )}
                                        </button>
                                        <span
                                            className={`flex-1 ${subTask.status === 'Done' ? 'text-gray-500 line-through' : 'text-gray-900'
                                                }`}
                                        >
                                            {subTask.title}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteSubTask(subTask.id)}
                                            className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* Add Sub-Task Input */}
                        {showAddInput && (
                            <div className="mt-4 flex gap-2">
                                <input
                                    type="text"
                                    value={newSubTaskTitle}
                                    onChange={(e) => setNewSubTaskTitle(e.target.value)}
                                    placeholder="ชื่องานย่อย..."
                                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    เพิ่ม
                                </button>
                                <button
                                    onClick={() => {
                                        setShowAddInput(false);
                                        setNewSubTaskTitle('');
                                    }}
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-gray-600 hover:bg-gray-100"
                                >
                                    ยกเลิก
                                </button>
                            </div>
                        )}

                        {/* Add Button (when list has items) */}
                        {subTasks.length > 0 && !showAddInput && (
                            <button
                                onClick={() => setShowAddInput(true)}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
                            >
                                <Plus className="h-4 w-4" />
                                เพิ่มงานย่อย
                            </button>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t p-4">
                        <button
                            onClick={onClose}
                            className="w-full rounded-lg bg-gray-100 py-2 font-medium text-gray-700 hover:bg-gray-200"
                        >
                            ปิด
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
