'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  Plus,
  Grid3X3,
  List,
  SlidersHorizontal,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';
import { filterProjects, cn } from '@/lib/utils';
import type { Project, Team, ProjectStage, ProjectPriority, ProjectStatus } from '@/types';
import { ProjectsTable } from '@/components/ProjectsTable';
import { ProjectCard } from '@/components/ProjectCard';
import { ExportModal } from '@/components/ExportModal';
import toast from 'react-hot-toast';

const stages: ProjectStage[] = ['SD DESIGN', 'DD DESIGN', 'REVISED DD', 'TENDER DESIGN', 'TENDER ADDENDUM', 'BIM MLD SUBMISSION', 'IFC'];
const priorities: ProjectPriority[] = ['critical', 'high', 'medium', 'low'];
const statuses: ProjectStatus[] = ['IN PROGRESS', 'DONE', 'TBC', 'ON HOLD'];

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, setProjects, teams, setTeams, filters, setFilters, resetFilters, user } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects_with_details')
        .select('*')
        .order('deadline', { ascending: true });

      if (projectsError) throw projectsError;
      setProjects(projectsData as Project[]);

      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('team_name');

      if (teamsError) throw teamsError;
      setTeams(teamsData as Team[]);
    } catch (error) {
      console.error('Error fetching data:', error);
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">All Projects</h1>
          <p className="text-gray-400 text-sm mt-1">
            {filteredProjects.length} of {projects.length} projects
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowExportModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          {canCreate && (
            <button
              onClick={() => router.push('/admin')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Project
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
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

          {/* Quick Filters */}
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

            <select
              value={filters.team}
              onChange={(e) => setFilters({ team: e.target.value })}
              className="input-field w-auto"
            >
              <option value="all">All Teams</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
            </select>

            {/* Reset Filters */}
            <button
              onClick={resetFilters}
              className="btn-ghost text-sm"
            >
              Reset
            </button>

            {/* View Toggle */}
            <div className="flex bg-dark-card rounded-lg p-1 border border-dark-border">
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'table' ? 'bg-tangent-blue text-white' : 'text-gray-400 hover:text-white'
                )}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'grid' ? 'bg-tangent-blue text-white' : 'text-gray-400 hover:text-white'
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(filters.search || filters.stage !== 'all' || filters.priority !== 'all' || filters.status !== 'all' || filters.team !== 'all') && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-dark-border">
            <span className="text-xs text-gray-500">Active filters:</span>
            {filters.search && (
              <span className="badge bg-tangent-blue/15 text-tangent-blue border border-tangent-blue/30">
                Search: {filters.search}
              </span>
            )}
            {filters.stage !== 'all' && (
              <span className="badge bg-tangent-blue/15 text-tangent-blue border border-tangent-blue/30">
                Stage: {filters.stage}
              </span>
            )}
            {filters.priority !== 'all' && (
              <span className="badge bg-tangent-blue/15 text-tangent-blue border border-tangent-blue/30">
                Priority: {filters.priority}
              </span>
            )}
            {filters.status !== 'all' && (
              <span className="badge bg-tangent-blue/15 text-tangent-blue border border-tangent-blue/30">
                Status: {filters.status}
              </span>
            )}
            {filters.team !== 'all' && (
              <span className="badge bg-tangent-blue/15 text-tangent-blue border border-tangent-blue/30">
                Team: {teams.find(t => t.id === filters.team)?.team_name}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Projects Display */}
      {filteredProjects.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Filter className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No projects match your filters</p>
          <button
            onClick={resetFilters}
            className="mt-4 btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <ProjectsTable
            projects={filteredProjects}
            onProjectClick={(id) => router.push(`/projects/${id}`)}
          />
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
              <ProjectCard
                project={project}
                onClick={() => router.push(`/projects/${project.id}`)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        projects={projects}
        teams={teams}
      />
    </div>
  );
}
