/* eslint-disable @typescript-eslint/no-explicit-any */
import { publicApi } from "./api";

export interface LearningLevel {
  id: number;
  name: string;
  description?: string;
}

export interface Grade {
  id: number;
  name: string;
  level_id: number;
}

export interface LearningArea {
  id: number;
  name: string;
  color: string;
  icon?: string;
  description?: string;
}

export interface Lesson {
  id: number;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  duration_seconds: number | null;
  is_preview_available: boolean;
  bunny_url: string | null;
  bunny_video_id: string | null;
  price: number | null;
  created_at: string;
  video_url?: string;
  hls_url?: string;
  area_id: number;
  grade_id: number;
  topic_id?: number;
  subtopic_id?: number;
}

export interface GuestPurchaseStatus {
  lesson_id: number;
  purchased: boolean;
  max_watch_time?: number;
}

export interface GuestRegisterResponse {
  success: boolean;
  message?: string;
}

export interface StreamUrlResponse {
  success: boolean;
  message?: string;
  video_url?: string;
  hls_url?: string;
  is_hls?: boolean;
  session_expires?: string;
  lesson_balance?: number;
  title?: string;
  duration?: number;
  access_mode?: "admin" | "subscription" | "individual" | "guest" | "preview";
  remaining_watch_time_seconds?: number;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  checkoutRequestID?: string;
}

