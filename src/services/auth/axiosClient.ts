import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const globalAccess = globalThis as typeof globalThis & { __accessToken?: string | null };

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

export interface RefreshedSession {
  accessToken: string
  user: unknown
}

let refreshInFlight: Promise<RefreshedSession> | null = null

/**
 * Single-flight session refresh. The refresh token rotates on every use, so two
 * concurrent refresh calls (React StrictMode, several 401s at once, app launch +
 * interceptor) would otherwise race and one would be rejected as revoked,
 * logging the user out. All callers share one request.
 */
export function refreshSession(): Promise<RefreshedSession> {
  if (refreshInFlight) return refreshInFlight
  const request: Promise<RefreshedSession> = axios
      .post(`${API_BASE_URL}/api/auth/refresh`, {}, { withCredentials: true, timeout: DEFAULT_API_TIMEOUT_MS })
      .then((response) => {
        const data = response.data
        if (!data || data.success === false || typeof data.accessToken !== 'string' || !data.accessToken) {
          throw new Error(data?.message || 'Session expired')
        }
        setAccessToken(data.accessToken)
        return { accessToken: data.accessToken, user: data.user }
      })
      .catch((error) => {
        setAccessToken(null)
        throw error
      })
      .finally(() => {
        refreshInFlight = null
      })
  refreshInFlight = request
  return request
}

// A 401 from these endpoints means bad credentials, not an expired session.
const NO_REFRESH_PATHS = ['/api/auth/refresh', '/api/auth/login', '/api/auth/social-login', '/api/auth/phone/', '/api/auth/register']

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (NO_REFRESH_PATHS.some((path) => originalRequest.url?.includes(path))) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      try {
        const { accessToken } = await refreshSession();
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
