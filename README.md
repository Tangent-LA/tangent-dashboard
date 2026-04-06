# Tangent ID Monitor - Enterprise BIM Platform

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    TANGENT ID MONITOR v3.0                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │  WPF Client │────▶│ Flask Server│────▶│  Supabase   │       │
│  │  (Desktop)  │     │ (Oracle)    │     │ (PostgreSQL)│       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│         │                   │                   │               │
│         │                   │                   │               │
│         │            ┌──────▼──────┐            │               │
│         │            │   Vercel    │────────────┘               │
│         │            │ (Dashboard) │                            │
│         │            └─────────────┘                            │
│         │                   │                                   │
│         │            ┌──────▼──────┐                            │
│         │            │ Gmail SMTP  │                            │
│         │            │ (Email)     │                            │
│         └────────────└─────────────┘                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the `supabase_schema.sql` file
3. Copy your project URL and anon key

### 2. Server Deployment (Oracle Cloud)

```bash
# SSH into server
ssh -i oracle.key opc@141.145.153.32

# Install dependencies
pip3 install flask gunicorn psycopg2-binary bcrypt pyjwt --user

# Upload app_v3.py
# (from local machine)
scp app_v3.py opc@141.145.153.32:/opt/idmonitor/app.py

# Set environment variables
sudo nano /etc/systemd/system/idmonitor.service
```

Add to service file:
```ini
[Service]
Environment=DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
Environment=API_KEY=Tangent@2026
Environment=SECRET_KEY=your-secret-key
Environment=SMTP_USER=infotangentla@gmail.com
Environment=SMTP_PASSWORD=your-app-password
```

```bash
# Restart
sudo systemctl daemon-reload
sudo systemctl restart idmonitor
```

### 3. Vercel Dashboard

```bash
# Clone and deploy
cd tangent-dashboard
npm install
npm run dev  # Local development

# Deploy to Vercel
vercel --prod
```

Set environment variables in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL` = http://141.145.153.32:5000
- `NEXT_PUBLIC_API_KEY` = Tangent@2026

### 4. Gmail SMTP Setup

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Generate App Password for "Mail"
4. Use this password for `SMTP_PASSWORD`

## 📁 Project Structure

```
tangent-id-monitor/
├── server/
│   ├── app_v3.py           # Flask server with auth
│   └── requirements.txt
├── dashboard/
│   ├── app/
│   │   ├── auth/           # Login, forgot password
│   │   ├── dashboard/      # Main dashboard
│   │   ├── projects/       # Project management
│   │   ├── teams/          # Team management
│   │   └── activity/       # Activity tracking
│   ├── lib/
│   │   ├── supabase.ts     # Database client
│   │   └── store.ts        # State management
│   └── components/
├── wpf-client/             # WPF Desktop client
└── supabase_schema.sql     # Database schema
```

## 🔐 Authentication

- Email/Password login
- JWT tokens (24h expiry)
- Forgot password via Gmail SMTP
- Role-based access (admin, team_leader, user)

## 📊 Features

### Phase 1 ✅
- [x] Authentication (login, logout, forgot password)
- [x] Project Management with Revit file mappings
- [x] Real-time activity dashboard
- [x] Teams management

### Phase 2 (In Progress)
- [ ] Teams call tracking (incoming/outgoing)
- [ ] Fixed time tracking logic
- [ ] Idle time calculation
- [ ] Hourly activity charts

### Phase 3 (Planned)
- [ ] Kanban board
- [ ] Gantt chart
- [ ] Reports & exports
- [ ] Notification settings

## 🔧 API Endpoints

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/change-password
GET  /api/auth/me
```

### Projects
```
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/revit-files
DELETE /api/revit-files/:id
```

### Activity
```
GET  /api/sessions
GET  /api/activity/today
GET  /api/activity/range
POST /api/calls
GET  /api/calls
```

### Admin
```
GET  /api/admin/users
GET  /api/admin/stats
GET  /api/admin/email-usage
GET  /api/export/csv
```

## 📱 WPF Client Updates

The WPF client needs to be updated to:
1. Send call data with type (incoming/outgoing)
2. Fix time tracking accumulation
3. Properly detect idle time

See `wpf-client/UPDATES.md` for details.

## 🔒 Security Notes

1. Change `SECRET_KEY` in production
2. Use HTTPS for all connections
3. Restrict Supabase RLS policies
4. Set CORS properly on server

## 📞 Support

For issues, contact: infotangentla@gmail.com

---
© 2026 Tangent Landscape Architecture
