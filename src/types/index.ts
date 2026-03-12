// =====================================================
// TANGENT DASHBOARD V3.0 - TYPESCRIPT TYPES
// =====================================================

// =====================================================
// ENUMS
// =====================================================

export type UserRole = 'admin' | 'manager' | 'member';

export type ProjectStage = 
  | 'SD DESIGN' 
  | 'DD DESIGN' 
  | 'REVISED DD' 
  | 'TENDER DESIGN' 
  | 'TENDER ADDENDUM' 
  | 'BIM MLD SUBMISSION' 
  | 'IFC';

export type ProjectPriority = 'critical' | 'high' | 'medium' | 'low';

export type ProjectStatus = 'IN PROGRESS' | 'DONE' | 'TBC' | 'ON HOLD';

export type ProjectHealth = 'on_track' | 'delayed' | 'at_risk' | 'completed' | 'on_hold';

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'blocked' | 'done' | 'archived';

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export type UserActivityStatus = 'online' | 'active' | 'idle' | 'on_break' | 'offline' | 'locked';

export type NotificationType = 
  | 'assignment' 
  | 'mention' 
  | 'deadline' 
  | 'status_change' 
  | 'comment' 
  | 'system' 
  | 'escalation';

export type BIMStage = 
  | 'modeling' 
  | 'clash_detection' 
  | 'sheet_production' 
  | 'nwc_export' 
  | 'ifc_export' 
  | 'acc_upload' 
  | 'revision' 
  | 'submission';

export type DisciplineType = 
  | 'architecture' 
  | 'landscape' 
  | 'mep' 
  | 'structural' 
  | 'civil' 
  | 'interior' 
  | 'lighting' 
  | 'irrigation';

export type ViewType = 'kanban' | 'list' | 'timeline' | 'calendar' | 'gantt';

export type DependencyType = 
  | 'finish_to_start' 
  | 'start_to_start' 
  | 'finish_to_finish' 
  | 'start_to_finish';

export type DeadlineStatus = 'completed' | 'no_deadline' | 'overdue' | 'urgent' | 'on_track';

// =====================================================
// USER & AUTH
// =====================================================

