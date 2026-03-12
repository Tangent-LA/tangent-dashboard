import DashboardLayoutClient from '../dashboard/DashboardLayoutClient';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
