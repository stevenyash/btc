import { api, tokenService } from "./api";
export { api, tokenService };

export type { User, LoginData, RegisterData, LoginResponse, LoginRequest };

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

export interface RegisterData {
  username: string;
  email: string;
  phone: string;
  usercode: string;
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
  token: string;
  user?: User;
}

export const authService = {
  register: async (data: RegisterData) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  login: async (data: LoginData): Promise<LoginResponse> => {
    const loginRequest: LoginRequest = {
      username: data.identifier,
      usercode: data.code,
    };
    const response = await api.post("/auth/login", loginRequest);
    if (response.data.token) {
      tokenService.setToken(response.data.token);
    }
    return response.data;
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      tokenService.removeToken();
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