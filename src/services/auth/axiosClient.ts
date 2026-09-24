import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const globalAccess = globalThis as typeof globalThis & { __accessToken?: string | null };

let refreshSubscriber: ((token: string) => void)[] = [];
let isRefreshing = false;
let inMemoryToken: string | null = globalAccess.__accessToken || null;

export function getAccessToken() {
  return inMemoryToken || globalAccess.__accessToken || null;
}

export function setAccessToken(token: string | null) {
  inMemoryToken = token;
  globalAccess.__accessToken = token;
}

export const DEFAULT_API_TIMEOUT_MS = 15000;

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

axiosClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/api/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscriber.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axiosClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = response.data.accessToken;
        setAccessToken(newAccessToken);

        refreshSubscriber.forEach((callback) => callback(newAccessToken));
        refreshSubscriber = [];

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        refreshSubscriber = [];
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
