import { api } from "./api";

const AWS_REGION = import.meta.env.VITE_AWS_REGION || "af-south-1";
const AWS_BUCKET = import.meta.env.VITE_AWS_BUCKET || "tutorconnect-videos-af";
const AWS_CLOUD_FRONT_URL = import.meta.env.VITE_AWS_CLOUD_FRONT_URL || "https://d3pkph1cb2mmsm.cloudfront.net";

export const awsConfig = {
  region: AWS_REGION,
  bucket: AWS_BUCKET,
  cloudFrontUrl: AWS_CLOUD_FRONT_URL,
};

let configLoaded = false;

export const fetchAwsConfig = async (): Promise<typeof awsConfig> => {
  if (configLoaded) return awsConfig;
  
  try {
    const response = await api.get("/components_data/aws_config");
    if (response.data) {
      awsConfig.region = response.data.region || AWS_REGION;
      awsConfig.bucket = response.data.bucket || AWS_BUCKET;
      awsConfig.cloudFrontUrl = response.data.cloudFrontUrl || AWS_CLOUD_FRONT_URL;
      configLoaded = true;
    }
  } catch (error) {
    console.warn("Failed to fetch AWS config from backend, using .env values");
  }
  
  return awsConfig;
};

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalRevenue: number;
  pendingPayments: number;
  monthlyGrowth: number;
}

