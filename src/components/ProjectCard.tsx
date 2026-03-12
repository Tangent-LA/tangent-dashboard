'use client';

import { Calendar, Users, TrendingUp } from 'lucide-react';
import { cn, formatDate, getRemainingDays, getDeadlineStatus, priorityColors, statusColors, deadlineColors, getProgressColor } from '@/lib/utils';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const deadlineStatus = getDeadlineStatus(project.deadline, project.status);
  const daysRemaining = project.remaining_days ?? getRemainingDays(project.deadline);
  const priorityStyle = priorityColors[project.priority];
  const statusStyle = statusColors[project.status];
  const deadlineStyle = deadlineColors[deadlineStatus];

  return (
    <div
      onClick={onClick}
      className="glass-card p-6 cursor-pointer hover:-translate-y-1 hover:shadow-glow transition-all duration-300 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate group-hover:text-tangent-blue transition-colors">
            {project.project_name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{project.stage}</p>
        </div>
        <span className={cn(
          'badge border ml-2 flex-shrink-0',
          priorityStyle.bg,
          priorityStyle.text,
          priorityStyle.border
        )}>
          {project.priority}
        </span>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-sm text-gray-400 line-clamp-2 mb-4">
          {project.description}
        </p>
      )}

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">Progress</span>
          <span className="font-medium">{project.progress}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className={cn('progress-bar-fill', getProgressColor(project.progress))}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Meta Info */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-gray-400 truncate">{project.team_lead || 'Unassigned'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-gray-400">{formatDate(project.deadline)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-dark-border">
        <span className={cn(
          'badge border',
          statusStyle.bg,
          statusStyle.text,
          statusStyle.border
        )}>
          {project.status}
        </span>
        <span className={cn(
          'text-sm font-medium',
          deadlineStyle.text
        )}>
          {deadlineStatus === 'overdue' 
            ? `${Math.abs(daysRemaining)} days overdue`
            : `${daysRemaining} days left`
          }
        </span>
      </div>
    </div>
  );
}
