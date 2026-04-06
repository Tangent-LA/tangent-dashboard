'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, MoreVertical, Edit, Trash2, X,
  FolderKanban, Users, Clock, Calendar, AlertCircle, FileCode,
  ChevronDown, ExternalLink, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI, teamsAPI } from '@/lib/store';
import type { Project, Team, RevitFileMapping } from '@/lib/supabase';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRevitModal, setShowRevitModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [revitFiles, setRevitFiles] = useState<RevitFileMapping[]>([]);

  const fetchData = async () => {
    try {
      const [projectsData, teamsData] = await Promise.all([
        projectsAPI.list(),
        teamsAPI.list(),
      ]);
      setProjects(projectsData);
      setTeams(teamsData);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = 
      p.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.project_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProject = async (data: any) => {
    try {
      const newProject = await projectsAPI.create(data);
      setProjects([...projects, newProject]);
      setShowCreateModal(false);
      toast.success('Project created successfully');
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  const handleUpdateProject = async (data: any) => {
    if (!selectedProject) return;
    try {
      const updated = await projectsAPI.update(selectedProject.id, data);
      setProjects(projects.map((p) => (p.id === updated.id ? updated : p)));
      setShowEditModal(false);
      setSelectedProject(null);
      toast.success('Project updated successfully');
    } catch (error) {
      toast.error('Failed to update project');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await projectsAPI.delete(id);
      setProjects(projects.filter((p) => p.id !== id));
      toast.success('Project deleted');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const openRevitModal = async (project: Project) => {
    setSelectedProject(project);
    try {
      const data = await projectsAPI.get(project.id);
      setRevitFiles(data.revit_files || []);
      setShowRevitModal(true);
    } catch (error) {
      toast.error('Failed to load Revit files');
    }
  };

  const handleAddRevitFile = async (filename: string, description: string) => {
    if (!selectedProject) return;
    try {
      const mapping = await projectsAPI.addRevitFile(selectedProject.id, {
        revit_filename: filename,
        description,
      });
      setRevitFiles([...revitFiles, mapping]);
      toast.success('Revit file mapping added');
    } catch (error) {
      toast.error('Failed to add mapping');
    }
  };

  const handleRemoveRevitFile = async (mappingId: string) => {
    try {
      await projectsAPI.removeRevitFile(mappingId);
      setRevitFiles(revitFiles.filter((f) => f.id !== mappingId));
      toast.success('Mapping removed');
    } catch (error) {
      toast.error('Failed to remove mapping');
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return 'badge-critical';
      case 'high': return 'badge-high';
      case 'medium': return 'badge-medium';
      default: return 'badge-low';
    }
  };

  const getDeadlineStatus = (deadline: string | null) => {
    if (!deadline) return null;
    const d = new Date(deadline);
    const now = new Date();
    const days = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days < 0) return { text: 'Overdue', class: 'text-rose-600 bg-rose-50' };
    if (days <= 3) return { text: `${days}d left`, class: 'text-rose-600 bg-rose-50' };
    if (days <= 7) return { text: `${days}d left`, class: 'text-amber-600 bg-amber-50' };
    return { text: `${days}d left`, class: 'text-emerald-600 bg-emerald-50' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-600 spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
          <p className="text-slate-500">Manage projects and Revit file mappings</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-medium"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const deadlineStatus = getDeadlineStatus(project.deadline);
          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                    <FolderKanban className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{project.project_code}</h3>
                    <p className="text-sm text-slate-500 truncate max-w-[150px]">
                      {project.project_name}
                    </p>
                  </div>
                </div>
                <div className="relative group">
                  <button className="p-2 hover:bg-slate-100 rounded-lg">
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <button
                      onClick={() => {
                        setSelectedProject(project);
                        setShowEditModal(true);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-t-xl"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => openRevitModal(project)}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      <FileCode className="w-4 h-4" />
                      Revit Files
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 rounded-b-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {project.client_name && (
                <p className="text-sm text-slate-600 mb-4">{project.client_name}</p>
              )}

              <div className="flex items-center gap-2 mb-4">
                <span className={`badge ${getPriorityBadge(project.priority)}`}>
                  {project.priority}
                </span>
                <span className="badge badge-active">{project.status}</span>
                {project.revit_files_count ? (
                  <span className="badge bg-slate-100 text-slate-600">
                    {project.revit_files_count} files
                  </span>
                ) : null}
              </div>

              <div className="space-y-2 text-sm">
                {project.team_name && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users className="w-4 h-4 text-slate-400" />
                    {project.team_name}
                  </div>
                )}
                {project.total_hours !== undefined && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {project.total_hours.toFixed(1)} hours logged
                  </div>
                )}
                {project.deadline && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">
                      {new Date(project.deadline).toLocaleDateString()}
                    </span>
                    {deadlineStatus && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${deadlineStatus.class}`}>
                        {deadlineStatus.text}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => openRevitModal(project)}
                className="mt-4 w-full py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <FileCode className="w-4 h-4" />
                Manage Revit Files
              </button>
            </motion.div>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No projects found</p>
        </div>
      )}

      {/* Create Project Modal */}
      <ProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
        teams={teams}
        title="Create New Project"
      />

      {/* Edit Project Modal */}
      <ProjectModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProject(null);
        }}
        onSubmit={handleUpdateProject}
        teams={teams}
        project={selectedProject}
        title="Edit Project"
      />

      {/* Revit Files Modal */}
      <RevitFilesModal
        isOpen={showRevitModal}
        onClose={() => {
          setShowRevitModal(false);
          setSelectedProject(null);
          setRevitFiles([]);
        }}
        project={selectedProject}
        files={revitFiles}
        onAdd={handleAddRevitFile}
        onRemove={handleRemoveRevitFile}
      />
    </div>
  );
}

// Project Modal Component
function ProjectModal({
  isOpen,
  onClose,
  onSubmit,
  teams,
  project,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  teams: Team[];
  project?: Project | null;
  title: string;
}) {
  const [formData, setFormData] = useState({
    project_code: '',
    project_name: '',
    client_name: '',
    description: '',
    team_id: '',
    priority: 'medium',
    status: 'active',
    budget_hours: 0,
    start_date: '',
    submission_date: '',
    deadline: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        project_code: project.project_code,
        project_name: project.project_name,
        client_name: project.client_name || '',
        description: project.description || '',
        team_id: project.team_id || '',
        priority: project.priority,
        status: project.status,
        budget_hours: project.budget_hours,
        start_date: project.start_date || '',
        submission_date: project.submission_date || '',
        deadline: project.deadline || '',
      });
    } else {
      setFormData({
        project_code: '',
        project_name: '',
        client_name: '',
        description: '',
        team_id: '',
        priority: 'medium',
        status: 'active',
        budget_hours: 0,
        start_date: '',
        submission_date: '',
        deadline: '',
      });
    }
  }, [project, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit(formData);
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Project Code *
              </label>
              <input
                type="text"
                required
                value={formData.project_code}
                onChange={(e) => setFormData({ ...formData, project_code: e.target.value })}
                placeholder="e.g., 3243-ESD-PLOT GA07"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                required
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                placeholder="Full project name"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Client Name
            </label>
            <input
              type="text"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              placeholder="Client company name"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Team</label>
              <select
                value={formData.team_id}
                onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500"
              >
                <option value="">Select team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Submission Date</label>
              <input
                type="date"
                value={formData.submission_date}
                onChange={(e) => setFormData({ ...formData, submission_date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Budget Hours
            </label>
            <input
              type="number"
              value={formData.budget_hours}
              onChange={(e) => setFormData({ ...formData, budget_hours: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 spinner" />}
              {project ? 'Update' : 'Create'} Project
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Revit Files Modal Component
function RevitFilesModal({
  isOpen,
  onClose,
  project,
  files,
  onAdd,
  onRemove,
}: {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  files: RevitFileMapping[];
  onAdd: (filename: string, description: string) => void;
  onRemove: (id: string) => void;
}) {
  const [newFilename, setNewFilename] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleAdd = () => {
    if (!newFilename.trim()) {
      toast.error('Please enter a Revit filename');
      return;
    }
    onAdd(newFilename.trim(), newDescription.trim());
    setNewFilename('');
    setNewDescription('');
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Revit File Mappings</h2>
            <p className="text-sm text-slate-500">{project.project_code} - {project.project_name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Link Revit files to this project</p>
                <p className="mt-1 text-blue-600">
                  When users open these Revit files, their time will automatically be tracked under this project.
                </p>
              </div>
            </div>
          </div>

          {/* Add new mapping */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <h3 className="font-medium text-slate-800 mb-3">Add Revit File</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="e.g., ES-GA07-TLA-BIM-DD-LAN-8000"
                value={newFilename}
                onChange={(e) => setNewFilename(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500"
              />
              <button
                onClick={handleAdd}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Mapping
              </button>
            </div>
          </div>

          {/* Current mappings */}
          <div>
            <h3 className="font-medium text-slate-800 mb-3">
              Current Mappings ({files.length})
            </h3>
            {files.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p>No Revit files linked yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <FileCode className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="font-mono text-sm text-slate-800">{file.revit_filename}</p>
                        {file.description && (
                          <p className="text-xs text-slate-500">{file.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onRemove(file.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
