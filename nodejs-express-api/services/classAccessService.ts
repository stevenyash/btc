import { Op } from 'sequelize';
import DB, { sequelize } from '../models/db.js';

export class LessonAccessLimitError extends Error {
	constructor(
		public readonly code: 'LESSON_LIMIT_REACHED' | 'WATCH_TIME_EXHAUSTED' | 'DEVICE_LIMIT_REACHED' | 'SUBSCRIPTION_INACTIVE',
		message: string,
		public readonly details?: Record<string, unknown>
	) {
		super(message);
		this.name = 'LessonAccessLimitError';
	}
}

const DEVICE_SESSION_TIMEOUT_MS = 2 * 60 * 1000;

export async function registerSubscriberDevice(
	userId: number,
	deviceId: string,
	lessonId: number,
	maxDevices: number
): Promise<void> {
	await sequelize.transaction(async (transaction) => {
		const activeSubscription = await DB.Subscriptions.findOne({
			where: {
				user_id: String(userId),
				status: 'active',
				expiry_date: { [Op.gte]: new Date() },
			},
			transaction,
		});

		if (!activeSubscription) {
			throw new LessonAccessLimitError('SUBSCRIPTION_INACTIVE', 'Subscription is not active');
		}

		await DB.LessonTrack.findOne({
			where: {
				user_id: userId,
				subscription_id: activeSubscription.id,
			},
			transaction,
			lock: transaction.LOCK.UPDATE,
		});

		const staleBefore = new Date(Date.now() - DEVICE_SESSION_TIMEOUT_MS);
		await DB.SubscriptionDeviceSession.destroy({
			where: { user_id: userId, last_heartbeat_at: { [Op.lt]: staleBefore } },
			transaction,
		});

		const current = await DB.SubscriptionDeviceSession.findOne({
			where: { user_id: userId, device_id: deviceId },
			transaction,
		});
		if (current) {
			await current.update({ lesson_id: lessonId, last_heartbeat_at: new Date() }, { transaction });
			return;
		}

		const activeCount = await DB.SubscriptionDeviceSession.count({
			where: { user_id: userId },
			transaction,
		});
		if (activeCount >= maxDevices) {
			throw new LessonAccessLimitError(
				'DEVICE_LIMIT_REACHED',
				'All package device slots are in use',
				{ activeDevices: activeCount, deviceLimit: maxDevices }
			);
		}

		await DB.SubscriptionDeviceSession.create({
			user_id: userId,
			device_id: deviceId,
			lesson_id: lessonId,
			last_heartbeat_at: new Date(),
			created_at: new Date(),
			updated_at: new Date(),
		}, { transaction });
	});
}

export async function assertSubscriberDeviceAvailable(
	userId: number,
	deviceId: string,
	maxDevices: number
): Promise<void> {
	const staleBefore = new Date(Date.now() - DEVICE_SESSION_TIMEOUT_MS);
	await DB.SubscriptionDeviceSession.destroy({
		where: { user_id: userId, last_heartbeat_at: { [Op.lt]: staleBefore } },
	});
	const existing = await DB.SubscriptionDeviceSession.findOne({
		where: { user_id: userId, device_id: deviceId },
	});
	if (existing) return;

	const activeCount = await DB.SubscriptionDeviceSession.count({ where: { user_id: userId } });
	if (activeCount >= maxDevices) {
		throw new LessonAccessLimitError(
			'DEVICE_LIMIT_REACHED',
			'All package device slots are in use',
			{ activeDevices: activeCount, deviceLimit: maxDevices }
		);
	}
}

export async function releaseSubscriberDevice(userId: number, deviceId: string): Promise<void> {
	await DB.SubscriptionDeviceSession.destroy({ where: { user_id: userId, device_id: deviceId } });
}

