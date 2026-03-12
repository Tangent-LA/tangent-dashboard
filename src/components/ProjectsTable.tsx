'use client';

import { Eye } from 'lucide-react';
import { cn, formatDate, getRemainingDays, getDeadlineStatus, priorityColors, statusColors, deadlineColors, getProgressColor } from '@/lib/utils';
import type { Project } from '@/types';

interface ProjectsTableProps {
  projects: Project[];
  onProjectClick?: (id: string) => void;
}

export function ProjectsTable({ projects, onProjectClick }: ProjectsTableProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No projects found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Stage</th>
            <th>Priority</th>
            <th>Team</th>
            <th>Deadline</th>
            <th>Progress</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const deadlineStatus = getDeadlineStatus(project.deadline, project.status);
            const daysRemaining = project.remaining_days ?? getRemainingDays(project.deadline);
            const priorityStyle = priorityColors[project.priority];
            const statusStyle = statusColors[project.status];
            const deadlineStyle = deadlineColors[deadlineStatus];

            return (
              <tr
                key={project.id}
                onClick={() => onProjectClick?.(project.id)}
              >
                {/* Project Name */}
                <td>
                  <div className="flex items-center gap-3">
                    <div 
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-white text-sm',
                        priorityStyle.bg.replace('/15', '/30')
                      )}
                      style={{ backgroundColor: project.priority === 'critical' ? 'rgba(255, 82, 82, 0.3)' : 
                               project.priority === 'high' ? 'rgba(255, 152, 0, 0.3)' :
                               project.priority === 'medium' ? 'rgba(255, 193, 7, 0.3)' : 'rgba(0, 200, 83, 0.3)' }}
                    >
                      {project.project_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-white">{project.project_name}</p>
                      <p className="text-xs text-gray-500">PRJ-{project.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                </td>

                {/* Stage */}
                <td>
                  <span className="text-sm text-gray-300">{project.stage}</span>
                </td>

                {/* Priority */}
                <td>
                  <span className={cn(
                    'badge border',
                    priorityStyle.bg,
                    priorityStyle.text,
                    priorityStyle.border
                  )}>
                    {project.priority}
                  </span>
                </td>

                {/* Team */}
                <td>
                  <span className="text-sm text-gray-300">
                    {project.team_lead || 'Unassigned'}
                  </span>
                </td>

                {/* Deadline */}
                <td>
                  <div>
                    <p className="text-sm font-medium">{formatDate(project.deadline)}</p>
                    <p className={cn('text-xs', deadlineStyle.text)}>
                      {deadlineStatus === 'overdue' 
                        ? `${Math.abs(daysRemaining)} days overdue`
                        : `${daysRemaining} days left`
                      }
                    </p>
                  </div>
                </td>

                {/* Progress */}
                <td>
                  <div className="flex items-center gap-2">
                    <div className="progress-bar w-16">
                      <div 
                        className={cn('progress-bar-fill', getProgressColor(project.progress))}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{project.progress}%</span>
                  </div>
                </td>

                {/* Status */}
                <td>
                  <span className={cn(
                    'badge border',
                    statusStyle.bg,
                    statusStyle.text,
                    statusStyle.border
                  )}>
                    {project.status}
                  </span>
                </td>

                {/* Actions */}
                <td>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onProjectClick?.(project.id);
                    }}
                    className="p-2 hover:bg-tangent-blue/10 rounded-lg transition-colors group"
                  >
                    <Eye className="w-4 h-4 text-gray-500 group-hover:text-tangent-blue" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
