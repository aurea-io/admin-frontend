import { useNavigate } from 'react-router-dom';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { AppShell } from '../components/layout/AppShell';
import { useAuthStore } from '../stores/authStore';

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getRoleBadgeTone = (role: string): 'success' | 'warning' | 'brand' | 'neutral' => {
    return role === 'platform_owner' ? 'success' : 'brand';
  };

  return (
    <AppShell
      pageTitle="Dashboard"
      topbarActions={
        <>
          <ThemeToggle />
          <Badge tone={getRoleBadgeTone(user?.role ?? '')}>{user?.role ?? 'usuario'}</Badge>
          <Button variant="secondary" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </>
      }
    >
      <div className="dashboard-grid">
        <Card className="panel">
          <h3>Bienvenido, {user?.name}</h3>
          <Alert tone="success">
            Sesión iniciada correctamente. Tienes acceso al backoffice AUREA con rol <strong>{user?.role}</strong>.
          </Alert>

          <div className="stat-grid">
            <div className="stat-box">
              <span>Rol</span>
              <strong>{user?.role}</strong>
            </div>
            <div className="stat-box">
              <span>Email</span>
              <strong>{user?.email}</strong>
            </div>
            <div className="stat-box">
              <span>Estado</span>
              <strong>{user?.isActive ? 'Activo' : 'Inactivo'}</strong>
            </div>
          </div>

          {user?.lastLoginAt && (
            <p className="text-sm text-muted">
              Último acceso: {new Date(user.lastLoginAt).toLocaleString('es-AR')}
            </p>
          )}
        </Card>

        <Card className="panel">
          <h3>Acciones rápidas</h3>
          <p className="text-muted">
            {user?.role === 'platform_owner' 
              ? 'Como owner, puedes administrar tenants, módulos y planes.'
              : 'Como operator, puedes consultar información de la plataforma.'}
          </p>
          <div className="component-row">
            {user?.role === 'platform_owner' && (
              <>
                <Button disabled>Nuevo tenant</Button>
                <Button variant="secondary" disabled>Ver planes</Button>
              </>
            )}
            {user?.role === 'platform_operator' && (
              <>
                <Button disabled>Ver tenants</Button>
                <Button variant="secondary" disabled>Ver planes</Button>
              </>
            )}
          </div>
        </Card>
      </div>

      <Card className="panel">
        <h3>Estado de la sesión</h3>
        <Table
          headers={['Propiedad', 'Valor']}
          rows={[
            <>
              <td>Usuario</td>
              <td>{user?.name} ({user?.email})</td>
            </>,
            <>
              <td>Rol</td>
              <td>
                <Badge tone={getRoleBadgeTone(user?.role ?? '')}>
                  {user?.role}
                </Badge>
              </td>
            </>,
            <>
              <td>Estado</td>
              <td>
                <Badge tone={user?.isActive ? 'success' : 'warning'}>
                  {user?.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </td>
            </>,
            <>
              <td>Capacidades permitidas</td>
              <td>{user?.allowedFeatures?.join(', ') || 'Ninguna'}</td>
            </>,
          ]}
        />
      </Card>
    </AppShell>
  );
}
