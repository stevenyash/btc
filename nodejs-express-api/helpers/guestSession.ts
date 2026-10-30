import crypto from "crypto";
import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";

const COOKIE_NAME = "guest_session";
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

export function normalizeGuestPhone(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const digits = String(value).replace(/\D/g, "");
  const phone = digits.startsWith("0") ? `254${digits.slice(1)}` : digits;
  return /^254\d{9}$/.test(phone) ? phone : null;
}

export function hashGuestSessionKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function createGuestSessionKey(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function guestBrowserOriginMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const origin = req.get("origin");
  if (!origin) {
    res.status(403).json({ error: "A valid browser origin is required" });
    return;
  }

  const allowedOrigins = [process.env.APP_FRONTEND_URL, process.env.APP_URL]
    .filter((value): value is string => Boolean(value))
    .map((value) => {
      try {
        return new URL(value).origin;
      } catch {
        return null;
      }
    })
    .filter((value): value is string => value !== null);

  if (process.env.NODE_ENV !== "production") {
    allowedOrigins.push("http://localhost:5173", "http://localhost:3000");
  }

  if (!allowedOrigins.includes(origin)) {
    res.status(403).json({ error: "Request origin is not allowed" });
    return;
  }
  next();
}

export function setGuestSessionCookie(res: Response, phone: string): void {
  const secret = process.env.AUTH_API_TOKEN_SECRET;
  if (!secret) throw new Error("AUTH_API_TOKEN_SECRET is required to issue guest sessions");

  const token = jwt.sign({ phone, purpose: "guest-session" }, secret, {
    expiresIn: SESSION_TTL_SECONDS,
  });
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax" | "none";
    maxAge: number;
    path: string;
    domain?: string;
  } = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS * 1000,
    path: "/",
  };

  if (isProduction && process.env.APP_FRONTEND_URL) {
    const hostname = new URL(process.env.APP_FRONTEND_URL).hostname;
    const parts = hostname.split(".");
    if (parts.length >= 3) {
      cookieOptions.domain = hostname.endsWith(".co.ke") || hostname.endsWith(".or.ke") || hostname.endsWith(".go.ke")
        ? `.${parts.slice(-3).join(".")}`
        : `.${parts.slice(-2).join(".")}`;
    }
  }

  res.cookie(COOKIE_NAME, token, cookieOptions);
}

export function clearGuestSessionCookie(res: Response): void {
  const isProduction = process.env.NODE_ENV === "production";
  const clearOptions: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax" | "none";
    path: string;
    domain?: string;
  } = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  };

  if (isProduction && process.env.APP_FRONTEND_URL) {
    const hostname = new URL(process.env.APP_FRONTEND_URL).hostname;
    const parts = hostname.split(".");
    if (parts.length >= 3) {
      clearOptions.domain = hostname.endsWith(".co.ke") || hostname.endsWith(".or.ke") || hostname.endsWith(".go.ke")
        ? `.${parts.slice(-3).join(".")}`
        : `.${parts.slice(-2).join(".")}`;
    }
  }

  res.clearCookie(COOKIE_NAME, clearOptions);
}

export function guestSessionMiddleware(req: Request, res: Response, next: NextFunction): void {
  guestBrowserOriginMiddleware(req, res, () => {
    const phone = readGuestSessionPhone(req);
    if (!phone) {
      res.status(401).json({ error: "Verify your phone or complete a lesson payment to continue" });
      return;
    }
    req.guestPhone = phone;
    next();
  });
}

export function guestSessionOrAuthenticatedMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  guestBrowserOriginMiddleware(req, res, () => {
    if (req.user?.id) {
      next();
      return;
    }
    const phone = readGuestSessionPhone(req);
    if (!phone) {
      res.status(401).json({ error: "Verify your phone or complete a lesson payment to continue" });
      return;
    }
    req.guestPhone = phone;
    next();
  });
}

export function readGuestSessionPhone(req: Request): string | null {
  const token = req.cookies?.[COOKIE_NAME];
  const secret = process.env.AUTH_API_TOKEN_SECRET;
  if (!token || !secret) return null;

  try {
    const payload = jwt.verify(token, secret) as jwt.JwtPayload;
    return payload.purpose === "guest-session" ? normalizeGuestPhone(payload.phone) : null;
  } catch {
    return null;
  }
}

export function requireMatchingGuestPhone(req: Request, requestedPhone: unknown): string | null {
  const phone = normalizeGuestPhone(requestedPhone);
  if (!phone) return null;

  if (req.guestPhone === phone) return phone;

  const authenticatedPhone = normalizeGuestPhone(req.user?.phone);
  return req.user?.id && authenticatedPhone === phone ? phone : null;
}
