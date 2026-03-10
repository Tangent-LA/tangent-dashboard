import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Project, Team, Notification, ProjectFilters } from '@/types';

interface AppState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Theme state
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  
  // Sidebar state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Projects state
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  
  // Teams state
  teams: Team[];
  setTeams: (teams: Team[]) => void;
  
  // Notifications state
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  
  // Filters state
  filters: ProjectFilters;
  setFilters: (filters: Partial<ProjectFilters>) => void;
  resetFilters: () => void;
  
  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const defaultFilters: ProjectFilters = {
  search: '',
  stage: 'all',
  priority: 'all',
  status: 'all',
  team: 'all',
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),
      
      // Theme
      theme: 'dark',
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'dark' ? 'light' : 'dark' 
      })),
      
      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      
      // Projects
      projects: [],
      setProjects: (projects) => set({ projects }),
      selectedProject: null,
      setSelectedProject: (selectedProject) => set({ selectedProject }),
      
      // Teams
      teams: [],
      setTeams: (teams) => set({ teams }),
      
      // Notifications
      notifications: [],
      setNotifications: (notifications) => set({ notifications }),
      unreadCount: 0,
      setUnreadCount: (unreadCount) => set({ unreadCount }),
      
      // Filters
      filters: defaultFilters,
      setFilters: (filters) => set((state) => ({ 
        filters: { ...state.filters, ...filters } 
      })),
      resetFilters: () => set({ filters: defaultFilters }),
      
      // Loading
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'tangent-dashboard-storage',
      partialize: (state) => ({ 
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
