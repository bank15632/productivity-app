'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useNoteStore } from '@/store/useNoteStore';
import { useProjectStore } from '@/store/useProjectStore';
import { ArrowLeft, Save, Hash, Link as LinkIcon, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NoteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const noteId = params.id as string;
  const isNew = noteId === 'new';
  const defaultProjectId = searchParams.get('projectId') || '';

  const { currentNote, fetchNote, createNote, updateNote, getBacklinks } = useNoteStore();
  const { projects, fetchProjects } = useProjectStore();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId);

  useEffect(() => {
    fetchProjects();
    if (!isNew) {
      fetchNote(noteId);
    }
  }, [noteId, isNew, fetchNote, fetchProjects]);

  useEffect(() => {
    if (currentNote && !isNew) {
      setTitle(currentNote.title || '');
      setContent(currentNote.content || '');
      setTags(currentNote.tags || '');
      setProjectId(currentNote.project_id || '');
    }
  }, [currentNote, isNew]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setSaving(true);

    try {
      // Extract [[wiki-links]] from content
      const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
      const linkedNotes: string[] = [];
      let match;

      while ((match = wikiLinkRegex.exec(content)) !== null) {
        linkedNotes.push(match[1]);
      }

      const noteData = {
        title,
        content,
        tags,
        linked_notes: linkedNotes.join(','),
        project_id: projectId || undefined,
      };

      if (isNew) {
        const newId = await createNote(noteData);
        if (newId) {
          toast.success('Note created!');
          router.push(`/notes/${newId}`);
        }
      } else {
        await updateNote({ id: noteId, ...noteData });
        toast.success('Note saved!');
      }
    } catch {
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const backlinks = !isNew ? getBacklinks(noteId) : [];

  return (
    <div>
      <Header title={isNew ? 'New Note' : 'Edit Note'} showSearch={false} />

      <div className="mx-auto max-w-4xl p-6">
        {/* Back Button */}
        <button
          onClick={() => router.push('/notes')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Notes
        </button>

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          className="mb-4 w-full border-b-2 border-gray-200 px-2 py-2 text-3xl font-bold focus:border-blue-500 focus:outline-none"
        />

        {/* Tags */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
            <Hash className="h-4 w-4" />
            Tags
          </div>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Add tags (comma separated)"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Project Selector */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
            <FolderOpen className="h-4 w-4" />
            Project (Optional)
          </div>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">No Project (General Note)</option>
            {projects
              .filter((p) => p.status === 'Active')
              .map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
          </select>
        </div>

        {/* Content */}
        <div className="mb-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing... Use [[Page Name]] to create links to other notes"
            rows={20}
            className="w-full resize-none rounded-lg border border-gray-300 p-4 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Info */}
        <div className="mb-6 rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Use{' '}
            <code className="rounded bg-blue-100 px-1">[[Page Name]]</code> to create links to other notes.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Note'}
          </button>
        </div>

        {/* Backlinks */}
        {backlinks.length > 0 && (
          <div className="mt-8 rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
              <LinkIcon className="h-5 w-5" />
              Backlinks ({backlinks.length})
            </h3>
            <div className="space-y-2">
              {backlinks.map((backlink) => (
                <button
                  key={backlink.id}
                  onClick={() => router.push(`/notes/${backlink.id}`)}
                  className="block w-full rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-blue-500 hover:bg-blue-50"
                >
                  <p className="font-medium text-gray-900">{backlink.title}</p>
                  {backlink.tags && (
                    <p className="mt-1 text-sm text-gray-500">{backlink.tags}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
