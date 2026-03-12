'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import {
  FolderKanban,
  CheckSquare,
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Activity,
  FileBox,
  CalendarDays,
} from 'lucide-react';

type DashboardStats = {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  totalTeams: number;
  totalMembers: number;
  bimDeliverables: number;
};

type RecentActivity = {
  id: string;
  action: string;
  entity_type: string;
  entity_name: string;
  created_at: string;
  profiles?: { full_name: string } | null;
};

type ProjectStage = {
  stage: string;
  count: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    overdueProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    totalTeams: 0,
    totalMembers: 0,
    bimDeliverables: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [projectStages, setProjectStages] = useState<ProjectStage[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const now = new Date().toISOString();

    // Fetch projects stats
    const { data: projects } = await supabase.from('projects').select('id, project_status, project_end_date, project_stage');
    const projectsData = projects || [];
    
    const overdueProjects = projectsData.filter(p => 
      p.project_end_date && 
      new Date(p.project_end_date) < new Date() && 
      p.project_status !== 'completed'
    ).length;

    // Count by stage
    const stageCounts: Record<string, number> = {};
    projectsData.forEach(p => {
      const stage = p.project_stage || 'unknown';
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    });
    setProjectStages(Object.entries(stageCounts).map(([stage, count]) => ({ stage, count })));

    // Fetch tasks stats
    const { data: tasks } = await supabase.from('tasks').select('id, status, due_date');
    const tasksData = tasks || [];
    
    const overdueTasks = tasksData.filter(t => 
      t.due_date && 
      new Date(t.due_date) < new Date() && 
      t.status !== 'done' && 
      t.status !== 'completed'
    ).length;

    // Fetch teams stats
    const { count: teamsCount } = await supabase.from('teams').select('*', { count: 'exact', head: true }).eq('is_active', true);
    const { count: membersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true);

    // Fetch BIM deliverables count
    const { count: bimCount } = await supabase.from('bim_deliverables').select('*', { count: 'exact', head: true });

    // Fetch recent activity
    const { data: activityData } = await supabase
      .from('activity_logs')
      .select('id, action, entity_type, entity_name, created_at, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(8);

    setStats({
      totalProjects: projectsData.length,
      activeProjects: projectsData.filter(p => p.project_status === 'active' || p.project_status === 'in_progress').length,
      completedProjects: projectsData.filter(p => p.project_status === 'completed').length,
      overdueProjects,
      totalTasks: tasksData.length,
      completedTasks: tasksData.filter(t => t.status === 'done' || t.status === 'completed').length,
      pendingTasks: tasksData.filter(t => t.status === 'todo' || t.status === 'pending').length,
      overdueTasks,
      totalTeams: teamsCount || 0,
      totalMembers: membersCount || 0,
      bimDeliverables: bimCount || 0,
    });

    setRecentActivity(activityData || []);
    setLoading(false);
  };

  const taskCompletionPercent = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  const stageLabels: Record<string, string> = {
    sd_design: 'SD Design',
    dd_design: 'DD Design',
    ifc: 'IFC',
    bim_submission: 'BIM Submission',
    revised_dd: 'Revised DD',
    construction: 'Construction',
  };

  const stageColors: Record<string, string> = {
    sd_design: 'bg-blue-500',
    dd_design: 'bg-purple-500',
    ifc: 'bg-green-500',
    bim_submission: 'bg-orange-500',
    revised_dd: 'bg-yellow-500',
    construction: 'bg-cyan-500',
  };

  const maxStageCount = Math.max(...projectStages.map(s => s.count), 1);

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
      <div>
        <h1 className="text-3xl font-bold">
          <span className="text-gradient">Dashboard</span>
        </h1>
        <p className="text-gray-400 mt-1">Welcome back! Here's your project overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="flex items-center gap-4">
            <div className="kpi-icon bg-[#00AEEF]/20">
              <FolderKanban className="w-6 h-6 text-[#00AEEF]" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.totalProjects}</p>
              <p className="text-sm text-gray-400">Total Projects</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-green-400">{stats.activeProjects} active</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-400">{stats.completedProjects} completed</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-center gap-4">
            <div className="kpi-icon bg-green-500/20">
              <CheckSquare className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.completedTasks}</p>
              <p className="text-sm text-gray-400">Tasks Completed</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-400">Progress</span>
              <span className="text-[#00AEEF]">{taskCompletionPercent}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#00AEEF] to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${taskCompletionPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-center gap-4">
            <div className="kpi-icon bg-blue-500/20">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.pendingTasks}</p>
              <p className="text-sm text-gray-400">Pending Tasks</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-gray-400">of {stats.totalTasks} total</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-center gap-4">
            <div className="kpi-icon bg-red-500/20">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.overdueTasks + stats.overdueProjects}</p>
              <p className="text-sm text-gray-400">Overdue Items</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-red-400">{stats.overdueTasks} tasks</span>
            <span className="text-gray-600">•</span>
            <span className="text-red-400">{stats.overdueProjects} projects</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Project Stages Chart */}
        <div className="col-span-2 card-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Projects by Stage</h2>
            <Link href="/projects" className="text-xs text-[#00AEEF] hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          
          {projectStages.length === 0 ? (
            <div className="text-center py-12">
              <FolderKanban className="w-12 h-12 mx-auto mb-3 text-gray-700" />
              <p className="text-gray-500">No projects yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projectStages.map(({ stage, count }) => (
                <div key={stage} className="flex items-center gap-4">
                  <div className="w-28 text-sm text-gray-400 truncate">
                    {stageLabels[stage] || stage.replace('_', ' ')}
                  </div>
                  <div className="flex-1 h-8 bg-white/5 rounded-lg overflow-hidden">
                    <div 
                      className={`h-full ${stageColors[stage] || 'bg-gray-500'} rounded-lg transition-all duration-500 flex items-center justify-end pr-3`}
                      style={{ width: `${(count / maxStageCount) * 100}%` }}
                    >
                      <span className="text-xs font-medium text-white">{count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Task Completion Ring */}
        <div className="card-premium p-6">
          <h2 className="text-lg font-semibold mb-6">Task Completion</h2>
          <div className="flex flex-col items-center">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="12"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${taskCompletionPercent * 4.4} 440`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00AEEF" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{taskCompletionPercent}%</span>
                <span className="text-xs text-gray-400">Complete</span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 w-full">
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <p className="text-xl font-bold text-green-400">{stats.completedTasks}</p>
                <p className="text-xs text-gray-400">Done</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <p className="text-xl font-bold text-yellow-400">{stats.pendingTasks}</p>
                <p className="text-xs text-gray-400">Pending</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="card-premium p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link href="/projects" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium group-hover:text-[#00AEEF] transition-colors">Projects</p>
                <p className="text-xs text-gray-500">{stats.totalProjects} total</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-[#00AEEF] transition-colors" />
            </Link>
            <Link href="/tasks" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium group-hover:text-[#00AEEF] transition-colors">Tasks</p>
                <p className="text-xs text-gray-500">{stats.totalTasks} total</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-[#00AEEF] transition-colors" />
            </Link>
            <Link href="/teams" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium group-hover:text-[#00AEEF] transition-colors">Teams</p>
                <p className="text-xs text-gray-500">{stats.totalTeams} teams</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-[#00AEEF] transition-colors" />
            </Link>
            <Link href="/bim" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <FileBox className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium group-hover:text-[#00AEEF] transition-colors">BIM Deliverables</p>
                <p className="text-xs text-gray-500">{stats.bimDeliverables} items</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-[#00AEEF] transition-colors" />
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-2 card-premium p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Link href="/activity" className="text-xs text-[#00AEEF] hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-10 h-10 mx-auto mb-2 text-gray-700" />
              <p className="text-gray-500 text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                  <div className="w-8 h-8 rounded-full bg-[#00AEEF]/20 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-[#00AEEF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.profiles?.full_name || 'Someone'}</span>
                      {' '}<span className="text-gray-400">{activity.action}</span>{' '}
                      <span className="text-[#00AEEF]">{activity.entity_name}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