export interface RecentUser {
  id: number;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

export interface RecentTransaction {
  id: number;
  user: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  phone_number?: string | null;
  transaction_reference?: string | null;
  checkout_request_id?: string | null;
  callback_amount?: number | null;
  payment_status?: string | null;
  activation_status?: string | null;
  activation_type?: string | null;
  lesson_id?: number | null;
}

export interface User {
  id: number;
  name: string;
  first_name?: string;
  email: string;
  phone?: string;
  role: string;
  role_id?: number;
  user_role_id?: number;
  status: string;
  subscription_code?: string;
  created_at: string;
}

export interface SubscriptionPackage {
  id: number;
  name: string;
  fee: number;
  duration_days: number;
  active_subscribers: number;
  total_subscribers: number;
}

export interface Marketer {
  id: number;
  user_id: number;
  user_name: string;
  email: string;
  phone: string;
  referral_code: string;
  total_invites: number;
  active_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  status: string;
  created_at: string;
}

export interface CreateMarketerData {
  user_id?: number;
  name?: string;
  email?: string;
  phone?: string;
  referral_code?: string;
}

export interface Lesson {
    id: number;
    title: string;
    description: string;
    grade: string;
    grade_id?: number;
    level?: string;
    level_id?: number;
    area_name?: string;
    subject: string; // display name of topic
    strand?: string; // display name of subtopic
    video_url?: string;
    s3_url?: string;
    storage_path?: string | null;
    bunny_url?: string | null;
    bunny_video_id?: string | null;
    video_guid?: string | null;
    transcoding_status?: 'pending' | 'processing' | 'completed' | 'failed';
    mp4_urls?: string | null;
    thumbnail_url?: string;
    duration_minutes?: number;
    file_size_mb?: number;
    file_type: string;
    is_active?: boolean;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
    // Additional numeric IDs for hierarchy (not always present in list)
    area_id?: number;
    topic_id?: number;
    subtopic_id?: number;
  }

export interface LearningLevel {
    id: number;
    name: string;
    description: string;
    sort_order: number;
    is_active: boolean;
}

export interface Grade {
    id: number;
    name: string;
    description: string;
    level_id: number;
    sort_order: number;
    is_active: boolean;
    learning_level_name?: string;
}

export interface LearningArea {
    id: number;
    name: string;
    description: string;
    grade_id: number;
    color: string;
    icon: string;
    sort_order: number;
    is_active: boolean;
    grade_name?: string;
}

export interface Topic {
    id: number;
    name: string;
    description: string;
    area_id: number;
    sort_order: number;
    is_active: boolean;
    learning_area_name?: string;
}

export interface Subtopic {
    id: number;
    name: string;
    description: string;
    topic_id: number;
    sort_order: number;
    is_active: boolean;
    topic_name?: string;
}

export interface CommissionSettings {
    default_commission_rate: number;
    point_value: number;
    min_withdrawal_amount: number;
    min_points_redemption: number;
}

export interface MarketerCommission {
    id: number;
    marketer_id: number;
    marketer_name: string;
    marketer_phone: string;
    user_id: number;
    user_name: string;
    transaction_id: number | null;
    purchase_type: string;
    purchase_amount: number;
    commission_rate: number;
    commission_amount: number;
    status: string;
    created_at: string;
}

export interface MarketerWithdrawal {
    id: number;
    marketer_id: number;
    marketer_name: string;
    marketer_phone: string;
    amount: number;
    phone_number: string;
    source: string;
    status: string;
    mpesa_receipt: string | null;
    remarks: string | null;
    created_at: string;
    processed_at: string | null;
}

export interface MarketerRedemption {
    id: number;
    marketer_id: number;
    marketer_name: string;
    marketer_phone: string;
    points_redeemed: number;
    point_value: number;
    cash_amount: number;
    status: string;
    remarks: string | null;
    created_at: string;
}

export interface Package {
  id: number;
  subscription_type_id: number;
  subscription_type_name?: string;
  name: string;
  description: string | null;
  fee: number;
  concurrent_access: number;
  no_of_lessons: number;
  watch_time_minutes: number;
  duration_amount: number;
  duration_unit: string;
  created_at: string;
}

export interface CreatePackageData {
  subscription_type_id: number;
  name: string;
  description?: string;
  fee: number;
  concurrent_access: number;
  no_of_lessons: number;
  watch_time_minutes: number;
  duration_amount: number;
  duration_unit: string;
}

export interface SubscriptionType {
  id: number;
  name: string;
  description: string | null;
  membership_fee: number;
  months: number;
  created_at?: string;
}

export interface CreateLessonData {
    title: string;
    description: string;
    grade?: string; // DEPRECATED: use areaId
    subject?: string; // DEPRECATED: use topicId
    strand?: string; // DEPRECATED: use subtopicId
    video_url?: string;
    s3_url?: string;
    s3_key?: string;
    storage_path?: string | null;
    bunny_url?: string | null;
    bunny_video_id?: string | null;
    video_guid?: string | null;
    transcoding_status?: 'pending' | 'processing' | 'completed' | 'failed';
    mp4_urls?: string | null;
    thumbnail_url?: string;
    duration_minutes?: number;
    status?: 'active' | 'inactive';
    is_active?: boolean;
    // New numeric IDs for hierarchy
    areaId?: number;
    topicId?: number;
    subtopicId?: number;
    gradeId?: number;
    levelId?: number;
    price?: number;
    is_preview_available?: boolean;
    preview_duration?: number;
  }

export interface CreateUserData {
  username: string;
  email: string;
  phone: string;
  usercode: string;
  role_id?: number;
  role?: string;
  account_status?: string;
}

export interface AdminService {
  getStats(): Promise<AdminStats>;
  getRecentUsers(limit?: number): Promise<RecentUser[]>;
  getRecentTransactions(limit?: number): Promise<RecentTransaction[]>;
  getSubscriptionPackages(): Promise<SubscriptionPackage[]>;
  getPackages(page?: number, limit?: number): Promise<{ data: Package[]; total: number }>;
  getPackage(id: number): Promise<Package>;
  createPackage(data: CreatePackageData): Promise<Package>;
  updatePackage(id: number, data: Partial<CreatePackageData>): Promise<Package>;
  deletePackage(id: number): Promise<void>;
  getSubscriptionTypes(page?: number, limit?: number): Promise<{ data: SubscriptionType[]; total: number }>;
  getSubscriptionType(id: number): Promise<SubscriptionType>;
  createSubscriptionType(data: Omit<SubscriptionType, 'id' | 'created_at'>): Promise<SubscriptionType>;
  updateSubscriptionType(id: number, data: Partial<SubscriptionType>): Promise<SubscriptionType>;
  deleteSubscriptionType(id: number): Promise<void>;
   getUsers(page?: number, limit?: number, role?: string, status?: string): Promise<{ data: User[]; total: number }>;
   getUser(id: number): Promise<User>;
   createUser(data: CreateUserData): Promise<User>;
   updateUser(id: number, data: Partial<User>): Promise<User>;
   deleteUser(id: number): Promise<void>;
  getTransactions(page?: number, limit?: number, status?: string, search?: string): Promise<{ data: RecentTransaction[]; total: number }>;
  updateTransaction(id: number, data: Partial<RecentTransaction>): Promise<RecentTransaction>;
  deleteTransaction(id: number): Promise<void>;
    getMarketers(page?: number, limit?: number): Promise<{ data: Marketer[]; total: number }>;
    createMarketer(data: CreateMarketerData): Promise<Marketer>;
    updateMarketer(id: number, data: Partial<Marketer>): Promise<Marketer>;
    deleteMarketer(id: number): Promise<void>;
    resendMarketerCredentials(id: number): Promise<void>;
    getAvailableUsersForMarketer(): Promise<RecentUser[]>;
  getLessons(page?: number, limit?: number): Promise<{ data: Lesson[]; total: number }>;
  getLesson(id: number): Promise<Lesson>;
  createLesson(data: CreateLessonData): Promise<Lesson>;
  updateLesson(id: number, data: Partial<Lesson>): Promise<Lesson>;
  toggleLesson(id: number): Promise<{ id: number; is_active: boolean; status: string }>;
  deleteLesson(id: number): Promise<void>;
    uploadLessonFile(file: File, onProgress?: (progress: number) => void): Promise<{ url: string; key: string }>;
    getPresignedUploadUrl(fileName: string, fileType: string): Promise<{ uploadUrl: string; fileUrl: string; key: string }>;
    uploadDirectToS3(file: File, onProgress?: (progress: number) => void): Promise<{ url: string; key: string }>;
   createLessonWithVideo(formData: FormData, onProgress?: (progress: number) => void): Promise<Lesson>;
   getGrades(): Promise<{ id: number; name: string }[]>;
  getSubjects(): Promise<{ id: number; name: string }[]>;
  getStrands(): Promise<{ id: number; name: string }[]>;
  getSubscriptionTypes(): Promise<{ id: number; name: string }[]>;
  getLearningLevels(): Promise<any[]>;
  createLearningLevel(data: any): Promise<any>;
  updateLearningLevel(id: number, data: any): Promise<any>;
  deleteLearningLevel(id: number): Promise<void>;
  getAllGrades(): Promise<any[]>;
  createGrade(data: any): Promise<any>;
  updateGrade(id: number, data: any): Promise<any>;
  deleteGrade(id: number): Promise<void>;
  getAllLearningAreas(): Promise<any[]>;
  createLearningArea(data: any): Promise<any>;
  updateLearningArea(id: number, data: any): Promise<any>;
  deleteLearningArea(id: number): Promise<void>;
  getAllTopics(): Promise<any[]>;
  createTopic(data: any): Promise<any>;
  updateTopic(id: number, data: any): Promise<any>;
  deleteTopic(id: number): Promise<void>;
   getAllSubtopics(): Promise<any[]>;
   createSubtopic(data: any): Promise<any>;
   updateSubtopic(id: number, data: any): Promise<any>;
   deleteSubtopic(id: number): Promise<void>;

