import { create } from "zustand";
import { isAxiosError } from "axios";
import { publicApi } from "@/services/api";

export type MpesaStatus = "idle" | "loading" | "pending" | "success" | "error";

export interface BusinessMetadata {
  [key: string]: unknown;
}

const GUEST_SESSION_STORAGE_KEY = "mpesa_guest_session_key";

interface MpesaTransaction {
  checkoutRequestID: string;
  status: "pending" | "completed" | "failed";
  amount: number;
  phoneNumber: string;
  accountReference: string;
  businessMetadata?: BusinessMetadata;
  transactionID?: string;
  guestSessionKey?: string;
}

interface MpesaState {
  status: MpesaStatus;
  checkoutId: string | null;
  error: string | null;
  transaction: MpesaTransaction | null;
  pollInterval: NodeJS.Timeout | null;
  guestSessionKey: string | null;

  pay: (
    amount: number,
    phoneNumber: string,
    accountReference: string,
    businessMetadata?: BusinessMetadata
  ) => Promise<{ success: boolean; checkoutId: string | null }>;

   verify: (checkoutRequestID?: string) => Promise<MpesaTransaction | null>;

  clearTransaction: () => void;

  reset: () => void;

}

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20;

const readStoredGuestSessionKey = (): string | null => {
  if (typeof window === "undefined") return null;
  const stored = window.sessionStorage.getItem(GUEST_SESSION_STORAGE_KEY);
  return stored && stored.length > 0 ? stored : null;
};

const writeStoredGuestSessionKey = (value: string | null): void => {
  if (typeof window === "undefined") return;
  if (value) {
    window.sessionStorage.setItem(GUEST_SESSION_STORAGE_KEY, value);
  } else {
    window.sessionStorage.removeItem(GUEST_SESSION_STORAGE_KEY);
  }
};

export const useMpesaStore = create<MpesaState>((set, get) => ({
  status: "idle",
  checkoutId: null,
  error: null,
  transaction: null,
  pollInterval: null,
  guestSessionKey: readStoredGuestSessionKey(),

  pay: async (amount, phoneNumber, accountReference, businessMetadata) => {
    set({ status: "loading", error: null, checkoutId: null, transaction: null, guestSessionKey: null });

    try {
      const digits = phoneNumber.replace(/\D/g, "");
      const cleanPhone = digits.startsWith("254") ? digits : digits.startsWith("0") ? "254" + digits.substring(1) : "254" + digits;
      
      if (cleanPhone.length !== 12) {
        set({ status: "error", error: "Invalid phone number" });
        return { success: false, checkoutId: null };
      }

      console.log("Sending STK push to:", cleanPhone, "amount:", amount);
      const response = await publicApi.post("/mpesa/push", {
        amount,
        phoneNumber: cleanPhone,
        accountReference,
        businessMetadata,
      });

      console.log("STK push response:", response.data);

       if (response.data.success && response.data.checkoutRequestID) {
        const checkoutId = response.data.checkoutRequestID;
        const nextGuestSessionKey = response.data.guestSessionKey || null;
        writeStoredGuestSessionKey(nextGuestSessionKey);
        set({
          status: "pending",
          checkoutId,
          guestSessionKey: nextGuestSessionKey,
        });
        console.log("Payment initiated, checkoutId:", checkoutId);
        return { success: true, checkoutId };
      }

      set({
        status: "error",
        error: response.data.error || "Failed to initiate payment",
      });
      return { success: false, checkoutId: null };
    } catch (error) {
      console.error("STK push error:", error);
      const message = 
        isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to initiate payment";
      set({ status: "error", error: message });
      return { success: false, checkoutId: null };
    }
  },

  verify: async (checkoutRequestID?: string) => {
    const { checkoutId: storedCheckoutId, pollInterval } = get();

    if (pollInterval) {
      clearInterval(pollInterval);
    }

    const checkoutId = checkoutRequestID || storedCheckoutId;

    if (!checkoutId) {
      set({ status: "error", error: "No checkout ID", pollInterval: null });
      return null;
    }

    let attempts = 0;
    let isCancelled = false;

    const checkStatus = async (): Promise<MpesaTransaction | null> => {
      if (isCancelled) return null;
      try {
        console.log("Checking status for:", checkoutId);
        const response = await publicApi.get(`/mpesa/verify/${checkoutId}`);
        console.log("Status response:", response.data);

        if (isCancelled) return null;

        if (response.data.error) {
          isCancelled = true;
          set({
            status: "error",
            error: response.data.error,
            pollInterval: null,
          });
          return null;
        }

        if (response.data.status === "success" || response.data.status === "completed") {
          isCancelled = true;
          const tx = response.data.transaction || response.data;
          const currentGuestSessionKey = get().guestSessionKey ?? readStoredGuestSessionKey();
          const completedTransaction: MpesaTransaction = {
            checkoutRequestID: checkoutId,
            status: "completed",
            amount: tx.amount,
            phoneNumber: tx.phoneNumber,
            accountReference: tx.accountReference,
            businessMetadata: tx.businessMetadata,
            transactionID: tx.transactionID,
            guestSessionKey: currentGuestSessionKey ?? undefined,
          };
          set({
            status: "success",
            transaction: completedTransaction,
            guestSessionKey: currentGuestSessionKey,
            pollInterval: null,
          });
          return completedTransaction;
        }

        if (response.data.status === "failed") {
          console.log("Payment failed, resultDesc:", response.data.resultDesc);
          isCancelled = true;
          set({
            status: "error",
            error: response.data.resultDesc || "Payment was not completed. Please check your phone and try again.",
            pollInterval: null,
          });
          return null;
        }

        set({ status: "pending" });
        attempts++;
        if (attempts >= MAX_POLL_ATTEMPTS) {
          isCancelled = true;
          set({
            status: "pending",
            error: "We’re still waiting for M-Pesa. Check your phone and try checking the status again.",
            pollInterval: null,
          });
          return null;
        }

        return null;
      } catch {
        if (isCancelled) return null;
        attempts++;
        if (attempts >= MAX_POLL_ATTEMPTS) {
          isCancelled = true;
          set({
            status: "pending",
            error: "We couldn’t confirm the payment yet. You can safely check its status again.",
            pollInterval: null,
          });
          return null;
        }
        return null;
      }
    };

    const interval = setInterval(async () => {
      if (isCancelled) {
        clearInterval(interval);
        return;
      }

      const currentStatus = get().status;

      if (currentStatus === "success" || currentStatus === "error") {
        clearInterval(interval);
        set({ pollInterval: null });
        return;
      }

      await checkStatus();
    }, POLL_INTERVAL_MS);

    set({ pollInterval: interval });

    await checkStatus();
    return get().transaction;
  },

  clearTransaction: () => {
    const { pollInterval } = get();
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    writeStoredGuestSessionKey(null);
    set({
      transaction: null,
      pollInterval: null,
      guestSessionKey: null,
    });
  },

  reset: () => {
    const { pollInterval } = get();
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    writeStoredGuestSessionKey(null);
    set({
      status: "idle",
      checkoutId: null,
      error: null,
      transaction: null,
      pollInterval: null,
      guestSessionKey: null,
    });
  },

}));