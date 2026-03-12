// src/lib/store.ts - TANGENT DASHBOARD V3.0
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  ProjectWithDetails,
  TaskWithDetails,
  Team,
  Notification,
  TaskFilters,
  ViewType,
  DashboardWidget,
} from '@/types';

// =====================================================
// STORE STATE INTERFACE
// =====================================================

interface StoreState {
  // User & Auth
  user: User | null;
  isAuthenticated: boolean;
  
  // Data
  projects: ProjectWithDetails[];
  tasks: TaskWithDetails[];
  teams: Team[];
  notifications: Notification[];
  unreadNotificationCount: number;
  
  // UI State
  currentView: ViewType;
  selectedTasks: string[];
  filters: TaskFilters;
  theme: 'dark' | 'light';
  sidebarCollapsed: boolean;
  isLoading: boolean;
  
  // Dashboard
  dashboardWidgets: DashboardWidget[];
  
  // Actions - User
  setUser: (user: User | null) => void;
  logout: () => void;
  
  // Actions - Projects
  setProjects: (projects: ProjectWithDetails[]) => void;
  addProject: (project: ProjectWithDetails) => void;
  updateProject: (id: string, updates: Partial<ProjectWithDetails>) => void;
  deleteProject: (id: string) => void;
  
  // Actions - Tasks
  setTasks: (tasks: TaskWithDetails[]) => void;
  addTask: (task: TaskWithDetails) => void;
  updateTask: (id: string, updates: Partial<TaskWithDetails>) => void;
  deleteTask: (id: string) => void;
  bulkUpdateTasks: (ids: string[], updates: Partial<TaskWithDetails>) => void;
  reorderTasks: (taskId: string, newColumn: string, newIndex: number) => void;
  
  // Actions - Teams
  setTeams: (teams: Team[]) => void;
  addTeam: (team: Team) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
  
  // Actions - Notifications
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  
  // Actions - UI
  setCurrentView: (view: ViewType) => void;
  setSelectedTasks: (ids: string[]) => void;
  toggleTaskSelection: (id: string) => void;
  clearTaskSelection: () => void;
  setFilters: (filters: TaskFilters) => void;
  clearFilters: () => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setLoading: (loading: boolean) => void;
  
  // Actions - Dashboard
  setDashboardWidgets: (widgets: DashboardWidget[]) => void;
  updateWidgetPosition: (widgetId: string, position: { x: number; y: number; w: number; h: number }) => void;
}

// =====================================================
// DEFAULT VALUES
// =====================================================

const defaultFilters: TaskFilters = {};

const defaultWidgets: DashboardWidget[] = [
  {
    id: 'active-projects',
    type: 'active-projects',
    title: 'Active Projects',
    config: {},
    position: { x: 0, y: 0, w: 3, h: 2 }
  },
  {
    id: 'pending-tasks',
    type: 'pending-tasks',
    title: 'Pending Tasks',
    config: {},
    position: { x: 3, y: 0, w: 3, h: 2 }
  },
  {
    id: 'overdue-items',
    type: 'overdue-items',
    title: 'Overdue Items',
    config: {},
    position: { x: 6, y: 0, w: 3, h: 2 }
  },
  {
    id: 'team-workload',
    type: 'team-workload',
    title: 'Team Workload',
    config: {},
    position: { x: 9, y: 0, w: 3, h: 2 }
  },
  {
    id: 'weekly-trend',
    type: 'weekly-trend',
    title: 'Weekly Trend',
    config: {},
    position: { x: 0, y: 2, w: 6, h: 3 }
  },
  {
    id: 'submission-calendar',
    type: 'submission-calendar',
    title: 'Upcoming Deadlines',
    config: {},
    position: { x: 6, y: 2, w: 6, h: 3 }
  }
];