   // Marketer earnings
   getCommissionSettings(): Promise<any>;
   updateCommissionSettings(data: { default_commission_rate?: number; point_value?: number; min_withdrawal_amount?: number; min_points_redemption?: number; }): Promise<any>;
   getMarketerCommissions(page?: number, limit?: number, status?: string): Promise<{ data: any[]; total: number }>;
   updateMarketerCommission(id: number, data: { status: string }): Promise<any>;
   getMarketerWithdrawals(page?: number, limit?: number, status?: string): Promise<{ data: any[]; total: number }>;
   updateMarketerWithdrawal(id: number, data: { status: string; remarks?: string }): Promise<any>;
   getMarketerRedemptions(page?: number, limit?: number, status?: string): Promise<{ data: any[]; total: number }>;
   updateMarketerRedemption(id: number, data: { status: string; remarks?: string }): Promise<any>;
 }

export const adminService: AdminService = {
  async getStats(): Promise<AdminStats> {
    const response = await api.get("/admin/stats");
    const data = response.data || {};
    return {
      totalUsers: data.total_users || 0,
      activeUsers: data.active_users || 0,
      totalSubscriptions: data.total_subscriptions || 0,
      activeSubscriptions: data.active_subscriptions || 0,
      totalRevenue: data.total_revenue || 0,
      pendingPayments: data.pending_payments || 0,
      monthlyGrowth: data.monthly_growth || 0,
    };
  },

  async getRecentUsers(limit: number = 5): Promise<RecentUser[]> {
    const response = await api.get("/admin/recent-users");
    const data = response.data || [];
    return data.slice(0, limit);
  },

  async getRecentTransactions(limit: number = 5): Promise<RecentTransaction[]> {
    const response = await api.get("/admin/recent-transactions");
    const data = response.data || [];
    return data.slice(0, limit);
  },

  async getSubscriptionPackages(): Promise<SubscriptionPackage[]> {
    const response = await api.get("/components_data/packages_public");
    return response.data || [];
  },

  async getPackages(page: number = 1, limit: number = 20): Promise<{ data: Package[]; total: number }> {
    const response = await api.get("/packages", {
      params: { page, limit }
    });
    const responseData = response.data;
    return {
      data: Array.isArray(responseData) ? responseData : (responseData?.data || responseData?.records || []),
      total: responseData?.total || responseData?.count || 0
    };
  },

  async getPackage(id: number): Promise<Package> {
    const response = await api.get(`/packages/view/${id}`);
    return response.data;
  },

  async createPackage(data: CreatePackageData): Promise<Package> {
    const response = await api.post("/packages/add", {
      ...data,
      created_at: new Date().toISOString()
    });
    return response.data;
  },

  async updatePackage(id: number, data: Partial<CreatePackageData>): Promise<Package> {
    const response = await api.post(`/packages/edit/${id}`, data);
    return response.data;
  },

  async deletePackage(id: number): Promise<void> {
    await api.get(`/packages/delete/${id}`);
  },

   async getSubscriptionTypes(page?: number, limit?: number): Promise<any> {
     // No arguments: return simple list for dropdowns
     if (page === undefined && limit === undefined) {
       const response = await api.get("/admin/subscription-types")
       const types = (response.data?.data || response.data || []).map((t: any) => ({
         id: t.id,
         name: t.name
       }))
       return types
     }
     // With pagination: return paginated result
     const pageNum = page ?? 1
     const limitNum = limit ?? 20
     const response = await api.get("/admin/subscription-types", {
       params: { page: pageNum, limit: limitNum }
     })
      return {
        data: response.data?.data || response.data || [],
        total: response.data?.total || 0
      }
    },

   async getSubscriptionType(id: number): Promise<SubscriptionType> {
      const response = await api.get(`/admin/subscription-types/${id}`);
     return response.data;
   },

   async createSubscriptionType(data: Omit<SubscriptionType, 'id' | 'created_at'>): Promise<SubscriptionType> {
      const response = await api.post("/admin/subscription-types", data);
     return response.data;
   },

   async updateSubscriptionType(id: number, data: Partial<SubscriptionType>): Promise<SubscriptionType> {
      const response = await api.put(`/admin/subscription-types/${id}`, data);
     return response.data;
   },

   async deleteSubscriptionType(id: number): Promise<void> {
      await api.delete(`/admin/subscription-types/${id}`);
   },

   async getUsers(page: number = 1, limit: number = 20, role?: string, status?: string): Promise<{ data: User[]; total: number }> {
      const response = await api.get("/admin/users", {
        params: { page, limit, role, status }
      });
      return {
        data: response.data?.users || response.data?.data || [],
        total: response.data?.pagination?.total || response.data?.total || 0
      };
    },

    async getUser(id: number): Promise<User> {
      const response = await api.get(`/admin/users/${id}`);
      return response.data;
    },

    async createUser(data: CreateUserData): Promise<User> {
      const response = await api.post("/users/add", data);
      return response.data;
    },

    async updateUser(id: number, data: Partial<User>): Promise<User> {
      const response = await api.put(`/admin/users/${id}`, data);
      return response.data;
    },

    async deleteUser(id: number): Promise<void> {
      await api.delete(`/admin/users/${id}`);
    },

   async getTransactions(page: number = 1, limit: number = 20, status?: string, search?: string): Promise<{ data: RecentTransaction[]; total: number }> {
     const response = await api.get("/admin/transactions", {
       params: { page, limit, status: status || undefined, search: search || undefined }
     });
     return {
       data: response.data?.data || response.data || [],
       total: response.data?.total || 0
     };
   },

   async updateTransaction(id: number, data: Partial<RecentTransaction>): Promise<RecentTransaction> {
     const response = await api.put(`/admin/transactions/${id}`, data);
     return response.data;
   },

   async deleteTransaction(id: number): Promise<void> {
     await api.delete(`/admin/transactions/${id}`);
   },

  async getMarketers(page: number = 1, limit: number = 20): Promise<{ data: Marketer[]; total: number }> {
    const response = await api.get("/admin/marketers", {
      params: { page, limit }
    });
    return {
      data: response.data?.data || response.data || [],
      total: response.data?.total || 0
    };
  },

  async resendMarketerCredentials(id: number): Promise<void> {
    await api.post(`/admin/marketers/${id}/resend-credentials`);
  },

  async createMarketer(data: CreateMarketerData): Promise<Marketer> {
    const response = await api.post("/admin/marketers", data);
    return response.data;
  },

  async updateMarketer(id: number, data: Partial<Marketer>): Promise<Marketer> {
    const response = await api.put(`/admin/marketers/${id}`, data);
    return response.data;
  },

  async deleteMarketer(id: number): Promise<void> {
    await api.delete(`/admin/marketers/${id}`);
  },

  async getAvailableUsersForMarketer(): Promise<RecentUser[]> {
    const response = await api.get("/admin/users-available-for-marketer");
    return response.data || [];
  },

  async getMarketerCommissions(page: number = 1, limit: number = 20, status?: string): Promise<{ data: any[]; total: number }> {
    const response = await api.get("/admin/marketer-commissions", {
      params: { page, limit, status }
    });
    return {
      data: response.data?.data || response.data || [],
      total: response.data?.total || 0
    };
  },

  async updateMarketerCommission(id: number, data: { status: string }): Promise<any> {
    const response = await api.put(`/admin/marketer-commissions/${id}`, data);
    return response.data;
  },

  async getMarketerWithdrawals(page: number = 1, limit: number = 20, status?: string): Promise<{ data: any[]; total: number }> {
    const response = await api.get("/admin/marketer-withdrawals", {
      params: { page, limit, status }
    });
    return {
      data: response.data?.data || response.data || [],
      total: response.data?.total || 0
    };
  },

  async updateMarketerWithdrawal(id: number, data: { status: string; remarks?: string }): Promise<any> {
    const response = await api.put(`/admin/marketer-withdrawals/${id}`, data);
    return response.data;
  },

  async getMarketerRedemptions(page: number = 1, limit: number = 20, status?: string): Promise<{ data: any[]; total: number }> {
    const response = await api.get("/admin/marketer-redemptions", {
      params: { page, limit, status }
    });
    return {
      data: response.data?.data || response.data || [],
      total: response.data?.total || 0
    };
  },

  async updateMarketerRedemption(id: number, data: { status: string; remarks?: string }): Promise<any> {
    const response = await api.put(`/admin/marketer-redemptions/${id}`, data);
    return response.data;
  },

  async getCommissionSettings(): Promise<any> {
    const response = await api.get("/admin/commission-settings");
    return response.data;
  },

  async updateCommissionSettings(data: {
    default_commission_rate?: number;
    point_value?: number;
    min_withdrawal_amount?: number;
    min_points_redemption?: number;
  }): Promise<any> {
    const response = await api.put("/admin/commission-settings", data);
    return response.data;
  },

  async getLessons(page: number = 1, limit: number = 20): Promise<{ data: Lesson[]; total: number }> {
    const response = await api.get("/admin/admin_lessons", {
      params: { page, limit }
    });
    const rawData = response.data?.data || response.data || [];
    const mappedData = rawData.map((l: any) => ({
      ...l,
      is_active: l.is_active,
      status: l.is_active ? 'active' : 'inactive'
    }));
    return {
      data: mappedData,
      total: response.data?.total || 0
    };
  },

  async getLesson(id: number): Promise<Lesson> {
    const response = await api.get(`/admin/admin_lessons/${id}`);
    return response.data;
  },

  async createLesson(data: CreateLessonData): Promise<Lesson> {
    const response = await api.post("/admin/admin_lessons", data);
    return response.data;
  },

  async updateLesson(id: number, data: Partial<Lesson>): Promise<Lesson> {
    const response = await api.put(`/admin/admin_lessons/${id}`, data);
    return response.data;
  },

  async toggleLesson(id: number): Promise<{ id: number; is_active: boolean; status: string }> {
    const response = await api.patch(`/admin/admin_lessons/${id}/toggle`);
    return response.data;
  },

  async deleteLesson(id: number): Promise<void> {
    await api.delete(`/admin/admin_lessons/${id}`);
  },

  async uploadLessonFile(file: File, onProgress?: (progress: number) => void): Promise<{ url: string; key: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/admin/admin_lessons/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
    return response.data;
  },

  async getPresignedUploadUrl(fileName: string, fileType: string): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    const response = await api.get("/admin/admin_lessons/presigned-url", {
      params: { fileName, fileType }
    });
    return response.data;
  },

