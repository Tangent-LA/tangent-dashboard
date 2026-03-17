'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import {
  Activity,
  ChevronLeft,
  Search,
  Filter,
  FolderKanban,
  Users,
  ListTodo,
  Building2,
  Edit,
  Plus,
  Trash2,
  User,
  Clock,
  Calendar,
} from 'lucide-react';

type ActivityLog = {
  id: string;
  action: string;
  entity_type: string;
  entity_name: string;
  user_name: string;
  user_email: string;
  details: string | null;
  created_at: string;
};

// Mock activity data - in production, this would come from a database table
const mockActivities: ActivityLog[] = [
  {
    id: '1',
    action: 'created',
    entity_type: 'project',
    entity_name: 'Dubai Hills Estate Phase 3',
    user_name: 'Anshu Jalaludeen',
    user_email: 'anshu@tangent.com',
    details: 'New project created with SD Design stage',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '2',
    action: 'updated',
    entity_type: 'project',
    entity_name: 'NEOM - The Line',
    user_name: 'Sarah Ahmed',
    user_email: 'sarah@tangent.com',
    details: 'Progress updated from 45% to 60%',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '3',
    action: 'completed',
    entity_type: 'task',
    entity_name: 'Review structural drawings',
    user_name: 'Mohammed Ali',
    user_email: 'mohammed@tangent.com',
    details: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: '4',
    action: 'submitted',
    entity_type: 'deliverable',
    entity_name: 'LOD 300 BIM Model',
    user_name: 'Anshu Jalaludeen',
    user_email: 'anshu@tangent.com',
    details: 'Submitted for client review',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: '5',
    action: 'added',
    entity_type: 'team_member',
    entity_name: 'James Wilson',
    user_name: 'Admin',
    user_email: 'admin@tangent.com',
    details: 'Added to Team 02 - DD Design',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: '6',
    action: 'updated',
    entity_type: 'project',
    entity_name: 'Saadiyat Cultural District',
    user_name: 'Sarah Ahmed',
    user_email: 'sarah@tangent.com',
    details: 'Stage changed from DD Design to IFC',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: '7',
    action: 'created',
    entity_type: 'task',
    entity_name: 'Coordinate MEP with structural',
    user_name: 'Mohammed Ali',
    user_email: 'mohammed@tangent.com',
    details: 'Assigned to BIM Team',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: '8',
    action: 'approved',
    entity_type: 'deliverable',
    entity_name: 'Site Analysis Report',
    user_name: 'Client',
    user_email: 'client@external.com',
    details: 'Approved with minor comments',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
];

const actionConfig: Record<string, { color: string; icon: any }> = {
  created: { color: '#10B981', icon: Plus },
  updated: { color: '#3B82F6', icon: Edit },
  deleted: { color: '#EF4444', icon: Trash2 },
  completed: { color: '#8B5CF6', icon: ListTodo },
  submitted: { color: '#F59E0B', icon: Building2 },
  approved: { color: '#10B981', icon: Building2 },
  added: { color: '#00AEEF', icon: Users },
};

const entityConfig: Record<string, { color: string; icon: any }> = {
  project: { color: '#8B5CF6', icon: FolderKanban },
  task: { color: '#3B82F6', icon: ListTodo },
  deliverable: { color: '#F59E0B', icon: Building2 },
  team_member: { color: '#10B981', icon: Users },
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLog[]>(mockActivities);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const filteredActivities = activities.filter(activity => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!activity.entity_name.toLowerCase().includes(query) &&
          !activity.user_name.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (filterEntity && activity.entity_type !== filterEntity) return false;
    if (filterAction && activity.action !== filterAction) return false;
    return true;
  });

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = new Date(activity.created_at).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, ActivityLog[]>);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="text-gradient">Activity Log</span>
            </h1>
            <p className="text-gray-400 mt-1">Track all changes and updates</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-premium pl-12 w-full"
          />
        </div>

        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          className="select-premium w-40"
        >
          <option value="">All Types</option>
          <option value="project">Projects</option>
          <option value="task">Tasks</option>
          <option value="deliverable">Deliverables</option>
          <option value="team_member">Team Members</option>
        </select>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="select-premium w-40"
        >
          <option value="">All Actions</option>
          <option value="created">Created</option>
          <option value="updated">Updated</option>
          <option value="completed">Completed</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-8">
        {Object.entries(groupedActivities).map(([date, dateActivities]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-400">{date}</h3>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <div className="space-y-3">
              {dateActivities.map((activity) => {
                const action = actionConfig[activity.action] || actionConfig.updated;
                const entity = entityConfig[activity.entity_type] || entityConfig.project;
                const ActionIcon = action.icon;
                const EntityIcon = entity.icon;

                return (
                  <div
                    key={activity.id}
                    className="card-premium p-4 hover:border-white/20 transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Action Icon */}
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${action.color}20` }}
                      >
                        <ActionIcon className="w-5 h-5" style={{ color: action.color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{activity.user_name}</span>
                          <span className="text-gray-500">{activity.action}</span>
                          <span 
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{ backgroundColor: `${entity.color}20`, color: entity.color }}
                          >
                            {activity.entity_type.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <EntityIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-300">{activity.entity_name}</span>
                        </div>

                        {activity.details && (
                          <p className="text-sm text-gray-500 mt-2">{activity.details}</p>
                        )}
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(activity.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredActivities.length === 0 && (
          <div className="card-premium text-center py-16">
            <Activity className="w-16 h-16 mx-auto mb-4 text-gray-700" />
            <h3 className="text-xl font-semibold mb-2">No Activities Found</h3>
            <p className="text-gray-400 text-sm">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
