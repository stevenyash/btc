import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService, tokenService, type User, type LoginData } from "@/services/auth";
import { useSubscriptionStore } from "./useSubscriptionStore";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  permissions: string[];

  login: (credentials: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: (forceRefresh?: boolean) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  resetusercode: (token: string, usercode: string, confirmusercode: string) => Promise<void>;
  forgotusercode: (email: string) => Promise<void>;
  changeUsercode: (currentUsercode: string, newUsercode: string, confirmUsercode: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  hasRole: (roleName: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      permissions: [],

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          await authService.login(credentials);
          // Fetch user with permissions
          const user = await authService.getCurrentUser();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            permissions: user.permissions || [],
          });
          // Fetch subscription details after successful login
          const subscriptionStore = useSubscriptionStore.getState();
          await subscriptionStore.fetchSubscriberDetails();
        } catch (error: unknown) {
          // Extract error message from axios response
          let message = "Login failed";
          if (error && typeof error === "object" && "response" in error) {
            const axiosError = error as { response?: { data?: { error?: string } } };
            message = axiosError.response?.data?.error || "Login failed";
          } else if (error instanceof Error) {
            message = error.message;
          }
          set({
            error: message,
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          tokenService.removeToken();
          // Clear subscription data on logout
          const subscriptionStore = useSubscriptionStore.getState();
          subscriptionStore.clearSubscription();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            permissions: [],
          });
        }
      },

      getCurrentUser: async (forceRefresh = false) => {
        const currentUser = get().user;
        
        // If user exists and has role, and not forcing refresh, skip
        if (!forceRefresh && currentUser?.role_name) return;

        const token = tokenService.getToken();
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        try {
          const user = await authService.getCurrentUser();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            permissions: user.permissions || [],
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to get user";
          tokenService.removeToken();
          set({
            error: message,
            isLoading: false,
            isAuthenticated: false,
            user: null,
          });
        }
      },

  forgotusercode: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await authService.forgotusercode(email);
      set({ isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to send reset email";
      set({
        error: message,
        isLoading: false,
      });
      throw error;
    }
  },

  changeUsercode: async (currentUsercode: string, newUsercode: string, confirmUsercode: string) => {
    set({ isLoading: true, error: null });
    try {
      await authService.changeUsercode(currentUsercode, newUsercode, confirmUsercode);
      set({ isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to change usercode";
      set({
        error: message,
        isLoading: false,
      });
      throw error;
    }
  },

  updateProfile: async (data: Partial<User>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.updateProfile(data);
      // Update user in store
      set({ user: { ...get().user, ...response } as User, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update profile";
      set({
        error: message,
        isLoading: false,
      });
      throw error;
    }
  },

      resetusercode: async (token, usercode, confirmusercode) => {
        set({ isLoading: true, error: null });
        try {
          await authService.resetusercode(token, usercode, confirmusercode);
          set({ isLoading: false });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to reset usercode";
          set({
            error: message,
            isLoading: false,
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      hasRole: (roleName: string) => {
        const { user } = get();
        if (!user) return false;
        const userRole = user.role?.toLowerCase() || user.role_name?.toLowerCase();
        return userRole === roleName.toLowerCase() || 
               (roleName === "admin" && (userRole === "admin" || userRole === "superuser" || userRole === "superadmin")) ||
               (roleName === "subscriber" && (userRole === "subscriber" || userRole === "student")) ||
               (roleName === "marketer" && userRole === "marketer");
      },

      hasPermission: (permission: string) => {
        const { user, permissions } = get();
        if (!user) return false;
        if (permissions.length > 0) {
          return permissions.includes(permission);
        }
        if (user.permissions && user.permissions.length > 0) {
          return user.permissions.includes(permission);
        }
        return false;
      },

      refreshUser: async () => {
        const token = tokenService.getToken();
        if (!token) return;
        set({ isLoading: true });
        try {
          const user = await authService.getCurrentUser();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          tokenService.removeToken();
          set({
            isLoading: false,
            isAuthenticated: false,
            user: null,
          });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        permissions: state.permissions,
      }),
    }
  )
);