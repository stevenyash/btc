import { BaseModel, sequelize, Sequelize } from './basemodel';
import { Optional, DataTypes } from "sequelize"; 
type GuestTrackerStatus = 'active' | 'inactive' | 'expired' | 'completed';

interface GuestTrackerAttributes {
	id: number;
	phone: string;
	fingerPrint: string | null;
	watch_started_at: Date | null;
	resumeTime: number | null;
	total_watch_time: number | null;
	status: GuestTrackerStatus;
	lesson_id: number;
	transaction_id: string | null;
	views_count: number | null;
	last_accessed: Date | null;
	expires_at: Date | null;
	created_at: Date;
	updated_at: Date;
}

interface GuestTrackerCreationAttributes
	extends Optional<GuestTrackerAttributes, 'id' | 'fingerPrint' | 'watch_started_at' | 'resumeTime' | 'total_watch_time' | 'transaction_id' | 'views_count' | 'last_accessed' | 'expires_at'> {}


class GuestTracker extends BaseModel<GuestTrackerAttributes, GuestTrackerCreationAttributes> {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				phone: { type: DataTypes.STRING, allowNull: false },
				fingerPrint: { type: DataTypes.STRING, allowNull: true },
				watch_started_at: { type: DataTypes.DATE, allowNull: true },
				resumeTime: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
				total_watch_time: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
				status: {
					type: 'ENUM' as const, values: [],
					allowNull: false,
					defaultValue: 'active'
				},
				lesson_id: { type: DataTypes.INTEGER, allowNull: false },
				transaction_id: { type: DataTypes.STRING, allowNull: true },
				views_count: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
				last_accessed: { type: DataTypes.DATE, allowNull: true },
				expires_at: { type: DataTypes.DATE, allowNull: true }
			},
			{
				sequelize,
				tableName: "guest_tracker",
				modelName: "guest_tracker",
				timestamps: true,
				createdAt: 'created_at',
				updatedAt: 'updated_at',
				indexes: [
					{
						unique: true,
						fields: ['phone', 'lesson_id']
					}
				]
			}
		);
	}

	static listFields(): string[] {
		return ["id", "phone", "lesson_id", "status", "views_count", "last_accessed", "expires_at", "created_at"];
	}

	static viewFields(): string[] {
		return ["id", "phone", "fingerPrint", "watch_started_at", "resumeTime", "total_watch_time", "status", "lesson_id", "transaction_id", "views_count", "last_accessed", "expires_at", "created_at", "updated_at"];
	}

	static editFields(): string[] {
		return ["phone", "fingerPrint", "watch_started_at", "resumeTime", "total_watch_time", "status", "lesson_id", "transaction_id", "views_count", "last_accessed", "expires_at", "id"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("phone LIKE :search"),
			sequelize.literal("transaction_id LIKE :search"),
			sequelize.literal("status LIKE :search")
		];
	}

	static associate(models: any) {
		this.belongsTo(models.Lessons, {
			foreignKey: 'lesson_id',
			as: 'lesson'
		});
		this.hasMany(models.LessonAccessLogs, {
			foreignKey: 'guest_tracker_id',
			as: 'access_logs'
		});
	}
}

GuestTracker.initModel();

export default GuestTracker;

