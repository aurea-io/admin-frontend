import { create } from 'zustand';
import type { UserSession, LoginError } from '../types/auth';

interface AuthState {
  accessToken: string | null;
  user: UserSession | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  isLoading: boolean;
  error: LoginError | null;
  setSession: (accessToken: string, user: UserSession) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: LoginError | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  hydrated: false,
  isLoading: false,
  error: null,
  
  setSession: (accessToken: string, user: UserSession) => {
    set({ accessToken, user, isAuthenticated: true, hydrated: true, error: null });
  },
  
  logout: async () => {
    try {
      const { authService } = await import('../services/auth.service');
      await authService.logout();
    } catch {
      // Local cleanup is required even when the server is unreachable.
    }
    set({ 
      accessToken: null, 
      user: null, 
      isAuthenticated: false, 
      hydrated: true,
      error: null,
      isLoading: false,
    });
  },
  
  hydrate: async () => {
    set({ isLoading: true });
    try {
      const { authService } = await import('../services/auth.service');
      const { accessToken, user } = await authService.refresh();
      set({
        accessToken,
        user,
        isAuthenticated: true,
        hydrated: true,
        isLoading: false,
      });
    } catch {
      set({ 
        accessToken: null, 
        user: null, 
        isAuthenticated: false, 
        hydrated: true,
        isLoading: false,
      });
    }
  },
  
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  setError: (error: LoginError | null) => {
    set({ error });
  },
  
  clearError: () => {
    set({ error: null });
  },
}));
