'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import {
  Plus,
  Zap,
  ChevronLeft,
  X,
  Edit,
  Trash2,
  Play,
  Pause,
  ArrowRight,
  Bell,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';

type AutomationRule = {
  id: string;
  rule_name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: any;
  action_type: string;
  action_config: any;
  is_active: boolean;
  run_count: number;
  last_run_at: string | null;
  created_at: string;
};

const triggerTypes = [
  { value: 'status_change', label: 'Status Change', icon: CheckCircle },
  { value: 'deadline_approaching', label: 'Deadline Approaching', icon: Clock },
  { value: 'task_created', label: 'Task Created', icon: Plus },
  { value: 'subtasks_complete', label: 'Subtasks Complete', icon: CheckCircle },
  { value: 'task_overdue', label: 'Task Overdue', icon: AlertTriangle },
];

const actionTypes = [
  { value: 'assign_task', label: 'Assign Task' },
  { value: 'send_notification', label: 'Send Notification' },
  { value: 'update_status', label: 'Update Status' },
  { value: 'escalate', label: 'Escalate to Manager' },
  { value: 'create_task', label: 'Create Follow-up Task' },
];

export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRules(data);
    }
    setLoading(false);
  };

  const toggleRule = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('automation_rules')
      .update({ is_active: !isActive, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setRules(rules.map(r => r.id === id ? { ...r, is_active: !isActive } : r));
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) return;
    
    const { error } = await supabase.from('automation_rules').delete().eq('id', id);
    if (!error) {
      setRules(rules.filter(r => r.id !== id));
    }
  };

  const openEditModal = (rule: AutomationRule) => {
    setEditingRule(rule);
    setShowModal(true);
  };

  const openNewModal = () => {
    setEditingRule(null);
    setShowModal(true);
  };

  const stats = {
    total: rules.length,
    active: rules.filter(r => r.is_active).length,
    inactive: rules.filter(r => !r.is_active).length,
    totalRuns: rules.reduce((acc, r) => acc + (r.run_count || 0), 0),
  };

  const getTriggerConfig = (type: string) => {
    return triggerTypes.find(t => t.value === type) || { value: type, label: type, icon: Zap };
  };

  const getActionConfig = (type: string) => {
    return actionTypes.find(a => a.value === type) || { value: type, label: type };
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="text-gradient">Automation</span>
            </h1>
            <p className="text-gray-400 mt-1">Automate repetitive tasks and workflows</p>
          </div>
        </div>
        <button onClick={openNewModal} className="btn-primary">
          <Plus className="w-5 h-5" />
          New Rule
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card-premium p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-400">Total Rules</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Play className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.active}</p>
              <p className="text-sm text-gray-400">Active</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-500/20 flex items-center justify-center">
              <Pause className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.inactive}</p>
              <p className="text-sm text-gray-400">Inactive</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.totalRuns}</p>
              <p className="text-sm text-gray-400">Total Runs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      {rules.length === 0 ? (
        <div className="card-premium text-center py-16">
          <Zap className="w-20 h-20 mx-auto mb-4 text-gray-700" />
          <h3 className="text-xl font-semibold mb-2">No Automation Rules</h3>
          <p className="text-gray-400 text-sm mb-6">Create your first automation rule to get started</p>
          <button onClick={openNewModal} className="btn-primary">
            <Plus className="w-4 h-4" />
            Create Rule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {rules.map((rule) => {
            const trigger = getTriggerConfig(rule.trigger_type);
            const action = getActionConfig(rule.action_type);
            const TriggerIcon = trigger.icon;

            return (
              <div key={rule.id} className={`card-premium p-5 ${!rule.is_active ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      rule.is_active ? 'bg-yellow-500/20' : 'bg-gray-500/20'
                    }`}>
                      <Zap className={`w-5 h-5 ${rule.is_active ? 'text-yellow-400' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{rule.rule_name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        rule.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleRule(rule.id, rule.is_active)}
                      className={`p-2 rounded-lg transition-colors ${
                        rule.is_active 
                          ? 'hover:bg-yellow-500/20 text-yellow-400' 
                          : 'hover:bg-green-500/20 text-green-400'
                      }`}
                      title={rule.is_active ? 'Disable' : 'Enable'}
                    >
                      {rule.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEditModal(rule)}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {rule.description && (
                  <p className="text-sm text-gray-400 mb-4">{rule.description}</p>
                )}

                {/* Trigger → Action Flow */}
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-2 flex-1">
                    <TriggerIcon className="w-4 h-4 text-blue-400" />
                    <span className="text-sm">{trigger.label}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                  <div className="flex items-center gap-2 flex-1">
                    <Bell className="w-4 h-4 text-green-400" />
                    <span className="text-sm">{action.label}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                  <span>Runs: {rule.run_count || 0}</span>
                  <span>
                    Last run: {rule.last_run_at 
                      ? new Date(rule.last_run_at).toLocaleDateString() 
                      : 'Never'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AutomationModal
          rule={editingRule}
          onClose={() => {
            setShowModal(false);
            setEditingRule(null);
          }}
          onSaved={() => {
            setShowModal(false);
            setEditingRule(null);
            fetchRules();
          }}
        />
      )}
    </div>
  );
}

function AutomationModal({
  rule,
  onClose,
  onSaved,
}: {
  rule: AutomationRule | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = !!rule;
  const [formData, setFormData] = useState({
    rule_name: rule?.rule_name || '',
    description: rule?.description || '',
    trigger_type: rule?.trigger_type || 'status_change',
    action_type: rule?.action_type || 'send_notification',
    is_active: rule?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.rule_name.trim()) {
      setError('Rule name is required');
      return;
    }

    setSaving(true);
    setError('');

    const data = {
      rule_name: formData.rule_name.trim(),
      description: formData.description.trim() || null,
      trigger_type: formData.trigger_type,
      trigger_config: {},
      action_type: formData.action_type,
      action_config: {},
      is_active: formData.is_active,
      updated_at: new Date().toISOString(),
    };

    try {
      let result;
      if (isEditing) {
        result = await supabase.from('automation_rules').update(data).eq('id', rule.id);
      } else {
        result = await supabase.from('automation_rules').insert(data);
      }

      if (result.error) throw result.error;
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{isEditing ? 'Edit Rule' : 'New Automation Rule'}</h2>
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
            <label className="block text-sm font-medium mb-2 text-gray-300">Rule Name *</label>
            <input
              type="text"
              value={formData.rule_name}
              onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
              className="input-premium"
              placeholder="e.g., Notify on task completion"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-premium h-20 resize-none"
              placeholder="What does this rule do?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">When this happens (Trigger)</label>
            <select
              value={formData.trigger_type}
              onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
              className="select-premium"
            >
              {triggerTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Do this (Action)</label>
            <select
              value={formData.action_type}
              onChange={(e) => setFormData({ ...formData, action_type: e.target.value })}
              className="select-premium"
            >
              {actionTypes.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
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
              {saving ? 'Saving...' : isEditing ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
