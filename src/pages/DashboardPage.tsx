import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { AppShell } from '../components/layout/AppShell';
import { useAuthStore } from '../stores/authStore';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <AppShell
      pageTitle="Dashboard"
      topbarActions={
        <>
          <ThemeToggle />
          <Badge tone="success">{user?.role ?? 'platform_operator'}</Badge>
          <Button variant="secondary" onClick={logout}>Cerrar sesión</Button>
        </>
      }
    >
      <div className="dashboard-grid">
        <Card className="panel">
          <h3>Estado de plataforma</h3>
          <Alert tone="success">Sistema operativo y autenticación listos para continuar.</Alert>

          <div className="stat-grid">
            <div className="stat-box">
              <span>Usuarios</span>
              <strong>1,284</strong>
            </div>
            <div className="stat-box">
              <span>Tenants</span>
              <strong>42</strong>
            </div>
            <div className="stat-box">
              <span>Módulos</span>
              <strong>12</strong>
            </div>
          </div>
        </Card>

        <Card className="panel">
          <h3>Acciones rápidas</h3>
          <div className="component-row">
            <Button>Nuevo tenant</Button>
            <Button variant="secondary">Ver planes</Button>
            <Button variant="danger">Revisión</Button>
          </div>
          <div className="component-row">
            <Badge tone="brand">Brand</Badge>
            <Badge tone="success">Success</Badge>
            <Badge tone="warning">Warning</Badge>
          </div>
        </Card>
      </div>

      <Card className="panel">
        <h3>Resumen</h3>
        <Table
          headers={['Nombre', 'Rol', 'Estado']}
          rows={[
            <>
              <td>Platform Owner</td>
              <td>platform_owner</td>
              <td><Badge tone="success">activo</Badge></td>
            </>,
            <>
              <td>Platform Operator</td>
              <td>platform_operator</td>
              <td><Badge tone="warning">pendiente</Badge></td>
            </>,
          ]}
        />
      </Card>
    </AppShell>
  );
}
