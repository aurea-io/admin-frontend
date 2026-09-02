import { useEffect, useState } from 'react';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Loader } from '../components/ui/Loader';
import { Table } from '../components/ui/Table';
import { AppShell } from '../components/layout/AppShell';
import { platformService } from '../services/platform.service';
import type { PlatformTenant } from '../types/platform';

export function TenantsPage() {
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    platformService.getTenants().then(setTenants).catch(() => setError('No se pudieron cargar los tenants.')).finally(() => setLoading(false));
  }, []);

  return <AppShell pageTitle="Tenants">
    <Card className="panel">
      <h3>Directorio global</h3>
      {loading && <Loader size="lg" />}
      {error && <Alert tone="danger">{error}</Alert>}
      {!loading && !error && <Table headers={['Comercio', 'Vertical', 'Estado', 'Mantenimiento']} rows={tenants.map((tenant) => <tr key={tenant.id}>
        <td>{tenant.name}<br /><span className="text-muted">{tenant.slug}</span></td>
        <td>{tenant.vertical}</td>
        <td><Badge tone={tenant.isActive ? 'success' : 'warning'}>{tenant.isActive ? 'Activo' : 'Inactivo'}</Badge></td>
        <td>{tenant.maintenanceMode ? tenant.maintenanceMessage || 'Activo' : 'No'}</td>
      </tr>)} />}
    </Card>
  </AppShell>;
}