export const guestService = {
  async registerGuest(phone: string, username?: string): Promise<GuestRegisterResponse> {
    const response = await publicApi.post("/components_data/register_guest", {
      phone,
      username,
    });
    return response.data;
  },

  async getLevels(): Promise<LearningLevel[]> {
    const response = await publicApi.get("/components_data/learninglevels");
    const data = response.data?.data || response.data?.records || response.data || [];
    const dataArray = Array.isArray(data) ? data : [];
    return dataArray.map((item: { level_id: number; name: string; description?: string }) => ({
      id: item.level_id,
      name: item.name,
      description: item.description
    }));
  },

  async getGradesByLevel(levelId: number): Promise<Grade[]> {
    const response = await publicApi.get(`/components_data/grades_by_level/${levelId}`);
    const data = response.data?.data || response.data?.records || response.data || [];
    const dataArray = Array.isArray(data) ? data : [];
    return dataArray.map((item: { id: number; name: string }) => ({
      id: item.id,
      name: item.name,
      level_id: levelId
    }));
  },

  async getAreasByGrade(gradeId: number): Promise<LearningArea[]> {
    const response = await publicApi.get(`/components_data/learningareas?grade_id=${gradeId}`);
    const data = response.data?.data || response.data?.records || response.data || [];
    return Array.isArray(data) ? data : [];
  },

async getLessonsByArea(areaId: number): Promise<Lesson[]> {
     const response = await publicApi.get(`/components_data/lessons?area_id=${areaId}`);
     const data = response.data?.data || response.data?.records || response.data || [];
     const dataArray = Array.isArray(data) ? data : [];
     console.log('[guestService] Raw API response lessons count:', dataArray.length);
      const mapped = dataArray.map((item: any) => {
        console.log('[guestService] Lesson item thumbnail_url:', item.thumbnail_url, 'bunny_video_id:', item.bunny_video_id, 'title:', item.title);
        return {
          id: item.id,
          title: item.title,
          description: item.description,
          thumbnail_url: item.thumbnail_url, // Will be signed in LessonCard
          duration: item.duration,
          duration_seconds: item.duration_seconds,
          is_preview_available: item.is_preview_available,
          bunny_url: item.bunny_url,
          bunny_video_id: item.bunny_video_id,
          price: item.price,
          created_at: item.created_at,
          video_url: item.video_url,
          hls_url: item.hls_url,
          area_id: item.area_id,
          grade_id: item.grade_id,
          topic_id: item.topic_id,
          subtopic_id: item.subtopic_id,
        };
      });
     console.log('[guestService] Mapped lessons count:', mapped.length);
     return mapped;
   },

  async checkPurchaseStatus(phone: string, lessonId: number): Promise<GuestPurchaseStatus> {
    const statuses = await this.getAllPurchaseStatuses(phone, [lessonId]);
    const status = statuses.find((item) => item.lesson_id === lessonId);
    if (!status) {
      throw new Error(`Guest purchase status was not returned for lesson ${lessonId}`);
    }
    return status;
  },

  async getAllPurchaseStatuses(phone: string, lessonIds: number[]): Promise<GuestPurchaseStatus[]> {
    const response = await publicApi.post("/components_data/guest_lessons_status", {
      phone,
      lesson_ids: lessonIds,
    });
    const payload = response.data;
    if (Array.isArray(payload)) {
      return payload;
    }
    if (Array.isArray(payload?.data)) {
      return payload.data;
    }
    throw new Error("Invalid guest lesson purchase status response");
  },

  async activatePaymentSession(
    checkoutRequestID: string,
    guestSessionKey?: string,
    phone?: string
  ): Promise<{ success: boolean; phone: string }> {
    const response = await publicApi.post(`/mpesa/guest-session/${encodeURIComponent(checkoutRequestID)}`, {
      ...(guestSessionKey && { guestSessionKey }),
      ...(phone && { phone }),
    });
    return response.data;
  },

  async clearPaymentSession(): Promise<void> {
    await publicApi.post("/mpesa/guest-session/clear");
  },

  async getLessonSettings(): Promise<{ subscribed: { fee: number; duration: number }; non_subscribed: { fee: number; duration: number } }> {
    const response = await publicApi.get("/components_data/lesson_settings");
    const records = response.data?.records || [];
    
    const subscribed = records.find((r: any) => r.subscription_type === 'subscribed');
    const nonSubscribed = records.find((r: any) => r.subscription_type === 'non_subscribed');
    
    return {
      subscribed: { 
        fee: subscribed?.fee || 1, 
        duration: subscribed?.duration || 90 
      },
      non_subscribed: { 
        fee: nonSubscribed?.fee || 2, 
        duration: nonSubscribed?.duration || 90 
      }
    };
  },

  async initiatePayment(phone: string, lessonId: number, amount: number): Promise<PaymentResponse> {
    const response = await publicApi.post("/guest_initiate_payment", {
      phone,
      lesson_id: lessonId,
      amount,
    });
    return response.data || { success: false, message: "Failed to initiate payment" };
  },

  async getStreamUrl(
    lessonId: number,
    phone: string,
    deviceId?: string,
    signal?: AbortSignal,
  ): Promise<StreamUrlResponse> {
    const response = await publicApi.get(`/lessons/stream-url/${lessonId}`, {
      params: { phone, guest: "true", device_id: deviceId },
      signal,
    });
    return response.data;
  },

  async updateWatchTime(phone: string, lessonId: number, watchTimeSeconds: number, deviceId?: string): Promise<void> {
    await publicApi.post("/components_data/guest_update_watch_time", {
      phone,
      lesson_id: lessonId,
      watch_time: watchTimeSeconds,
      device_id: deviceId,
    });
  },

  async verifyPhone(phone: string): Promise<boolean> {
    const response = await publicApi.get(`/components_data/verify_phone/${phone}`);
    const data = response.data;
    // verified: true means phone is available for guest access
    // isRegisteredUser: true means phone belongs to existing user (should log in)
    return data?.verified === true;
  },

  async getLessonFees(): Promise<{ subscribed: { fee: number; duration: number }; non_subscribed: { fee: number; duration: number } }> {
    const response = await publicApi.get("/components_data/lesson_fees");
    return response.data || { subscribed: { fee: 1, duration: 90 }, non_subscribed: { fee: 2, duration: 90 } };
  },
};

export default guestService;
