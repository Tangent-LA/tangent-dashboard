# Tangent Project Management Dashboard

A modern, ultra-luxury, enterprise-level project management dashboard built for Tangent Landscape Architecture.

![Tangent Dashboard](./docs/preview.png)

## 🌟 Features

### Authentication System
- ✅ User Sign Up / Login / Logout
- ✅ Forgot Password / Reset Password
- ✅ Role-based Access Control (Admin, Manager, Member)
- ✅ Session Management
- ✅ Protected Routes

### Dashboard Analytics
- 📊 Interactive Bar Chart (Projects by Stage)
- 🥧 Doughnut Chart (Projects by Priority)
- 📈 Line Chart (Weekly Submissions)
- 🔢 KPI Statistics Cards
- 🖱️ Click-through Filtering

### Project Management
- 📁 Project List with Advanced Filters
- 🔍 Live Search
- 📝 Project Details Page
- ✏️ Edit Project (Admin/Manager)
- ⏱️ Deadline Countdown
- 📊 Progress Tracking
- 🏷️ Priority & Status Badges

### Team Management
- 👥 Create/Edit/Delete Teams
- 👤 Assign Team Leads
- 📋 Team Project Assignments
- 📈 Team Statistics

### Admin Panel
- 🛡️ User Management
- 🔐 Role Assignment
- ⚡ Enable/Disable Users
- 📊 System Analytics
- ➕ Add/Edit/Delete Projects

### Notifications
- 🔔 Real-time Notifications
- ⚠️ Deadline Alerts (3 days warning)
- 🚨 Overdue Project Alerts
- ✅ Mark as Read

### Export Functionality
- 📥 Export All Projects
- 👥 Export by Team
- 🎯 Export by Priority
- 📅 Export Weekly Submissions
- 📄 Excel (.xlsx) Format

### UI/UX
- 🌙 Luxury Dark Theme
- ✨ Glassmorphism Effects
- 🎨 Smooth Animations
- 📱 Fully Responsive
- 🎯 Tangent Branding

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Charts | Chart.js + react-chartjs-2 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Excel Export | SheetJS (xlsx) |
| Notifications | React Hot Toast |

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase Account

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/tangent-dashboard.git
cd tangent-dashboard
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy the Project URL and anon/public key

### 4. Configure Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Set Up Database

Run the SQL schema in Supabase SQL Editor:

```bash
# Copy contents of supabase-schema.sql and execute in Supabase SQL Editor
```

This will create:
- Tables: profiles, teams, projects, notifications, activity_logs, team_members
- Functions: update timestamps, deadline notifications, activity logging
- Triggers: automatic user profile creation, activity logging
- Row Level Security (RLS) policies
- Sample data (6 teams, 14 projects)

### 6. Run Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## 📁 Project Structure

```
tangent-dashboard/
├── src/
│   ├── app/
│   │   ├── admin/           # Admin panel
│   │   ├── dashboard/       # Main dashboard & projects
│   │   ├── forgot-password/ # Password recovery
│   │   ├── login/           # Login page
│   │   ├── projects/[id]/   # Project details
│   │   ├── reset-password/  # Password reset
│   │   ├── signup/          # Registration
│   │   ├── teams/           # Team management
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home redirect
│   ├── components/
│   │   ├── charts/          # Chart components
│   │   ├── ExportModal.tsx  # Excel export
│   │   ├── ProjectCard.tsx  # Grid view card
│   │   ├── ProjectsTable.tsx# Table component
│   │   └── Providers.tsx    # App providers
│   ├── hooks/               # Custom hooks
│   ├── lib/
│   │   ├── store.ts         # Zustand store
│   │   ├── supabase.ts      # Supabase client
│   │   └── utils.ts         # Utility functions
│   └── types/
│       └── index.ts         # TypeScript types
├── public/                  # Static assets
├── supabase-schema.sql     # Database schema
├── .env.local.example      # Environment template
├── next.config.js          # Next.js config
├── tailwind.config.ts      # Tailwind config
├── tsconfig.json           # TypeScript config
└── package.json            # Dependencies
```

## 🔐 Role Permissions

| Action | Admin | Manager | Member |
|--------|-------|---------|--------|
| View Dashboard | ✅ | ✅ | ✅ |
| View Projects | ✅ | ✅ | ✅ |
| View Teams | ✅ | ✅ | ✅ |
| Edit Projects | ✅ | ✅ | ❌ |
| Create Projects | ✅ | ✅ | ❌ |
| Delete Projects | ✅ | ❌ | ❌ |
| Manage Teams | ✅ | ✅ | ❌ |
| Delete Teams | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ |
| Admin Panel | ✅ | ❌ | ❌ |

## 🎨 Customization

### Colors
Edit `tailwind.config.ts`:

```typescript
colors: {
  tangent: {
    blue: '#00AEEF',      // Primary brand color
    'blue-dark': '#0095d0',
    'blue-light': '#33c1f5',
  },
}
```

### Logo
Replace the logo in components or add to `/public/logo.png`

## 📊 Database Schema

### profiles
- `id` (UUID, PK) - References auth.users
- `email` (varchar)
- `full_name` (varchar)
- `role` (enum: admin, manager, member)
- `team_id` (UUID, FK)
- `is_active` (boolean)
- `created_at`, `updated_at`

### teams
- `id` (UUID, PK)
- `team_name` (varchar)
- `team_lead` (varchar)
- `description` (text)
- `created_at`, `updated_at`

### projects
- `id` (UUID, PK)
- `project_name` (varchar)
- `description` (text)
- `stage` (enum)
- `priority` (enum: critical, high, medium, low)
- `status` (enum: IN PROGRESS, DONE, TBC, ON HOLD)
- `team_id` (UUID, FK)
- `deadline` (date)
- `progress` (int 0-100)
- `criticality` (int 1-10)
- `created_by` (UUID, FK)
- `created_at`, `updated_at`

### notifications
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `project_id` (UUID, FK)
- `title` (varchar)
- `message` (text)
- `type` (info, warning, danger, success)
- `is_read` (boolean)
- `deadline_alert` (boolean)
- `created_at`

### activity_logs
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `project_id` (UUID, FK)
- `action` (varchar)
- `details` (jsonb)
- `created_at`

## 🔧 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Chart.js](https://www.chartjs.org/)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)

---

Built with ❤️ for Tangent Landscape Architecture
