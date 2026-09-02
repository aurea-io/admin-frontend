import api, { refreshAccessToken } from '../lib/api';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
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

  async refresh(): Promise<AuthResponse> {
    return refreshAccessToken();
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getCapabilities(): Promise<CapabilitiesResponse> {
    try {
      const response = await api.get<CapabilitiesResponse>('/auth/capabilities');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        useAuthStore.getState().logout();
      } else {
        console.warn('Capabilities endpoint not available yet');
      }
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
