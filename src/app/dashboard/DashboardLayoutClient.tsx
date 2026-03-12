'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Calendar,
  Users,
  FileBox,
  Zap,
  BarChart3,
  Activity,
  Shield,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  ChevronDown,
  Settings,
} from 'lucide-react';

type UserProfile = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  avatar_url: string | null;
};

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
};

const mainNav: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Teams', href: '/teams', icon: Users },
];

const managementNav: NavItem[] = [
  { name: 'BIM Deliverables', href: '/bim', icon: FileBox, roles: ['admin', 'manager'] },
  { name: 'Automation', href: '/automation', icon: Zap, roles: ['admin', 'manager'] },
  { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
];

const adminNav: NavItem[] = [
  { name: 'Activity Monitor', href: '/activity', icon: Activity, roles: ['admin'] },
  { name: 'Admin Panel', href: '/admin', icon: Shield, roles: ['admin'] },
];

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchUser();
    fetchNotifications();
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const fetchUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        setUser(profile);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authUser.id)
        .eq('is_read', false);

      setNotificationCount(count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const canAccess = (item: NavItem) => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role);
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const userRole = user?.role || 'member';
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager' || isAdmin;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#0d0d14] border-r border-white/5 z-50 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 border-b border-white/5">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00AEEF] flex items-center justify-center font-bold text-white text-lg">
                T
              </div>
              <div>
                <h1 className="font-bold text-[#00AEEF] tracking-wide">TANGENT</h1>
                <p className="text-[9px] text-gray-500 tracking-widest">LANDSCAPE ARCHITECTURE</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-6 overflow-y-auto no-scrollbar">
            {/* Main Navigation */}
            <div className="space-y-1">
              {mainNav.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-[#00AEEF]/20 to-transparent text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isActive(item.href) && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#00AEEF] rounded-r-full" />
                  )}
                  <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'text-[#00AEEF]' : ''}`} />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              ))}
            </div>

            {/* Management Navigation */}
            {isManager && (
              <div className="space-y-1">
                <p className="px-3 text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Management
                </p>
                {managementNav.filter(canAccess).map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-[#00AEEF]/20 to-transparent text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {isActive(item.href) && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#00AEEF] rounded-r-full" />
                    )}
                    <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'text-[#00AEEF]' : ''}`} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Admin Navigation */}
            {isAdmin && (
              <div className="space-y-1">
                <p className="px-3 text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Administration
                </p>
                {adminNav.filter(canAccess).map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-[#00AEEF]/20 to-transparent text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {isActive(item.href) && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#00AEEF] rounded-r-full" />
                    )}
                    <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'text-[#00AEEF]' : ''}`} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00AEEF] to-[#0077a3] flex items-center justify-center text-white font-medium">
                {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.full_name || 'User'}</p>
                <p className="text-xs text-gray-500 capitalize">{userRole}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search */}
            <div className="hidden md:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search projects, tasks..."
                  className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#00AEEF]/50 focus:ring-1 focus:ring-[#00AEEF]/50 transition-all"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button className="relative p-2.5 hover:bg-white/5 rounded-xl transition-colors">
                <Bell className="w-5 h-5 text-gray-400" />
                {notificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="relative user-menu-container">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen(!userMenuOpen);
                  }}
                  className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00AEEF] to-[#0077a3] flex items-center justify-center text-white text-sm font-medium">
                    {user?.full_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 py-2 bg-[#16161f] rounded-xl border border-white/10 shadow-xl">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="font-medium truncate">{user?.full_name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
