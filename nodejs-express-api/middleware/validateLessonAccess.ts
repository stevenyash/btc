import { Request, Response, NextFunction } from 'express';
import DB from '../models/db.js';
import jwt from 'jsonwebtoken';
import {
  assertSubscriberDeviceAvailable,
  LessonAccessLimitError,
  registerSubscriberDevice,
} from '../services/classAccessService.js';
import { normalizeGuestPhone, readGuestSessionPhone } from '../helpers/guestSession.js';

interface LessonAccessRequest extends Request {
  user?: any;
  lessonAccess?: {
    hasAccess: boolean;
    isPreview: boolean;
    isGuest: boolean;
    accessType: 'admin' | 'subscription' | 'purchase' | 'preview' | 'none';
    lesson?: any;
    maxWatchTime?: number;
    accessMode?: 'admin' | 'subscription' | 'individual' | 'guest' | 'preview';
    deviceId?: string;
    lessonTrackId?: number;
    limitReason?: string;
  };
  isAdmin?: boolean;
  isSuperadmin?: boolean;
}

export const validateLessonAccess = async (
  req: LessonAccessRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const lessonId = req.params.recid || req.params.id;
    
    if (!lessonId) {
      return res.status(400).json({ error: 'Lesson ID is required' });
    }

    // Fetch lesson with related data
    const lesson = await DB.Lessons.findOne({
      where: { id: lessonId, is_active: true },
      include: [
        { model: DB.LearningAreas, as: 'learning_area', attributes: ['id', 'name'] },
        { model: DB.Topics, as: 'topic', attributes: ['topic_id', 'name'] },
        { model: DB.Subtopics, as: 'subtopic', attributes: ['subtopic_id', 'name'] }
      ],
      raw: false,
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found or inactive' });
    }

    const lessonData = lesson.toJSON();
    req.lessonAccess = {
      hasAccess: false,
      isPreview: false,
      isGuest: false,
      accessType: 'none',
      lesson: lessonData,
    };

    if (req.user?.id && (req.isAdmin === true || req.isSuperadmin === true)) {
      req.lessonAccess.hasAccess = true;
      req.lessonAccess.accessType = 'admin';
      req.lessonAccess.accessMode = 'admin';
      return next();
    }

    // Check if lesson is preview-available (public access)
    if (lessonData.is_preview_available) {
      req.lessonAccess.hasAccess = true;
      req.lessonAccess.isPreview = true;
      req.lessonAccess.accessType = 'preview';
      return next();
    }

    const guestPhone = normalizeGuestPhone(req.query.phone || req.body.phone);
    const isExplicitGuestRequest = req.query.guest === 'true' && guestPhone !== null;
    const sessionPhone = readGuestSessionPhone(req);

    // Extract user from JWT token (if present), unless this is an explicit guest stream request.
    let userId: number | null = null;
    let isGuest = false;

    console.log('[DEBUG] validateLessonAccess - req.user:', req.user);
    console.log('[DEBUG] validateLessonAccess - Authorization header:', req.headers.authorization?.substring(0, 20) + '...');

    if (isExplicitGuestRequest && req.user?.id) {
      const authenticatedUser = await DB.Users.findOne({
        where: { id: req.user.id },
        attributes: ['phone'],
        raw: true,
      });
      if (normalizeGuestPhone(authenticatedUser?.phone) === guestPhone) {
        userId = Number(req.user.id);
      } else {
        if (sessionPhone !== guestPhone) {
          return res.status(401).json({ error: 'Verify this phone number before streaming its purchased lessons' });
        }
        isGuest = true;
      }
    } else if (isExplicitGuestRequest) {
      if (sessionPhone !== guestPhone) {
        return res.status(401).json({ error: 'Verify this phone number before streaming its purchased lessons' });
      }
      req.guestPhone = guestPhone;
      isGuest = true;
    } else if (req.user?.id) {
      // User already authenticated by passport-jwt
      userId = req.user.id;
      console.log('[DEBUG] User already authenticated by passport-jwt, userId:', userId);
    } else {
      // Try to extract from Authorization header
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, process.env.AUTH_API_TOKEN_SECRET || 'secret') as any;
          userId = decoded.sub || decoded.id;
          console.log('[DEBUG] User extracted from token, userId:', userId, 'sub:', decoded.sub, 'id:', decoded.id);
        } catch (err: any) {
          console.log('[DEBUG] Token verification failed:', err.message);
          // Token invalid, treat as guest
          isGuest = true;
        }
      } else if (req.query.phone || req.body.phone) {
        return res.status(401).json({ error: 'Verify this phone number before streaming its purchased lessons' });
      }
    }

    // Check access for authenticated users
    if (userId) {
      const subscription = await DB.Subscriptions.findOne({
        where: {
          user_id: String(userId),
          status: 'active',
          expiry_date: { [DB.op.gte]: new Date() },
        },
        raw: true,
      });

      if (subscription) {
        const lessonTrack = await DB.LessonTrack.findOne({
          where: { user_id: userId, subscription_id: subscription.id, status: 'active' },
        });
        const packageRecord = lessonTrack
          ? await DB.Packages.findOne({ where: { id: lessonTrack.package_id }, raw: true })
          : null;
        const deviceId = String(req.query.device_id || '');

        if (lessonTrack && packageRecord) {
          if (!/^[a-zA-Z0-9_-]{16,128}$/.test(deviceId)) {
            return res.status(400).json({
              error: 'A valid playback device ID is required',
              code: 'DEVICE_ID_REQUIRED',
            });
          }

          const usedCount = await DB.SubscriptionLessonUsage.count({
            where: { subscription_id: subscription.id },
          });
          const alreadyCounted = await DB.SubscriptionLessonUsage.findOne({
            where: { subscription_id: subscription.id, lesson_id: lessonId },
          });
          const remainingWatchTime = Number(lessonTrack.remaining_watch_time_seconds || 0);
          const lessonLimitReached = !alreadyCounted && usedCount >= Number(lessonTrack.total_lessons || 0);
          const packageCanAccess = remainingWatchTime > 0 && !lessonLimitReached;
          let packageDeviceAvailable = packageCanAccess;

          if (!packageCanAccess) {
            req.lessonAccess.limitReason = remainingWatchTime <= 0
              ? 'WATCH_TIME_EXHAUSTED'
              : 'LESSON_LIMIT_REACHED';
          } else {
            try {
              if (req.query.check_only === 'true') {
                await assertSubscriberDeviceAvailable(
                  userId,
                  deviceId,
                  Number(packageRecord.concurrent_access || 1)
                );
              } else {
                await registerSubscriberDevice(
                  userId,
                  deviceId,
                  Number(lessonId),
                  Number(packageRecord.concurrent_access || 1)
                );
              }
            } catch (error) {
              if (error instanceof LessonAccessLimitError) {
                packageDeviceAvailable = false;
                req.lessonAccess.limitReason = error.code;
              } else {
                throw error;
              }
            }
          }

          if (packageCanAccess && packageDeviceAvailable) {
            req.lessonAccess.hasAccess = true;
            req.lessonAccess.accessType = 'subscription';
            req.lessonAccess.accessMode = 'subscription';
            req.lessonAccess.lessonTrackId = Number(lessonTrack.id);
            req.lessonAccess.maxWatchTime = remainingWatchTime;
            req.lessonAccess.deviceId = deviceId;
            return next();
          }

          req.lessonAccess.deviceId = deviceId;
        }
      }

      const user = await DB.Users.findOne({ where: { id: userId }, attributes: ['phone'], raw: true });
      const phone = normalizeGuestPhone(user?.phone);
      const individualPurchase = phone
        ? await DB.GuestLessonPayments.findActiveByPhoneAndLesson(phone, Number(lessonId))
        : null;
      if (individualPurchase && Number(individualPurchase.watch_time_limit_seconds) > Number(individualPurchase.watch_time_used_seconds)) {
        req.lessonAccess.hasAccess = true;
        req.lessonAccess.accessType = 'purchase';
        req.lessonAccess.accessMode = 'individual';
        req.lessonAccess.maxWatchTime =
          Number(individualPurchase.watch_time_limit_seconds) - Number(individualPurchase.watch_time_used_seconds);
        req.lessonAccess.deviceId = req.lessonAccess.deviceId || String(req.query.device_id || '');
        return next();
      }

      return res.status(403).json({
        error: 'Package access is unavailable and this lesson has no active individual purchase.',
        code: req.lessonAccess.limitReason || 'INDIVIDUAL_PURCHASE_REQUIRED',
        purchase_required: true,
        lesson: {
          id: lessonData.id,
          title: lessonData.title,
          is_preview_available: lessonData.is_preview_available,
        },
      });
    }

    // For guests (with phone number)
    if (isGuest || req.query.phone) {
      const phone = guestPhone;
      
      if (!phone) {
        return res.status(403).json({
          error: 'Access denied. Subscription or purchase required.',
          lesson: {
            id: lessonData.id,
            title: lessonData.title,
            is_preview_available: lessonData.is_preview_available,
          },
        });
      }

      const lessonSettings = await DB.LessonSetting.findOne({
        where: { subscription_type: 'non_subscribed' },
        attributes: ['duration'],
        raw: true,
      });
      const maxWatchTime = (Number(lessonSettings?.duration) || 90) * 60;
      const watchRecord = await DB.LessonAccessLogs.findOne({
        where: {
          phone,
          lesson_id: lessonId,
        },
        attributes: ['watch_time'],
        raw: true,
      });
      const remainingWatchTime = Math.max(0, maxWatchTime - Number(watchRecord?.watch_time || 0));

      // Check a completed guest payment that has not expired.
      const guestPayment = await DB.GuestLessonPayments.findActiveByPhoneAndLesson(phone, Number(lessonId));
      if (guestPayment &&
          Number(guestPayment.watch_time_limit_seconds) > Number(guestPayment.watch_time_used_seconds)) {
        req.lessonAccess.hasAccess = true;
        req.lessonAccess.isGuest = true;
        req.lessonAccess.accessType = 'purchase';
        req.lessonAccess.accessMode = 'individual';
        req.lessonAccess.maxWatchTime =
          Number(guestPayment.watch_time_limit_seconds) - Number(guestPayment.watch_time_used_seconds);
        return next();
      }

      // Keep support for legacy guest tracker records, but require an unexpired grant.
      const guestTracker = await DB.GuestTracker.findOne({
        where: {
          phone,
          lesson_id: lessonId,
          status: 'completed',
          expires_at: { [DB.op.gt]: new Date() },
        },
        raw: true,
      });

      if (guestTracker && remainingWatchTime > 0) {
        req.lessonAccess.hasAccess = true;
        req.lessonAccess.isGuest = true;
        req.lessonAccess.accessType = 'purchase';
        req.lessonAccess.accessMode = 'guest';
        req.lessonAccess.maxWatchTime = remainingWatchTime;
        return next();
      }

      // Keep access for legacy transactions only within the configured lesson duration.
      const transaction = await DB.Transactions.findOne({
        where: {
          phone_number: phone,
          lesson_id: lessonId,
          status: 'success',
          payment_status: 'completed',
          created_at: { [DB.op.gte]: new Date(Date.now() - maxWatchTime * 1000) },
        },
        raw: true,
      });

      if (transaction && remainingWatchTime > 0) {
        req.lessonAccess.hasAccess = true;
        req.lessonAccess.isGuest = true;
        req.lessonAccess.accessType = 'purchase';
        req.lessonAccess.accessMode = 'guest';
        req.lessonAccess.maxWatchTime = remainingWatchTime;
        return next();
      }

      if (remainingWatchTime <= 0) {
        await DB.LessonAccessLogs.update(
          { status: 'completed', completed_at: new Date() },
          { where: { phone, lesson_id: lessonId, status: 'active' } }
        );
      } else {
        await DB.LessonAccessLogs.update(
          { status: 'expired' },
          {
            where: {
              phone,
              lesson_id: lessonId,
              status: 'active',
              expires_at: { [DB.op.lte]: new Date() },
            },
          }
        );
      }
    }

    // No access - final fallback
    return res.status(403).json({
      error: 'Access denied. Subscription or lesson purchase required.',
      lesson: {
        id: lessonData.id,
        title: lessonData.title,
        is_preview_available: lessonData.is_preview_available,
        price: lessonData.price,
      },
      purchase_required: true,
    });
  } catch (error: any) {
    console.error('Lesson access validation error:', error);
    return res.status(500).json({ error: 'Internal server error during access validation' });
  }
};

