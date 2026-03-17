# Tangent Dashboard V3 - Enterprise Edition

A premium, enterprise-grade project management dashboard for **Tangent Landscape Architecture**.

![Tangent Logo](public/tangent-logo.png)

## 🚀 Features

### Dashboard Intelligence
- **KPI Cards** - Total projects, active, overdue, tasks, deliverables
- **Projects by Stage** - Interactive bar chart with click-to-filter
- **Priority Distribution** - Pie chart with drill-down
- **Team Workload Analysis** - Capacity utilization with visual alerts
- **Timeline View** - Gantt-style project timeline
- **Deadline Alerts** - Upcoming deadlines with risk indicators

### Project Management
- **Grid View** - Card-based project overview
- **List View** - Tabular data with sorting
- **Kanban Board** - Drag projects between stages
- **Gantt Chart** - Visual timeline with milestones
- **Advanced Filters** - By stage, status, priority, team, deadline
- **Quick Search** - Instant project search
- **Modal Forms** - Clean add/edit UX (no scrolling!)

### Team Management
- **Workload Intelligence** - Overloaded/balanced/available status
- **Capacity Metrics** - % utilization per team member
- **Member Management** - Add/remove team members
- **Team Analytics** - Projects, overdue, critical counts

### Task Management
- **Kanban Board** - To Do, In Progress, Review, Done
- **List View** - Full task details
- **Filters** - By project, priority, assignee
- **Due Date Tracking** - Overdue indicators

### BIM Deliverables
- **Submission Tracking** - Status workflow
- **Revision Control** - Version tracking
- **Deadline Management** - Due date alerts

### Calendar
- **Monthly View** - Visual calendar with events
- **Event Types** - Projects, tasks, deliverables
- **Quick Filters** - Filter by type
- **Upcoming Section** - Next 7 days preview

### Reports & Analytics
- **KPI Overview** - Key metrics at a glance
- **Stage Distribution** - Bar charts
- **Team Performance** - Workload breakdown
- **Priority Analysis** - Distribution charts
- **Performance Rings** - Completion rate, progress, health score

### Activity Log
- **Audit Trail** - All changes tracked
- **User Actions** - Who did what, when
- **Filters** - By entity type, action type
- **Timeline View** - Grouped by date

### Admin Panel
- **User Management** - Add, edit, activate/deactivate users
- **Role Permissions** - Admin, Manager, BIM Coordinator, Member, Viewer
- **System Settings** - Database, email, notifications
- **Profile Settings** - Personal info, password change

### Automation
- **Workflow Rules** - Trigger-action automation
- **Templates** - Quick setup for common workflows
- **Notification Rules** - Email and in-app alerts
- **Status Tracking** - Run history and counts

### Excel Export
- **Full Report** - All data with summary
- **By Team** - Team-specific exports
- **By Deadline** - Upcoming deadlines
- **Multi-Sheet** - Summary, Projects, Teams, Deadlines
- **Professional Formatting** - Styled headers, borders, conditional formatting
- **Charts** - Status breakdown visualization

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (for database)

### Steps

1. **Extract the package** to your project folder:
```bash
# Copy all files to your existing tangent-dashboard folder
# Or create a new project
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment** - Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://fcbwhtdlktqjvfbgiflp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjYndodGRsa3RxanZmYmdpZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjAxNDIsImV4cCI6MjA4ODczNjE0Mn0.PmEwHyWEDAYG4mhZxu6-WQ3bS8TSg72xOpin-qRcKnw
```

4. **Run development server**:
```bash
npm run dev
```

5. **Open in browser**:
```
http://localhost:3000/dashboard
```

---

## 📁 File Structure

```
src/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx           # Main dashboard
│   │   ├── layout.tsx         # Dashboard layout
│   │   └── DashboardLayoutClient.tsx  # Sidebar + header
│   ├── projects/
│   │   ├── page.tsx           # Projects (Grid/List/Kanban/Gantt)
│   │   └── layout.tsx
│   ├── teams/
│   │   ├── page.tsx           # Team management
│   │   └── layout.tsx
│   ├── tasks/
│   │   ├── page.tsx           # Task management
│   │   └── layout.tsx
│   ├── calendar/
│   │   ├── page.tsx           # Calendar view
│   │   └── layout.tsx
│   ├── bim/
│   │   ├── page.tsx           # BIM deliverables
│   │   └── layout.tsx
│   ├── automation/
│   │   ├── page.tsx           # Automation rules
│   │   └── layout.tsx
│   ├── reports/
│   │   ├── page.tsx           # Reports & analytics
│   │   └── layout.tsx
│   ├── activity/
│   │   ├── page.tsx           # Activity log
│   │   └── layout.tsx
│   ├── admin/
│   │   ├── page.tsx           # Admin panel
│   │   └── layout.tsx
│   └── globals.css            # Premium styling
├── lib/
│   ├── utils.ts               # Utility functions
│   └── excel-export.ts        # Excel export logic
└── public/
    └── tangent-logo.png       # Company logo
```

---

## 🎨 Branding

- **Primary Color**: `#00AEEF` (Tangent Cyan)
- **Background**: Dark theme (`#0a0a0f`)
- **Cards**: Glassmorphism with subtle borders
- **Typography**: Clean, professional hierarchy

---

## 🔧 Configuration

### Stage Configuration
Edit `src/lib/utils.ts` to customize project stages:
```typescript
export const stageConfig = {
  sd_design: { label: 'SD Design', color: '#8B5CF6', order: 1 },
  dd_design: { label: 'DD Design', color: '#3B82F6', order: 2 },
  // ... add more stages
};
```

### Priority Levels
```typescript
export const priorityConfig = {
  critical: { label: 'Critical', color: '#EF4444' },
  high: { label: 'High', color: '#F59E0B' },
  medium: { label: 'Medium', color: '#3B82F6' },
  low: { label: 'Low', color: '#10B981' },
};
```

---

## 📊 Database Schema

The dashboard expects these Supabase tables:
- `projects` - Project data
- `teams` - Team information
- `profiles` - User profiles
- `tasks` - Task management
- `bim_deliverables` - BIM submissions

See the SQL schema file for complete table structure.

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Self-hosted
```bash
npm run build
npm start
```

---

## 📝 License

Proprietary - Tangent Landscape Architecture

---

## 🆘 Support

For issues or feature requests, contact the BIM team.

---

**Version 3.0.0** | Built with ❤️ for Tangent LA
