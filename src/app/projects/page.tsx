'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { useProjectStore } from '@/store/useProjectStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useSubTaskStore } from '@/store/useSubTaskStore';
import { calculateProjectProgress } from '@/lib/utils';
import type { Project } from '@/types';
import { Plus, FolderOpen, MoreVertical, Archive, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ProjectsPage() {
  const { projects, loading, fetchProjects, createProject, updateProject, deleteProject } = useProjectStore();
  const { tasks, fetchTasks } = useTaskStore();
  const { getSubTasks, fetchByTask } = useSubTaskStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState<{ name: string; description: string; priority: 'High' | 'Medium' | 'Low'; category: string }>({ name: '', description: '', priority: 'Medium', category: '' });
  const [editProject, setEditProject] = useState<{ name: string; description: string; priority: 'High' | 'Medium' | 'Low'; status: Project['status']; category: string }>({ name: '', description: '', priority: 'Medium', status: 'Active', category: '' });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, [fetchProjects, fetchTasks]);

  // Fetch subtasks for tasks that have them
  useEffect(() => {
    const tasksWithSubtasks = tasks.filter((t) => t.has_subtasks);
    tasksWithSubtasks.forEach((task) => {
      fetchByTask(task.id);
    });
  }, [tasks, fetchByTask]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    setSaving(true);
    try {
      await createProject(newProject);
      toast.success('Project created!');
      setShowCreateModal(false);
      setNewProject({ name: '', description: '', priority: 'Medium', category: '' });
    } catch {
      toast.error('Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (project: Project) => {
    setSelectedProject(project);
    setEditProject({
      name: String(project.name || ''),
      description: String(project.description || ''),
      priority: project.priority,
      status: project.status,
      category: String(project.category || '')
    });
    setShowEditModal(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    const projectName = typeof editProject.name === 'string' ? editProject.name.trim() : '';
    if (!projectName) {
      toast.error('Please enter a project name');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        id: selectedProject.id,
        name: projectName,
        description: typeof editProject.description === 'string' ? editProject.description : '',
        priority: editProject.priority,
        status: editProject.status,
        category: typeof editProject.category === 'string' ? editProject.category : ''
      };
      console.log('Updating project with data:', updateData);
      await updateProject(updateData);
      toast.success('Project updated!');
      setShowEditModal(false);
      setSelectedProject(null);
    } catch {
      toast.error('Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;
    setSaving(true);
    try {
      await deleteProject(selectedProject.id);
      toast.success('Project deleted');
      setShowDeleteModal(false);
      setSelectedProject(null);
    } catch {
      toast.error('Failed to delete project');
    } finally {
      setSaving(false);
    }
  };

  const resolveCategory = (category?: string | number | unknown) => {
    if (category !== undefined && category !== null && category !== '') {
      const categoryStr = String(category).trim();
      return categoryStr || 'Uncategorized';
    }
    return 'Uncategorized';
  };

  // Debug: log projects with their categories
  console.log('Projects with categories:', projects.map(p => ({ id: p.id, name: p.name, category: p.category, resolvedCategory: resolveCategory(p.category) })));

  const categories = Array.from(new Set(projects.map((project) => resolveCategory(project.category))));
  const activeProjects = projects.filter((p) => p.status === 'Active');
  const archivedProjects = projects.filter((p) => p.status === 'Archived');

  const activeGroups = categories
    .map((category) => ({
      category,
      projects: activeProjects.filter((project) => resolveCategory(project.category) === category)
    }))
    .filter((group) => group.projects.length > 0);

  const archivedGroups = categories
    .map((category) => ({
      category,
      projects: archivedProjects.filter((project) => resolveCategory(project.category) === category)
    }))
    .filter((group) => group.projects.length > 0);

  const filteredActiveGroups = selectedCategory === 'All'
    ? activeGroups
    : activeGroups.filter((group) => group.category === selectedCategory);
  const filteredArchivedGroups = selectedCategory === 'All'
    ? archivedGroups
    : archivedGroups.filter((group) => group.category === selectedCategory);
  const filteredActiveProjects = filteredActiveGroups.flatMap((group) => group.projects);
  const filteredArchivedProjects = filteredArchivedGroups.flatMap((group) => group.projects);

  return (
    <div>
      <Header title="Projects" />

      <div className="p-6">
        {/* Header Actions */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-gray-600">
            {filteredActiveProjects.length} active project{filteredActiveProjects.length !== 1 ? 's' : ''}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="All">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {loading && projects.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : filteredActiveProjects.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center">
            <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-500">No projects yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-blue-600 hover:underline"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {filteredActiveGroups.map((group) => (
              <div key={group.category}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {group.category}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {group.projects.length} project{group.projects.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {group.projects.map((project) => {
                    const projectTasks = tasks.filter((t) => t.project_id === project.id);
                    const { progress, completed, total } = calculateProjectProgress(
                      projectTasks,
                      (taskId) => getSubTasks(taskId)
                    );

                    return (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="group rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-100 p-2">
                              <FolderOpen className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                                {project.name}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${project.priority === 'High'
                                    ? 'bg-red-100 text-red-700'
                                    : project.priority === 'Medium'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-green-100 text-green-700'
                                    }`}
                                >
                                  {project.priority}
                                </span>
                                {project.category && (
                                  <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                    {project.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="relative">
                            <button
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                setMenuOpenId(menuOpenId === project.id ? null : project.id);
                              }}
                              className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 group-hover:opacity-100"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {menuOpenId === project.id && (
                              <div className="absolute right-0 top-8 z-10 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                                <button
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setMenuOpenId(null);
                                    openEditModal(project);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Pencil className="h-4 w-4" />
                                  Edit
                                </button>
                                <button
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setMenuOpenId(null);
                                    setSelectedProject(project);
                                    setShowDeleteModal(true);
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

                        {project.description && (
                          <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                            {project.description}
                          </p>
                        )}

                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>{completed}/{total} tasks</span>
                            <span>{progress.toFixed(0)}%</span>
                          </div>
                          <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full bg-blue-600 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Archived Projects */}
        {filteredArchivedGroups.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-700">
              <Archive className="h-5 w-5" />
              Archived Projects ({filteredArchivedProjects.length})
            </h2>
            <div className="space-y-8">
              {filteredArchivedGroups.map((group) => (
                <div key={group.category}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                      {group.category}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {group.projects.length} project{group.projects.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.projects.map((project) => (
                      <div
                        key={project.id}
                        className="rounded-lg bg-gray-100 p-4 opacity-60"
                      >
                        <h3 className="font-medium text-gray-700">{project.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">{project.description}</p>
                        {project.category && (
                          <span className="mt-2 inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {project.category}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">New Project</h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="My Awesome Project"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="What is this project about?"
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
                  value={newProject.category}
                  onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                  placeholder="Work, Personal, Marketing..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Priority
                </label>
                <select
                  value={newProject.priority}
                  onChange={(e) => setNewProject({ ...newProject, priority: e.target.value as 'High' | 'Medium' | 'Low' })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && selectedProject && (
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
                  value={String(editProject.name || '')}
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
                  value={String(editProject.description || '')}
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
                  value={String(editProject.category || '')}
                  onChange={(e) => setEditProject({ ...editProject, category: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="เช่น Work, Personal, Learning..."
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
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProject(null);
                  }}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[130px]"
                >
                  {saving ? (
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

      {/* Delete Project Modal */}
      {showDeleteModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-3 text-xl font-bold text-gray-900">Delete Project</h2>
            <p className="mb-6 text-sm text-gray-600">
              This will permanently remove &quot;{selectedProject.name}&quot; and its related tasks/notes. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedProject(null);
                }}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
