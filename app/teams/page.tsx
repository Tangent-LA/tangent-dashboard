'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Plus, Edit, Trash2, MoreVertical, X, Loader2,
  FolderKanban, Clock, AlertTriangle, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { teamsAPI, adminAPI } from '@/lib/store';

interface Team {
  id: string;
  name: string;
  description: string;
  color: string;
  member_count: number;
  active_projects: number;
  leader_name?: string;
}

interface TeamStats {
  team_id: string;
  team_name: string;
  team_members: number;
  active_projects: number;
  overdue_projects: number;
  upcoming_deadlines: number;
  critical_projects: number;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const data = await teamsAPI.list();
      setTeams(data);
    } catch (error) {
      toast.error('Failed to load teams');
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="text-2xl font-bold text-slate-800">Teams</h1>
          <p className="text-slate-500">Manage your 6 landscape architecture teams</p>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team, index) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${team.color}20` }}
                >
                  <Users className="w-6 h-6" style={{ color: team.color }} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{team.name}</h3>
                  <p className="text-sm text-slate-500">{team.description}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-slate-800">{team.member_count || 0}</p>
                <p className="text-xs text-slate-500">Members</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-slate-800">{team.active_projects || 0}</p>
                <p className="text-xs text-slate-500">Projects</p>
              </div>
            </div>

            {team.leader_name && (
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                <span className="font-medium">Team Lead:</span>
                <span>{team.leader_name}</span>
              </div>
            )}

            <button className="w-full py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              View Details
            </button>
          </motion.div>
        ))}
      </div>

      {/* Team Workload Overview */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Team Workload</h2>
          <p className="text-sm text-slate-500">Overview of team capacity and deadlines</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                <th className="px-6 py-4 font-medium">Team</th>
                <th className="px-6 py-4 font-medium">Members</th>
                <th className="px-6 py-4 font-medium">Active Projects</th>
                <th className="px-6 py-4 font-medium">Upcoming Deadlines</th>
                <th className="px-6 py-4 font-medium">Workload</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => {
                const workload = ((team.active_projects || 0) / Math.max(team.member_count || 1, 1)) * 100;
                const workloadColor = workload > 150 ? 'rose' : workload > 100 ? 'amber' : 'emerald';
                
                return (
                  <tr key={team.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="font-medium text-slate-800">{team.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{team.member_count || 0}</td>
                    <td className="px-6 py-4 text-slate-600">{team.active_projects || 0}</td>
                    <td className="px-6 py-4">
                      <span className="badge badge-medium">-</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full bg-${workloadColor}-500`}
                            style={{ width: `${Math.min(workload, 100)}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium text-${workloadColor}-600`}>
                          {workload.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
