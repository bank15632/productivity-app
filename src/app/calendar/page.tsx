'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Header from '@/components/layout/Header';
import { useTaskStore } from '@/store/useTaskStore';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw, LogOut, Check } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import TaskCard from '@/components/tasks/TaskCard';
import toast from 'react-hot-toast';

interface GoogleEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const { tasks, fetchTasks } = useTaskStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [googleEvents, setGoogleEvents] = useState<GoogleEvent[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Fetch Google Calendar events when connected
  useEffect(() => {
    if (session?.accessToken) {
      fetchGoogleEvents();
    }
  }, [session?.accessToken, currentMonth]);

  const fetchGoogleEvents = async () => {
    console.log('[Calendar] fetchGoogleEvents called');
    console.log('[Calendar] session?.accessToken:', !!session?.accessToken);

    if (!session?.accessToken) {
      console.log('[Calendar] No access token, skipping fetch');
      return;
    }

    setLoadingEvents(true);
    try {
      const timeMin = startOfMonth(currentMonth).toISOString();
      const timeMax = endOfMonth(currentMonth).toISOString();

      console.log('[Calendar] Fetching events from', timeMin, 'to', timeMax);

      const response = await fetch(`/api/calendar?timeMin=${timeMin}&timeMax=${timeMax}`);
      const data = await response.json();

      console.log('[Calendar] Response:', data);
      console.log('[Calendar] Events count:', data.events?.length || 0);

      if (data.events) {
        setGoogleEvents(data.events);
      } else if (data.error) {
        console.error('[Calendar] API Error:', data.error);
        toast.error('Failed to load Google Calendar: ' + data.error);
      }
    } catch (error) {
      console.error('[Calendar] Failed to fetch Google Calendar events:', error);
      toast.error('Failed to load Google Calendar events');
    } finally {
      setLoadingEvents(false);
    }
  };

  const syncTasksToGoogle = async () => {
    if (!session?.accessToken) {
      toast.error('Please connect Google Calendar first');
      return;
    }

    setSyncing(true);
    let syncedCount = 0;

    try {
      for (const task of tasks) {
        // Skip tasks that already have calendar_event_id (already synced)
        if (task.calendar_event_id) continue;

        if (task.due_date && task.status !== 'Done') {
          const dueDate = new Date(task.due_date);
          if (task.due_time) {
            const [hours, minutes] = task.due_time.split(':');
            dueDate.setHours(parseInt(hours), parseInt(minutes));
          } else {
            dueDate.setHours(9, 0, 0, 0);
          }

          const endDate = new Date(dueDate);
          endDate.setHours(endDate.getHours() + 1);

          const response = await fetch('/api/calendar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create',
              event: {
                title: task.title,
                description: task.description || '',
                start: dueDate.toISOString(),
                end: endDate.toISOString(),
                allDay: !task.due_time,
              },
            }),
          });

          const data = await response.json();

          // Update task with calendar_event_id
          if (data.success && data.event?.id) {
            await fetch('/api/proxy?action=updateTask', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: task.id,
                calendar_event_id: data.event.id,
              }),
            });
          }

          syncedCount++;
        }
      }

      if (syncedCount > 0) {
        toast.success(`Synced ${syncedCount} tasks to Google Calendar`);
        await fetchTasks(); // Refresh tasks to get updated calendar_event_id
      } else {
        toast.success('All tasks are already synced');
      }
      await fetchGoogleEvents();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync tasks');
    } finally {
      setSyncing(false);
    }
  };

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

  // Get task calendar_event_ids to filter out from Google events
  const taskCalendarEventIds = new Set(
    tasks.filter(t => t.calendar_event_id).map(t => t.calendar_event_id)
  );

  const getGoogleEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return googleEvents.filter((event) => {
      // Skip events that are already shown as tasks
      if (taskCalendarEventIds.has(event.id)) return false;

      const eventDate = event.start?.dateTime || event.start?.date;
      if (!eventDate) return false;
      const eventDateStr = format(new Date(eventDate), 'yyyy-MM-dd');
      return eventDateStr === dateStr;
    });
  };

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];
  const selectedDateGoogleEvents = selectedDate ? getGoogleEventsForDate(selectedDate) : [];

  return (
    <div>
      <Header
        title="Calendar"
        showSearch={false}
        defaultDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined}
      />

      <div className="p-6">
        {/* Google Calendar Connection Banner */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-medium text-gray-900">Google Calendar</h3>
                {status === 'loading' ? (
                  <p className="text-sm text-gray-500">Loading...</p>
                ) : session ? (
                  <p className="flex items-center gap-1 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    Connected as {session.user?.email}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Connect to sync your tasks</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {session ? (
                <>
                  <button
                    onClick={syncTasksToGoogle}
                    disabled={syncing}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {syncing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Sync Tasks
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={() => signIn('google')}
                  disabled={status === 'loading'}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Connect Google Calendar
                </button>
              )}
            </div>
          </div>
        </div>

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
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">
                    {format(currentMonth, 'MMMM yyyy')}
                  </h2>
                  {loadingEvents && (
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                  )}
                </div>
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
                  const dayGoogleEvents = getGoogleEventsForDate(day);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const hasItems = dayTasks.length > 0 || dayGoogleEvents.length > 0;

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
                        {hasItems && (
                          <div className="mt-1 flex flex-col gap-0.5 overflow-hidden">
                            {/* Tasks */}
                            {dayTasks.slice(0, 1).map((task, i) => {
                              const isOverdue = task.status !== 'Done' && new Date(task.due_date) < new Date();
                              return (
                                <div
                                  key={`task-${i}`}
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
                            {/* Google Events */}
                            {dayGoogleEvents.slice(0, 1).map((event, i) => (
                              <div
                                key={`gcal-${i}`}
                                className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight ${isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-purple-100 text-purple-700'
                                  }`}
                                title={event.summary}
                              >
                                📅 {event.summary}
                              </div>
                            ))}
                            {(dayTasks.length + dayGoogleEvents.length) > 2 && (
                              <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                                +{dayTasks.length + dayGoogleEvents.length - 2} more
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

          {/* Selected Date Panel */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-semibold">
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
            </h3>

            {!selectedDate ? (
              <p className="text-gray-500">Click on a date to see tasks</p>
            ) : (
              <div className="space-y-4">
                {/* Tasks Section */}
                {selectedDateTasks.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-600">Tasks</h4>
                    <div className="space-y-2">
                      {selectedDateTasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Google Events Section */}
                {selectedDateGoogleEvents.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-purple-600">📅 Google Calendar</h4>
                    <div className="space-y-2">
                      {selectedDateGoogleEvents.map((event) => (
                        <div
                          key={event.id}
                          className="rounded-lg border border-purple-200 bg-purple-50 p-3"
                        >
                          <p className="font-medium text-purple-900">{event.summary}</p>
                          {event.start?.dateTime && (
                            <p className="text-sm text-purple-600">
                              {format(new Date(event.start.dateTime), 'h:mm a')}
                              {event.end?.dateTime &&
                                ` - ${format(new Date(event.end.dateTime), 'h:mm a')}`
                              }
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDateTasks.length === 0 && selectedDateGoogleEvents.length === 0 && (
                  <p className="text-gray-500">No events for this date</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
