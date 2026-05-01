import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 
type LessonTrackStatus = 'active' | 'expired' | 'exhausted' | 'cancelled';

interface LessonTrackAttributes {
	id: number;
	subscription_id: number;
	user_id: number;
	lessons_viewed: number | null;
	lesson_balance: number | null;
	total_lessons: number | null;
	package_id: number;
	status: LessonTrackStatus;
	last_accessed: Date | null;
	expires_at: Date | null;
	created_at: Date;
	updated_at: Date;
}

interface LessonTrackCreationAttributes
	extends Optional<LessonTrackAttributes, 'id' | 'lessons_viewed' | 'lesson_balance' | 'total_lessons' | 'last_accessed' | 'expires_at'> {}


class LessonTrack extends BaseModel<LessonTrackAttributes, LessonTrackCreationAttributes>
	 {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				subscription_id: { type: DataTypes.INTEGER, allowNull: false },
				user_id: { type: DataTypes.INTEGER, allowNull: false },
				lessons_viewed: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
				lesson_balance: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
				total_lessons: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
				package_id: { type: DataTypes.INTEGER, allowNull: false },
				status: {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: 'active'
			},
				last_accessed: { type: DataTypes.DATE, allowNull: true },
				expires_at: { type: DataTypes.DATE, allowNull: true }
			},
			{
				sequelize,
				tableName: "lesson_track",
				modelName: "lesson_track",
				timestamps: true,
				createdAt: 'created_at',
				updatedAt: 'updated_at',
				indexes: [
					{
						unique: true,
						fields: ['user_id', 'subscription_id']
					}
				]
			}
		);
	}

	static listFields(): string[] {
		return ["id", "subscription_id", "user_id", "lessons_viewed", "lesson_balance", "total_lessons", "package_id", "status", "last_accessed", "expires_at", "created_at"];
	}

	static viewFields(): string[] {
		return ["id", "subscription_id", "user_id", "lessons_viewed", "lesson_balance", "total_lessons", "package_id", "status", "last_accessed", "expires_at", "created_at", "updated_at"];
	}

	static editFields(): string[] {
		return ["subscription_id", "user_id", "lessons_viewed", "lesson_balance", "total_lessons", "package_id", "status", "last_accessed", "expires_at", "id"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("user_id LIKE :search"),
			sequelize.literal("status LIKE :search"),
			sequelize.literal("subscription_id LIKE :search")
		];
	}

	static associate(models: any) {
		this.belongsTo(models.Users, {
			foreignKey: 'user_id',
			as: 'user'
		});
		this.belongsTo(models.Subscriptions, {
			foreignKey: 'subscription_id',
			as: 'subscription'
		});
		this.belongsTo(models.Packages, {
			foreignKey: 'package_id',
			as: 'package'
		});
		this.hasMany(models.LessonAccessLogs, {
			foreignKey: 'lesson_track_id',
			as: 'access_logs'
		});
	}
}

LessonTrack.initModel();

export default LessonTrack;