    async uploadDirectToS3(file: File, _onProgress?: (progress: number) => void): Promise<{ url: string; key: string }> {
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const { uploadUrl, fileUrl, key } = await this.getPresignedUploadUrl(fileName, file.type);

      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      return { url: fileUrl, key };
    },

   /**
    * Create lesson with Bunny video upload in a single request.
    */
   async createLessonWithVideo(formData: FormData, onProgress?: (progress: number) => void): Promise<Lesson> {
     const response = await api.post("/admin/admin_lessons/upload", formData, {
       onUploadProgress: (e) => {
         if (onProgress && e.total) {
           onProgress(Math.round((e.loaded * 100) / e.total));
         }
       },
     });
     return response.data;
   },

   async getGrades(): Promise<{ id: number; name: string }[]> {
    const response = await api.get("/admin/grades_option_list");
    return response.data || [];
  },

  async getSubjects(): Promise<{ id: number; name: string }[]> {
    const response = await api.get("/admin/subjects_option_list");
    return response.data || [];
  },

  async getStrands(): Promise<{ id: number; name: string }[]> {
    const response = await api.get("/admin/strands_option_list");
    return response.data || [];
  },

  // Learning Hierarchy CRUD
  async getLearningLevels(): Promise<any[]> {
    const response = await api.get("/admin/learning_levels");
    return response.data || [];
  },
  async createLearningLevel(data: any): Promise<any> {
    const response = await api.post("/admin/learning_levels", data);
    return response.data;
  },
  async updateLearningLevel(id: number, data: any): Promise<any> {
    const response = await api.put(`/admin/learning_levels/${id}`, data);
    return response.data;
  },
  async deleteLearningLevel(id: number): Promise<void> {
    await api.delete(`/admin/learning_levels/${id}`);
  },

