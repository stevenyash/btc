import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import Rbac from './rbac.js';
import passportLogin from './passport-auth.js';

  const publicPages = [
    'auth', 'auth/login', 'auth/csrf-token', 'auth/logout', 'auth/forgotusercode', 'auth/resetusercode',
    'components_data', 'home',
    'services', 'products', 'subscribe', 'viewlessons', 'guide', 'customlogin',
    'subscriptionshow', 'buypackages', 'guestlessons', 'guestclass', 'guestwatching',
    'weekendtutorials', 'oauthcallback', 'aboutus', 'contactus', 'newslettersubscribers/add',
    'questions/add', 'transactions/add', 'users/subscribeuser', 'tutorialssettings',
    'learningareas/index', 'grades/index', 'lessons/index', 'topics/index', 'subtopics/index',
    'learninglevels/index', 'lessons/stream-url',
    'userprivileges/index', 'userprivileges/available-privileges', 'userprivileges/user', 'userprivileges/view',
    'userprivileges/edit', 'userprivileges/delete', 'users/index', 'users/view',
    'components_data/guest_lesson_status', 'components_data/guest_lessons_status',
    'components_data/guest_initiate_payment', 'components_data/guest_payment_callback',
    'components_data/guest_purchase_lesson', 'components_data/guest_update_watch_time',
    'components_data/verify_phone', 'components_data/lesson_fees',
    'components_data/learninglevels', 'components_data/grades_by_level',
    'components_data/learningareas', 'components_data/lessons',
    'invites', 'invites/index',
    'hls/manifest', 'hls/stream', // Public access for HLS endpoints (token-based auth)
    'migration', // Migration admin endpoints
  ];

interface CustomRequest extends Request {
  userRoleId?: number;
  userRoleName?: string;
  pageAccess?: string;
  rolePermissions?: Record<string, unknown>;
  hasPermission?: (page: string, action: string) => boolean;
  userPages?: string[];
  isAdmin?: boolean;
  isSubscriber?: boolean;
  isMarketer?: boolean;
  isTeacher?: boolean;
  isSuperadmin?: boolean;
  isGuest?: boolean;
  user?: any;
}

export async function passportJwtLogin(req: Request, res: Response, next: NextFunction) {
  passportLogin();
  passport.authenticate('jwt', { session: false }, async (err: Error | null, user: unknown, info: unknown) => {
    if (err) {
      console.error('[DEBUG] Passport auth error:', err);
      (req as any).user = undefined;
    } else if (!user) {
      console.log('[DEBUG] Passport auth: No user found, info:', info);
      (req as any).user = undefined;
    } else {
      console.log('[DEBUG] Passport auth: User authenticated, id:', (user as any)?.id, 'account_status:', (user as any)?.account_status);
      (req as any).user = user;
    }
    return next();
  })(req, res, next);
}

export async function authMiddleware(req: CustomRequest, res: Response & { forbidden?: (message?: string) => Response; unauthorized?: (message?: string) => Response; serverError?: (message: unknown) => Response }, next: NextFunction) {
  try {
    // Skip auth for OPTIONS preflight requests - let CORS handle it
    if (req.method === 'OPTIONS') {
      return next();
    }

    // DEBUG: Log incoming request path
    console.log('[AUTH] Path:', req.path, 'Method:', req.method);

    if (req.user) {
      const userRoleId = req.user.user_role_id ?? 0;
      const userId = req.user.id ?? 0;

      const rbac = new Rbac(userRoleId, userId);
      await rbac.getUserPages();

      const pageAccess = await rbac.getPageAccess(req.path);
      const roleName = await rbac.getRoleName();

      req.pageAccess = pageAccess;
      req.userRoleId = userRoleId;
      req.userRoleName = roleName;
      req.rolePermissions = rbac.rolePermissions;
      req.hasPermission = (page: string, action: string) => rbac.hasPermission(page, action);
      req.userPages = rbac.userPages;

      switch (roleName) {
        case 'admin':
          req.isAdmin = true;
          break;
        case 'subscriber':
          req.isSubscriber = true;
          break;
        case 'marketer':
          req.isMarketer = true;
          break;
        case 'teacher':
          req.isTeacher = true;
          break;
        case 'superadmin':
          req.isSuperadmin = true;
          break;
        default:
          req.isGuest = true;
      }
    }

    const arrPath = req.path.split('/').filter(Boolean);
    const page = arrPath[0];
    const action = arrPath[1] || 'index';
    const pagePath = `${page}/${action}`;
    console.log('[AUTH] page:', page, 'action:', action, 'pagePath:', pagePath);

    const isPublicPage = publicPages.includes(pagePath) || publicPages.includes(page);

    if (isPublicPage || req.pageAccess === Rbac.AUTHORIZED || req.isSuperadmin) {
      return next();
    } else if (req.pageAccess === Rbac.FORBIDDEN) {
      return res.forbidden();
    } else if (req.pageAccess === Rbac.UNKNOWN_ROLE) {
      return res.forbidden('Unknown Role');
    }

    return res.unauthorized();
  } catch (err) {
    return res.serverError(err);
  }
}
