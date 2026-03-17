import DashboardLayoutClient from './dashboard/DashboardLayoutClient';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
