// User types
export type UserRole = 'admin' | 'manager' | 'member';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  team_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Team types
export interface Team {
  id: string;
  team_name: string;
  team_lead: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  members?: User[];
}

// Project types
export type ProjectStage = 'SD DESIGN' | 'DD DESIGN' | 'REVISED DD' | 'TENDER DESIGN' | 'TENDER ADDENDUM' | 'BIM MLD SUBMISSION' | 'IFC';
export type ProjectPriority = 'critical' | 'high' | 'medium' | 'low';
export type ProjectStatus = 'IN PROGRESS' | 'DONE' | 'TBC' | 'ON HOLD';

export interface Project {
  id: string;
  project_name: string;
  description: string | null;
  stage: ProjectStage;
  priority: ProjectPriority;
  criticality: number;
  team_id: string | null;
  deadline: string | null;
  status: ProjectStatus;
  progress: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  team_name?: string;
  team_lead?: string;
  remaining_days?: number;
  deadline_status?: 'overdue' | 'urgent' | 'warning' | 'normal';
}

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  is_read: boolean;
  deadline_alert: boolean;
  created_at: string;
}

// Activity log types
export interface ActivityLog {
  id: string;
  user_id: string | null;
  project_id: string;
  action: string;
  details: Record<string, any>;
  created_at: string;
  user?: User;
}

// Chart data types
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

// Stats types
export interface DashboardStats {
  totalProjects: number;
  completedProjects: number;
  inProgressProjects: number;
  overdueProjects: number;
  projectsByStage: Record<string, number>;
  projectsByPriority: Record<string, number>;
  projectsByStatus: Record<string, number>;
  weeklySubmissions: { week: string; count: number }[];
}

// Filter types
export interface ProjectFilters {
  search: string;
  stage: ProjectStage | 'all';
  priority: ProjectPriority | 'all';
  status: ProjectStatus | 'all';
  team: string | 'all';
}

// Form types
export interface ProjectFormData {
  project_name: string;
  description: string;
  stage: ProjectStage;
  priority: ProjectPriority;
  criticality: number;
  team_id: string;
  deadline: string;
  status: ProjectStatus;
  progress: number;
}

export interface TeamFormData {
  team_name: string;
  team_lead: string;
  description: string;
}

export interface UserFormData {
  full_name: string;
  email: string;
  role: UserRole;
  team_id: string;
}
