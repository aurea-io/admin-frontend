import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Alert } from '../components/ui/Alert';
import { useAuthStore } from '../stores/authStore';
import { useCapabilitiesStore } from '../stores/capabilitiesStore';
import { authService } from '../services/auth.service';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setError = useAuthStore((state) => state.setError);
  const clearError = useAuthStore((state) => state.clearError);
  const setCapabilities = useCapabilitiesStore((state) => state.setCapabilities);

  const [formState, setFormState] = useState({
    email: '',
    password: '',
    touched: {
      email: false,
      password: false,
    },
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!formState.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      errors.email = 'Invalid email address format';
    }

    // Password validation
    if (!formState.password) {
      errors.password = 'Password is required';
    } else if (formState.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getErrorMessage = (): string => {
    switch (error) {
      case 'invalid_credentials':
        return 'Invalid email address or password. Please try again.';
      case 'user_inactive':
        return 'This account is inactive. Please contact support.';
      case 'network_error':
        return 'Network error. Please check your connection and try again.';
      case 'unknown_error':
        return 'An unexpected error occurred. Please try again.';
      default:
        return '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleFieldBlur = (field: 'email' | 'password') => {
    setFormState((prev) => ({
      ...prev,
      touched: {
        ...prev.touched,
        [field]: true,
      },
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Clear any previous errors
    clearError();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login(formState.email, formState.password);
      
      // Store session
      setSession(response.accessToken, response.user);
      
      // Fetch capabilities (optional - for future use)
      try {
        const capabilities = await authService.getCapabilities();
        setCapabilities(capabilities);
      } catch (err) {
        console.warn('Failed to load capabilities:', err);
        // Continue anyway, capabilities may not be available yet
      }

      // Redirect to original page or dashboard
      const from = (location.state as any)?.from || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setLoading(false);
      
      // Determine error type
      if (err.response?.status === 401) {
        setError('invalid_credentials');
      } else if (err.response?.status === 400) {
        setError('invalid_credentials');
      } else if (!err.response) {
        setError('network_error');
      } else {
        setError('unknown_error');
      }
    }
  };

  return (
    <div className="auth-screen">
      <aside className="auth-branding">
        <div className="auth-branding__badge">AUREA</div>
        <div className="auth-branding__copy">
          <p className="auth-branding__eyebrow">Platform access</p>
          <h1>Backoffice interno</h1>
          <p className="auth-branding__text">
            Administración central de tenants, módulos, planes y permisos.
          </p>
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
            <p className="auth-card__subtitle">Ingresa con tu email y contraseña</p>
          </div>

          {error && (
            <Alert tone="danger" className="auth-form__alert">
              {getErrorMessage()}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="tu@email.com"
              value={formState.email}
              onChange={handleInputChange}
              onBlur={() => handleFieldBlur('email')}
              error={formState.touched.email ? validationErrors.email : ''}
              disabled={isLoading}
              autoComplete="email"
              required
            />

            <Input
              label="Contraseña"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formState.password}
              onChange={handleInputChange}
              onBlur={() => handleFieldBlur('password')}
              error={formState.touched.password ? validationErrors.password : ''}
              disabled={isLoading}
              autoComplete="current-password"
              required
            />

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          <div className="auth-divider">
            <span>o continúa con</span>
          </div>

          <button
            type="button"
            className="auth-google-btn"
            disabled
            onClick={() => {
              // TODO: Implement Google login flow
              console.log('Google login clicked');
            }}
          >
            <svg className="auth-google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Google</span>
          </button>
        </div>
      </section>
    </div>
  );
}
