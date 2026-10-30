import { afterEach, describe, expect, it, jest } from "@jest/globals";
import type { Request, Response } from "express";
import {
  createGuestSessionKey,
  guestBrowserOriginMiddleware,
  hashGuestSessionKey,
  normalizeGuestPhone,
  readGuestSessionPhone,
  setGuestSessionCookie,
} from "./guestSession.js";

describe("guest session helpers", () => {
  afterEach(() => {
    delete process.env.AUTH_API_TOKEN_SECRET;
    delete process.env.APP_FRONTEND_URL;
    delete process.env.APP_URL;
  });

  it("normalizes Kenyan phone numbers and rejects invalid values", () => {
    expect(normalizeGuestPhone("0712345678")).toBe("254712345678");
    expect(normalizeGuestPhone("+254 712 345 678")).toBe("254712345678");
    expect(normalizeGuestPhone("123")).toBeNull();
    expect(normalizeGuestPhone({})).toBeNull();
  });

  it("creates unguessable session keys and hashes them", () => {
    const first = createGuestSessionKey();
    const second = createGuestSessionKey();

    expect(first).not.toBe(second);
    expect(first).toHaveLength(43);
    expect(hashGuestSessionKey(first)).toHaveLength(64);
    expect(hashGuestSessionKey(first)).not.toBe(first);
  });

  it("only accepts configured browser origins", () => {
    process.env.APP_FRONTEND_URL = "https://learn.example.com";
    const next = jest.fn();
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    guestBrowserOriginMiddleware(
      { get: () => "https://attacker.example" } as unknown as Request,
      response,
      next
    );

    expect(response.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();

    guestBrowserOriginMiddleware(
      { get: () => "https://learn.example.com" } as unknown as Request,
      response,
      next
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("issues a signed guest session cookie that resolves to its phone", () => {
    process.env.AUTH_API_TOKEN_SECRET = "guest-session-test-secret";
    const cookies: Record<string, string> = {};
    const response = {
      cookie: jest.fn((name: string, value: string) => {
        cookies[name] = value;
      }),
    } as unknown as Response;

    setGuestSessionCookie(response, "254712345678");

    expect(readGuestSessionPhone({ cookies } as unknown as Request)).toBe("254712345678");
    expect(readGuestSessionPhone({ cookies: { guest_session: "invalid" } } as unknown as Request)).toBeNull();
  });
});
