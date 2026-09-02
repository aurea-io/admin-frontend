import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="error-screen">
      <aside className="error-branding">
        <div className="error-branding__badge">AUREA</div>
        <div className="error-branding__copy">
          <p className="error-branding__eyebrow">Página no encontrada</p>
          <h1>404</h1>
          <p className="error-branding__text">La página que buscas no existe.</p>
        </div>
      </aside>

      <section className="error-panel">
        <div className="error-panel__header">
          <ThemeToggle />
        </div>

        <div className="error-panel__card">
          <div className="error-card__content">
            <h2>Página no encontrada</h2>
            <p>
              La URL que intentaste acceder no existe o ha sido movida. 
              Verifica la dirección y vuelve a intentar.
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
