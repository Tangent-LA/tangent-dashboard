import { clsx, type ClassValue } from 'clsx';
import { format, differenceInDays, parseISO } from 'date-fns';
import type { Project, ProjectPriority, ProjectStatus, DashboardStats } from '@/types';

// Class name utility
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Date formatting
export function formatDate(date: string | Date | null): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy');
}

export function formatDateTime(date: string | Date | null): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy, HH:mm');
}

// Calculate remaining days
export function getRemainingDays(deadline: string | null): number {
  if (!deadline) return 0;
  return differenceInDays(parseISO(deadline), new Date());
}

// Get deadline status
export function getDeadlineStatus(deadline: string | null, status: ProjectStatus): 'overdue' | 'urgent' | 'warning' | 'normal' {
  if (!deadline || status === 'DONE') return 'normal';
  const days = getRemainingDays(deadline);
  if (days < 0) return 'overdue';
  if (days <= 3) return 'urgent';
  if (days <= 7) return 'warning';
  return 'normal';
}

// Priority colors
export const priorityColors: Record<ProjectPriority, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-500/15', text: 'text-red-500', border: 'border-red-500/30' },
  high: { bg: 'bg-orange-500/15', text: 'text-orange-500', border: 'border-orange-500/30' },
  medium: { bg: 'bg-yellow-500/15', text: 'text-yellow-500', border: 'border-yellow-500/30' },
  low: { bg: 'bg-green-500/15', text: 'text-green-500', border: 'border-green-500/30' },
};

// Status colors
export const statusColors: Record<ProjectStatus, { bg: string; text: string; border: string }> = {
  'IN PROGRESS': { bg: 'bg-tangent-blue/15', text: 'text-tangent-blue', border: 'border-tangent-blue/30' },
  'DONE': { bg: 'bg-green-500/15', text: 'text-green-500', border: 'border-green-500/30' },
  'TBC': { bg: 'bg-yellow-500/15', text: 'text-yellow-500', border: 'border-yellow-500/30' },
  'ON HOLD': { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30' },
};

// Deadline status colors
export const deadlineColors = {
  overdue: { bg: 'bg-red-500/15', text: 'text-red-500' },
  urgent: { bg: 'bg-orange-500/15', text: 'text-orange-500' },
  warning: { bg: 'bg-yellow-500/15', text: 'text-yellow-500' },
  normal: { bg: 'bg-green-500/15', text: 'text-green-500' },
};

// Progress bar color
export function getProgressColor(progress: number): string {
  if (progress >= 75) return 'bg-green-500';
  if (progress >= 50) return 'bg-tangent-blue';
  if (progress >= 25) return 'bg-yellow-500';
  return 'bg-red-500';
}

// Calculate dashboard statistics
export function calculateStats(projects: Project[]): DashboardStats {
  const now = new Date();
  
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === 'DONE').length;
  const inProgressProjects = projects.filter(p => p.status === 'IN PROGRESS').length;
  const overdueProjects = projects.filter(p => {
    if (!p.deadline || p.status === 'DONE') return false;
    return new Date(p.deadline) < now;
  }).length;
  
  // Projects by stage
  const projectsByStage: Record<string, number> = {};
  projects.forEach(p => {
    projectsByStage[p.stage] = (projectsByStage[p.stage] || 0) + 1;
  });
  
  // Projects by priority
  const projectsByPriority: Record<string, number> = {};
  projects.forEach(p => {
    projectsByPriority[p.priority] = (projectsByPriority[p.priority] || 0) + 1;
  });
  
  // Projects by status
  const projectsByStatus: Record<string, number> = {};
  projects.forEach(p => {
    projectsByStatus[p.status] = (projectsByStatus[p.status] || 0) + 1;
  });
  
  // Weekly submissions (last 4 weeks)
  const weeklySubmissions: { week: string; count: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - (i * 7));
    
    const count = projects.filter(p => {
      if (!p.deadline) return false;
      const deadline = new Date(p.deadline);
      return deadline >= weekStart && deadline < weekEnd;
    }).length;
    
    weeklySubmissions.push({
      week: `Week ${4 - i}`,
      count,
    });
  }
  
  return {
    totalProjects,
    completedProjects,
    inProgressProjects,
    overdueProjects,
    projectsByStage,
    projectsByPriority,
    projectsByStatus,
    weeklySubmissions,
  };
}

// Filter projects
export function filterProjects(
  projects: Project[],
  filters: {
    search?: string;
    stage?: string;
    priority?: string;
    status?: string;
    team?: string;
  }
): Project[] {
  return projects.filter(project => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        project.project_name.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower) ||
        project.team_name?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    
    // Stage filter
    if (filters.stage && filters.stage !== 'all' && project.stage !== filters.stage) {
      return false;
    }
    
    // Priority filter
    if (filters.priority && filters.priority !== 'all' && project.priority !== filters.priority) {
      return false;
    }
    
    // Status filter
    if (filters.status && filters.status !== 'all' && project.status !== filters.status) {
      return false;
    }
    
    // Team filter
    if (filters.team && filters.team !== 'all' && project.team_id !== filters.team) {
      return false;
    }
    
    return true;
  });
}

// Export to Excel
export async function exportToExcel(
  data: any[],
  filename: string,
  sheetName: string = 'Sheet1'
) {
  const XLSX = await import('xlsx');
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Generate filename with date
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  XLSX.writeFile(workbook, `${filename}_${dateStr}.xlsx`);
}

// Prepare project data for export
export function prepareProjectsForExport(projects: Project[]) {
  return projects.map(p => ({
    'Project Name': p.project_name,
    'Description': p.description || '',
    'Stage': p.stage,
    'Priority': p.priority.toUpperCase(),
    'Status': p.status,
    'Team': p.team_name || 'Unassigned',
    'Team Lead': p.team_lead || 'N/A',
    'Deadline': p.deadline ? formatDate(p.deadline) : 'N/A',
    'Remaining Days': p.remaining_days ?? getRemainingDays(p.deadline),
    'Progress': `${p.progress}%`,
    'Criticality': p.criticality,
    'Created': formatDate(p.created_at),
  }));
}

// Generate random color for avatars
export function getAvatarColor(name: string): string {
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// Get initials from name
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
