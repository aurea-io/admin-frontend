import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useThemeMode } from '../../hooks/useThemeMode';
import { PLATFORM_NAV_CONFIG, filterNavByRole } from '../../config/navigation';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

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

export function Sidebar({ isMobileOpen, onCloseMobile }: SidebarProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { theme, toggleTheme } = useThemeMode();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async () => {
    onCloseMobile();
    await logout();
    navigate('/login', { replace: true });
  };

  const filteredNav = filterNavByRole(PLATFORM_NAV_CONFIG, user.role);

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onCloseMobile} 
          aria-hidden="true"
        />
      )}

      <aside className={`app-sidebar ${isMobileOpen ? 'app-sidebar--open' : ''}`}>
        <nav className="app-sidebar__nav" aria-label="Navegación de plataforma">
          {filteredNav.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.id}
                to={item.href}
                onClick={onCloseMobile}
                className={`app-sidebar__link ${isActive ? 'app-sidebar__link--active' : ''}`}
              >
                <span className="app-sidebar__link-icon">{renderNavIcon(item.iconType)}</span>
                <span className="app-sidebar__link-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="app-sidebar__footer">
          {/* Toggle de tema para Mobile */}
          <div className="app-sidebar__mobile-section">
            <button
              type="button"
              className="app-sidebar__theme-toggle-btn"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                  </svg>
                  <span>Tema Claro</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  <span>Tema Oscuro</span>
                </>
              )}
            </button>

            {/* Logout Mobile */}
            <button
              type="button"
              className="app-sidebar__logout-mobile-btn"
              onClick={handleLogout}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Cerrar sesión ({user.name.split(' ')[0]})</span>
            </button>
          </div>

          {/* Callout Informativo */}
          <div className="app-sidebar__callout">
            <div className="app-sidebar__callout-header">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>{user.role === 'platform_owner' ? 'Modo Platform Owner' : 'Vista de solo lectura'}</span>
            </div>
            <p className="app-sidebar__callout-text">
              {user.role === 'platform_owner'
                ? 'Control total sobre tenants, planes y catálogo.'
                : 'No puedes realizar cambios en esta sección.'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
