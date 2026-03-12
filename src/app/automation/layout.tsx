import DashboardLayoutClient from '../dashboard/DashboardLayoutClient';

export default function AutomationLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
