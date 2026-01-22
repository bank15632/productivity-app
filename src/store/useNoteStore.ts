import { create } from 'zustand';
import { notesApi } from '@/lib/api';
import type { Note } from '@/types';

interface NoteStore {
  notes: Note[];
  currentNote: Note | null;
  loading: boolean;
  error: string | null;

  fetchNotes: () => Promise<void>;
  fetchNote: (noteId: string) => Promise<void>;
  createNote: (data: Partial<Note>) => Promise<string | null>;
  updateNote: (data: Partial<Note>) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;

  searchNotes: (query: string) => Note[];
  filterByProject: (projectId: string) => Note[];
  getBacklinks: (noteId: string) => Note[];
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  currentNote: null,
  loading: false,
  error: null,

  fetchNotes: async () => {
    set({ loading: true, error: null });
    try {
      const notes = await notesApi.getAll();
      set({ notes: Array.isArray(notes) ? notes : [], loading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch notes';
      set({ error: message, loading: false });
    }
  },

  fetchNote: async (noteId) => {
    set({ loading: true, error: null });
    try {
      const note = await notesApi.get(noteId);
      set({ currentNote: note, loading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch note';
      set({ error: message, loading: false });
    }
  },

  createNote: async (data) => {
    set({ loading: true });
    try {
      const result = await notesApi.create(data);
      await get().fetchNotes();
      set({ loading: false });
      return result.id || null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create note';
      set({ error: message, loading: false });
      return null;
    }
  },

  updateNote: async (data) => {
    set({ loading: true });
    try {
      await notesApi.update(data);
      await get().fetchNotes();
      if (get().currentNote?.id === data.id) {
        await get().fetchNote(data.id as string);
      }
      set({ loading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update note';
      set({ error: message, loading: false });
    }
  },

  deleteNote: async (noteId) => {
    set({ loading: true });
    try {
      await notesApi.delete(noteId);
      await get().fetchNotes();
      if (get().currentNote?.id === noteId) {
        set({ currentNote: null });
      }
      set({ loading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete note';
      set({ error: message, loading: false });
    }
  },

  searchNotes: (query) => {
    const lowerQuery = query.toLowerCase();
    return get().notes.filter(
      (note) =>
        note.title.toLowerCase().includes(lowerQuery) ||
        note.content?.toLowerCase().includes(lowerQuery) ||
        note.tags?.toLowerCase().includes(lowerQuery)
    );
  },

  filterByProject: (projectId) => {
    return get().notes.filter((note) => note.project_id === projectId);
  },

  getBacklinks: (noteId) => {
    return get().notes.filter((note) => note.linked_notes?.includes(noteId));
  },
}));
