import api from '../lib/api';
import type { AuthResponse, UserSession, CapabilitiesResponse } from '../types/auth';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', { 
      email: email.toLowerCase().trim(), 
      password 
    });
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

  async getCapabilities(): Promise<CapabilitiesResponse> {
    try {
      const response = await api.get<CapabilitiesResponse>('/auth/capabilities');
      return response.data;
    } catch (error) {
      // If capabilities endpoint doesn't exist yet, return empty object
      console.warn('Capabilities endpoint not available yet', error);
      return {};
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ accessToken: string; user: UserSession }> {
    const response = await api.post<{ accessToken: string; user: UserSession }>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};
