import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { PLATFORM_NAV_CONFIG, filterNavByRole } from '../../config/navigation';

interface NavItemProps {
  icon: ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

function NavItem({ icon, label, href, active = false }: NavItemProps) {
  return (
    <Link 
      to={href}
      className={`sidebar__item ${active ? 'sidebar__item--active' : ''}`}
    >
      <span className="sidebar__icon">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!user) return null;

  // Filter navigation items based on user role
  const filteredNav = filterNavByRole(PLATFORM_NAV_CONFIG, user.role);

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo">A</span>
        <span>AUREA</span>
      </div>

      <nav className="sidebar__nav" aria-label="Principal">
        {filteredNav.map((item) => (
          <NavItem
            key={item.id}
            icon={<span>{item.icon}</span>}
            label={item.label}
            href={item.href}
            active={location.pathname === item.href}
          />
        ))}
      </nav>

      {user && (
        <div className="sidebar__footer">
          <div className="sidebar__user-info">
            <div className="sidebar__user-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <div>
              <p className="sidebar__user-name">{user.name}</p>
              <p className="sidebar__user-role">{user.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
