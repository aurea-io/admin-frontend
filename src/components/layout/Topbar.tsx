import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useThemeMode } from '../../hooks/useThemeMode';

interface TopbarProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export function Topbar({}: TopbarProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { theme, toggleTheme } = useThemeMode();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'PO';

  const roleLabel = user?.role === 'platform_owner' ? 'Platform Owner' : 'Platform Operator';

  return (
    <header className="app-topbar">
      {/* IZQUIERDA: Marca, Logo e Identidad Aurea con enlace al Inicio */}
      <div className="app-topbar__left">
        <Link to="/platform/dashboard" className="app-topbar__brand-link" title="Ir al Inicio / Dashboard">
          <div className="app-topbar__brand">
            <div className="app-topbar__logo-icon">
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                <path
                  d="M14 2L2 24H8L14 11L20 24H26L14 2Z"
                  fill="url(#aurea-gold-gradient)"
                />
                <path
                  d="M8.5 17.5H19.5"
                  stroke="url(#aurea-gold-gradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="aurea-gold-gradient" x1="2" y1="2" x2="26" y2="24" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#e88d6f" />
                    <stop offset="0.5" stopColor="#d8704d" />
                    <stop offset="1" stopColor="#c85a32" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="app-topbar__brand-text-group">
              <span className="app-topbar__logo-text">AUREA</span>
              <span className="app-topbar__platform-badge">INTERNAL</span>
            </div>
          </div>
        </Link>
      </div>

      {/* DERECHA: Botón de Tema y Perfil / Logout */}
      <div className="app-topbar__right">
        {/* Botón de alternancia de tema Claro / Oscuro */}
        <button
          type="button"
          className="app-topbar__theme-toggle"
          onClick={toggleTheme}
          aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
          title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
          id="theme-toggle-btn"
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Tarjeta de usuario con menú desplegable */}
        <div className="app-topbar__user-wrapper" ref={dropdownRef}>
          <button
            type="button"
            className="app-topbar__user-trigger"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-expanded={isDropdownOpen}
          >
            <div className="app-topbar__avatar">{initials}</div>
            <div className="app-topbar__user-meta">
              <span className="app-topbar__user-name">{user?.name || 'Platform Owner'}</span>
              <span className="app-topbar__user-subtitle">Rol de usuario</span>
            </div>
            <div className="app-topbar__badge">{roleLabel}</div>
            <svg
              className={`app-topbar__chevron ${isDropdownOpen ? 'app-topbar__chevron--open' : ''}`}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="app-topbar__dropdown">
              <div className="app-topbar__dropdown-header">
                <strong>{user?.name}</strong>
                <span>{user?.email}</span>
              </div>
              <div className="app-topbar__dropdown-divider" />
              <button
                type="button"
                className="app-topbar__dropdown-item app-topbar__dropdown-item--danger"
                onClick={handleLogout}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
