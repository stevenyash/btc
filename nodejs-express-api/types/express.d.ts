import { Request } from 'express';

declare module 'express' {
  export interface Request {
    user?: {
      id: number;
      username: string;
      email: string;
      phone?: string;
      account_status?: string;
      user_role_id?: number;
    } | null;
    userRoleId?: number;
    userRoleName?: string;
    isAdmin?: boolean;
    isSubscriber?: boolean;
    isMarketer?: boolean;
    isTeacher?: boolean;
    isSuperadmin?: boolean;
    isGuest?: boolean;
    guestPhone?: string;
  }
}
