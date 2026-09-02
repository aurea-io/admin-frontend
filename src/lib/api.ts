import axios, { type AxiosError } from 'axios';
import { env } from '../config/env';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);

export const getAuthHeaders = () => {
  const token = useAuthStore.getState().accessToken;

  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default api;
