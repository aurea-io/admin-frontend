import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: ReactNode;
  pageTitle: string;
  topbarActions?: ReactNode;
}

export function AppShell({ children, pageTitle, topbarActions }: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-shell__content">
        <div className="topbar">
          <div>
            <p className="topbar__eyebrow">Backoffice interno</p>
            <h2>{pageTitle}</h2>
          </div>
          <div className="topbar__actions">
            {topbarActions}
          </div>
        </div>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
