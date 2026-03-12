'use client';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import {
  Plus,
  Search,
  FolderKanban,
  LayoutGrid,
  List,
  ChevronLeft,
  MoreHorizontal,
  Calendar,
  Clock,
  X,
  Edit,
  Trash2,
  Eye,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';

type Team = {
  id: string;
  team_name: string;
  color: string | null;
};

type Project = {
  id: string;
  project_name: string;
  description: string | null;
  project_status: string;
  project_stage: string | null;
  project_priority: string;
  project_start_date: string | null;
  project_end_date: string | null;
  progress_percentage: number;
  client_name: string | null;
  team_id: string | null;
  teams?: Team | null;
  created_at: string;
};

const statusOptions = [
  { value: 'active', label: 'Active', color: 'bg-green-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-yellow-500' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'text-green-400 bg-green-500/15 border-green-500/30' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30' },
  { value: 'high', label: 'High', color: 'text-orange-400 bg-orange-500/15 border-orange-500/30' },
  { value: 'critical', label: 'Critical', color: 'text-red-400 bg-red-500/15 border-red-500/30' },
];

const stageOptions = [
  { value: 'sd_design', label: 'SD Design' },
  { value: 'dd_design', label: 'DD Design' },
  { value: 'ifc', label: 'IFC' },
  { value: 'bim_submission', label: 'BIM Submission' },
  { value: 'revised_dd', label: 'Revised DD' },
  { value: 'construction', label: 'Construction' },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchProjects();
    fetchTeams();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*, teams(id, team_name, color)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProjects(data);
    }
    setLoading(false);
  };

  const fetchTeams = async () => {
    const { data } = await supabase
      .from('teams')
      .select('id, team_name, color')
      .eq('is_active', true)
      .order('team_name');
    setTeams(data || []);
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (!error) {
      setProjects(projects.filter(p => p.id !== id));
      setActiveDropdown(null);
    } else {
      alert('Failed to delete project. Please try again.');
    }
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setShowModal(true);
    setActiveDropdown(null);
  };

  const openNewModal = () => {
    setEditingProject(null);
    setShowModal(true);
  };

  const toggleDropdown = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.client_name?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || project.project_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.project_status === 'active' || p.project_status === 'in_progress').length,
    completed: projects.filter(p => p.project_status === 'completed').length,
    overdue: projects.filter(p => {
      if (!p.project_end_date || p.project_status === 'completed') return false;
      return new Date(p.project_end_date) < new Date();
    }).length,
  };

  const getStatusConfig = (status: string) => {
    return statusOptions.find(s => s.value === status) || { value: status, label: status, color: 'bg-gray-500' };
  };

  const getPriorityConfig = (priority: string) => {
    return priorityOptions.find(p => p.value === priority) || { value: priority, label: priority, color: 'text-gray-400 bg-gray-500/15 border-gray-500/30' };
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'No deadline';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Invalid date';
    }
  };

  const isOverdue = (project: Project): boolean => {
    if (!project.project_end_date || project.project_status === 'completed') return false;
    return new Date(project.project_end_date) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back Navigation */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <FolderKanban className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="text-gradient">Projects</span>
            </h1>
            <p className="text-gray-400 mt-1">Manage all your projects</p>
          </div>
        </div>
        <button onClick={openNewModal} className="btn-primary">
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card-premium p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#00AEEF]/20 flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-[#00AEEF]" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-400">Total Projects</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.active}</p>
              <p className="text-sm text-gray-400">In Progress</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.completed}</p>
              <p className="text-sm text-gray-400">Completed</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.overdue}</p>
              <p className="text-sm text-gray-400">Overdue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-premium pl-12 w-full"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="select-premium w-44"
        >
          <option value="all">All Status</option>
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <div className="flex items-center p-1 bg-white/5 rounded-xl border border-white/5">
          <button
            onClick={() => setView('grid')}
            className={`p-2.5 rounded-lg transition-all ${
              view === 'grid' ? 'bg-[#00AEEF] text-white shadow-lg shadow-[#00AEEF]/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2.5 rounded-lg transition-all ${
              view === 'list' ? 'bg-[#00AEEF] text-white shadow-lg shadow-[#00AEEF]/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const status = getStatusConfig(project.project_status);
            const priority = getPriorityConfig(project.project_priority);
            const overdue = isOverdue(project);

            return (
              <div key={project.id} className={`card-premium p-6 group ${overdue ? 'border-red-500/30' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${status.color}`} />
                    <span className="text-xs text-gray-400">{status.label}</span>
                    {overdue && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">OVERDUE</span>
                    )}
                  </div>
                  
                  {/* Dropdown Menu */}
                  <div className="relative" ref={activeDropdown === project.id ? dropdownRef : null}>
                    <button 
                      onClick={(e) => toggleDropdown(project.id, e)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {activeDropdown === project.id && (
                      <div className="absolute right-0 top-full mt-1 w-40 py-1 bg-[#1e1e28] rounded-xl border border-white/10 shadow-xl z-50">
                        <button
                          onClick={() => openEditModal(project)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Project
                        </button>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h3 
                  className="text-lg font-semibold mb-2 cursor-pointer hover:text-[#00AEEF] transition-colors"
                  onClick={() => openEditModal(project)}
                >
                  {project.project_name}
                </h3>
                
                {project.description && (
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{project.description}</p>
                )}

                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className={`text-xs px-2 py-1 rounded-full border ${priority.color}`}>
                    {priority.label}
                  </span>
                  {project.project_stage && (
                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">
                      {stageOptions.find(s => s.value === project.project_stage)?.label || project.project_stage.replace('_', ' ')}
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-[#00AEEF] font-medium">{project.progress_percentage || 0}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#00AEEF] to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${project.progress_percentage || 0}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className={overdue ? 'text-red-400' : ''}>{formatDate(project.project_end_date)}</span>
                  </div>
                  {project.teams && (
                    <div className="flex items-center gap-1.5">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: project.teams.color || '#6b7280' }}
                      />
                      <span className="text-gray-500">{project.teams.team_name}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="card-premium overflow-hidden">
          <table className="table-premium">
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Stage</th>
                <th>Priority</th>
                <th>Progress</th>
                <th>Deadline</th>
                <th>Team</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => {
                const status = getStatusConfig(project.project_status);
                const priority = getPriorityConfig(project.project_priority);
                const overdue = isOverdue(project);

                return (
                  <tr key={project.id} className={overdue ? 'bg-red-500/5' : ''}>
                    <td>
                      <div>
                        <p className="font-medium cursor-pointer hover:text-[#00AEEF]" onClick={() => openEditModal(project)}>
                          {project.project_name}
                        </p>
                        {project.client_name && (
                          <p className="text-xs text-gray-500">{project.client_name}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${status.color}`} />
                        <span className="text-sm">{status.label}</span>
                      </div>
                    </td>
                    <td className="text-gray-400">
                      {project.project_stage ? 
                        (stageOptions.find(s => s.value === project.project_stage)?.label || project.project_stage.replace('_', ' ')) 
                        : '-'}
                    </td>
                    <td>
                      <span className={`text-xs px-2 py-1 rounded-full border ${priority.color}`}>
                        {priority.label}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#00AEEF] rounded-full"
                            style={{ width: `${project.progress_percentage || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{project.progress_percentage || 0}%</span>
                      </div>
                    </td>
                    <td className={overdue ? 'text-red-400' : 'text-gray-400'}>
                      {formatDate(project.project_end_date)}
                    </td>
                    <td>
                      {project.teams ? (
                        <div className="flex items-center gap-1.5">
                          <div 
                            className="w-2.5 h-2.5 rounded-full" 
                            style={{ backgroundColor: project.teams.color || '#6b7280' }}
                          />
                          <span className="text-sm">{project.teams.team_name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => openEditModal(project)}
                          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteProject(project.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filteredProjects.length === 0 && (
        <div className="card-premium text-center py-16">
          <FolderKanban className="w-20 h-20 mx-auto mb-4 text-gray-700" />
          <h3 className="text-xl font-semibold mb-2">No Projects Found</h3>
          <p className="text-gray-400 text-sm mb-6">
            {searchQuery || filterStatus !== 'all' ? 'Try adjusting your filters' : 'Create your first project to get started'}
          </p>
          <button onClick={openNewModal} className="btn-primary">
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      )}

      {/* Project Modal */}
      {showModal && (
        <ProjectModal
          project={editingProject}
          teams={teams}
          onClose={() => {
            setShowModal(false);
            setEditingProject(null);
          }}
          onSaved={() => {
            setShowModal(false);
            setEditingProject(null);
            fetchProjects();
          }}
        />
      )}
    </div>
  );
}

// Project Modal Component
function ProjectModal({ 
  project, 
  teams,
  onClose, 
  onSaved 
}: { 
  project: Project | null; 
  teams: Team[];
  onClose: () => void; 
  onSaved: () => void;
}) {
  const isEditing = !!project;
  const [formData, setFormData] = useState({
    project_name: project?.project_name || '',
    description: project?.description || '',
    project_status: project?.project_status || 'active',
    project_priority: project?.project_priority || 'medium',
    project_stage: project?.project_stage || 'sd_design',
    project_start_date: project?.project_start_date?.split('T')[0] || '',
    project_end_date: project?.project_end_date?.split('T')[0] || '',
    progress_percentage: project?.progress_percentage || 0,
    client_name: project?.client_name || '',
    team_id: project?.team_id || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.project_name.trim()) {
      setError('Project name is required');
      return;
    }

    setSaving(true);
    setError('');

    const projectData = {
      project_name: formData.project_name.trim(),
      description: formData.description.trim() || null,
      project_status: formData.project_status,
      project_priority: formData.project_priority,
      project_stage: formData.project_stage,
      project_start_date: formData.project_start_date || null,
      project_end_date: formData.project_end_date || null,
      progress_percentage: Number(formData.progress_percentage) || 0,
      client_name: formData.client_name.trim() || null,
      team_id: formData.team_id || null,
      updated_at: new Date().toISOString(),
    };

    try {
      let result;
      if (isEditing) {
        result = await supabase.from('projects').update(projectData).eq('id', project.id);
      } else {
        result = await supabase.from('projects').insert(projectData);
      }

      if (result.error) {
        throw result.error;
      }

      onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6 max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{isEditing ? 'Edit Project' : 'Create New Project'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-300">Project Name *</label>
              <input
                type="text"
                name="project_name"
                value={formData.project_name}
                onChange={handleChange}
                className="input-premium"
                placeholder="Enter project name"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-300">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-premium h-20 resize-none"
                placeholder="Enter project description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Status</label>
              <select 
                name="project_status"
                value={formData.project_status} 
                onChange={handleChange} 
                className="select-premium"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Priority</label>
              <select 
                name="project_priority"
                value={formData.project_priority} 
                onChange={handleChange} 
                className="select-premium"
              >
                {priorityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Stage</label>
              <select 
                name="project_stage"
                value={formData.project_stage} 
                onChange={handleChange} 
                className="select-premium"
              >
                {stageOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Team</label>
              <select 
                name="team_id"
                value={formData.team_id} 
                onChange={handleChange} 
                className="select-premium"
              >
                <option value="">No Team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.team_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Start Date</label>
              <input
                type="date"
                name="project_start_date"
                value={formData.project_start_date}
                onChange={handleChange}
                className="input-premium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Deadline</label>
              <input
                type="date"
                name="project_end_date"
                value={formData.project_end_date}
                onChange={handleChange}
                className="input-premium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Client Name</label>
              <input
                type="text"
                name="client_name"
                value={formData.client_name}
                onChange={handleChange}
                className="input-premium"
                placeholder="Enter client name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Progress ({formData.progress_percentage}%)
              </label>
              <input
                type="range"
                name="progress_percentage"
                min="0"
                max="100"
                value={formData.progress_percentage}
                onChange={handleChange}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00AEEF]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : isEditing ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
