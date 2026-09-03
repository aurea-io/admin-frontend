import { Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';

export function PlansPage() {
  const priceHistory = [
    {
      startDate: '01 may 2024',
      endDate: 'Actualidad',
      price: '$499.00',
      credits: '50,000',
      cycle: 'Mensual',
    },
    {
      startDate: '01 ene 2024',
      endDate: '30 abr 2024',
      price: '$449.00',
      credits: '40,000',
      cycle: 'Mensual',
    },
    {
      startDate: '01 ago 2023',
      endDate: '31 dic 2023',
      price: '$399.00',
      credits: '30,000',
      cycle: 'Mensual',
    },
  ];

  return (
    <AppShell>
      <div className="plan-detail-header">
        <Link to="/platform/dashboard" className="plan-back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Volver a planes</span>
        </Link>

        <div className="plan-title-row">
          <div>
            <div className="plan-title-left">
              <h1>Plan Corporativo</h1>
              <span className="app-topbar__badge">Activo</span>
            </div>
            <p className="plan-subtitle">
              Plan creado el 12 abr 2024 • Última actualización el 21 may 2024
            </p>
          </div>

          <button type="button" className="btn-secondary" style={{ color: 'var(--color-text-soft)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Solo lectura</span>
          </button>
        </div>
      </div>

      {/* Grid de 3 cards superiores */}
      <div className="plan-grid-top">
        {/* Card 1: Créditos incluidos */}
        <div className="plan-card">
          <h3 className="plan-card__title">Créditos incluidos</h3>
          <div className="credit-huge-number">50,000</div>
          <p className="credit-huge-subtext">Créditos/mes</p>

          <div className="stat-rows-list">
            <div className="stat-row-item">
              <div className="stat-row-item__left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <span>Utilizados este mes</span>
              </div>
              <span className="stat-row-item__right">12,350</span>
            </div>

            <div className="stat-row-item">
              <div className="stat-row-item__left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Disponibles</span>
              </div>
              <span className="stat-row-item__right">37,650</span>
            </div>

            <div className="stat-row-item">
              <div className="stat-row-item__left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Renovación</span>
              </div>
              <span className="stat-row-item__right">01 jun 2024</span>
            </div>
          </div>
        </div>

        {/* Card 2: Módulos incluidos */}
        <div className="plan-card">
          <h3 className="plan-card__title">Módulos incluidos</h3>
          <div className="modules-check-list">
            {[
              'Dashboard Ejecutivo',
              'Reportes Avanzados',
              'Alertas y Notificaciones',
              'API de Integración',
              'Gestión de Usuarios',
            ].map((moduleName) => (
              <div key={moduleName} className="module-check-row">
                <div className="module-check-row__left">
                  <div className="check-icon-circle">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span>{moduleName}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Resumen del plan */}
        <div className="plan-card">
          <h3 className="plan-card__title">Resumen del plan</h3>
          <div className="plan-summary-list">
            <div className="plan-summary-row">
              <span>Nombre del plan</span>
              <span>Plan Corporativo</span>
            </div>
            <div className="plan-summary-row">
              <span>Estado</span>
              <span className="app-topbar__badge" style={{ display: 'inline-block' }}>Activo</span>
            </div>
            <div className="plan-summary-row">
              <span>Ciclo de facturación</span>
              <span>Mensual</span>
            </div>
            <div className="plan-summary-row">
              <span>Créditos incluidos</span>
              <span>50,000 créditos/mes</span>
            </div>
            <div className="plan-summary-row">
              <span>Precio</span>
              <span>USD $499.00/mes</span>
            </div>
            <div className="plan-summary-row">
              <span>Moneda</span>
              <span>USD</span>
            </div>
            <div className="plan-summary-row">
              <span>Descripción</span>
              <span>Plan corporativo para organizaciones con necesidades avanzadas.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card inferior: Historial de precios */}
      <div className="pricing-history-card">
        <h3 className="plan-card__title">Historial de precios</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="pricing-table">
            <thead>
              <tr>
                <th>Fecha de inicio</th>
                <th>Fecha de fin</th>
                <th>Precio (USD)</th>
                <th>Créditos incluidos</th>
                <th>Ciclo</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {priceHistory.map((row, index) => (
                <tr key={index}>
                  <td>{row.startDate}</td>
                  <td>{row.endDate}</td>
                  <td><strong>{row.price}</strong></td>
                  <td>{row.credits}</td>
                  <td>{row.cycle}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="action-dots-btn"
                      style={{ color: 'var(--color-brand)', margin: '0 auto' }}
                      title="Ver detalle"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pricing-info-note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>Los cambios en el plan se aplican al inicio del siguiente ciclo de facturación.</span>
        </div>
      </div>
    </AppShell>
  );
}
