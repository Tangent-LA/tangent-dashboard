'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  Shield,
  CheckSquare,
  FileBox,
  Activity,
  Zap,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2
} from 'lucide-react';
import { useState } from 'react';

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  managerOnly?: boolean;
};

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Teams', href: '/dashboard/teams', icon: Users },
  { name: 'BIM Deliverables', href: '/bim', icon: FileBox, managerOnly: true },
  { name: 'Activity Monitor', href: '/activity', icon: Activity, adminOnly: true },
  { name: 'Automation', href: '/automation', icon: Zap, managerOnly: true },
  { name: 'Reports', href: '/reports', icon: BarChart3, managerOnly: true },
];

const adminNavigation: NavItem[] = [
  { name: 'Admin Panel', href: '/dashboard/admin', icon: Shield, adminOnly: true },
];

interface SidebarProps {
  userRole?: string;
  userName?: string;
}

export default function Sidebar({ userRole = 'admin', userName = 'User' }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager' || isAdmin;

  const filteredNav = navigation.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.managerOnly && !isManager) return false;
    return true;
  });

  const filteredAdminNav = adminNavigation.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <aside className={`bg-[#0a0a1a] border-r border-gray-800 h-screen sticky top-0 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-4 border-b border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00AEEF] to-[#0077a3] flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-[#00AEEF]">TANGENT</h1>
                <p className="text-[10px] text-gray-500 -mt-0.5">PROJECT DASHBOARD</p>
              </div>
            )}
          </Link>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-[#1a1a2e] border border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:border-[#00AEEF] transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-[#00AEEF]/10 text-[#00AEEF] border-l-2 border-[#00AEEF]' 
                    : 'text-gray-400 hover:bg-[#1a1a2e] hover:text-white'
                }`}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm">{item.name}</span>}
              </Link>
            );
          })}

          {/* Admin Section */}
          {filteredAdminNav.length > 0 && (
            <>
              {!collapsed && (
                <div className="pt-4 pb-2">
                  <p className="px-3 text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Admin
                  </p>
                </div>
              )}
              {filteredAdminNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-[#00AEEF]/10 text-[#00AEEF] border-l-2 border-[#00AEEF]' 
                        : 'text-gray-400 hover:bg-[#1a1a2e] hover:text-white'
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm">{item.name}</span>}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-800">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00AEEF] to-[#0077a3] flex items-center justify-center text-white font-medium">
              {userName.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userName}</p>
                <p className="text-xs text-gray-500 capitalize">{userRole}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