// Simplified version for just checking if user can stream
export const canStreamLesson = async (
  req: LessonAccessRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const lessonId = req.params.recid || req.params.id;
    const userId = req.user?.id || req.query.user_id;
    const phone = req.query.phone as string;

    // First check if lesson is preview available
    const lesson = await DB.Lessons.findOne({
      where: { id: lessonId, is_active: true },
      attributes: ['is_preview_available'],
      raw: true,
    });

    if (lesson?.is_preview_available) {
      return next();
    }

    // Guest access
    if (!userId && phone) {
      // Get non-subscribed lesson settings for guest preview duration
      const lessonSettings = await DB.LessonSetting.findOne({
        where: { subscription_type: 'non_subscribed' },
        raw: true
      });
      const nonSubscribedDurationSeconds = (lessonSettings?.duration || 90) * 60; // Convert minutes to seconds

      const guestPayment = await DB.GuestLessonPayments.findOne({
        where: { phone, lesson_id: lessonId, transaction_status: 'completed' },
        raw: true,
      });

      if (guestPayment) {
        return next();
      }

      const transaction = await DB.Transactions.findOne({
        where: { phone_number: phone, lesson_id: lessonId, status: 'success' },
        raw: true,
      });

      if (transaction) {
        return next();
      }

      // Check if lesson is preview available for non-subscribed guests
      const lesson = await DB.Lessons.findOne({
        where: { id: lessonId, is_active: true },
        attributes: ['is_preview_available'],
        raw: true,
      });

      if (lesson?.is_preview_available) {
        // Allow preview access with non_subscribed duration limit
       req.lessonAccess = {
           hasAccess: true,
           isGuest: true,
           isPreview: true,
           accessType: 'preview',
           maxWatchTime: nonSubscribedDurationSeconds,
         };
        return next();
      }

      return res.status(403).json({ error: 'Lesson purchase required for guest access' });
    }

    // Authenticated user
    if (userId) {
      const subscription = await DB.Subscriptions.findOne({
        where: { user_id: String(userId), status: 'active' },
        raw: true,
      });

      if (subscription) {
        return next();
      }

      const purchase = await DB.Transactions.findOne({
        where: { user_id: userId, lesson_id: lessonId, status: 'success' },
        raw: true,
      });

      if (purchase) {
        return next();
      }

      const lessonTrack = await DB.LessonTrack.findOne({
        where: { user_id: userId, status: 'active' },
        raw: true,
      });

      if (lessonTrack && lessonTrack.lesson_balance > 0) {
        return next();
      }

      return res.status(403).json({ error: 'Subscription or lesson purchase required' });
    }

    return res.status(401).json({ error: 'Authentication required' });
  } catch (error: any) {
    console.error('Stream access error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};