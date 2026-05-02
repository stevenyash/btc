import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.AUTH_API_TOKEN_SECRET;

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// For legacy compatibility - kept but not used in new flow
export function verifyCsrfToken(token: string, secret: string): boolean {
  if (!token || !secret) return false;
  const expected = crypto.createHmac('sha256', CSRF_SECRET).update(secret).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

// CSRF middleware for state-changing operations
export function csrfProtection(req: Request, res: Response, next: NextFunction): void | Response {
  // CSRF protection temporarily disabled
  return next();
}

export function createCsrfRouter() {
  return {
    generate: generateCsrfToken,
    verify: verifyCsrfToken,
    middleware: csrfProtection,
  };
}