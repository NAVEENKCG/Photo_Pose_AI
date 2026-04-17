// lib/api.ts - Centralized API client with JWT handling
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request Interceptor ─ Attach Access Token ─────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response Interceptor ─ Auto Refresh on 401 ───────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth Helpers ──────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
};

// ── Pose Helpers ──────────────────────────────────────────────────
export const posesApi = {
  analyze: (data: Record<string, unknown>) => api.post('/poses/analyze', data),
  history: (page = 1, limit = 20) => api.get(`/poses/history?page=${page}&limit=${limit}`),
  getById: (id: string) => api.get(`/poses/${id}`),
  delete: (id: string) => api.delete(`/poses/${id}`),
};

// ── Users Helpers ─────────────────────────────────────────────────
export const usersApi = {
  me: () => api.get('/users/me'),
  update: (data: { firstName?: string; lastName?: string }) => api.put('/users/me', data),
  stats: () => api.get('/users/me/stats'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/users/me/change-password', data),
};

export default api;
