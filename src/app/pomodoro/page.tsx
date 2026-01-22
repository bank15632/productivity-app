'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { useTaskStore } from '@/store/useTaskStore';
import { Play, Pause, RotateCcw, Coffee, Brain, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const TIMER_SETTINGS = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export default function PomodoroPage() {
  const { tasks, fetchTasks, updateTask } = useTaskStore();
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(TIMER_SETTINGS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use refs to access latest values in interval callback
  const modeRef = useRef(mode);
  const sessionsRef = useRef(sessions);
  const selectedTaskIdRef = useRef(selectedTaskId);
  const tasksRef = useRef(tasks);

  // Keep refs in sync
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);
  useEffect(() => { selectedTaskIdRef.current = selectedTaskId; }, [selectedTaskId]);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTimerComplete = useCallback(() => {
    const currentMode = modeRef.current;
    const currentSessions = sessionsRef.current;
    const currentSelectedTaskId = selectedTaskIdRef.current;
    const currentTasks = tasksRef.current;

    setIsRunning(false);

    if (currentMode === 'work') {
      setSessions((prev) => prev + 1);
      toast.success('Great work! Time for a break 🎉');

      // Update task time spent if selected
      if (currentSelectedTaskId) {
        const task = currentTasks.find((t) => t.id === currentSelectedTaskId);
        if (task) {
          updateTask({
            id: currentSelectedTaskId,
            time_spent: (task.time_spent || 0) + 25,
          });
        }
      }

      // After 4 sessions, suggest long break
      if ((currentSessions + 1) % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(TIMER_SETTINGS.longBreak);
      } else {
        setMode('shortBreak');
        setTimeLeft(TIMER_SETTINGS.shortBreak);
      }
    } else {
      toast.success('Break is over! Ready to work? 💪');
      setMode('work');
      setTimeLeft(TIMER_SETTINGS.work);
    }

    // Play notification sound
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Pomodoro Timer', {
          body: currentMode === 'work' ? 'Time for a break!' : 'Break is over!',
        });
      }
    }
  }, [updateTask]);

  // Handle timer tick - all logic in interval callback
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer complete - handle in callback to avoid effect setState issues
            setTimeout(handleTimerComplete, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, handleTimerComplete]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(TIMER_SETTINGS[mode]);
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(TIMER_SETTINGS[newMode]);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((TIMER_SETTINGS[mode] - timeLeft) / TIMER_SETTINGS[mode]) * 100;

  const activeTasks = tasks.filter((t) => t.status !== 'Done');

  return (
    <div>
      <Header title="Pomodoro Timer" showSearch={false} />

      <div className="p-6">
        <div className="mx-auto max-w-2xl">
          {/* Timer Card */}
          <div className="rounded-lg bg-white p-8 shadow">
            {/* Mode Tabs */}
            <div className="mb-8 flex justify-center gap-2">
              <button
                onClick={() => switchMode('work')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  mode === 'work'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Brain className="h-4 w-4" />
                Work
              </button>
              <button
                onClick={() => switchMode('shortBreak')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  mode === 'shortBreak'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Coffee className="h-4 w-4" />
                Short Break
              </button>
              <button
                onClick={() => switchMode('longBreak')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  mode === 'longBreak'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Coffee className="h-4 w-4" />
                Long Break
              </button>
            </div>

            {/* Timer Display */}
            <div className="relative mb-8 flex justify-center">
              <div className="relative h-64 w-64">
                {/* Progress Ring */}
                <svg className="h-full w-full -rotate-90 transform">
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke={
                      mode === 'work'
                        ? '#3b82f6'
                        : mode === 'shortBreak'
                        ? '#22c55e'
                        : '#a855f7'
                    }
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 120}
                    strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                    className="transition-all duration-1000"
                  />
                </svg>

                {/* Time Display */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl font-bold text-gray-900">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              <button
                onClick={toggleTimer}
                className={`flex h-16 w-16 items-center justify-center rounded-full text-white transition-colors ${
                  mode === 'work'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : mode === 'shortBreak'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {isRunning ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8 ml-1" />
                )}
              </button>
              <button
                onClick={resetTimer}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-colors hover:bg-gray-300"
              >
                <RotateCcw className="h-6 w-6" />
              </button>
            </div>

            {/* Sessions Counter */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Sessions completed today: <span className="font-bold">{sessions}</span>
              </p>
            </div>
          </div>

          {/* Task Selection */}
          <div className="mt-6 rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 font-semibold text-gray-900">Working on:</h3>

            {activeTasks.length === 0 ? (
              <p className="text-gray-500">No active tasks. Create one to track your work!</p>
            ) : (
              <div className="space-y-2">
                {activeTasks.slice(0, 5).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
                      selectedTaskId === task.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CheckCircle
                      className={`h-5 w-5 ${
                        selectedTaskId === task.id ? 'text-blue-600' : 'text-gray-400'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{task.title}</p>
                      {task.time_spent > 0 && (
                        <p className="text-sm text-gray-500">
                          Time spent: {task.time_spent} min
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
