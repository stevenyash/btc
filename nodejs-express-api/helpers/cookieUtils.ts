import { Response, Request } from 'express';

interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
  domain?: string;
}

// Helper to extract parent domain for cross-subdomain cookie support
function getParentDomain(): string | undefined {
  if (process.env.NODE_ENV !== 'production') return undefined;
  
  const frontendUrl = process.env.APP_FRONTEND_URL;
  if (!frontendUrl) return undefined;
  
  try {
    const url = new URL(frontendUrl);
    const hostname = url.hostname;
    const parts = hostname.split('.');
    
    if (parts.length >= 3) {
      // Special handling for .co.ke, .or.ke, .go.ke domains
      if (hostname.endsWith('.co.ke') || hostname.endsWith('.or.ke') || hostname.endsWith('.go.ke')) {
        return '.' + parts.slice(-3).join('.');
      }
      return '.' + parts.slice(-2).join('.');
    } else if (parts.length === 2) {
      return '.' + hostname;
    }
  } catch {
    // Invalid URL
  }
  return undefined;
}

export function setAuthCookie(res: Response, token: string, options?: CookieOptions): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const domain = getParentDomain();

  const defaultOptions: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: parseInt(process.env.AUTH_JWT_DURATION || '2400', 10) * 60 * 1000,
    path: '/',
    ...(domain && { domain }),
  };

  const mergedOptions = { ...defaultOptions, ...options };
  res.cookie('jwt', token, mergedOptions);
}

export function setCsrfCookie(res: Response, token: string, options?: CookieOptions): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const domain = getParentDomain();

  const defaultOptions: CookieOptions = {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
    ...(domain && { domain }),
  };

  const mergedOptions = { ...defaultOptions, ...options };
  res.cookie('csrf_token', token, mergedOptions);
}

export function clearAuthCookie(res: Response): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const domain = getParentDomain();

  const clearOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'lax' as const,
    path: '/',
    ...(domain && { domain }),
  };

  res.clearCookie('jwt', clearOptions);
  res.clearCookie('csrf_token', { ...clearOptions, httpOnly: false });
}

export function getTokenFromCookie(req: Request): string | undefined {
  return req.cookies?.jwt;
}

export function getCsrfTokenFromCookie(req: Request): string | undefined {
  return req.cookies?.csrf_token;
}
