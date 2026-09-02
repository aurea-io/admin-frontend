import api from '../lib/api';
import type { AuthResponse, UserSession } from '../types/auth';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },

  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/google', { idToken });
    return response.data;
  },

  async getProfile(): Promise<UserSession> {
    const response = await api.get<UserSession>('/auth/me');
    return response.data;
  },
};
