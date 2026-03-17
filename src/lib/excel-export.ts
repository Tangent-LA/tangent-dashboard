'use client';

import * as XLSX from 'xlsx';

// Types
type Project = {
  id: string;
  project_name: string;
  description?: string | null;
  project_status: string;
  project_stage: string;
  project_priority: string;
  project_start_date?: string | null;
  project_end_date?: string | null;
  progress_percentage?: number;
  client_name?: string | null;
  teams?: { team_name: string; color: string } | null;
};

type Team = {
  id: string;
  team_name: string;
  color: string;
  members?: number;
};

type ExportOptions = {
  type: 'all' | 'team' | 'project' | 'deadline' | 'submission';
  teamId?: string;
  dateRange?: { start: string; end: string };
  includeCharts?: boolean;
};

// Configuration
const stageLabels: Record<string, string> = {
  sd_design: 'SD Design',
  dd_design: 'DD Design',
  ifc: 'IFC',
  bim_submission: 'BIM Submission',
  revised_dd: 'Revised DD',
  construction: 'Construction',
};

const priorityLabels: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// Utility functions
const formatDate = (date: string | null | undefined): string => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: '10B981',
    in_progress: '3B82F6',
    on_hold: 'F59E0B',
    completed: '8B5CF6',
    cancelled: '6B7280',
  };
  return colors[status] || '6B7280';
};

const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    critical: 'EF4444',
    high: 'F59E0B',
    medium: '3B82F6',
    low: '10B981',
  };
  return colors[priority] || '6B7280';
};

const isOverdue = (project: Project): boolean => {
  if (!project.project_end_date || project.project_status === 'completed') return false;
  return project.project_end_date < new Date().toISOString().split('T')[0];
};

// Style definitions
const headerStyle = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  fill: { fgColor: { rgb: '00AEEF' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } },
  },
};

const titleStyle = {
  font: { bold: true, color: { rgb: '00AEEF' }, sz: 18 },
  alignment: { horizontal: 'left', vertical: 'center' },
};

const subtitleStyle = {
  font: { bold: false, color: { rgb: '666666' }, sz: 10 },
  alignment: { horizontal: 'left' },
};

const cellStyle = {
  border: {
    top: { style: 'thin', color: { rgb: 'E5E5E5' } },
    bottom: { style: 'thin', color: { rgb: 'E5E5E5' } },
    left: { style: 'thin', color: { rgb: 'E5E5E5' } },
    right: { style: 'thin', color: { rgb: 'E5E5E5' } },
  },
  alignment: { vertical: 'center' },
};

