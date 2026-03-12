import DashboardLayoutClient from '../dashboard/DashboardLayoutClient';

export default function BimLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
