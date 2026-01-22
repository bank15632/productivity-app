'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { useNoteStore } from '@/store/useNoteStore';
import { Plus, FileText, Search } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function NotesPage() {
  const { notes, loading, fetchNotes, searchNotes } = useNoteStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const displayedNotes = searchQuery ? searchNotes(searchQuery) : notes;

  return (
    <div>
      <Header title="Notes" />

      <div className="p-6">
        {/* Header Actions */}
        <div className="mb-6 flex items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <Link
            href="/notes/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Note
          </Link>
        </div>

        {/* Notes Grid */}
        {loading && notes.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : displayedNotes.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-500">
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </p>
            {!searchQuery && (
              <Link
                href="/notes/new"
                className="mt-4 inline-block text-blue-600 hover:underline"
              >
                Create your first note
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedNotes.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="group rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
              >
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-1">
                  {note.title || 'Untitled'}
                </h3>

                {note.content && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                    {String(note.content).replace(/<[^>]*>/g, '').substring(0, 150)}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                  <span>{formatDate(note.updated_at)}</span>
                  {note.tags && (
                    <span className="truncate max-w-[150px]">{note.tags}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
