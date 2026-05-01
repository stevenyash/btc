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
  is_new?: boolean;
  verified?: boolean;
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
    return Array.isArray(data) ? data : [];
  },

  async checkPurchaseStatus(phone: string, lessonId: number): Promise<GuestPurchaseStatus> {
    const response = await publicApi.get(`/components_data/guest_lesson_status/${lessonId}`, {
      params: { phone },
    });
    return response.data || { lesson_id: lessonId, purchased: false };
  },

  async getAllPurchaseStatuses(phone: string, lessonIds: number[]): Promise<GuestPurchaseStatus[]> {
    const response = await publicApi.post("/components_data/guest_lessons_status", {
      phone,
      lesson_ids: lessonIds,
    });
    return response.data || [];
  },

  async purchaseLesson(phone: string, lessonId: number, paymentData: {
    amount: number;
    checkoutRequestID: string;
    transactionID?: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await publicApi.post("/components_data/guest_purchase_lesson", {
      phone,
      lesson_id: lessonId,
      ...paymentData,
    });
    return response.data || { success: false, message: "Unknown error" };
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

  async getStreamUrl(lessonId: number, phone: string): Promise<StreamUrlResponse> {
    const response = await publicApi.get(`/lessons/stream-url/${lessonId}`, {
      params: { phone, guest: "true" },
    });
    return response.data;
  },

  async updateWatchTime(phone: string, lessonId: number, watchTimeSeconds: number): Promise<void> {
    await publicApi.post("/components_data/guest_update_watch_time", {
      phone,
      lesson_id: lessonId,
      watch_time: watchTimeSeconds,
    });
  },

  async verifyPhone(phone: string): Promise<{ verified: boolean; isNew: boolean }> {
    const response = await publicApi.get(`/components_data/verify_phone/${phone}`);
    return response.data || { verified: false, isNew: false };
  },

  async getLessonFees(): Promise<{ subscribed: { fee: number; duration: number }; non_subscribed: { fee: number; duration: number } }> {
    const response = await publicApi.get("/components_data/lesson_fees");
    return response.data || { subscribed: { fee: 1, duration: 90 }, non_subscribed: { fee: 2, duration: 90 } };
  },
};

export default guestService;
