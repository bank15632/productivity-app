'use client';

import { useEffect, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { useTaskStore } from '@/store/useTaskStore';
import { useProjectStore } from '@/store/useProjectStore';
import { CheckCircle, Clock, TrendingUp, Target } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { format, subDays } from 'date-fns';

export default function AnalyticsPage() {
  const { tasks, fetchTasks } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [fetchTasks, fetchProjects]);

  // Calculate stats
  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.status === 'Done').length;
    const total = tasks.length;
    const totalTimeSpent = tasks.reduce((sum, t) => sum + (t.time_spent || 0), 0);
    const avgTimePerTask = completed > 0 ? totalTimeSpent / completed : 0;

    return {
      total,
      completed,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      totalTimeSpent,
      avgTimePerTask,
    };
  }, [tasks]);

  // Weekly data
  const weeklyData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTasks = tasks.filter((t) => t.due_date === dateStr);
      const completed = dayTasks.filter((t) => t.status === 'Done').length;

      return {
        date: format(date, 'EEE'),
        fullDate: dateStr,
        completed,
        created: dayTasks.length,
      };
    });

    return last7Days;
  }, [tasks]);

  // Status distribution
  const statusData = useMemo(() => {
    return [
      { name: 'To Do', value: tasks.filter((t) => t.status === 'ToDo').length, color: '#6b7280' },
      { name: 'Doing', value: tasks.filter((t) => t.status === 'Doing').length, color: '#3b82f6' },
      { name: 'Done', value: tasks.filter((t) => t.status === 'Done').length, color: '#22c55e' },
    ];
  }, [tasks]);

  // Priority distribution
  const priorityData = useMemo(() => {
    return [
      { name: 'High', value: tasks.filter((t) => t.priority === 'High').length, color: '#ef4444' },
      { name: 'Medium', value: tasks.filter((t) => t.priority === 'Medium').length, color: '#f59e0b' },
      { name: 'Low', value: tasks.filter((t) => t.priority === 'Low').length, color: '#22c55e' },
    ];
  }, [tasks]);

  // Time by project
  const projectTimeData = useMemo(() => {
    return projects
      .filter((project) => project.name && typeof project.name === 'string')
      .map((project) => {
        const projectTasks = tasks.filter((t) => t.project_id === project.id);
        const totalTime = projectTasks.reduce((sum, t) => sum + (t.time_spent || 0), 0);
        return {
          project: String(project.name).substring(0, 15),
          time: Math.round(totalTime / 60 * 10) / 10, // Hours
        };
      })
      .filter((p) => p.time > 0)
      .slice(0, 6);
  }, [tasks, projects]);

  return (
    <div>
      <Header title="Analytics" showSearch={false} />

      <div className="p-6">
        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {stats.completionRate.toFixed(0)}%
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Tasks Completed</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{stats.completed}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Time Spent</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {Math.round(stats.totalTimeSpent / 60)}h
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg Time/Task</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {Math.round(stats.avgTimePerTask)}m
                </p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Weekly Progress */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 font-semibold text-gray-900">Weekly Progress</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 font-semibold text-gray-900">Tasks by Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Priority Distribution */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 font-semibold text-gray-900">Tasks by Priority</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8">
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Time by Project */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 font-semibold text-gray-900">Time Spent by Project (Hours)</h3>
            {projectTimeData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center">
                <p className="text-gray-500">No time tracked yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="project" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="time" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
