import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 
type AccessType = 'guest' | 'subscriber' | 'subscriber_resumed' | 'preview';
type LessonAccessLogStatus = 'active' | 'completed' | 'expired' | 'cancelled';

interface LessonAccessLogsAttributes {
	id: number;
	user_id: number | null;
	phone: string | null;
	lesson_id: number;
	access_type: AccessType;
	ip_address: string | null;
	user_agent: string | null;
	session_id: string;
	expires_at: Date;
	accessed_at: Date;
	completed_at: Date | null;
	watch_time: number | null;
	completion_percentage: number | null;
	guest_tracker_id: number | null;
	lesson_track_id: number | null;
	lesson_setting_id: number | null;
	status: LessonAccessLogStatus;
	created_at: Date;
	updated_at: Date;
}

interface LessonAccessLogsCreationAttributes
	extends Optional<LessonAccessLogsAttributes, 'id' | 'user_id' | 'phone' | 'ip_address' | 'user_agent' | 'completed_at' | 'watch_time' | 'completion_percentage' | 'guest_tracker_id' | 'lesson_track_id' | 'lesson_setting_id'> {}


class LessonAccessLogs extends BaseModel<LessonAccessLogsAttributes, LessonAccessLogsCreationAttributes>
	 {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				user_id: { type: DataTypes.INTEGER, allowNull: true },
				phone: { type: DataTypes.STRING, allowNull: true },
				lesson_id: { type: DataTypes.INTEGER, allowNull: false },
			access_type: {
				type: DataTypes.ENUM('guest','subscriber','subscriber_resumed','preview'),
				allowNull: false
			},
				ip_address: { type: DataTypes.STRING, allowNull: true },
				user_agent: { type: DataTypes.TEXT, allowNull: true },
				session_id: { type: DataTypes.STRING, allowNull: false },
				expires_at: { type: DataTypes.DATE, allowNull: false },
				accessed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
				completed_at: { type: DataTypes.DATE, allowNull: true },
				watch_time: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
				completion_percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true, defaultValue: 0.00 },
				guest_tracker_id: { type: DataTypes.INTEGER, allowNull: true },
				lesson_track_id: { type: DataTypes.INTEGER, allowNull: true },
				lesson_setting_id: { type: DataTypes.INTEGER, allowNull: true },
			status: {
				type: DataTypes.ENUM('active','completed','expired','cancelled'),
				allowNull: false,
				defaultValue: 'active'
			}
			},
			{
				sequelize,
				tableName: "lesson_access_logs",
				modelName: "lesson_access_logs",
				timestamps: true,
				createdAt: 'created_at',
				updatedAt: 'updated_at'
			}
		);
	}

	static listFields(): string[] {
		return ["id", "user_id", "phone", "lesson_id", "access_type", "ip_address", "session_id", "expires_at", "accessed_at", "status", "created_at"];
	}

	static viewFields(): string[] {
		return ["id", "user_id", "phone", "lesson_id", "access_type", "ip_address", "user_agent", "session_id", "expires_at", "accessed_at", "completed_at", "watch_time", "completion_percentage", "guest_tracker_id", "lesson_track_id", "lesson_setting_id", "status", "created_at", "updated_at"];
	}

	static editFields(): string[] {
		return ["user_id", "phone", "lesson_id", "access_type", "ip_address", "user_agent", "session_id", "expires_at", "accessed_at", "completed_at", "watch_time", "completion_percentage", "guest_tracker_id", "lesson_track_id", "lesson_setting_id", "status", "id"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("user_id LIKE :search"),
			sequelize.literal("phone LIKE :search"),
			sequelize.literal("lesson_id LIKE :search"),
			sequelize.literal("access_type LIKE :search"),
			sequelize.literal("ip_address LIKE :search"),
			sequelize.literal("session_id LIKE :search")
		];
	}

	static associate(models: any) {
		this.belongsTo(models.Users, {
			foreignKey: 'user_id',
			as: 'user'
		});
		this.belongsTo(models.Lessons, {
			foreignKey: 'lesson_id',
			as: 'lesson'
		});
		this.belongsTo(models.GuestTracker, {
			foreignKey: 'guest_tracker_id',
			as: 'guest_tracker'
		});
		this.belongsTo(models.LessonTrack, {
			foreignKey: 'lesson_track_id',
			as: 'lesson_track'
		});
		this.belongsTo(models.LessonSetting, {
			foreignKey: 'lesson_setting_id',
			as: 'lesson_setting'
		});
	}
}

LessonAccessLogs.initModel();

export default LessonAccessLogs;

