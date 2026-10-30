import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockFindLesson = jest.fn<(...args: unknown[]) => Promise<{ toJSON: () => Record<string, unknown> } | null>>();
const mockFindSubscription = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockFindUser = jest.fn<(...args: unknown[]) => Promise<{ phone?: string } | null>>();

jest.mock('../models/db.js', () => ({
  __esModule: true,
  default: {
    Lessons: { findOne: mockFindLesson },
    Subscriptions: { findOne: mockFindSubscription },
    Users: { findOne: mockFindUser },
    op: { gte: Symbol('gte') },
  },
}));

jest.mock('../services/classAccessService.js', () => ({
  assertSubscriberDeviceAvailable: jest.fn(),
  LessonAccessLimitError: class LessonAccessLimitError extends Error {},
  registerSubscriberDevice: jest.fn(),
}));

import { validateLessonAccess } from './validateLessonAccess.js';

function createRequest(isAdmin: boolean, isSuperadmin = false, authenticated = true) {
  return {
    params: { recid: '290' },
    query: {},
    body: {},
    headers: {},
    user: authenticated ? { id: 7 } : undefined,
    isAdmin,
    isSuperadmin,
  };
}

function createResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
}

describe('validateLessonAccess admin playback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindLesson.mockResolvedValue({
      toJSON: () => ({
        id: 290,
        title: 'Area of a rectangle',
        is_active: true,
        is_preview_available: false,
      }),
    });
    mockFindSubscription.mockResolvedValue(null);
    mockFindUser.mockResolvedValue(null);
  });

  it('grants authenticated admins unmetered playback without querying subscription limits', async () => {
    const req = createRequest(true);
    const res = createResponse();
    const next = jest.fn();

    await validateLessonAccess(req as never, res as never, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(mockFindSubscription).not.toHaveBeenCalled();
    expect(req).toHaveProperty('lessonAccess');
    expect((req as { lessonAccess?: unknown }).lessonAccess).toEqual(expect.objectContaining({
      hasAccess: true,
      accessType: 'admin',
      accessMode: 'admin',
    }));
  });

  it('continues to require subscription or purchase access for non-admin users', async () => {
    const req = createRequest(false);
    const res = createResponse();
    const next = jest.fn();

    await validateLessonAccess(req as never, res as never, next);

    expect(mockFindSubscription).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('grants superadmins unmetered access and does not trust an admin flag without authentication', async () => {
    const superadminReq = createRequest(false, true);
    const superadminRes = createResponse();
    const next = jest.fn();

    await validateLessonAccess(superadminReq as never, superadminRes as never, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(superadminReq).toHaveProperty('lessonAccess', expect.objectContaining({
      hasAccess: true,
      accessType: 'admin',
      accessMode: 'admin',
    }));

    const unauthenticatedReq = createRequest(true, false, false);
    const unauthenticatedRes = createResponse();
    const unauthenticatedNext = jest.fn();

    await validateLessonAccess(unauthenticatedReq as never, unauthenticatedRes as never, unauthenticatedNext);

    expect(unauthenticatedNext).not.toHaveBeenCalled();
    expect(unauthenticatedRes.status).toHaveBeenCalledWith(403);
  });
});
