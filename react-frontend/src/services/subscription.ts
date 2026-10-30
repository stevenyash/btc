import { api, publicApi } from "./api";

export interface SubscriptionDetails {
  id: number;
  user_id: string;
  subscription_code: string;
  status: string;
  start_date: string;
  expiry_date: string;
  phone_no: string;
  subscription_type_id: number;
  transaction_id: number;
}

export interface PackageDetails {
  id: number;
  name: string;
  description: string;
  subscription_type_id: number;
  subscription_type?: {
    id: number;
    name: string;
    description?: string;
    membership_fee?: number | string;
    months?: string;
  };
  concurrent_access: number;
  no_of_lessons: number;
  watch_time_minutes: number;
  duration_amount: number;
  duration_unit: string;
  fee: number;
}

export interface SubscriberDetails {
  lessontrack: {
    lessons_viewed: number;
    lesson_balance: number;
    total_lessons: number;
    remaining_watch_time_seconds: number;
    total_watch_time_seconds: number;
    status: string;
    package_id: number;
  };
  packages: PackageDetails | null;
  subscriptions: SubscriptionDetails | null;
}

export interface MpesaPaymentRequest {
  amount: number;
  phone: string;
  callback_Url?: string;
}

export interface MpesaPaymentResponse {
  success: boolean;
  paymentDetails?: {
    CheckoutRequestID: string;
    [key: string]: unknown;
  };
  error?: string;
}

export interface TransactionSearchRequest {
  reference: string;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string | null;
  membership_fee: number;
}

export interface UpdateLessonBalanceRequest {
  lessonId: number;
  watchTimeSeconds: number;
  deviceId: string;
}

export interface UpdateLessonBalanceResponse {
  success: boolean;
  remaining_watch_time_seconds: number;
  lessons_used: number;
  total_lessons: number;
  exhausted: boolean;
}

export interface SubscriptionService {
  getSubscriberDetails(): Promise<SubscriberDetails>;
  initiateMpesaPayment(data: MpesaPaymentRequest): Promise<MpesaPaymentResponse>;
  searchTransaction(reference: string): Promise<{ transaction_id: number }>;
  getPackages(): Promise<PackageDetails[]>;
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  checkSubscription(): Promise<{ hasSubscription: boolean; data?: unknown }>;
  updateLessonBalance(data: UpdateLessonBalanceRequest): Promise<UpdateLessonBalanceResponse>;
}

export const subscriptionService: SubscriptionService = {
  async getSubscriberDetails(): Promise<SubscriberDetails> {
    const response = await api.get("/components_data/subscriberdetails");
    return response.data;
  },

  async initiateMpesaPayment(data: MpesaPaymentRequest): Promise<MpesaPaymentResponse> {
    const response = await api.post("/components_data/propmtstk", data);
    return response.data;
  },

  async searchTransaction(reference: string): Promise<{ transaction_id: number }> {
    const response = await api.post("/components_data/searchtransaction", { reference });
    return response.data;
  },

  async getPackages(): Promise<PackageDetails[]> {
    const response = await publicApi.get("/components_data/packages_public");
    const data = response.data?.data || response.data || [];
    if (!Array.isArray(data)) {
      return [];
    }
    return data;
  },

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await publicApi.get("/components_data/subscription_types");
      const types = response.data?.data || response.data || [];
      if (!Array.isArray(types)) {
        return [];
      }
      return types;
    } catch (err) {
      console.error("Failed to fetch subscription plans:", err);
      return [];
    }
  },

  async checkSubscription(): Promise<{ hasSubscription: boolean; data?: unknown }> {
    try {
      const response = await api.get("/components_data/subscriberdetails");
      const details = response.data;
      
      if (details?.subscriptions?.status === 'active') {
        const expiryDate = new Date(details.subscriptions.expiry_date);
        const now = new Date();
        
        if (expiryDate > now) {
          return { hasSubscription: true, data: details };
        }
      }
      
      return { hasSubscription: false, data: details };
    } catch (err) {
      console.error("Check subscription error:", err);
      return { hasSubscription: false, data: [] };
    }
  },

  async updateLessonBalance(data: UpdateLessonBalanceRequest): Promise<UpdateLessonBalanceResponse> {
    const response = await api.post("/lessons/update-balance", data);
    return response.data;
  },
};

export default api;