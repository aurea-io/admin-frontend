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

const STORAGE_KEY = 'aurea_admin_session';

function getStoredSession(): { accessToken: string; user: UserSession } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const initial = getStoredSession();

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: initial?.accessToken || null,
  user: initial?.user || null,
  isAuthenticated: !!initial?.accessToken,
  hydrated: !!initial?.accessToken,
  isLoading: false,
  error: null,
  
  setSession: (accessToken: string, user: UserSession) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken, user }));
    set({ accessToken, user, isAuthenticated: true, hydrated: true, error: null });
  },
  
  logout: async () => {
    localStorage.removeItem(STORAGE_KEY);
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
    const stored = getStoredSession();
    if (stored?.accessToken && stored?.user) {
      set({
        accessToken: stored.accessToken,
        user: stored.user,
        isAuthenticated: true,
        hydrated: true,
        isLoading: false,
      });
      return;
    }

    set({ isLoading: true });
    try {
      const { authService } = await import('../services/auth.service');
      const { accessToken, user } = await authService.refresh();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken, user }));
      set({
        accessToken,
        user,
        isAuthenticated: true,
        hydrated: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
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
