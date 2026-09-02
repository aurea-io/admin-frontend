import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useCapabilitiesStore } from '../stores/capabilitiesStore';
import { authService } from '../services/auth.service';

/**
 * Hook to initialize authentication context on app load.
 * This will fetch the user profile and capabilities if a valid session exists.
 */
export function useAuthInit() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setSession = useAuthStore((state) => state.setSession);
  const setError = useAuthStore((state) => state.setError);
  const setCapabilities = useCapabilitiesStore((state) => state.setCapabilities);

  useEffect(() => {
    // Only fetch if authenticated and we have a token
    if (!isAuthenticated) return;

    const fetchProfileAndCapabilities = async () => {
      try {
        // Optionally refresh profile from API
        // This helps detect if session is still valid
        // For now, we trust the stored session
        
        // Try to fetch capabilities
        const capabilities = await authService.getCapabilities();
        setCapabilities(capabilities);
      } catch (error) {
        console.warn('Failed to initialize auth context:', error);
        // Don't fail the whole app if capabilities fail to load
        // Capabilities may not be available in early stages
      }
    };

    fetchProfileAndCapabilities();
  }, [isAuthenticated, setCapabilities, setSession, setError]);
}
