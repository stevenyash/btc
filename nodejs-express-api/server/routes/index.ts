import { Router, Request, Response } from 'express';
import logger from '../../helpers/logger.js';
import ComponentsDataController from '../../controllers/components_data.js';
import MpesaController from '../../controllers/mpesa.js';
import AuthController from '../../controllers/auth.js';
import AdminRolesController from '../../controllers/adminRoles.js';
import AdminController from '../../controllers/adminController.js';
import SupportTicketsController from '../../controllers/supportTickets.js';
import HomeController from '../../controllers/home.js';
import AccountController from '../../controllers/account.js';
import LearningHierarchyRoutes from '../../routes/learningHierarchyRoutes.js';
import LessonsController from '../../controllers/lessons.js';
import UsersController from '../../controllers/users.js';
import RolesController from '../../controllers/roles.js';
import RolePermissionsController from '../../controllers/rolepermissions.js';
import SubscriptionsController from '../../controllers/subscriptions.js';
import SubscriptionTypesController from '../../controllers/subscriptiontypes.js';
import PackagesController from '../../controllers/packages.js';
import GradesController from '../../controllers/grades.js';
import LearningAreasController from '../../controllers/learningareas.js';
import LearningLevelsController from '../../controllers/learninglevels.js';
import TopicsController from '../../controllers/topics.js';
import SubtopicsController from '../../controllers/subtopics.js';
import TransactionsController from '../../controllers/transactions.js';
import TutorialRegisterController from '../../controllers/tutorialregister.js';
import TutorialsSettingsController from '../../controllers/tutorialssettings.js';
import QuestionsController from '../../controllers/questions.js';
import PurchasesController from '../../controllers/purchases.js';
import UserActivityController from '../../controllers/useractivity.js';
import UserGuideController from '../../controllers/userguide.js';
import UserPrivilegesController from '../../controllers/userprivileges.js';
import InvitesController from '../../controllers/invites.js';
import MarketersController from '../../controllers/marketers.js';
import MarketerEarningsController from '../../controllers/marketer_earnings.js';
import LessonSettingController from '../../controllers/lessonsetting.js';
import LessonTrackController from '../../controllers/lessontrack.js';
import SchedulerController from '../../controllers/scheduler.js';
import ServicesSettingsController from '../../controllers/servicessettings.js';
import GuestTrackerController from '../../controllers/guesttracker.js';
import HLSController from '../../controllers/hlsController.js';
import BunnySyncController from '../../controllers/bunnySyncController.js';
import BunnyUploadController from '../../controllers/bunnyUploadController.js';
import BunnyMigrationController from '../../controllers/bunnyMigrationController.js';
import BunnyController from '../../controllers/bunnyController.js';
import { authLimiter } from '../config/middleware.js';

export const setupRoutes = (app: Router) => {
  // OAuth callback
  app.get("/oauthcallback", async (req: Request, res: Response) => {
    try {
      const { exchangeCodeForTokens } = await import('../../helpers/googleMeet.js');
      const code = req.query.code;
      if (!code) {
        return res.status(400).send("<h1>❌ Authorization Failed</h1><p>No authorization code provided.</p>");
      }
      logger.info("OAuth callback: Received authorization code, exchanging for tokens...");
      await exchangeCodeForTokens(code as string);
      logger.info("OAuth callback: Authorization successful!");
      return res.send(`
              <html>
                  <head><title>Authorization Successful</title></head>
                  <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
                      <h1 style="color: #4caf50;">✅ Authorization Successful!</h1>
                      <p>Google Calendar has been authorized successfully.</p>
                      <p>You can now close this window and try scheduling a class again.</p>
                      <script>setTimeout(() => window.close(), 5000);</script>
                  </body>
              </html>
          `);
    } catch (error) {
      logger.error("OAuth callback error:", { error: (error as Error).message });
      return res.status(500).send(`<h1>❌ Authorization Failed</h1><p>Error: ${(error as Error).message}</p>`);
    }
  });

  // Public routes
  app.use("/api/components_data", ComponentsDataController);
  app.use("/api/mpesa", MpesaController);
  app.use("/api/support-tickets", SupportTicketsController);

  // Auth with rate limiting on login
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth", AuthController);

  // Protected routes (require auth middleware)
  // Note: authMiddleware is applied in app.ts to all /api/* routes
  app.use("/api/admin", AdminRolesController);
  app.use("/api/admin", AdminController);
  app.use("/api/", HomeController);
  app.use("/api/account", AccountController);
  app.use("/api/learning-hierarchy", LearningHierarchyRoutes);
  app.use("/api/lessons", LessonsController);
  app.use("/api/users", UsersController);
  app.use("/api/roles", RolesController);
  app.use("/api/rolepermissions", RolePermissionsController);
  app.use("/api/subscriptions", SubscriptionsController);
  app.use("/api/subscriptiontypes", SubscriptionTypesController);
  app.use("/api/packages", PackagesController);
  app.use("/api/grades", GradesController);
  app.use("/api/learningareas", LearningAreasController);
  app.use("/api/learninglevels", LearningLevelsController);
  app.use("/api/topics", TopicsController);
  app.use("/api/subtopics", SubtopicsController);
  app.use("/api/transactions", TransactionsController);
  app.use("/api/tutorialregister", TutorialRegisterController);
  app.use("/api/tutorialssettings", TutorialsSettingsController);
  app.use("/api/questions", QuestionsController);
  app.use("/api/purchases", PurchasesController);
  app.use("/api/useractivity", UserActivityController);
  app.use("/api/userguide", UserGuideController);
  app.use("/api/userprivileges", UserPrivilegesController);
  app.use("/api/invites", InvitesController);
  app.use("/api/marketers", MarketersController);
  app.use("/api/marketer_earnings", MarketerEarningsController);
  app.use("/api/lessonsetting", LessonSettingController);
  app.use("/api/lessontrack", LessonTrackController);
  app.use("/api/scheduler", SchedulerController);
  app.use("/api/servicessettings", ServicesSettingsController);
   app.use("/api/guesttracker", GuestTrackerController);
   app.use("/api/hls", HLSController);
    app.use("/api/bunny-sync", BunnySyncController);
    app.use("/api/bunny-upload", BunnyUploadController);
    app.use("/api/bunny-migrate", BunnyMigrationController);
    app.use("/api/bunny", BunnyController);
 };
