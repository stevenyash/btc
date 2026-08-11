import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  guestService,
  type LearningLevel,
  type Grade,
  type LearningArea,
  type Lesson,
  type GuestPurchaseStatus,
} from "@/services/guest";

interface GuestState {
  phone: string | null;
  isVerified: boolean;
  levels: LearningLevel[];
  grades: Grade[];
  areas: LearningArea[];
  lessons: Lesson[];
  purchaseStatuses: Map<number, GuestPurchaseStatus>;
  
  selectedLevel: LearningLevel | null;
  selectedGrade: Grade | null;
  selectedArea: LearningArea | null;
  selectedLesson: Lesson | null;
  
  isLoading: boolean;
  error: string | null;

  setPhone: (phone: string | null) => void;
  setVerified: (verified: boolean) => void;
  setSelectedLevel: (level: LearningLevel | null) => void;
  setSelectedGrade: (grade: Grade | null) => void;
  setSelectedArea: (area: LearningArea | null) => void;
  setSelectedLesson: (lesson: Lesson | null) => void;
  
  fetchLevels: () => Promise<void>;
  fetchGrades: (levelId: number) => Promise<void>;
  fetchAreas: (gradeId: number) => Promise<void>;
  fetchLessons: (areaId: number) => Promise<void>;
  
  checkPurchaseStatus: (phone: string, lessonId: number) => Promise<GuestPurchaseStatus>;
  checkAllPurchaseStatuses: (phone: string, lessonIds: number[]) => Promise<void>;
  
  verifyPhone: (phone: string) => Promise<boolean>;
  clearSelection: () => void;
  clearAll: () => void;
}

export const useGuestStore = create<GuestState>()(
  persist(
    (set, get) => ({
      phone: null,
      isVerified: false,
      levels: [],
      grades: [],
      areas: [],
      lessons: [],
      purchaseStatuses: new Map(),
      selectedLevel: null,
      selectedGrade: null,
      selectedArea: null,
      selectedLesson: null,
      isLoading: false,
      error: null,

      setPhone: (phone) => set({ phone }),
      setVerified: (verified) => set({ isVerified: verified }),
      setSelectedLevel: (level) => {
        set({ selectedLevel: level, selectedGrade: null, selectedArea: null, lessons: [] });
      },
      setSelectedGrade: (grade) => {
        set({ selectedGrade: grade, selectedArea: null, lessons: [] });
      },
      setSelectedArea: (area) => {
        set({ selectedArea: area });
      },
      setSelectedLesson: (lesson) => {
        set({ selectedLesson: lesson });
      },

      fetchLevels: async () => {
        set({ isLoading: true, error: null });
        try {
          const levels = await guestService.getLevels();
          set({ levels, isLoading: false });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to fetch levels";
          set({ error: message, isLoading: false });
        }
      },

      fetchGrades: async (levelId: number) => {
        set({ isLoading: true, error: null });
        try {
          const grades = await guestService.getGradesByLevel(levelId);
          set({ grades, isLoading: false });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to fetch grades";
          set({ error: message, isLoading: false });
        }
      },

      fetchAreas: async (gradeId: number) => {
        set({ isLoading: true, error: null });
        try {
          const areas = await guestService.getAreasByGrade(gradeId);
          set({ areas, isLoading: false });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to fetch areas";
          set({ error: message, isLoading: false });
        }
      },

fetchLessons: async (areaId: number) => {
         set({ isLoading: true, error: null });
         try {
           const lessons = await guestService.getLessonsByArea(areaId);
           console.log('[useGuestStore] Fetched lessons:', lessons.length);
           lessons.forEach((l, i) => {
             console.log(`  [useGuestStore] Lesson[${i}] id=${l.id} title="${l.title}" thumbnail_url=${l.thumbnail_url} bunny_video_id=${l.bunny_video_id}`);
           });
           set({ lessons, isLoading: false });

           const phone = get().phone;
           if (phone && lessons.length > 0) {
             const lessonIds = lessons.map(l => l.id);
             await get().checkAllPurchaseStatuses(phone, lessonIds);
           }
         } catch (error: unknown) {
           const message = error instanceof Error ? error.message : "Failed to fetch lessons";
           set({ error: message, isLoading: false });
         }
       },

      checkPurchaseStatus: async (phone: string, lessonId: number) => {
        const status = await guestService.checkPurchaseStatus(phone, lessonId);
        const statuses = new Map(get().purchaseStatuses);
        statuses.set(lessonId, status);
        set({ purchaseStatuses: statuses });
        return status;
      },

       checkAllPurchaseStatuses: async (phone: string, lessonIds: number[]) => {
         try {
           const statuses = await guestService.getAllPurchaseStatuses(phone, lessonIds);
           const statusMap = new Map<number, GuestPurchaseStatus>();
           if (Array.isArray(statuses)) {
             statuses.forEach(s => statusMap.set(s.lesson_id, s));
           }
           set({ purchaseStatuses: statusMap });
         } catch (error) {
           console.error("Failed to check purchase statuses:", error);
         }
       },

      verifyPhone: async (phone: string) => {
        set({ isLoading: true, error: null });
        try {
          const verified = await guestService.verifyPhone(phone);
          set({ 
            phone: verified ? phone : null, 
            isVerified: verified, 
            isLoading: false 
          });
          return verified;
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to verify phone";
          set({ error: message, isLoading: false });
          return false;
        }
      },

      clearSelection: () => {
        set({
          selectedLevel: null,
          selectedGrade: null,
          selectedArea: null,
          selectedLesson: null,
        });
      },

      clearAll: () => {
        set({
          phone: null,
          isVerified: false,
          grades: [],
          areas: [],
          lessons: [],
          purchaseStatuses: new Map(),
          selectedLevel: null,
          selectedGrade: null,
          selectedArea: null,
          selectedLesson: null,
          error: null,
        });
      },
    }),
    {
      name: "guest-storage",
      partialize: (state) => ({
        phone: state.phone,
        isVerified: state.isVerified,
      }),
    }
  )
);