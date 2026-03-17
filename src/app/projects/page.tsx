'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  X,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  FolderKanban,
  LayoutGrid,
  List,
  Kanban,
  GanttChart,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowUpDown,
  Download,
  SlidersHorizontal,
  Save,
  Star,
  Bookmark,
  ChevronDown,
  ChevronRight,
  Users,
  Target,
  TrendingUp,
  Flame,
} from 'lucide-react';

// Types
type Project = {
  id: string;
  project_name: string;
  description: string | null;
  project_status: string;
  project_stage: string;
  project_priority: string;
  project_start_date: string | null;
  project_end_date: string | null;
  progress_percentage: number;
  client_name: string | null;
  team_id: string | null;
  created_at: string;
  teams?: { id: string; team_name: string; color: string } | null;
};

type Team = {
  id: string;
  team_name: string;
  color: string;
};

// Configuration
const stageConfig: Record<string, { label: string; color: string; order: number }> = {
  sd_design: { label: 'SD Design', color: '#8B5CF6', order: 1 },
  dd_design: { label: 'DD Design', color: '#3B82F6', order: 2 },
  ifc: { label: 'IFC', color: '#10B981', order: 3 },
  bim_submission: { label: 'BIM Submission', color: '#F59E0B', order: 4 },
  revised_dd: { label: 'Revised DD', color: '#EC4899', order: 5 },
  construction: { label: 'Construction', color: '#06B6D4', order: 6 },
};

const priorityConfig: Record<string, { label: string; color: string; icon: any }> = {
  critical: { label: 'Critical', color: '#EF4444', icon: Flame },
  high: { label: 'High', color: '#F59E0B', icon: TrendingUp },
  medium: { label: 'Medium', color: '#3B82F6', icon: Target },
  low: { label: 'Low', color: '#10B981', icon: CheckCircle2 },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: '#10B981' },
  in_progress: { label: 'In Progress', color: '#3B82F6' },
  on_hold: { label: 'On Hold', color: '#F59E0B' },
  completed: { label: 'Completed', color: '#8B5CF6' },
  cancelled: { label: 'Cancelled', color: '#6B7280' },
};

type ViewMode = 'grid' | 'list' | 'kanban' | 'gantt';

type Filters = {
  search: string;
  stage: string;
  status: string;
  priority: string;
  team: string;
  dateRange: string;
  overdue: boolean;
};

