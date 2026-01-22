'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { useTaskStore } from '@/store/useTaskStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import TaskCard from '@/components/tasks/TaskCard';

export default function CalendarPage() {
  const { tasks, fetchTasks } = useTaskStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get start day of week (0 = Sunday)
  const startDayOfWeek = monthStart.getDay();
  const emptyDays = Array(startDayOfWeek).fill(null);

  const getTasksForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return tasks.filter((t) => {
      if (!t.due_date) return false;
      // Handle different date formats from Google Sheets
      // due_date can be: "2025-01-21" (ISO) or Date object string "Thu Jan 21 2025..."
      try {
        const taskDate = new Date(t.due_date);
        if (isNaN(taskDate.getTime())) return false;
        const taskDateStr = format(taskDate, 'yyyy-MM-dd');
        return taskDateStr === dateStr;
      } catch {
        return false;
      }
    });
  };

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <div>
      <Header
        title="Calendar"
        showSearch={false}
        defaultDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined}
      />

      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow">
              {/* Month Navigation */}
              <div className="mb-6 flex items-center justify-between">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="rounded-lg p-2 hover:bg-gray-100"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className="text-xl font-semibold">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="rounded-lg p-2 hover:bg-gray-100"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Weekday Headers */}
              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-500">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for alignment */}
                {emptyDays.map((_, index) => (
                  <div key={`empty-${index}`} className="aspect-square" />
                ))}

                {/* Days */}
                {days.map((day) => {
                  const dayTasks = getTasksForDate(day);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`min-h-[80px] rounded-lg p-1 text-left text-sm transition-colors ${isSelected
                        ? 'bg-blue-600 text-white'
                        : isToday
                          ? 'bg-blue-100 text-blue-900'
                          : 'hover:bg-gray-100'
                        }`}
                    >
                      <div className="flex h-full flex-col">
                        <span className={`font-medium ${!isSameMonth(day, currentMonth) ? 'text-gray-400' : ''}`}>
                          {format(day, 'd')}
                        </span>
                        {dayTasks.length > 0 && (
                          <div className="mt-1 flex flex-col gap-0.5 overflow-hidden">
                            {dayTasks.slice(0, 2).map((task, i) => {
                              const isOverdue = task.status !== 'Done' && new Date(task.due_date) < new Date();
                              return (
                                <div
                                  key={i}
                                  className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight ${isSelected
                                    ? 'bg-white/20 text-white'
                                    : task.status === 'Done'
                                      ? 'bg-green-100 text-green-700'
                                      : isOverdue
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-blue-100 text-blue-700'
                                    }`}
                                  title={task.title}
                                >
                                  {task.title}
                                </div>
                              );
                            })}
                            {dayTasks.length > 2 && (
                              <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                                +{dayTasks.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Date Tasks */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-semibold">
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
            </h3>

            {!selectedDate ? (
              <p className="text-gray-500">Click on a date to see tasks</p>
            ) : selectedDateTasks.length === 0 ? (
              <p className="text-gray-500">No tasks for this date</p>
            ) : (
              <div className="space-y-3">
                {selectedDateTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
