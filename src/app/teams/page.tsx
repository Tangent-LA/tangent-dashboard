'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronLeft,
  UserPlus,
  UserMinus,
  FolderKanban,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Activity,
  Target,
  X,
  Mail,
  Phone,
} from 'lucide-react';

type Team = {
  id: string;
  team_name: string;
  color: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  team_id: string | null;
  is_active: boolean;
  avatar_url: string | null;
};

type Project = {
  id: string;
  project_name: string;
  project_status: string;
  project_priority: string;
  project_end_date: string | null;
  team_id: string | null;
  progress_percentage: number;
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchData();
  }, []);

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
    const [teamsRes, profilesRes, projectsRes] = await Promise.all([
      supabase.from('teams').select('*').order('team_name'),
      supabase.from('profiles').select('*'),
      supabase.from('projects').select('id, project_name, project_status, project_priority, project_end_date, team_id, progress_percentage'),
    ]);

    if (teamsRes.data) setTeams(teamsRes.data);
    if (profilesRes.data) setProfiles(profilesRes.data);
    if (projectsRes.data) setProjects(projectsRes.data);
    setLoading(false);
  };

  // Calculate team analytics
  const teamAnalytics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    return teams.map(team => {
      const teamProjects = projects.filter(p => p.team_id === team.id);
      const teamMembers = profiles.filter(p => p.team_id === team.id && p.is_active);
      const activeProjects = teamProjects.filter(p => p.project_status === 'active' || p.project_status === 'in_progress');
      const overdueProjects = teamProjects.filter(p => {
        if (!p.project_end_date || p.project_status === 'completed') return false;
        return p.project_end_date < today;
      });
      const criticalProjects = teamProjects.filter(p => p.project_priority === 'critical' || p.project_priority === 'high');
      const completedProjects = teamProjects.filter(p => p.project_status === 'completed');
      
      const capacity = teamMembers.length > 0 
        ? Math.round((activeProjects.length / teamMembers.length) * 100) 
        : 0;

      return {
        ...team,
        members: teamMembers,
        memberCount: teamMembers.length,
        totalProjects: teamProjects.length,
        activeProjects: activeProjects.length,
        overdueProjects: overdueProjects.length,
        criticalProjects: criticalProjects.length,
        completedProjects: completedProjects.length,
        capacity,
        isOverloaded: capacity > 150 || overdueProjects.length > 0,
        isLight: capacity < 50 && activeProjects.length < 2,
        avgProgress: teamProjects.length > 0
          ? Math.round(teamProjects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / teamProjects.length)
          : 0,
      };
    });
  }, [teams, profiles, projects]);

  const filteredTeams = teamAnalytics.filter(team =>
    team.team_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const deleteTeam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (!error) {
      setTeams(teams.filter(t => t.id !== id));
      setActiveMenu(null);
    }
  };

  const openEditModal = (team: Team) => {
    setEditingTeam(team);
    setShowModal(true);
    setActiveMenu(null);
  };

  const openMemberModal = (team: Team) => {
    setSelectedTeam(team);
    setShowMemberModal(true);
    setActiveMenu(null);
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="text-gradient">Teams</span>
            </h1>
            <p className="text-gray-400 mt-1">{teams.length} teams • {profiles.filter(p => p.is_active).length} members</p>
          </div>
        </div>

        <button onClick={() => { setEditingTeam(null); setShowModal(true); }} className="btn-primary">
          <Plus className="w-5 h-5" />
          New Team
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="kpi-icon bg-green-500/20">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{teamAnalytics.filter(t => t.isLight).length}</p>
              <p className="text-sm text-gray-400">Available</p>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="kpi-icon bg-blue-500/20">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{teamAnalytics.filter(t => !t.isLight && !t.isOverloaded).length}</p>
              <p className="text-sm text-gray-400">Balanced</p>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="kpi-icon bg-red-500/20">
              <Flame className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{teamAnalytics.filter(t => t.isOverloaded).length}</p>
              <p className="text-sm text-gray-400">Overloaded</p>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="kpi-icon bg-purple-500/20">
              <Target className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {teamAnalytics.length > 0 
                  ? Math.round(teamAnalytics.reduce((sum, t) => sum + t.capacity, 0) / teamAnalytics.length)
                  : 0}%
              </p>
              <p className="text-sm text-gray-400">Avg Capacity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-premium pl-12 w-full"
          />
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-2 gap-6">
        {filteredTeams.map((team) => (
          <div
            key={team.id}
            className={`card-premium p-6 ${
              team.isOverloaded ? 'border-red-500/30' : team.isLight ? 'border-green-500/30' : ''
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${team.color}20` }}
                >
                  <Users className="w-6 h-6" style={{ color: team.color }} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{team.team_name}</h3>
                  <p className="text-sm text-gray-500">{team.memberCount} members</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  team.isOverloaded ? 'bg-red-500/20 text-red-400' :
                  team.isLight ? 'bg-green-500/20 text-green-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {team.isOverloaded ? 'Overloaded' : team.isLight ? 'Available' : 'Balanced'}
                </span>

                <div className="relative" ref={activeMenu === team.id ? menuRef : null}>
                  <button
                    onClick={() => setActiveMenu(activeMenu === team.id ? null : team.id)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </button>
                  {activeMenu === team.id && (
                    <div className="absolute right-0 top-8 w-40 bg-[#1e1e28] border border-white/10 rounded-xl shadow-xl z-50 animate-fadeIn">
                      <button
                        onClick={() => openMemberModal(team)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 rounded-t-xl"
                      >
                        <UserPlus className="w-4 h-4" />
                        Manage Members
                      </button>
                      <button
                        onClick={() => openEditModal(team)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Team
                      </button>
                      <button
                        onClick={() => deleteTeam(team.id)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-b-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
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
              <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
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

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <p className="text-lg font-bold">{team.totalProjects}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <p className="text-lg font-bold text-blue-400">{team.activeProjects}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <p className="text-lg font-bold text-red-400">{team.overdueProjects}</p>
                <p className="text-xs text-gray-500">Overdue</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <p className="text-lg font-bold text-green-400">{team.completedProjects}</p>
                <p className="text-xs text-gray-500">Done</p>
              </div>
            </div>

            {/* Team Members */}
            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Team Members</span>
                <button
                  onClick={() => openMemberModal(team)}
                  className="text-xs text-[#00AEEF] hover:underline"
                >
                  Manage
                </button>
              </div>
              <div className="flex items-center gap-2">
                {team.members.slice(0, 5).map((member, i) => (
                  <div
                    key={member.id}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-xs font-semibold border-2 border-[#12121a] -ml-2 first:ml-0"
                    title={member.full_name || member.email}
                  >
                    {member.full_name?.[0] || member.email[0].toUpperCase()}
                  </div>
                ))}
                {team.members.length > 5 && (
                  <span className="text-xs text-gray-500 ml-1">+{team.members.length - 5} more</span>
                )}
                {team.members.length === 0 && (
                  <span className="text-xs text-gray-500">No members assigned</span>
                )}
              </div>
            </div>

            {/* Alerts */}
            {(team.overdueProjects > 0 || team.criticalProjects > 0) && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>
                    {team.overdueProjects > 0 && `${team.overdueProjects} overdue`}
                    {team.overdueProjects > 0 && team.criticalProjects > 0 && ' • '}
                    {team.criticalProjects > 0 && `${team.criticalProjects} critical`}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredTeams.length === 0 && (
        <div className="card-premium text-center py-16">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-700" />
          <h3 className="text-xl font-semibold mb-2">No Teams Found</h3>
          <p className="text-gray-400 text-sm">Create your first team to get started</p>
        </div>
      )}

      {/* Team Modal */}
      {showModal && (
        <TeamModal
          team={editingTeam}
          onClose={() => { setShowModal(false); setEditingTeam(null); }}
          onSaved={() => { setShowModal(false); setEditingTeam(null); fetchData(); }}
        />
      )}

      {/* Member Management Modal */}
      {showMemberModal && selectedTeam && (
        <MemberModal
          team={selectedTeam}
          members={profiles.filter(p => p.team_id === selectedTeam.id)}
          allProfiles={profiles}
          onClose={() => { setShowMemberModal(false); setSelectedTeam(null); }}
          onSaved={() => { fetchData(); }}
        />
      )}
    </div>
  );
}

// Team Modal Component
function TeamModal({
  team,
  onClose,
  onSaved,
}: {
  team: Team | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = !!team;
  const [formData, setFormData] = useState({
    team_name: team?.team_name || '',
    color: team?.color || '#00AEEF',
    description: team?.description || '',
    is_active: team?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const colors = ['#00AEEF', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#6366F1'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.team_name.trim()) {
      setError('Team name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (isEditing) {
        const { error } = await supabase.from('teams').update(formData).eq('id', team.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('teams').insert(formData);
        if (error) throw error;
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to save team');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{isEditing ? 'Edit Team' : 'New Team'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Team Name *</label>
            <input
              type="text"
              value={formData.team_name}
              onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
              className="input-premium"
              placeholder="Enter team name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Team Color</label>
            <div className="flex items-center gap-2">
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-lg transition-transform ${
                    formData.color === color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#12121a]' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-premium h-24 resize-none"
              placeholder="Team description..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : isEditing ? 'Update Team' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Member Modal Component
function MemberModal({
  team,
  members,
  allProfiles,
  onClose,
  onSaved,
}: {
  team: Team;
  members: Profile[];
  allProfiles: Profile[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const availableProfiles = allProfiles.filter(p => 
    p.is_active && 
    p.team_id !== team.id &&
    (p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     p.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const addMember = async (profileId: string) => {
    const { error } = await supabase.from('profiles').update({ team_id: team.id }).eq('id', profileId);
    if (!error) onSaved();
  };

  const removeMember = async (profileId: string) => {
    const { error } = await supabase.from('profiles').update({ team_id: null }).eq('id', profileId);
    if (!error) onSaved();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${team.color}20` }}>
              <Users className="w-5 h-5" style={{ color: team.color }} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{team.team_name}</h2>
              <p className="text-sm text-gray-500">{members.length} members</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Members */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Current Members</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {members.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No members in this team</p>
            ) : (
              members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-semibold">
                      {member.full_name?.[0] || member.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.full_name || 'Unnamed'}</p>
                      <p className="text-xs text-gray-500">{member.role || 'Team Member'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeMember(member.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Members */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">Add Members</h3>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-premium pl-10 text-sm"
            />
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {availableProfiles.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No available users</p>
            ) : (
              availableProfiles.slice(0, 10).map(profile => (
                <div key={profile.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl group hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-sm font-semibold">
                      {profile.full_name?.[0] || profile.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{profile.full_name || 'Unnamed'}</p>
                      <p className="text-xs text-gray-500">{profile.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => addMember(profile.id)}
                    className="p-1.5 text-gray-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-white/5">
          <button onClick={onClose} className="btn-secondary">Done</button>
        </div>
      </div>
    </div>
  );
}
