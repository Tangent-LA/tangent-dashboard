'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import {
  Shield,
  ChevronLeft,
  Users,
  Settings,
  Activity,
  Key,
  Edit,
  Trash2,
  X,
  Check,
  AlertTriangle,
  UserPlus,
  Search,
} from 'lucide-react';

type UserProfile = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  job_title: string | null;
  is_active: boolean;
  created_at: string;
  teams?: { team_name: string } | null;
};

type ActivityLog = {
  id: string;
  action: string;
  entity_type: string;
  entity_name: string;
  created_at: string;
  profiles?: { full_name: string | null; email: string } | null;
};

type TabType = 'users' | 'roles' | 'settings' | 'logs';

const rolePermissions: Record<string, string[]> = {
  admin: ['View All', 'Edit All', 'Delete All', 'Manage Users', 'System Settings', 'View Logs'],
  manager: ['View All', 'Edit Projects', 'Manage Team', 'View Reports', 'BIM Management'],
  member: ['View Assigned', 'Edit Own Tasks', 'View Team'],
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'logs') {
      fetchLogs();
    } else {
      setLoading(false);
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, job_title, is_active, created_at, teams(team_name)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data as UserProfile[]);
    }
    setLoading(false);
  };

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('activity_logs')
      .select('id, action, entity_type, entity_name, created_at, profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setLogs(data as ActivityLog[]);
    }
    setLoading(false);
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !isActive, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !isActive } : u));
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (!error) {
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      (user.full_name?.toLowerCase().includes(query)) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  const tabs = [
    { key: 'users', label: 'User Management', icon: Users },
    { key: 'roles', label: 'Roles & Permissions', icon: Key },
    { key: 'settings', label: 'System Settings', icon: Settings },
    { key: 'logs', label: 'Activity Logs', icon: Activity },
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
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </Link>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">
            <span className="text-gradient">Admin Panel</span>
          </h1>
          <p className="text-gray-400 mt-1">Manage users, roles, and system settings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabType)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === tab.key
                ? 'bg-[#00AEEF] text-white shadow-lg shadow-[#00AEEF]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-premium pl-12 w-full"
              />
            </div>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className={!user.is_active ? 'opacity-50' : ''}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00AEEF] to-[#0077a3] flex items-center justify-center text-white font-medium">
                          {user.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{user.full_name || 'No Name'}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 cursor-pointer"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="member">Member</option>
                      </select>
                    </td>
                    <td className="text-gray-400">
                      {user.teams?.team_name || '-'}
                    </td>
                    <td>
                      <button
                        onClick={() => toggleUserActive(user.id, user.is_active)}
                        className={`text-xs px-2 py-1 rounded-full ${
                          user.is_active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(rolePermissions).map(([role, permissions]) => (
            <div key={role} className="card-premium p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  role === 'admin' ? 'bg-red-500/20' :
                  role === 'manager' ? 'bg-blue-500/20' : 'bg-green-500/20'
                }`}>
                  <Key className={`w-5 h-5 ${
                    role === 'admin' ? 'text-red-400' :
                    role === 'manager' ? 'text-blue-400' : 'text-green-400'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold capitalize">{role}</h3>
                  <p className="text-xs text-gray-500">{permissions.length} permissions</p>
                </div>
              </div>

              <div className="space-y-2">
                {permissions.map((perm) => (
                  <div key={perm} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">{perm}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="card-premium p-6">
            <h3 className="font-semibold mb-4">Notification Settings</h3>
            <div className="space-y-4">
              {[
                { label: 'Email notifications for task assignments', key: 'email_task' },
                { label: 'Email notifications for project updates', key: 'email_project' },
                { label: 'Desktop notifications', key: 'desktop' },
                { label: 'Weekly summary reports', key: 'weekly_report' },
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between">
                  <span className="text-gray-300">{setting.label}</span>
                  <button
                    className="w-12 h-6 rounded-full bg-[#00AEEF] relative"
                    onClick={() => {}}
                  >
                    <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card-premium p-6">
            <h3 className="font-semibold mb-4">Security Settings</h3>
            <div className="space-y-4">
              {[
                { label: 'Two-factor authentication required', key: '2fa' },
                { label: 'Session timeout after 30 minutes', key: 'timeout' },
                { label: 'Audit logging enabled', key: 'audit' },
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between">
                  <span className="text-gray-300">{setting.label}</span>
                  <button
                    className="w-12 h-6 rounded-full bg-[#00AEEF] relative"
                    onClick={() => {}}
                  >
                    <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="card-premium p-6">
          <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p className="text-gray-400">No activity logs found</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-[#00AEEF]/20 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-[#00AEEF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">
                        {log.profiles?.full_name || log.profiles?.email || 'Someone'}
                      </span>
                      {' '}<span className="text-gray-400">{log.action}</span>{' '}
                      <span className="text-[#00AEEF]">{log.entity_name}</span>
                      <span className="text-gray-500"> ({log.entity_type})</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
          onSaved={() => {
            setShowEditModal(false);
            setEditingUser(null);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}

function EditUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: UserProfile;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    job_title: user.job_title || '',
    role: user.role,
    is_active: user.is_active,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name.trim() || null,
        job_title: formData.job_title.trim() || null,
        role: formData.role,
        is_active: formData.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      onSaved();
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Edit User</h2>
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
            <label className="block text-sm font-medium mb-2 text-gray-300">Email</label>
            <input
              type="text"
              value={user.email}
              className="input-premium opacity-50"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Full Name</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="input-premium"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Job Title</label>
            <input
              type="text"
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              className="input-premium"
              placeholder="Enter job title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="select-premium"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="member">Member</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-300">Active</label>
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
              {saving ? 'Saving...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
