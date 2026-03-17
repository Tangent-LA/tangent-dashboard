import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';
import type { Project, ProjectWithDetails } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =====================================================
// COLOR MAPPINGS (for badges/status indicators)
// =====================================================

export const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  high: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  medium: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  low: { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' },
};

export const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  'IN PROGRESS': { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  'DONE': { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' },
  'TBC': { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  'ON HOLD': { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30' },
  // Lowercase variants for compatibility
  active: { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' },
  in_progress: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  on_hold: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  completed: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  cancelled: { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30' },
};

export const deadlineColors: Record<string, { text: string }> = {
  overdue: { text: 'text-red-400' },
  urgent: { text: 'text-orange-400' },
  on_track: { text: 'text-green-400' },
  completed: { text: 'text-purple-400' },
  no_deadline: { text: 'text-gray-500' },
};

// =====================================================
// DEADLINE HELPERS
// =====================================================

export function getDeadlineStatus(
  deadline: string | null | undefined,
  status?: string
): 'overdue' | 'urgent' | 'on_track' | 'completed' | 'no_deadline' {
  if (status === 'DONE' || status === 'completed') return 'completed';
  if (!deadline) return 'no_deadline';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 7) return 'urgent';
  return 'on_track';
}

export function getRemainingDays(deadline: string | null | undefined): number {
  if (!deadline) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  
  return Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// =====================================================
// PROGRESS & AVATAR HELPERS
// =====================================================

export function getProgressColor(progress: number): string {
  if (progress >= 80) return 'bg-green-500';
  if (progress >= 50) return 'bg-blue-500';
  if (progress >= 25) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getAvatarColor(name: string | null | undefined): string {
  const colors = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-teal-500 to-green-500',
  ];
  
  if (!name) return colors[0];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

// =====================================================
// PROJECT FILTERING
// =====================================================

export interface ProjectFilters {
  search?: string;
  status?: string;
  priority?: string;
  stage?: string;
  team?: string;
  team_id?: string;
}

export function filterProjects<T extends Project | ProjectWithDetails>(
  projects: T[],
  filters: ProjectFilters
): T[] {
  return projects.filter(project => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const nameMatch = project.project_name?.toLowerCase().includes(searchLower);
      const descMatch = project.description?.toLowerCase().includes(searchLower);
      if (!nameMatch && !descMatch) return false;
    }
    
    // Status filter
    if (filters.status && filters.status !== 'all') {
      if (project.status !== filters.status) return false;
    }
    
    // Priority filter
    if (filters.priority && filters.priority !== 'all') {
      if (project.priority !== filters.priority) return false;
    }
    
    // Stage filter
    if (filters.stage && filters.stage !== 'all') {
      if (project.stage !== filters.stage) return false;
    }
    
    // Team filter
    if ((filters.team && filters.team !== 'all') || (filters.team_id && filters.team_id !== 'all')) {
      const teamFilter = filters.team || filters.team_id;
      if (project.team_id !== teamFilter) return false;
    }
    
    return true;
  });
}

// =====================================================
// DASHBOARD STATS
// =====================================================

export interface DashboardStats {
  totalProjects: number;
  completedProjects: number;
  inProgressProjects: number;
  overdueProjects: number;
  projectsByStage: Record<string, number>;
  projectsByPriority: Record<string, number>;
  weeklySubmissions: { week: string; count: number }[];
}

export function calculateStats(projects: Project[]): DashboardStats {
  const today = new Date().toISOString().split('T')[0];
  
  const stats: DashboardStats = {
    totalProjects: projects.length,
    completedProjects: projects.filter(p => p.status === 'DONE' || p.status === 'completed').length,
    inProgressProjects: projects.filter(p => p.status === 'IN PROGRESS' || p.status === 'in_progress').length,
    overdueProjects: projects.filter(p => {
      if (!p.deadline || p.status === 'DONE' || p.status === 'completed') return false;
      return p.deadline < today;
    }).length,
    projectsByStage: {},
    projectsByPriority: {},
    weeklySubmissions: [],
  };
  
  // Count by stage
  projects.forEach(p => {
    const stage = p.stage || 'Unknown';
    stats.projectsByStage[stage] = (stats.projectsByStage[stage] || 0) + 1;
  });
  
  // Count by priority
  projects.forEach(p => {
    const priority = p.priority || 'medium';
    stats.projectsByPriority[priority] = (stats.projectsByPriority[priority] || 0) + 1;
  });
  
  // Weekly submissions (last 8 weeks)
  const weeks: Record<string, number> = {};
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (i * 7));
    const weekKey = `Week ${8 - i}`;
    weeks[weekKey] = 0;
  }
  
  projects.forEach(p => {
    if (p.deadline) {
      const deadline = new Date(p.deadline);
      const now = new Date();
      const diffWeeks = Math.floor((now.getTime() - deadline.getTime()) / (7 * 24 * 60 * 60 * 1000));
      if (diffWeeks >= 0 && diffWeeks < 8) {
        const weekKey = `Week ${8 - diffWeeks}`;
        if (weeks[weekKey] !== undefined) {
          weeks[weekKey]++;
        }
      }
    }
  });
  
  stats.weeklySubmissions = Object.entries(weeks).map(([week, count]) => ({ week, count }));
  
  return stats;
}

// =====================================================
// EXCEL EXPORT (Simple version for ExportModal)
// =====================================================

export function prepareProjectsForExport(projects: Project[]): Record<string, any>[] {
  return projects.map(project => ({
    'Project Name': project.project_name || '',
    'Description': project.description || '',
    'Status': project.status || '',
    'Priority': project.priority?.toUpperCase() || '',
    'Stage': project.stage || '',
    'Deadline': project.deadline ? formatDate(project.deadline) : 'N/A',
    'Progress': `${project.progress || 0}%`,
    'Health': project.health || '',
  }));
}

export async function exportToExcel(
  data: Record<string, any>[],
  filename: string,
  sheetName: string = 'Sheet1'
): Promise<void> {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  
  // Set column widths
  const colWidths = Object.keys(data[0] || {}).map(() => ({ wch: 20 }));
  worksheet['!cols'] = colWidths;
  
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// =====================================================
// DATE & TEXT HELPERS
// =====================================================

// Format date helper
export function formatDate(date: string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '-';
  try {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...options,
    };
    return new Date(date).toLocaleDateString('en-GB', defaultOptions);
  } catch {
    return '-';
  }
}

// Get relative time
export function getRelativeTime(date: string | null): string {
  if (!date) return '';
  
  const now = new Date();
  const target = new Date(date);
  const diff = target.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `${days} days`;
  if (days <= 30) return `${Math.ceil(days / 7)} weeks`;
  return formatDate(date);
}

// Check if date is overdue
export function isOverdue(date: string | null, completedStatuses: string[] = ['completed', 'done', 'approved']): boolean {
  if (!date) return false;
  const today = new Date().toISOString().split('T')[0];
  return date < today;
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

// =====================================================
// CONFIGURATION OBJECTS
// =====================================================

// Stage configuration
export const stageConfig: Record<string, { label: string; color: string; order: number }> = {
  sd_design: { label: 'SD Design', color: '#8B5CF6', order: 1 },
  dd_design: { label: 'DD Design', color: '#3B82F6', order: 2 },
  ifc: { label: 'IFC', color: '#10B981', order: 3 },
  bim_submission: { label: 'BIM Submission', color: '#F59E0B', order: 4 },
  revised_dd: { label: 'Revised DD', color: '#EC4899', order: 5 },
  construction: { label: 'Construction', color: '#06B6D4', order: 6 },
};

// Priority configuration (hex colors for charts)
export const priorityConfig: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critical', color: '#EF4444' },
  high: { label: 'High', color: '#F59E0B' },
  medium: { label: 'Medium', color: '#3B82F6' },
  low: { label: 'Low', color: '#10B981' },
};

// Status configuration (hex colors for charts)
export const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: '#10B981' },
  in_progress: { label: 'In Progress', color: '#3B82F6' },
  on_hold: { label: 'On Hold', color: '#F59E0B' },
  completed: { label: 'Completed', color: '#8B5CF6' },
  cancelled: { label: 'Cancelled', color: '#6B7280' },
};

