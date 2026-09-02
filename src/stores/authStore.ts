import { create } from 'zustand';
import type { UserSession } from '../types/auth';

interface AuthState {
  accessToken: string | null;
  user: UserSession | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  setSession: (accessToken: string, user: UserSession) => void;
  logout: () => void;
  hydrate: () => void;
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
  setSession: (accessToken: string, user: UserSession) => {
    localStorage.setItem(STORAGE_KEYS.token, accessToken);
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(user));

    set({ accessToken, user, isAuthenticated: true, hydrated: true });
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.session);

    set({ accessToken: null, user: null, isAuthenticated: false, hydrated: true });
  },
  hydrate: () => {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    const rawUser = localStorage.getItem(STORAGE_KEYS.session);

    if (!token || !rawUser) {
      set({ accessToken: null, user: null, isAuthenticated: false, hydrated: true });
      return;
    }

    try {
      const user = JSON.parse(rawUser) as UserSession;
      set({ accessToken: token, user, isAuthenticated: true, hydrated: true });
    } catch {
      localStorage.removeItem(STORAGE_KEYS.token);
      localStorage.removeItem(STORAGE_KEYS.session);
      set({ accessToken: null, user: null, isAuthenticated: false, hydrated: true });
    }
  },
}));
