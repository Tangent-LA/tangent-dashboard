'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Users,
  FolderKanban,
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  Key,
  UserCog,
  BarChart3,
  Settings,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';
import { cn, formatDate, getInitials, getAvatarColor } from '@/lib/utils';
import type { User, Project, Team, UserRole, ProjectStage, ProjectPriority, ProjectStatus } from '@/types';
import toast from 'react-hot-toast';

const tabs = [
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'projects', label: 'Project Management', icon: FolderKanban },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const stages: ProjectStage[] = ['SD DESIGN', 'DD DESIGN', 'REVISED DD', 'TENDER DESIGN', 'TENDER ADDENDUM', 'BIM MLD SUBMISSION', 'IFC'];
const priorities: ProjectPriority[] = ['critical', 'high', 'medium', 'low'];
const statuses: ProjectStatus[] = ['IN PROGRESS', 'DONE', 'TBC', 'ON HOLD'];
const roles: UserRole[] = ['admin', 'manager', 'member'];

export default function AdminPage() {
  const router = useRouter();
  const { user, teams, setTeams, projects, setProjects } = useStore();
  const [activeTab, setActiveTab] = useState('users');
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  
  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [userForm, setUserForm] = useState({
    full_name: '',
    email: '',
    role: 'member' as UserRole,
    team_id: '',
    is_active: true,
  });

  const [projectForm, setProjectForm] = useState({
    project_name: '',
    description: '',
    stage: 'SD DESIGN' as ProjectStage,
    priority: 'medium' as ProjectPriority,
    status: 'IN PROGRESS' as ProjectStatus,
    team_id: '',
    deadline: '',
    progress: 0,
    criticality: 5,
  });

  useEffect(() => {
    // Check if user is admin
    if (user && user.role !== 'admin') {
      toast.error('Access denied. Admin only.');
      router.push('/dashboard');
      return;
    }
    
    fetchData();
  }, [user, router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (usersData) setUsers(usersData as User[]);

      // Fetch teams
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*')
        .order('team_name');
      if (teamsData) setTeams(teamsData as Team[]);

      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects_with_details')
        .select('*')
        .order('created_at', { ascending: false });
      if (projectsData) setProjects(projectsData as Project[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // User Management
  const openUserModal = (userToEdit?: User) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setUserForm({
        full_name: userToEdit.full_name || '',
        email: userToEdit.email,
        role: userToEdit.role,
        team_id: userToEdit.team_id || '',
        is_active: userToEdit.is_active,
      });
    } else {
      setEditingUser(null);
      setUserForm({
        full_name: '',
        email: '',
        role: 'member',
        team_id: '',
        is_active: true,
      });
    }
    setShowUserModal(true);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: userForm.full_name,
          role: userForm.role,
          team_id: userForm.team_id || null,
          is_active: userForm.is_active,
        })
        .eq('id', editingUser.id);

      if (error) throw error;
      toast.success('User updated successfully');
      setShowUserModal(false);
      fetchData();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      toast.success(`User ${currentStatus ? 'disabled' : 'enabled'}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  // Project Management
  const openProjectModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setProjectForm({
        project_name: project.project_name,
        description: project.description || '',
        stage: project.stage,
        priority: project.priority,
        status: project.status,
        team_id: project.team_id || '',
        deadline: project.deadline || '',
        progress: project.progress,
        criticality: project.criticality,
      });
    } else {
      setEditingProject(null);
      setProjectForm({
        project_name: '',
        description: '',
        stage: 'SD DESIGN',
        priority: 'medium',
        status: 'IN PROGRESS',
        team_id: '',
        deadline: '',
        progress: 0,
        criticality: 5,
      });
    }
    setShowProjectModal(true);
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.project_name) {
      toast.error('Project name is required');
      return;
    }

    setIsSaving(true);
    try {
      const projectData = {
        project_name: projectForm.project_name,
        description: projectForm.description,
        stage: projectForm.stage,
        priority: projectForm.priority,
        status: projectForm.status,
        team_id: projectForm.team_id || null,
        deadline: projectForm.deadline || null,
        progress: projectForm.progress,
        criticality: projectForm.criticality,
      };

      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editingProject.id);
        if (error) throw error;
        toast.success('Project updated successfully');
      } else {
        const { error } = await supabase
          .from('projects')
          .insert([{ ...projectData, created_by: user?.id }]);
        if (error) throw error;
        toast.success('Project created successfully');
      }

      setShowProjectModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      toast.success('Project deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.is_active).length,
    totalProjects: projects.length,
    completedProjects: projects.filter(p => p.status === 'DONE').length,
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-dark-bg/80 backdrop-blur-xl border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-tangent rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Control Panel</h1>
              <p className="text-sm text-gray-400">Manage users, projects, and system settings</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all',
                  activeTab === tab.id
                    ? 'bg-tangent-blue text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stat-card">
            <Users className="w-8 h-8 text-tangent-blue mb-2" />
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
            <p className="text-sm text-gray-400">Total Users</p>
          </div>
          <div className="stat-card">
            <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
            <p className="text-2xl font-bold">{stats.activeUsers}</p>
            <p className="text-sm text-gray-400">Active Users</p>
          </div>
          <div className="stat-card">
            <FolderKanban className="w-8 h-8 text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{stats.totalProjects}</p>
            <p className="text-sm text-gray-400">Total Projects</p>
          </div>
          <div className="stat-card">
            <BarChart3 className="w-8 h-8 text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{stats.completedProjects}</p>
            <p className="text-sm text-gray-400">Completed</p>
          </div>
        </div>

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">User Management</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Team</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-white text-sm',
                            getAvatarColor(u.full_name || '')
                          )}>
                            {getInitials(u.full_name)}
                          </div>
                          <span className="font-medium">{u.full_name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="text-gray-400">{u.email}</td>
                      <td>
                        <span className={cn(
                          'badge border',
                          u.role === 'admin' ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' :
                          u.role === 'manager' ? 'bg-tangent-blue/15 text-tangent-blue border-tangent-blue/30' :
                          'bg-gray-500/15 text-gray-400 border-gray-500/30'
                        )}>
                          {u.role}
                        </span>
                      </td>
                      <td className="text-gray-400">
                        {teams.find(t => t.id === u.team_id)?.team_name || 'Unassigned'}
                      </td>
                      <td>
                        <span className={cn(
                          'badge border',
                          u.is_active 
                            ? 'bg-green-500/15 text-green-500 border-green-500/30' 
                            : 'bg-red-500/15 text-red-500 border-red-500/30'
                        )}>
                          {u.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="text-gray-400">{formatDate(u.created_at)}</td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openUserModal(u)}
                            className="p-2 hover:bg-tangent-blue/10 rounded-lg"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4 text-gray-400 hover:text-tangent-blue" />
                          </button>
                          <button
                            onClick={() => toggleUserStatus(u.id, u.is_active)}
                            className={cn(
                              'p-2 rounded-lg',
                              u.is_active ? 'hover:bg-red-500/10' : 'hover:bg-green-500/10'
                            )}
                            title={u.is_active ? 'Disable User' : 'Enable User'}
                          >
                            {u.is_active ? (
                              <XCircle className="w-4 h-4 text-gray-400 hover:text-red-500" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-gray-400 hover:text-green-500" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Project Management Tab */}
        {activeTab === 'projects' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Project Management</h2>
              <button
                onClick={() => openProjectModal()}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Project
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Stage</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Team</th>
                    <th>Deadline</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <p className="font-medium">{p.project_name}</p>
                      </td>
                      <td className="text-gray-400">{p.stage}</td>
                      <td>
                        <span className={cn(
                          'badge border',
                          p.priority === 'critical' ? 'bg-red-500/15 text-red-500 border-red-500/30' :
                          p.priority === 'high' ? 'bg-orange-500/15 text-orange-500 border-orange-500/30' :
                          p.priority === 'medium' ? 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30' :
                          'bg-green-500/15 text-green-500 border-green-500/30'
                        )}>
                          {p.priority}
                        </span>
                      </td>
                      <td>
                        <span className={cn(
                          'badge border',
                          p.status === 'DONE' ? 'bg-green-500/15 text-green-500 border-green-500/30' :
                          p.status === 'IN PROGRESS' ? 'bg-tangent-blue/15 text-tangent-blue border-tangent-blue/30' :
                          'bg-yellow-500/15 text-yellow-500 border-yellow-500/30'
                        )}>
                          {p.status}
                        </span>
                      </td>
                      <td className="text-gray-400">{p.team_lead || 'Unassigned'}</td>
                      <td className="text-gray-400">{formatDate(p.deadline)}</td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openProjectModal(p)}
                            className="p-2 hover:bg-tangent-blue/10 rounded-lg"
                          >
                            <Edit className="w-4 h-4 text-gray-400 hover:text-tangent-blue" />
                          </button>
                          <button
                            onClick={() => deleteProject(p.id)}
                            className="p-2 hover:bg-red-500/10 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4">System Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Users by Role</h3>
                  <div className="space-y-2">
                    {roles.map(role => {
                      const count = users.filter(u => u.role === role).length;
                      const percentage = users.length > 0 ? (count / users.length) * 100 : 0;
                      return (
                        <div key={role} className="flex items-center gap-3">
                          <span className="text-sm w-20 capitalize">{role}</span>
                          <div className="flex-1 h-2 bg-dark-border rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-tangent-blue rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-400 w-8">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Projects by Status</h3>
                  <div className="space-y-2">
                    {statuses.map(status => {
                      const count = projects.filter(p => p.status === status).length;
                      const percentage = projects.length > 0 ? (count / projects.length) * 100 : 0;
                      return (
                        <div key={status} className="flex items-center gap-3">
                          <span className="text-sm w-24">{status}</span>
                          <div className="flex-1 h-2 bg-dark-border rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                'h-full rounded-full transition-all',
                                status === 'DONE' ? 'bg-green-500' :
                                status === 'IN PROGRESS' ? 'bg-tangent-blue' :
                                'bg-yellow-500'
                              )}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-400 w-8">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* User Edit Modal */}
      <AnimatePresence>
        {showUserModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowUserModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Edit User</h2>
                <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-white/5 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    type="text"
                    value={userForm.full_name}
                    onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email</label>
                  <input type="email" value={userForm.email} disabled className="input-field opacity-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                    className="input-field"
                  >
                    {roles.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Team</label>
                  <select
                    value={userForm.team_id}
                    onChange={(e) => setUserForm({ ...userForm, team_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Unassigned</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={userForm.is_active}
                    onChange={(e) => setUserForm({ ...userForm, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_active" className="text-sm">Active</label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowUserModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={isSaving} className="btn-primary flex-1">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Modal */}
      <AnimatePresence>
        {showProjectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowProjectModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-content max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">{editingProject ? 'Edit Project' : 'Add Project'}</h2>
                <button onClick={() => setShowProjectModal(false)} className="p-2 hover:bg-white/5 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleProjectSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Project Name *</label>
                    <input
                      type="text"
                      value={projectForm.project_name}
                      onChange={(e) => setProjectForm({ ...projectForm, project_name: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Stage</label>
                    <select
                      value={projectForm.stage}
                      onChange={(e) => setProjectForm({ ...projectForm, stage: e.target.value as ProjectStage })}
                      className="input-field"
                    >
                      {stages.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Priority</label>
                    <select
                      value={projectForm.priority}
                      onChange={(e) => setProjectForm({ ...projectForm, priority: e.target.value as ProjectPriority })}
                      className="input-field"
                    >
                      {priorities.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Status</label>
                    <select
                      value={projectForm.status}
                      onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value as ProjectStatus })}
                      className="input-field"
                    >
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Team</label>
                    <select
                      value={projectForm.team_id}
                      onChange={(e) => setProjectForm({ ...projectForm, team_id: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Unassigned</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.team_name} - {t.team_lead}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Deadline</label>
                    <input
                      type="date"
                      value={projectForm.deadline}
                      onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Progress ({projectForm.progress}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={projectForm.progress}
                      onChange={(e) => setProjectForm({ ...projectForm, progress: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                    <textarea
                      value={projectForm.description}
                      onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                      rows={3}
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowProjectModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={isSaving} className="btn-primary flex-1">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (editingProject ? 'Update' : 'Create')}
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