// Main export function
export async function exportToExcel(
  projects: Project[],
  teams: Team[],
  options: ExportOptions
): Promise<void> {
  const workbook = XLSX.utils.book_new();
  const today = new Date();
  const reportDate = today.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Filter projects based on options
  let filteredProjects = [...projects];
  
  if (options.type === 'team' && options.teamId) {
    filteredProjects = projects.filter(p => p.teams?.team_name === options.teamId || p.id === options.teamId);
  } else if (options.type === 'deadline') {
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    filteredProjects = projects.filter(p => p.project_end_date && p.project_end_date <= nextMonth);
  }

  // ==========================================
  // SUMMARY SHEET
  // ==========================================
  const summaryData: any[][] = [];

  // Header section with branding
  summaryData.push(['TANGENT LANDSCAPE ARCHITECTURE']);
  summaryData.push(['Project Management Dashboard - Executive Report']);
  summaryData.push([`Generated: ${reportDate}`]);
  summaryData.push([]);

  // KPI Summary Section
  summaryData.push(['EXECUTIVE SUMMARY']);
  summaryData.push([]);

  const activeCount = filteredProjects.filter(p => p.project_status === 'active' || p.project_status === 'in_progress').length;
  const completedCount = filteredProjects.filter(p => p.project_status === 'completed').length;
  const overdueCount = filteredProjects.filter(isOverdue).length;
  const criticalCount = filteredProjects.filter(p => p.project_priority === 'critical').length;
  const highPriorityCount = filteredProjects.filter(p => p.project_priority === 'high').length;

  summaryData.push(['Key Performance Indicators', '', '', '']);
  summaryData.push(['Metric', 'Value', 'Status', 'Trend']);
  summaryData.push(['Total Projects', filteredProjects.length, '-', '-']);
  summaryData.push(['Active Projects', activeCount, activeCount > 0 ? 'On Track' : '-', '']);
  summaryData.push(['Completed Projects', completedCount, 'Done', `${Math.round((completedCount / filteredProjects.length) * 100) || 0}%`]);
  summaryData.push(['Overdue Projects', overdueCount, overdueCount > 0 ? 'At Risk' : 'Clear', overdueCount > 0 ? '⚠️' : '✓']);
  summaryData.push(['Critical Priority', criticalCount, criticalCount > 0 ? 'Urgent' : '-', '']);
  summaryData.push(['High Priority', highPriorityCount, '-', '']);
  summaryData.push([]);

  // Projects by Stage
  summaryData.push(['PROJECTS BY STAGE']);
  summaryData.push(['Stage', 'Count', 'Percentage', 'Status']);
  Object.entries(stageLabels).forEach(([key, label]) => {
    const count = filteredProjects.filter(p => p.project_stage === key).length;
    const percentage = filteredProjects.length > 0 ? Math.round((count / filteredProjects.length) * 100) : 0;
    summaryData.push([label, count, `${percentage}%`, '']);
  });
  summaryData.push([]);

  // Projects by Team
  summaryData.push(['PROJECTS BY TEAM']);
  summaryData.push(['Team', 'Active Projects', 'Overdue', 'Capacity']);
  teams.forEach(team => {
    const teamProjects = filteredProjects.filter(p => p.teams?.team_name === team.team_name);
    const teamOverdue = teamProjects.filter(isOverdue).length;
    const activeTeamProjects = teamProjects.filter(p => p.project_status === 'active' || p.project_status === 'in_progress').length;
    const capacity = team.members ? Math.round((activeTeamProjects / team.members) * 100) : 0;
    summaryData.push([
      team.team_name,
      teamProjects.length,
      teamOverdue,
      `${capacity}%`,
    ]);
  });

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

  // Set column widths
  summarySheet['!cols'] = [
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];

  // Merge cells for title
  summarySheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Main title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // Subtitle
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }, // Date
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // ==========================================
  // PROJECTS SHEET
  // ==========================================
  const projectsData: any[][] = [];

  projectsData.push(['PROJECT DETAILS']);
  projectsData.push([`Report Date: ${reportDate}`, '', '', '', '', '', '', '', '']);
  projectsData.push([]);

  // Headers
  projectsData.push([
    'Project Name',
    'Team',
    'Stage',
    'Priority',
    'Status',
    'Progress',
    'Start Date',
    'End Date',
    'Days Remaining',
    'Risk Level',
  ]);

  // Data rows
  filteredProjects.forEach(project => {
    const daysRemaining = project.project_end_date
      ? Math.ceil((new Date(project.project_end_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    const riskLevel = isOverdue(project)
      ? 'OVERDUE'
      : daysRemaining !== null && daysRemaining <= 7
        ? 'HIGH'
        : daysRemaining !== null && daysRemaining <= 14
          ? 'MEDIUM'
          : 'LOW';

    projectsData.push([
      project.project_name,
      project.teams?.team_name || '-',
      stageLabels[project.project_stage] || project.project_stage,
      priorityLabels[project.project_priority] || project.project_priority,
      statusLabels[project.project_status] || project.project_status,
      `${project.progress_percentage || 0}%`,
      formatDate(project.project_start_date),
      formatDate(project.project_end_date),
      daysRemaining !== null ? daysRemaining : '-',
      riskLevel,
    ]);
  });

  const projectsSheet = XLSX.utils.aoa_to_sheet(projectsData);

  // Set column widths
  projectsSheet['!cols'] = [
    { wch: 35 }, // Project Name
    { wch: 15 }, // Team
    { wch: 15 }, // Stage
    { wch: 12 }, // Priority
    { wch: 12 }, // Status
    { wch: 10 }, // Progress
    { wch: 15 }, // Start Date
    { wch: 15 }, // End Date
    { wch: 12 }, // Days Remaining
    { wch: 12 }, // Risk Level
  ];

  // Freeze header row
  projectsSheet['!freeze'] = { xSplit: 0, ySplit: 4 };

  XLSX.utils.book_append_sheet(workbook, projectsSheet, 'Projects');

  // ==========================================
  // TEAMS SHEET
  // ==========================================
  const teamsData: any[][] = [];

  teamsData.push(['TEAM WORKLOAD ANALYSIS']);
  teamsData.push([`Report Date: ${reportDate}`]);
  teamsData.push([]);

  teamsData.push([
    'Team Name',
    'Total Projects',
    'Active Projects',
    'Completed',
    'Overdue',
    'Critical Priority',
    'Team Members',
    'Capacity %',
    'Workload Status',
  ]);

  teams.forEach(team => {
    const teamProjects = filteredProjects.filter(p => p.teams?.team_name === team.team_name);
    const activeProjects = teamProjects.filter(p => p.project_status === 'active' || p.project_status === 'in_progress').length;
    const completedProjects = teamProjects.filter(p => p.project_status === 'completed').length;
    const overdueProjects = teamProjects.filter(isOverdue).length;
    const criticalProjects = teamProjects.filter(p => p.project_priority === 'critical').length;
    const capacity = team.members ? Math.round((activeProjects / team.members) * 100) : 0;
    
    let workloadStatus = 'Balanced';
    if (capacity > 150) workloadStatus = 'OVERLOADED';
    else if (capacity > 100) workloadStatus = 'High Load';
    else if (capacity < 50) workloadStatus = 'Available';

    teamsData.push([
      team.team_name,
      teamProjects.length,
      activeProjects,
      completedProjects,
      overdueProjects,
      criticalProjects,
      team.members || 0,
      `${capacity}%`,
      workloadStatus,
    ]);
  });

  const teamsSheet = XLSX.utils.aoa_to_sheet(teamsData);

  teamsSheet['!cols'] = [
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(workbook, teamsSheet, 'Teams');

  // ==========================================
  // DEADLINES SHEET
  // ==========================================
  const deadlinesData: any[][] = [];

  deadlinesData.push(['UPCOMING DEADLINES']);
  deadlinesData.push([`Report Date: ${reportDate}`]);
  deadlinesData.push([]);

  // Sort by deadline
  const projectsWithDeadlines = filteredProjects
    .filter(p => p.project_end_date && p.project_status !== 'completed')
    .sort((a, b) => (a.project_end_date || '').localeCompare(b.project_end_date || ''));

  deadlinesData.push([
    'Project Name',
    'Team',
    'Stage',
    'Priority',
    'Deadline',
    'Days Until Deadline',
    'Progress',
    'Status Alert',
  ]);

  projectsWithDeadlines.forEach(project => {
    const daysUntil = Math.ceil(
      (new Date(project.project_end_date!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    let statusAlert = '';
    if (daysUntil < 0) statusAlert = '🔴 OVERDUE';
    else if (daysUntil === 0) statusAlert = '🟠 DUE TODAY';
    else if (daysUntil <= 3) statusAlert = '🟠 URGENT';
    else if (daysUntil <= 7) statusAlert = '🟡 THIS WEEK';
    else if (daysUntil <= 14) statusAlert = '🟢 UPCOMING';
    else statusAlert = '✓ ON TRACK';

    deadlinesData.push([
      project.project_name,
      project.teams?.team_name || '-',
      stageLabels[project.project_stage] || project.project_stage,
      priorityLabels[project.project_priority] || project.project_priority,
      formatDate(project.project_end_date),
      daysUntil,
      `${project.progress_percentage || 0}%`,
      statusAlert,
    ]);
  });

  const deadlinesSheet = XLSX.utils.aoa_to_sheet(deadlinesData);

  deadlinesSheet['!cols'] = [
    { wch: 35 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(workbook, deadlinesSheet, 'Deadlines');

  // ==========================================
  // OVERDUE PROJECTS SHEET
  // ==========================================
  const overdueProjects = filteredProjects.filter(isOverdue);
  
  if (overdueProjects.length > 0) {
    const overdueData: any[][] = [];

    overdueData.push(['⚠️ OVERDUE PROJECTS - IMMEDIATE ATTENTION REQUIRED']);
    overdueData.push([`Report Date: ${reportDate}`]);
    overdueData.push([]);

    overdueData.push([
      'Project Name',
      'Team',
      'Priority',
      'Original Deadline',
      'Days Overdue',
      'Progress',
      'Action Required',
    ]);

    overdueProjects.forEach(project => {
      const daysOverdue = Math.abs(
        Math.ceil((new Date(project.project_end_date!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      );

      let action = 'Review immediately';
      if (project.project_priority === 'critical') action = 'CRITICAL - Escalate now';
      else if (daysOverdue > 14) action = 'Major delay - Re-evaluate scope';
      else if (daysOverdue > 7) action = 'Significant delay - Resource review';

      overdueData.push([
        project.project_name,
        project.teams?.team_name || '-',
        priorityLabels[project.project_priority] || project.project_priority,
        formatDate(project.project_end_date),
        `${daysOverdue} days`,
        `${project.progress_percentage || 0}%`,
        action,
      ]);
    });

    const overdueSheet = XLSX.utils.aoa_to_sheet(overdueData);

    overdueSheet['!cols'] = [
      { wch: 35 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 30 },
    ];

    XLSX.utils.book_append_sheet(workbook, overdueSheet, 'Overdue');
  }

  // ==========================================
  // GENERATE FILE
  // ==========================================
  const fileName = `Tangent_Dashboard_Report_${today.toISOString().split('T')[0]}.xlsx`;
  
  XLSX.writeFile(workbook, fileName);
}

// Export filtered view
export async function exportFilteredView(
  projects: Project[],
  teams: Team[],
  filters: {
    stage?: string;
    status?: string;
    priority?: string;
    team?: string;
  }
): Promise<void> {
  let filtered = [...projects];

  if (filters.stage) {
    filtered = filtered.filter(p => p.project_stage === filters.stage);
  }
  if (filters.status) {
    filtered = filtered.filter(p => p.project_status === filters.status);
  }
  if (filters.priority) {
    filtered = filtered.filter(p => p.project_priority === filters.priority);
  }
  if (filters.team) {
    filtered = filtered.filter(p => p.teams?.team_name === filters.team);
  }

  await exportToExcel(filtered, teams, { type: 'all' });
}

// Quick export functions
export const exportByTeam = (projects: Project[], teams: Team[], teamId: string) =>
  exportToExcel(projects, teams, { type: 'team', teamId });

export const exportByDeadline = (projects: Project[], teams: Team[]) =>
  exportToExcel(projects, teams, { type: 'deadline' });

export const exportAll = (projects: Project[], teams: Team[]) =>
  exportToExcel(projects, teams, { type: 'all' });
