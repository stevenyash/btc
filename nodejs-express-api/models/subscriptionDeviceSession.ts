import { BaseModel, sequelize } from './basemodel.js';
import { DataTypes } from 'sequelize';

interface SubscriptionDeviceSessionAttributes {
	id: number;
	user_id: number;
	device_id: string;
	lesson_id: number;
	last_heartbeat_at: Date;
	created_at: Date;
	updated_at: Date;
}

class SubscriptionDeviceSession extends BaseModel<SubscriptionDeviceSessionAttributes> {
	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				user_id: { type: DataTypes.INTEGER, allowNull: false },
				device_id: { type: DataTypes.STRING(128), allowNull: false },
				lesson_id: { type: DataTypes.INTEGER, allowNull: false },
				last_heartbeat_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
				created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
				updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
			},
			{
				sequelize,
				tableName: 'subscription_device_sessions',
				modelName: 'subscription_device_sessions',
				timestamps: true,
				createdAt: 'created_at',
				updatedAt: 'updated_at',
				indexes: [
					{ unique: true, fields: ['user_id', 'device_id'] },
					{ fields: ['user_id', 'last_heartbeat_at'] },
				],
			}
		);
	}
}

SubscriptionDeviceSession.initModel();

export default SubscriptionDeviceSession;
