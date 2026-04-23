import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL+"/api" || "http://localhost:8060/api";
const API_PUBLIC_URL = import.meta.env.VITE_API_URL+"/api" || "http://localhost:8060/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const publicApi = axios.create({
  baseURL: API_PUBLIC_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const tokenService = {
  getToken: () => localStorage.getItem("token"),
  setToken: (token: string) => localStorage.setItem("token", token),
  removeToken: () => localStorage.removeItem("token"),
};

api.interceptors.request.use((config) => {
  const token = tokenService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

publicApi.interceptors.request.use((config) => {
  const token = tokenService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (!error.response) {
      console.error("Network error - no response:", error.message);
    } else if (status === 401) {
      tokenService.removeToken();
      window.location.href = "/login";
    } else if (status === 403) {
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