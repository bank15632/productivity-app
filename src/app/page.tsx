'use client';

import { useEffect } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useSubTaskStore } from '@/store/useSubTaskStore';
import { calculateProjectProgress } from '@/lib/utils';
import Header from '@/components/layout/Header';
import TaskCard from '@/components/tasks/TaskCard';
import { CheckCircle, Clock, AlertTriangle, FolderOpen, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { tasks, fetchTasks } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();
  const { getSubTasks, fetchByTask } = useSubTaskStore();

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [fetchTasks, fetchProjects]);

  // Fetch subtasks for tasks that have them
  useEffect(() => {
    const tasksWithSubtasks = tasks.filter((t) => t.has_subtasks);
    tasksWithSubtasks.forEach((task) => {
      fetchByTask(task.id);
    });
  }, [tasks, fetchByTask]);

  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Done').length;
  const pendingTasks = tasks.filter((t) => t.status === 'ToDo').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'Doing').length;

  // Today's tasks
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => t.due_date === today);

  // Overdue tasks
  const overdueTasks = tasks.filter(
    (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Done'
  );

  // Active projects
  const activeProjects = projects.filter((p) => p.status === 'Active');

  return (
    <div>
      <Header title="Dashboard" />

      <div className="p-6">
        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{totalTasks}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {completedTasks} completed, {pendingTasks} pending
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{inProgressTasks}</p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">Tasks being worked on</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Overdue</p>
                <p className="mt-1 text-3xl font-bold text-red-600">{overdueTasks.length}</p>
              </div>
              <div className="rounded-full bg-red-100 p-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">Need attention</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Projects</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{activeProjects.length}</p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <FolderOpen className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {projects.length} total projects
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Today's Tasks */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Tasks</h2>
              <Link href="/tasks" className="text-sm text-blue-600 hover:underline">
                View all
              </Link>
            </div>

            {todayTasks.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500">No tasks due today</p>
                <p className="mt-1 text-sm text-gray-400">Great job! 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayTasks.slice(0, 5).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {todayTasks.length > 5 && (
                  <p className="text-center text-sm text-gray-500">
                    +{todayTasks.length - 5} more tasks
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Overdue Tasks */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Overdue Tasks</h2>
              <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-600">
                {overdueTasks.length}
              </span>
            </div>

            {overdueTasks.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500">No overdue tasks</p>
                <p className="mt-1 text-sm text-gray-400">You&apos;re on track! ✨</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overdueTasks.slice(0, 5).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {overdueTasks.length > 5 && (
                  <p className="text-center text-sm text-gray-500">
                    +{overdueTasks.length - 5} more overdue
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Quick Overview</h2>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {activeProjects.slice(0, 4).map((project) => {
              const projectTasks = tasks.filter((t) => t.project_id === project.id);
              const { progress, completed, total } = calculateProjectProgress(
                projectTasks,
                (taskId) => getSubTasks(taskId)
              );

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-500"
                >
                  <p className="font-medium text-gray-900 truncate">{project.name}</p>
                  <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-blue-600 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {completed}/{total} tasks
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