  async getAllGrades(): Promise<any[]> {
    const response = await api.get("/admin/grades");
    return response.data || [];
  },
  async createGrade(data: any): Promise<any> {
    const response = await api.post("/admin/grades", data);
    return response.data;
  },
  async updateGrade(id: number, data: any): Promise<any> {
    const response = await api.put(`/admin/grades/${id}`, data);
    return response.data;
  },
  async deleteGrade(id: number): Promise<void> {
    await api.delete(`/admin/grades/${id}`);
  },

  async getAllLearningAreas(): Promise<any[]> {
    const response = await api.get("/admin/learning_areas");
    return response.data || [];
  },
  async createLearningArea(data: any): Promise<any> {
    const response = await api.post("/admin/learning_areas", data);
    return response.data;
  },
  async updateLearningArea(id: number, data: any): Promise<any> {
    const response = await api.put(`/admin/learning_areas/${id}`, data);
    return response.data;
  },
  async deleteLearningArea(id: number): Promise<void> {
    await api.delete(`/admin/learning_areas/${id}`);
  },

  async getAllTopics(): Promise<any[]> {
    const response = await api.get("/admin/topics");
    return response.data || [];
  },
  async createTopic(data: any): Promise<any> {
    const response = await api.post("/admin/topics", data);
    return response.data;
  },
  async updateTopic(id: number, data: any): Promise<any> {
    const response = await api.put(`/admin/topics/${id}`, data);
    return response.data;
  },
  async deleteTopic(id: number): Promise<void> {
    await api.delete(`/admin/topics/${id}`);
  },

  async getAllSubtopics(): Promise<any[]> {
    const response = await api.get("/admin/subtopics");
    return response.data || [];
  },
  async createSubtopic(data: any): Promise<any> {
    const response = await api.post("/admin/subtopics", data);
    return response.data;
  },
  async updateSubtopic(id: number, data: any): Promise<any> {
    const response = await api.put(`/admin/subtopics/${id}`, data);
    return response.data;
  },
  async deleteSubtopic(id: number): Promise<void> {
    await api.delete(`/admin/subtopics/${id}`);
  },
};
