import express, { Express, Request, Response, NextFunction } from "express";
import compression from "compression";
import cors from "cors";
import ejs from "ejs";
import "./env.js";
import extendExpressMiddleware from "./helpers/express_middleware.js";
import { passportJwtLogin, authMiddleware } from "./helpers/auth_middleware.js";
import AuthController from "./controllers/auth.js";
import AccountController from "./controllers/account.js";
import HomeController from "./controllers/home.js";
import AboutUsController from "./controllers/aboutus.js";
import ActiveSubscriptionsController from "./controllers/activesubscriptions.js";
import AssignRightsController from "./controllers/assignrights.js";
import ContactUsController from "./controllers/contactus.js";
import GradesController from "./controllers/grades.js";
import GuestTrackerController from "./controllers/guesttracker.js";
import InvitesController from "./controllers/invites.js";
import LearningAreasController from "./controllers/learningareas.js";
import LearningLevelsController from "./controllers/learninglevels.js";
import LessonSettingController from "./controllers/lessonsetting.js";
import LessonTrackController from "./controllers/lessontrack.js";
import LessonsController from "./controllers/lessons.js";
import MarketersController from "./controllers/marketers.js";
import MarketerEarningsController from "./controllers/marketer_earnings.js";
import NewsletterSubscribersController from "./controllers/newslettersubscribers.js";
import PackagesController from "./controllers/packages.js";
import RolesController from "./controllers/roles.js";
import RolePermissionsController from "./controllers/rolepermissions.js";
import SchedulerController from "./controllers/scheduler.js";
import ServicesSettingsController from "./controllers/servicessettings.js";
import SubscriberTrackerController from "./controllers/subscribertracker.js";
import SubscriptionsController from "./controllers/subscriptions.js";
import SubscriptionTypesController from "./controllers/subscriptiontypes.js";
import SubtopicsController from "./controllers/subtopics.js";
import TopicsController from "./controllers/topics.js";
import TransactionsController from "./controllers/transactions.js";
import TutorialRegisterController from "./controllers/tutorialregister.js";
import TutorialsSettingsController from "./controllers/tutorialssettings.js";
import UserActivityController from "./controllers/useractivity.js";
import UserGuideController from "./controllers/userguide.js";
import UserPrivilegesController from "./controllers/userprivileges.js";
import UsersController from "./controllers/users.js";
import LearningHierarchyRoutes from "./routes/learningHierarchyRoutes.js";
import { exchangeCodeForTokens } from "./helpers/googleMeet.js";
import MpesaController from "./controllers/mpesa.js";
import AdminRolesController from "./controllers/adminRoles.js";
import LearningHierarchyAdminController from "./controllers/learningHierarchyAdmin.js";
import PurchasesController from "./controllers/purchases.js";
import QuestionsController from "./controllers/questions.js";
import HLSController from "./controllers/hlsController.js";

const app: Express = express();

app.set("views", "views");
app.engine("html", ejs.renderFile);
app.set("view engine", "ejs");

if (!process.env.AUTH_USER_TOKEN_SECRET || !process.env.AUTH_API_TOKEN_SECRET) {
  console.error('ERROR: AUTH_USER_TOKEN_SECRET and AUTH_API_TOKEN_SECRET must be set in environment');
  process.exit(1);
}

app.use(compression({ threshold: 0 }));

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.headers.cookie) {
    const cookies: Record<string, string> = {};
    req.headers.cookie.split(';').forEach(cookie => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        cookies[key] = decodeURIComponent(value);
      }
    });
    (req as any).cookies = cookies;
  } else {
    (req as any).cookies = {};
  }
  next();
});

app.use(cors({
  origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = [
      process.env.APP_FRONTEND_URL || 'http://localhost:8050',
      'http://localhost:5173',
      'http://localhost:8050',
      'http://localhost:3000'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;");
  next();
});

app.use(express.static(process.env.APP_PUBLIC_DIR || 'assets'));
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

extendExpressMiddleware(app);
app.use(passportJwtLogin);

app.use("/api/components_data", ComponentsDataController);
app.use("/api/mpesa", MpesaController);

app.get("/oauthcallback", async (req: Request, res: Response) => {
  try {
    const code = req.query.code;
    if (!code) {
      return res.status(400).send("<h1>❌ Authorization Failed</h1><p>No authorization code provided.</p>");
    }
    console.log("OAuth callback: Received authorization code, exchanging for tokens...");
    await exchangeCodeForTokens(code as string);
    console.log("OAuth callback: Authorization successful!");
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
    console.error("OAuth callback error:", error);
    return res.status(500).send(`<h1>❌ Authorization Failed</h1><p>Error: ${(error as Error).message}</p>`);
  }
});

app.use("/api/auth", AuthController);
app.use("/api/", authMiddleware);
app.use("/api/admin", AdminRolesController);
app.use("/api/admin", LearningHierarchyAdminController);

app.use("/api/", HomeController);
app.use("/api/account", AccountController);
app.use("/api/learning-hierarchy", LearningHierarchyRoutes);

app.use("/api/aboutus", AboutUsController);
app.use("/api/activesubscriptions", ActiveSubscriptionsController);
app.use("/api/assignrights", AssignRightsController);
app.use("/api/contactus", ContactUsController);
app.use("/api/grades", GradesController);
app.use("/api/guesttracker", GuestTrackerController);
app.use("/api/invites", InvitesController);
app.use("/api/learningareas", LearningAreasController);
app.use("/api/learninglevels", LearningLevelsController);
app.use("/api/lessonsetting", LessonSettingController);
app.use("/api/lessontrack", LessonTrackController);
app.use("/api/lessons", LessonsController);
app.use("/api/marketers", MarketersController);
app.use("/api/marketer_earnings", MarketerEarningsController);
app.use("/api/newslettersubscribers", NewsletterSubscribersController);
app.use("/api/packages", PackagesController);
app.use("/api/purchases", PurchasesController);
app.use("/api/questions", QuestionsController);
app.use("/api/rolepermissions", RolePermissionsController);
app.use("/api/roles", RolesController);
app.use("/api/scheduler", SchedulerController);
app.use("/api/servicessettings", ServicesSettingsController);
app.use("/api/subscribertracker", SubscriberTrackerController);
app.use("/api/subscriptions", SubscriptionsController);
app.use("/api/subscriptiontypes", SubscriptionTypesController);
app.use("/api/subtopics", SubtopicsController);
app.use("/api/topics", TopicsController);
app.use("/api/transactions", TransactionsController);
app.use("/api/tutorialregister", TutorialRegisterController);
app.use("/api/tutorialssettings", TutorialsSettingsController);
app.use("/api/useractivity", UserActivityController);
app.use("/api/userguide", UserGuideController);
app.use("/api/userprivileges", UserPrivilegesController);
app.use("/api/users", UsersController);
app.use("/api/hls", HLSController);

app.get("*", (req: Request, res: Response) => {
  res.status(404).json("Page not found");
});

import { sequelize } from './models/basemodel.js';

const port = 8060;

app.listen(port, () => {
  console.log("Server is up and running on port: " + port);
  console.log("Learning Hierarchy API available at: /api/learning-hierarchy");
});

export default app;