import { type FormEvent } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuthStore } from '../stores/authStore';

export function LoginPage() {
  const setSession = useAuthStore((state) => state.setSession);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSession('demo-token', {
      id: 'demo-user',
      email: 'owner@example.com',
      name: 'Platform Owner',
      role: 'platform_owner',
      allowedFeatures: ['plans', 'tenants', 'modules'],
      isActive: true,
      lastLoginAt: new Date().toISOString(),
    });
  };

  return (
    <div className="auth-screen">
      <aside className="auth-branding">
        <div className="auth-branding__badge">AUREA</div>
        <div className="auth-branding__copy">
          <p className="auth-branding__eyebrow">Platform access</p>
          <h1>Backoffice interno</h1>
          <p className="auth-branding__text">Administración central de tenants, módulos, planes y permisos.</p>
        </div>
      </aside>

      <section className="auth-panel">
        <div className="auth-panel__header">
          <ThemeToggle />
        </div>

        <div className="auth-panel__card">
          <div className="auth-card__header">
            <Badge tone="brand">Ingresar</Badge>
            <h2>Bienvenido</h2>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <Input label="Email" type="email" placeholder="tu@email.com" />
            <Input label="Contraseña" type="password" placeholder="••••••••" />
            <Button type="submit" className="w-full">Ingresar</Button>
          </form>
        </div>
      </section>
    </div>
  );
}
