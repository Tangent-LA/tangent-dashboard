'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  FolderKanban,
  Users,
  FileBox,
  AlertTriangle,
  Plus,
} from 'lucide-react';

type CalendarItem = {
  id: string;
  title: string;
  date: string;
  type: 'task' | 'project' | 'bim';
  priority?: string;
  status?: string;
  teamName?: string;
  teamColor?: string;
  discipline?: string;
};

const typeColors = {
  task: 'border-l-blue-500',
  project: 'border-l-purple-500',
  bim: 'border-l-emerald-500',
};

const typeIcons = {
  task: Clock,
  project: FolderKanban,
  bim: FileBox,
};

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-500',
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'task' | 'project' | 'bim'>('all');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate]);

  const fetchCalendarData = async () => {
    setLoading(true);
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const startStr = startOfMonth.toISOString().split('T')[0];
    const endStr = endOfMonth.toISOString().split('T')[0];

    const items: CalendarItem[] = [];

    // Fetch Tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, due_date, status, priority')
      .gte('due_date', startStr)
      .lte('due_date', endStr);

    if (tasks) {
      tasks.forEach((task) => {
        items.push({
          id: task.id,
          title: task.title,
          date: task.due_date,
          type: 'task',
          priority: task.priority,
          status: task.status,
        });
      });
    }

    // Fetch Projects with Team info
    const { data: projects } = await supabase
      .from('projects')
      .select('id, project_name, project_end_date, project_status, project_priority, teams(team_name, color)')
      .gte('project_end_date', startStr)
      .lte('project_end_date', endStr);

    if (projects) {
      projects.forEach((project: any) => {
        items.push({
          id: project.id,
          title: project.project_name,
          date: project.project_end_date,
          type: 'project',
          priority: project.project_priority,
          status: project.project_status,
          teamName: project.teams?.team_name || 'Unassigned',
          teamColor: project.teams?.color || '#6b7280',
        });
      });
    }

    // Fetch BIM Deliverables with Project and Team info
    const { data: bimDeliverables } = await supabase
      .from('bim_deliverables')
      .select('id, deliverable_name, due_date, status, discipline, projects(project_name, teams(team_name, color))')
      .gte('due_date', startStr)
      .lte('due_date', endStr);

    if (bimDeliverables) {
      bimDeliverables.forEach((bim: any) => {
        items.push({
          id: bim.id,
          title: bim.deliverable_name,
          date: bim.due_date,
          type: 'bim',
          status: bim.status,
          discipline: bim.discipline,
          teamName: bim.projects?.teams?.team_name || 'Unassigned',
          teamColor: bim.projects?.teams?.color || '#6b7280',
        });
      });
    }

    setCalendarItems(items);
    setLoading(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { daysInMonth: lastDay.getDate(), startingDay: firstDay.getDay() };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);

  const getItemsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarItems.filter(item => {
      const matchesDate = item.date === dateStr;
      const matchesFilter = filterType === 'all' || item.type === filterType;
      return matchesDate && matchesFilter;
    });
  };

  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const stats = {
    totalProjects: calendarItems.filter(i => i.type === 'project').length,
    totalBim: calendarItems.filter(i => i.type === 'bim').length,
    totalTasks: calendarItems.filter(i => i.type === 'task').length,
    overdue: calendarItems.filter(i => {
      const itemDate = new Date(i.date);
      return itemDate < today && i.status !== 'done' && i.status !== 'completed' && i.status !== 'submitted';
    }).length,
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <CalendarIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold"><span className="text-gradient">Calendar</span></h1>
            <p className="text-gray-400 mt-1">Project submissions, BIM deliverables & task deadlines</p>
          </div>
        </div>
        <button className="btn-primary">
          <Plus className="w-5 h-5" />
          Add Event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card-premium p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalProjects}</p>
              <p className="text-xs text-gray-400">Project Deadlines</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <FileBox className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalBim}</p>
              <p className="text-xs text-gray-400">BIM Submissions</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalTasks}</p>
              <p className="text-xs text-gray-400">Task Deadlines</p>
            </div>
          </div>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.overdue}</p>
              <p className="text-xs text-gray-400">Overdue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="card-premium p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">{monthYear}</h2>
          <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl">
            {[
              { key: 'all', label: 'All' },
              { key: 'project', label: 'Projects', icon: FolderKanban },
              { key: 'bim', label: 'BIM', icon: FileBox },
              { key: 'task', label: 'Tasks', icon: Clock },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setFilterType(filter.key as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterType === filter.key ? 'bg-[#00AEEF] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {filter.icon && <filter.icon className="w-3.5 h-3.5" />}
                {filter.label}
              </button>
            ))}
          </div>
          
          <button onClick={() => setCurrentDate(new Date())} className="btn-secondary">
            Today
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-xs text-gray-400">Project Submission</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-400">BIM Deliverable</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-xs text-gray-400">Task Deadline</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card-premium overflow-hidden">
        <div className="grid grid-cols-7 border-b border-white/5">
          {weekDays.map((day) => (
            <div key={day} className="p-4 text-center text-sm font-medium text-gray-400">{day}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="spinner" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {Array.from({ length: startingDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[140px] p-2 border-r border-b border-white/5 bg-black/20" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayItems = getItemsForDay(day);
              const isToday = isCurrentMonth && day === today.getDate();
              const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentDate.getMonth();

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                  className={`min-h-[140px] p-2 border-r border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 ${
                    isSelected ? 'bg-[#00AEEF]/10' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mb-2 ${
                    isToday ? 'bg-[#00AEEF] text-white font-bold' : ''
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayItems.slice(0, 3).map((item) => {
                      const TypeIcon = typeIcons[item.type];
                      return (
                        <div 
                          key={item.id} 
                          className={`flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-xs truncate border-l-2 ${typeColors[item.type]}`}
                        >
                          <TypeIcon className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </div>
                      );
                    })}
                    {dayItems.length > 3 && (
                      <div className="text-[10px] text-gray-400 px-2">+{dayItems.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Day Details */}
      {selectedDate && (
        <div className="card-premium p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
            <CalendarIcon className="w-5 h-5 text-[#00AEEF]" />
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
          
          {getItemsForDay(selectedDate.getDate()).length === 0 ? (
            <p className="text-gray-400 text-sm">No items scheduled for this day</p>
          ) : (
            <div className="space-y-3">
              {getItemsForDay(selectedDate.getDate()).map((item) => {
                const TypeIcon = typeIcons[item.type];
                const isOverdue = new Date(item.date) < today && item.status !== 'done' && item.status !== 'completed' && item.status !== 'submitted';
                
                return (
                  <div 
                    key={item.id} 
                    className={`flex items-center gap-4 p-4 bg-white/5 rounded-xl border-l-4 ${typeColors[item.type]} ${
                      isOverdue ? 'border border-red-500/30' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      item.type === 'project' ? 'bg-purple-500/20' :
                      item.type === 'bim' ? 'bg-emerald-500/20' : 'bg-blue-500/20'
                    }`}>
                      <TypeIcon className={`w-5 h-5 ${
                        item.type === 'project' ? 'text-purple-400' :
                        item.type === 'bim' ? 'text-emerald-400' : 'text-blue-400'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{item.title}</h4>
                        {isOverdue && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">OVERDUE</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          item.type === 'project' ? 'bg-purple-500/20 text-purple-400' :
                          item.type === 'bim' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {item.type === 'bim' ? 'BIM Deliverable' : item.type}
                        </span>
                        
                        {item.discipline && (
                          <span className="text-xs text-gray-500">{item.discipline}</span>
                        )}
                      </div>
                    </div>
                    
                    {item.teamName && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
                        <Users className="w-4 h-4 text-gray-400" />
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.teamColor || '#6b7280' }} />
                        <span className="text-sm font-medium">{item.teamName}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
