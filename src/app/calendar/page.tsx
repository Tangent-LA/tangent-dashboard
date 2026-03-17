'use client';

import { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  FolderKanban,
  Building2,
  ListTodo,
  AlertTriangle,
  Clock,
} from 'lucide-react';

type Project = {
  id: string;
  project_name: string;
  project_end_date: string | null;
  project_status: string;
  project_priority: string;
  teams?: { team_name: string; color: string } | null;
};

type Task = {
  id: string;
  title: string;
  due_date: string | null;
  status: string;
  priority: string;
};

type BimDeliverable = {
  id: string;
  deliverable_name: string;
  due_date: string | null;
  status: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  type: 'project' | 'task' | 'deliverable';
  priority?: string;
  status?: string;
  color: string;
};

export default function CalendarPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deliverables, setDeliverables] = useState<BimDeliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewFilter, setViewFilter] = useState<'all' | 'projects' | 'tasks' | 'deliverables'>('all');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [projectsRes, tasksRes, deliverablesRes] = await Promise.all([
      supabase.from('projects').select('*, teams(team_name, color)'),
      supabase.from('tasks').select('*'),
      supabase.from('bim_deliverables').select('*'),
    ]);

    if (projectsRes.data) setProjects(projectsRes.data);
    if (tasksRes.data) setTasks(tasksRes.data);
    if (deliverablesRes.data) setDeliverables(deliverablesRes.data);
    setLoading(false);
  };

  // Generate calendar events
  const events = useMemo(() => {
    const eventList: CalendarEvent[] = [];

    if (viewFilter === 'all' || viewFilter === 'projects') {
      projects.forEach(p => {
        if (p.project_end_date) {
          eventList.push({
            id: p.id,
            title: p.project_name,
            date: p.project_end_date.split('T')[0],
            type: 'project',
            priority: p.project_priority,
            status: p.project_status,
            color: p.teams?.color || '#8B5CF6',
          });
        }
      });
    }

    if (viewFilter === 'all' || viewFilter === 'tasks') {
      tasks.forEach(t => {
        if (t.due_date) {
          eventList.push({
            id: t.id,
            title: t.title,
            date: t.due_date.split('T')[0],
            type: 'task',
            priority: t.priority,
            status: t.status,
            color: '#3B82F6',
          });
        }
      });
    }

    if (viewFilter === 'all' || viewFilter === 'deliverables') {
      deliverables.forEach(d => {
        if (d.due_date) {
          eventList.push({
            id: d.id,
            title: d.deliverable_name,
            date: d.due_date.split('T')[0],
            type: 'deliverable',
            status: d.status,
            color: '#F59E0B',
          });
        }
      });
    }

    return eventList;
  }, [projects, tasks, deliverables, viewFilter]);

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDay = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const getEventsForDate = (date: string) => {
    return events.filter(e => e.date === date);
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const today = new Date().toISOString().split('T')[0];

  // Generate calendar days
  const calendarDays = [];
  for (let i = 0; i < startingDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarDays.push({ day: i, date: dateStr });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <CalendarIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="text-gradient">Calendar</span>
            </h1>
            <p className="text-gray-400 mt-1">Deadlines & Submissions</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl">
            {[
              { key: 'all', label: 'All' },
              { key: 'projects', label: 'Projects' },
              { key: 'tasks', label: 'Tasks' },
              { key: 'deliverables', label: 'BIM' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setViewFilter(key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewFilter === key
                    ? 'bg-[#00AEEF] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="col-span-2 card-premium p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">{monthName}</h2>
            <div className="flex items-center gap-2">
              <button onClick={goToToday} className="btn-secondary text-sm">
                Today
              </button>
              <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-lg">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (!day) {
                return <div key={`empty-${i}`} className="aspect-square" />;
              }

              const dateEvents = getEventsForDate(day.date);
              const isToday = day.date === today;
              const isSelected = day.date === selectedDate;
              const hasOverdue = dateEvents.some(e => 
                day.date < today && e.status !== 'completed' && e.status !== 'done' && e.status !== 'approved'
              );

              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  className={`aspect-square p-1 rounded-xl transition-all relative ${
                    isSelected
                      ? 'bg-[#00AEEF]/20 border border-[#00AEEF]'
                      : isToday
                        ? 'bg-white/10 border border-white/20'
                        : 'hover:bg-white/5 border border-transparent'
                  } ${hasOverdue ? 'ring-1 ring-red-500/50' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isToday ? 'text-[#00AEEF]' : ''
                  }`}>
                    {day.day}
                  </div>
                  
                  {/* Event dots */}
                  <div className="flex flex-wrap gap-0.5 justify-center">
                    {dateEvents.slice(0, 3).map((event, j) => (
                      <div
                        key={j}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: event.color }}
                      />
                    ))}
                    {dateEvents.length > 3 && (
                      <span className="text-[8px] text-gray-500">+{dateEvents.length - 3}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-xs text-gray-400">Projects</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-400">Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-xs text-gray-400">BIM Deliverables</span>
            </div>
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="card-premium p-6">
          <h3 className="text-lg font-semibold mb-4">
            {selectedDate 
              ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric' 
                })
              : 'Select a date'}
          </h3>

          <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar">
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No events on this date</p>
              </div>
            ) : (
              selectedDateEvents.map(event => {
                const Icon = event.type === 'project' ? FolderKanban 
                  : event.type === 'task' ? ListTodo 
                  : Building2;
                const isOverdue = event.date < today && 
                  event.status !== 'completed' && 
                  event.status !== 'done' && 
                  event.status !== 'approved';

                return (
                  <div
                    key={`${event.type}-${event.id}`}
                    className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${
                      isOverdue 
                        ? 'bg-red-500/10 border-red-500/30' 
                        : 'bg-white/5 border-white/5'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${event.color}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: event.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-2">{event.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 capitalize">{event.type}</span>
                          {event.priority && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              event.priority === 'critical' || event.priority === 'urgent'
                                ? 'bg-red-500/20 text-red-400'
                                : event.priority === 'high'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {event.priority}
                            </span>
                          )}
                          {isOverdue && (
                            <span className="text-xs text-red-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Overdue
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Section */}
      <div className="card-premium p-6">
        <h3 className="text-lg font-semibold mb-4">Upcoming This Week</h3>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const dayEvents = getEventsForDate(dateStr);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = date.getDate();

            if (dayEvents.length === 0) return null;

            return (
              <div key={dateStr} className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-500">{dayName}</p>
                    <p className="text-xl font-bold">{dayNum}</p>
                  </div>
                  <span className="text-sm text-gray-500 bg-white/10 px-2 py-1 rounded-full">
                    {dayEvents.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {dayEvents.slice(0, 3).map(event => (
                    <div key={event.id} className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: event.color }}
                      />
                      <span className="text-xs text-gray-400 truncate">{event.title}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="text-xs text-gray-500">+{dayEvents.length - 3} more</p>
                  )}
                </div>
              </div>
            );
          }).filter(Boolean).slice(0, 4)}
        </div>
      </div>
    </div>
  );
}
