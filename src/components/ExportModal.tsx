'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, FileSpreadsheet, Users, AlertTriangle, Calendar } from 'lucide-react';
import { exportToExcel, prepareProjectsForExport, formatDate } from '@/lib/utils';
import type { Project, Team } from '@/types';
import toast from 'react-hot-toast';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  teams: Team[];
}

export function ExportModal({ isOpen, onClose, projects, teams }: ExportModalProps) {
  const handleExport = async (type: 'all' | 'team' | 'priority' | 'weekly') => {
    try {
      let data: any[] = [];
      let filename = 'projects_report';

      switch (type) {
        case 'all':
          data = prepareProjectsForExport(projects);
          filename = 'all_projects';
          break;

        case 'team':
          // Group by team
          const teamData: any[] = [];
          teams.forEach(team => {
            const teamProjects = projects.filter(p => p.team_id === team.id);
            teamProjects.forEach(p => {
              teamData.push({
                'Team': team.team_name,
                'Team Lead': team.team_lead || 'N/A',
                'Project Name': p.project_name,
                'Stage': p.stage,
                'Priority': p.priority.toUpperCase(),
                'Status': p.status,
                'Deadline': p.deadline ? formatDate(p.deadline) : 'N/A',
                'Progress': `${p.progress}%`,
              });
            });
          });
          data = teamData;
          filename = 'projects_by_team';
          break;

        case 'priority':
          // Sort by priority
          const priorityOrder = { critical: 1, high: 2, medium: 3, low: 4 };
          const sortedProjects = [...projects].sort(
            (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
          );
          data = sortedProjects.map(p => ({
            'Priority': p.priority.toUpperCase(),
            'Project Name': p.project_name,
            'Stage': p.stage,
            'Status': p.status,
            'Team': p.team_name || 'Unassigned',
            'Deadline': p.deadline ? formatDate(p.deadline) : 'N/A',
            'Criticality': p.criticality,
            'Progress': `${p.progress}%`,
          }));
          filename = 'projects_by_priority';
          break;

        case 'weekly':
          // Projects due this week
          const today = new Date();
          const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          const weeklyProjects = projects.filter(p => {
            if (!p.deadline) return false;
            const deadline = new Date(p.deadline);
            return deadline >= today && deadline <= weekEnd;
          });
          data = weeklyProjects.map(p => ({
            'Project Name': p.project_name,
            'Deadline': p.deadline ? formatDate(p.deadline) : 'N/A',
            'Days Left': p.remaining_days ?? 0,
            'Priority': p.priority.toUpperCase(),
            'Stage': p.stage,
            'Status': p.status,
            'Team': p.team_name || 'Unassigned',
            'Progress': `${p.progress}%`,
          }));
          filename = 'weekly_submissions';
          break;
      }

      if (data.length === 0) {
        toast.error('No data to export');
        return;
      }

      await exportToExcel(data, filename, 'Projects');
      toast.success('Export successful!');
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const exportOptions = [
    {
      type: 'all' as const,
      icon: FileSpreadsheet,
      title: 'Export All Projects',
      description: 'Download complete project data',
    },
    {
      type: 'team' as const,
      icon: Users,
      title: 'Export by Team',
      description: 'Group projects by assigned team',
    },
    {
      type: 'priority' as const,
      icon: AlertTriangle,
      title: 'Export by Priority',
      description: 'Sort projects by priority level',
    },
    {
      type: 'weekly' as const,
      icon: Calendar,
      title: 'Weekly Submissions',
      description: 'Projects due this week',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">📥 Export Data</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Export Options */}
            <div className="space-y-3">
              {exportOptions.map((option) => (
                <button
                  key={option.type}
                  onClick={() => handleExport(option.type)}
                  className="w-full flex items-center gap-4 p-4 bg-tangent-blue/5 border border-dark-border rounded-xl hover:border-tangent-blue/30 hover:bg-tangent-blue/10 transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-gradient-tangent rounded-xl flex items-center justify-center">
                    <option.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-tangent-blue transition-colors">
                      {option.title}
                    </p>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
