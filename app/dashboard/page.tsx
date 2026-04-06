'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Clock, Video, AlertTriangle, TrendingUp, Activity,
  FolderKanban, Calendar, ArrowUpRight, ArrowDownRight, RefreshCw
} from 'lucide-react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { adminAPI, activityAPI } from '@/lib/store';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Stats {
  active_users: number;
  total_users: number;
  active_projects: number;
  upcoming_deadlines: number;
  today: {
    revit_hours: number;
    meeting_hours: number;
    idle_hours: number;
    total_hours: number;
  };
}

interface Session {
  id: string;
  display_name: string;
  machine_name: string;
  activity_state: string;
  current_project: string;
  is_in_meeting: boolean;
  idle_seconds: number;
  last_update: string;
  team_name: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sharedEmails, setSharedEmails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [statsData, sessionsData, emailData] = await Promise.all([
        adminAPI.stats(),
        activityAPI.sessions(),
        adminAPI.emailUsage(),
      ]);
      setStats(statsData);
      setSessions(sessionsData);
      setSharedEmails(emailData.shared_emails || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'active': return 'bg-emerald-500';
      case 'meeting': return 'bg-violet-500';
      case 'idle': return 'bg-amber-500';
      default: return 'bg-slate-400';
    }
  };

  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'active': return 'badge-active';
      case 'meeting': return 'badge-meeting';
      case 'idle': return 'badge-idle';
      default: return 'badge-offline';
    }
  };

  // Chart data
  const hourlyData = {
    labels: ['8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM'],
    datasets: [
      {
        label: 'Revit',
        data: [4, 6, 7, 8, 5, 7, 8, 7, 6, 5, 3],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Meeting',
        data: [1, 2, 1, 0, 2, 1, 0, 2, 1, 1, 0],
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const distributionData = {
    labels: ['Revit', 'Meeting', 'Idle'],
    datasets: [{
      data: [
        stats?.today.revit_hours || 0,
        stats?.today.meeting_hours || 0,
        stats?.today.idle_hours || 0,
      ],
      backgroundColor: ['#3B82F6', '#8B5CF6', '#F59E0B'],
      borderWidth: 0,
    }],
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500">Real-time activity overview</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'spinner' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover"
        >
          <div className="flex items-start justify-between">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="flex items-center text-sm font-medium text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
              12%
            </span>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mt-4">{stats?.active_users || 0}</h3>
          <p className="text-sm text-slate-500 mt-1">Active Users</p>
          <p className="text-xs text-slate-400">of {stats?.total_users || 0} total</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover"
        >
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20 w-fit">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mt-4">
            {stats?.today.revit_hours.toFixed(1) || '0.0'}
          </h3>
          <p className="text-sm text-slate-500 mt-1">Revit Hours</p>
          <p className="text-xs text-slate-400">Today</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover"
        >
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg shadow-violet-500/20 w-fit">
            <Video className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mt-4">
            {stats?.today.meeting_hours.toFixed(1) || '0.0'}
          </h3>
          <p className="text-sm text-slate-500 mt-1">Meeting Hours</p>
          <p className="text-xs text-slate-400">Today</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover"
        >
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20 w-fit">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mt-4">{sharedEmails.length}</h3>
          <p className="text-sm text-slate-500 mt-1">Shared Licenses</p>
          <p className="text-xs text-slate-400">Requires attention</p>
        </motion.div>
      </div>

      {/* Shared License Alert */}
      {sharedEmails.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 rounded-2xl p-5"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-rose-800">Shared License Detected</h3>
              <p className="text-sm text-rose-600 mt-1">
                {sharedEmails.length} Autodesk ID{sharedEmails.length > 1 ? 's are' : ' is'} being shared
              </p>
              <div className="mt-3 space-y-2">
                {sharedEmails.map((item, i) => (
                  <div key={i} className="bg-white/60 rounded-lg p-3">
                    <p className="text-sm font-medium text-rose-700">{item.email}</p>
                    <p className="text-xs text-rose-500 mt-1">
                      Used by: {item.users?.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Hourly Activity</h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                Revit
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-violet-500" />
                Meeting
              </span>
            </div>
          </div>
          <div className="h-64">
            <Line
              data={hourlyData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, grid: { color: '#E2E8F0' } },
                  x: { grid: { display: false } },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Distribution</h2>
          <div className="h-48">
            <Doughnut
              data={distributionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                  legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Team Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Team Activity</h2>
          <p className="text-sm text-slate-500">Real-time status of all team members</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Current Project</th>
                <th className="px-6 py-4 font-medium">Team</th>
                <th className="px-6 py-4 font-medium">Last Update</th>
              </tr>
            </thead>
            <tbody>
              {sessions.slice(0, 10).map((session) => (
                <tr key={session.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl flex items-center justify-center font-medium text-slate-600">
                          {session.display_name?.charAt(0) || 'U'}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(session.activity_state)}`} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{session.display_name || session.machine_name}</p>
                        <p className="text-xs text-slate-500">{session.machine_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${getStatusBadge(session.activity_state)}`}>
                      {session.activity_state}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {session.current_project || '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {session.team_name || '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {new Date(session.last_update).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
