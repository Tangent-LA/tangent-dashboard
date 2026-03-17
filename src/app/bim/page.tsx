'use client';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronLeft,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Upload,
  Download,
  X,
  Eye,
} from 'lucide-react';

type BimDeliverable = {
  id: string;
  deliverable_name: string;
  description: string | null;
  status: string;
  due_date: string | null;
  submitted_date: string | null;
  project_id: string | null;
  file_url: string | null;
  revision: number;
  created_at: string;
  projects?: { project_name: string } | null;
};

type Project = {
  id: string;
  project_name: string;
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: '#6B7280', icon: Clock },
  in_progress: { label: 'In Progress', color: '#3B82F6', icon: FileText },
  submitted: { label: 'Submitted', color: '#F59E0B', icon: Upload },
  approved: { label: 'Approved', color: '#10B981', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: '#EF4444', icon: AlertTriangle },
};

export default function BimPage() {
  const [deliverables, setDeliverables] = useState<BimDeliverable[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BimDeliverable | null>(null);
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
    const [deliverablesRes, projectsRes] = await Promise.all([
      supabase.from('bim_deliverables').select('*, projects(project_name)').order('due_date', { ascending: true }),
      supabase.from('projects').select('id, project_name'),
    ]);

    if (deliverablesRes.data) setDeliverables(deliverablesRes.data);
    if (projectsRes.data) setProjects(projectsRes.data);
    setLoading(false);
  };

  const filteredDeliverables = deliverables.filter(d => {
    if (searchQuery && !d.deliverable_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterStatus && d.status !== filterStatus) return false;
    if (filterProject && d.project_id !== filterProject) return false;
    return true;
  });

  const isOverdue = (d: BimDeliverable) => {
    if (!d.due_date || d.status === 'approved' || d.status === 'submitted') return false;
    return d.due_date < new Date().toISOString().split('T')[0];
  };

  const deleteDeliverable = async (id: string) => {
    if (!confirm('Delete this deliverable?')) return;
    const { error } = await supabase.from('bim_deliverables').delete().eq('id', id);
    if (!error) {
      setDeliverables(deliverables.filter(d => d.id !== id));
      setActiveMenu(null);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '-';
    }
  };

  // Stats
  const stats = {
    total: deliverables.length,
    pending: deliverables.filter(d => d.status === 'pending' || d.status === 'in_progress').length,
    submitted: deliverables.filter(d => d.status === 'submitted').length,
    approved: deliverables.filter(d => d.status === 'approved').length,
    overdue: deliverables.filter(isOverdue).length,
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="text-gradient">BIM Deliverables</span>
            </h1>
            <p className="text-gray-400 mt-1">{deliverables.length} deliverables</p>
          </div>
        </div>

        <button onClick={() => { setEditingItem(null); setShowModal(true); }} className="btn-primary">
          <Plus className="w-5 h-5" />
          New Deliverable
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="kpi-icon bg-gray-500/20">
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-400">Total</p>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="kpi-icon bg-blue-500/20">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-gray-400">Pending</p>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="kpi-icon bg-yellow-500/20">
              <Upload className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.submitted}</p>
              <p className="text-sm text-gray-400">Submitted</p>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="kpi-icon bg-green-500/20">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.approved}</p>
              <p className="text-sm text-gray-400">Approved</p>
            </div>
          </div>
        </div>
        <div className={`kpi-card ${stats.overdue > 0 ? 'border-red-500/30' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="kpi-icon bg-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{stats.overdue}</p>
              <p className="text-sm text-gray-400">Overdue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search deliverables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-premium pl-12 w-full"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="select-premium w-40"
        >
          <option value="">All Status</option>
          {Object.entries(statusConfig).map(([key, { label }]) => (
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
      </div>

      {/* Table */}
      <div className="card-premium overflow-hidden">
        <table className="table-premium">
          <thead>
            <tr>
              <th>Deliverable</th>
              <th>Project</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Submitted</th>
              <th>Revision</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredDeliverables.map(deliverable => {
              const status = statusConfig[deliverable.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              const overdue = isOverdue(deliverable);

              return (
                <tr key={deliverable.id} className={overdue ? 'bg-red-500/5' : ''}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="font-medium">{deliverable.deliverable_name}</p>
                        {deliverable.description && (
                          <p className="text-xs text-gray-500 truncate max-w-xs">{deliverable.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-gray-400">{deliverable.projects?.project_name || '-'}</td>
                  <td>
                    <span
                      className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full"
                      style={{ backgroundColor: `${status.color}20`, color: status.color }}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </td>
                  <td className={overdue ? 'text-red-400' : 'text-gray-400'}>
                    {formatDate(deliverable.due_date)}
                    {overdue && <span className="ml-1 text-xs">(overdue)</span>}
                  </td>
                  <td className="text-gray-400">{formatDate(deliverable.submitted_date)}</td>
                  <td className="text-gray-400">v{deliverable.revision || 1}</td>
                  <td>
                    <div className="relative" ref={activeMenu === deliverable.id ? menuRef : null}>
                      <button
                        onClick={() => setActiveMenu(activeMenu === deliverable.id ? null : deliverable.id)}
                        className="p-1.5 hover:bg-white/10 rounded-lg"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                      {activeMenu === deliverable.id && (
                        <div className="absolute right-0 top-8 w-40 bg-[#1e1e28] border border-white/10 rounded-xl shadow-xl z-50 animate-fadeIn">
                          <button
                            onClick={() => { setEditingItem(deliverable); setShowModal(true); setActiveMenu(null); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 rounded-t-xl"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => deleteDeliverable(deliverable.id)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-b-xl"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredDeliverables.length === 0 && (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-700" />
            <h3 className="text-xl font-semibold mb-2">No Deliverables Found</h3>
            <p className="text-gray-400 text-sm">Create your first BIM deliverable</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <DeliverableModal
          deliverable={editingItem}
          projects={projects}
          onClose={() => { setShowModal(false); setEditingItem(null); }}
          onSaved={() => { setShowModal(false); setEditingItem(null); fetchData(); }}
        />
      )}
    </div>
  );
}

// Deliverable Modal
function DeliverableModal({
  deliverable,
  projects,
  onClose,
  onSaved,
}: {
  deliverable: BimDeliverable | null;
  projects: Project[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = !!deliverable;
  const [formData, setFormData] = useState({
    deliverable_name: deliverable?.deliverable_name || '',
    description: deliverable?.description || '',
    status: deliverable?.status || 'pending',
    due_date: deliverable?.due_date?.split('T')[0] || '',
    submitted_date: deliverable?.submitted_date?.split('T')[0] || '',
    project_id: deliverable?.project_id || '',
    revision: deliverable?.revision || 1,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.deliverable_name.trim()) {
      setError('Deliverable name is required');
      return;
    }

    setSaving(true);
    setError('');

    const data = {
      deliverable_name: formData.deliverable_name.trim(),
      description: formData.description.trim() || null,
      status: formData.status,
      due_date: formData.due_date || null,
      submitted_date: formData.submitted_date || null,
      project_id: formData.project_id || null,
      revision: formData.revision,
      updated_at: new Date().toISOString(),
    };

    try {
      if (isEditing) {
        const { error } = await supabase.from('bim_deliverables').update(data).eq('id', deliverable.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('bim_deliverables').insert(data);
        if (error) throw error;
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{isEditing ? 'Edit Deliverable' : 'New Deliverable'}</h2>
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Deliverable Name *</label>
            <input
              type="text"
              value={formData.deliverable_name}
              onChange={(e) => setFormData({ ...formData, deliverable_name: e.target.value })}
              className="input-premium"
              placeholder="e.g., LOD 300 BIM Model"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-premium h-20 resize-none"
              placeholder="Description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Project</label>
              <select
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                className="select-premium"
              >
                <option value="">Select project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.project_name}</option>
                ))}
              </select>
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="input-premium"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Submitted Date</label>
              <input
                type="date"
                value={formData.submitted_date}
                onChange={(e) => setFormData({ ...formData, submitted_date: e.target.value })}
                className="input-premium"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Revision</label>
            <input
              type="number"
              min="1"
              value={formData.revision}
              onChange={(e) => setFormData({ ...formData, revision: parseInt(e.target.value) || 1 })}
              className="input-premium w-24"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
