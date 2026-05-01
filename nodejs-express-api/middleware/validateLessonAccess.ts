import { Request, Response, NextFunction } from 'express';
import DB from '../models/db.js';
import jwt from 'jsonwebtoken';

interface LessonAccessRequest extends Request {
  user?: any;
  lessonAccess?: {
    hasAccess: boolean;
    isPreview: boolean;
    isGuest: boolean;
    accessType: 'subscription' | 'purchase' | 'preview' | 'none';
    lesson?: any;
    maxWatchTime?: number;
  };
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

    // Check if lesson is preview-available (public access)
    if (lessonData.is_preview_available) {
      req.lessonAccess.hasAccess = true;
      req.lessonAccess.isPreview = true;
      req.lessonAccess.accessType = 'preview';
      return next();
    }

    // Extract user from JWT token (if present)
    let userId: number | null = null;
    let isGuest = false;

    console.log('[DEBUG] validateLessonAccess - req.user:', req.user);
    console.log('[DEBUG] validateLessonAccess - Authorization header:', req.headers.authorization?.substring(0, 20) + '...');

    if (req.user?.id) {
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
        // Guest access with phone number
        isGuest = true;
      }
    }

    // Check access for authenticated users
    if (userId) {
      // Check subscription
      const subscription = await DB.Subscriptions.findOne({
        where: {
          user_id: String(userId),
          status: 'active',
          expiry_date: { [DB.op.gte]: new Date() },
        },
        raw: true,
      });
      
      console.log('[DEBUG] Subscription found:', subscription);

      if (subscription) {
        req.lessonAccess.hasAccess = true;
        req.lessonAccess.accessType = 'subscription';
        return next();
      }

      // Check if user purchased this lesson
      const purchase = await DB.Transactions.findOne({
        where: {
          user_id: userId,
          lesson_id: lessonId,
          status: 'success',
          payment_status: 'completed',
        },
        raw: true,
      });

      if (purchase) {
        req.lessonAccess.hasAccess = true;
        req.lessonAccess.accessType = 'purchase';
        return next();
      }

      // Check lesson track with remaining balance
      const lessonTrack = await DB.LessonTrack.findOne({
        where: {
          user_id: userId,
          status: 'active',
        },
        raw: true,
      });

      if (lessonTrack && lessonTrack.lesson_balance > 0) {
        req.lessonAccess.hasAccess = true;
        req.lessonAccess.accessType = 'purchase';
        return next();
      }

      // Authenticated user but no access - return 403
      return res.status(403).json({
        error: 'No active subscription or lesson credits remaining.',
        code: 'NO_SUBSCRIPTION_OR_CREDITS',
        lesson: {
          id: lessonData.id,
          title: lessonData.title,
          is_preview_available: lessonData.is_preview_available,
        },
      });
    }

    // For guests (with phone number)
    if (isGuest || req.query.phone) {
      const phone = (req.query.phone as string) || (req.body.phone as string);
      
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

      // Check guest lesson payment
      const guestPayment = await DB.GuestLessonPayments.findOne({
        where: {
          phone,
          lesson_id: lessonId,
          transaction_status: 'completed',
        },
        raw: true,
      });

      if (guestPayment) {
        req.lessonAccess.hasAccess = true;
        req.lessonAccess.isGuest = true;
        req.lessonAccess.accessType = 'purchase';
        return next();
      }

      // Check guest tracker
      const guestTracker = await DB.GuestTracker.findOne({
        where: {
          phone,
          lesson_id: lessonId,
          status: 'completed',
        },
        raw: true,
      });

      if (guestTracker) {
        req.lessonAccess.hasAccess = true;
        req.lessonAccess.isGuest = true;
        req.lessonAccess.accessType = 'purchase';
        return next();
      }

      // Check transaction
      const transaction = await DB.Transactions.findOne({
        where: {
          phone_number: phone,
          lesson_id: lessonId,
          status: 'success',
          payment_status: 'completed',
        },
        raw: true,
      });

      if (transaction) {
        req.lessonAccess.hasAccess = true;
        req.lessonAccess.isGuest = true;
        req.lessonAccess.accessType = 'purchase';
        return next();
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