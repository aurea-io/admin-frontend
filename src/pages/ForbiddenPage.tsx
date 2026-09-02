import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="error-screen">
      <aside className="error-branding">
        <div className="error-branding__badge">AUREA</div>
        <div className="error-branding__copy">
          <p className="error-branding__eyebrow">Acceso denegado</p>
          <h1>403</h1>
          <p className="error-branding__text">No tienes permiso para acceder a este recurso.</p>
        </div>
      </aside>

      <section className="error-panel">
        <div className="error-panel__header">
          <ThemeToggle />
        </div>

        <div className="error-panel__card">
          <div className="error-card__content">
            <h2>Acceso denegado</h2>
            <p>
              Tu rol o permisos no te permiten acceder a esta sección. 
              Si crees que esto es un error, por favor contacta al administrador.
            </p>
          </div>

          <div className="error-card__actions">
            <Button onClick={() => navigate('/platform/dashboard')}>
              Volver al dashboard
            </Button>
            <Button variant="secondary" onClick={() => navigate('/')}>
              Ir al inicio
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
