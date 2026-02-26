import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const AUTH_API_BASE_URL = 'http://localhost:8081';
const GATEWAY_API_BASE_URL = 'http://localhost:3000';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Extended request config type
type RequestConfig = AxiosRequestConfig & { _retry?: boolean };

// Token management functions
export const tokenStorage = {
  getAccessToken: (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clearTokens: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  hasTokens: (): boolean => {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY) && !!localStorage.getItem(REFRESH_TOKEN_KEY);
  },
};

// Create axios instance for auth service
export const authApi = axios.create({
  baseURL: AUTH_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Create axios instance for gateway/chat service
export const gatewayApi = axios.create({
  baseURL: GATEWAY_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add JWT token
const addAuthHeader = (config: AxiosRequestConfig): AxiosRequestConfig => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Track if we're currently refreshing to prevent multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle token refresh on 401
const handleResponseError = async (error: AxiosError) => {
  const originalRequest = error.config as RequestConfig;

  // If error is 401 and we haven't already retried
  if (error.response?.status === 401 && !originalRequest._retry) {
    if (isRefreshing) {
      // If we're already refreshing, queue this request
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return axios(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      tokenStorage.clearTokens();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      const response = await authApi.post('/api/v1/auth/token/refresh', {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      tokenStorage.setTokens(accessToken, newRefreshToken);

      processQueue(null, accessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      }
      return axios(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      tokenStorage.clearTokens();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }

  return Promise.reject(error);
};

// Apply interceptors
authApi.interceptors.request.use(addAuthHeader);
authApi.interceptors.response.use((response) => response, handleResponseError);

gatewayApi.interceptors.request.use(addAuthHeader);
gatewayApi.interceptors.response.use((response) => response, handleResponseError);

// Error handling utilities
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export function parseApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const response = error.response;
    if (response?.data) {
      const data = response.data;
      return {
        message: data.message || data.error || 'An error occurred',
        status: response.status,
        code: data.code,
      };
    }
    if (error.message === 'Network Error') {
      return {
        message: 'Unable to connect to the server. Please check your connection.',
        status: 0,
      };
    }
    return {
      message: error.message,
      status: response?.status,
    };
  }
  return {
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
  };
}
