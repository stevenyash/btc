import { sequelize } from './basemodel.js';
import { Op } from 'sequelize';

// Import models
import AboutUs from './aboutus.ts';
import ActiveSubscriptions from './activesubscriptions.ts';
import AssignRights from './assignrights.ts';
import ContactUs from './contactus.ts';
import Grades from './grades.ts';
import GuestTracker from './guesttracker.ts';
import GuestLessonPayments from './guestLessonPayments.ts';
import Invites from './invites.ts';
import LearningAreas from './learningareas.ts';
import LearningLevels from './learninglevels.ts';
import Lessons from './lessons.ts';
import LessonSetting from './lessonsetting.ts';
import LessonTrack from './lessontrack.ts';
import LessonAccessLogs from './lessonaccesslogs.ts';
import Marketers from './marketers.ts';
import MarketerCommissions from './marketer_commissions.ts';
import MarketerPointRedemptions from './marketer_point_redemptions.ts';
import MarketerWithdrawals from './marketer_withdrawals.ts';
import SystemSettings from './system_settings.ts';
import NewsletterSubscribers from './newslettersubscribers.ts';
import Packages from './packages.ts';
import Purchases from './purchases.ts';
import Questions from './questions.ts';
import RolePermissions from './rolepermissions.ts';
import Roles from './roles.ts';
import Scheduler from './scheduler.ts';
import ServicesSettings from './servicessettings.ts';
import SubscriberTracker from './subscribertracker.ts';
import Subscriptions from './subscriptions.ts';
import SubscriptionTypes from './subscriptiontypes.ts';
import Subtopics from './subtopics.ts';
import Topics from './topics.ts';
import Transactions from './transactions.ts';
import TutorialRegister from './tutorialregister.ts';
import TutorialsSettings from './tutorialssettings.ts';
import UserActivity from './useractivity.ts';
import UserGuide from './userguide.ts';
import UserPrivileges from './userprivileges.ts';
import Users from './users.ts';
import Videos from './videos.ts';
import TokenBlacklist from './token_blacklist.ts';

// Set up associations
// Scheduler associations
Scheduler.belongsTo(Users, { foreignKey: 'user_id', as: 'users' });
Scheduler.belongsTo(Users, { foreignKey: 'user_id', as: 'users2' });

// Users associations
Users.belongsTo(Roles, { foreignKey: 'user_role_id', as: 'roles' });
Users.belongsTo(Roles, { foreignKey: 'user_role_id', as: 'roles2' });

// Learning hierarchy associations
LearningLevels.hasMany(Grades, { foreignKey: 'level_id', as: 'grades' });
Grades.belongsTo(LearningLevels, { foreignKey: 'level_id', as: 'learning_level' });

Grades.hasMany(LearningAreas, { foreignKey: 'grade_id', as: 'learning_areas' });
LearningAreas.belongsTo(Grades, { foreignKey: 'grade_id', as: 'grade_info' });

LearningAreas.hasMany(Lessons, { foreignKey: 'area_id', as: 'lessons' });
Lessons.belongsTo(LearningAreas, { foreignKey: 'area_id', as: 'learning_area' });

// Topics and Subtopics associations
Topics.hasMany(Subtopics, { foreignKey: 'topic_id', as: 'subtopics' });
Subtopics.belongsTo(Topics, { foreignKey: 'topic_id', as: 'topic' });

// Lessons associations with Topics and Subtopics
Lessons.belongsTo(Topics, { foreignKey: 'topic_id', as: 'topic' });
Lessons.belongsTo(Subtopics, { foreignKey: 'subtopic_id', as: 'subtopic' });

// LessonTrack associations
LessonTrack.belongsTo(Subscriptions, {
	foreignKey: 'subscription_id',
	as: 'subscription'
});

LessonTrack.belongsTo(Packages, {
	foreignKey: 'package_id',
	as: 'package'
});

// LessonTrack and LessonAccessLogs associations
LessonTrack.hasMany(LessonAccessLogs, {
	foreignKey: 'lesson_track_id',
	as: 'access_logs'
});
LessonAccessLogs.belongsTo(LessonTrack, {
	foreignKey: 'lesson_track_id',
	as: 'lesson_track'
});

// Users and LessonAccessLogs associations
Users.hasMany(LessonAccessLogs, {
	foreignKey: 'user_id',
	as: 'access_logs'
});
LessonAccessLogs.belongsTo(Users, {
	foreignKey: 'user_id',
	as: 'user'
});

