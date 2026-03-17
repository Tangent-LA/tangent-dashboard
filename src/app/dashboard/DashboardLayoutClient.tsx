'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  ListTodo,
  Calendar,
  Building2,
  Zap,
  BarChart3,
  Activity,
  Settings,
  Bell,
  Search,
  LogOut,
  ChevronDown,
  Moon,
  Sun,
  Menu,
  X,
  HelpCircle,
  User,
  Shield,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/teams', label: 'Teams', icon: Users },
  { href: '/tasks', label: 'Tasks', icon: ListTodo },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/bim', label: 'BIM Deliverables', icon: Building2 },
  { href: '/automation', label: 'Automation', icon: Zap },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/activity', label: 'Activity Log', icon: Activity },
  { href: '/admin', label: 'Admin Panel', icon: Shield },
];

type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  time: string;
  read: boolean;
};

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Project Deadline',
      message: 'Dubai Hills Estate Phase 2 is due in 3 days',
      type: 'warning',
      time: '2h ago',
      read: false,
    },
    {
      id: '2',
      title: 'Team Update',
      message: 'Team 01 has 2 overdue projects',
      type: 'error',
      time: '5h ago',
      read: false,
    },
    {
      id: '3',
      title: 'BIM Submission',
      message: 'NEOM submission approved',
      type: 'success',
      time: '1d ago',
      read: true,
    },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setUser({ ...user, profile });
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00AEEF] to-[#0077a3] flex items-center justify-center shadow-lg shadow-[#00AEEF]/20">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight">TANGENT</span>
              <span className="text-[10px] text-gray-500 tracking-widest">LANDSCAPE ARCHITECTURE</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 overflow-y-auto no-scrollbar">
          <div className="px-4 mb-2">
            <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Main Menu</span>
          </div>
          {navItems.slice(0, 6).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="nav-icon" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="px-4 mt-6 mb-2">
            <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Management</span>
          </div>
          {navItems.slice(6).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="nav-icon" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/5">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user?.profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">
                  {user?.profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.profile?.role || 'Team Member'}
                </p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1e1e28] border border-white/10 rounded-xl shadow-xl overflow-hidden animate-fadeIn">
                <Link
                  href="/admin?tab=profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">My Profile</span>
                </Link>
                <Link
                  href="/admin?tab=settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-[280px]">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 h-16 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between h-full px-6">
            {/* Page Title / Breadcrumb */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowMobileMenu(true)}
                className="lg:hidden p-2 hover:bg-white/5 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-lg font-semibold capitalize">
                  {pathname === '/dashboard' ? 'Dashboard' : pathname.split('/')[1] || 'Dashboard'}
                </h2>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Global Search */}
              <div className="relative">
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="p-2.5 hover:bg-white/5 rounded-xl transition-colors"
                >
                  <Search className="w-5 h-5 text-gray-400" />
                </button>
                
                {showSearch && (
                  <div className="absolute right-0 top-12 w-80 bg-[#1e1e28] border border-white/10 rounded-xl shadow-2xl p-4 animate-fadeIn">
                    <input
                      type="text"
                      placeholder="Search projects, tasks, teams..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input-premium"
                      autoFocus
                    />
                    <div className="mt-3 text-xs text-gray-500">
                      <p>Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Esc</kbd> to close</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 hover:bg-white/5 rounded-xl transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-400" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-12 w-96 bg-[#1e1e28] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                      <h3 className="font-semibold">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-[#00AEEF] hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p>No notifications</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => markAsRead(notification.id)}
                            className={`w-full text-left p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0 ${
                              !notification.read ? 'bg-white/[0.02]' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                                notification.type === 'error' ? 'bg-red-500' :
                                notification.type === 'warning' ? 'bg-yellow-500' :
                                notification.type === 'success' ? 'bg-green-500' :
                                'bg-blue-500'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{notification.title}</p>
                                <p className="text-sm text-gray-400 truncate">{notification.message}</p>
                                <p className="text-xs text-gray-600 mt-1">{notification.time}</p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-[#00AEEF] rounded-full flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-white/5">
                      <Link
                        href="/activity"
                        onClick={() => setShowNotifications(false)}
                        className="block text-center text-sm text-[#00AEEF] hover:underline"
                      >
                        View all activity
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Help */}
              <button className="p-2.5 hover:bg-white/5 rounded-xl transition-colors">
                <HelpCircle className="w-5 h-5 text-gray-400" />
              </button>

              {/* Divider */}
              <div className="w-px h-6 bg-white/10" />

              {/* User Quick Access */}
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 pr-3 hover:bg-white/5 rounded-xl transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.profile?.full_name?.[0] || 'U'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-white/5">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <p>© 2026 Tangent Landscape Architecture. All rights reserved.</p>
            <p>Dashboard v3.0</p>
          </div>
        </footer>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#12121a] border-r border-white/10 animate-slideIn">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <span className="font-bold">Menu</span>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 hover:bg-white/5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                      isActive 
                        ? 'bg-[#00AEEF]/10 text-[#00AEEF]' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Click outside handlers */}
      {(showNotifications || showSearch || showUserMenu) && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowNotifications(false);
            setShowSearch(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </div>
  );
}
