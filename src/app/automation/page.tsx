'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Zap,
  ChevronLeft,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Bell,
  Mail,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Settings,
  ArrowRight,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

type AutomationRule = {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  isActive: boolean;
  lastRun: string | null;
  runCount: number;
};

const mockRules: AutomationRule[] = [
  {
    id: '1',
    name: 'Deadline Reminder',
    description: 'Send email notification 3 days before project deadline',
    trigger: 'Project deadline approaching (3 days)',
    action: 'Send email to project team',
    isActive: true,
    lastRun: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    runCount: 47,
  },
  {
    id: '2',
    name: 'Overdue Alert',
    description: 'Notify managers when project becomes overdue',
    trigger: 'Project status = Overdue',
    action: 'Send alert to managers',
    isActive: true,
    lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    runCount: 12,
  },
  {
    id: '3',
    name: 'BIM Submission Reminder',
    description: 'Remind team about upcoming BIM submissions',
    trigger: 'BIM deliverable due in 7 days',
    action: 'Send reminder to BIM coordinator',
    isActive: false,
    lastRun: null,
    runCount: 0,
  },
  {
    id: '4',
    name: 'Weekly Progress Report',
    description: 'Generate and send weekly project progress report',
    trigger: 'Every Monday at 9:00 AM',
    action: 'Generate report and email to stakeholders',
    isActive: true,
    lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    runCount: 23,
  },
  {
    id: '5',
    name: 'Task Assignment Notification',
    description: 'Notify team member when task is assigned',
    trigger: 'Task assigned to user',
    action: 'Send notification to assignee',
    isActive: true,
    lastRun: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    runCount: 156,
  },
];

const triggerTypes = [
  { value: 'deadline_approaching', label: 'Deadline Approaching', icon: Calendar },
  { value: 'status_change', label: 'Status Changed', icon: AlertTriangle },
  { value: 'task_assigned', label: 'Task Assigned', icon: CheckCircle2 },
  { value: 'schedule', label: 'Scheduled Time', icon: Clock },
  { value: 'deliverable_due', label: 'Deliverable Due', icon: Bell },
];

const actionTypes = [
  { value: 'send_email', label: 'Send Email', icon: Mail },
  { value: 'send_notification', label: 'Send Notification', icon: Bell },
  { value: 'generate_report', label: 'Generate Report', icon: Settings },
];

export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>(mockRules);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  const toggleRule = (id: string) => {
    setRules(rules.map(rule =>
      rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  const deleteRule = (id: string) => {
    if (confirm('Delete this automation rule?')) {
      setRules(rules.filter(rule => rule.id !== id));
    }
  };

  const formatLastRun = (date: string | null) => {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const activeRules = rules.filter(r => r.isActive).length;
  const totalRuns = rules.reduce((sum, r) => sum + r.runCount, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="text-gradient">Automation</span>
            </h1>
            <p className="text-gray-400 mt-1">Workflow rules and notifications</p>
          </div>
        </div>

        <button 
          onClick={() => { setEditingRule(null); setShowModal(true); }}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          New Rule
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="kpi-icon bg-yellow-500/20">
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{rules.length}</p>
              <p className="text-sm text-gray-400">Total Rules</p>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="kpi-icon bg-green-500/20">
              <Play className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeRules}</p>
              <p className="text-sm text-gray-400">Active</p>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="kpi-icon bg-gray-500/20">
              <Pause className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{rules.length - activeRules}</p>
              <p className="text-sm text-gray-400">Paused</p>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="kpi-icon bg-blue-500/20">
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalRuns}</p>
              <p className="text-sm text-gray-400">Total Runs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`card-premium p-6 transition-all ${
              rule.isActive ? '' : 'opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  rule.isActive ? 'bg-yellow-500/20' : 'bg-gray-500/20'
                }`}>
                  <Zap className={`w-6 h-6 ${
                    rule.isActive ? 'text-yellow-400' : 'text-gray-500'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{rule.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                  
                  <div className="flex items-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Trigger:</span>
                      <span className="text-xs text-gray-300 bg-white/5 px-2 py-1 rounded">
                        {rule.trigger}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-600" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Action:</span>
                      <span className="text-xs text-gray-300 bg-white/5 px-2 py-1 rounded">
                        {rule.action}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                    <span>Last run: {formatLastRun(rule.lastRun)}</span>
                    <span>•</span>
                    <span>{rule.runCount} total runs</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    rule.isActive 
                      ? 'text-green-400 hover:bg-green-500/10' 
                      : 'text-gray-500 hover:bg-white/5'
                  }`}
                  title={rule.isActive ? 'Pause' : 'Activate'}
                >
                  {rule.isActive ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
                <button
                  onClick={() => { setEditingRule(rule); setShowModal(true); }}
                  className="p-2 hover:bg-white/10 rounded-lg text-gray-400"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Templates */}
      <div className="card-premium p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Templates</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              title: 'Deadline Alert',
              description: 'Notify team before project deadlines',
              trigger: triggerTypes[0],
              action: actionTypes[0],
            },
            {
              title: 'Status Update',
              description: 'Alert on project status changes',
              trigger: triggerTypes[1],
              action: actionTypes[1],
            },
            {
              title: 'Weekly Report',
              description: 'Automated weekly progress report',
              trigger: triggerTypes[3],
              action: actionTypes[2],
            },
          ].map((template, i) => {
            const TriggerIcon = template.trigger.icon;
            const ActionIcon = template.action.icon;
            
            return (
              <button
                key={i}
                onClick={() => setShowModal(true)}
                className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 text-left transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TriggerIcon className="w-4 h-4 text-yellow-400" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600" />
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ActionIcon className="w-4 h-4 text-blue-400" />
                  </div>
                </div>
                <h4 className="font-medium">{template.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{template.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal placeholder */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">
              {editingRule ? 'Edit Rule' : 'Create New Rule'}
            </h2>
            <p className="text-gray-500 mb-6">
              Configure automation triggers and actions for your workflow.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Rule Name</label>
                <input
                  type="text"
                  defaultValue={editingRule?.name || ''}
                  className="input-premium"
                  placeholder="Enter rule name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  defaultValue={editingRule?.description || ''}
                  className="input-premium h-20 resize-none"
                  placeholder="Describe what this rule does"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Trigger</label>
                <select className="select-premium">
                  {triggerTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Action</label>
                <select className="select-premium">
                  {actionTypes.map(a => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={() => setShowModal(false)} className="btn-primary">
                {editingRule ? 'Update Rule' : 'Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