// Lessons and LessonAccessLogs associations
Lessons.hasMany(LessonAccessLogs, {
	foreignKey: 'lesson_id',
	as: 'access_logs'
});
LessonAccessLogs.belongsTo(Lessons, {
	foreignKey: 'lesson_id',
	as: 'lesson'
});

// LessonSetting and LessonAccessLogs associations
LessonSetting.hasMany(LessonAccessLogs, {
	foreignKey: 'lesson_setting_id',
	as: 'access_logs'
});
LessonAccessLogs.belongsTo(LessonSetting, {
	foreignKey: 'lesson_setting_id',
	as: 'lesson_setting'
});

// Purchase associations
Users.hasMany(Purchases, { foreignKey: 'user_id', as: 'purchases' });
Purchases.belongsTo(Users, { foreignKey: 'user_id', as: 'user' });

Lessons.hasMany(Purchases, { foreignKey: 'lesson_id', as: 'purchases' });
Purchases.belongsTo(Lessons, { foreignKey: 'lesson_id', as: 'lesson' });

// Subscription associations
Users.hasMany(Subscriptions, { foreignKey: 'user_id', as: 'subscriptions' });
Subscriptions.belongsTo(Users, { foreignKey: 'user_id', as: 'user' });

SubscriptionTypes.hasMany(Subscriptions, { foreignKey: 'subscription_type_id', as: 'subscriptions' });
Subscriptions.belongsTo(SubscriptionTypes, { foreignKey: 'subscription_type_id', as: 'subscription_type' });

// Video associations
Lessons.hasMany(Videos, { foreignKey: 'lesson_id', as: 'videos' });
Videos.belongsTo(Lessons, { foreignKey: 'lesson_id', as: 'lesson' });

// Question associations
Topics.hasMany(Questions, { foreignKey: 'topic_id', as: 'questions' });
Questions.belongsTo(Topics, { foreignKey: 'topic_id', as: 'topic' });

Subtopics.hasMany(Questions, { foreignKey: 'subtopic_id', as: 'questions' });
Questions.belongsTo(Subtopics, { foreignKey: 'subtopic_id', as: 'subtopic' });

// Marketer associations
Marketers.hasMany(MarketerCommissions, { foreignKey: 'marketer_id', as: 'commissions' });
MarketerCommissions.belongsTo(Marketers, { foreignKey: 'marketer_id', as: 'marketer' });
MarketerCommissions.belongsTo(Users, { foreignKey: 'user_id', as: 'user' });
MarketerCommissions.belongsTo(Transactions, { foreignKey: 'transaction_id', as: 'transaction' });

Marketers.hasMany(MarketerPointRedemptions, { foreignKey: 'marketer_id', as: 'point_redemptions' });
MarketerPointRedemptions.belongsTo(Marketers, { foreignKey: 'marketer_id', as: 'marketer' });

Marketers.hasMany(MarketerWithdrawals, { foreignKey: 'marketer_id', as: 'withdrawals' });
MarketerWithdrawals.belongsTo(Marketers, { foreignKey: 'marketer_id', as: 'marketer' });

// GuestTracker and LessonAccessLogs associations
GuestTracker.hasMany(LessonAccessLogs, {
	foreignKey: 'guest_tracker_id',
	as: 'access_logs'
});
LessonAccessLogs.belongsTo(GuestTracker, {
	foreignKey: 'guest_tracker_id',
	as: 'guest_tracker'
});

// GuestLessonPayments associations
Lessons.hasMany(GuestLessonPayments, {
	foreignKey: 'lesson_id',
	as: 'guest_payments'
});
GuestLessonPayments.belongsTo(Lessons, {
	foreignKey: 'lesson_id',
	as: 'lesson'
});

// Weekend Tutorials associations
Users.hasMany(Scheduler, { foreignKey: 'user_id', as: 'scheduled_tutorials' });
Scheduler.belongsTo(Users, { foreignKey: 'user_id', as: 'organizer' });

TutorialRegister.belongsTo(Users, { foreignKey: 'user_id', as: 'buyer' });
Users.hasMany(TutorialRegister, { foreignKey: 'user_id', as: 'tutorial_purchases' });

