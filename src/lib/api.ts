import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 15000,
  withCredentials: true,
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

type RetriableRequest = InternalAxiosRequestConfig & { _refreshRetried?: boolean };

const authPaths = ['/auth/login', '/auth/google', '/auth/refresh', '/auth/logout'];
let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = api.post<{ accessToken: string; user: import('../types/auth').UserSession }>('/auth/refresh')
      .then(({ data }) => {
        useAuthStore.getState().setSession(data.accessToken, data.user);
        return data.accessToken;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetriableRequest | undefined;
    const path = request?.url?.split('?')[0] ?? '';
    const skipRefresh = authPaths.some((authPath) => path.endsWith(authPath));

    if (error.response?.status === 401 && request && !request._refreshRetried && !skipRefresh) {
      request._refreshRetried = true;
      try {
        const token = await refreshAccessToken();
        request.headers.Authorization = `Bearer ${token}`;
        return api(request);
      } catch {
        await useAuthStore.getState().logout();
        if (window.location.pathname !== '/login') window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);

export const getAuthHeaders = () => {
  const token = useAuthStore.getState().accessToken;

  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default api;
