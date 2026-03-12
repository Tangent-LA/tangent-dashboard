'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Filter, Download, Plus, Grid3X3, List } from 'lucide-react';
import { useStore } from '@/lib/store';
import { getSupabase } from '@/lib/supabase';
import { filterProjects, cn } from '@/lib/utils';
import type { Project, Team, ProjectStage, ProjectPriority, ProjectStatus } from '@/types';
import { ProjectsTable } from '@/components/ProjectsTable';
import { ProjectCard } from '@/components/ProjectCard';
import { ExportModal } from '@/components/ExportModal';
import toast from 'react-hot-toast';

const stages: ProjectStage[] = ['SD DESIGN', 'DD DESIGN', 'REVISED DD', 'TENDER DESIGN', 'TENDER ADDENDUM', 'BIM MLD SUBMISSION', 'IFC'];
const priorities: ProjectPriority[] = ['critical', 'high', 'medium', 'low'];
const statuses: ProjectStatus[] = ['IN PROGRESS', 'DONE', 'TBC', 'ON HOLD'];

export default function ProjectsClient() {
  const router = useRouter();
  const { projects, setProjects, teams, setTeams, filters, setFilters, resetFilters, user } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const supabase = await getSupabase();
      if (!supabase) return;

      const { data: projectsData } = await supabase
        .from('projects_with_details')
        .select('*')
        .order('deadline', { ascending: true });

      if (projectsData) setProjects(projectsData as Project[]);

      const { data: teamsData } = await supabase
        .from('teams')
        .select('*')
        .order('team_name');

      if (teamsData) setTeams(teamsData as Team[]);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = filterProjects(projects, filters);
  const canCreate = user && (user.role === 'admin' || user.role === 'manager');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">All Projects</h1>
          <p className="text-gray-400 text-sm mt-1">
            {filteredProjects.length} of {projects.length} projects
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setShowExportModal(true)} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          {canCreate && (
            <button onClick={() => router.push('/admin')} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Project
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search projects..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="input-field pl-12 w-full"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={filters.stage}
              onChange={(e) => setFilters({ stage: e.target.value as any })}
              className="input-field w-auto"
            >
              <option value="all">All Stages</option>
              {stages.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters({ priority: e.target.value as any })}
              className="input-field w-auto"
            >
              <option value="all">All Priorities</option>
              {priorities.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ status: e.target.value as any })}
              className="input-field w-auto"
            >
              <option value="all">All Status</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <button onClick={resetFilters} className="btn-ghost text-sm">Reset</button>

            <div className="flex bg-dark-card rounded-lg p-1 border border-dark-border">
              <button
                onClick={() => setViewMode('table')}
                className={cn('p-2 rounded-lg transition-colors', viewMode === 'table' ? 'bg-tangent-blue text-white' : 'text-gray-400')}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn('p-2 rounded-lg transition-colors', viewMode === 'grid' ? 'bg-tangent-blue text-white' : 'text-gray-400')}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Display */}
      {filteredProjects.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Filter className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No projects match your filters</p>
          <button onClick={resetFilters} className="mt-4 btn-secondary">Clear Filters</button>
        </div>
      ) : viewMode === 'table' ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <ProjectsTable projects={filteredProjects} onProjectClick={(id) => router.push(`/projects/${id}`)} />
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ProjectCard project={project} onClick={() => router.push(`/projects/${project.id}`)} />
            </motion.div>
          ))}
        </div>
      )}

      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} projects={projects} teams={teams} />
    </div>
  );
}
