'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Edit, Trash2, X, Loader2, FolderKanban, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { getSupabase } from '@/lib/supabase';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';
import type { Team, User, Project } from '@/types';
import toast from 'react-hot-toast';

export default function TeamsClient() {
  const router = useRouter();
  const { user, setUser, teams, setTeams, projects, setProjects } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ team_name: '', team_lead: '', description: '' });

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    setIsLoading(true);
    try {
      const supabase = await getSupabase();
      if (!supabase) {
        router.push('/login');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Fetch user profile if not in store
      if (!user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) setUser(profile as User);
      }

      const { data: teamsData } = await supabase.from('teams').select('*').order('team_name');
      if (teamsData) setTeams(teamsData as Team[]);

      const { data: projectsData } = await supabase.from('projects_with_details').select('*');
      if (projectsData) setProjects(projectsData as Project[]);
    } catch (error) {
      toast.error('Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingTeam(null);
    setFormData({ team_name: '', team_lead: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      team_name: team.team_name,
      team_lead: team.team_lead || '',
      description: team.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.team_name || !formData.team_lead) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSaving(true);
    try {
      const supabase = await getSupabase();
      if (!supabase) return;

      if (editingTeam) {
        const { error } = await supabase.from('teams').update(formData).eq('id', editingTeam.id);
        if (error) throw error;
        toast.success('Team updated successfully');
      } else {
        const { error } = await supabase.from('teams').insert([formData]);
        if (error) throw error;
        toast.success('Team created successfully');
      }

      setShowModal(false);
      checkAuthAndFetch();
    } catch (error) {
      toast.error('Failed to save team');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      const supabase = await getSupabase();
      if (!supabase) return;

      const { error } = await supabase.from('teams').delete().eq('id', teamId);
      if (error) throw error;
      toast.success('Team deleted successfully');
      checkAuthAndFetch();
    } catch (error) {
      toast.error('Failed to delete team');
    }
  };

  const getTeamStats = (teamId: string) => {
    const teamProjects = projects.filter(p => p.team_id === teamId);
    return {
      total: teamProjects.length,
      completed: teamProjects.filter(p => p.status === 'DONE').length,
    };
  };

  const canManage = user && (user.role === 'admin' || user.role === 'manager');

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;
  }

  return (
    <div className="min-h-screen p-4 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Team Management</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your teams and team members</p>
        </div>
        {canManage && (
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Team
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team, index) => {
          const stats = getTeamStats(team.id);
          return (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 hover:-translate-y-1 hover:shadow-glow transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white', getAvatarColor(team.team_lead || ''))}>
                    {getInitials(team.team_lead)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{team.team_name}</h3>
                    <p className="text-sm text-gray-400">Lead: {team.team_lead || 'N/A'}</p>
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(team)} className="p-2 hover:bg-tangent-blue/10 rounded-lg">
                      <Edit className="w-4 h-4 text-gray-400 hover:text-tangent-blue" />
                    </button>
                    {user?.role === 'admin' && (
                      <button onClick={() => handleDelete(team.id)} className="p-2 hover:bg-red-500/10 rounded-lg">
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-dark-border">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-tangent-blue">
                    <FolderKanban className="w-4 h-4" />
                    <span className="text-xl font-bold">{stats.total}</span>
                  </div>
                  <p className="text-xs text-gray-500">Projects</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-green-500">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xl font-bold">{stats.completed}</span>
                  </div>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">{editingTeam ? 'Edit Team' : 'Create Team'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Team Name *</label>
                  <input
                    type="text"
                    value={formData.team_name}
                    onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                    placeholder="e.g., Team 07"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Team Lead *</label>
                  <input
                    type="text"
                    value={formData.team_lead}
                    onChange={(e) => setFormData({ ...formData, team_lead: e.target.value })}
                    placeholder="e.g., JOHN"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="input-field"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={isSaving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : (editingTeam ? 'Update Team' : 'Create Team')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
