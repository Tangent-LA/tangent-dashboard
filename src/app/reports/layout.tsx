import DashboardLayoutClient from '../dashboard/DashboardLayoutClient';

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
