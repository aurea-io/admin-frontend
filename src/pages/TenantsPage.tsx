import { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { platformService } from '../services/platform.service';
import type { PlatformTenant } from '../types/platform';

export function TenantsPage() {
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    platformService
      .getTenants()
      .then(setTenants)
      .catch(() => setError('No se pudieron cargar los tenants de la plataforma.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-header__content">
          <h1>Tenants y Comercios</h1>
          <p>Directorio global de empresas clientes registradas en la plataforma AUREA.</p>
        </div>
        <button type="button" className="btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Nuevo tenant</span>
        </button>
      </div>

      <div className="pricing-history-card">
        <h3 className="plan-card__title">Listado de comercios activos</h3>

        {loading && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Cargando directorio de comercios...
          </div>
        )}

        {error && (
          <div className="toast-feedback" style={{ background: 'var(--color-danger-soft)', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <div style={{ overflowX: 'auto' }}>
            <table className="pricing-table">
              <thead>
                <tr>
                  <th>Comercio</th>
                  <th>Identificador (Slug)</th>
                  <th>Vertical</th>
                  <th>Estado</th>
                  <th>Modo Mantenimiento</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '24px' }}>
                      No hay comercios registrados aún.
                    </td>
                  </tr>
                ) : (
                  tenants.map((tenant) => (
                    <tr key={tenant.id}>
                      <td>
                        <strong>{tenant.name}</strong>
                      </td>
                      <td>
                        <code style={{ background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
                          {tenant.slug}
                        </code>
                      </td>
                      <td>
                        <span style={{ textTransform: 'capitalize' }}>{tenant.vertical}</span>
                      </td>
                      <td>
                        <span className="app-topbar__badge" style={{ background: tenant.isActive ? 'var(--color-success-soft)' : 'var(--color-warning-soft)', color: tenant.isActive ? 'var(--color-success)' : 'var(--color-warning)' }}>
                          {tenant.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        {tenant.maintenanceMode ? (
                          <span style={{ color: 'var(--color-brand)', fontWeight: 600 }}>
                            {tenant.maintenanceMessage || 'En mantenimiento'}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)' }}>Operativo</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="action-dots-btn"
                          style={{ color: 'var(--color-brand)', margin: '0 auto' }}
                          title="Gestionar tenant"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
