import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getAvatarColor(name: string | null | undefined): string {
  const colors = [
    'from-[#00AEEF] to-[#0077a3]',
    'from-purple-500 to-violet-600',
    'from-green-500 to-emerald-600',
    'from-amber-500 to-orange-500',
    'from-red-500 to-rose-600',
    'from-pink-500 to-rose-500',
    'from-indigo-500 to-purple-600',
    'from-teal-500 to-cyan-500',
  ];
  
  if (!name) return colors[0];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

// Date formatting utilities
export function formatDate(date: string | null | undefined): string {
  if (!date) return '-';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '-';
  }
}

export function formatDateShort(date: string | null | undefined): string {
  if (!date) return '-';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '-';
  }
}

export function formatDateInput(date: string | null | undefined): string {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '-';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

export function formatRelativeTime(date: string | null | undefined): string {
  if (!date) return 'Never';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return formatDate(date);
  } catch {
    return 'Never';
  }
}

export function isOverdue(date: string | null | undefined, status?: string): boolean {
  if (!date) return false;
  if (status === 'completed' || status === 'done' || status === 'submitted' || status === 'approved') return false;
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return false;
    return d < new Date();
  } catch {
    return false;
  }
}

export function getDaysUntil(date: string | null | undefined): number | null {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

// Progress utilities
export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function getProgressColor(progress: number): string {
  if (progress >= 80) return 'from-green-500 to-emerald-500';
  if (progress >= 50) return 'from-[#00AEEF] to-cyan-500';
  if (progress >= 25) return 'from-yellow-500 to-amber-500';
  return 'from-red-500 to-rose-500';
}

// Status utilities
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-green-500',
    in_progress: 'bg-blue-500',
    on_hold: 'bg-yellow-500',
    completed: 'bg-emerald-500',
    cancelled: 'bg-red-500',
    todo: 'bg-gray-500',
    in_review: 'bg-purple-500',
    blocked: 'bg-red-500',
    done: 'bg-green-500',
    pending: 'bg-yellow-500',
    submitted: 'bg-green-500',
    approved: 'bg-emerald-500',
    rejected: 'bg-red-500',
  };
  return colors[status] || 'bg-gray-500';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    urgent: 'text-red-400 bg-red-500/15 border border-red-500/30',
    critical: 'text-red-400 bg-red-500/15 border border-red-500/30',
    high: 'text-orange-400 bg-orange-500/15 border border-orange-500/30',
    medium: 'text-yellow-400 bg-yellow-500/15 border border-yellow-500/30',
    low: 'text-green-400 bg-green-500/15 border border-green-500/30',
  };
  return colors[priority] || 'text-gray-400 bg-gray-500/15 border border-gray-500/30';
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
