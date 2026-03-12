import DashboardLayoutClient from '../dashboard/DashboardLayoutClient';

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
