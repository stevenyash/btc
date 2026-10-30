import { BaseModel, sequelize } from './basemodel.js';
import { DataTypes } from 'sequelize';

interface SubscriptionLessonUsageAttributes {
	id: number;
	lesson_track_id: number;
	subscription_id: number;
	user_id: number;
	lesson_id: number;
	first_watched_at: Date;
}

class SubscriptionLessonUsage extends BaseModel<SubscriptionLessonUsageAttributes> {
	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				lesson_track_id: { type: DataTypes.INTEGER, allowNull: false },
				subscription_id: { type: DataTypes.INTEGER, allowNull: false },
				user_id: { type: DataTypes.INTEGER, allowNull: false },
				lesson_id: { type: DataTypes.INTEGER, allowNull: false },
				first_watched_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
			},
			{
				sequelize,
				tableName: 'subscription_lesson_usage',
				modelName: 'subscription_lesson_usage',
				timestamps: false,
				indexes: [
					{ unique: true, fields: ['subscription_id', 'lesson_id'] },
					{ fields: ['lesson_track_id'] },
					{ fields: ['user_id'] },
				],
			}
		);
	}
}

SubscriptionLessonUsage.initModel();

export default SubscriptionLessonUsage;
