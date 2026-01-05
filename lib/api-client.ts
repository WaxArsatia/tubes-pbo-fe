import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/**
 * API Client Configuration
 * Base URL from environment variable
 * Implements request/response interceptors per docs/00_GENERAL_FRONTEND_API.md
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

// Standard timeout: 30 seconds
const DEFAULT_TIMEOUT = 30000;

// File upload timeout: 120 seconds
export const UPLOAD_TIMEOUT = 120000;

/**
 * Create axios instance with base configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Attaches Authorization header from localStorage if token exists
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      // Check token expiry
      const tokenExpiry = localStorage.getItem('tokenExpiry');
      if (tokenExpiry) {
        const expiryTime = new Date(tokenExpiry).getTime();
        const currentTime = Date.now();
        
        // If token is expired, don't attach it
        if (currentTime >= expiryTime) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('tokenExpiry');
          // Redirect to login will be handled by response interceptor
        } else {
          // Attach valid token
          config.headers.Authorization = `Bearer ${token}`;
        }
      } else {
        // If no expiry set, attach token anyway
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles global error responses, especially 401 (Unauthorized)
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized - clear storage and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tokenExpiry');
      
      // Only redirect if not already on login/register pages
      if (globalThis.window !== undefined) {
        const currentPath = globalThis.window.location.pathname;
        if (!currentPath.startsWith('/login') && 
            !currentPath.startsWith('/register') && 
            !currentPath.startsWith('/verify') &&
            !currentPath.startsWith('/forgot-password') &&
            !currentPath.startsWith('/reset-password')) {
          globalThis.window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Create instance for file uploads with extended timeout
 */
export const createUploadClient = (): AxiosInstance => {
  const uploadClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: UPLOAD_TIMEOUT,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  // Apply same interceptors
  uploadClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    }
  );

  uploadClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tokenExpiry');
        if (globalThis.window !== undefined) {
          globalThis.window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return uploadClient;
};

export default apiClient;