const defaultFilters: Filters = {
  search: '',
  stage: '',
  status: '',
  priority: '',
  team: '',
  dateRange: '',
  overdue: false,
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'deadline' | 'priority' | 'progress'>('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchData();
    
    // Handle URL params for filters
    const stage = searchParams.get('stage');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const action = searchParams.get('action');
    const filterParam = searchParams.get('filter');

    if (stage) setFilters(f => ({ ...f, stage }));
    if (status) setFilters(f => ({ ...f, status }));
    if (priority) setFilters(f => ({ ...f, priority }));
    if (filterParam === 'overdue') setFilters(f => ({ ...f, overdue: true }));
    if (action === 'new') setShowModal(true);
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [projectsRes, teamsRes] = await Promise.all([
      supabase.from('projects').select('*, teams(id, team_name, color)').order('created_at', { ascending: false }),
      supabase.from('teams').select('*').eq('is_active', true),
    ]);

    if (projectsRes.data) setProjects(projectsRes.data);
    if (teamsRes.data) setTeams(teamsRes.data);
    setLoading(false);
  };

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    let result = projects.filter(project => {
      if (filters.search && !project.project_name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.stage && project.project_stage !== filters.stage) return false;
      if (filters.status && project.project_status !== filters.status) return false;
      if (filters.priority && project.project_priority !== filters.priority) return false;
      if (filters.team && project.team_id !== filters.team) return false;
      if (filters.overdue) {
        if (!project.project_end_date || project.project_status === 'completed') return false;
        if (project.project_end_date >= today) return false;
      }
      return true;
    });

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.project_name.localeCompare(b.project_name);
          break;
        case 'deadline':
          const dateA = a.project_end_date || '9999-99-99';
          const dateB = b.project_end_date || '9999-99-99';
          comparison = dateA.localeCompare(dateB);
          break;
        case 'priority':
          const priorityOrder: Record<string, number> = { critical: 1, high: 2, medium: 3, low: 4 };
          comparison = (priorityOrder[a.project_priority] || 5) - (priorityOrder[b.project_priority] || 5);
          break;
        case 'progress':
          comparison = (b.progress_percentage || 0) - (a.progress_percentage || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [projects, filters, sortBy, sortOrder]);

  // Group projects by stage for Kanban
  const projectsByStage = useMemo(() => {
    const groups: Record<string, Project[]> = {};
    Object.keys(stageConfig).forEach(stage => {
      groups[stage] = filteredProjects.filter(p => p.project_stage === stage);
    });
    return groups;
  }, [filteredProjects]);

  const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (!error) {
      setProjects(projects.filter(p => p.id !== id));
      setActiveMenu(null);
    }
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setShowModal(true);
    setActiveMenu(null);
  };

  const openNewModal = () => {
    setEditingProject(null);
    setShowModal(true);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    router.push('/projects');
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'search') return false;
    if (typeof value === 'boolean') return value;
    return value !== '';
  }).length;

  const isOverdue = (project: Project) => {
    if (!project.project_end_date || project.project_status === 'completed') return false;
    return project.project_end_date < new Date().toISOString().split('T')[0];
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '-';
    }
  };

  const getDaysUntilDeadline = (date: string | null) => {
    if (!date) return null;
    const days = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <FolderKanban className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="text-gradient">Projects</span>
            </h1>
            <p className="text-gray-400 mt-1">{filteredProjects.length} projects</p>
          </div>
        </div>

        <button onClick={openNewModal} className="btn-primary">
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search projects..."
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            className="input-premium pl-12 w-full"
          />
        </div>

        {/* View Mode */}
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl">
          {[
            { key: 'grid', icon: LayoutGrid, label: 'Grid' },
            { key: 'list', icon: List, label: 'List' },
            { key: 'kanban', icon: Kanban, label: 'Kanban' },
            { key: 'gantt', icon: GanttChart, label: 'Gantt' },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setViewMode(key as ViewMode)}
              title={label}
              className={`p-2.5 rounded-lg transition-all ${
                viewMode === key
                  ? 'bg-[#00AEEF] text-white shadow-lg shadow-[#00AEEF]/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="relative group">
          <button className="btn-secondary">
            <ArrowUpDown className="w-4 h-4" />
            Sort
            <ChevronDown className="w-4 h-4" />
          </button>
          <div className="absolute right-0 top-full mt-2 w-48 bg-[#1e1e28] border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            {[
              { key: 'deadline', label: 'Deadline' },
              { key: 'name', label: 'Name' },
              { key: 'priority', label: 'Priority' },
              { key: 'progress', label: 'Progress' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  if (sortBy === key) {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy(key as any);
                    setSortOrder('asc');
                  }
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-white/5 first:rounded-t-xl last:rounded-b-xl ${
                  sortBy === key ? 'text-[#00AEEF]' : 'text-gray-400'
                }`}
              >
                {label}
                {sortBy === key && (
                  <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary ${activeFilterCount > 0 ? 'border-[#00AEEF] text-[#00AEEF]' : ''}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#00AEEF] text-white text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="text-sm text-gray-400 hover:text-white">
            Clear all
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="card-premium p-4 animate-fadeIn">
          <div className="grid grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-2">Stage</label>
              <select
                value={filters.stage}
                onChange={(e) => setFilters(f => ({ ...f, stage: e.target.value }))}
                className="select-premium text-sm"
              >
                <option value="">All Stages</option>
                {Object.entries(stageConfig).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                className="select-premium text-sm"
              >
                <option value="">All Status</option>
                {Object.entries(statusConfig).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value }))}
                className="select-premium text-sm"
              >
                <option value="">All Priority</option>
                {Object.entries(priorityConfig).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">Team</label>
              <select
                value={filters.team}
                onChange={(e) => setFilters(f => ({ ...f, team: e.target.value }))}
                className="select-premium text-sm"
              >
                <option value="">All Teams</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.team_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">Quick Filters</label>
              <button
                onClick={() => setFilters(f => ({ ...f, overdue: !f.overdue }))}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all ${
                  filters.overdue
                    ? 'border-red-500 bg-red-500/10 text-red-400'
                    : 'border-white/10 hover:border-white/20 text-gray-400'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                Overdue Only
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === 'grid' && (
        <ProjectGridView
          projects={filteredProjects}
          isOverdue={isOverdue}
          formatDate={formatDate}
          getDaysUntilDeadline={getDaysUntilDeadline}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          menuRef={menuRef}
          openEditModal={openEditModal}
          deleteProject={deleteProject}
        />
      )}

      {viewMode === 'list' && (
        <ProjectListView
          projects={filteredProjects}
          isOverdue={isOverdue}
          formatDate={formatDate}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          menuRef={menuRef}
          openEditModal={openEditModal}
          deleteProject={deleteProject}
        />
      )}

      {viewMode === 'kanban' && (
        <ProjectKanbanView
          projectsByStage={projectsByStage}
          isOverdue={isOverdue}
          getDaysUntilDeadline={getDaysUntilDeadline}
          openEditModal={openEditModal}
        />
      )}

      {viewMode === 'gantt' && (
        <ProjectGanttView
          projects={filteredProjects}
          isOverdue={isOverdue}
        />
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
            fetchData();
          }}
        />
      )}
    </div>
  );
}

