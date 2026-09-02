import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Alert } from '../components/ui/Alert';
import { useAuthStore } from '../stores/authStore';
import { useCapabilitiesStore } from '../stores/capabilitiesStore';
import { authService } from '../services/auth.service';
import { env } from '../config/env';

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
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!env.googleClientId || !googleButtonRef.current) return;

    const renderGoogleButton = () => {
      if (!window.google || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: env.googleClientId,
        callback: (response) => {
          if (!response.credential || isLoading) return;
          setLoading(true);
          clearError();
          authService.loginWithGoogle(response.credential)
            .then(async (session) => {
              setSession(session.accessToken, session.user);
              try {
                const capabilities = await authService.getCapabilities();
                setCapabilities(capabilities);
              } finally {
                navigate('/platform/dashboard', { replace: true });
              }
            })
            .catch((error: any) => {
              const status = error?.response?.status;
              setError(status === 401 ? 'invalid_credentials' : !error?.response ? 'network_error' : 'unknown_error');
            })
            .finally(() => setLoading(false));
        },
      });
      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: 420,
        text: 'continue_with',
      });
    };

    if (window.google) {
      renderGoogleButton();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    script.onerror = () => setError('network_error');
    document.head.appendChild(script);
    return () => script.remove();
  }, [clearError, isLoading, navigate, setCapabilities, setError, setLoading, setSession]);

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

          {env.googleClientId ? (
            <div ref={googleButtonRef} className="auth-google-btn" aria-label="Continuar con Google" />
          ) : (
            <p className="auth-card__subtitle">Google no está configurado en este entorno.</p>
          )}
        </div>
      </section>
    </div>
  );
}
