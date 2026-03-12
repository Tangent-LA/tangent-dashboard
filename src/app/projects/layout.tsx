import DashboardLayoutClient from '../dashboard/DashboardLayoutClient';

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
