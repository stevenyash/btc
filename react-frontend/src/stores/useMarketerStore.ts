import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  marketerService,
  type MarketerDashboardData,
  type MarketerPerformanceData,
  type MarketerActivityItem,
  type MarketerEarningsSummary,
  type MarketerCommission,
} from "@/services/marketer";

interface MarketerState {
  dashboardData: MarketerDashboardData;
  performanceData: MarketerPerformanceData;
  recentActivity: MarketerActivityItem[];
  earningsSummary: MarketerEarningsSummary;
  recentCommissions: MarketerCommission[];
  invitesCount: number;
  activeReferralsCount: number;
  
  isLoading: boolean;
  error: string | null;
  
  fetchAllData: () => Promise<void>;
  fetchEarningsSummary: () => Promise<void>;
  clearError: () => void;
}

const initialState = {
  dashboardData: {
    conversion_rate: 0,
    active_referrals: 0,
    weekly_growth: 0,
    total_invites: 0,
  },
  performanceData: {
    weekly_invites: 0,
    monthly_conversions: 0,
    monthly_points: 0,
    target_progress: 0,
  },
  recentActivity: [],
  earningsSummary: {
    total_points: 0,
    redeemed_points: 0,
    available_points: 0,
    point_value: 10,
    potential_cash: 0,
    commission_rate: 0.1,
    total_earnings: 0,
    pending_earnings: 0,
    withdrawn_earnings: 0,
  },
  recentCommissions: [],
  invitesCount: 0,
  activeReferralsCount: 0,
  isLoading: false,
  error: null,
};

export const useMarketerStore = create<MarketerState>()(
  persist(
    (set) => ({
      ...initialState,

      fetchAllData: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await marketerService.getDashboard();
          
          set({ 
            dashboardData: {
              conversion_rate: Number(data.dashboard.conversion_rate) || 0,
              active_referrals: Number(data.dashboard.active_referrals) || 0,
              weekly_growth: Number(data.dashboard.weekly_growth) || 0,
              total_invites: Number(data.dashboard.total_invites) || 0,
            },
            performanceData: {
              weekly_invites: Number(data.performance.weekly_invites) || 0,
              monthly_conversions: Number(data.performance.monthly_conversions) || 0,
              monthly_points: Number(data.performance.monthly_points) || 0,
              target_progress: Number(data.performance.target_progress) || 0,
            },
            earningsSummary: {
              total_points: Number(data.earnings.total_points) || 0,
              redeemed_points: Number(data.earnings.redeemed_points) || 0,
              available_points: Number(data.earnings.available_points) || 0,
              point_value: Number(data.earnings.point_value) || 10,
              potential_cash: Number(data.earnings.potential_cash) || 0,
              commission_rate: Number(data.earnings.commission_rate) || 0.1,
              total_earnings: Number(data.earnings.total_earnings) || 0,
              pending_earnings: Number(data.earnings.pending_earnings) || 0,
              withdrawn_earnings: Number(data.earnings.withdrawn_earnings) || 0,
            },
            recentActivity: data.activity || [],
            recentCommissions: data.commissions || [],
            invitesCount: Number(data.dashboard.total_invites) || 0,
            activeReferralsCount: Number(data.dashboard.active_referrals) || 0,
            isLoading: false 
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to fetch dashboard data";
          set({ error: message, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),

      fetchEarningsSummary: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await marketerService.getEarningsSummary();
          set({ 
            earningsSummary: {
              total_points: Number(data.total_points) || 0,
              redeemed_points: Number(data.redeemed_points) || 0,
              available_points: Number(data.available_points) || 0,
              point_value: Number(data.point_value) || 10,
              potential_cash: Number(data.potential_cash) || 0,
              commission_rate: Number(data.commission_rate) || 0.1,
              total_earnings: Number(data.total_earnings) || 0,
              pending_earnings: Number(data.pending_earnings) || 0,
              withdrawn_earnings: Number(data.withdrawn_earnings) || 0,
            },
            isLoading: false 
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to fetch earnings summary";
          set({ error: message, isLoading: false });
        }
      },
    }),
    {
      name: "marketer-storage",
      partialize: (state) => ({
        dashboardData: state.dashboardData,
        performanceData: state.performanceData,
        earningsSummary: state.earningsSummary,
        invitesCount: state.invitesCount,
        activeReferralsCount: state.activeReferralsCount,
      }),
    }
  )
);