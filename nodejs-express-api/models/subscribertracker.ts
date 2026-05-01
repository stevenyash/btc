import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 
interface SubscriberTrackerAttributes {
	id: number;
	phone: string | null;
	fingerprint: string | null;
	resumetime: string | null;
	timeviewtime: string | null;
	status: string | null;
	lesson_id: string;
	transaction_id: string | null;
	user_id: number;
	watchstart: string | null;
}

interface SubscriberTrackerCreationAttributes
	extends Optional<SubscriberTrackerAttributes, 'id'> {}

type SubscriberTrackerInstance = SubscriberTrackerAttributes;

class SubscriberTracker extends BaseModel<SubscriberTrackerAttributes, SubscriberTrackerCreationAttributes> {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				phone: { type: DataTypes.STRING },
				fingerprint: { type: DataTypes.STRING },
				resumetime: { type: DataTypes.STRING },
				timeviewtime: { type: DataTypes.STRING },
				status: { type: DataTypes.STRING },
				lesson_id: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				transaction_id: { type: DataTypes.STRING },
				user_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				watchstart: { type: DataTypes.STRING }
			},
			{
				sequelize,
				tableName: "subscriber_tracker",
				modelName: "subscriber_tracker"
			}
		);
	}

	static listFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			"id",
			"phone",
			sequelize.literal('fingerPrint AS fingerprint'),
			sequelize.literal('resumeTime AS resumetime'),
			sequelize.literal('timeViewTime AS timeviewtime'),
			"status",
			"lesson_id",
			"transaction_id",
			"user_id",
			sequelize.literal('watchStart AS watchstart')
		];
	}

	static viewFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			"id",
			"phone",
			sequelize.literal('fingerPrint AS fingerprint'),
			sequelize.literal('resumeTime AS resumetime'),
			sequelize.literal('timeViewTime AS timeviewtime'),
			"status",
			"lesson_id",
			"transaction_id",
			"user_id",
			sequelize.literal('watchStart AS watchstart')
		];
	}

	static editFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			"id",
			"phone",
			sequelize.literal('fingerPrint AS fingerprint'),
			sequelize.literal('resumeTime AS resumetime'),
			sequelize.literal('timeViewTime AS timeviewtime'),
			"status",
			"lesson_id",
			"transaction_id",
			"user_id"
		];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("phone LIKE :search"),
			sequelize.literal("fingerPrint LIKE :search"),
			sequelize.literal("resumeTime LIKE :search"),
			sequelize.literal("timeViewTime LIKE :search"),
			sequelize.literal("status LIKE :search"),
			sequelize.literal("lesson_id LIKE :search"),
			sequelize.literal("transaction_id LIKE :search"),
			sequelize.literal("watchStart LIKE :search")
		];
	}
}

SubscriberTracker.initModel();

export default SubscriberTracker;
