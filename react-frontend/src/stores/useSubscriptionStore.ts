import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  subscriptionService,
  type SubscriberDetails,
  type PackageDetails,
  type SubscriptionPlan,
} from "@/services/subscription";
import { useAuthStore } from "./useAuthStore";

interface SubscriptionState {
  subscriberDetails: SubscriberDetails | null;
  packages: PackageDetails[];
  subscriptionPlans: SubscriptionPlan[];
  isLoading: boolean;
  error: string | null;
  isAuthorized: boolean;
  authMessage: string;
  lessonBalance: number;
  lessonsViewed: number;
  totalLessons: number;
  subscriptionStatus: string;
  hasActiveSubscription: boolean;

  fetchSubscriberDetails: () => Promise<void>;
  fetchPackages: () => Promise<void>;
  fetchSubscriptionPlans: () => Promise<void>;
  checkSubscription: () => Promise<boolean>;
  initiatePayment: (amount: number, phone: string) => Promise<void>;
  searchTransaction: (reference: string) => Promise<number>;
  clearError: () => void;
  clearSubscription: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
   persist(
     (set) => ({
      subscriberDetails: null,
      packages: [],
      subscriptionPlans: [],
      isLoading: false,
      error: null,
      isAuthorized: false,
      authMessage: "",
      lessonBalance: 0,
      lessonsViewed: 0,
      totalLessons: 0,
      subscriptionStatus: "inactive",
      hasActiveSubscription: false,

      fetchSubscriberDetails: async () => {
        set({ isLoading: true, error: null });
        try {
          const details = await subscriptionService.getSubscriberDetails();
          set({
            subscriberDetails: details,
            isLoading: false,
          });

           const { lessontrack, subscriptions } = details;

          if (lessontrack) {
            set({
              lessonsViewed: lessontrack.lessons_viewed || 0,
              lessonBalance: lessontrack.lesson_balance || 0,
              totalLessons: lessontrack.total_lessons || 0,
              subscriptionStatus: lessontrack.status || "inactive",
            });
          }

      // The packages array should only contain the list from fetchPackages().
      // Don't overwrite it with the user's current package from subscriber details.


           if (!subscriptions || subscriptions.id === 0) {
             set({
               isAuthorized: false,
               authMessage: "No active subscription found.",
               hasActiveSubscription: false,
             });
           } else {
             const expiryDate = subscriptions.expiry_date ? new Date(subscriptions.expiry_date) : null;
             const isActive = expiryDate ? expiryDate > new Date() : false;
             
             set({
               isAuthorized: isActive,
               authMessage: isActive ? "" : "Subscription expired.",
               hasActiveSubscription: isActive,
               subscriptionStatus: isActive ? "active" : "expired",
             });
           }
        } catch (error: unknown) {
          // Handle 401 - clear auth state
          if (error && typeof error === "object" && "response" in error) {
            const axiosError = error as { response?: { status?: number } };
            if (axiosError.response?.status === 401) {
              // Token expired or invalid - logout
              const { logout } = useAuthStore.getState();
              await logout();
              set({
                error: "Session expired. Please login again.",
                isLoading: false,
                isAuthorized: false,
                authMessage: "Please login to access subscription.",
              });
              return;
            }
          }
          const message =
            error instanceof Error ? error.message : "Failed to fetch subscription details";
          set({
            error: message,
            isLoading: false,
            isAuthorized: false,
            authMessage: message,
          });
        }
      },

      fetchPackages: async () => {
        set({ isLoading: true, error: null });
        try {
          const packages = await subscriptionService.getPackages();
          console.log("packages",packages)
          set({ packages, isLoading: false });
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : "Failed to fetch packages";
          set({ error: message, isLoading: false });
        }
      },

      fetchSubscriptionPlans: async () => {
        set({ isLoading: true, error: null });
        try {
          const plans = await subscriptionService.getSubscriptionPlans();
          set({ subscriptionPlans: plans, isLoading: false });
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : "Failed to fetch subscription plans";
          set({ error: message, isLoading: false });
        }
      },

      checkSubscription: async () => {
        set({ isLoading: true, error: null });
        try {
          const result = await subscriptionService.checkSubscription();
          set({ 
            hasActiveSubscription: result.hasSubscription,
            isLoading: false,
            error: null 
          });
          return result.hasSubscription;
        } catch (error: unknown) {
          // For unauthenticated users or public access, silently handle - just set not subscribed
          set({ isLoading: false, hasActiveSubscription: false, error: null });
          return false;
        }
      },

      initiatePayment: async (amount: number, phone: string) => {
        set({ isLoading: true, error: null });
        try {
          await subscriptionService.initiateMpesaPayment({ amount, phone });
          set({ isLoading: false });
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : "Failed to initiate payment";
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      searchTransaction: async (reference: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await subscriptionService.searchTransaction(reference);
          set({ isLoading: false });
          return result.transaction_id;
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : "Transaction not found";
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      clearSubscription: () => {
        set({
          subscriberDetails: null,
          isAuthorized: false,
          authMessage: "",
          lessonBalance: 0,
          lessonsViewed: 0,
          totalLessons: 0,
          subscriptionStatus: "inactive",
          hasActiveSubscription: false,
        });
      },
    }),
    {
      name: "subscription-storage",
      partialize: (state) => ({
        subscriberDetails: state.subscriberDetails,
        isAuthorized: state.isAuthorized,
        subscriptionStatus: state.subscriptionStatus,
      }),
    }
  )
);