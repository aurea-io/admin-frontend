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
  logout: () => void;
  hydrate: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: LoginError | null) => void;
  clearError: () => void;
}

const STORAGE_KEYS = {
  token: 'aurea-access-token',
  session: 'aurea-session',
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  hydrated: false,
  isLoading: false,
  error: null,
  
  setSession: (accessToken: string, user: UserSession) => {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(user));

    set({ accessToken, user, isAuthenticated: true, hydrated: true, error: null });
  },
  
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.session);

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
    localStorage.removeItem(STORAGE_KEYS.token);
    const rawUser = localStorage.getItem(STORAGE_KEYS.session);

    if (!rawUser) {
      set({ 
        accessToken: null, 
        user: null, 
        isAuthenticated: false, 
        hydrated: true,
        isLoading: false,
      });
      return;
    }

    try {
      JSON.parse(rawUser) as UserSession;
      set({
        accessToken: null,
        user: null,
        isAuthenticated: false,
        hydrated: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem(STORAGE_KEYS.token);
      localStorage.removeItem(STORAGE_KEYS.session);
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
