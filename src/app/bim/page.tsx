'use client';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import {
  Plus,
  Search,
  FileBox,
  ChevronLeft,
  MoreHorizontal,
  Calendar,
  X,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter,
} from 'lucide-react';

type BimDeliverable = {
  id: string;
  deliverable_name: string;
  description: string | null;
  stage: string;
  discipline: string;
  status: string;
  due_date: string | null;
  revision_number: number;
  project_id: string | null;
  created_at: string;
  projects?: { project_name: string; teams?: { team_name: string; color: string } | null } | null;
};

type Project = {
  id: string;
  project_name: string;
};

const stageOptions = [
  { value: 'modeling', label: 'Modeling' },
  { value: 'clash_detection', label: 'Clash Detection' },
  { value: 'sheet_production', label: 'Sheet Production' },
  { value: 'nwc_export', label: 'NWC Export' },
  { value: 'ifc_export', label: 'IFC Export' },
  { value: 'acc_upload', label: 'ACC Upload' },
  { value: 'revision', label: 'Revision' },
  { value: 'submission', label: 'Submission' },
];

const disciplineOptions = [
  { value: 'architecture', label: 'Architecture' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'mep', label: 'MEP' },
  { value: 'structural', label: 'Structural' },
  { value: 'civil', label: 'Civil' },
  { value: 'interior', label: 'Interior' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'irrigation', label: 'Irrigation' },
];

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'review', label: 'In Review', color: 'bg-purple-500' },
  { value: 'approved', label: 'Approved', color: 'bg-green-500' },
  { value: 'submitted', label: 'Submitted', color: 'bg-emerald-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
];

export default function BimPage() {
  const [deliverables, setDeliverables] = useState<BimDeliverable[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<BimDeliverable | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchDeliverables();
    fetchProjects();
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

  const fetchDeliverables = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bim_deliverables')
      .select('*, projects(project_name, teams(team_name, color))')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDeliverables(data);
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

  const deleteDeliverable = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deliverable?')) return;
    
    const { error } = await supabase.from('bim_deliverables').delete().eq('id', id);
    if (!error) {
      setDeliverables(deliverables.filter(d => d.id !== id));
      setActiveDropdown(null);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('bim_deliverables')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setDeliverables(deliverables.map(d => d.id === id ? { ...d, status } : d));
    }
  };

  const toggleDropdown = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const openEditModal = (deliverable: BimDeliverable) => {
    setEditingDeliverable(deliverable);
    setShowModal(true);
    setActiveDropdown(null);
  };

  const openNewModal = () => {
    setEditingDeliverable(null);
    setShowModal(true);
  };

  const filteredDeliverables = deliverables.filter(d => {
    const matchesSearch = d.deliverable_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiscipline = filterDiscipline === 'all' || d.discipline === filterDiscipline;
    const matchesStage = filterStage === 'all' || d.stage === filterStage;
    return matchesSearch && matchesDiscipline && matchesStage;
  });

  const getStatusConfig = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'No deadline';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Invalid date';
    }
  };

  const isOverdue = (d: BimDeliverable): boolean => {
    if (!d.due_date || d.status === 'submitted' || d.status === 'approved') return false;
    return new Date(d.due_date) < new Date();
  };

  const stats = {
    total: deliverables.length,
    pending: deliverables.filter(d => d.status === 'pending' || d.status === 'in_progress').length,
    submitted: deliverables.filter(d => d.status === 'submitted' || d.status === 'approved').length,
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
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <FileBox className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="text-gradient">BIM Deliverables</span>
            </h1>
            <p className="text-gray-400 mt-1">Track and manage BIM submissions</p>
          </div>
        </div>
        <button onClick={openNewModal} className="btn-primary">
          <Plus className="w-5 h-5" />
          New Deliverable
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card-premium p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <FileBox className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-400">Total Deliverables</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.pending}</p>
              <p className="text-sm text-gray-400">In Progress</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.submitted}</p>
              <p className="text-sm text-gray-400">Submitted</p>
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

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
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
          value={filterDiscipline}
          onChange={(e) => setFilterDiscipline(e.target.value)}
          className="select-premium w-44"
        >
          <option value="all">All Disciplines</option>
          {disciplineOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value)}
          className="select-premium w-44"
        >
          <option value="all">All Stages</option>
          {stageOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
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
              <th>Discipline</th>
              <th>Stage</th>
              <th>Status</th>
              <th>Revision</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeliverables.map((deliverable) => {
              const status = getStatusConfig(deliverable.status);
              const overdue = isOverdue(deliverable);

              return (
                <tr key={deliverable.id} className={overdue ? 'bg-red-500/5' : ''}>
                  <td>
                    <p className="font-medium cursor-pointer hover:text-[#00AEEF]" onClick={() => openEditModal(deliverable)}>
                      {deliverable.deliverable_name}
                    </p>
                  </td>
                  <td className="text-gray-400">
                    {deliverable.projects?.project_name || '-'}
                  </td>
                  <td>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/5 capitalize">
                      {deliverable.discipline}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs text-gray-400 capitalize">
                      {stageOptions.find(s => s.value === deliverable.stage)?.label || deliverable.stage}
                    </span>
                  </td>
                  <td>
                    <select
                      value={deliverable.status}
                      onChange={(e) => updateStatus(deliverable.id, e.target.value)}
                      className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 cursor-pointer"
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className="text-xs bg-white/10 px-2 py-1 rounded-full">
                      Rev {deliverable.revision_number}
                    </span>
                  </td>
                  <td className={overdue ? 'text-red-400' : 'text-gray-400'}>
                    {formatDate(deliverable.due_date)}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(deliverable)}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteDeliverable(deliverable.id)}
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

      {filteredDeliverables.length === 0 && (
        <div className="card-premium text-center py-16">
          <FileBox className="w-20 h-20 mx-auto mb-4 text-gray-700" />
          <h3 className="text-xl font-semibold mb-2">No Deliverables Found</h3>
          <p className="text-gray-400 text-sm mb-6">Create your first BIM deliverable to get started</p>
          <button onClick={openNewModal} className="btn-primary">
            <Plus className="w-4 h-4" />
            Create Deliverable
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <BimModal
          deliverable={editingDeliverable}
          projects={projects}
          onClose={() => {
            setShowModal(false);
            setEditingDeliverable(null);
          }}
          onSaved={() => {
            setShowModal(false);
            setEditingDeliverable(null);
            fetchDeliverables();
          }}
        />
      )}
    </div>
  );
}

