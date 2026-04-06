'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Clock, Users, Calendar, Download, Filter,
  Video, Coffee, Monitor, TrendingUp, Loader2, RefreshCw
} from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import toast from 'react-hot-toast';
import { activityAPI, exportAPI } from '@/lib/store';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DailyActivity {
  id: string;
  user_id: string;
  display_name: string;
  team_name: string;
  date: string;
  revit_hours: number;
  meeting_hours: number;
  idle_hours: number;
  total_hours: number;
  activity_state?: string;
  current_project?: string;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'today' | 'weekly'>('today');

  useEffect(() => {
    fetchActivity();
  }, [selectedDate, view]);

  const fetchActivity = async () => {
    setIsLoading(true);
    try {
      let data;
      if (view === 'today') {
        data = await activityAPI.today();
      } else {
        const end = new Date(selectedDate);
        const start = new Date(end);
        start.setDate(start.getDate() - 7);
        data = await activityAPI.range(start.toISOString().split('T')[0], selectedDate);
      }
      setActivities(data);
    } catch (error) {
      toast.error('Failed to load activity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (type: 'daily' | 'weekly' | 'monthly') => {
    exportAPI.csv(selectedDate, type);
    toast.success('Export started');
  };

  // Calculate totals
  const totals = activities.reduce(
    (acc, a) => ({
      revit: acc.revit + (a.revit_hours || 0),
      meeting: acc.meeting + (a.meeting_hours || 0),
      idle: acc.idle + (a.idle_hours || 0),
      total: acc.total + (a.total_hours || 0),
    }),
    { revit: 0, meeting: 0, idle: 0, total: 0 }
  );

  // Hourly breakdown chart (8 AM to 6 PM highlighted)
  const hourlyLabels = Array.from({ length: 12 }, (_, i) => `${i + 7}:00`);
  const hourlyData = {
    labels: hourlyLabels,
    datasets: [
      {
        label: 'Active Users',
        data: [2, 5, 7, 8, 8, 6, 8, 8, 7, 6, 4, 2],
        backgroundColor: hourlyLabels.map((_, i) => 
          i >= 1 && i <= 10 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(148, 163, 184, 0.4)'
        ),
        borderRadius: 6,
      },
    ],
  };

  // User activity chart
  const userChartData = {
    labels: activities.slice(0, 8).map(a => a.display_name?.split(' ')[0] || 'User'),
    datasets: [
      {
        label: 'Revit',
        data: activities.slice(0, 8).map(a => a.revit_hours || 0),
        backgroundColor: '#3B82F6',
        borderRadius: 6,
      },
      {
        label: 'Meeting',
        data: activities.slice(0, 8).map(a => a.meeting_hours || 0),
        backgroundColor: '#8B5CF6',
        borderRadius: 6,
      },
      {
        label: 'Idle',
        data: activities.slice(0, 8).map(a => a.idle_hours || 0),
        backgroundColor: '#F59E0B',
        borderRadius: 6,
      },
    ],
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
          <h1 className="text-2xl font-bold text-slate-800">Activity Tracking</h1>
          <p className="text-slate-500">Monitor team activity and time tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setView('today')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === 'today' ? 'bg-white shadow text-slate-800' : 'text-slate-600'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setView('weekly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === 'weekly' ? 'bg-white shadow text-slate-800' : 'text-slate-600'
              }`}
            >
              Weekly
            </button>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200"
          />
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
              <Download className="w-4 h-4" />
              Export
            </button>
            <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport('daily')}
                className="w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 rounded-t-xl"
              >
                Daily Report
              </button>
              <button
                onClick={() => handleExport('weekly')}
                className="w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50"
              >
                Weekly Report
              </button>
              <button
                onClick={() => handleExport('monthly')}
                className="w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 rounded-b-xl"
              >
                Monthly Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-blue-100">
              <Monitor className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-slate-500">Revit Hours</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">{totals.revit.toFixed(1)}</p>
          <div className="flex items-center gap-1 mt-2 text-emerald-600 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>+12% from yesterday</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-violet-100">
              <Video className="w-6 h-6 text-violet-600" />
            </div>
            <span className="text-sm text-slate-500">Meeting Hours</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">{totals.meeting.toFixed(1)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-amber-100">
              <Coffee className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-sm text-slate-500">Idle Hours</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">{totals.idle.toFixed(1)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-emerald-100">
              <Clock className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-sm text-slate-500">Total Hours</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">{totals.total.toFixed(1)}</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Hourly Activity</h2>
              <p className="text-sm text-slate-500">Office hours (8 AM - 6 PM) highlighted in green</p>
            </div>
          </div>
          <div className="h-64">
            <Bar
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

        {/* User Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800">User Activity</h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-blue-500" /> Revit
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-violet-500" /> Meeting
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-500" /> Idle
              </span>
            </div>
          </div>
          <div className="h-64">
            <Bar
              data={userChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { stacked: true, grid: { display: false } },
                  y: { stacked: true, beginAtZero: true, grid: { color: '#E2E8F0' } },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Detailed Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Team</th>
                <th className="px-6 py-4 font-medium">Current Project</th>
                <th className="px-6 py-4 font-medium text-right">Revit</th>
                <th className="px-6 py-4 font-medium text-right">Meeting</th>
                <th className="px-6 py-4 font-medium text-right">Idle</th>
                <th className="px-6 py-4 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center font-medium text-blue-600">
                        {activity.display_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{activity.display_name}</p>
                        <p className="text-xs text-slate-500">{activity.activity_state || 'offline'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{activity.team_name || '-'}</td>
                  <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate">
                    {activity.current_project || '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-blue-600">
                    {(activity.revit_hours || 0).toFixed(1)}h
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-violet-600">
                    {(activity.meeting_hours || 0).toFixed(1)}h
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-amber-600">
                    {(activity.idle_hours || 0).toFixed(1)}h
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-800">
                    {(activity.total_hours || 0).toFixed(1)}h
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
