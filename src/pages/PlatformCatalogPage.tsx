import { useEffect, useState } from 'react';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Loader } from '../components/ui/Loader';
import { Table } from '../components/ui/Table';
import { AppShell } from '../components/layout/AppShell';
import { platformService } from '../services/platform.service';
import type { PlatformFeature, PlatformPlan } from '../types/platform';

export function PlatformCatalogPage() {
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [features, setFeatures] = useState<PlatformFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([platformService.getPlans(), platformService.getFeatures()])
      .then(([loadedPlans, loadedFeatures]) => { setPlans(loadedPlans); setFeatures(loadedFeatures); })
      .catch(() => setError('No se pudo cargar el catálogo platform.'))
      .finally(() => setLoading(false));
  }, []);

  return <AppShell pageTitle="Catálogo platform">
    <div className="dashboard-grid">
      <Card className="panel">
        <h3>Planes comerciales</h3>
        {loading ? <Loader size="lg" /> : <Table headers={['Plan', 'Módulos', 'Estado']} rows={plans.map((plan) => <tr key={plan.id}>
          <td><strong>{plan.name}</strong><br /><span className="text-muted">{plan.key}</span></td>
          <td>{plan.includedFeatures.join(', ') || 'Sin módulos'}</td>
          <td><Badge tone={plan.isActive ? 'success' : 'warning'}>{plan.isActive ? 'Activo' : 'Inactivo'}</Badge></td>
        </tr>)} />}
      </Card>
      <Card className="panel">
        <h3>Features disponibles</h3>
        {loading ? <Loader size="lg" /> : <Table headers={['Key', 'Nombre']} rows={features.map((feature) => <tr key={feature.id}>
          <td><code>{feature.key}</code></td><td>{feature.label}</td>
        </tr>)} />}
      </Card>
    </div>
    {error && <Alert tone="danger">{error}</Alert>}
  </AppShell>;
}
