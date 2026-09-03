import { Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { useAuthStore } from '../stores/authStore';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-header__content">
          <h1>Resumen de Plataforma</h1>
          <p>Bienvenido al centro de administración central de AUREA.</p>
        </div>
        <Link to="/platform/modules" className="btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
          </svg>
          <span>Gestionar módulos</span>
        </Link>
      </div>

      <div className="plan-grid-top" style={{ marginBottom: '28px' }}>
        {/* Card 1: Sesión & Operador */}
        <div className="plan-card">
          <h3 className="plan-card__title">Operador de plataforma</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div className="app-topbar__avatar" style={{ width: '48px', height: '48px', fontSize: '1.1rem' }}>
              {user?.name?.charAt(0) || 'P'}
            </div>
            <div>
              <strong style={{ fontSize: '1.05rem', color: 'var(--color-text)', display: 'block' }}>
                {user?.name}
              </strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{user?.email}</span>
            </div>
          </div>
          <div className="plan-summary-list">
            <div className="plan-summary-row">
              <span>Rol asignado</span>
              <span className="app-topbar__badge" style={{ display: 'inline-block' }}>
                {user?.role === 'platform_owner' ? 'Platform Owner' : 'Platform Operator'}
              </span>
            </div>
            <div className="plan-summary-row">
              <span>Estado de cuenta</span>
              <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Activo</span>
            </div>
          </div>
        </div>

        {/* Card 2: Accesos Directos */}
        <div className="plan-card">
          <h3 className="plan-card__title">Accesos directos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link
              to="/platform/plans"
              className="tree-folder"
              style={{ padding: '10px 12px', border: '1px solid var(--color-border)' }}
            >
              <span className="tree-folder__title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
                <span>Planes y membresías</span>
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              to="/platform/modules"
              className="tree-folder"
              style={{ padding: '10px 12px', border: '1px solid var(--color-border)' }}
            >
              <span className="tree-folder__title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                </svg>
                <span>Catálogo de módulos y funciones</span>
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              to="/platform/tenants"
              className="tree-folder"
              style={{ padding: '10px 12px', border: '1px solid var(--color-border)' }}
            >
              <span className="tree-folder__title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2">
                  <path d="M3 21h18M3 7v14M21 7v14M7 21V3h10v18M11 7h2M11 11h2M11 15h2" />
                </svg>
                <span>Directorio de tenants</span>
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Card 3: Estado de Plataforma */}
        <div className="plan-card">
          <h3 className="plan-card__title">Estado de plataforma</h3>
          <div className="modules-check-list">
            <div className="module-check-row">
              <div className="module-check-row__left">
                <div className="check-icon-circle">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Servidor de API</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-success)' }}>Operativo</span>
            </div>

            <div className="module-check-row">
              <div className="module-check-row__left">
                <div className="check-icon-circle">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Base de datos (MongoDB)</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-success)' }}>Conectado</span>
            </div>

            <div className="module-check-row">
              <div className="module-check-row__left">
                <div className="check-icon-circle">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>PWA Service Worker</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-success)' }}>Activo</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