// Task status configuration
export const taskStatusConfig: Record<string, { label: string; color: string }> = {
  todo: { label: 'To Do', color: '#6B7280' },
  in_progress: { label: 'In Progress', color: '#3B82F6' },
  review: { label: 'In Review', color: '#F59E0B' },
  done: { label: 'Done', color: '#10B981' },
};

// =====================================================
// CAPACITY HELPERS
// =====================================================

// Calculate capacity
export function calculateCapacity(activeProjects: number, memberCount: number): number {
  if (memberCount === 0) return 0;
  return Math.round((activeProjects / memberCount) * 100);
}

// Get capacity status
export function getCapacityStatus(capacity: number): 'overloaded' | 'balanced' | 'available' {
  if (capacity > 150) return 'overloaded';
  if (capacity < 50) return 'available';
  return 'balanced';
}

// =====================================================
// SORTING & GROUPING
// =====================================================

// Sort projects by deadline
export function sortByDeadline<T extends { project_end_date?: string | null }>(items: T[], ascending = true): T[] {
  return [...items].sort((a, b) => {
    const dateA = a.project_end_date || '9999-12-31';
    const dateB = b.project_end_date || '9999-12-31';
    return ascending ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
  });
}

// Group items by key
export function groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
  return items.reduce((groups, item) => {
    const value = String(item[key]);
    if (!groups[value]) groups[value] = [];
    groups[value].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}