function BimModal({
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
    stage: deliverable?.stage || 'modeling',
    discipline: deliverable?.discipline || 'architecture',
    status: deliverable?.status || 'pending',
    due_date: deliverable?.due_date?.split('T')[0] || '',
    revision_number: deliverable?.revision_number || 1,
    project_id: deliverable?.project_id || '',
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
      stage: formData.stage,
      discipline: formData.discipline,
      status: formData.status,
      due_date: formData.due_date || null,
      revision_number: Number(formData.revision_number) || 1,
      project_id: formData.project_id || null,
      updated_at: new Date().toISOString(),
    };

    try {
      let result;
      if (isEditing) {
        result = await supabase.from('bim_deliverables').update(data).eq('id', deliverable.id);
      } else {
        result = await supabase.from('bim_deliverables').insert(data);
      }

      if (result.error) throw result.error;
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to save deliverable');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{isEditing ? 'Edit Deliverable' : 'New Deliverable'}</h2>
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
            <label className="block text-sm font-medium mb-2 text-gray-300">Deliverable Name *</label>
            <input
              type="text"
              value={formData.deliverable_name}
              onChange={(e) => setFormData({ ...formData, deliverable_name: e.target.value })}
              className="input-premium"
              placeholder="Enter deliverable name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-premium h-20 resize-none"
              placeholder="Enter description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Discipline</label>
              <select
                value={formData.discipline}
                onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                className="select-premium"
              >
                {disciplineOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Stage</label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                className="select-premium"
              >
                {stageOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

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
              <label className="block text-sm font-medium mb-2 text-gray-300">Revision</label>
              <input
                type="number"
                min="1"
                value={formData.revision_number}
                onChange={(e) => setFormData({ ...formData, revision_number: parseInt(e.target.value) || 1 })}
                className="input-premium"
              />
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
              <label className="block text-sm font-medium mb-2 text-gray-300">Project</label>
              <select
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                className="select-premium"
              >
                <option value="">No Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.project_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