TutorialRegister.belongsTo(Scheduler, { foreignKey: 'tutorial_id', as: 'tutorial' });
Scheduler.hasMany(TutorialRegister, { foreignKey: 'tutorial_id', as: 'purchases' });

Questions.belongsTo(Scheduler, { foreignKey: 'scheduler_id', as: 'tutorial' });
Scheduler.hasMany(Questions, { foreignKey: 'scheduler_id', as: 'questions' });

// Convenient functions for performing raw queries
const op = Op;
const raw = sequelize.literal;

async function rawQuery(queryText: string, options?: Record<string, any>) {
	return sequelize.query(queryText, options);
}

async function rawQueryList(queryText: string, queryParams?: Record<string, any>) {
	const records = await rawQuery(queryText, { replacements: queryParams, type: (sequelize as any).QueryTypes.SELECT });
	return records;
}

async function rawQueryOne(queryText: string, queryParams?: Record<string, any>) {
	const records = await rawQueryList(queryText, queryParams);
	return records[0] || null;
}

async function rawQueryValue(queryText: string, queryParams?: Record<string, any>) {
	const record = await rawQueryOne(queryText, queryParams);
	if (record) {
		return Object.values(record)[0];
	}
	return null;
}

const ALLOWED_ORDER_COLUMNS = [
	'id', 'username', 'email', 'phone', 'created_at', 'updated_at',
	'name', 'title', 'status', 'account_status', 'user_role_id',
	'role_id', 'role_name', 'price', 'amount', 'createdAt', 'updatedAt'
];
const ALLOWED_ORDER_TYPES = ['asc', 'desc'];

function getOrderBy(
	req: { query: Record<string, any> },
	sortField: string | null = null,
	sortType: 'asc' | 'desc' = 'desc'
): [object] | null {
	let orderBy = req.query.orderby || sortField;
	let orderType = (req.query.ordertype || sortType)?.toLowerCase();

	if (!orderBy || !ALLOWED_ORDER_COLUMNS.includes(orderBy)) {
		orderBy = sortField || 'id';
	}
	if (!orderType || !ALLOWED_ORDER_TYPES.includes(orderType)) {
		orderType = sortType || 'desc';
	}

	let order = raw(`${orderBy} ${orderType.toUpperCase()}`);
	return [[order]];
}

// Database object with all models and utility functions
const DB = {
	AboutUs,
	ActiveSubscriptions,
	AssignRights,
	TokenBlacklist,
	ContactUs,
	Grades,
	GuestTracker,
	GuestLessonPayments,
	Invites,
	LearningAreas,
	LearningLevels,
	LessonAccessLogs,
	Lessons,
	LessonSetting,
	LessonTrack,
	MarketerCommissions,
	MarketerPointRedemptions,
	MarketerWithdrawals,
	Marketers,
	NewsletterSubscribers,
	Packages,
	Purchases,
	Questions,
	RolePermissions,
	Roles,
	Scheduler,
	ServicesSettings,
	SubscriberTracker,
	Subscriptions,
	SubscriptionTypes,
	Subtopics,
	Topics,
	Transactions,
	TutorialRegister,
	TutorialsSettings,
	UserActivity,
	UserGuide,
	UserPrivileges,
	Users,
	Videos,
	op,
	raw,
	rawQuery,
	rawQueryList,
	rawQueryOne,
	rawQueryValue,
	getOrderBy
} as any;

export default DB;
export { sequelize, op, raw, rawQuery, rawQueryList, rawQueryOne, rawQueryValue, getOrderBy };
export type {
	AboutUs,
	ActiveSubscriptions,
	AssignRights,
	ContactUs,
	Grades,
	GuestTracker,
	GuestLessonPayments,
	Invites,
	LearningAreas,
	LearningLevels,
	Lessons,
	LessonSetting,
	LessonTrack,
	LessonAccessLogs,
	Marketers,
	MarketerCommissions,
	MarketerPointRedemptions,
	MarketerWithdrawals,
	SystemSettings,
	NewsletterSubscribers,
	Packages,
	Purchases,
	Questions,
	RolePermissions,
	Roles,
	Scheduler,
	ServicesSettings,
	SubscriberTracker,
	Subscriptions,
	SubscriptionTypes,
	Subtopics,
	Topics,
	Transactions,
	TutorialRegister,
	TutorialsSettings,
	UserActivity,
	UserGuide,
	UserPrivileges,
	Users,
	Videos
};