export async function heartbeatSubscriberDevice(
	userId: number,
	deviceId: string,
	lessonId: number
): Promise<void> {
	const subscription = await DB.Subscriptions.findOne({
		where: {
			user_id: String(userId),
			status: 'active',
			expiry_date: { [Op.gte]: new Date() },
		},
	});
	const track = subscription
		? await DB.LessonTrack.findOne({
			where: { user_id: userId, subscription_id: subscription.id, status: 'active' },
		})
		: null;
	const packageRecord = track
		? await DB.Packages.findOne({ where: { id: track.package_id }, raw: true })
		: null;
	if (!subscription || !packageRecord) {
		throw new LessonAccessLimitError('SUBSCRIPTION_INACTIVE', 'No active subscription package was found');
	}
	await registerSubscriberDevice(userId, deviceId, lessonId, Number(packageRecord.concurrent_access || 1));
}

export async function recordSubscriberWatchTime(
	userId: number,
	lessonId: number,
	watchTimeSeconds: number,
	deviceId: string
): Promise<{ remainingWatchTimeSeconds: number; lessonsUsed: number; totalLessons: number }> {
	return sequelize.transaction(async (transaction) => {
		const subscription = await DB.Subscriptions.findOne({
			where: {
				user_id: String(userId),
				status: 'active',
				expiry_date: { [Op.gte]: new Date() },
			},
			transaction,
		});
		if (!subscription) {
			throw new LessonAccessLimitError('SUBSCRIPTION_INACTIVE', 'Subscription is not active');
		}

		const track = await DB.LessonTrack.findOne({
			where: { user_id: userId, subscription_id: subscription.id, status: 'active' },
			transaction,
			lock: transaction.LOCK.UPDATE,
		});
		if (!track) {
			throw new LessonAccessLimitError('SUBSCRIPTION_INACTIVE', 'No active subscription package was found');
		}

		const device = await DB.SubscriptionDeviceSession.findOne({
			where: {
				user_id: userId,
				device_id: deviceId,
				last_heartbeat_at: { [Op.gte]: new Date(Date.now() - DEVICE_SESSION_TIMEOUT_MS) },
			},
			transaction,
		});
		if (!device) {
			throw new LessonAccessLimitError('DEVICE_LIMIT_REACHED', 'Playback device session is not active');
		}

		let usage = await DB.SubscriptionLessonUsage.findOne({
			where: { subscription_id: subscription.id, lesson_id: lessonId },
			transaction,
		});
		if (!usage) {
			const usedCount = await DB.SubscriptionLessonUsage.count({
				where: { subscription_id: subscription.id },
				transaction,
			});
			const lessonLimit = Number(track.total_lessons || 0);
			if (usedCount >= lessonLimit) {
				throw new LessonAccessLimitError('LESSON_LIMIT_REACHED', 'Package lesson limit has been reached');
			}
			usage = await DB.SubscriptionLessonUsage.create({
				lesson_track_id: track.id,
				subscription_id: subscription.id,
				user_id: userId,
				lesson_id: lessonId,
				first_watched_at: new Date(),
			}, { transaction });
		}

		const remaining = Number(track.remaining_watch_time_seconds || 0);
		if (remaining <= 0) {
			throw new LessonAccessLimitError('WATCH_TIME_EXHAUSTED', 'Package watch-time allowance has been used');
		}

		const consumedSeconds = Math.min(Math.floor(watchTimeSeconds), remaining);
		const remainingAfter = remaining - consumedSeconds;
		const lessonsUsed = await DB.SubscriptionLessonUsage.count({
			where: { subscription_id: subscription.id },
			transaction,
		});
		await track.update({
			remaining_watch_time_seconds: remainingAfter,
			lesson_balance: Math.max(0, Number(track.total_lessons || 0) - lessonsUsed),
			lessons_viewed: lessonsUsed,
			last_accessed: new Date(),
		}, { transaction });

		await device.update({ last_heartbeat_at: new Date(), lesson_id: lessonId }, { transaction });

		return {
			remainingWatchTimeSeconds: remainingAfter,
			lessonsUsed,
			totalLessons: Number(track.total_lessons || 0),
		};
	});
}
