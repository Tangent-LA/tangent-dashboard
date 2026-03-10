'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, FolderKanban, Plus, Edit, Trash2, X, Loader2, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { getSupabase } from '@/lib/supabase';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';
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

export default function AdminClient() {
  const router = useRouter();
  const { user, teams, setTeams, projects, setProjects } = useStore();
  const [activeTab, setActiveTab] = useState('users');
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [projectForm, setProjectForm] = useState({
    project_name: '', description: '', stage: 'SD DESIGN' as ProjectStage, priority: 'medium' as ProjectPriority,
    status: 'IN PROGRESS' as ProjectStatus, team_id: '', deadline: '', progress: 0, criticality: 5,
  });

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    setIsLoading(true);
    try {
      const supabase = await getSupabase();
      if (!supabase) { router.push('/login'); return; }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (profile?.role !== 'admin') {
        toast.error('Access denied. Admin only.');
        router.push('/dashboard');
        return;
      }

      const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (usersData) setUsers(usersData as User[]);

      const { data: teamsData } = await supabase.from('teams').select('*').order('team_name');
      if (teamsData) setTeams(teamsData as Team[]);

      const { data: projectsData } = await supabase.from('projects_with_details').select('*').order('created_at', { ascending: false });
      if (projectsData) setProjects(projectsData as Project[]);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const openProjectModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setProjectForm({
        project_name: project.project_name, description: project.description || '', stage: project.stage, priority: project.priority,
        status: project.status, team_id: project.team_id || '', deadline: project.deadline || '', progress: project.progress, criticality: project.criticality,
      });
    } else {
      setEditingProject(null);
      setProjectForm({ project_name: '', description: '', stage: 'SD DESIGN', priority: 'medium', status: 'IN PROGRESS', team_id: '', deadline: '', progress: 0, criticality: 5 });
    }
    setShowProjectModal(true);
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.project_name) { toast.error('Project name is required'); return; }
    setIsSaving(true);
    try {
      const supabase = await getSupabase();
      if (!supabase) return;
      const projectData = { ...projectForm, team_id: projectForm.team_id || null, deadline: projectForm.deadline || null };

      if (editingProject) {
        await supabase.from('projects').update(projectData).eq('id', editingProject.id);
        toast.success('Project updated successfully');
      } else {
        await supabase.from('projects').insert([{ ...projectData, created_by: user?.id }]);
        toast.success('Project created successfully');
      }
      setShowProjectModal(false);
      checkAuthAndFetch();
    } catch (error) {
      toast.error('Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const supabase = await getSupabase();
      if (!supabase) return;
      await supabase.from('projects').delete().eq('id', projectId);
      toast.success('Project deleted');
      checkAuthAndFetch();
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const supabase = await getSupabase();
      if (!supabase) return;
      await supabase.from('profiles').update({ is_active: !currentStatus }).eq('id', userId);
      toast.success(`User ${currentStatus ? 'disabled' : 'enabled'}`);
      checkAuthAndFetch();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;

  const stats = { totalUsers: users.length, activeUsers: users.filter(u => u.is_active).length, totalProjects: projects.length, completedProjects: projects.filter(p => p.status === 'DONE').length };

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-tangent rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Control Panel</h1>
            <p className="text-sm text-gray-400">Manage users, projects, and system settings</p>
          </div>
        </div>
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all',
              activeTab === tab.id ? 'bg-tangent-blue text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card"><Users className="w-8 h-8 text-tangent-blue mb-2" /><p className="text-2xl font-bold">{stats.totalUsers}</p><p className="text-sm text-gray-400">Total Users</p></div>
        <div className="stat-card"><CheckCircle2 className="w-8 h-8 text-green-500 mb-2" /><p className="text-2xl font-bold">{stats.activeUsers}</p><p className="text-sm text-gray-400">Active Users</p></div>
        <div className="stat-card"><FolderKanban className="w-8 h-8 text-orange-500 mb-2" /><p className="text-2xl font-bold">{stats.totalProjects}</p><p className="text-sm text-gray-400">Total Projects</p></div>
        <div className="stat-card"><BarChart3 className="w-8 h-8 text-purple-500 mb-2" /><p className="text-2xl font-bold">{stats.completedProjects}</p><p className="text-sm text-gray-400">Completed</p></div>
      </div>

      {activeTab === 'users' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-6">User Management</h2>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td><div className="flex items-center gap-3"><div className={cn('w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-white text-sm', getAvatarColor(u.full_name || ''))}>{getInitials(u.full_name)}</div><span className="font-medium">{u.full_name || 'N/A'}</span></div></td>
                    <td className="text-gray-400">{u.email}</td>
                    <td><span className={cn('badge border', u.role === 'admin' ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' : u.role === 'manager' ? 'bg-tangent-blue/15 text-tangent-blue border-tangent-blue/30' : 'bg-gray-500/15 text-gray-400 border-gray-500/30')}>{u.role}</span></td>
                    <td><span className={cn('badge border', u.is_active ? 'bg-green-500/15 text-green-500 border-green-500/30' : 'bg-red-500/15 text-red-500 border-red-500/30')}>{u.is_active ? 'Active' : 'Disabled'}</span></td>
                    <td><button onClick={() => toggleUserStatus(u.id, u.is_active)} className={cn('p-2 rounded-lg', u.is_active ? 'hover:bg-red-500/10' : 'hover:bg-green-500/10')}>{u.is_active ? <XCircle className="w-4 h-4 text-gray-400 hover:text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-gray-400 hover:text-green-500" />}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === 'projects' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Project Management</h2>
            <button onClick={() => openProjectModal()} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />Add Project</button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Project</th><th>Stage</th><th>Priority</th><th>Status</th><th>Team</th><th>Actions</th></tr></thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.project_name}</td>
                    <td className="text-gray-400">{p.stage}</td>
                    <td><span className={cn('badge border', p.priority === 'critical' ? 'bg-red-500/15 text-red-500 border-red-500/30' : p.priority === 'high' ? 'bg-orange-500/15 text-orange-500 border-orange-500/30' : p.priority === 'medium' ? 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30' : 'bg-green-500/15 text-green-500 border-green-500/30')}>{p.priority}</span></td>
                    <td><span className={cn('badge border', p.status === 'DONE' ? 'bg-green-500/15 text-green-500 border-green-500/30' : 'bg-tangent-blue/15 text-tangent-blue border-tangent-blue/30')}>{p.status}</span></td>
                    <td className="text-gray-400">{p.team_lead || 'Unassigned'}</td>
                    <td><div className="flex gap-1"><button onClick={() => openProjectModal(p)} className="p-2 hover:bg-tangent-blue/10 rounded-lg"><Edit className="w-4 h-4 text-gray-400 hover:text-tangent-blue" /></button><button onClick={() => deleteProject(p.id)} className="p-2 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === 'analytics' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">System Overview</h2>
          <p className="text-gray-400">Analytics dashboard coming soon...</p>
        </motion.div>
      )}

      {/* Project Modal */}
      <AnimatePresence>
        {showProjectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowProjectModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-semibold">{editingProject ? 'Edit Project' : 'Add Project'}</h2><button onClick={() => setShowProjectModal(false)} className="p-2 hover:bg-white/5 rounded-lg"><X className="w-5 h-5" /></button></div>
              <form onSubmit={handleProjectSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Project Name *</label><input type="text" value={projectForm.project_name} onChange={(e) => setProjectForm({ ...projectForm, project_name: e.target.value })} className="input-field" required /></div>
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Stage</label><select value={projectForm.stage} onChange={(e) => setProjectForm({ ...projectForm, stage: e.target.value as ProjectStage })} className="input-field">{stages.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Priority</label><select value={projectForm.priority} onChange={(e) => setProjectForm({ ...projectForm, priority: e.target.value as ProjectPriority })} className="input-field">{priorities.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}</select></div>
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Status</label><select value={projectForm.status} onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value as ProjectStatus })} className="input-field">{statuses.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Team</label><select value={projectForm.team_id} onChange={(e) => setProjectForm({ ...projectForm, team_id: e.target.value })} className="input-field"><option value="">Unassigned</option>{teams.map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}</select></div>
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Deadline</label><input type="date" value={projectForm.deadline} onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })} className="input-field" /></div>
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Progress ({projectForm.progress}%)</label><input type="range" min="0" max="100" value={projectForm.progress} onChange={(e) => setProjectForm({ ...projectForm, progress: parseInt(e.target.value) })} className="w-full" /></div>
                </div>
                <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowProjectModal(false)} className="btn-secondary flex-1">Cancel</button><button type="submit" disabled={isSaving} className="btn-primary flex-1">{isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (editingProject ? 'Update' : 'Create')}</button></div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
