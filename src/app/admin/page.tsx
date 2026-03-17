'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Shield,
  ChevronLeft,
  Users,
  Settings,
  Bell,
  Database,
  Key,
  Mail,
  Globe,
  Palette,
  User,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Save,
  Lock,
} from 'lucide-react';

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  team_id: string | null;
  is_active: boolean;
  created_at: string;
};

type Team = {
  id: string;
  team_name: string;
  color: string;
};

const roleOptions = [
  { value: 'admin', label: 'Administrator', description: 'Full access to all features' },
  { value: 'manager', label: 'Project Manager', description: 'Manage projects and teams' },
  { value: 'bim_coordinator', label: 'BIM Coordinator', description: 'Manage BIM deliverables' },
  { value: 'team_member', label: 'Team Member', description: 'View and update assigned tasks' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
];

export default function AdminPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'settings' | 'profile'>('users');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const searchParams = useSearchParams();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchData();
    const tab = searchParams.get('tab');
    if (tab === 'profile' || tab === 'settings') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, teamsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('teams').select('*').eq('is_active', true),
    ]);

    if (profilesRes.data) setProfiles(profilesRes.data);
    if (teamsRes.data) setTeams(teamsRes.data);
    setLoading(false);
  };

  const toggleUserActive = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !currentStatus })
      .eq('id', userId);
    if (!error) {
      setProfiles(profiles.map(p => 
        p.id === userId ? { ...p, is_active: !currentStatus } : p
      ));
    }
  };

  const tabs = [
    { key: 'users', label: 'User Management', icon: Users },
    { key: 'roles', label: 'Roles & Permissions', icon: Shield },
    { key: 'settings', label: 'System Settings', icon: Settings },
    { key: 'profile', label: 'My Profile', icon: User },
  ];

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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="text-gradient">Admin Panel</span>
            </h1>
            <p className="text-gray-400 mt-1">System administration & settings</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-[#00AEEF] text-white shadow-lg shadow-[#00AEEF]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Team Members</h2>
            <button 
              onClick={() => { setEditingUser(null); setShowUserModal(true); }}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </div>

          <div className="card-premium overflow-hidden">
            <table className="table-premium">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Team</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(profile => (
                  <tr key={profile.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {profile.full_name?.[0] || profile.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{profile.full_name || 'Unnamed'}</p>
                          <p className="text-xs text-gray-500">{profile.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-gray-400 capitalize">
                        {profile.role?.replace('_', ' ') || 'Team Member'}
                      </span>
                    </td>
                    <td className="text-gray-400">
                      {teams.find(t => t.id === profile.team_id)?.team_name || '-'}
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
                        profile.is_active 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          profile.is_active ? 'bg-green-400' : 'bg-gray-400'
                        }`} />
                        {profile.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-gray-500 text-sm">
                      {new Date(profile.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingUser(profile); setShowUserModal(true); }}
                          className="p-1.5 hover:bg-white/10 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => toggleUserActive(profile.id, profile.is_active)}
                          className="p-1.5 hover:bg-white/10 rounded-lg"
                          title={profile.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {profile.is_active ? (
                            <X className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Check className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Roles & Permissions</h2>
          
          <div className="grid grid-cols-2 gap-6">
            {roleOptions.map(role => (
              <div key={role.value} className="card-premium p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{role.label}</h3>
                    <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-gray-500">
                        {profiles.filter(p => p.role === role.value).length} users
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">System Settings</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="card-premium p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Database className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Database</h3>
                  <p className="text-xs text-gray-500">Supabase PostgreSQL</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className="text-green-400">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Region</span>
                  <span className="text-gray-300">ap-southeast-1</span>
                </div>
              </div>
            </div>

            <div className="card-premium p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Email Service</h3>
                  <p className="text-xs text-gray-500">Resend SMTP</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className="text-yellow-400">Pending Setup</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Domain</span>
                  <span className="text-gray-300">tangentlandscape.com</span>
                </div>
              </div>
            </div>

            <div className="card-premium p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Notifications</h3>
                  <p className="text-xs text-gray-500">Alert settings</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-400">Email notifications</span>
                  <input type="checkbox" defaultChecked className="toggle" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-400">Deadline alerts</span>
                  <input type="checkbox" defaultChecked className="toggle" />
                </label>
              </div>
            </div>

            <div className="card-premium p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Branding</h3>
                  <p className="text-xs text-gray-500">Company settings</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Primary Color</span>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-[#00AEEF]" />
                    <span className="text-gray-300">#00AEEF</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Theme</span>
                  <span className="text-gray-300">Dark</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold mb-6">My Profile</h2>
          
          <div className="card-premium p-6 space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">A</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Anshu Jalaludeen</h3>
                <p className="text-gray-400">BIM Coordinator</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  defaultValue="Anshu Jalaludeen"
                  className="input-premium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  defaultValue="anshu@tangent.com"
                  className="input-premium"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <input
                  type="text"
                  defaultValue="BIM Coordinator"
                  className="input-premium"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Team</label>
                <input
                  type="text"
                  defaultValue="BIM Team"
                  className="input-premium"
                  disabled
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end">
              <button className="btn-primary">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>

          <div className="card-premium p-6 mt-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Change Password
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                <input type="password" className="input-premium" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                <input type="password" className="input-premium" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                <input type="password" className="input-premium" />
              </div>
              <button className="btn-secondary">
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          teams={teams}
          onClose={() => { setShowUserModal(false); setEditingUser(null); }}
          onSaved={() => { setShowUserModal(false); setEditingUser(null); fetchData(); }}
        />
      )}
    </div>
  );
}

function UserModal({
  user,
  teams,
  onClose,
  onSaved,
}: {
  user: Profile | null;
  teams: Team[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = !!user;
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    role: user?.role || 'team_member',
    team_id: user?.team_id || '',
    is_active: user?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEditing) {
        await supabase.from('profiles').update({
          full_name: formData.full_name,
          role: formData.role,
          team_id: formData.team_id || null,
          is_active: formData.is_active,
        }).eq('id', user.id);
      }
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{isEditing ? 'Edit User' : 'Add User'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="input-premium"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-premium"
              placeholder="Enter email"
              disabled={isEditing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="select-premium"
            >
              {roleOptions.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Team</label>
            <select
              value={formData.team_id}
              onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
              className="select-premium"
            >
              <option value="">No team assigned</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.team_name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : isEditing ? 'Update User' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
