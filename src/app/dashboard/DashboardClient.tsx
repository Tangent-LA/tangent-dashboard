'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { getSupabase } from '@/lib/supabase';
import { calculateStats, filterProjects, cn } from '@/lib/utils';
import type { Project, ProjectWithDetails, Team, DashboardStats } from '@/types';
import { StageChart } from '@/components/charts/StageChart';
import { PriorityChart } from '@/components/charts/PriorityChart';
import { WeeklyChart } from '@/components/charts/WeeklyChart';
import { ProjectsTable } from '@/components/ProjectsTable';
import { ExportModal } from '@/components/ExportModal';
import toast from 'react-hot-toast';

export default function DashboardClient() {
  const router = useRouter();
  const { projects, setProjects, teams, setTeams, filters, setFilters } = useStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      setStats(calculateStats(projects));
    }
  }, [projects]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const supabase = await getSupabase();
      if (!supabase) {
        toast.error('Unable to connect to server');
        return;
      }

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects_with_details')
        .select('*')
        .order('deadline', { ascending: true });

      if (projectsError) throw projectsError;
     setProjects(projectsData as ProjectWithDetails[]);

      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('team_name');

      if (teamsError) throw teamsError;
      setTeams(teamsData as Team[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChartClick = (type: string, value: string) => {
    setFilters({ [type]: value });
    router.push('/dashboard/projects');
  };

  const filteredProjects = filterProjects(projects, filters);

  const statCards = [
    { label: 'Total Projects', value: stats?.totalProjects || 0, icon: FolderKanban, color: 'blue', trend: '+12%', trendUp: true },
    { label: 'Completed', value: stats?.completedProjects || 0, icon: CheckCircle2, color: 'green', trend: '+8%', trendUp: true },
    { label: 'In Progress', value: stats?.inProgressProjects || 0, icon: Clock, color: 'orange', trend: '-3%', trendUp: false },
    { label: 'Overdue', value: stats?.overdueProjects || 0, icon: AlertTriangle, color: 'red', trend: '-2', trendUp: false },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-tangent-blue/15 text-tangent-blue',
    green: 'bg-green-500/15 text-green-500',
    orange: 'bg-orange-500/15 text-orange-500',
    red: 'bg-red-500/15 text-red-500',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Project Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Welcome back! Here&apos;s your project overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn-ghost flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={() => setShowExportModal(true)} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="stat-card"
          >
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', colorMap[stat.color])}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
              </div>
              <span className={cn(
                'text-xs font-semibold px-2 py-1 rounded-full',
                stat.trendUp ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'
              )}>
                {stat.trend}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 chart-card"
        >
          <h2 className="text-lg font-semibold mb-6">Projects by Stage</h2>
          <div className="h-80">
            {stats && <StageChart data={stats.projectsByStage} onClick={(stage) => handleChartClick('stage', stage)} />}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="chart-card"
        >
          <h2 className="text-lg font-semibold mb-6">By Priority</h2>
          <div className="h-80">
            {stats && <PriorityChart data={stats.projectsByPriority} onClick={(priority) => handleChartClick('priority', priority)} />}
          </div>
        </motion.div>
      </div>

      {/* Weekly Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="chart-card"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Weekly Submissions</h2>
            <p className="text-sm text-gray-400">Project submissions over the past weeks</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-green-500 font-medium">+15%</span>
            <span className="text-gray-500">vs last month</span>
          </div>
        </div>
        <div className="h-64">
          {stats && <WeeklyChart data={stats.weeklySubmissions} />}
        </div>
      </motion.div>

      {/* Recent Projects */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Recent Projects</h2>
          <button
            onClick={() => router.push('/dashboard/projects')}
            className="text-sm text-tangent-blue hover:text-tangent-blue-light transition-colors"
          >
            View all →
          </button>
        </div>
        <ProjectsTable projects={filteredProjects.slice(0, 5)} onProjectClick={(id) => router.push(`/projects/${id}`)} />
      </motion.div>

      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} projects={projects} teams={teams} />
    </div>
  );
}
