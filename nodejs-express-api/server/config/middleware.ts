import express, { Express, Request, Response, NextFunction } from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from 'cookie-parser';
import logger, { requestLogger } from "../../helpers/logger.js";
import extendExpressMiddleware from "../../helpers/express_middleware.js";
import { passportJwtLogin } from "../../helpers/auth_middleware.js";

export const createMiddleware = (app: Express) => {
  // Trust proxy for extracting real client IP in production (behind load balancer/reverse proxy)
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Environment variable checks
  if (!process.env.AUTH_USER_TOKEN_SECRET || !process.env.AUTH_API_TOKEN_SECRET) {
    logger.error('ERROR: AUTH_USER_TOKEN_SECRET and AUTH_API_TOKEN_SECRET must be set in environment');
    process.exit(1);
  }

  const requiredEnvVars = [
    'DB_HOST',
    'DB_NAME',
  ];

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (typeof process.env.DB_PASSWORD === 'undefined' ||
      (process.env.NODE_ENV === 'production' && !process.env.DB_PASSWORD.trim())) {
    missingEnvVars.push('DB_PASSWORD');
  }
  if (!process.env.DB_USERNAME && !process.env.DB_USER) {
    missingEnvVars.push('DB_USERNAME (or DB_USER)');
  }
  if (missingEnvVars.length > 0) {
    logger.error(`ERROR: Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production') {
    const productionEnvVars = ['APP_FRONTEND_URL'];
    const missingProdVars = productionEnvVars.filter(envVar => !process.env[envVar]);
    if (missingProdVars.length > 0) {
      logger.warn(`WARNING: Missing recommended production environment variables: ${missingProdVars.join(', ')}`);
    }

    const googleEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
    const missingGoogleVars = googleEnvVars.filter(envVar => !process.env[envVar]);
    if (missingGoogleVars.length > 0) {
      logger.warn(`WARNING: Missing Google OAuth variables: ${missingGoogleVars.join(', ')}`);
    }
  }

  // Compression
  app.use(compression({ threshold: 0 }));

  // Cookie parser (required for reading JWT and CSRF cookies)
  app.use(cookieParser());

  // CORS - must come before credentials
  app.use(cors({
    origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      // In development, allow undefined origin (Postman, curl) and local origins
      if (process.env.NODE_ENV !== 'production') {
        const devOrigins = [
          process.env.APP_FRONTEND_URL,
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:8050',
          'https://bitstutorconnect.co.ke'
        ].filter(Boolean) as string[];

        if (!origin || devOrigins.includes(origin)) {
          return callback(null, true);
        }
      }

      // Always allow localhost origins regardless of NODE_ENV
      const localhostOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:8050',
        'http://localhost:8060',
      ];
      if (localhostOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Production: check against APP_FRONTEND_URL and APP_URL
      const frontendUrl = process.env.APP_FRONTEND_URL;
      const appUrl = process.env.APP_URL;
      if (!frontendUrl) {
        logger.error('APP_FRONTEND_URL not set in production');
        return callback(new Error('CORS configuration error'));
      }

      // Generate allowed origins from the frontend URL and backend URL
      const allowedOrigins = [
        frontendUrl,
        frontendUrl.replace('https://', 'http://'),
        frontendUrl.replace('http://', 'https://'),
        appUrl,
        ...(appUrl ? [appUrl.replace('https://', 'http://'), appUrl.replace('http://', 'https://')] : []),
      ];

      // Handle www variations
      if (frontendUrl.includes('://www.')) {
        allowedOrigins.push(frontendUrl.replace('://www.', '://'));
      } else {
        allowedOrigins.push(frontendUrl.replace('://', '://www.'));
      }

      // Remove duplicates
      const uniqueOrigins = [...new Set(allowedOrigins)];

      logger.info('CORS check', { origin, allowedOrigins: uniqueOrigins, env: process.env.NODE_ENV });

      if (!origin || uniqueOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn('CORS rejected origin', { origin, allowedOrigins: uniqueOrigins });
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true  // Required for cookies
  }));

  // Helmet security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "data:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
    },
    frameguard: { action: 'deny' },
  }));

  // Rate limiting - trust proxy for production (handles X-Forwarded-For)
  // When trust proxy is enabled, we should validate X-Forwarded-For
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(globalLimiter);
  app.use(requestLogger);

  // Static files
  app.use(express.static(process.env.APP_PUBLIC_DIR || 'assets', {
    maxAge: '1d',
    etag: true,
    lastModified: true,
  }));

  // Body parsers
  app.use(express.json({
    verify: (req, _res, buffer) => {
      const requestPath = (req.url || '').split('?')[0].replace(/\/+$/, '');
      if (requestPath === '/api/webhooks/b2h') {
        (req as Request & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
      }
    },
  }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Custom middleware
  extendExpressMiddleware(app);
  app.use(passportJwtLogin);
};

// Auth rate limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
});
