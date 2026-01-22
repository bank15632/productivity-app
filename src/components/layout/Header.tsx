'use client';

import { useState } from 'react';
import { Search, Bell, Plus } from 'lucide-react';
import QuickAddTask from '@/components/tasks/QuickAddTask';

interface HeaderProps {
  title: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  defaultDate?: string;
}

export default function Header({ title, showSearch = true, onSearch, defaultDate }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
        <div className="flex items-center gap-4">
          {/* Spacer for mobile menu button */}
          <div className="w-10 lg:hidden" />
          <h1 className="text-lg font-bold text-gray-900 lg:text-2xl">{title}</h1>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          {/* Search - Hidden on mobile, visible on desktop */}
          {showSearch && (
            <form onSubmit={handleSearch} className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-40 rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 md:w-64"
              />
            </form>
          )}

          {/* Quick Add Button */}
          <button
            onClick={() => setShowQuickAdd(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 lg:px-4"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Task</span>
          </button>

          {/* Notifications */}
          <button className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
          </button>
        </div>
      </header>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAddTask onClose={() => setShowQuickAdd(false)} defaultDate={defaultDate} />
      )}
    </>
  );
}
