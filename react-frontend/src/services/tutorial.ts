import { apiService } from "@/services/api";

export interface Level {
  value: number;
  label: string;
}

export interface Grade {
  value: number;
  label: string;
}

export interface Tutorial {
  id: number;
  learning_area: string;
  grade: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'upcoming' | 'expired';
  link?: string;
  meetingid?: string;
  strand?: string;
  user_id?: string;
}

export interface PurchasedTutorial {
  id: number;
  tutorial_id: number;
  learning_area: string;
  grade: string;
  start_date: string;
  end_date: string;
  status: string;
  link?: string;
  transaction_date: string;
  expiry_date: string;
  transaction_status?: string;
  amount_paid?: number;
}

export interface Question {
  id: number;
  text: string;
  status: 'answered' | 'unanswered';
  created_at: string;
  tutorial_id: number;
}

export interface TutorialResponse {
  success: boolean;
  data: Tutorial[];
  total: number;
}

export interface PurchasedTutorialsResponse {
  success: boolean;
  tutorials: PurchasedTutorial[];
  questions: Question[];
}

export const tutorialService = {
  fetchLevels: async (): Promise<Level[]> => {
    return apiService.get<Level[]>('/components_data/levelid_option_list');
  },

  fetchGradesByLevel: async (levelId: number): Promise<Grade[]> => {
    const result = await apiService.get<{ success: boolean; data: Array<{id: number; name: string}> }>(`/components_data/grades_by_level/${levelId}`);
    if (result.success) {
      return result.data.map(g => ({ value: g.id, label: g.name }));
    }
    return [];
  },

  fetchWeekendTutorials: async (gradeId: number, page = 1, perPage = 20): Promise<TutorialResponse> => {
    return apiService.get<TutorialResponse>('/components_data/get_weekend_tutorials', {
      grade_id: gradeId,
      page,
      per_page: perPage,
    });
  },

  checkWeekendTutorials: async (): Promise<Tutorial[]> => {
    return apiService.get<Tutorial[]>('/components_data/check_weekend_tutorials');
  },

  fetchTutorialFee: async (): Promise<string> => {
    const data = await apiService.get<{ fee: string }>('/components_data/tutorial_fee');
    return data.fee;
  },

  verifyPhone: async (phone: string): Promise<{ verified: boolean; isNew?: boolean }> => {
    return apiService.get<{ verified: boolean; isNew?: boolean }>(`/components_data/verify_phone/${phone}`);
  },

  fetchPurchasedTutorials: async (phone: string): Promise<PurchasedTutorialsResponse> => {
    return apiService.get<PurchasedTutorialsResponse>('/components_data/get_purchased_tutorials', { phone });
  },
};
