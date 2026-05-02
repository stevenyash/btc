import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL+"/api" || "http://localhost:8060/api";
const API_PUBLIC_URL = import.meta.env.VITE_API_URL+"/api" || "http://localhost:8060/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,  // Send cookies automatically
  headers: {
    "Content-Type": "application/json",
  },
});

const publicApi = axios.create({
  baseURL: API_PUBLIC_URL,
  withCredentials: true, // Send cookies for cross-origin requests
});

// Cookie utility functions to read CSRF token
export const cookieService = {
  getCsrfToken: (): string | null => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf_token='))
      ?.split('=')[1] || null;
  },
  clearToken: () => {
    // Not needed since server clears cookie on logout
    // This is here for backward compatibility
    console.log('Token cleared via server logout');
  },
};

// Request interceptor - add CSRF token for state-changing methods
api.interceptors.request.use((config) => {
  // For state-changing methods, add CSRF token header
  if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
    const csrfToken = cookieService.getCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }
  return config;
});

publicApi.interceptors.request.use((config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
    const csrfToken = cookieService.getCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    // For FormData, don't set Content-Type to allow browser to set boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
  }
  return config;
});

publicApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const config = error.response?.config;

    if (!error.response) {
      console.error("Network error - no response:", error.message);
    } else if (status === 429) {
      const retryAfter = error.response?.headers?.['retry-after'];
      error.isRateLimit = true;
      error.retryAfter = retryAfter;
    } else if (status === 401) {
      // Token is in httpOnly cookie, no need to remove from localStorage
      // Just redirect to login page
      window.location.href = "/login";
    } else if (status === 403) {
      if (config?.url && config.url.includes('/lessons/stream-url/')) {
        return Promise.reject(error);
      }
      window.location.href = "/unauthorized";
    } else if (status === 500) {
      console.error("Server error 500:", error.response?.data);
    }

    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const config = error.response?.config;

    if (!error.response) {
      console.error("Network error - no response:", error.message);
    } else if (status === 429) {
      const retryAfter = error.response?.headers?.['retry-after'];
      error.isRateLimit = true;
      error.retryAfter = retryAfter;
    } else if (status === 401) {
      window.location.href = "/login";
    } else if (status === 403) {
      if (config?.url && config.url.includes('/lessons/stream-url/')) {
        return Promise.reject(error);
      }
      window.location.href = "/unauthorized";
    } else if (status === 500) {
      console.error("Server error 500:", error.response?.data);
    }

    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  data: T;
  total?: number;
}

export const apiService = {
  get: async <T>(endpoint: string, params?: Record<string, unknown>): Promise<T> => {
    const response = await api.get(endpoint, { params });
    return response.data;
  },

  post: async <T>(endpoint: string, data?: unknown): Promise<T> => {
    const response = await api.post(endpoint, data);
    return response.data;
  },

  put: async <T>(endpoint: string, data?: unknown): Promise<T> => {
    const response = await api.put(endpoint, data);
    return response.data;
  },

  delete: async (endpoint: string): Promise<void> => {
    await api.delete(endpoint);
  },
};

export { api, publicApi };