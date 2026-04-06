import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database tables
export interface User {
  id: string;
  email: string;
  display_name: string;
  role: 'admin' | 'team_leader' | 'user';
  team_id: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  leader_id: string | null;
  color: string;
  member_count?: number;
  active_projects?: number;
}

export interface Project {
  id: string;
  project_code: string;
  project_name: string;
  client_name: string | null;
  description: string | null;
  team_id: string | null;
  team_leader_id: string | null;
  status: 'active' | 'on_hold' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  budget_hours: number;
  start_date: string | null;
  submission_date: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  team_name?: string;
  leader_name?: string;
  total_hours?: number;
  active_users?: number;
  revit_files_count?: number;
}

export interface RevitFileMapping {
  id: string;
  project_id: string;
  revit_filename: string;
  revit_pattern: string | null;
  description: string | null;
  created_at: string;
}

export interface ActivitySession {
  id: string;
  user_id: string | null;
  machine_name: string;
  windows_user: string;
  autodesk_email: string | null;
  is_logged_in: boolean;
  activity_state: 'active' | 'idle' | 'meeting' | 'offline';
  idle_seconds: number;
  revit_session_count: number;
  current_project: string | null;
  revit_version: string | null;
  is_in_meeting: boolean;
  meeting_app: string | null;
  last_update: string;
  // Joined fields
  display_name?: string;
  team_name?: string;
}

export interface DailyActivity {
  id: string;
  user_id: string;
  machine_name: string;
  date: string;
  revit_hours: number;
  meeting_hours: number;
  idle_hours: number;
  other_hours: number;
  overtime_hours: number;
  total_hours: number;
  first_activity: string | null;
  last_activity: string | null;
  hourly_breakdown: any[];
  // Joined fields
  display_name?: string;
  team_name?: string;
}

export interface TeamsCall {
  id: string;
  user_id: string | null;
  machine_name: string | null;
  call_type: 'incoming' | 'outgoing';
  caller_name: string | null;
  caller_email: string | null;
  receiver_name: string | null;
  receiver_email: string | null;
  start_time: string;
  end_time: string | null;
  duration_seconds: number;
  status: 'completed' | 'missed' | 'declined';
}

export interface KanbanColumn {
  id: string;
  name: string;
  position: number;
  color: string;
}

export interface KanbanCard {
  id: string;
  project_id: string;
  column_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  position: number;
}
