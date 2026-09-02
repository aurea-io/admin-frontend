import type { ReactNode } from 'react';

interface NavItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function NavItem({ icon, label, active = false, onClick }: NavItemProps) {
  return (
    <button type="button" className={`sidebar__item ${active ? 'sidebar__item--active' : ''}`} onClick={onClick}>
      <span className="sidebar__icon">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo">A</span>
        <span>AUREA</span>
      </div>

      <nav className="sidebar__nav" aria-label="Principal">
        <NavItem icon={<span>◫</span>} label="Resumen" active />
        <NavItem icon={<span>▣</span>} label="Tenants" />
        <NavItem icon={<span>▤</span>} label="Módulos" />
        <NavItem icon={<span>⚙</span>} label="Configuración" />
      </nav>
    </aside>
  );
}
