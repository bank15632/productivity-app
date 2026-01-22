'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import TaskList from '@/components/tasks/TaskList';
import QuickAddTask from '@/components/tasks/QuickAddTask';
import { useProjectStore } from '@/store/useProjectStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useNoteStore } from '@/store/useNoteStore';
import { useSubTaskStore } from '@/store/useSubTaskStore';
import { projectsApi } from '@/lib/api';
import { calculateProjectProgress } from '@/lib/utils';
import type { Project, Note } from '@/types';
import { ArrowLeft, Archive, Download, Pencil, Plus, FileText, Trash2, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { projects, fetchProjects, updateProject } = useProjectStore();
  const { tasks, fetchTasks } = useTaskStore();
  const { notes, fetchNotes, createNote, updateNote, deleteNote } = useNoteStore();
  const { getSubTasks, fetchByTask } = useSubTaskStore();
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showEditNoteModal, setShowEditNoteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteMenuOpenId, setNoteMenuOpenId] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [editProject, setEditProject] = useState<{ name: string; description: string; priority: 'High' | 'Medium' | 'Low'; status: Project['status']; category: string }>({ name: '', description: '', priority: 'Medium', status: 'Active', category: '' });
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: '' });
  const [editNoteData, setEditNoteData] = useState({ title: '', content: '', tags: '' });
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchTasks();
    fetchNotes();
  }, [fetchProjects, fetchTasks, fetchNotes]);

  // Fetch subtasks for tasks that have them
  useEffect(() => {
    const tasksWithSubtasks = tasks.filter((t) => t.project_id === projectId && t.has_subtasks);
    tasksWithSubtasks.forEach((task) => {
      fetchByTask(task.id);
    });
  }, [tasks, projectId, fetchByTask]);

  const project = projects.find((p) => p.id === projectId);
  const projectTasks = tasks.filter((t) => t.project_id === projectId);
  const projectNotes = notes.filter((n) => n.project_id === projectId);

  // Calculate progress including subtasks
  const { progress, completed: completedTasks } = calculateProjectProgress(
    projectTasks,
    (taskId) => getSubTasks(taskId)
  );

  const openEditModal = () => {
    if (!project) return;
    setEditProject({
      name: project.name,
      description: project.description || '',
      priority: project.priority,
      status: project.status,
      category: project.category || ''
    });
    setShowEditModal(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    const projectName = typeof editProject.name === 'string' ? editProject.name.trim() : '';
    if (!projectName) {
      toast.error('Please enter a project name');
      return;
    }

    try {
      await updateProject({
        id: project.id,
        name: projectName,
        description: typeof editProject.description === 'string' ? editProject.description : '',
        priority: editProject.priority,
        status: editProject.status,
        category: typeof editProject.category === 'string' ? editProject.category : ''
      });
      toast.success('Project updated!');
      setShowEditModal(false);
    } catch {
      toast.error('Failed to update project');
    }
  };

  const handleArchive = async (deleteAfter: boolean = false) => {
    setArchiving(true);

    try {
      const result = deleteAfter
        ? await projectsApi.downloadAndDelete(projectId)
        : await projectsApi.archive(projectId);

      if (result.success) {
        toast.success(
          deleteAfter
            ? 'Project archived and deleted!'
            : 'Project archived successfully!'
        );

        if ('downloadUrl' in result && typeof result.downloadUrl === 'string') {
          window.open(result.downloadUrl, '_blank');
        }

        if (deleteAfter) {
          router.push('/projects');
        } else {
          fetchProjects();
        }
      } else {
        toast.error(result.error || 'Archive failed');
      }
    } catch {
      toast.error('Failed to archive project');
    } finally {
      setArchiving(false);
      setShowArchiveModal(false);
    }
  };

  if (!project) {
    return (
      <div>
        <Header title="Project" />
        <div className="flex items-center justify-center p-12">
          <p className="text-gray-500">Project not found</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title={project.name} />

      <div className="p-6">
        {/* Back Button */}
        <button
          onClick={() => router.push('/projects')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </button>

        {/* Project Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="mt-2 text-gray-600">{project.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <span
                className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${project.priority === 'High'
                  ? 'bg-red-100 text-red-700'
                  : project.priority === 'Medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                  }`}
              >
                {project.priority} Priority
              </span>
              {project.category && (
                <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                  {project.category}
                </span>
              )}
              <span className="text-sm text-gray-500">
                Status: {project.status}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={openEditModal}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={() => setShowAddTaskModal(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </button>
            <button
              onClick={() => setShowArchiveModal(true)}
              className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-500">Total Tasks</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{projectTasks.length}</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-500">Completed</p>
            <p className="mt-1 text-3xl font-bold text-green-600">{completedTasks}</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-500">Progress</p>
            <p className="mt-1 text-3xl font-bold text-blue-600">{progress.toFixed(0)}%</p>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
            <button
              onClick={() => setShowAddTaskModal(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" />
              New Task
            </button>
          </div>
          <TaskList projectId={projectId} />
        </div>

        {/* Notes Section */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
            <button
              onClick={() => setShowAddNoteModal(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" />
              New Note
            </button>
          </div>

          {projectNotes.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 py-8 text-center">
              <FileText className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-2 text-gray-500">No notes yet</p>
              <button
                onClick={() => setShowAddNoteModal(true)}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Add your first note
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {projectNotes.map((note) => (
                <div
                  key={note.id}
                  className="group relative rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => router.push(`/notes/${note.id}`)}
                    >
                      <h3 className="font-medium text-gray-900 hover:text-blue-600">{note.title}</h3>
                      {note.content && (
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{note.content}</p>
                      )}
                      {note.tags && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {note.tags.split(',').map((tag, idx) => (
                            <span key={idx} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setNoteMenuOpenId(noteMenuOpenId === note.id ? null : note.id)}
                        className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {noteMenuOpenId === note.id && (
                        <div className="absolute right-0 top-8 z-10 w-32 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                          <button
                            onClick={() => {
                              setNoteMenuOpenId(null);
                              setSelectedNote(note);
                              setEditNoteData({ title: note.title, content: note.content || '', tags: note.tags || '' });
                              setShowEditNoteModal(true);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              setNoteMenuOpenId(null);
                              if (confirm('Delete this note?')) {
                                await deleteNote(note.id);
                                toast.success('Note deleted');
                              }
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddTaskModal && (
        <QuickAddTask
          onClose={() => setShowAddTaskModal(false)}
          defaultProjectId={projectId}
        />
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">Edit Project</h2>

            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Project Name
                </label>
                <input
                  type="text"
                  value={editProject.name}
                  onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={editProject.description}
                  onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Category
                </label>
                <input
                  type="text"
                  value={editProject.category}
                  onChange={(e) => setEditProject({ ...editProject, category: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Priority
                  </label>
                  <select
                    value={editProject.priority}
                    onChange={(e) => setEditProject({ ...editProject, priority: e.target.value as 'High' | 'Medium' | 'Low' })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={editProject.status}
                    onChange={(e) => setEditProject({ ...editProject, status: e.target.value as Project['status'] })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="OnHold">On Hold</option>
                    <option value="Done">Done</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold">Archive Project</h3>

            <p className="mb-6 text-gray-600">
              Choose how you want to archive this project:
            </p>

            <div className="mb-6 space-y-3">
              <button
                onClick={() => handleArchive(false)}
                disabled={archiving}
                className="flex w-full items-center gap-3 rounded-lg border-2 border-gray-300 p-4 transition-colors hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50"
              >
                <Archive className="h-5 w-5 text-blue-600" />
                <div className="text-left">
                  <p className="font-semibold">Archive Only</p>
                  <p className="text-sm text-gray-600">Keep project but mark as archived</p>
                </div>
              </button>

              <button
                onClick={() => handleArchive(true)}
                disabled={archiving}
                className="flex w-full items-center gap-3 rounded-lg border-2 border-gray-300 p-4 transition-colors hover:border-red-500 hover:bg-red-50 disabled:opacity-50"
              >
                <Download className="h-5 w-5 text-red-600" />
                <div className="text-left">
                  <p className="font-semibold">Download & Delete</p>
                  <p className="text-sm text-gray-600">Export to file and remove from cloud</p>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowArchiveModal(false)}
              disabled={archiving}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">New Note</h2>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newNote.title.trim()) {
                  toast.error('Please enter a note title');
                  return;
                }
                setSavingNote(true);
                try {
                  await createNote({
                    title: newNote.title,
                    content: newNote.content,
                    tags: newNote.tags,
                    project_id: projectId
                  });
                  toast.success('Note created!');
                  setShowAddNoteModal(false);
                  setNewNote({ title: '', content: '', tags: '' });
                } catch {
                  toast.error('Failed to create note');
                } finally {
                  setSavingNote(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="Note title"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Content
                </label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="Write your note here..."
                  rows={5}
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={newNote.tags}
                  onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                  placeholder="idea, important, research"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(false)}
                  disabled={savingNote}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNote}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                >
                  {savingNote ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    'Create Note'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Note Modal */}
      {showEditNoteModal && selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">Edit Note</h2>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editNoteData.title.trim()) {
                  toast.error('Please enter a note title');
                  return;
                }
                setSavingNote(true);
                try {
                  await updateNote({
                    id: selectedNote.id,
                    title: editNoteData.title,
                    content: editNoteData.content,
                    tags: editNoteData.tags
                  });
                  toast.success('Note updated!');
                  setShowEditNoteModal(false);
                  setSelectedNote(null);
                } catch {
                  toast.error('Failed to update note');
                } finally {
                  setSavingNote(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  value={editNoteData.title}
                  onChange={(e) => setEditNoteData({ ...editNoteData, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Content
                </label>
                <textarea
                  value={editNoteData.content}
                  onChange={(e) => setEditNoteData({ ...editNoteData, content: e.target.value })}
                  rows={5}
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={editNoteData.tags}
                  onChange={(e) => setEditNoteData({ ...editNoteData, tags: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditNoteModal(false);
                    setSelectedNote(null);
                  }}
                  disabled={savingNote}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNote}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[130px]"
                >
                  {savingNote ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
