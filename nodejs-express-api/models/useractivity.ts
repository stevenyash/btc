import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 
type ActivityStatus = 'active' | 'inactive';
type ActivityType = 'login' | 'logout';

interface UserActivityAttributes {
	activity_id: number;
	user_id: number | null;
	fingerprint: string | null;
	session_duration: number;
	status: ActivityStatus | null;
	activity_type: ActivityType | null;
	activity_time: Date | null;
	platiform: string | null;
	device: string | null;
	ip_address: string | null;
	phone: string;
}

interface UserActivityCreationAttributes
	extends Optional<UserActivityAttributes, 'activity_id'> {}

type UserActivityInstance = UserActivityAttributes;

class UserActivity extends BaseModel<UserActivityAttributes, UserActivityCreationAttributes> {

	static initModel() {
		return super.init(
			{
				activity_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				user_id: { type: DataTypes.INTEGER },
				fingerprint: { type: DataTypes.STRING },
				session_duration: { type: DataTypes.INTEGER, defaultValue: sequelize.literal('DEFAULT') as any },
				status: { type: 'ENUM' as const, values: [] },
				activity_type: { type: 'ENUM' as const, values: [] },
				activity_time: { type: DataTypes.DATE },
				platiform: { type: DataTypes.STRING },
				device: { type: DataTypes.STRING },
				ip_address: { type: DataTypes.STRING },
				phone: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') }
			},
			{
				sequelize,
				tableName: "user_activity",
				modelName: "user_activity"
			}
		);
	}

	static listFields(): string[] {
		return ["activity_id", "user_id", "fingerprint", "session_duration", "status", "activity_type", "activity_time", "platiform", "device", "ip_address", "phone"];
	}

	static viewFields(): string[] {
		return ["activity_id", "user_id", "fingerprint", "session_duration", "status", "activity_type", "activity_time", "platiform", "device", "ip_address", "phone"];
	}

	static editFields(): string[] {
		return ["activity_id", "user_id", "fingerprint", "session_duration", "status", "activity_type", "platiform", "device", "ip_address", "phone"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("activity_id LIKE :search"),
			sequelize.literal("fingerprint LIKE :search"),
			sequelize.literal("platiform LIKE :search"),
			sequelize.literal("device LIKE :search"),
			sequelize.literal("ip_address LIKE :search"),
			sequelize.literal("phone LIKE :search")
		];
	}
}

UserActivity.initModel();

export default UserActivity;
