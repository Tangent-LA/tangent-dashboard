import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client (for use in components)
export const supabase = createClientComponentClient();

// Server-side Supabase client (for API routes)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Database types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'admin' | 'manager' | 'member';
          team_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'manager' | 'member';
          team_id?: string | null;
          is_active?: boolean;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'manager' | 'member';
          team_id?: string | null;
          is_active?: boolean;
        };
      };
      teams: {
        Row: {
          id: string;
          team_name: string;
          team_lead: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          team_name: string;
          team_lead?: string | null;
          description?: string | null;
        };
        Update: {
          team_name?: string;
          team_lead?: string | null;
          description?: string | null;
        };
      };
      projects: {
        Row: {
          id: string;
          project_name: string;
          description: string | null;
          stage: string;
          priority: string;
          criticality: number;
          team_id: string | null;
          deadline: string | null;
          status: string;
          progress: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          project_name: string;
          description?: string | null;
          stage?: string;
          priority?: string;
          criticality?: number;
          team_id?: string | null;
          deadline?: string | null;
          status?: string;
          progress?: number;
          created_by?: string | null;
        };
        Update: {
          project_name?: string;
          description?: string | null;
          stage?: string;
          priority?: string;
          criticality?: number;
          team_id?: string | null;
          deadline?: string | null;
          status?: string;
          progress?: number;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          title: string;
          message: string;
          type: string;
          is_read: boolean;
          deadline_alert: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          project_id?: string | null;
          title: string;
          message: string;
          type?: string;
          is_read?: boolean;
          deadline_alert?: boolean;
        };
        Update: {
          is_read?: boolean;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          project_id: string;
          action: string;
          details: Record<string, any>;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          project_id: string;
          action: string;
          details?: Record<string, any>;
        };
        Update: never;
      };
    };
    Views: {
      projects_with_details: {
        Row: {
          id: string;
          project_name: string;
          description: string | null;
          stage: string;
          priority: string;
          criticality: number;
          team_id: string | null;
          deadline: string | null;
          status: string;
          progress: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          team_name: string | null;
          team_lead: string | null;
          remaining_days: number | null;
          deadline_status: string | null;
        };
      };
    };
  };
};
