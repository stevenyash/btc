import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  adminService,
  type AdminStats,
  type RecentUser,
  type RecentTransaction,
  type SubscriptionPackage,
} from "@/services/admin";

interface AdminState {
  stats: AdminStats;
  recentUsers: RecentUser[];
  recentTransactions: RecentTransaction[];
  subscriptionPackages: SubscriptionPackage[];
  
  isLoading: boolean;
  error: string | null;
  
  fetchStats: () => Promise<void>;
  fetchRecentUsers: () => Promise<void>;
  fetchRecentTransactions: () => Promise<void>;
  fetchSubscriptionPackages: () => Promise<void>;
  fetchAllData: () => Promise<void>;
  clearError: () => void;
}

const initialState = {
  stats: {
    totalUsers: 0,
    activeUsers: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    monthlyGrowth: 0,
  },
  recentUsers: [],
  recentTransactions: [],
  subscriptionPackages: [],
  isLoading: false,
  error: null,
};

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchStats: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await adminService.getStats();
          set({ stats: data, isLoading: false });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to fetch stats";
          set({ error: message, isLoading: false });
        }
      },

      fetchRecentUsers: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await adminService.getRecentUsers(10);
          set({ recentUsers: data, isLoading: false });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to fetch recent users";
          set({ error: message, isLoading: false });
        }
      },

      fetchRecentTransactions: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await adminService.getRecentTransactions(10);
          set({ recentTransactions: data, isLoading: false });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to fetch recent transactions";
          set({ error: message, isLoading: false });
        }
      },

      fetchSubscriptionPackages: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await adminService.getSubscriptionPackages();
          set({ subscriptionPackages: data, isLoading: false });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to fetch subscription packages";
          set({ error: message, isLoading: false });
        }
      },

      fetchAllData: async () => {
        await Promise.all([
          get().fetchStats(),
          get().fetchRecentUsers(),
          get().fetchRecentTransactions(),
          get().fetchSubscriptionPackages(),
        ]);
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "admin-storage",
      partialize: (state) => ({
        stats: state.stats,
      }),
    }
  )
);
