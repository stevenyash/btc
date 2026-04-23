import crypto from 'crypto';

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.AUTH_API_TOKEN_SECRET || 'default-csrf-secret';

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function verifyCsrfToken(token: string, secret: string): boolean {
  if (!token || !secret) return false;
  const expected = crypto.createHmac('sha256', CSRF_SECRET).update(secret).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function createCsrfMiddleware() {
  return (req: any, res: any, next: any) => {
    const skipCsrf = ['GET', 'HEAD', 'OPTIONS'];
    if (skipCsrf.includes(req.method)) {
      return next();
    }

    const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;

    if (!csrfToken && !sessionId) {
      return csrfError(res);
    }

    if (csrfToken && sessionId) {
      const valid = verifyCsrfToken(csrfToken, sessionId);
      if (!valid) {
        return csrfError(res);
      }
    }

    next();
  };
}

function csrfError(res: any) {
  return res.status(403).json({ error: 'Invalid CSRF token' });
}

export function createCsrfRouter() {
  return {
    generate: generateCsrfToken,
    verify: verifyCsrfToken,
    middleware: createCsrfMiddleware()
  };
}