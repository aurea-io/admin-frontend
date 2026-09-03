import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { PLATFORM_NAV_CONFIG, filterNavByRole } from '../../config/navigation';

function renderNavIcon(type: string) {
  switch (type) {
    case 'dashboard':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'plans':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      );
    case 'tenants':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M3 21h18M3 7v14M21 7v14M7 21V3h10v18M11 7h2M11 11h2M11 15h2" />
        </svg>
      );
    case 'modules':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case 'maintenance':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      );
    case 'audit':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

const SHORT_LABELS: Record<string, string> = {
  dashboard: 'Inicio',
  plans: 'Planes',
  tenants: 'Tenants',
  modules: 'Módulos',
  maintenance: 'Mant.',
  audit: 'Auditoría',
};

export function BottomNav() {
  const user = useAuthStore((state) => state.user);
  if (!user) return null;

  const filteredNav = filterNavByRole(PLATFORM_NAV_CONFIG, user.role);

  return (
    <nav className="app-bottom-nav" aria-label="Navegación móvil inferior">
      <ul className="app-bottom-nav__list">
        {filteredNav.map((item) => (
          <li key={item.id} className="app-bottom-nav__item">
            <NavLink
              to={item.href}
              className={({ isActive }) =>
                `app-bottom-nav__link ${isActive ? 'app-bottom-nav__link--active' : ''}`
              }
            >
              <span className="app-bottom-nav__icon">{renderNavIcon(item.iconType)}</span>
              <span className="app-bottom-nav__label">{SHORT_LABELS[item.id] || item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