export interface UserPreferences {
  theme: 'dark' | 'light';
  notifications: {
    email: boolean;
    inApp: boolean;
  };
  defaultView?: ViewType;
  timezone?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  team_id: string | null;
  is_active: boolean;
  phone: string | null;
  department: string | null;
  job_title: string | null;
  discipline: DisciplineType | null;
  activity_status: UserActivityStatus;
  last_active_at: string | null;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface UserWithTeam extends User {
  team?: Team;
}

// =====================================================
// TEAMS
// =====================================================

export interface Team {
  id: string;
  team_name: string;
  team_lead: string | null;
  description: string | null;
  color: string;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamWithMembers extends Team {
  members?: User[];
  project_count?: number;
  task_count?: number;
}

// =====================================================
// PROJECTS
// =====================================================

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
  health: ProjectHealth;
  start_date: string | null;
  budget: number | null;
  actual_cost: number | null;
  client_name: string | null;
  location: string | null;
  zone: string | null;
  package: string | null;
  disciplines: DisciplineType[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithDetails extends Project {
  team_name: string | null;
  team_lead: string | null;
  remaining_days: number | null;
  deadline_status: DeadlineStatus;
}

export interface ProjectProgressSummary extends Project {
  total_tasks: number;
  completed_tasks: number;
  blocked_tasks: number;
  overdue_tasks: number;
  task_completion_percentage: number;
  team_name: string | null;
  team_lead: string | null;
}

// =====================================================
// TASKS
// =====================================================

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  project_id: string | null;
  team_id: string | null;
  parent_task_id: string | null;
  created_by: string | null;
  due_date: string | null;
  start_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  progress: number;
  tags: string[];
  discipline: DisciplineType | null;
  is_milestone: boolean;
  is_recurring: boolean;
  recurrence_rule: RecurrenceRule | null;
  template_id: string | null;
  sort_order: number;
  kanban_column: string;
  completed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskWithDetails extends Task {
  project_name: string | null;
  team_name: string | null;
  creator_name: string | null;
  creator_avatar: string | null;
  subtask_count: number;
  completed_subtask_count: number;
  assignee_ids: string[];
  comment_count: number;
  attachment_count: number;
  deadline_status: DeadlineStatus;
  days_remaining: number | null;
}

export interface TaskAssignee {
  id: string;
  task_id: string;
  user_id: string;
  assigned_at: string;
  assigned_by: string | null;
  user?: User;
}

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: DependencyType;
  created_at: string;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: string;
  occurrences?: number;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string | null;
  template_data: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    estimated_hours?: number;
    subtasks?: string[];
  };
  category: string | null;
  created_by: string | null;
  is_global: boolean;
  team_id: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// COLLABORATION
// =====================================================

export interface Comment {
  id: string;
  content: string;
  task_id: string | null;
  project_id: string | null;
  parent_comment_id: string | null;
  author_id: string;
  mentions: string[];
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommentWithAuthor extends Comment {
  author?: User;
  replies?: CommentWithAuthor[];
}

export interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  task_id: string | null;
  project_id: string | null;
  comment_id: string | null;
  uploaded_by: string;
  created_at: string;
  uploader?: User;
}

// =====================================================
// NOTIFICATIONS
// =====================================================

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  task_id: string | null;
  project_id: string | null;
  comment_id: string | null;
  triggered_by: string | null;
  is_read: boolean;
  is_email_sent: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationWithDetails extends Notification {
  triggered_by_user?: User;
  task?: Task;
  project?: Project;
}

// =====================================================
// AUTOMATION
// =====================================================

export interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_conditions: Record<string, any>;
  action_type: string;
  action_data: Record<string, any>;
  project_id: string | null;
  team_id: string | null;
  is_active: boolean;
  created_by: string | null;
  run_count: number;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationLog {
  id: string;
  rule_id: string;
  trigger_data: Record<string, any> | null;
  action_result: Record<string, any> | null;
  status: 'success' | 'failed' | 'skipped';
  error_message: string | null;
  executed_at: string;
}

// =====================================================
// ACTIVITY TRACKING
// =====================================================

export interface UserActivitySession {
  id: string;
  user_id: string;
  status: UserActivityStatus;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface UserDailyActivity {
  id: string;
  user_id: string;
  activity_date: string;
  online_minutes: number;
  active_minutes: number;
  idle_minutes: number;
  break_minutes: number;
  first_activity_at: string | null;
  last_activity_at: string | null;
  tasks_completed: number;
  comments_made: number;
  created_at: string;
  updated_at: string;
}

// =====================================================
// BIM / PROJECT DELIVERY
// =====================================================

export interface BIMDeliverable {
  id: string;
  project_id: string;
  deliverable_name: string;
  description: string | null;
  stage: BIMStage;
  discipline: DisciplineType;
  zone: string | null;
  package: string | null;
  team_id: string | null;
  assigned_to: string | null;
  due_date: string | null;
  submitted_at: string | null;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'revision_required';
  revision_number: number;
  file_path: string | null;
  acc_bim360_link: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BIMDeliverableWithDetails extends BIMDeliverable {
  project_name: string | null;
  team_name: string | null;
  assignee_name: string | null;
  delivery_status: 'on_track' | 'delayed' | 'at_risk' | 'pending';
}

export interface BIMSubmission {
  id: string;
  deliverable_id: string;
  submission_date: string;
  submitted_by: string | null;
  revision_number: number;
  status: string;
  reviewer_id: string | null;
  review_date: string | null;
  review_comments: string | null;
  file_path: string | null;
  created_at: string;
}

// =====================================================
// DASHBOARD
// =====================================================

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  config: Record<string, any>;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface DashboardConfig {
  id: string;
  user_id: string;
  dashboard_type: 'personal' | 'executive' | 'manager' | 'team';
  widgets: DashboardWidget[];
  layout: Record<string, any>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// VIEWS & FILTERS
// =====================================================

export interface SavedView {
  id: string;
  user_id: string;
  name: string;
  view_type: ViewType;
  entity_type: 'tasks' | 'projects' | 'deliverables';
  filters: TaskFilters | ProjectFilters;
  columns: string[];
  sort_config: {
    field: string;
    direction: 'asc' | 'desc';
  };
  is_default: boolean;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignee_ids?: string[];
  project_id?: string;
  team_id?: string;
  discipline?: DisciplineType[];
  due_date_range?: {
    start: string;
    end: string;
  };
  tags?: string[];
  search?: string;
  is_milestone?: boolean;
  has_subtasks?: boolean;
}

export interface ProjectFilters {
  status?: ProjectStatus[];
  priority?: ProjectPriority[];
  stage?: ProjectStage[];
  health?: ProjectHealth[];
  team_id?: string;
  deadline_range?: {
    start: string;
    end: string;
  };
  search?: string;
}

// =====================================================
// TEAM WORKLOAD
// =====================================================

export interface TeamWorkload {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  activity_status: UserActivityStatus;
  team_name: string | null;
  assigned_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  pending_hours: number;
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// =====================================================
// FORM TYPES
// =====================================================

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  project_id?: string;
  team_id?: string;
  parent_task_id?: string;
  due_date?: string;
  start_date?: string;
  estimated_hours?: number;
  tags?: string[];
  discipline?: DisciplineType;
  is_milestone?: boolean;
  assignee_ids?: string[];
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  progress?: number;
  actual_hours?: number;
  kanban_column?: string;
  sort_order?: number;
}

export interface CreateCommentInput {
  content: string;
  task_id?: string;
  project_id?: string;
  parent_comment_id?: string;
  mentions?: string[];
}

export interface CreateBIMDeliverableInput {
  project_id: string;
  deliverable_name: string;
  description?: string;
  stage: BIMStage;
  discipline: DisciplineType;
  zone?: string;
  package?: string;
  team_id?: string;
  assigned_to?: string;
  due_date?: string;
}

// =====================================================
// KANBAN TYPES
// =====================================================

export interface KanbanColumn {
  id: string;
  title: string;
  status: TaskStatus;
  color: string;
  tasks: TaskWithDetails[];
}

export interface KanbanBoard {
  columns: KanbanColumn[];
  taskCount: number;
}

// =====================================================
// CALENDAR TYPES
// =====================================================

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  color?: string;
  extendedProps: {
    type: 'task' | 'milestone' | 'deadline' | 'submission';
    priority?: TaskPriority;
    status?: TaskStatus;
    project_id?: string;
  };
}

// =====================================================
// GANTT TYPES
// =====================================================

export interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies?: string;
  custom_class?: string;
}

// =====================================================
// STORE TYPES
// =====================================================

export interface StoreState {
  // User
  user: User | null;
  isAuthenticated: boolean;
  
  // Data
  projects: ProjectWithDetails[];
  tasks: TaskWithDetails[];
  teams: Team[];
  notifications: Notification[];
  
  // UI State
  currentView: ViewType;
  selectedTasks: string[];
  filters: TaskFilters;
  theme: 'dark' | 'light';
  sidebarCollapsed: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setProjects: (projects: ProjectWithDetails[]) => void;
  setTasks: (tasks: TaskWithDetails[]) => void;
  addTask: (task: TaskWithDetails) => void;
  updateTask: (id: string, updates: Partial<TaskWithDetails>) => void;
  deleteTask: (id: string) => void;
  setTeams: (teams: Team[]) => void;
  setNotifications: (notifications: Notification[]) => void;
  markNotificationRead: (id: string) => void;
  setCurrentView: (view: ViewType) => void;
  setSelectedTasks: (ids: string[]) => void;
  setFilters: (filters: TaskFilters) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  logout: () => void;
}
