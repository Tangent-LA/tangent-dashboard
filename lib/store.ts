import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  display_name: string;
  role: string;
  team_name?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
    }),
    {
      name: 'auth-storage',
    }
  )
);

// API configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://141.145.153.32:5000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'Tangent@2026';

// API helper functions
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token = useAuthStore.getState().token;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = '/auth/login';
    throw new Error('Unauthorized');
  }

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (email: string, password: string, display_name: string) => {
    return apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, display_name }),
    });
  },

  forgotPassword: async (email: string) => {
    return apiRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token: string, new_password: string) => {
    return apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password }),
    });
  },

  changePassword: async (current_password: string, new_password: string) => {
    return apiRequest('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password }),
    });
  },

  me: async () => {
    return apiRequest('/api/auth/me');
  },
};

// Projects API
export const projectsAPI = {
  list: async () => apiRequest('/api/projects'),
  
  get: async (id: string) => apiRequest(`/api/projects/${id}`),
  
  create: async (data: any) => apiRequest('/api/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: async (id: string, data: any) => apiRequest(`/api/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: async (id: string) => apiRequest(`/api/projects/${id}`, {
    method: 'DELETE',
  }),

  addRevitFile: async (projectId: string, data: any) => 
    apiRequest(`/api/projects/${projectId}/revit-files`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removeRevitFile: async (mappingId: string) =>
    apiRequest(`/api/revit-files/${mappingId}`, { method: 'DELETE' }),
};

// Teams API
export const teamsAPI = {
  list: async () => apiRequest('/api/teams'),
};

// Activity API
export const activityAPI = {
  sessions: async () => apiRequest('/api/sessions'),
  today: async () => apiRequest('/api/activity/today'),
  range: async (start: string, end: string, userId?: string) => {
    const params = new URLSearchParams({ start, end });
    if (userId) params.append('user_id', userId);
    return apiRequest(`/api/activity/range?${params}`);
  },
  calls: async (date?: string) => {
    const params = date ? `?date=${date}` : '';
    return apiRequest(`/api/calls${params}`);
  },
};

// Admin API
export const adminAPI = {
  users: async () => apiRequest('/api/admin/users'),
  stats: async () => apiRequest('/api/admin/stats'),
  emailUsage: async () => apiRequest('/api/admin/email-usage'),
};

// Export API
export const exportAPI = {
  csv: (date: string, type: 'daily' | 'weekly' | 'monthly' = 'daily') => {
    window.open(`${API_BASE}/api/export/csv?date=${date}&type=${type}`, '_blank');
  },
};
