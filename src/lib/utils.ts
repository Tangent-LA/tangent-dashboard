import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

// Stage configuration
export const stageConfig: Record<string, { label: string; color: string; order: number }> = {
  sd_design: { label: 'SD Design', color: '#8B5CF6', order: 1 },
  dd_design: { label: 'DD Design', color: '#3B82F6', order: 2 },
  ifc: { label: 'IFC', color: '#10B981', order: 3 },
  bim_submission: { label: 'BIM Submission', color: '#F59E0B', order: 4 },
  revised_dd: { label: 'Revised DD', color: '#EC4899', order: 5 },
  construction: { label: 'Construction', color: '#06B6D4', order: 6 },
};

// Priority configuration
export const priorityConfig: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critical', color: '#EF4444' },
  high: { label: 'High', color: '#F59E0B' },
  medium: { label: 'Medium', color: '#3B82F6' },
  low: { label: 'Low', color: '#10B981' },
};

// Status configuration
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
