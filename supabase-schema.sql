-- =====================================================
-- TANGENT PROJECT MANAGEMENT DASHBOARD
-- Supabase Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'member');
CREATE TYPE project_stage AS ENUM ('SD DESIGN', 'DD DESIGN', 'REVISED DD', 'TENDER DESIGN', 'TENDER ADDENDUM', 'BIM MLD SUBMISSION', 'IFC');
CREATE TYPE project_priority AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE project_status AS ENUM ('IN PROGRESS', 'DONE', 'TBC', 'ON HOLD');

-- =====================================================
-- TABLES
-- =====================================================

-- Teams Table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_name VARCHAR(100) NOT NULL,
    team_lead VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users/Profiles Table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role user_role DEFAULT 'member',
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    stage project_stage DEFAULT 'SD DESIGN',
    priority project_priority DEFAULT 'medium',
    criticality INTEGER DEFAULT 5 CHECK (criticality >= 1 AND criticality <= 10),
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    deadline DATE,
    status project_status DEFAULT 'IN PROGRESS',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    deadline_alert BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity Logs Table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Members Junction Table
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_projects_team_id ON projects(team_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_priority ON projects(priority);
CREATE INDEX idx_projects_stage ON projects(stage);
CREATE INDEX idx_projects_deadline ON projects(deadline);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_activity_logs_project_id ON activity_logs(project_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_team_id ON profiles(team_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to calculate remaining days
CREATE OR REPLACE FUNCTION calculate_remaining_days(deadline DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN GREATEST(0, deadline - CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification for deadline
CREATE OR REPLACE FUNCTION check_deadline_notifications()
RETURNS TRIGGER AS $$
DECLARE
    days_remaining INTEGER;
    team_member RECORD;
BEGIN
    days_remaining := NEW.deadline - CURRENT_DATE;
    
    -- Create notification if deadline is within 3 days
    IF days_remaining <= 3 AND days_remaining >= 0 AND NEW.status != 'DONE' THEN
        FOR team_member IN 
            SELECT p.id FROM profiles p 
            WHERE p.team_id = NEW.team_id
        LOOP
            INSERT INTO notifications (user_id, project_id, title, message, type, deadline_alert)
            VALUES (
                team_member.id,
                NEW.id,
                'Deadline Approaching',
                'Project "' || NEW.project_name || '" is due in ' || days_remaining || ' days',
                'warning',
                true
            )
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
    
    -- Create notification if overdue
    IF days_remaining < 0 AND NEW.status != 'DONE' THEN
        FOR team_member IN 
            SELECT p.id FROM profiles p 
            WHERE p.team_id = NEW.team_id
        LOOP
            INSERT INTO notifications (user_id, project_id, title, message, type, deadline_alert)
            VALUES (
                team_member.id,
                NEW.id,
                'Project Overdue',
                'Project "' || NEW.project_name || '" is ' || ABS(days_remaining) || ' days overdue',
                'danger',
                true
            )
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log activity
CREATE OR REPLACE FUNCTION log_project_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO activity_logs (user_id, project_id, action, details)
        VALUES (NEW.created_by, NEW.id, 'created', jsonb_build_object('project_name', NEW.project_name));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO activity_logs (user_id, project_id, action, details)
        VALUES (
            NEW.created_by, 
            NEW.id, 
            'updated',
            jsonb_build_object(
                'changes', jsonb_build_object(
                    'status', CASE WHEN OLD.status != NEW.status THEN NEW.status::text ELSE NULL END,
                    'stage', CASE WHEN OLD.stage != NEW.stage THEN NEW.stage::text ELSE NULL END,
                    'priority', CASE WHEN OLD.priority != NEW.priority THEN NEW.priority::text ELSE NULL END
                )
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'member'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Activity logging trigger
CREATE TRIGGER log_project_changes
    AFTER INSERT OR UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION log_project_activity();

-- New user trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON profiles
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can insert profiles" ON profiles
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR auth.uid() = id
    );

-- Teams policies
CREATE POLICY "Anyone can view teams" ON teams
    FOR SELECT USING (true);

CREATE POLICY "Admins and managers can insert teams" ON teams
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

CREATE POLICY "Admins and managers can update teams" ON teams
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

CREATE POLICY "Admins can delete teams" ON teams
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Projects policies
CREATE POLICY "Anyone can view projects" ON projects
    FOR SELECT USING (true);

CREATE POLICY "Admins and managers can insert projects" ON projects
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

CREATE POLICY "Admins and managers can update projects" ON projects
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

CREATE POLICY "Admins can delete projects" ON projects
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Activity logs policies
CREATE POLICY "Authenticated users can view activity logs" ON activity_logs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert activity logs" ON activity_logs
    FOR INSERT WITH CHECK (true);

-- Team members policies
CREATE POLICY "Anyone can view team members" ON team_members
    FOR SELECT USING (true);

CREATE POLICY "Admins and managers can manage team members" ON team_members
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

-- =====================================================
-- VIEWS
-- =====================================================

-- View for projects with remaining days
CREATE OR REPLACE VIEW projects_with_details AS
SELECT 
    p.*,
    t.team_name,
    t.team_lead,
    calculate_remaining_days(p.deadline) as remaining_days,
    CASE 
        WHEN p.deadline < CURRENT_DATE AND p.status != 'DONE' THEN 'overdue'
        WHEN calculate_remaining_days(p.deadline) <= 3 AND p.status != 'DONE' THEN 'urgent'
        WHEN calculate_remaining_days(p.deadline) <= 7 AND p.status != 'DONE' THEN 'warning'
        ELSE 'normal'
    END as deadline_status
FROM projects p
LEFT JOIN teams t ON p.team_id = t.id;

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert sample teams
INSERT INTO teams (id, team_name, team_lead, description) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Team 01', 'AKSHYA', 'Design Team Alpha'),
    ('22222222-2222-2222-2222-222222222222', 'Team 02', 'APARNA', 'Design Team Beta'),
    ('33333333-3333-3333-3333-333333333333', 'Team 03', 'JOVANIE', 'Design Team Gamma'),
    ('44444444-4444-4444-4444-444444444444', 'Team 04', 'ASIF', 'Design Team Delta'),
    ('55555555-5555-5555-5555-555555555555', 'Team 05', 'JESTO', 'Design Team Epsilon'),
    ('66666666-6666-6666-6666-666666666666', 'Team 06', 'SAFAS', 'Design Team Zeta');

-- Insert sample projects
INSERT INTO projects (project_name, description, stage, priority, criticality, team_id, deadline, status, progress) VALUES
    ('Plot DIB-MU-0005', 'Mixed-use development project', 'SD DESIGN', 'high', 7, '11111111-1111-1111-1111-111111111111', CURRENT_DATE + 20, 'IN PROGRESS', 65),
    ('Meraki Production City', 'Large-scale production facility', 'DD DESIGN', 'critical', 9, '11111111-1111-1111-1111-111111111111', CURRENT_DATE + 17, 'IN PROGRESS', 45),
    ('Emirates Palace Development', 'Luxury hospitality project', 'SD DESIGN', 'critical', 10, '11111111-1111-1111-1111-111111111111', CURRENT_DATE + 10, 'IN PROGRESS', 30),
    ('Avenue Development', 'Commercial retail center', 'IFC', 'medium', 5, '22222222-2222-2222-2222-222222222222', CURRENT_DATE + 13, 'DONE', 100),
    ('Dubai South Beach Front', 'Beachfront residential', 'SD DESIGN', 'low', 3, '22222222-2222-2222-2222-222222222222', CURRENT_DATE + 6, 'DONE', 100),
    ('City View Sofitel', 'Hotel landscape design', 'SD DESIGN', 'high', 7, '22222222-2222-2222-2222-222222222222', CURRENT_DATE - 4, 'IN PROGRESS', 70),
    ('Cube Al Marjan', 'Island development project', 'SD DESIGN', 'medium', 5, '33333333-3333-3333-3333-333333333333', CURRENT_DATE + 8, 'IN PROGRESS', 55),
    ('ADEC Schools Lagoons', 'Educational facility', 'DD DESIGN', 'high', 8, '33333333-3333-3333-3333-333333333333', CURRENT_DATE + 6, 'IN PROGRESS', 40),
    ('GEN AI Multaqa Business Bay', 'Smart office complex', 'DD DESIGN', 'critical', 9, '44444444-4444-4444-4444-444444444444', CURRENT_DATE + 13, 'IN PROGRESS', 25),
    ('Dubai Creek Harbour Plot A1', 'Waterfront development', 'BIM MLD SUBMISSION', 'high', 8, '44444444-4444-4444-4444-444444444444', CURRENT_DATE - 4, 'DONE', 100),
    ('Emaar DCH Plot H13', 'Residential tower landscape', 'REVISED DD', 'medium', 6, '55555555-5555-5555-5555-555555555555', CURRENT_DATE + 3, 'DONE', 100),
    ('Kifaf Residential Project', 'Luxury apartments', 'DD DESIGN', 'high', 7, '66666666-6666-6666-6666-666666666666', CURRENT_DATE + 3, 'IN PROGRESS', 60),
    ('Azizi Venice Plot 11', 'Venice-themed development', 'IFC', 'critical', 9, '66666666-6666-6666-6666-666666666666', CURRENT_DATE + 1, 'IN PROGRESS', 80),
    ('Valley Community Retail Centre', 'Community shopping center', 'DD DESIGN', 'medium', 5, '66666666-6666-6666-6666-666666666666', CURRENT_DATE + 0, 'IN PROGRESS', 50);