// Grid View Component
function ProjectGridView({
  projects,
  isOverdue,
  formatDate,
  getDaysUntilDeadline,
  activeMenu,
  setActiveMenu,
  menuRef,
  openEditModal,
  deleteProject,
}: any) {
  if (projects.length === 0) {
    return (
      <div className="card-premium text-center py-16">
        <FolderKanban className="w-16 h-16 mx-auto mb-4 text-gray-700" />
        <h3 className="text-xl font-semibold mb-2">No Projects Found</h3>
        <p className="text-gray-400 text-sm">Try adjusting your filters or create a new project</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {projects.map((project: Project) => {
        const stage = stageConfig[project.project_stage] || { label: project.project_stage, color: '#6B7280' };
        const priority = priorityConfig[project.project_priority] || { label: 'Medium', color: '#3B82F6', icon: Target };
        const PriorityIcon = priority.icon;
        const days = getDaysUntilDeadline(project.project_end_date);
        const overdue = isOverdue(project);

        return (
          <div
            key={project.id}
            className={`card-premium p-5 group relative ${
              overdue ? 'border-red-500/30 bg-red-500/5' : ''
            }`}
          >
            {/* Menu */}
            <div className="absolute top-4 right-4" ref={activeMenu === project.id ? menuRef : null}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenu(activeMenu === project.id ? null : project.id);
                }}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
              {activeMenu === project.id && (
                <div className="absolute right-0 top-8 w-40 bg-[#1e1e28] border border-white/10 rounded-xl shadow-xl z-50 animate-fadeIn">
                  <button
                    onClick={() => openEditModal(project)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 rounded-t-xl"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-b-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Stage badge */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-xs px-2 py-1 rounded-full font-medium"
                style={{ backgroundColor: `${stage.color}20`, color: stage.color }}
              >
                {stage.label}
              </span>
              {project.project_priority === 'critical' && (
                <Flame className="w-4 h-4 text-red-400 animate-pulse" />
              )}
              {overdue && (
                <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                  Overdue
                </span>
              )}
            </div>

            {/* Project name */}
            <h3 className="font-semibold text-lg mb-2 group-hover:text-[#00AEEF] transition-colors line-clamp-2">
              {project.project_name}
            </h3>

            {/* Team */}
            {project.teams && (
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.teams.color }} />
                <span className="text-sm text-gray-400">{project.teams.team_name}</span>
              </div>
            )}

            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-500">Progress</span>
                <span className="font-medium">{project.progress_percentage || 0}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${project.progress_percentage || 0}%`,
                    backgroundColor: project.progress_percentage === 100 ? '#10B981' : '#00AEEF',
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <PriorityIcon className="w-4 h-4" style={{ color: priority.color }} />
                <span className="text-xs" style={{ color: priority.color }}>{priority.label}</span>
              </div>
              <div className={`flex items-center gap-1.5 text-xs ${overdue ? 'text-red-400' : 'text-gray-500'}`}>
                <Calendar className="w-3.5 h-3.5" />
                {days !== null ? (
                  days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d left`
                ) : (
                  formatDate(project.project_end_date)
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// List View Component
function ProjectListView({
  projects,
  isOverdue,
  formatDate,
  activeMenu,
  setActiveMenu,
  menuRef,
  openEditModal,
  deleteProject,
}: any) {
  return (
    <div className="card-premium overflow-hidden">
      <table className="table-premium">
        <thead>
          <tr>
            <th>Project</th>
            <th>Stage</th>
            <th>Team</th>
            <th>Priority</th>
            <th>Progress</th>
            <th>Deadline</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project: Project) => {
            const stage = stageConfig[project.project_stage] || { label: project.project_stage, color: '#6B7280' };
            const priority = priorityConfig[project.project_priority] || { label: 'Medium', color: '#3B82F6' };
            const status = statusConfig[project.project_status] || { label: project.project_status, color: '#6B7280' };
            const overdue = isOverdue(project);

            return (
              <tr key={project.id} className={overdue ? 'bg-red-500/5' : ''}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stage.color}20` }}>
                      <FolderKanban className="w-5 h-5" style={{ color: stage.color }} />
                    </div>
                    <div>
                      <p className="font-medium">{project.project_name}</p>
                      {project.client_name && (
                        <p className="text-xs text-gray-500">{project.client_name}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ backgroundColor: `${stage.color}20`, color: stage.color }}
                  >
                    {stage.label}
                  </span>
                </td>
                <td className="text-gray-400">
                  {project.teams?.team_name || '-'}
                </td>
                <td>
                  <span className="text-xs font-medium" style={{ color: priority.color }}>
                    {priority.label}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${project.progress_percentage || 0}%`, backgroundColor: '#00AEEF' }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{project.progress_percentage || 0}%</span>
                  </div>
                </td>
                <td className={overdue ? 'text-red-400' : 'text-gray-400'}>
                  {formatDate(project.project_end_date)}
                </td>
                <td>
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ backgroundColor: `${status.color}20`, color: status.color }}
                  >
                    {status.label}
                  </span>
                </td>
                <td>
                  <div className="relative" ref={activeMenu === project.id ? menuRef : null}>
                    <button
                      onClick={() => setActiveMenu(activeMenu === project.id ? null : project.id)}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
                    >
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </button>
                    {activeMenu === project.id && (
                      <div className="absolute right-0 top-8 w-40 bg-[#1e1e28] border border-white/10 rounded-xl shadow-xl z-50">
                        <button
                          onClick={() => openEditModal(project)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 rounded-t-xl"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-b-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Kanban View Component
function ProjectKanbanView({
  projectsByStage,
  isOverdue,
  getDaysUntilDeadline,
  openEditModal,
}: any) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
      {Object.entries(stageConfig).map(([stage, config]) => (
        <div key={stage} className="flex-shrink-0 w-80">
          <div className="bg-white/5 rounded-xl p-4">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                <h3 className="font-semibold">{config.label}</h3>
              </div>
              <span className="text-sm text-gray-500 bg-white/10 px-2 py-0.5 rounded-full">
                {projectsByStage[stage]?.length || 0}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto no-scrollbar">
              {(projectsByStage[stage] || []).map((project: Project) => {
                const overdue = isOverdue(project);
                const days = getDaysUntilDeadline(project.project_end_date);
                const priority = priorityConfig[project.project_priority];

                return (
                  <button
                    key={project.id}
                    onClick={() => openEditModal(project)}
                    className={`w-full text-left p-4 rounded-xl border transition-all hover:scale-[1.02] hover:shadow-lg ${
                      overdue
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-[#0a0a0f] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm line-clamp-2">{project.project_name}</h4>
                      {project.project_priority === 'critical' && (
                        <Flame className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                    </div>
                    
                    {project.teams && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.teams.color }} />
                        <span className="text-xs text-gray-500">{project.teams.team_name}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${priority?.color}20`, color: priority?.color }}
                      >
                        {priority?.label}
                      </span>
                      <span className={`text-xs ${overdue ? 'text-red-400' : 'text-gray-500'}`}>
                        {days !== null ? (
                          days < 0 ? `${Math.abs(days)}d late` : days === 0 ? 'Today' : `${days}d`
                        ) : '-'}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${project.progress_percentage || 0}%`,
                          backgroundColor: project.progress_percentage === 100 ? '#10B981' : config.color,
                        }}
                      />
                    </div>
                  </button>
                );
              })}

              {(projectsByStage[stage] || []).length === 0 && (
                <div className="text-center py-8 text-gray-600">
                  <p className="text-sm">No projects</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Gantt View Component
function ProjectGanttView({ projects, isOverdue }: { projects: Project[]; isOverdue: (p: Project) => boolean }) {
  const today = new Date();
  const sortedProjects = [...projects]
    .filter(p => p.project_end_date)
    .sort((a, b) => (a.project_end_date || '').localeCompare(b.project_end_date || ''));

  const monthsAhead = 3;
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const endDate = new Date(today.getFullYear(), today.getMonth() + monthsAhead, 0);
  
  const getDayPosition = (date: string) => {
    const d = new Date(date);
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const daysDiff = (d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.min(100, (daysDiff / totalDays) * 100));
  };

  const months = [];
  for (let i = 0; i < monthsAhead; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    months.push(d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
  }

  return (
    <div className="card-premium p-6">
      <h3 className="text-lg font-semibold mb-6">Project Timeline</h3>
      
      {/* Month Headers */}
      <div className="flex items-center mb-4 ml-56">
        {months.map((month, i) => (
          <div key={i} className="flex-1 text-center text-sm text-gray-500 border-l border-white/10 first:border-l-0">
            {month}
          </div>
        ))}
      </div>

      {/* Timeline Grid */}
      <div className="space-y-2">
        {sortedProjects.map((project) => {
          const endPos = getDayPosition(project.project_end_date!);
          const startPos = project.project_start_date ? getDayPosition(project.project_start_date) : Math.max(0, endPos - 15);
          const overdue = isOverdue(project);
          const stage = stageConfig[project.project_stage] || { color: '#6B7280' };

          return (
            <div key={project.id} className="flex items-center gap-4 group">
              <div className="w-52 flex-shrink-0">
                <p className="text-sm font-medium truncate group-hover:text-[#00AEEF] transition-colors">
                  {project.project_name}
                </p>
                <p className="text-xs text-gray-500">{project.teams?.team_name || 'No team'}</p>
              </div>
              <div className="flex-1 h-8 bg-white/5 rounded relative">
                {/* Grid lines */}
                {months.map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute top-0 bottom-0 border-l border-white/5"
                    style={{ left: `${(i / months.length) * 100}%` }}
                  />
                ))}
                {/* Today marker */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                  style={{ left: `${getDayPosition(today.toISOString())}%` }}
                />
                {/* Project bar */}
                <div
                  className={`absolute top-1 bottom-1 rounded transition-all group-hover:scale-y-125 ${
                    overdue ? 'animate-pulse' : ''
                  }`}
                  style={{
                    left: `${startPos}%`,
                    width: `${Math.max(endPos - startPos, 3)}%`,
                    backgroundColor: overdue ? '#EF4444' : stage.color,
                  }}
                />
              </div>
              <div className="w-20 text-right text-xs text-gray-500">
                {new Date(project.project_end_date!).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-6 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-0.5 h-4 bg-red-500" />
          <span className="text-xs text-gray-400">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 rounded bg-red-500" />
          <span className="text-xs text-gray-400">Overdue</span>
        </div>
      </div>
    </div>
  );
}

// Project Modal Component
function ProjectModal({
  project,
  teams,
  onClose,
  onSaved,
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
    project_stage: project?.project_stage || 'sd_design',
    project_priority: project?.project_priority || 'medium',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_name.trim()) {
      setError('Project name is required');
      return;
    }

    setSaving(true);
    setError('');

    const data = {
      project_name: formData.project_name.trim(),
      description: formData.description.trim() || null,
      project_status: formData.project_status,
      project_stage: formData.project_stage,
      project_priority: formData.project_priority,
      project_start_date: formData.project_start_date || null,
      project_end_date: formData.project_end_date || null,
      progress_percentage: formData.progress_percentage,
      client_name: formData.client_name.trim() || null,
      team_id: formData.team_id || null,
      updated_at: new Date().toISOString(),
    };

    try {
      let result;
      if (isEditing) {
        result = await supabase.from('projects').update(data).eq('id', project.id);
      } else {
        result = await supabase.from('projects').insert(data);
      }

      if (result.error) throw result.error;
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-[#12121a] border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{isEditing ? 'Edit Project' : 'New Project'}</h2>
              <p className="text-sm text-gray-500">Fill in the project details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Project Name *</label>
            <input
              type="text"
              value={formData.project_name}
              onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
              className="input-premium"
              placeholder="Enter project name"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-premium h-24 resize-none"
              placeholder="Project description..."
            />
          </div>

          {/* Row: Stage, Priority, Status */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Stage</label>
              <select
                value={formData.project_stage}
                onChange={(e) => setFormData({ ...formData, project_stage: e.target.value })}
                className="select-premium"
              >
                {Object.entries(stageConfig).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
              <select
                value={formData.project_priority}
                onChange={(e) => setFormData({ ...formData, project_priority: e.target.value })}
                className="select-premium"
              >
                {Object.entries(priorityConfig).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={formData.project_status}
                onChange={(e) => setFormData({ ...formData, project_status: e.target.value })}
                className="select-premium"
              >
                {Object.entries(statusConfig).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row: Team, Client */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Team</label>
              <select
                value={formData.team_id}
                onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                className="select-premium"
              >
                <option value="">Select team...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.team_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Client</label>
              <input
                type="text"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className="input-premium"
                placeholder="Client name"
              />
            </div>
          </div>

          {/* Row: Start Date, End Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
              <input
                type="date"
                value={formData.project_start_date}
                onChange={(e) => setFormData({ ...formData, project_start_date: e.target.value })}
                className="input-premium"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Date / Deadline</label>
              <input
                type="date"
                value={formData.project_end_date}
                onChange={(e) => setFormData({ ...formData, project_end_date: e.target.value })}
                className="input-premium"
              />
            </div>
          </div>

          {/* Progress */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Progress: {formData.progress_percentage}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.progress_percentage}
              onChange={(e) => setFormData({ ...formData, progress_percentage: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {isEditing ? 'Update Project' : 'Create Project'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
