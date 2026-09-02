import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { useAuthStore } from './stores/authStore';
import { Loader } from './components/ui/Loader';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { TenantsPage } from './pages/TenantsPage';
import { PlatformCatalogPage } from './pages/PlatformCatalogPage';

function AppRoutes() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return <div className="page-shell page-shell--centered"><Loader size="lg" /></div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Platform scope routes */}
        <Route
          path="/platform/dashboard"
          element={
            <ProtectedRoute requiredRole={['platform_owner', 'platform_operator']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/platform/tenants"
          element={
            <ProtectedRoute requiredRole={['platform_owner', 'platform_operator']}>
              <TenantsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/platform/catalog"
          element={
            <ProtectedRoute requiredRole={['platform_owner', 'platform_operator']}>
              <PlatformCatalogPage />
            </ProtectedRoute>
          }
        />

        {/* Root redirect */}
        <Route path="/" element={
          <ProtectedRoute>
            <Navigate to="/platform/dashboard" replace />
          </ProtectedRoute>
        } />

        {/* Error pages */}
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/404" element={<NotFoundPage />} />

        {/* Catch all - 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return <AppRoutes />;
}
