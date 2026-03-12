import DashboardLayoutClient from '../dashboard/DashboardLayoutClient';

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