// =====================================================
// STORE IMPLEMENTATION
// =====================================================

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      isAuthenticated: false,
      projects: [],
      tasks: [],
      teams: [],
      notifications: [],
      unreadNotificationCount: 0,
      currentView: 'kanban',
      selectedTasks: [],
      filters: defaultFilters,
      theme: 'dark',
      sidebarCollapsed: false,
      isLoading: false,
      dashboardWidgets: defaultWidgets,

      // User Actions
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
      
      logout: () => set({ 
        user: null, 
        isAuthenticated: false,
        projects: [],
        tasks: [],
        teams: [],
        notifications: [],
        selectedTasks: [],
        filters: defaultFilters
      }),

      // Project Actions
      setProjects: (projects) => set({ projects }),
      
      addProject: (project) => set((state) => ({ 
        projects: [project, ...state.projects] 
      })),
      
      updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        )
      })),
      
      deleteProject: (id) => set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        tasks: state.tasks.filter((t) => t.project_id !== id)
      })),

      // Task Actions
      setTasks: (tasks) => set({ tasks }),
      
      addTask: (task) => set((state) => ({ 
        tasks: [task, ...state.tasks] 
      })),
      
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        )
      })),
      
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        selectedTasks: state.selectedTasks.filter((taskId) => taskId !== id)
      })),
      
      bulkUpdateTasks: (ids, updates) => set((state) => ({
        tasks: state.tasks.map((t) =>
          ids.includes(t.id) ? { ...t, ...updates } : t
        ),
        selectedTasks: []
      })),
      
      reorderTasks: (taskId, newColumn, newIndex) => set((state) => {
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return state;
        
        // Update the task's column and sort order
        const updatedTasks = state.tasks.map((t) => {
          if (t.id === taskId) {
            return { ...t, kanban_column: newColumn, sort_order: newIndex };
          }
          return t;
        });
        
        return { tasks: updatedTasks };
      }),

      // Team Actions
      setTeams: (teams) => set({ teams }),
      
      addTeam: (team) => set((state) => ({ 
        teams: [...state.teams, team] 
      })),
      
      updateTeam: (id, updates) => set((state) => ({
        teams: state.teams.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        )
      })),
      
      deleteTeam: (id) => set((state) => ({
        teams: state.teams.filter((t) => t.id !== id)
      })),

      // Notification Actions
      setNotifications: (notifications) => set({ 
        notifications,
        unreadNotificationCount: notifications.filter((n) => !n.is_read).length
      }),
      
      addNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadNotificationCount: state.unreadNotificationCount + (notification.is_read ? 0 : 1)
      })),
      
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        ),
        unreadNotificationCount: Math.max(0, state.unreadNotificationCount - 1)
      })),
      
      markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          is_read: true,
          read_at: n.read_at || new Date().toISOString()
        })),
        unreadNotificationCount: 0
      })),

      // UI Actions
      setCurrentView: (view) => set({ currentView: view }),
      
      setSelectedTasks: (ids) => set({ selectedTasks: ids }),
      
      toggleTaskSelection: (id) => set((state) => ({
        selectedTasks: state.selectedTasks.includes(id)
          ? state.selectedTasks.filter((taskId) => taskId !== id)
          : [...state.selectedTasks, id]
      })),
      
      clearTaskSelection: () => set({ selectedTasks: [] }),
      
      setFilters: (filters) => set({ filters }),
      
      clearFilters: () => set({ filters: defaultFilters }),
      
      toggleTheme: () => set((state) => ({
        theme: state.theme === 'dark' ? 'light' : 'dark'
      })),
      
      toggleSidebar: () => set((state) => ({
        sidebarCollapsed: !state.sidebarCollapsed
      })),
      
      setLoading: (isLoading) => set({ isLoading }),

      // Dashboard Actions
      setDashboardWidgets: (widgets) => set({ dashboardWidgets: widgets }),
      
      updateWidgetPosition: (widgetId, position) => set((state) => ({
        dashboardWidgets: state.dashboardWidgets.map((w) =>
          w.id === widgetId ? { ...w, position } : w
        )
      })),
    }),
    {
      name: 'tangent-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        currentView: state.currentView,
        dashboardWidgets: state.dashboardWidgets,
      }),
    }
  )
);

// =====================================================
// SELECTOR HOOKS
// =====================================================

// Get tasks filtered by current filters
export const useFilteredTasks = () => {
  const tasks = useStore((state) => state.tasks);
  const filters = useStore((state) => state.filters);
  
  return tasks.filter((task) => {
    // Status filter
    if (filters.status?.length && !filters.status.includes(task.status)) {
      return false;
    }
    
    // Priority filter
    if (filters.priority?.length && !filters.priority.includes(task.priority)) {
      return false;
    }
    
    // Project filter
    if (filters.project_id && task.project_id !== filters.project_id) {
      return false;
    }
    
    // Team filter
    if (filters.team_id && task.team_id !== filters.team_id) {
      return false;
    }
    
    // Discipline filter
    if (filters.discipline?.length && task.discipline && !filters.discipline.includes(task.discipline)) {
      return false;
    }
    
    // Assignee filter
    if (filters.assignee_ids?.length) {
      const hasAssignee = filters.assignee_ids.some((id) => 
        task.assignee_ids?.includes(id)
      );
      if (!hasAssignee) return false;
    }
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(searchLower);
      const matchesDescription = task.description?.toLowerCase().includes(searchLower);
      if (!matchesTitle && !matchesDescription) return false;
    }
    
    // Tags filter
    if (filters.tags?.length) {
      const hasTags = filters.tags.some((tag) => task.tags?.includes(tag));
      if (!hasTags) return false;
    }
    
    // Milestone filter
    if (filters.is_milestone !== undefined && task.is_milestone !== filters.is_milestone) {
      return false;
    }
    
    // Due date range filter
    if (filters.due_date_range && task.due_date) {
      const dueDate = new Date(task.due_date);
      const start = new Date(filters.due_date_range.start);
      const end = new Date(filters.due_date_range.end);
      if (dueDate < start || dueDate > end) return false;
    }
    
    return true;
  });
};

// Get tasks grouped by kanban column
export const useKanbanTasks = () => {
  const filteredTasks = useFilteredTasks();
  
  const columns = {
    todo: filteredTasks.filter((t) => t.status === 'todo'),
    in_progress: filteredTasks.filter((t) => t.status === 'in_progress'),
    in_review: filteredTasks.filter((t) => t.status === 'in_review'),
    blocked: filteredTasks.filter((t) => t.status === 'blocked'),
    done: filteredTasks.filter((t) => t.status === 'done'),
  };
  
  // Sort each column by sort_order
  Object.keys(columns).forEach((key) => {
    columns[key as keyof typeof columns].sort((a, b) => a.sort_order - b.sort_order);
  });
  
  return columns;
};

// Get overdue tasks
export const useOverdueTasks = () => {
  const tasks = useStore((state) => state.tasks);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return tasks.filter((task) => {
    if (task.status === 'done' || task.status === 'archived') return false;
    if (!task.due_date) return false;
    return new Date(task.due_date) < today;
  });
};

// Get user's assigned tasks
export const useMyTasks = () => {
  const tasks = useStore((state) => state.tasks);
  const user = useStore((state) => state.user);
  
  if (!user) return [];
  
  return tasks.filter((task) => 
    task.assignee_ids?.includes(user.id) && 
    task.status !== 'done' && 
    task.status !== 'archived'
  );
};

// Get project by ID
export const useProject = (id: string) => {
  return useStore((state) => state.projects.find((p) => p.id === id));
};

// Get team by ID
export const useTeam = (id: string) => {
  return useStore((state) => state.teams.find((t) => t.id === id));
};
