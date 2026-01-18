import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";

// Use full backend URL from environment
// Production: direct cross-origin (Vercel → Railway)
// Development: proxy rewrite (localhost:3000/api → localhost:8000/api)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Track if we're currently refreshing to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Check if error is a true auth failure (not server error)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isAuthError = (error: AxiosError): boolean => {
  if (error.response?.status !== 401) return false;

  // Check if it's a real auth error from our backend
  const detail = (error.response?.data as { detail?: string })?.detail || "";
  const authMessages = [
    "not authenticated",
    "invalid or expired",
    "refresh token not found",
    "please login",
    "user not found"
  ];

  return authMessages.some(msg => detail.toLowerCase().includes(msg));
};

// Check if error is a server/DB error (should NOT redirect)
const isServerError = (error: AxiosError): boolean => {
  const status = error.response?.status;
  // 500, 502, 503, 504 = server errors, network errors
  return !status || status >= 500 || error.code === "ERR_NETWORK";
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // CRITICAL: Send cookies with requests
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Skip refresh for /refresh endpoint to prevent infinite loops
    // (Other /auth/ endpoints like /auth/me SHOULD trigger refresh)
    const isRefreshEndpoint = originalRequest?.url?.includes('/auth/refresh');

    // If server/DB error, show friendly message - don't redirect, don't try refresh
    if (isServerError(error)) {
      if (error.code === "ERR_NETWORK") {
        toast.error("Connection failed. Please check your internet.");
      } else if (error.response?.status === 503) {
        toast.error("Server temporarily unavailable. Please try again.");
      }
      return Promise.reject(error);
    }

    // Only try refresh on true 401 auth errors (but not for /refresh endpoint itself)
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshEndpoint) {
      if (isRefreshing) {
        // ✅ FIX: Queue requests while refresh is in progress
        // This prevents multiple simultaneous refresh attempts
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // ✅ FIX: Add explicit timeout and error handling for refresh
        // If refresh takes too long, fail fast instead of hanging
        const refreshPromise = axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          {
            withCredentials: true,
            timeout: 10000 // 10 second timeout for refresh
          }
        );

        await refreshPromise;

        // ✅ FIX: Process queue BEFORE retrying original request
        // This ensures all queued requests use the new token
        processQueue(null);

        // Retry the original request with new token from cookies
        return apiClient(originalRequest);
      } catch (refreshError) {
        const refreshErr = refreshError as AxiosError;

        // ✅ FIX: Process failed queue with explicit error
        processQueue(refreshErr);

        // Only redirect if refresh actually failed with auth error (not server error)
        // Server errors during refresh should NOT cause logout
        if (!isServerError(refreshErr) && typeof window !== "undefined") {
          const isOnAuthPage = window.location.pathname.includes('/login') ||
                               window.location.pathname.includes('/register') ||
                               window.location.pathname.includes('/forgot-password') ||
                               window.location.pathname.includes('/reset-password') ||
                               window.location.pathname === '/';

          if (!isOnAuthPage) {
            // ✅ FIX: Add small delay before redirect to allow toasts to show
            setTimeout(() => {
              window.location.href = "/login";
            }, 500);
          }
        }
        return Promise.reject(refreshError);
      } finally {
        // ✅ FIX: ALWAYS reset isRefreshing flag, even if refresh failed
        // This allows next 401 to trigger a fresh refresh attempt
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
