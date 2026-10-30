import { BaseModel, sequelize } from './basemodel.js';
import { Optional, DataTypes } from 'sequelize';

interface B2HWebhookEventAttributes {
	id: number;
	event_type: string;
	platform_id: string;
	event_timestamp: Date;
	payload: Record<string, unknown>;
	raw_payload: string;
	received_at: Date;
}

interface B2HWebhookEventCreationAttributes
	extends Optional<B2HWebhookEventAttributes, 'id' | 'received_at'> {}

class B2HWebhookEvents extends BaseModel<B2HWebhookEventAttributes, B2HWebhookEventCreationAttributes> {
	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				event_type: { type: DataTypes.STRING(100), allowNull: false },
				platform_id: { type: DataTypes.STRING(255), allowNull: false },
				event_timestamp: { type: DataTypes.DATE, allowNull: false },
				payload: { type: DataTypes.JSON, allowNull: false },
				raw_payload: { type: DataTypes.TEXT, allowNull: false },
				received_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
			},
			{
				sequelize,
				tableName: 'b2h_webhook_events',
				modelName: 'b2h_webhook_events',
				timestamps: false,
			},
		);
	}
}

B2HWebhookEvents.initModel();

export default B2HWebhookEvents;
