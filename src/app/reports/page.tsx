'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import {
  BarChart3,
  ChevronLeft,
  Download,
  Calendar,
  TrendingUp,
  Users,
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  Clock,
} from 'lucide-react';

type ReportType = 'overview' | 'projects' | 'tasks' | 'teams' | 'deadlines';

type ReportData = {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalTeams: number;
  totalMembers: number;
  projectsByStage: { stage: string; count: number }[];
  tasksByStatus: { status: string; count: number }[];
  upcomingDeadlines: { name: string; date: string; type: string }[];
  teamWorkload: { team: string; tasks: number; projects: number }[];
};

const reportTypes = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'projects', label: 'Project Progress', icon: FolderKanban },
  { key: 'tasks', label: 'Task Completion', icon: CheckSquare },
  { key: 'teams', label: 'Team Productivity', icon: Users },
  { key: 'deadlines', label: 'Deadline Risk', icon: AlertTriangle },
];

const dateRanges = [
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'quarter', label: 'This Quarter' },
  { key: 'year', label: 'This Year' },
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('overview');
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange]);

  const fetchReportData = async () => {
    setLoading(true);

    // Fetch projects
    const { data: projects } = await supabase.from('projects').select('id, project_status, project_stage, project_end_date, team_id');
    const projectsData = projects || [];

    // Fetch tasks
    const { data: tasks } = await supabase.from('tasks').select('id, status, due_date, assignee_id');
    const tasksData = tasks || [];

    // Fetch teams with member count
    const { data: teams } = await supabase.from('teams').select('id, team_name').eq('is_active', true);
    const teamsData = teams || [];

    // Fetch profiles
    const { data: profiles } = await supabase.from('profiles').select('id, team_id').eq('is_active', true);
    const profilesData = profiles || [];

    // Calculate stats
    const projectsByStage: Record<string, number> = {};
    projectsData.forEach(p => {
      const stage = p.project_stage || 'unknown';
      projectsByStage[stage] = (projectsByStage[stage] || 0) + 1;
    });

    const tasksByStatus: Record<string, number> = {};
    tasksData.forEach(t => {
      const status = t.status || 'unknown';
      tasksByStatus[status] = (tasksByStatus[status] || 0) + 1;
    });

    const now = new Date();
    const upcomingDeadlines: { name: string; date: string; type: string }[] = [];
    
    projectsData.forEach(p => {
      if (p.project_end_date) {
        const endDate = new Date(p.project_end_date);
        const daysUntil = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 14 && daysUntil >= 0) {
          upcomingDeadlines.push({
            name: `Project ${p.id.slice(0, 8)}`,
            date: p.project_end_date,
            type: 'project',
          });
        }
      }
    });

    // Team workload
    const teamWorkload = teamsData.map(team => {
      const teamProjects = projectsData.filter(p => p.team_id === team.id).length;
      const teamMembers = profilesData.filter(p => p.team_id === team.id);
      const memberIds = teamMembers.map(m => m.id);
      const teamTasks = tasksData.filter(t => t.assignee_id && memberIds.includes(t.assignee_id)).length;
      return {
        team: team.team_name,
        tasks: teamTasks,
        projects: teamProjects,
      };
    });

    setData({
      totalProjects: projectsData.length,
      activeProjects: projectsData.filter(p => p.project_status === 'active' || p.project_status === 'in_progress').length,
      completedProjects: projectsData.filter(p => p.project_status === 'completed').length,
      totalTasks: tasksData.length,
      completedTasks: tasksData.filter(t => t.status === 'done' || t.status === 'completed').length,
      overdueTasks: tasksData.filter(t => {
        if (!t.due_date || t.status === 'done') return false;
        return new Date(t.due_date) < now;
      }).length,
      totalTeams: teamsData.length,
      totalMembers: profilesData.length,
      projectsByStage: Object.entries(projectsByStage).map(([stage, count]) => ({ stage, count })),
      tasksByStatus: Object.entries(tasksByStatus).map(([status, count]) => ({ status, count })),
      upcomingDeadlines: upcomingDeadlines.slice(0, 10),
      teamWorkload,
    });

    setLoading(false);
  };

  const stageLabels: Record<string, string> = {
    sd_design: 'SD Design',
    dd_design: 'DD Design',
    ifc: 'IFC',
    bim_submission: 'BIM Submission',
    revised_dd: 'Revised DD',
    construction: 'Construction',
  };

  const statusLabels: Record<string, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    in_review: 'In Review',
    blocked: 'Blocked',
    done: 'Done',
  };

  const maxStageCount = Math.max(...(data?.projectsByStage.map(s => s.count) || [1]), 1);
  const maxStatusCount = Math.max(...(data?.tasksByStatus.map(s => s.count) || [1]), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="text-gradient">Reports</span>
            </h1>
            <p className="text-gray-400 mt-1">Analytics and insights for your projects</p>
          </div>
        </div>
        <button className="btn-primary">
          <Download className="w-5 h-5" />
          Export Report
        </button>
      </div>

      {/* Report Type Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl flex-1">
          {reportTypes.map((type) => (
            <button
              key={type.key}
              onClick={() => setReportType(type.key as ReportType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                reportType === type.key
                  ? 'bg-[#00AEEF] text-white shadow-lg shadow-[#00AEEF]/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <type.icon className="w-4 h-4" />
              {type.label}
            </button>
          ))}
        </div>

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="select-premium w-40"
        >
          {dateRanges.map(r => (
            <option key={r.key} value={r.key}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Overview Report */}
      {reportType === 'overview' && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="card-premium p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{data.totalProjects}</p>
                  <p className="text-sm text-gray-400">Total Projects</p>
                </div>
              </div>
            </div>
            <div className="card-premium p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <CheckSquare className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{data.totalTasks}</p>
                  <p className="text-sm text-gray-400">Total Tasks</p>
                </div>
              </div>
            </div>
            <div className="card-premium p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{data.totalMembers}</p>
                  <p className="text-sm text-gray-400">Team Members</p>
                </div>
              </div>
            </div>
            <div className="card-premium p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{data.overdueTasks}</p>
                  <p className="text-sm text-gray-400">Overdue Tasks</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="card-premium p-6">
              <h3 className="font-semibold mb-4">Projects by Stage</h3>
              <div className="space-y-3">
                {data.projectsByStage.map(({ stage, count }) => (
                  <div key={stage} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-gray-400 truncate">
                      {stageLabels[stage] || stage.replace('_', ' ')}
                    </div>
                    <div className="flex-1 h-6 bg-white/5 rounded-lg overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-end pr-2"
                        style={{ width: `${(count / maxStageCount) * 100}%` }}
                      >
                        <span className="text-xs font-medium">{count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-premium p-6">
              <h3 className="font-semibold mb-4">Tasks by Status</h3>
              <div className="space-y-3">
                {data.tasksByStatus.map(({ status, count }) => (
                  <div key={status} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-gray-400 truncate">
                      {statusLabels[status] || status.replace('_', ' ')}
                    </div>
                    <div className="flex-1 h-6 bg-white/5 rounded-lg overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-end pr-2"
                        style={{ width: `${(count / maxStatusCount) * 100}%` }}
                      >
                        <span className="text-xs font-medium">{count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects Report */}
      {reportType === 'projects' && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="card-premium p-5">
              <p className="text-sm text-gray-400 mb-1">Active Projects</p>
              <p className="text-4xl font-bold text-green-400">{data.activeProjects}</p>
            </div>
            <div className="card-premium p-5">
              <p className="text-sm text-gray-400 mb-1">Completed Projects</p>
              <p className="text-4xl font-bold text-blue-400">{data.completedProjects}</p>
            </div>
            <div className="card-premium p-5">
              <p className="text-sm text-gray-400 mb-1">Completion Rate</p>
              <p className="text-4xl font-bold text-[#00AEEF]">
                {data.totalProjects > 0 ? Math.round((data.completedProjects / data.totalProjects) * 100) : 0}%
              </p>
            </div>
          </div>

          <div className="card-premium p-6">
            <h3 className="font-semibold mb-4">Projects by Stage Distribution</h3>
            <div className="space-y-4">
              {data.projectsByStage.map(({ stage, count }) => (
                <div key={stage} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-gray-400">
                    {stageLabels[stage] || stage.replace('_', ' ')}
                  </div>
                  <div className="flex-1 h-8 bg-white/5 rounded-lg overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#00AEEF] to-cyan-400 rounded-lg flex items-center justify-end pr-3 transition-all duration-500"
                      style={{ width: `${(count / maxStageCount) * 100}%` }}
                    >
                      <span className="text-sm font-medium">{count} projects</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tasks Report */}
      {reportType === 'tasks' && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="card-premium p-5">
              <p className="text-sm text-gray-400 mb-1">Completed Tasks</p>
              <p className="text-4xl font-bold text-green-400">{data.completedTasks}</p>
            </div>
            <div className="card-premium p-5">
              <p className="text-sm text-gray-400 mb-1">Pending Tasks</p>
              <p className="text-4xl font-bold text-yellow-400">{data.totalTasks - data.completedTasks}</p>
            </div>
            <div className="card-premium p-5">
              <p className="text-sm text-gray-400 mb-1">Completion Rate</p>
              <p className="text-4xl font-bold text-[#00AEEF]">
                {data.totalTasks > 0 ? Math.round((data.completedTasks / data.totalTasks) * 100) : 0}%
              </p>
            </div>
          </div>

          <div className="card-premium p-6">
            <h3 className="font-semibold mb-4">Tasks by Status</h3>
            <div className="space-y-4">
              {data.tasksByStatus.map(({ status, count }) => (
                <div key={status} className="flex items-center gap-4">
                  <div className="w-28 text-sm text-gray-400 capitalize">
                    {statusLabels[status] || status.replace('_', ' ')}
                  </div>
                  <div className="flex-1 h-8 bg-white/5 rounded-lg overflow-hidden">
                    <div 
                      className={`h-full rounded-lg flex items-center justify-end pr-3 ${
                        status === 'done' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                        status === 'blocked' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                        'bg-gradient-to-r from-blue-500 to-cyan-500'
                      }`}
                      style={{ width: `${(count / maxStatusCount) * 100}%` }}
                    >
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Teams Report */}
      {reportType === 'teams' && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="card-premium p-5">
              <p className="text-sm text-gray-400 mb-1">Total Teams</p>
              <p className="text-4xl font-bold text-purple-400">{data.totalTeams}</p>
            </div>
            <div className="card-premium p-5">
              <p className="text-sm text-gray-400 mb-1">Total Members</p>
              <p className="text-4xl font-bold text-blue-400">{data.totalMembers}</p>
            </div>
          </div>

          <div className="card-premium p-6">
            <h3 className="font-semibold mb-4">Team Workload</h3>
            <table className="table-premium">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Assigned Tasks</th>
                  <th>Projects</th>
                </tr>
              </thead>
              <tbody>
                {data.teamWorkload.map((team) => (
                  <tr key={team.team}>
                    <td className="font-medium">{team.team}</td>
                    <td>{team.tasks}</td>
                    <td>{team.projects}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deadlines Report */}
      {reportType === 'deadlines' && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="card-premium p-5">
              <p className="text-sm text-gray-400 mb-1">Overdue Tasks</p>
              <p className="text-4xl font-bold text-red-400">{data.overdueTasks}</p>
            </div>
            <div className="card-premium p-5">
              <p className="text-sm text-gray-400 mb-1">Upcoming Deadlines (14 days)</p>
              <p className="text-4xl font-bold text-yellow-400">{data.upcomingDeadlines.length}</p>
            </div>
          </div>

          <div className="card-premium p-6">
            <h3 className="font-semibold mb-4">Upcoming Deadlines</h3>
            {data.upcomingDeadlines.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No upcoming deadlines in the next 14 days</p>
            ) : (
              <div className="space-y-3">
                {data.upcomingDeadlines.map((item, idx) => {
                  const daysUntil = Math.ceil((new Date(item.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        daysUntil <= 3 ? 'bg-red-500/20' : 'bg-yellow-500/20'
                      }`}>
                        <Clock className={`w-5 h-5 ${daysUntil <= 3 ? 'text-red-400' : 'text-yellow-400'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{item.type}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${daysUntil <= 3 ? 'text-red-400' : 'text-yellow-400'}`}>
                          {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                        </p>
                        <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
