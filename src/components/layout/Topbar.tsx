import { ThemeToggle } from '../ui/ThemeToggle';

interface TopbarProps {
  title: string;
  actions?: React.ReactNode;
}

export function Topbar({ title, actions }: TopbarProps) {
  return (
    <header className="topbar">
      <div>
        <p className="topbar__eyebrow">Backoffice interno</p>
        <h2>{title}</h2>
      </div>
      <div className="topbar__actions">
        <ThemeToggle />
        {actions}
      </div>
    </header>
  );
}
