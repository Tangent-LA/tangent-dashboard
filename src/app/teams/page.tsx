'use client';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import {
  Plus,
  Search,
  Users,
  UserPlus,
  ChevronLeft,
  Edit,
  MoreHorizontal,
  CheckCircle,
  X,
  Trash2,
  UserMinus,
  Mail,
} from 'lucide-react';

type TeamMember = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: string;
  job_title: string | null;
  activity_status: string;
};

type Team = {
  id: string;
  team_name: string;
  description: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
  members?: TeamMember[];
};

type AvailableUser = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  team_id: string | null;
};

const teamColors = ['#00AEEF', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedTeamForMember, setSelectedTeamForMember] = useState<Team | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchTeams();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    
    // Fetch teams
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .order('team_name');

    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      setLoading(false);
      return;
    }

    // Fetch members for each team
    const teamsWithMembers = await Promise.all(
      (teamsData || []).map(async (team) => {
        const { data: members } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url, role, job_title, activity_status')
          .eq('team_id', team.id)
          .eq('is_active', true);
        return { ...team, members: members || [] };
      })
    );

    setTeams(teamsWithMembers);
    setLoading(false);
  };

  const deleteTeam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team? Members will be unassigned.')) return;
    
    // First unassign all members
    await supabase.from('profiles').update({ team_id: null }).eq('team_id', id);
    
    // Then delete the team
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (!error) {
      setTeams(teams.filter(t => t.id !== id));
      setActiveDropdown(null);
    }
  };

  const removeMemberFromTeam = async (memberId: string, teamId: string) => {
    if (!confirm('Remove this member from the team?')) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ team_id: null })
      .eq('id', memberId);
    
    if (!error) {
      setTeams(teams.map(team => {
        if (team.id === teamId) {
          return { ...team, members: team.members?.filter(m => m.id !== memberId) || [] };
        }
        return team;
      }));
    }
  };

  const toggleDropdown = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const openEditModal = (team: Team) => {
    setEditingTeam(team);
    setShowTeamModal(true);
    setActiveDropdown(null);
  };

  const openNewTeamModal = () => {
    setEditingTeam(null);
    setShowTeamModal(true);
  };

  const openAddMemberModal = (team: Team) => {
    setSelectedTeamForMember(team);
    setShowMemberModal(true);
    setActiveDropdown(null);
  };

  const filteredTeams = teams.filter(team =>
    team.team_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMembers = teams.reduce((acc, team) => acc + (team.members?.length || 0), 0);
  const activeTeams = teams.filter(t => t.is_active).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back Navigation */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="text-gradient">Teams</span>
            </h1>
            <p className="text-gray-400 mt-1">Manage your organization's teams</p>
          </div>
        </div>
        <button onClick={openNewTeamModal} className="btn-primary">
          <Plus className="w-5 h-5" />
          New Team
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card-premium p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{teams.length}</p>
              <p className="text-xs text-gray-400">Total Teams</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeTeams}</p>
              <p className="text-xs text-gray-400">Active Teams</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalMembers}</p>
              <p className="text-xs text-gray-400">Total Members</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.round(totalMembers / Math.max(teams.length, 1))}</p>
              <p className="text-xs text-gray-400">Avg per Team</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search teams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-premium pl-12 w-full"
        />
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div className="card-premium text-center py-16">
          <Users className="w-20 h-20 mx-auto mb-4 text-gray-700" />
          <h3 className="text-xl font-semibold mb-2">No Teams Found</h3>
          <p className="text-gray-400 text-sm mb-6">Create your first team to get started</p>
          <button onClick={openNewTeamModal} className="btn-primary">
            <Plus className="w-4 h-4" />
            Create Team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              className="card-premium overflow-hidden"
              style={{ borderTopColor: team.color || '#00AEEF', borderTopWidth: '3px' }}
            >
              {/* Team Header */}
              <div className="p-5 border-b border-white/5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: team.color || '#00AEEF' }}
                    >
                      {team.team_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{team.team_name}</h3>
                      <p className="text-sm text-gray-400">{team.members?.length || 0} members</p>
                    </div>
                  </div>
                  
                  {/* Dropdown Menu */}
                  <div className="relative" ref={activeDropdown === team.id ? dropdownRef : null}>
                    <button
                      onClick={(e) => toggleDropdown(team.id, e)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {activeDropdown === team.id && (
                      <div className="absolute right-0 top-full mt-1 w-44 py-1 bg-[#1e1e28] rounded-xl border border-white/10 shadow-xl z-50">
                        <button
                          onClick={() => openEditModal(team)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Team
                        </button>
                        <button
                          onClick={() => openAddMemberModal(team)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <UserPlus className="w-4 h-4" />
                          Add Member
                        </button>
                        <button
                          onClick={() => deleteTeam(team.id)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Team
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {team.description && (
                  <p className="text-sm text-gray-400 mt-3">{team.description}</p>
                )}
              </div>

              {/* Team Members */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-300">Team Members</span>
                  <button
                    onClick={() => openAddMemberModal(team)}
                    className="text-xs text-[#00AEEF] hover:underline flex items-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    Add
                  </button>
                </div>

                {team.members && team.members.length > 0 ? (
                  <div className="space-y-3">
                    {team.members.slice(0, 5).map((member) => (
                      <div key={member.id} className="flex items-center gap-3 group">
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00AEEF] to-[#0077a3] flex items-center justify-center text-white text-sm font-medium">
                            {member.avatar_url ? (
                              <img src={member.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              member.full_name?.charAt(0).toUpperCase() || member.email.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#16161f] ${
                              member.activity_status === 'online' || member.activity_status === 'active'
                                ? 'bg-green-500'
                                : member.activity_status === 'idle'
                                ? 'bg-yellow-500'
                                : 'bg-gray-500'
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member.full_name || member.email}</p>
                          <p className="text-xs text-gray-500 truncate">{member.job_title || member.role}</p>
                        </div>
                        <button
                          onClick={() => removeMemberFromTeam(member.id, team.id)}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                          title="Remove from team"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {team.members.length > 5 && (
                      <button 
                        onClick={() => openEditModal(team)}
                        className="text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        +{team.members.length - 5} more members
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm text-gray-500">No members yet</p>
                    <button
                      onClick={() => openAddMemberModal(team)}
                      className="text-xs text-[#00AEEF] hover:underline mt-2"
                    >
                      Add first member
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Team Modal (Create/Edit) */}
      {showTeamModal && (
        <TeamModal
          team={editingTeam}
          onClose={() => {
            setShowTeamModal(false);
            setEditingTeam(null);
          }}
          onSaved={() => {
            setShowTeamModal(false);
            setEditingTeam(null);
            fetchTeams();
          }}
        />
      )}

      {/* Add Member Modal */}
      {showMemberModal && selectedTeamForMember && (
        <AddMemberModal
          team={selectedTeamForMember}
          onClose={() => {
            setShowMemberModal(false);
            setSelectedTeamForMember(null);
          }}
          onSaved={() => {
            setShowMemberModal(false);
            setSelectedTeamForMember(null);
            fetchTeams();
          }}
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
    description: team?.description || '',
    color: team?.color || '#00AEEF',
    is_active: team?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.team_name.trim()) {
      setError('Team name is required');
      return;
    }

    setSaving(true);
    setError('');

    const teamData = {
      team_name: formData.team_name.trim(),
      description: formData.description.trim() || null,
      color: formData.color,
      is_active: formData.is_active,
      updated_at: new Date().toISOString(),
    };

    try {
      let result;
      if (isEditing) {
        result = await supabase.from('teams').update(teamData).eq('id', team.id);
      } else {
        result = await supabase.from('teams').insert(teamData);
      }

      if (result.error) {
        throw result.error;
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
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: formData.color }}
            >
              <Users className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold">{isEditing ? 'Edit Team' : 'Create New Team'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Team Name *</label>
            <input
              type="text"
              value={formData.team_name}
              onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
              className="input-premium"
              placeholder="e.g., Design Team"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-premium h-20 resize-none"
              placeholder="What does this team do?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Team Color</label>
            <div className="flex items-center gap-2">
              {teamColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    formData.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#16161f]' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-300">Active Team</label>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                formData.is_active ? 'bg-[#00AEEF]' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                  formData.is_active ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : isEditing ? 'Update Team' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Member Modal Component
function AddMemberModal({
  team,
  onClose,
  onSaved,
}: {
  team: Team;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchAvailableUsers();
  }, []);

  const fetchAvailableUsers = async () => {
    setLoading(true);
    
    // Get users who are not in any team OR in a different team
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, team_id')
      .eq('is_active', true)
      .order('full_name');

    // Filter out users already in this team
    const currentMemberIds = team.members?.map(m => m.id) || [];
    const filtered = (data || []).filter(u => !currentMemberIds.includes(u.id));
    
    setAvailableUsers(filtered);
    setLoading(false);
  };

  const addMemberToTeam = async (userId: string) => {
    setSaving(userId);
    
    const { error } = await supabase
      .from('profiles')
      .update({ team_id: team.id })
      .eq('id', userId);

    if (!error) {
      // Remove from available list
      setAvailableUsers(availableUsers.filter(u => u.id !== userId));
    }
    setSaving(null);
  };

  const filteredUsers = availableUsers.filter(user =>
    (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: team.color || '#00AEEF' }}
            >
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Add Member</h2>
              <p className="text-sm text-gray-400">to {team.team_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-premium pl-12"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="spinner" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400">No available users to add</p>
            <p className="text-xs text-gray-500 mt-1">All users are already in a team</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00AEEF] to-[#0077a3] flex items-center justify-center text-white font-semibold">
                  {user.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.full_name || 'No Name'}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <span className="text-xs text-gray-400 capitalize px-2 py-1 bg-white/5 rounded-full">{user.role}</span>
                <button
                  onClick={() => addMemberToTeam(user.id)}
                  disabled={saving === user.id}
                  className="btn-primary text-sm py-1.5 px-3"
                >
                  {saving === user.id ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Add
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-white/5">
          <button onClick={onSaved} className="btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
