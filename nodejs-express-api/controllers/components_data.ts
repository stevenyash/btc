import { Router, Request, Response } from 'express';
import DB from '../models/db.js';
import validateFormData from '../helpers/validate_form.js';
import { body } from 'express-validator';
import utils from '../helpers/utils.js';
import crypto from 'crypto';
import { Op } from 'sequelize';

const router = Router();

// ============================================
// LEARNING CONTENT ENDPOINTS
// ============================================

  // Get learning levels
  router.get('/learninglevels', async (req: Request, res: Response) => {
    try {
      const levels = await DB.LearningLevels.findAll({
        where: { is_active: true },
        attributes: ['level_id', 'name', 'description'],
        order: [['name', 'ASC']],
        raw: true
      });
      return res.json({ success: true, data: levels });
    } catch (err) {
      console.error('Error fetching learning levels:', err);
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Get grades by level
  router.get('/grades_by_level/:levelId', async (req: Request, res: Response) => {
    try {
      const levelId = req.params.levelId;
      if (!levelId) {
        return res.status(400).json({ error: 'Level ID is required' });
      }
      
      const grades = await DB.Grades.findAll({
        where: { level_id: levelId, is_active: true },
        attributes: ['id', 'name', 'description'],
        order: [['name', 'ASC']],
        raw: true
      });
      
      return res.json({ success: true, data: grades });
    } catch (err) {
      console.error('Error fetching grades:', err);
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

// Get learning areas
router.get('/learningareas', async (req: Request, res: Response) => {
  try {
    const areas = await DB.LearningAreas.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'color', 'icon', 'description'],
      order: [['name', 'ASC']],
      raw: true
    });
    return res.json({ success: true, data: areas });
  } catch (err) {
    console.error('Error fetching learning areas:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get lessons with filters
router.get('/lessons', async (req: Request, res: Response) => {
  try {
    const { area_id, grade_id, topic_id, subtopic_id, limit = 50, page = 1 } = req.query;
    const where: any = { is_active: true };
    
    if (area_id) where.area_id = area_id;
    if (topic_id) where.topic_id = topic_id;
    if (subtopic_id) where.subtopic_id = subtopic_id;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const { count, rows: lessons } = await DB.Lessons.findAndCountAll({
      where,
      include: [
        { 
          model: DB.LearningAreas, 
          as: 'learning_area', 
          attributes: ['id', 'name', 'color'],
          include: [
            { model: DB.Grades, as: 'grade_info', attributes: ['id', 'name'] }
          ],
          ...(grade_id && { where: { grade_id } })
        },
        { model: DB.Topics, as: 'topic', attributes: ['topic_id', 'name'] },
        { model: DB.Subtopics, as: 'subtopic', attributes: ['subtopic_id', 'name'] }
      ],
      attributes: ['id', 'title', 'description', 'thumbnail_url', 'duration', 
                   'is_preview_available', 'bunny_url', 'bunny_video_id', 'price', 'created_at'],
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
      distinct: true
    });
    
    // Transform lessons to include video URLs
    const transformedLessons = lessons.map((lesson: any) => {
      const lessonData = lesson.toJSON();
      if (lessonData.bunny_video_id) {
        lessonData.video_url = `https://vz-8217e52e-f0d.b-cdn.net/${lessonData.bunny_video_id}`;
        lessonData.hls_url = `https://vz-8217e52e-f0d.b-cdn.net/${lessonData.bunny_video_id}/playlist.m3u8`;
        lessonData.thumbnail_url = lessonData.thumbnail_url || `https://vz-8217e52e-f0d.b-cdn.net/${lessonData.bunny_video_id}/thumbnail.jpg`;
      } else if (lessonData.bunny_url) {
        lessonData.video_url = lessonData.bunny_url;
      }
      return lessonData;
    });
    
    return res.json({ 
      success: true, 
      data: transformedLessons,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit))
      }
    });
  } catch (err) {
    console.error('Error fetching lessons:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get single lesson details
router.get('/lesson/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    
     const lesson = await DB.Lessons.findOne({
      where: { id, is_active: true },
      include: [
        { 
          model: DB.LearningAreas, 
          as: 'learning_area', 
          attributes: ['id', 'name', 'color'],
          include: [
            { model: DB.Grades, as: 'grade_info', attributes: ['id', 'name'] }
          ]
        },
        { model: DB.Topics, as: 'topic', attributes: ['topic_id', 'name'] },
        { model: DB.Subtopics, as: 'subtopic', attributes: ['subtopic_id', 'name'] }
      ],
      raw: false
    });
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    
    const lessonData = lesson.toJSON();
    
    // Add video URLs
    if (lessonData.bunny_video_id) {
      lessonData.video_url = `https://vz-8217e52e-f0d.b-cdn.net/${lessonData.bunny_video_id}`;
      lessonData.hls_url = `https://vz-8217e52e-f0d.b-cdn.net/${lessonData.bunny_video_id}/playlist.m3u8`;
    }
    
    // Get user progress if authenticated
    let userProgress = null;
    if (userId) {
        const watchTime = await DB.LessonAccessLogs.findOne({
          where: { user_id: userId, lesson_id: id },
          attributes: ['watch_time', 'status', 'accessed_at']
        });
      
        if (watchTime) {
          userProgress = {
            watch_time_seconds: watchTime.watch_time,
            is_completed: watchTime.status === 'completed',
            last_watched_at: watchTime.accessed_at,
             progress_percentage: Math.round((watchTime.watch_time / (lessonData.duration * 60 || 1)) * 100)
          };
        }
    }
    
    return res.json({ 
      success: true, 
      data: lessonData,
      user_progress: userProgress
    });
  } catch (err) {
    console.error('Error fetching lesson:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// ============================================
// SUBSCRIPTION & PACKAGE ENDPOINTS
// ============================================

// Get subscription types
router.get('/subscription_types', async (req: Request, res: Response) => {
  try {
    const types = await DB.SubscriptionTypes.findAll({
      attributes: ['id', 'name', 'membership_fee', 'months', 'description'],
      order: [['months', 'ASC']],
      raw: true
    });
    return res.json({ success: true, data: types });
  } catch (err) {
    console.error('Error fetching subscription types:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get packages public
router.get('/packages_public', async (req: Request, res: Response) => {
  try {
     const packages = await DB.Packages.findAll({
      include: [
        { 
          model: DB.SubscriptionTypes, 
          as: 'subscription_type',
          attributes: ['id', 'name', 'membership_fee', 'months']
        }
      ],
      order: [['fee', 'ASC']]
    });
    
    const transformedPackages = packages.map((pkg: any) => {
      const pkgData = pkg.toJSON();
      return {
        ...pkgData,
        price_per_lesson: pkgData.no_of_lessons ? (pkgData.fee / pkgData.no_of_lessons).toFixed(2) : null,
        duration_days: pkgData.duration_unit === 'months' ? pkgData.duration_amount * 30 : pkgData.duration_amount
      };
    });
    
    return res.json({ success: true, data: transformedPackages });
  } catch (err) {
    console.error("Error fetching packages:", err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// ============================================
// GUEST & USER MANAGEMENT ENDPOINTS
// ============================================

// Verify phone number - returns true for pure guests (no user account), false if already registered
router.get('/verify_phone/:phone', async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }
    
    const phoneString = Array.isArray(phone) ? phone[0] : phone;
    const cleanPhone = phoneString.replace(/^0/, "254").replace(/\D/g, "");
    
    const user = await DB.Users.findOne({ 
      where: { phone: cleanPhone },
      attributes: ['id', 'username', 'phone', 'account_status', 'user_role_id'],
      raw: true
    });
    
    // If phone exists in Users table, it's a registered user (not a pure guest)
    // Return verified=false so they log in properly instead of using guest access
    if (user) {
      return res.json({ 
        verified: false, 
        isRegisteredUser: true,
        message: "Phone number already registered. Please log in instead.",
        phone: cleanPhone 
      });
    }
    
    // For pure guests: no user account exists, phone is valid for guest access
    return res.json({ 
      verified: true, 
      isNew: true, 
      phone: cleanPhone 
    });
  } catch (err) {
    console.error('Phone verification error:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Register guest - validates phone and marks as verified for guest access
// Guests do NOT become subscribers - they are tracked via phone for lesson purchases only
router.post('/register_guest', [
  body('phone').not().isEmpty().isMobilePhone('any'),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    const phoneString = Array.isArray(phone) ? phone[0] : phone;
    const cleanPhone = phoneString.replace(/^0/, "254").replace(/\D/g, "");
    
    if (!cleanPhone.startsWith("254") || cleanPhone.length !== 12) {
      return res.status(400).json({ error: "Invalid phone number. Use format: 07XXXXXXXX or 254XXXXXXXXXX" });
    }

    // Check if this phone belongs to an existing registered user
    const existingUser = await DB.Users.findOne({ 
      where: { phone: cleanPhone },
      attributes: ['id', 'account_status']
    });
    
    if (existingUser) {
      // Phone belongs to a registered user - they should log in properly, not use guest access
      return res.status(409).json({ error: "Phone number already registered. Please log in instead." });
    }

    // For pure guests: just validate phone format and return success
    // No user account is created - guest is tracked by phone in localStorage and purchases
    return res.status(200).json({ 
      success: true,
      verified: true,
      isNew: false,
      phone: cleanPhone,
      message: "Phone verified for guest access"
    });
  } catch (err: any) {
    console.error("Guest registration error:", err);
    return res.status(500).json({ error: err instanceof Error ? err.message : "Failed to register guest" });
  }
});

// Get subscriber details (subscription, package, lesson track)
router.get('/subscriberdetails', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get lesson track
    const lessonTrack = await DB.LessonTrack.findOne({
      where: { user_id: userId, status: 'active' },
      order: [['created_at', 'DESC']],
      raw: true
    });

    // Get subscription
    const subscription = await DB.Subscriptions.findOne({
      where: { 
        user_id: String(userId), 
        status: 'active',
        expiry_date: { [Op.gte]: new Date() }
      },
      raw: true
    });

     let packages = null;
     let subscriptionType = null;

    // Get package from lesson track
    if (lessonTrack?.package_id) {
      packages = await DB.Packages.findOne({
        where: { id: lessonTrack.package_id },
        raw: true
      });
    }

    // If no package from lesson track, get from subscription
    if (!packages && subscription?.subscription_type_id) {
      packages = await DB.Packages.findOne({
        where: { subscription_type_id: subscription.subscription_type_id },
        raw: true
      });
    }

    // Get subscription type details
    if (packages?.subscription_type_id) {
      subscriptionType = await DB.SubscriptionTypes.findOne({
        where: { id: packages.subscription_type_id },
        attributes: ['id', 'name', 'membership_fee', 'months'],
        raw: true
      });
    }

     // Get total lessons viewed
     const totalLessonsViewed = await DB.LessonAccessLogs.count({
       where: { 
         user_id: userId,
         status: 'completed'
       }
     });

    const result = {
      lessontrack: lessonTrack ? {
        id: lessonTrack.id,
        lessons_viewed: lessonTrack.lessons_viewed || 0,
        lesson_balance: lessonTrack.lesson_balance || 0,
        total_lessons: lessonTrack.total_lessons || 0,
        status: lessonTrack.status,
        package_id: lessonTrack.package_id,
        total_completed: totalLessonsViewed
      } : null,
      packages: packages ? {
        id: packages.id,
        name: packages.name,
        description: packages.description,
        subscription_type_id: packages.subscription_type_id,
        subscription_type_name: subscriptionType?.name || null,
        subscription_type_membership_fee: subscriptionType?.membership_fee || null,
        concurrent_access: packages.concurrent_access,
        no_of_lessons: packages.no_of_lessons,
        duration_amount: packages.duration_amount,
        duration_unit: packages.duration_unit,
        fee: packages.fee
      } : null,
      subscriptions: subscription ? {
        id: subscription.id,
        user_id: subscription.user_id,
        subscription_code: subscription.subscription_code,
        status: subscription.status,
        start_date: subscription.start_date,
        expiry_date: subscription.expiry_date,
        phone_no: subscription.phone_no,
        subscription_type_id: subscription.subscription_type_id,
        transaction_id: subscription.transaction_id,
        days_remaining: Math.ceil((new Date(subscription.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      } : null
    };

    return res.json(result);
  } catch (err) {

    console.log('Error fetching subscriber details:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// ============================================
// GUEST LESSON MANAGEMENT ENDPOINTS
// ============================================

// Batch check guest lesson purchase statuses
router.post('/guest_lessons_status', async (req: Request, res: Response) => {
  try {
    const { phone, lesson_ids } = req.body;
    
    if (!phone || !lesson_ids || !Array.isArray(lesson_ids)) {
      return res.status(400).json({ error: 'Phone and lesson_ids array required' });
    }

    const cleanPhone = (Array.isArray(phone) ? phone[0] : phone).replace(/^0/, "254").replace(/\D/g, "");
    const results = await Promise.all(lesson_ids.map(async (lessonId: string) => {
      try {
        // Check various payment sources
        const [payment, tracker, transaction] = await Promise.all([
          DB.GuestLessonPayments.findOne({
            where: { phone: cleanPhone, lesson_id: lessonId, transaction_status: 'completed' },
            raw: true
          }),
          DB.GuestTracker.findOne({
            where: { phone: cleanPhone, lesson_id: lessonId, status: 'completed' },
            raw: true
          }),
          DB.Transactions.findOne({
            where: { phone_number: cleanPhone, lesson_id: lessonId, status: 'success', payment_status: 'completed' },
            raw: true
          })
        ]);

        const purchased = !!(payment || tracker || transaction);
        
        // Get lesson details
        const lesson = await DB.Lessons.findOne({
          where: { id: lessonId },
           attributes: ['duration', 'is_preview_available', 'price']
        });
        
        // Get non-subscribed lesson settings for guest preview duration
        const lessonSettings = await DB.LessonSetting.findOne({
          where: { subscription_type: 'non_subscribed' },
          raw: true
        });
        const nonSubscribedDurationSeconds = (lessonSettings?.duration || 90) * 60; // Convert minutes to seconds

        const maxWatchTime = purchased 
           ? (lesson as any)?.duration * 60 || 3600 
           : (lesson as any)?.is_preview_available ? nonSubscribedDurationSeconds : 0;
        
        let expiresAt = null;
        if (payment?.expires_at) {
          expiresAt = new Date(payment.expires_at);
        } else if (tracker?.expires_at) {
          expiresAt = new Date(tracker.expires_at);
        } else if (transaction?.created_at) {
          expiresAt = new Date(transaction.created_at);
          expiresAt.setDate(expiresAt.getDate() + 30);
        }

        // Get watch time from LessonAccessLogs
        const watchRecord = await DB.LessonAccessLogs.findOne({
          where: { 
            lesson_id: lessonId,
            phone: cleanPhone
          },
          attributes: ['watch_time']
        });

        return {
          lesson_id: lessonId,
          purchased,
          watch_time: watchRecord?.watch_time || 0,
          max_watch_time: maxWatchTime,
          expires_at: expiresAt?.toISOString() || null,
          is_preview_available: (lesson as any)?.is_preview_available || false,
          price: (lesson as any)?.price || 0
        };
      } catch (err) {
        console.error(`Error checking lesson ${lessonId}:`, err);
        return {
          lesson_id: lessonId,
          purchased: false,
          watch_time: 0,
          max_watch_time: 300,
          expires_at: null,
          is_preview_available: false,
          price: 0
        };
      }
    }));

    return res.json({ success: true, data: results });
  } catch (err) {
    console.error('Error checking guest lessons status:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Lesson fees endpoint
router.get('/lesson_fees', async (req: Request, res: Response) => {
  try {
    const settings = await DB.LessonSetting.findAll({
      where: { subscription_type: ['subscribed', 'non_subscribed'] },
      raw: true
    });
    
    const subscribed = settings.find((s: any) => s.subscription_type === 'subscribed');
    const nonSubscribed = settings.find((s: any) => s.subscription_type === 'non_subscribed');
    
    return res.json({
      success: true,
      subscribed: { 
        fee: Number(subscribed?.fee) || 1, 
        duration: Number(subscribed?.duration) || 90 
      },
      non_subscribed: { 
        fee: Number(nonSubscribed?.fee) || 2, 
        duration: Number(nonSubscribed?.duration) || 90 
      }
    });
  } catch (err) {
    console.error('Error fetching lesson fees:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Update guest watch time
router.post('/guest_update_watch_time', async (req: Request, res: Response) => {
  try {
    const { phone, lesson_id, watch_time = 0, session_id } = req.body;
    const userId = (req as any).user?.id;
    
    // Validation
    if (!lesson_id) {
      return res.status(400).json({ error: 'Lesson ID is required' });
    }
    
    if (!userId && !phone) {
      return res.status(400).json({ error: 'Either user ID or phone number is required' });
    }
    
    // Get or create guest user
    let guestId = userId;
    let guestPhone = phone;
    
     if (!guestId && guestPhone) {
       const cleanPhone = (Array.isArray(guestPhone) ? guestPhone[0] : guestPhone).replace(/^0/, "254").replace(/\D/g, "");
      
      let user = await DB.Users.findOne({
        where: { phone: cleanPhone },
        attributes: ['id']
      });
      
      if (!user) {
        // Auto-create guest user
        const guestRole = await DB.Roles.findOne({ where: { role_name: 'Subscriber' } });
        const guestRoleId = (guestRole as any)?.role_id || 3;
        const generatedUsercode = crypto.randomBytes(6).toString("hex").toUpperCase();
        const guestUsername = `guest_${cleanPhone.slice(-6)}`;
        
        user = await DB.Users.create({
          username: guestUsername,
          phone: cleanPhone,
          usercode: utils.usercodeHash(generatedUsercode),
          user_role_id: guestRoleId,
          account_status: 'Active',
          status: 1,
        });
      }
      
      guestId = (user as any).id;
      guestPhone = cleanPhone;
    }
    
    if (!guestId) {
      return res.status(400).json({ error: 'Could not identify or create guest user' });
    }
    
    // Get lesson details
    const lesson = await DB.Lessons.findOne({
      where: { id: lesson_id, is_active: true },
       attributes: ['id', 'title', 'duration', 'is_preview_available']
    });
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    
     const maxWatchTime = (lesson as any).duration * 60 || 5400;
    
    // Find or create watch time record
    let watchRecord = await DB.LessonAccessLogs.findOne({
      where: {
        user_id: guestId,
        lesson_id: lesson_id,
      }
    });
    
    let currentWatchTime = 0;
    let isComplete = false;
    
    if (watchRecord) {
      currentWatchTime = (watchRecord as any).watch_time || 0;
      const newWatchTime = Math.min(currentWatchTime + watch_time, maxWatchTime);
      isComplete = newWatchTime >= maxWatchTime;
      
      await DB.LessonAccessLogs.update(
        {
          watch_time: newWatchTime,
          status: isComplete ? 'completed' : 'active',
          accessed_at: new Date(),
          updated_at: new Date()
        },
        { where: { id: (watchRecord as any).id } }
      );
      
      currentWatchTime = newWatchTime;
    } else {
      const newWatchTime = Math.min(watch_time, maxWatchTime);
      isComplete = newWatchTime >= maxWatchTime;
      
      watchRecord = await DB.LessonAccessLogs.create({
        user_id: guestId,
        phone: guestPhone,
        lesson_id: lesson_id,
        watch_time: newWatchTime,
        status: isComplete ? 'completed' : 'active',
        access_type: userId ? 'subscriber' : 'guest',
        session_id: session_id,
        accessed_at: new Date(),
        expires_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });
      
      currentWatchTime = newWatchTime;
    }
    
    // Mark transaction as completed if lesson is finished
    if (isComplete) {
      await DB.Transactions.update(
        { status: 'completed', completed_at: new Date() },
        { 
          where: { 
            user_id: guestId, 
            lesson_id: lesson_id,
            status: 'success'
          } 
        }
      );
    }
    
    const remainingTime = Math.max(0, maxWatchTime - currentWatchTime);
    
    return res.json({ 
      success: true, 
      watch_time: currentWatchTime,
      remaining_time: remainingTime,
      max_watch_time: maxWatchTime,
      is_completed: isComplete,
      progress_percentage: Math.round((currentWatchTime / maxWatchTime) * 100)
    });
  } catch (err) {
    console.error('Guest update watch time error:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// ============================================
// TUTORIAL & WEEKEND CLASSES ENDPOINTS
// ============================================

  // Get learning levels as option list (for frontend)
  router.get('/levelid_option_list', async (req: Request, res: Response) => {
    try {
      const levels = await DB.LearningLevels.findAll({
        where: { is_active: true },
        attributes: ['level_id', 'name'],
        order: [['name', 'ASC']],
        raw: true
      });
      const result = levels.map((l: any) => ({ value: l.level_id, label: l.name }));
      return res.json(result);
    } catch (err) {
      console.error('Error fetching level options:', err);
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

// Get weekend tutorials by grade
router.get('/get_weekend_tutorials', async (req: Request, res: Response) => {
  try {
    const { grade_id, per_page = 20, page = 1 } = req.query;
    
    if (!grade_id) {
      return res.status(400).json({ error: 'grade_id is required' });
    }

    const where: any = { grade: grade_id };
    const limit = parseInt(per_page as string) || 20;
    const offset = (parseInt(page as string) - 1) * limit;

    const { count: total, rows: tutorials } = await DB.Scheduler.findAndCountAll({
      where,
      include: [
        { model: DB.Users, as: 'user', attributes: ['id', 'username', 'phone', 'email'] }
      ],
      attributes: [
        'id', 'user_id', 'grade', 'learning_area', 'strand', 'start_date', 
        'end_date', 'status', 'link', 'meetingId', 'description'
      ],
      order: [['start_date', 'DESC']],
      limit,
      offset,
      raw: true,
      nest: true
    });

    // Get tutorial fee
    const feeSetting = await DB.TutorialsSettings.findOne({
      order: [['id', 'DESC']],
      raw: true
    });
    const fee = feeSetting?.fee || '500';

    // Enhance tutorials with additional data
    const enhancedTutorials = tutorials.map((tutorial: any) => ({
      ...tutorial,
      fee,
      is_active: tutorial.status === 'active',
      start_date_formatted: new Date(tutorial.start_date).toLocaleString(),
      end_date_formatted: new Date(tutorial.end_date).toLocaleString()
    }));

    const result = {
      success: true,
      data: enhancedTutorials,
      pagination: {
        total,
        page: parseInt(page as string),
        per_page: limit,
        total_pages: Math.ceil(total / limit)
      }
    };

    return res.json(result);
  } catch (err) {
    console.error('Error fetching weekend tutorials:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Check weekend tutorials (heartbeat/status check)
router.get('/check_weekend_tutorials', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    
    const tutorials = await DB.Scheduler.findAll({
      where: {
        status: { [Op.or]: ['active', 'upcoming'] },
        start_date: { [Op.lte]: now },
        end_date: { [Op.gte]: now }
      },
      attributes: ['id', 'learning_area', 'grade', 'strand', 'start_date', 'end_date', 'status', 'link', 'meetingId'],
      order: [['start_date', 'ASC']],
      raw: true
    });

    // Update statuses that have expired
    const expiredTutorials = await DB.Scheduler.findAll({
      where: {
        status: 'active',
        end_date: { [Op.lt]: now }
      },
      attributes: ['id']
    });
    
    if (expiredTutorials.length > 0) {
      await DB.Scheduler.update(
        { status: 'completed' },
        { where: { id: expiredTutorials.map((t: any) => t.id) } }
      );
    }

    const response = {
      success: true,
      active_count: tutorials.length,
      tutorials: tutorials.map((t: any) => ({
        ...t,
        is_live: t.status === 'active' && new Date(t.start_date) <= now && new Date(t.end_date) >= now,
        start_time: new Date(t.start_date).toLocaleTimeString(),
        end_time: new Date(t.end_date).toLocaleTimeString()
      }))
    };

    return res.json(response);
  } catch (err) {
    console.error('Error checking weekend tutorials:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get tutorial fee
router.get('/tutorial_fee', async (req: Request, res: Response) => {
  try {
    const feeSetting = await DB.TutorialsSettings.findOne({
      order: [['id', 'DESC']],
      attributes: ['fee', 'currency', 'duration_days'],
      raw: true
    });
    
    return res.json({ 
      success: true,
      fee: feeSetting?.fee || '500',
      currency: feeSetting?.currency || 'KES',
      duration_days: feeSetting?.duration_days || 30
    });
  } catch (err) {
    console.error('Error fetching tutorial fee:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get purchased tutorials by phone
router.get('/get_purchased_tutorials', async (req: Request, res: Response) => {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      return res.status(400).json({ success: false, error: 'phone is required' });
    }

     const cleanPhone = ((phone as unknown) as string).replace(/^0/, "254").replace(/\D/g, "");
    
    const purchased = await DB.TutorialRegister.findAll({
      where: { 
        phone: cleanPhone,
        transaction_status: 'success'
      },
      include: [
        {
          model: DB.Scheduler,
          as: 'tutorial',
          attributes: ['id', 'learning_area', 'grade', 'strand', 'start_date', 'end_date', 'status', 'link', 'meetingId', 'description']
        }
      ],
      order: [['transaction_date', 'DESC']],
      raw: true,
      nest: true
    });

    const now = new Date();
    const tutorials = purchased.map((p: any) => {
      const expiryDate = p.expiry_date ? new Date(p.expiry_date) : null;
      const isExpired = expiryDate ? expiryDate < now : false;
      
      return {
        id: p.id,
        tutorial_id: p.tutorial_id,
        learning_area: p.tutorial?.learning_area,
        grade: p.tutorial?.grade,
        strand: p.tutorial?.strand,
        start_date: p.tutorial?.start_date,
        end_date: p.tutorial?.end_date,
        status: p.tutorial?.status || p.transaction_status,
        link: p.tutorial?.link,
        meeting_id: p.tutorial?.meetingId,
        description: p.tutorial?.description,
        transaction_date: p.transaction_date,
        expiry_date: p.expiry_date,
        is_expired: isExpired,
        amount_paid: p.amount_paid,
        email: p.email
      };
    });

    // Get questions for purchased tutorials
    const tutorialIds = purchased.map((p: any) => p.tutorial_id).filter(Boolean);
    let questions: any[] = [];
    
    if (tutorialIds.length > 0) {
      questions = await DB.Questions.findAll({
        where: { scheduler_id: tutorialIds },
        attributes: ['id', 'scheduler_id', 'question_text', 'question_type', 'options', 'correct_answer', 'points'],
        raw: true
      });
      
      // Group questions by tutorial
      const questionsByTutorial = questions.reduce((acc: any, q: any) => {
        if (!acc[q.scheduler_id]) acc[q.scheduler_id] = [];
        acc[q.scheduler_id].push(q);
        return acc;
      }, {});
      
      // Attach questions to tutorials
      tutorials.forEach((tutorial: any) => {
        tutorial.questions = questionsByTutorial[tutorial.tutorial_id] || [];
        tutorial.questions_count = tutorial.questions.length;
      });
    }

    return res.json({
      success: true,
      tutorials,
      total_purchased: tutorials.length,
      total_questions: questions.length
    });
  } catch (err) {
    console.error('Error fetching purchased tutorials:', err);
    return res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ============================================
// SEARCH ENDPOINT
// ============================================

// Search lessons, tutorials, etc.
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, type = 'all', limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const searchTerm = `%${q}%`;
    const results: any = {};
    
    // Search lessons
    if (type === 'all' || type === 'lessons') {
      const lessons = await DB.Lessons.findAll({
        where: {
          is_active: true,
          [Op.or]: [
            { title: { [Op.like]: searchTerm } },
            { description: { [Op.like]: searchTerm } }
          ]
        },
        attributes: ['id', 'title', 'description', 'thumbnail_url', 'duration', 'is_preview_available'],
        limit: Number(limit),
        order: [['title', 'ASC']]
      });
      
      results.lessons = lessons;
    }
    
    // Search tutorials
    if (type === 'all' || type === 'tutorials') {
      const tutorials = await DB.Scheduler.findAll({
        where: {
          [Op.or]: [
            { learning_area: { [Op.like]: searchTerm } },
            { strand: { [Op.like]: searchTerm } },
            { grade: { [Op.like]: searchTerm } }
          ]
        },
        attributes: ['id', 'learning_area', 'strand', 'grade', 'start_date', 'end_date', 'status'],
        limit: Number(limit),
        order: [['start_date', 'DESC']]
      });
      
      results.tutorials = tutorials;
    }
    
    // Search learning areas
    if (type === 'all' || type === 'areas') {
      const areas = await DB.LearningAreas.findAll({
        where: {
          is_active: true,
          name: { [Op.like]: searchTerm }
        },
        attributes: ['id', 'name', 'color', 'icon'],
        limit: Number(limit)
      });
      
      results.learning_areas = areas;
    }
    
    return res.json({
      success: true,
      query: q,
      type,
      results,
      total: {
        lessons: results.lessons?.length || 0,
        tutorials: results.tutorials?.length || 0,
        learning_areas: results.learning_areas?.length || 0
      }
    });
  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get membership expiry status
router.get('/membershipexpire', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const subscription = await DB.Subscriptions.findOne({
            where: { 
                user_id: String(userId), 
                status: 'active',
                expiry_date: { [DB.Sequelize.Op.gte]: new Date() }
            },
            raw: true
        });

        const isExpired = !subscription || subscription.expiry_date < new Date();
        return res.json({ 
            success: true, 
            expired: isExpired,
            expiryDate: subscription ? subscription.expiry_date : null,
            daysRemaining: subscription ? Math.ceil((new Date(subscription.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0
        });
    } catch (err) {
        console.error('Error checking membership expiry:', err);
        return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
});

// Check user activity
router.get('/check_user_activity', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Get recent lesson access logs
        const recentActivity = await DB.LessonAccessLogs.findAll({
            where: { user_id: userId },
            order: [['accessed_at', 'DESC']],
            limit: 10,
            attributes: ['lesson_id', 'watch_time', 'status', 'accessed_at'],
            include: [
                {
                    model: DB.Lessons,
                    as: 'lesson',
                    attributes: ['id', 'title', 'thumbnail_url']
                }
            ],
            raw: true,
            nest: true
        });

        // Get recent transactions
        const recentTransactions = await DB.Transactions.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
            limit: 5,
            attributes: ['id', 'amount', 'status', 'created_at', 'checkoutRequestID'],
            raw: true
        });

        return res.json({ 
            success: true, 
            activity: {
                lessonAccess: recentActivity,
                transactions: recentTransactions
            }
        });
    } catch (err) {
        console.error('Error checking user activity:', err);
        return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
});

export default router;