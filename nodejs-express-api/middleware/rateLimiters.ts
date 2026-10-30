import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";

interface RateLimitMessage {
  error: string;
  code: string;
}

export const streamLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    error: "Too many stream URL requests, please try again later",
    code: "RATE_LIMIT_EXCEEDED",
  } as RateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    error: "Too many requests, please try again later",
    code: "RATE_LIMIT_EXCEEDED",
  } as RateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
});

export const uploadLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    error: "Too many upload requests, please try again later",
    code: "UPLOAD_LIMIT_EXCEEDED",
  } as RateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: "Too many authentication attempts, please try again later",
    code: "AUTH_RATE_LIMIT_EXCEEDED",
  } as RateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

export const signupLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    error: "Too many signup attempts, please try again later",
    code: "SIGNUP_RATE_LIMIT_EXCEEDED",
  } as RateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
});

export const mpesaPaymentLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: "Too many payment attempts, please try again later",
    code: "PAYMENT_RATE_LIMIT_EXCEEDED",
  } as RateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
});

export const mpesaVerifyLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    error: "Too many payment status checks, please try again later",
    code: "PAYMENT_STATUS_RATE_LIMIT_EXCEEDED",
  } as RateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
});

export const guestSessionLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: "Too many guest session attempts, please try again later",
    code: "GUEST_SESSION_RATE_LIMIT_EXCEEDED",
  } as RateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
});

export const supportTicketLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: "Too many support requests, please try again later",
    code: "SUPPORT_RATE_LIMIT_EXCEEDED",
  } as RateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
});

export const supportTrackingLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    error: "Too many ticket status checks, please try again later",
    code: "SUPPORT_STATUS_RATE_LIMIT_EXCEEDED",
  } as RateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
});