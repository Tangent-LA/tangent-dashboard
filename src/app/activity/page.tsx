'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import {
  Activity,
  ChevronLeft,
  Clock,
  User,
  Monitor,
  Coffee,
  Lock,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';

type UserActivity = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: string;
  job_title: string | null;
  activity_status: string;
  last_active_at: string | null;
  teams?: { team_name: string; color: string } | null;
};

const statusConfig: Record<string, { label: string; color: string; icon: any; bgColor: string }> = {
  online: { label: 'Online', color: 'text-green-400', icon: Wifi, bgColor: 'bg-green-500' },
  active: { label: 'Active', color: 'text-green-400', icon: Monitor, bgColor: 'bg-green-500' },
  idle: { label: 'Idle', color: 'text-yellow-400', icon: Clock, bgColor: 'bg-yellow-500' },
  on_break: { label: 'On Break', color: 'text-orange-400', icon: Coffee, bgColor: 'bg-orange-500' },
  offline: { label: 'Offline', color: 'text-gray-400', icon: WifiOff, bgColor: 'bg-gray-500' },
  locked: { label: 'Screen Locked', color: 'text-red-400', icon: Lock, bgColor: 'bg-red-500' },
};

export default function ActivityPage() {
  const [users, setUsers] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchUsers();
    
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Subscribe to realtime changes
    const channel = supabase
      .channel('activity_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        setUsers(prev => prev.map(u => u.id === payload.new.id ? { ...u, ...payload.new } : u));
      })
      .subscribe();

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, role, job_title, activity_status, last_active_at, teams(team_name, color)')
      .eq('is_active', true)
      .order('activity_status', { ascending: true })
      .order('full_name');

    if (!error && data) {
      setUsers(data as UserActivity[]);
    }
    setLoading(false);
  };

  const filteredUsers = users.filter(user => {
    if (filterStatus === 'all') return true;
    return user.activity_status === filterStatus;
  });

  const stats = {
    total: users.length,
    online: users.filter(u => u.activity_status === 'online' || u.activity_status === 'active').length,
    idle: users.filter(u => u.activity_status === 'idle').length,
    offline: users.filter(u => u.activity_status === 'offline' || u.activity_status === 'locked').length,
  };

  const getStatusInfo = (status: string) => {
    return statusConfig[status] || statusConfig.offline;
  };

  const formatLastActive = (date: string | null): string => {
    if (!date) return 'Never';
    try {
      const d = new Date(date);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Unknown';
    }
  };

  // Dubai time
  const dubaiTime = currentTime.toLocaleTimeString('en-US', { 
    timeZone: 'Asia/Dubai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true 
  });
  const dubaiDate = currentTime.toLocaleDateString('en-US', { 
    timeZone: 'Asia/Dubai',
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="text-gradient">Activity Monitor</span>
            </h1>
            <p className="text-gray-400 mt-1">Track team member activity status</p>
          </div>
        </div>
        
        {/* Dubai Time Widget */}
        <div className="card-premium px-6 py-3 flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-400">Dubai Time (GST)</p>
            <p className="text-xl font-bold text-[#00AEEF]">{dubaiTime}</p>
            <p className="text-xs text-gray-500">{dubaiDate}</p>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div>
            <p className="text-xs text-gray-400">Working Hours</p>
            <p className="text-sm font-medium">8:00 AM - 6:00 PM</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card-premium p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#00AEEF]/20 flex items-center justify-center">
              <User className="w-6 h-6 text-[#00AEEF]" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-400">Total Users</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Wifi className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.online}</p>
              <p className="text-sm text-gray-400">Online</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.idle}</p>
              <p className="text-sm text-gray-400">Idle</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-500/20 flex items-center justify-center">
              <WifiOff className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.offline}</p>
              <p className="text-sm text-gray-400">Offline</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'online', label: 'Online' },
            { key: 'active', label: 'Active' },
            { key: 'idle', label: 'Idle' },
            { key: 'offline', label: 'Offline' },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setFilterStatus(filter.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterStatus === filter.key
                  ? 'bg-[#00AEEF] text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        
        <button onClick={fetchUsers} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="card-premium text-center py-16">
          <User className="w-20 h-20 mx-auto mb-4 text-gray-700" />
          <h3 className="text-xl font-semibold mb-2">No Users Found</h3>
          <p className="text-gray-400 text-sm">No users match the selected filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const status = getStatusInfo(user.activity_status);
            const StatusIcon = status.icon;

            return (
              <div key={user.id} className="card-premium p-5">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00AEEF] to-[#0077a3] flex items-center justify-center text-white text-xl font-semibold">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        user.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-[#16161f] ${status.bgColor} flex items-center justify-center`}>
                      <StatusIcon className="w-3 h-3 text-white" />
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{user.full_name || user.email}</h3>
                    <p className="text-sm text-gray-500 truncate">{user.job_title || user.role}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status.color} bg-white/5`}>
                        {status.label}
                      </span>
                      {user.teams && (
                        <span 
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${user.teams.color}20`, color: user.teams.color }}
                        >
                          {user.teams.team_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
                  <span>Last active</span>
                  <span className={user.activity_status === 'online' ? 'text-green-400' : ''}>
                    {user.activity_status === 'online' || user.activity_status === 'active' 
                      ? 'Now' 
                      : formatLastActive(user.last_active_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
