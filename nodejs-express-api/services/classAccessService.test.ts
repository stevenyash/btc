import { beforeEach, describe, expect, it, jest } from '@jest/globals';

type TestTransaction = { LOCK: { UPDATE: string } };
type TestSubscription = { id: number };
type TestTrack = {
	id: number;
	total_lessons: number;
	remaining_watch_time_seconds: number;
	lesson_balance: number;
	update: jest.Mock<(values: Record<string, number>) => Promise<void>>;
};
type TestDevice = { update: jest.Mock<() => Promise<void>> };
type TestUsage = { lesson_id: number };

const mockTransaction: TestTransaction = { LOCK: { UPDATE: 'UPDATE' } };
const mockFindSubscription = jest.fn<(...args: unknown[]) => Promise<TestSubscription | null>>();
const mockFindTrack = jest.fn<(...args: unknown[]) => Promise<TestTrack | null>>();
const mockDestroyDevice = jest.fn<(...args: unknown[]) => Promise<number>>();
const mockFindDevice = jest.fn<(...args: unknown[]) => Promise<TestDevice | null>>();
const mockCountDevices = jest.fn<(...args: unknown[]) => Promise<number>>();
const mockCreateDevice = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockFindUsage = jest.fn<(options?: { where?: { lesson_id?: number } }) => Promise<TestUsage | null>>();
const mockCountUsage = jest.fn<(...args: unknown[]) => Promise<number>>();
const mockCreateUsage = jest.fn<(values: TestUsage) => Promise<TestUsage>>();
const mockRunTransaction = jest.fn(
	async (callback: (transaction: TestTransaction) => Promise<unknown>) => callback(mockTransaction)
);

jest.mock('../models/db.js', () => ({
	__esModule: true,
	default: {
		Subscriptions: { findOne: mockFindSubscription },
		LessonTrack: { findOne: mockFindTrack },
		SubscriptionDeviceSession: {
			destroy: mockDestroyDevice,
			findOne: mockFindDevice,
			count: mockCountDevices,
			create: mockCreateDevice,
		},
		SubscriptionLessonUsage: {
			findOne: mockFindUsage,
			count: mockCountUsage,
			create: mockCreateUsage,
		},
	},
	sequelize: { transaction: mockRunTransaction },
}));

import {
	assertSubscriberDeviceAvailable,
	LessonAccessLimitError,
	recordSubscriberWatchTime,
	registerSubscriberDevice,
} from './classAccessService.js';

let track: TestTrack;
let device: TestDevice | null;
let usages: TestUsage[];
let activeDeviceCount: number;
let existingDevice: TestDevice | null;

describe('class access service', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		track = {
			id: 31,
			total_lessons: 2,
			remaining_watch_time_seconds: 100,
			lesson_balance: 2,
			update: jest.fn(async (values: Record<string, number>) => {
				Object.assign(track, values);
			}),
		};
		device = { update: jest.fn(async () => undefined) };
		usages = [];
		activeDeviceCount = 0;
		existingDevice = null;

		mockRunTransaction.mockImplementation(async (callback) => callback(mockTransaction));
		mockFindSubscription.mockResolvedValue({ id: 21 });
		mockFindTrack.mockResolvedValue(track);
		mockDestroyDevice.mockResolvedValue(0);
		mockFindDevice.mockImplementation(async () => device);
		mockCountDevices.mockImplementation(async () => activeDeviceCount);
		mockCreateDevice.mockResolvedValue({});
		mockFindUsage.mockImplementation(async (options) =>
			usages.find((usage) => usage.lesson_id === options?.where?.lesson_id) || null
		);
		mockCountUsage.mockImplementation(async () => usages.length);
		mockCreateUsage.mockImplementation(async (values) => {
			const usage = { lesson_id: values.lesson_id };
			usages.push(usage);
			return usage;
		});
	});

	it('counts a distinct lesson once and deducts time on resume', async () => {
		const first = await recordSubscriberWatchTime(7, 101, 30, 'device-identifier-0001');
		const replay = await recordSubscriberWatchTime(7, 101, 20, 'device-identifier-0001');

		expect(first).toMatchObject({ remainingWatchTimeSeconds: 70, lessonsUsed: 1, totalLessons: 2 });
		expect(replay).toMatchObject({ remainingWatchTimeSeconds: 50, lessonsUsed: 1, totalLessons: 2 });
		expect(usages).toHaveLength(1);
	});

	it('blocks a new lesson when slots are exhausted but allows a counted lesson', async () => {
		track.total_lessons = 1;
		usages.push({ lesson_id: 101 });

		const resume = await recordSubscriberWatchTime(7, 101, 10, 'device-identifier-0001');
		expect(resume).toMatchObject({ lessonsUsed: 1, remainingWatchTimeSeconds: 90 });

		await expect(recordSubscriberWatchTime(7, 102, 10, 'device-identifier-0001')).rejects.toMatchObject({
			code: 'LESSON_LIMIT_REACHED',
		});
	});

	it('clamps a watch-time deduction at zero and rejects subsequent usage', async () => {
		track.remaining_watch_time_seconds = 15;

		const result = await recordSubscriberWatchTime(7, 101, 30, 'device-identifier-0001');
		expect(result.remainingWatchTimeSeconds).toBe(0);

		await expect(recordSubscriberWatchTime(7, 101, 1, 'device-identifier-0001')).rejects.toMatchObject({
			code: 'WATCH_TIME_EXHAUSTED',
		});
	});

	it('allows an active device at the device cap and blocks a new device', async () => {
		device = null;
		activeDeviceCount = 2;
		await expect(assertSubscriberDeviceAvailable(7, 'new-device-identifier-0001', 2)).rejects.toMatchObject({
			code: 'DEVICE_LIMIT_REACHED',
		});

		device = { update: jest.fn(async () => undefined) };
		await expect(assertSubscriberDeviceAvailable(7, 'existing-device-00001', 2)).resolves.toBeUndefined();
	});

	it('does not register another device when the cap is reached', async () => {
		activeDeviceCount = 1;
		mockFindDevice.mockResolvedValue(null);

		await expect(registerSubscriberDevice(7, 'new-device-identifier-0001', 101, 1)).rejects.toMatchObject({
			code: 'DEVICE_LIMIT_REACHED',
		});
		expect(mockCreateDevice).not.toHaveBeenCalled();
	});

	it('rejects package playback if the device session is missing', async () => {
		device = null;

		await expect(recordSubscriberWatchTime(7, 101, 10, 'device-identifier-0001')).rejects.toBeInstanceOf(
			LessonAccessLimitError
		);
	});
});
