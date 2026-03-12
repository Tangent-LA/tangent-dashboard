import DashboardLayoutClient from '../dashboard/DashboardLayoutClient';

export default function ActivityLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
