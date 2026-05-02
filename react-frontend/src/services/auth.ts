import { api } from "./api";

export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  role?: string;
  role_id?: number;
  role_name?: string;
  permissions?: string[];
  createdAt?: string;
}

export interface LoginData {
  identifier: string;
  code: string;
}

export interface LoginRequest {
  username: string;
  usercode: string;
}

export interface LoginResponse {
  message?: string;
  user?: User;
}

export const authService = {
  login: async (data: LoginData): Promise<LoginResponse> => {
    const loginRequest: LoginRequest = {
      username: data.identifier,
      usercode: data.code,
    };
    const response = await api.post("/auth/login", loginRequest);
    // JWT token is now set as httpOnly cookie by server, no need to store
    return response.data;
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
      // Server clears the httpOnly cookie, no need to remove from localStorage
    } catch (error) {
      console.error("Logout error:", error);
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  forgotusercode: async (email: string) => {
    const response = await api.post("/auth/forgotusercode", { email });
    return response.data;
  },

  resetusercode: async (token: string, usercode: string, confirmusercode: string) => {
    const response = await api.post("/auth/resetusercode", {
      token,
      usercode,
      confirm_usercode: confirmusercode,
    });
    return response.data;
  },

  changeUsercode: async (currentUsercode: string, newUsercode: string, confirmUsercode: string) => {
    const response = await api.post("/auth/change-usercode", {
      current_usercode: currentUsercode,
      new_usercode: newUsercode,
      confirm_usercode: confirmUsercode,
    });
    return response.data;
  },

  updateProfile: async (data: Partial<User>) => {
    const response = await api.put("/auth/me", data);
    return response.data;
  },
};

export default api;