'use client';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import {
  ListTodo,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronLeft,
  Calendar,
  User,
  Flag,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  X,
  LayoutGrid,
  Kanban,
  List,
} from 'lucide-react';

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  project_id: string | null;
  assignee_id: string | null;
  created_at: string;
  projects?: { project_name: string } | null;
  profiles?: { full_name: string; email: string } | null;
};

type Project = {
  id: string;
  project_name: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  todo: { label: 'To Do', color: '#6B7280', icon: Circle },
  in_progress: { label: 'In Progress', color: '#3B82F6', icon: Clock },
  review: { label: 'In Review', color: '#F59E0B', icon: AlertTriangle },
  done: { label: 'Done', color: '#10B981', icon: CheckCircle2 },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: '#10B981' },
  medium: { label: 'Medium', color: '#3B82F6' },
  high: { label: 'High', color: '#F59E0B' },
  urgent: { label: 'Urgent', color: '#EF4444' },
};

type ViewMode = 'list' | 'kanban';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
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
    const [tasksRes, projectsRes, profilesRes] = await Promise.all([
      supabase.from('tasks').select('*, projects(project_name), profiles(full_name, email)').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, project_name'),
      supabase.from('profiles').select('id, full_name, email').eq('is_active', true),
    ]);

    if (tasksRes.data) setTasks(tasksRes.data);
    if (projectsRes.data) setProjects(projectsRes.data);
    if (profilesRes.data) setProfiles(profilesRes.data);
    setLoading(false);
  };

  const filteredTasks = tasks.filter(task => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterPriority && task.priority !== filterPriority) return false;
    if (filterProject && task.project_id !== filterProject) return false;
    return true;
  });

  const tasksByStatus = Object.keys(statusConfig).reduce((acc, status) => {
    acc[status] = filteredTasks.filter(t => t.status === status);
    return acc;
  }, {} as Record<string, Task[]>);

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    if (!error) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) {
      setTasks(tasks.filter(t => t.id !== id));
      setActiveMenu(null);
    }
  };

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'done') return false;
    return task.due_date < new Date().toISOString().split('T')[0];
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    try {
      const d = new Date(date);
      const today = new Date();
      const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays <= 7) return `${diffDays}d`;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    } catch {
      return '-';
    }
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ListTodo className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="text-gradient">Tasks</span>
            </h1>
            <p className="text-gray-400 mt-1">{filteredTasks.length} tasks</p>
          </div>
        </div>

        <button onClick={() => { setEditingTask(null); setShowModal(true); }} className="btn-primary">
          <Plus className="w-5 h-5" />
          New Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const Icon = config.icon;
          const count = tasksByStatus[status]?.length || 0;
          return (
            <div key={status} className="card-premium p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${config.color}20` }}>
                  <Icon className="w-5 h-5" style={{ color: config.color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-gray-500">{config.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-premium pl-12 w-full"
          />
        </div>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="select-premium w-40"
        >
          <option value="">All Priority</option>
          {Object.entries(priorityConfig).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="select-premium w-48"
        >
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.project_name}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl">
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-2.5 rounded-lg transition-all ${
              viewMode === 'kanban' ? 'bg-[#00AEEF] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Kanban className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2.5 rounded-lg transition-all ${
              viewMode === 'list' ? 'bg-[#00AEEF] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon;
            const statusTasks = tasksByStatus[status] || [];
            
            return (
              <div key={status} className="flex-shrink-0 w-80">
                <div className="bg-white/5 rounded-xl p-4">
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" style={{ color: config.color }} />
                      <h3 className="font-semibold">{config.label}</h3>
                    </div>
                    <span className="text-sm text-gray-500 bg-white/10 px-2 py-0.5 rounded-full">
                      {statusTasks.length}
                    </span>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-3 max-h-[600px] overflow-y-auto no-scrollbar">
                    {statusTasks.map(task => {
                      const priority = priorityConfig[task.priority] || priorityConfig.medium;
                      const overdue = isOverdue(task);

                      return (
                        <div
                          key={task.id}
                          className={`p-4 rounded-xl border transition-all hover:shadow-lg cursor-pointer ${
                            overdue
                              ? 'bg-red-500/10 border-red-500/30'
                              : 'bg-[#0a0a0f] border-white/10 hover:border-white/20'
                          }`}
                          onClick={() => { setEditingTask(task); setShowModal(true); }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                          </div>
                          
                          {task.projects && (
                            <p className="text-xs text-gray-500 mb-2">{task.projects.project_name}</p>
                          )}

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: `${priority.color}20`, color: priority.color }}
                              >
                                {priority.label}
                              </span>
                            </div>
                            {task.due_date && (
                              <span className={`text-xs ${overdue ? 'text-red-400' : 'text-gray-500'}`}>
                                {formatDate(task.due_date)}
                              </span>
                            )}
                          </div>

                          {task.profiles && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs">
                                {task.profiles.full_name?.[0] || task.profiles.email[0].toUpperCase()}
                              </div>
                              <span className="text-xs text-gray-500 truncate">
                                {task.profiles.full_name || task.profiles.email}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {statusTasks.length === 0 && (
                      <div className="text-center py-8 text-gray-600">
                        <p className="text-sm">No tasks</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card-premium overflow-hidden">
          <table className="table-premium">
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Due Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => {
                const status = statusConfig[task.status] || statusConfig.todo;
                const priority = priorityConfig[task.priority] || priorityConfig.medium;
                const StatusIcon = status.icon;
                const overdue = isOverdue(task);

                return (
                  <tr key={task.id} className={overdue ? 'bg-red-500/5' : ''}>
                    <td>
                      <p className="font-medium">{task.title}</p>
                    </td>
                    <td className="text-gray-400">{task.projects?.project_name || '-'}</td>
                    <td>
                      <span
                        className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full"
                        style={{ backgroundColor: `${status.color}20`, color: status.color }}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-medium" style={{ color: priority.color }}>
                        {priority.label}
                      </span>
                    </td>
                    <td>
                      {task.profiles ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs">
                            {task.profiles.full_name?.[0] || task.profiles.email[0].toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-400">{task.profiles.full_name || task.profiles.email}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className={overdue ? 'text-red-400' : 'text-gray-400'}>
                      {formatDate(task.due_date)}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingTask(task); setShowModal(true); }}
                          className="p-1.5 hover:bg-white/10 rounded-lg"
                        >
                          <Edit className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Modal */}
      {showModal && (
        <TaskModal
          task={editingTask}
          projects={projects}
          profiles={profiles}
          onClose={() => { setShowModal(false); setEditingTask(null); }}
          onSaved={() => { setShowModal(false); setEditingTask(null); fetchData(); }}
        />
      )}
    </div>
  );
}

// Task Modal Component
function TaskModal({
  task,
  projects,
  profiles,
  onClose,
  onSaved,
}: {
  task: Task | null;
  projects: Project[];
  profiles: Profile[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = !!task;
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    due_date: task?.due_date?.split('T')[0] || '',
    project_id: task?.project_id || '',
    assignee_id: task?.assignee_id || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    setSaving(true);
    setError('');

    const data = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      status: formData.status,
      priority: formData.priority,
      due_date: formData.due_date || null,
      project_id: formData.project_id || null,
      assignee_id: formData.assignee_id || null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (isEditing) {
        const { error } = await supabase.from('tasks').update(data).eq('id', task.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tasks').insert(data);
        if (error) throw error;
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{isEditing ? 'Edit Task' : 'New Task'}</h2>
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-premium"
              placeholder="Task title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-premium h-24 resize-none"
              placeholder="Task description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="select-premium"
              >
                {Object.entries(statusConfig).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="select-premium"
              >
                {Object.entries(priorityConfig).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Project</label>
              <select
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                className="select-premium"
              >
                <option value="">No project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.project_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Assignee</label>
              <select
                value={formData.assignee_id}
                onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
                className="select-premium"
              >
                <option value="">Unassigned</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="input-premium"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
