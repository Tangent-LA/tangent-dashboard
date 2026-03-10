'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Save, X, Users, Timer, TrendingUp } from 'lucide-react';
import { useStore } from '@/lib/store';
import { getSupabase } from '@/lib/supabase';
import { cn, formatDate, getRemainingDays, getDeadlineStatus, priorityColors, statusColors, deadlineColors, getInitials, getAvatarColor } from '@/lib/utils';
import type { Project, Team, ProjectStage, ProjectPriority, ProjectStatus } from '@/types';
import toast from 'react-hot-toast';

const stages: ProjectStage[] = ['SD DESIGN', 'DD DESIGN', 'REVISED DD', 'TENDER DESIGN', 'TENDER ADDENDUM', 'BIM MLD SUBMISSION', 'IFC'];
const priorities: ProjectPriority[] = ['critical', 'high', 'medium', 'low'];
const statuses: ProjectStatus[] = ['IN PROGRESS', 'DONE', 'TBC', 'ON HOLD'];

export default function ProjectDetailsClient() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { user, teams, setTeams } = useStore();

  const [project, setProject] = useState<Project | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    project_name: '', description: '', stage: '' as ProjectStage, priority: '' as ProjectPriority,
    status: '' as ProjectStatus, team_id: '', deadline: '', progress: 0, criticality: 5,
  });

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    setIsLoading(true);
    try {
      const supabase = await getSupabase();
      if (!supabase) { router.push('/login'); return; }

      const { data: projectData, error } = await supabase.from('projects_with_details').select('*').eq('id', projectId).single();
      if (error) throw error;
      setProject(projectData as Project);
      setEditForm({
        project_name: projectData.project_name, description: projectData.description || '', stage: projectData.stage,
        priority: projectData.priority, status: projectData.status, team_id: projectData.team_id || '',
        deadline: projectData.deadline || '', progress: projectData.progress, criticality: projectData.criticality,
      });

      if (projectData.team_id) {
        const { data: teamData } = await supabase.from('teams').select('*').eq('id', projectData.team_id).single();
        setTeam(teamData as Team);
      }

      const { data: allTeams } = await supabase.from('teams').select('*').order('team_name');
      if (allTeams) setTeams(allTeams as Team[]);
    } catch (error) {
      toast.error('Failed to load project details');
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      toast.error('You do not have permission to edit projects');
      return;
    }
    setIsSaving(true);
    try {
      const supabase = await getSupabase();
      if (!supabase) return;
      const { error } = await supabase.from('projects').update({
        project_name: editForm.project_name, description: editForm.description, stage: editForm.stage,
        priority: editForm.priority, status: editForm.status, team_id: editForm.team_id || null,
        deadline: editForm.deadline || null, progress: editForm.progress, criticality: editForm.criticality,
      }).eq('id', projectId);
      if (error) throw error;
      toast.success('Project updated successfully');
      setIsEditing(false);
      fetchProjectDetails();
    } catch (error) {
      toast.error('Failed to update project');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !project) {
    return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;
  }

  const deadlineStatus = getDeadlineStatus(project.deadline, project.status);
  const daysRemaining = project.remaining_days ?? getRemainingDays(project.deadline);
  const priorityStyle = priorityColors[project.priority];
  const statusStyle = statusColors[project.status];
  const deadlineStyle = deadlineColors[deadlineStatus];
  const canEdit = user && (user.role === 'admin' || user.role === 'manager');

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" />Back to Dashboard
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">{project.project_name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
            <span>Stage: {project.stage}</span>
            <span>Team: {project.team_lead || 'Unassigned'}</span>
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="btn-secondary flex items-center gap-2"><X className="w-4 h-4" />Cancel</button>
                <button onClick={handleSave} disabled={isSaving} className="btn-primary flex items-center gap-2">{isSaving ? <div className="spinner w-4 h-4" /> : <Save className="w-4 h-4" />}Save</button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="btn-secondary flex items-center gap-2"><Edit className="w-4 h-4" />Edit</button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-6 text-tangent-blue">📋 Project Information</h2>
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Project Name</label><input type="text" value={editForm.project_name} onChange={(e) => setEditForm({ ...editForm, project_name: e.target.value })} className="input-field" /></div>
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Stage</label><select value={editForm.stage} onChange={(e) => setEditForm({ ...editForm, stage: e.target.value as ProjectStage })} className="input-field">{stages.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Priority</label><select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as ProjectPriority })} className="input-field">{priorities.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}</select></div>
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Status</label><select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as ProjectStatus })} className="input-field">{statuses.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Deadline</label><input type="date" value={editForm.deadline} onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })} className="input-field" /></div>
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Progress ({editForm.progress}%)</label><input type="range" min="0" max="100" value={editForm.progress} onChange={(e) => setEditForm({ ...editForm, progress: parseInt(e.target.value) })} className="w-full" /></div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-tangent-blue/5 rounded-xl border border-dark-border"><p className="text-xs text-gray-500 uppercase mb-1">Stage</p><p className="font-semibold">{project.stage}</p></div>
                <div className="p-4 bg-tangent-blue/5 rounded-xl border border-dark-border"><p className="text-xs text-gray-500 uppercase mb-1">Status</p><span className={cn('badge border', statusStyle.bg, statusStyle.text, statusStyle.border)}>{project.status}</span></div>
                <div className="p-4 bg-tangent-blue/5 rounded-xl border border-dark-border"><p className="text-xs text-gray-500 uppercase mb-1">Priority</p><span className={cn('badge border', priorityStyle.bg, priorityStyle.text, priorityStyle.border)}>{project.priority.toUpperCase()}</span></div>
                <div className="p-4 bg-tangent-blue/5 rounded-xl border border-dark-border"><p className="text-xs text-gray-500 uppercase mb-1">Progress</p><p className="font-semibold">{project.progress}%</p></div>
                <div className="p-4 bg-tangent-blue/5 rounded-xl border border-dark-border"><p className="text-xs text-gray-500 uppercase mb-1">Deadline</p><p className="font-semibold">{formatDate(project.deadline)}</p></div>
                <div className="p-4 bg-tangent-blue/5 rounded-xl border border-dark-border"><p className="text-xs text-gray-500 uppercase mb-1">Criticality</p><p className="font-semibold">{project.criticality}/10</p></div>
              </div>
            )}
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-tangent-blue"><Timer className="w-5 h-5" />Deadline Countdown</h2>
            <div className="text-center py-4">
              <p className="text-6xl font-bold bg-gradient-tangent bg-clip-text text-transparent">{Math.abs(daysRemaining)}</p>
              <p className={cn('text-lg mt-2', deadlineStyle.text)}>{deadlineStatus === 'overdue' ? 'Days Overdue' : 'Days Remaining'}</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-tangent-blue"><Users className="w-5 h-5" />Assigned Team</h2>
            {team ? (
              <div className="flex items-center gap-3 p-3 bg-tangent-blue/5 rounded-xl border border-dark-border">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-white', getAvatarColor(team.team_lead || ''))}>{getInitials(team.team_lead)}</div>
                <div><p className="font-medium">{team.team_lead}</p><p className="text-xs text-gray-500">{team.team_name}</p></div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No team assigned</p>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-tangent-blue"><TrendingUp className="w-5 h-5" />Progress</h2>
            <div className="relative pt-4 flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-dark-border" />
                  <circle cx="64" cy="64" r="56" stroke="url(#progressGradient)" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={`${project.progress * 3.52} 352`} />
                  <defs><linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#00AEEF" /><stop offset="100%" stopColor="#0077b6" /></linearGradient></defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl font-bold">{project.progress}%</span></div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
