import { api } from "./api";

export interface MarketerDashboardData {
  conversion_rate: number;
  active_referrals: number;
  weekly_growth: number;
  total_invites: number;
}

export interface MarketerPerformanceData {
  weekly_invites: number;
  monthly_conversions: number;
  monthly_points: number;
  target_progress: number;
}

export interface MarketerActivityItem {
  icon: string;
  color: string;
  time: string;
  title: string;
  description: string;
}

export interface MarketerEarningsSummary {
  total_points: number;
  redeemed_points: number;
  available_points: number;
  point_value: number;
  potential_cash: number;
  commission_rate: number;
  total_earnings: number;
  pending_earnings: number;
  withdrawn_earnings: number;
}

export interface MarketerCommission {
  id: number;
  purchase_type: string;
  purchase_amount: number;
  commission_amount: number;
  commission_rate: number;
  status: string;
  created_at: string;
}

export interface MarketerWithdrawal {
  id: number;
  amount: number;
  phone_number: string;
  checkout_request_id: string | null;
  source: string;
  status: string;
  mpesa_receipt: string | null;
  remarks: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface MarketerPointRedemption {
  id: number;
  points_redeemed: number;
  point_value: number;
  cash_amount: number;
  status: string;
  remarks: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface MarketerFullDashboard {
  dashboard: MarketerDashboardData;
  performance: MarketerPerformanceData;
  earnings: MarketerEarningsSummary;
  activity: MarketerActivityItem[];
  commissions: MarketerCommission[];
}

export interface MarketerService {
  getDashboard(): Promise<MarketerFullDashboard>;
  getDashboardData(): Promise<MarketerDashboardData>;
  getPerformanceData(): Promise<MarketerPerformanceData>;
  getRecentActivity(): Promise<MarketerActivityItem[]>;
  getEarningsSummary(): Promise<MarketerEarningsSummary>;
  getRecentCommissions(limit?: number): Promise<MarketerCommission[]>;
  getInvitesCount(): Promise<number>;
  getActiveReferralsCount(): Promise<number>;
  getWithdrawalHistory(): Promise<MarketerWithdrawal[]>;
  getRedemptionHistory(): Promise<MarketerPointRedemption[]>;
  requestWithdrawal(phoneNumber: string, amount: number): Promise<{ success: boolean; checkoutRequestID?: string; withdrawalId?: number; error?: string }>;
  redeemPoints(points: number): Promise<{ success: boolean; redemptionId?: number; cashAmount?: number; error?: string }>;
}

export const marketerService: MarketerService = {
  async getDashboard(): Promise<MarketerFullDashboard> {
    const response = await api.get("/marketers/dashboard");
    return response.data || response;
  },

   async getDashboardData(): Promise<MarketerDashboardData> {
     const response = await api.get("/marketers/dashboard");
     const data = response.data?.dashboard || {};
     return {
       conversion_rate: Number(data.conversion_rate) || 0,
       active_referrals: Number(data.active_referrals) || 0,
       weekly_growth: Number(data.weekly_growth) || 0,
       total_invites: Number(data.total_invites) || 0,
     };
   },

   async getPerformanceData(): Promise<MarketerPerformanceData> {
     const response = await api.get("/marketers/dashboard");
     const data = response.data?.performance || {};
     return {
       weekly_invites: Number(data.weekly_invites) || 0,
       monthly_conversions: Number(data.monthly_conversions) || 0,
       monthly_points: Number(data.monthly_points) || 0,
       target_progress: Number(data.target_progress) || 0,
     };
   },

   async getRecentActivity(): Promise<MarketerActivityItem[]> {
     const response = await api.get("/marketers/dashboard");
     return response.data?.activity || [];
   },

   async getEarningsSummary(): Promise<MarketerEarningsSummary> {
     const response = await api.get("/marketers/dashboard");
     const data = response.data?.earnings || {};
     return {
       total_points: Number(data.total_points) || 0,
       redeemed_points: Number(data.redeemed_points) || 0,
       available_points: Number(data.available_points) || 0,
       point_value: Number(data.point_value) || 10,
       potential_cash: Number(data.potential_cash) || 0,
       commission_rate: Number(data.commission_rate) || 0.1,
       total_earnings: Number(data.total_earnings) || 0,
       pending_earnings: Number(data.pending_earnings) || 0,
       withdrawn_earnings: Number(data.withdrawn_earnings) || 0,
     };
   },

   async getRecentCommissions(limit: number = 10): Promise<MarketerCommission[]> {
     const response = await api.get("/marketers/dashboard");
     const data = response.data?.commissions || [];
     return data.slice(0, limit);
   },

   async getInvitesCount(): Promise<number> {
     const response = await api.get("/marketers/dashboard");
     const data = response.data?.dashboard || {};
     return Number(data.total_invites) || 0;
   },

   async getActiveReferralsCount(): Promise<number> {
     const response = await api.get("/marketers/dashboard");
     const data = response.data?.dashboard || {};
     return Number(data.active_referrals) || 0;
   },

  async getWithdrawalHistory(): Promise<MarketerWithdrawal[]> {
    const response = await api.get("/marketer_earnings/withdrawals");
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data?.records) {
      return response.data.records;
    }
    return [];
  },

  async getRedemptionHistory(): Promise<MarketerPointRedemption[]> {
    const response = await api.get("/marketer_earnings/redemptions");
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data?.records) {
      return response.data.records;
    }
    return [];
  },

  async requestWithdrawal(phoneNumber: string, amount: number): Promise<{ success: boolean; checkoutRequestID?: string; withdrawalId?: number; error?: string }> {
    const response = await api.post("/marketer_earnings/withdraw", {
      phone_number: phoneNumber,
      amount: amount
    });
    return response.data;
  },

  async redeemPoints(points: number): Promise<{ success: boolean; redemptionId?: number; cashAmount?: number; error?: string }> {
    try {
      const response = await api.post("/marketer_earnings/redeem-points", {
        points_to_redeem: points
      });
      const data = response.data;
      return {
        success: true,
        redemptionId: data.id,
        cashAmount: data.cash_amount
      };
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || "Failed to redeem points";
      return { success: false, error: errorMsg };
    }
  },
};