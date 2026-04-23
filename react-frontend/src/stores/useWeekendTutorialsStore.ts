import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  tutorialService,
  type Level,
  type Grade,
  type Tutorial,
  type PurchasedTutorial,
  type Question,
} from "@/services/tutorial";

interface WeekendTutorialsState {
  levels: Level[];
  selectedLevel: number | null;
  grades: Grade[];
  selectedGrade: number | null;
  tutorials: Tutorial[];
  tutorialsTotal: number;
  tutorialsLoading: boolean;
  fee: string;
  phoneVerified: boolean;
  verifiedPhone: string | null;
  purchasedTutorials: PurchasedTutorial[];
  questions: Question[];
  purchasedLoading: boolean;
  error: string | null;

  fetchLevels: () => Promise<void>;
  fetchGrades: (levelId: number) => Promise<void>;
  fetchTutorials: (gradeId: number) => Promise<void>;
  checkTutorialStatuses: () => Promise<void>;
  fetchTutorialFee: () => Promise<void>;
  verifyPhone: (phone: string) => Promise<boolean>;
  fetchPurchasedTutorials: () => Promise<void>;
  setSelectedLevel: (level: number | null) => void;
  setSelectedGrade: (grade: number | null) => void;
  setPhoneVerified: (verified: boolean) => void;
  setVerifiedPhone: (phone: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  levels: [],
  selectedLevel: null,
  grades: [],
  selectedGrade: null,
  tutorials: [],
  tutorialsTotal: 0,
  tutorialsLoading: false,
  fee: '500',
  phoneVerified: false,
  verifiedPhone: null,
  purchasedTutorials: [],
  questions: [],
  purchasedLoading: false,
  error: null,
};

export const useWeekendTutorialsStore = create<WeekendTutorialsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchLevels: async () => {
        try {
          const data = await tutorialService.fetchLevels();
          set({ levels: data });
        } catch (error) {
          console.error('Failed to fetch levels:', error);
          set({ error: 'Failed to fetch learning levels' });
        }
      },

      fetchGrades: async (levelId: number) => {
        try {
          const data = await tutorialService.fetchGradesByLevel(levelId);
          set({ grades: data });
        } catch (error) {
          console.error('Failed to fetch grades:', error);
          set({ error: 'Failed to fetch grades' });
        }
      },

      fetchTutorials: async (gradeId: number) => {
        set({ tutorialsLoading: true });
        try {
          const data = await tutorialService.fetchWeekendTutorials(gradeId);
          if (data.success) {
            set({ tutorials: data.data, tutorialsTotal: data.total });
          }
        } catch (error) {
          console.error('Failed to fetch tutorials:', error);
          set({ error: 'Failed to fetch tutorials' });
        } finally {
          set({ tutorialsLoading: false });
        }
      },

      checkTutorialStatuses: async () => {
        try {
          await tutorialService.checkWeekendTutorials();
        } catch (error) {
          console.error('Failed to check tutorial statuses:', error);
        }
      },

      fetchTutorialFee: async () => {
        try {
          const fee = await tutorialService.fetchTutorialFee();
          set({ fee });
        } catch (error) {
          console.error('Failed to fetch tutorial fee:', error);
        }
      },

      verifyPhone: async (phone: string) => {
        try {
          const data = await tutorialService.verifyPhone(phone);
          if (data.verified) {
            set({ phoneVerified: true, verifiedPhone: phone });
            get().fetchPurchasedTutorials();
            return true;
          }
          return false;
        } catch (error) {
          console.error('Phone verification failed:', error);
          set({ error: 'Phone verification failed' });
          return false;
        }
      },

      fetchPurchasedTutorials: async () => {
        const { verifiedPhone } = get();
        if (!verifiedPhone) return;
        
        set({ purchasedLoading: true });
        try {
          const data = await tutorialService.fetchPurchasedTutorials(verifiedPhone);
          if (data.success) {
            set({ purchasedTutorials: data.tutorials, questions: data.questions });
          }
        } catch (error) {
          console.error('Failed to fetch purchased tutorials:', error);
          set({ error: 'Failed to fetch purchased tutorials' });
        } finally {
          set({ purchasedLoading: false });
        }
      },

      setSelectedLevel: (level: number | null) => {
        set({ selectedLevel: level, selectedGrade: null, tutorials: [] });
      },

      setSelectedGrade: (grade: number | null) => {
        set({ selectedGrade: grade });
      },

      setPhoneVerified: (verified: boolean) => {
        set({ phoneVerified: verified });
      },

      setVerifiedPhone: (phone: string | null) => {
        set({ verifiedPhone: phone });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'weekend-tutorials-storage',
      partialize: (state) => ({
        phoneVerified: state.phoneVerified,
        verifiedPhone: state.verifiedPhone,
      }),
    }
  )
);
