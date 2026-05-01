import { create } from "zustand";
import { guestService } from "@/services/guest";

interface LessonSettings {
  subscribed: { fee: number; duration: number };
  non_subscribed: { fee: number; duration: number };
}

interface LessonSettingsState {
  settings: LessonSettings | null;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
}

export const useLessonSettingsStore = create<LessonSettingsState>((set) => ({
  settings: null,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await guestService.getLessonFees();
      set({ settings, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch lesson settings";
      set({ error: message, isLoading: false });
    }
  },
}));

export default useLessonSettingsStore;
