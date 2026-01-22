'use client';

import Header from '@/components/layout/Header';
import TaskList from '@/components/tasks/TaskList';

export default function TasksPage() {
  return (
    <div>
      <Header title="Tasks" />
      <div className="p-6">
        <TaskList />
      </div>
    </div>
  );
}
