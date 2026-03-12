'use client';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import {
  Plus,
  Search,
  CheckSquare,
  LayoutGrid,
  List,
  ChevronLeft,
  MoreHorizontal,
  Calendar,
  User,
  X,
  Edit,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle,
  Circle,
  Flag,
} from 'lucide-react';

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  assignee_id: string | null;
  project_id: string | null;
  created_at: string;
  profiles?: { full_name: string | null; email: string } | null;
  projects?: { project_name: string } | null;
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

const statusOptions = [
  { value: 'todo', label: 'To Do', color: 'bg-gray-500', icon: Circle },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500', icon: Clock },
  { value: 'in_review', label: 'In Review', color: 'bg-purple-500', icon: CheckSquare },
  { value: 'blocked', label: 'Blocked', color: 'bg-red-500', icon: AlertTriangle },
  { value: 'done', label: 'Done', color: 'bg-green-500', icon: CheckCircle },
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'text-green-400 bg-green-500/15' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400 bg-yellow-500/15' },
  { value: 'high', label: 'High', color: 'text-orange-400 bg-orange-500/15' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-400 bg-red-500/15' },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*, profiles(full_name, email), projects(project_name)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTasks(data);
    }
    setLoading(false);
  };

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('id, project_name')
      .in('project_status', ['active', 'in_progress'])
      .order('project_name');
    setProjects(data || []);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('is_active', true)
      .order('full_name');
    setUsers(data || []);
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) {
      setTasks(tasks.filter(t => t.id !== id));
      setActiveDropdown(null);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (!error) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    }
  };

  const toggleDropdown = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setShowModal(true);
    setActiveDropdown(null);
  };

  const openNewModal = () => {
    setEditingTask(null);
    setShowModal(true);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusConfig = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const getPriorityConfig = (priority: string) => {
    return priorityOptions.find(p => p.value === priority) || priorityOptions[1];
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'No due date';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Invalid date';
    }
  };

  const isOverdue = (task: Task): boolean => {
    if (!task.due_date || task.status === 'done') return false;
    return new Date(task.due_date) < new Date();
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    overdue: tasks.filter(isOverdue).length,
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
      {/* Back Navigation */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <CheckSquare className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="text-gradient">Tasks</span>
            </h1>
            <p className="text-gray-400 mt-1">Manage and track all your tasks</p>
          </div>
        </div>
        <button onClick={openNewModal} className="btn-primary">
          <Plus className="w-5 h-5" />
          New Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card-premium p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#00AEEF]/20 flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-[#00AEEF]" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-400">Total Tasks</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.completed}</p>
              <p className="text-sm text-gray-400">Completed</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.inProgress}</p>
              <p className="text-sm text-gray-400">In Progress</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.overdue}</p>
              <p className="text-sm text-gray-400">Overdue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
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
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="select-premium w-36"
        >
          <option value="all">All Status</option>
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="select-premium w-36"
        >
          <option value="all">All Priority</option>
          {priorityOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <div className="flex items-center p-1 bg-white/5 rounded-xl border border-white/5">
          <button
            onClick={() => setView('kanban')}
            className={`p-2.5 rounded-lg transition-all ${
              view === 'kanban' ? 'bg-[#00AEEF] text-white shadow-lg shadow-[#00AEEF]/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2.5 rounded-lg transition-all ${
              view === 'list' ? 'bg-[#00AEEF] text-white shadow-lg shadow-[#00AEEF]/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-5 gap-4">
          {statusOptions.map((status) => {
            const statusTasks = filteredTasks.filter(t => t.status === status.value);
            const StatusIcon = status.icon;
            
            return (
              <div key={status.value} className="card-premium p-4 min-h-[500px]">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
                  <StatusIcon className="w-4 h-4" />
                  <h3 className="font-semibold text-sm">{status.label}</h3>
                  <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded-full">
                    {statusTasks.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {statusTasks.map((task) => {
                    const priority = getPriorityConfig(task.priority);
                    const overdue = isOverdue(task);

                    return (
                      <div
                        key={task.id}
                        className={`p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group ${
                          overdue ? 'border border-red-500/30' : ''
                        }`}
                        onClick={() => openEditModal(task)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${priority.color}`}>
                            {priority.label}
                          </span>
                          <div className="relative" ref={activeDropdown === task.id ? dropdownRef : null}>
                            <button
                              onClick={(e) => toggleDropdown(task.id, e)}
                              className="p-1 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-3 h-3" />
                            </button>
                            {activeDropdown === task.id && (
                              <div className="absolute right-0 top-full mt-1 w-32 py-1 bg-[#1e1e28] rounded-lg border border-white/10 shadow-xl z-50">
                                <button
                                  onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5"
                                >
                                  <Edit className="w-3 h-3" />
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <h4 className="text-sm font-medium mb-2 line-clamp-2">{task.title}</h4>

                        <div className="flex items-center justify-between text-[10px] text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className={overdue ? 'text-red-400' : ''}>{formatDate(task.due_date)}</span>
                          </div>
                          {task.profiles && (
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#00AEEF] to-[#0077a3] flex items-center justify-center text-[8px] text-white font-medium">
                              {task.profiles.full_name?.charAt(0) || task.profiles.email.charAt(0)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {statusTasks.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-xs text-gray-500">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="card-premium overflow-hidden">
          <table className="table-premium">
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Assignee</th>
                <th>Project</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => {
                const status = getStatusConfig(task.status);
                const priority = getPriorityConfig(task.priority);
                const overdue = isOverdue(task);
                const StatusIcon = status.icon;

                return (
                  <tr key={task.id} className={overdue ? 'bg-red-500/5' : ''}>
                    <td>
                      <p className="font-medium cursor-pointer hover:text-[#00AEEF]" onClick={() => openEditModal(task)}>
                        {task.title}
                      </p>
                    </td>
                    <td>
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 cursor-pointer"
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={`text-xs px-2 py-1 rounded-full ${priority.color}`}>
                        {priority.label}
                      </span>
                    </td>
                    <td className={overdue ? 'text-red-400' : 'text-gray-400'}>
                      {formatDate(task.due_date)}
                    </td>
                    <td>
                      {task.profiles ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#00AEEF] to-[#0077a3] flex items-center justify-center text-[10px] text-white font-medium">
                            {task.profiles.full_name?.charAt(0) || task.profiles.email.charAt(0)}
                          </div>
                          <span className="text-sm">{task.profiles.full_name || task.profiles.email}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">Unassigned</span>
                      )}
                    </td>
                    <td className="text-gray-400">
                      {task.projects?.project_name || '-'}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(task)}
                          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {filteredTasks.length === 0 && (
        <div className="card-premium text-center py-16">
          <CheckSquare className="w-20 h-20 mx-auto mb-4 text-gray-700" />
          <h3 className="text-xl font-semibold mb-2">No Tasks Found</h3>
          <p className="text-gray-400 text-sm mb-6">
            {searchQuery || filterStatus !== 'all' || filterPriority !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first task to get started'}
          </p>
          <button onClick={openNewModal} className="btn-primary">
            <Plus className="w-4 h-4" />
            Create Task
          </button>
        </div>
      )}

      {/* Task Modal */}
      {showModal && (
        <TaskModal
          task={editingTask}
          projects={projects}
          users={users}
          onClose={() => {
            setShowModal(false);
            setEditingTask(null);
          }}
          onSaved={() => {
            setShowModal(false);
            setEditingTask(null);
            fetchTasks();
          }}
        />
      )}
    </div>
  );
}

// Task Modal Component
function TaskModal({
  task,
  projects,
  users,
  onClose,
  onSaved,
}: {
  task: Task | null;
  projects: Project[];
  users: Profile[];
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
    assignee_id: task?.assignee_id || '',
    project_id: task?.project_id || '',
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

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      status: formData.status,
      priority: formData.priority,
      due_date: formData.due_date || null,
      assignee_id: formData.assignee_id || null,
      project_id: formData.project_id || null,
      updated_at: new Date().toISOString(),
    };

    try {
      let result;
      if (isEditing) {
        result = await supabase.from('tasks').update(taskData).eq('id', task.id);
      } else {
        result = await supabase.from('tasks').insert(taskData);
      }

      if (result.error) throw result.error;
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
          <h2 className="text-xl font-bold">{isEditing ? 'Edit Task' : 'Create New Task'}</h2>
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
            <label className="block text-sm font-medium mb-2 text-gray-300">Task Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-premium"
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-premium h-20 resize-none"
              placeholder="Enter task description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="select-premium"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="select-premium"
              >
                {priorityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="input-premium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Assignee</label>
              <select
                value={formData.assignee_id}
                onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
                className="select-premium"
              >
                <option value="">Unassigned</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.full_name || user.email}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Project</label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="select-premium"
            >
              <option value="">No Project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.project_name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
