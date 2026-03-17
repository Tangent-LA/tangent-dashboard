'use client';

import { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowRight,
  Filter,
  Download,
  Bell,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Flame,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  FileSpreadsheet,
  X,
} from 'lucide-react';

// Types
type Project = {
  id: string;
  project_name: string;
  project_status: string;
  project_stage: string;
  project_priority: string;
  project_start_date: string | null;
  project_end_date: string | null;
  progress_percentage: number;
  team_id: string | null;
  teams?: { team_name: string; color: string } | null;
};

type Team = {
  id: string;
  team_name: string;
  color: string;
  members?: number;
};

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  project_id: string | null;
  assignee_id: string | null;
};

type BimDeliverable = {
  id: string;
  deliverable_name: string;
  status: string;
  due_date: string | null;
  project_id: string | null;
};

// Stage configuration
const stageConfig: Record<string, { label: string; color: string; order: number }> = {
  sd_design: { label: 'SD Design', color: '#8B5CF6', order: 1 },
  dd_design: { label: 'DD Design', color: '#3B82F6', order: 2 },
  ifc: { label: 'IFC', color: '#10B981', order: 3 },
  bim_submission: { label: 'BIM Submission', color: '#F59E0B', order: 4 },
  revised_dd: { label: 'Revised DD', color: '#EC4899', order: 5 },
  construction: { label: 'Construction', color: '#06B6D4', order: 6 },
};

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: 'Critical', color: '#EF4444', bg: 'bg-red-500/20' },
  high: { label: 'High', color: '#F59E0B', bg: 'bg-amber-500/20' },
  medium: { label: 'Medium', color: '#3B82F6', bg: 'bg-blue-500/20' },
  low: { label: 'Low', color: '#10B981', bg: 'bg-green-500/20' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: '#10B981' },
  in_progress: { label: 'In Progress', color: '#3B82F6' },
  on_hold: { label: 'On Hold', color: '#F59E0B' },
  completed: { label: 'Completed', color: '#8B5CF6' },
  cancelled: { label: 'Cancelled', color: '#6B7280' },
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deliverables, setDeliverables] = useState<BimDeliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'workload' | 'timeline'>('overview');
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    
    const [projectsRes, teamsRes, tasksRes, deliverablesRes, profilesRes] = await Promise.all([
      supabase.from('projects').select('*, teams(team_name, color)'),
      supabase.from('teams').select('*').eq('is_active', true),
      supabase.from('tasks').select('*'),
      supabase.from('bim_deliverables').select('*'),
      supabase.from('profiles').select('team_id').eq('is_active', true),
    ]);

    if (projectsRes.data) setProjects(projectsRes.data);
    if (teamsRes.data && profilesRes.data) {
      const teamsWithMembers = teamsRes.data.map(team => ({
        ...team,
        members: profilesRes.data.filter(p => p.team_id === team.id).length,
      }));
      setTeams(teamsWithMembers);
    }
    if (tasksRes.data) setTasks(tasksRes.data);
    if (deliverablesRes.data) setDeliverables(deliverablesRes.data);
    
    setLoading(false);
  };

  // Analytics calculations
  const analytics = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const next14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Project stats
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.project_status === 'active' || p.project_status === 'in_progress').length;
    const completedProjects = projects.filter(p => p.project_status === 'completed').length;
    const overdueProjects = projects.filter(p => {
      if (!p.project_end_date || p.project_status === 'completed') return false;
      return p.project_end_date < today;
    });

    // Projects by stage
    const projectsByStage = Object.entries(stageConfig).map(([key, config]) => ({
      stage: key,
      label: config.label,
      color: config.color,
      count: projects.filter(p => p.project_stage === key).length,
      order: config.order,
    })).sort((a, b) => a.order - b.order);

    // Projects by priority
    const projectsByPriority = Object.entries(priorityConfig).map(([key, config]) => ({
      priority: key,
      label: config.label,
      color: config.color,
      count: projects.filter(p => p.project_priority === key).length,
    }));

    // Projects by status
    const projectsByStatus = Object.entries(statusConfig).map(([key, config]) => ({
      status: key,
      label: config.label,
      color: config.color,
      count: projects.filter(p => p.project_status === key).length,
    }));

    // Team workload analysis
    const teamWorkload = teams.map(team => {
      const teamProjects = projects.filter(p => p.team_id === team.id);
      const activeTeamProjects = teamProjects.filter(p => p.project_status === 'active' || p.project_status === 'in_progress');
      const overdueTeamProjects = teamProjects.filter(p => {
        if (!p.project_end_date || p.project_status === 'completed') return false;
        return p.project_end_date < today;
      });
      const upcomingDeadlines = teamProjects.filter(p => {
        if (!p.project_end_date || p.project_status === 'completed') return false;
        return p.project_end_date >= today && p.project_end_date <= nextWeek;
      });
      const criticalProjects = teamProjects.filter(p => p.project_priority === 'critical' || p.project_priority === 'high');
      
      // Calculate capacity (projects per member)
      const capacity = team.members ? Math.round((activeTeamProjects.length / team.members) * 100) : 0;
      const isOverloaded = capacity > 150 || overdueTeamProjects.length > 0 || criticalProjects.length >= 3;
      const isLight = capacity < 50 && activeTeamProjects.length < 2;

      return {
        ...team,
        totalProjects: teamProjects.length,
        activeProjects: activeTeamProjects.length,
        overdueProjects: overdueTeamProjects.length,
        upcomingDeadlines: upcomingDeadlines.length,
        criticalProjects: criticalProjects.length,
        capacity,
        isOverloaded,
        isLight,
        riskLevel: isOverloaded ? 'high' : isLight ? 'low' : 'medium',
      };
    }).sort((a, b) => b.capacity - a.capacity);

    // Upcoming deadlines
    const upcomingDeadlines = projects
      .filter(p => p.project_end_date && p.project_end_date >= today && p.project_end_date <= next14Days && p.project_status !== 'completed')
      .sort((a, b) => (a.project_end_date || '').localeCompare(b.project_end_date || ''));

    // Task stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
    const overdueTasks = tasks.filter(t => {
      if (!t.due_date || t.status === 'done') return false;
      return t.due_date < today;
    }).length;

    // BIM Deliverable stats
    const totalDeliverables = deliverables.length;
    const pendingDeliverables = deliverables.filter(d => d.status === 'pending' || d.status === 'in_progress').length;
    const overdueDeliverables = deliverables.filter(d => {
      if (!d.due_date || d.status === 'approved' || d.status === 'submitted') return false;
      return d.due_date < today;
    }).length;

    // Risk indicators
    const deadlineClashes = upcomingDeadlines.filter((p, i, arr) => {
      return arr.some((other, j) => i !== j && p.project_end_date === other.project_end_date && p.team_id === other.team_id);
    });

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      overdueProjects,
      projectsByStage,
      projectsByPriority,
      projectsByStatus,
      teamWorkload,
      upcomingDeadlines,
      totalTasks,
      completedTasks,
      overdueTasks,
      totalDeliverables,
      pendingDeliverables,
      overdueDeliverables,
      deadlineClashes,
      completionRate: totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0,
      taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }, [projects, teams, tasks, deliverables]);

  const handleStageClick = (stage: string) => {
    router.push(`/projects?stage=${stage}`);
  };

  const handlePriorityClick = (priority: string) => {
    router.push(`/projects?priority=${priority}`);
  };

  const handleStatusClick = (status: string) => {
    router.push(`/projects?status=${status}`);
  };

  const maxStageCount = Math.max(...analytics.projectsByStage.map(s => s.count), 1);

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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00AEEF] to-[#0077a3] flex items-center justify-center shadow-lg shadow-[#00AEEF]/20">
            <LayoutDashboard className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="text-gradient">Dashboard</span>
            </h1>
            <p className="text-gray-400 mt-1">Enterprise Project Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchAllData} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={() => setShowExportModal(true)} className="btn-primary">
            <FileSpreadsheet className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl w-fit">
        {[
          { key: 'overview', label: 'Overview', icon: LayoutDashboard },
          { key: 'workload', label: 'Workload Intelligence', icon: Users },
          { key: 'timeline', label: 'Timeline & Deadlines', icon: Calendar },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveView(key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeView === key
                ? 'bg-[#00AEEF] text-white shadow-lg shadow-[#00AEEF]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Alert Banner */}
      {(analytics.overdueProjects.length > 0 || analytics.deadlineClashes.length > 0) && (
        <div className="bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent border border-red-500/20 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-400">Attention Required</h3>
            <p className="text-sm text-gray-400">
              {analytics.overdueProjects.length > 0 && `${analytics.overdueProjects.length} overdue project(s)`}
              {analytics.overdueProjects.length > 0 && analytics.deadlineClashes.length > 0 && ' • '}
              {analytics.deadlineClashes.length > 0 && `${analytics.deadlineClashes.length} deadline clash(es)`}
            </p>
          </div>
          <Link href="/projects?filter=overdue" className="btn-secondary text-red-400 border-red-500/30 hover:bg-red-500/10">
            View Details
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {activeView === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-5 gap-4">
            <KPICard
              title="Total Projects"
              value={analytics.totalProjects}
              icon={FolderKanban}
              color="#00AEEF"
              trend={null}
              onClick={() => router.push('/projects')}
            />
            <KPICard
              title="Active Projects"
              value={analytics.activeProjects}
              icon={Activity}
              color="#10B981"
              subtitle={`${analytics.completionRate}% completion rate`}
              onClick={() => router.push('/projects?status=active')}
            />
            <KPICard
              title="Overdue"
              value={analytics.overdueProjects.length}
              icon={AlertCircle}
              color="#EF4444"
              alert={analytics.overdueProjects.length > 0}
              onClick={() => router.push('/projects?filter=overdue')}
            />
            <KPICard
              title="Tasks"
              value={analytics.totalTasks}
              icon={CheckCircle2}
              color="#8B5CF6"
              subtitle={`${analytics.completedTasks} completed`}
              onClick={() => router.push('/tasks')}
            />
            <KPICard
              title="BIM Deliverables"
              value={analytics.totalDeliverables}
              icon={FileSpreadsheet}
              color="#F59E0B"
              subtitle={`${analytics.pendingDeliverables} pending`}
              onClick={() => router.push('/bim')}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-3 gap-6">
            {/* Projects by Stage - Interactive Bar Chart */}
            <div className="col-span-2 card-premium p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Projects by Stage</h3>
                  <p className="text-sm text-gray-500">Click any bar to view filtered projects</p>
                </div>
                <Link href="/projects" className="text-[#00AEEF] text-sm hover:underline flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-4">
                {analytics.projectsByStage.map(({ stage, label, color, count }) => (
                  <button
                    key={stage}
                    onClick={() => handleStageClick(stage)}
                    className="w-full group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-28 text-sm text-gray-400 text-left group-hover:text-white transition-colors">
                        {label}
                      </div>
                      <div className="flex-1 h-10 bg-white/5 rounded-lg overflow-hidden relative group-hover:bg-white/10 transition-colors">
                        <div 
                          className="h-full rounded-lg flex items-center justify-end pr-4 transition-all duration-500 group-hover:scale-x-105 origin-left"
                          style={{ 
                            width: `${Math.max((count / maxStageCount) * 100, 8)}%`,
                            backgroundColor: color,
                          }}
                        >
                          <span className="text-sm font-bold text-white drop-shadow-md">{count}</span>
                        </div>
                        {/* Hover indicator */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowUpRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority & Status Pie Charts */}
            <div className="card-premium p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Priority Distribution</h3>
                <div className="flex items-center justify-center mb-4">
                  <PieChartSimple data={analytics.projectsByPriority} onClick={handlePriorityClick} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {analytics.projectsByPriority.map(({ priority, label, color, count }) => (
                    <button
                      key={priority}
                      onClick={() => handlePriorityClick(priority)}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-xs text-gray-400">{label}</span>
                      <span className="text-xs font-bold ml-auto">{count}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/5 pt-6">
                <h3 className="text-lg font-semibold mb-4">Status Overview</h3>
                <div className="space-y-2">
                  {analytics.projectsByStatus.map(({ status, label, color, count }) => (
                    <button
                      key={status}
                      onClick={() => handleStatusClick(status)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-sm text-gray-400">{label}</span>
                      <span className="text-sm font-bold ml-auto">{count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-3 gap-6">
            {/* Upcoming Deadlines */}
            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Upcoming Deadlines</h3>
                <span className="text-xs text-gray-500">Next 14 days</span>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto no-scrollbar">
                {analytics.upcomingDeadlines.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No upcoming deadlines</p>
                  </div>
                ) : (
                  analytics.upcomingDeadlines.slice(0, 6).map((project) => {
                    const daysUntil = Math.ceil((new Date(project.project_end_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    const isUrgent = daysUntil <= 3;
                    return (
                      <Link
                        key={project.id}
                        href={`/projects?id=${project.id}`}
                        className={`block p-3 rounded-xl border transition-all hover:scale-[1.02] ${
                          isUrgent 
                            ? 'bg-red-500/10 border-red-500/30' 
                            : 'bg-white/5 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{project.project_name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {project.teams?.team_name || 'No team'}
                            </p>
                          </div>
                          <div className={`text-right ${isUrgent ? 'text-red-400' : 'text-gray-400'}`}>
                            <p className="text-sm font-semibold">
                              {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                            </p>
                            <p className="text-xs opacity-70">
                              {new Date(project.project_end_date!).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

            {/* Team Quick View */}
            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Team Status</h3>
                <Link href="/teams" className="text-[#00AEEF] text-sm hover:underline">View All</Link>
              </div>
              <div className="space-y-3">
                {analytics.teamWorkload.slice(0, 5).map((team) => (
                  <div
                    key={team.id}
                    className={`p-3 rounded-xl border transition-all ${
                      team.isOverloaded 
                        ? 'bg-red-500/10 border-red-500/30' 
                        : team.isLight 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : 'bg-white/5 border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                        <span className="font-medium text-sm">{team.team_name}</span>
                      </div>
                      {team.isOverloaded && <Flame className="w-4 h-4 text-red-400" />}
                      {team.isLight && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{team.activeProjects} active • {team.members || 0} members</span>
                      <span className={`font-semibold ${
                        team.capacity > 150 ? 'text-red-400' : team.capacity < 50 ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        {team.capacity}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          team.capacity > 150 ? 'bg-red-500' : team.capacity > 100 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(team.capacity, 200) / 2}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions & Alerts */}
            <div className="card-premium p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/projects?action=new"
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#00AEEF]/10 border border-[#00AEEF]/30 hover:bg-[#00AEEF]/20 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#00AEEF]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FolderKanban className="w-5 h-5 text-[#00AEEF]" />
                  </div>
                  <div>
                    <p className="font-medium">New Project</p>
                    <p className="text-xs text-gray-500">Create a new project</p>
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto text-gray-500 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/tasks?action=new"
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium">New Task</p>
                    <p className="text-xs text-gray-500">Add a task to backlog</p>
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto text-gray-500 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/bim?action=new"
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium">New Deliverable</p>
                    <p className="text-xs text-gray-500">Track BIM submission</p>
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto text-gray-500 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/reports"
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-medium">View Reports</p>
                    <p className="text-xs text-gray-500">Analytics & insights</p>
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto text-gray-500 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {activeView === 'workload' && (
        <WorkloadView teamWorkload={analytics.teamWorkload} projects={projects} />
      )}

      {activeView === 'timeline' && (
        <TimelineView projects={projects} deliverables={deliverables} />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} projects={projects} teams={teams} />
      )}
    </div>
  );
}

// KPI Card Component
function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend, 
  subtitle, 
  alert, 
  onClick 
}: { 
  title: string; 
  value: number; 
  icon: any; 
  color: string; 
  trend?: number | null; 
  subtitle?: string;
  alert?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`kpi-card text-left group ${alert ? 'border-red-500/30 animate-pulse' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div 
          className="kpi-icon group-hover:scale-110 transition-transform"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {alert && <AlertCircle className="w-5 h-5 text-red-400" />}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm text-gray-400 mt-1">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowUpRight className="w-4 h-4 text-gray-500" />
      </div>
    </button>
  );
}

// Simple Pie Chart
function PieChartSimple({ data, onClick }: { data: { priority: string; label: string; color: string; count: number }[]; onClick: (priority: string) => void }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) return <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center text-gray-500 text-sm">No data</div>;
  
  let currentAngle = 0;
  const segments = data.map(d => {
    const angle = (d.count / total) * 360;
    const segment = { ...d, startAngle: currentAngle, endAngle: currentAngle + angle };
    currentAngle += angle;
    return segment;
  });

  return (
    <svg viewBox="0 0 100 100" className="w-32 h-32">
      {segments.map((seg, i) => {
        if (seg.count === 0) return null;
        const startAngle = (seg.startAngle - 90) * (Math.PI / 180);
        const endAngle = (seg.endAngle - 90) * (Math.PI / 180);
        const x1 = 50 + 40 * Math.cos(startAngle);
        const y1 = 50 + 40 * Math.sin(startAngle);
        const x2 = 50 + 40 * Math.cos(endAngle);
        const y2 = 50 + 40 * Math.sin(endAngle);
        const largeArc = seg.endAngle - seg.startAngle > 180 ? 1 : 0;
        
        return (
          <path
            key={i}
            d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill={seg.color}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onClick(seg.priority)}
          />
        );
      })}
      <circle cx="50" cy="50" r="20" fill="#0a0a0f" />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="12" fontWeight="bold">
        {total}
      </text>
    </svg>
  );
}

// Workload View Component
function WorkloadView({ teamWorkload, projects }: { teamWorkload: any[]; projects: Project[] }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card-premium p-5 border-green-500/30 bg-green-500/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{teamWorkload.filter(t => t.isLight).length}</p>
              <p className="text-sm text-gray-400">Teams Available</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-5 border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Activity className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{teamWorkload.filter(t => !t.isLight && !t.isOverloaded).length}</p>
              <p className="text-sm text-gray-400">Teams Balanced</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-5 border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Flame className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{teamWorkload.filter(t => t.isOverloaded).length}</p>
              <p className="text-sm text-gray-400">Teams Overloaded</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.round(teamWorkload.reduce((sum, t) => sum + t.capacity, 0) / teamWorkload.length)}%</p>
              <p className="text-sm text-gray-400">Avg Capacity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Workload Grid */}
      <div className="grid grid-cols-2 gap-6">
        {teamWorkload.map((team) => (
          <div
            key={team.id}
            className={`card-premium p-6 ${
              team.isOverloaded ? 'border-red-500/30' : team.isLight ? 'border-green-500/30' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${team.color}20` }}>
                  <Users className="w-6 h-6" style={{ color: team.color }} />
                </div>
                <div>
                  <h3 className="font-semibold">{team.team_name}</h3>
                  <p className="text-sm text-gray-500">{team.members || 0} team members</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                team.isOverloaded ? 'bg-red-500/20 text-red-400' :
                team.isLight ? 'bg-green-500/20 text-green-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {team.isOverloaded ? 'Overloaded' : team.isLight ? 'Available' : 'Balanced'}
              </div>
            </div>

            {/* Capacity Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">Capacity Utilization</span>
                <span className={`font-bold ${
                  team.capacity > 150 ? 'text-red-400' : team.capacity > 100 ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {team.capacity}%
                </span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    team.capacity > 150 ? 'bg-gradient-to-r from-red-500 to-red-400' :
                    team.capacity > 100 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                    'bg-gradient-to-r from-green-500 to-green-400'
                  }`}
                  style={{ width: `${Math.min(team.capacity, 200) / 2}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-2 bg-white/5 rounded-lg">
                <p className="text-lg font-bold">{team.activeProjects}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
              <div className="text-center p-2 bg-white/5 rounded-lg">
                <p className="text-lg font-bold text-red-400">{team.overdueProjects}</p>
                <p className="text-xs text-gray-500">Overdue</p>
              </div>
              <div className="text-center p-2 bg-white/5 rounded-lg">
                <p className="text-lg font-bold text-yellow-400">{team.upcomingDeadlines}</p>
                <p className="text-xs text-gray-500">Due Soon</p>
              </div>
              <div className="text-center p-2 bg-white/5 rounded-lg">
                <p className="text-lg font-bold text-orange-400">{team.criticalProjects}</p>
                <p className="text-xs text-gray-500">Critical</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Timeline View Component
function TimelineView({ projects, deliverables }: { projects: Project[]; deliverables: BimDeliverable[] }) {
  const today = new Date();
  const sortedProjects = [...projects]
    .filter(p => p.project_end_date && p.project_status !== 'completed')
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
    <div className="space-y-6">
      <div className="card-premium p-6">
        <h3 className="text-lg font-semibold mb-6">Project Timeline (Gantt View)</h3>
        
        {/* Month Headers */}
        <div className="flex items-center mb-4 ml-48">
          {months.map((month, i) => (
            <div key={i} className="flex-1 text-center text-sm text-gray-500 border-l border-white/10 first:border-l-0">
              {month}
            </div>
          ))}
        </div>

        {/* Timeline Grid */}
        <div className="space-y-3">
          {sortedProjects.slice(0, 15).map((project) => {
            const endPos = getDayPosition(project.project_end_date!);
            const startPos = project.project_start_date ? getDayPosition(project.project_start_date) : Math.max(0, endPos - 20);
            const isOverdue = new Date(project.project_end_date!) < today;
            const stageInfo = stageConfig[project.project_stage] || { color: '#6B7280', label: project.project_stage };

            return (
              <div key={project.id} className="flex items-center gap-4 group">
                <div className="w-44 flex-shrink-0">
                  <p className="text-sm font-medium truncate group-hover:text-[#00AEEF] transition-colors">
                    {project.project_name}
                  </p>
                  <p className="text-xs text-gray-500">{project.teams?.team_name || 'No team'}</p>
                </div>
                <div className="flex-1 h-8 bg-white/5 rounded-lg relative">
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
                    className={`absolute top-1 bottom-1 rounded transition-all group-hover:scale-y-110 ${
                      isOverdue ? 'animate-pulse' : ''
                    }`}
                    style={{
                      left: `${startPos}%`,
                      width: `${Math.max(endPos - startPos, 5)}%`,
                      backgroundColor: isOverdue ? '#EF4444' : stageInfo.color,
                    }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1 w-3 h-3 rounded-full bg-white/30" />
                  </div>
                </div>
                <div className="w-24 text-right text-xs text-gray-500">
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
          {Object.entries(stageConfig).slice(0, 4).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-4 h-2 rounded" style={{ backgroundColor: config.color }} />
              <span className="text-xs text-gray-400">{config.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Export Modal Component
function ExportModal({ onClose, projects, teams }: { onClose: () => void; projects: Project[]; teams: Team[] }) {
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState<'all' | 'team' | 'project' | 'deadline' | 'submission'>('all');
  const [selectedTeam, setSelectedTeam] = useState('');

  const handleExport = async () => {
    setExporting(true);
    // Export logic will be handled by xlsx skill
    setTimeout(() => {
      setExporting(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Export to Excel</h2>
              <p className="text-sm text-gray-500">Generate professional report</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Export Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'all', label: 'Full Report', icon: BarChart3 },
                { key: 'team', label: 'By Team', icon: Users },
                { key: 'project', label: 'By Project', icon: FolderKanban },
                { key: 'deadline', label: 'By Deadline', icon: Calendar },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setExportType(key as any)}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                    exportType === key
                      ? 'border-[#00AEEF] bg-[#00AEEF]/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {exportType === 'team' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Select Team</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="select-premium"
              >
                <option value="">All Teams</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.team_name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-sm font-medium mb-3">Export includes:</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>Tangent logo and branding</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>Professional formatting with headers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>Conditional formatting for status</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>Summary sheet with charts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>Multiple data sheets</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleExport} disabled={exporting} className="btn-primary">
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export Excel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
