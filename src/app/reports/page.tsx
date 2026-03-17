'use client';

import { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import {
  BarChart3,
  ChevronLeft,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Target,
  Calendar,
  PieChart,
  Activity,
  FileSpreadsheet,
} from 'lucide-react';

type Project = {
  id: string;
  project_name: string;
  project_status: string;
  project_stage: string;
  project_priority: string;
  project_end_date: string | null;
  progress_percentage: number;
  team_id: string | null;
  teams?: { team_name: string; color: string } | null;
  created_at: string;
};

type Team = {
  id: string;
  team_name: string;
  color: string;
};

const stageConfig: Record<string, { label: string; color: string }> = {
  sd_design: { label: 'SD Design', color: '#8B5CF6' },
  dd_design: { label: 'DD Design', color: '#3B82F6' },
  ifc: { label: 'IFC', color: '#10B981' },
  bim_submission: { label: 'BIM Submission', color: '#F59E0B' },
  revised_dd: { label: 'Revised DD', color: '#EC4899' },
  construction: { label: 'Construction', color: '#06B6D4' },
};

export default function ReportsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [projectsRes, teamsRes] = await Promise.all([
      supabase.from('projects').select('*, teams(team_name, color)'),
      supabase.from('teams').select('*').eq('is_active', true),
    ]);

    if (projectsRes.data) setProjects(projectsRes.data);
    if (teamsRes.data) setTeams(teamsRes.data);
    setLoading(false);
  };

  // Analytics calculations
  const analytics = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Filter by date range
    let filteredProjects = [...projects];
    if (dateRange !== 'all') {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const cutoff = new Date(today.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
      filteredProjects = projects.filter(p => p.created_at >= cutoff);
    }

    const total = filteredProjects.length;
    const active = filteredProjects.filter(p => p.project_status === 'active' || p.project_status === 'in_progress').length;
    const completed = filteredProjects.filter(p => p.project_status === 'completed').length;
    const overdue = filteredProjects.filter(p => {
      if (!p.project_end_date || p.project_status === 'completed') return false;
      return p.project_end_date < todayStr;
    }).length;

    // By stage
    const byStage = Object.entries(stageConfig).map(([key, config]) => ({
      stage: key,
      label: config.label,
      color: config.color,
      count: filteredProjects.filter(p => p.project_stage === key).length,
    }));

    // By team
    const byTeam = teams.map(team => ({
      ...team,
      count: filteredProjects.filter(p => p.team_id === team.id).length,
    })).sort((a, b) => b.count - a.count);

    // By priority
    const byPriority = [
      { priority: 'critical', label: 'Critical', color: '#EF4444', count: filteredProjects.filter(p => p.project_priority === 'critical').length },
      { priority: 'high', label: 'High', color: '#F59E0B', count: filteredProjects.filter(p => p.project_priority === 'high').length },
      { priority: 'medium', label: 'Medium', color: '#3B82F6', count: filteredProjects.filter(p => p.project_priority === 'medium').length },
      { priority: 'low', label: 'Low', color: '#10B981', count: filteredProjects.filter(p => p.project_priority === 'low').length },
    ];

    // Average progress
    const avgProgress = total > 0 
      ? Math.round(filteredProjects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / total)
      : 0;

    // Completion rate
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // On-time rate (completed projects that weren't overdue at completion)
    const onTimeRate = completed > 0 ? Math.round((completed - overdue) / total * 100) : 0;

    return {
      total,
      active,
      completed,
      overdue,
      byStage,
      byTeam,
      byPriority,
      avgProgress,
      completionRate,
      onTimeRate,
    };
  }, [projects, teams, dateRange]);

  const maxTeamCount = Math.max(...analytics.byTeam.map(t => t.count), 1);
  const maxStageCount = Math.max(...analytics.byStage.map(s => s.count), 1);

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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="text-gradient">Reports & Analytics</span>
            </h1>
            <p className="text-gray-400 mt-1">Project insights and performance metrics</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Filter */}
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl">
            {[
              { key: '7d', label: '7 Days' },
              { key: '30d', label: '30 Days' },
              { key: '90d', label: '90 Days' },
              { key: 'all', label: 'All Time' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setDateRange(key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dateRange === key
                    ? 'bg-[#00AEEF] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button className="btn-primary">
            <Download className="w-5 h-5" />
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-6 gap-4">
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="kpi-icon bg-blue-500/20">
              <FolderKanban className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics.total}</p>
              <p className="text-sm text-gray-400">Total Projects</p>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="kpi-icon bg-green-500/20">
              <Activity className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics.active}</p>
              <p className="text-sm text-gray-400">Active</p>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="kpi-icon bg-purple-500/20">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics.completed}</p>
              <p className="text-sm text-gray-400">Completed</p>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="kpi-icon bg-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{analytics.overdue}</p>
              <p className="text-sm text-gray-400">Overdue</p>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="kpi-icon bg-cyan-500/20">
              <Target className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics.avgProgress}%</p>
              <p className="text-sm text-gray-400">Avg Progress</p>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="kpi-icon bg-amber-500/20">
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics.completionRate}%</p>
              <p className="text-sm text-gray-400">Completion Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Projects by Stage */}
        <div className="card-premium p-6">
          <h3 className="text-lg font-semibold mb-6">Projects by Stage</h3>
          <div className="space-y-4">
            {analytics.byStage.map(({ stage, label, color, count }) => (
              <div key={stage}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">{label}</span>
                  <span className="text-sm font-semibold">{count}</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(count / maxStageCount) * 100}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Projects by Team */}
        <div className="card-premium p-6">
          <h3 className="text-lg font-semibold mb-6">Projects by Team</h3>
          <div className="space-y-4">
            {analytics.byTeam.slice(0, 6).map((team) => (
              <div key={team.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                    <span className="text-sm text-gray-400">{team.team_name}</span>
                  </div>
                  <span className="text-sm font-semibold">{team.count}</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(team.count / maxTeamCount) * 100}%`,
                      backgroundColor: team.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="card-premium p-6">
          <h3 className="text-lg font-semibold mb-6">Priority Distribution</h3>
          <div className="space-y-4">
            {analytics.byPriority.map(({ priority, label, color, count }) => {
              const percentage = analytics.total > 0 ? Math.round((count / analytics.total) * 100) : 0;
              return (
                <div key={priority} className="flex items-center gap-4">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400">{label}</span>
                      <span className="text-sm font-semibold">{count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="card-premium p-6">
        <h3 className="text-lg font-semibold mb-6">Performance Overview</h3>
        <div className="grid grid-cols-4 gap-6">
          <div className="text-center p-6 bg-white/5 rounded-xl">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#10B981"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${analytics.completionRate * 2.51} 251`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{analytics.completionRate}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">Completion Rate</p>
          </div>

          <div className="text-center p-6 bg-white/5 rounded-xl">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#00AEEF"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${analytics.avgProgress * 2.51} 251`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{analytics.avgProgress}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">Average Progress</p>
          </div>

          <div className="text-center p-6 bg-white/5 rounded-xl">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#8B5CF6"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${analytics.onTimeRate * 2.51} 251`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{analytics.onTimeRate}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">On-Time Rate</p>
          </div>

          <div className="text-center p-6 bg-white/5 rounded-xl">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke={analytics.overdue > 0 ? '#EF4444' : '#10B981'}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(analytics.total > 0 ? (analytics.total - analytics.overdue) / analytics.total * 100 : 100) * 2.51} 251`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{analytics.total > 0 ? Math.round((analytics.total - analytics.overdue) / analytics.total * 100) : 100}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">Health Score</p>
          </div>
        </div>
      </div>
    </div>
  );
}
