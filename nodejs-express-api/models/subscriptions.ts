import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 
interface SubscriptionsAttributes {
	id: number;
	user_id: string | null;
	subscription_code: string | null;
	status: string | null;
	start_date: Date | null;
	transaction_id: number;
	phone_no: string;
	subscription_type_id: number | null;
	expiry_date: Date | null;
}

interface SubscriptionsCreationAttributes
	extends Optional<SubscriptionsAttributes, 'id'> {}

type SubscriptionsInstance = SubscriptionsAttributes;

class Subscriptions extends BaseModel<SubscriptionsAttributes, SubscriptionsCreationAttributes> {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				user_id: { type: DataTypes.STRING },
				subscription_code: { type: DataTypes.STRING },
				status: { type: DataTypes.STRING },
				start_date: { type: DataTypes.DATE, defaultValue: sequelize.literal('DEFAULT') as any },
				transaction_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				phone_no: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				subscription_type_id: { type: DataTypes.INTEGER },
				expiry_date: { type: DataTypes.DATE, defaultValue: sequelize.literal('DEFAULT') }
			},
			{
				sequelize,
				tableName: "subscriptions",
				modelName: "subscriptions"
			}
		);
	}

	static listFields(): string[] {
		return ["id", "user_id", "subscription_code", "status", "start_date", "transaction_id", "phone_no", "subscription_type_id", "expiry_date"];
	}

	static viewFields(): string[] {
		return ["id", "user_id", "subscription_code", "status", "start_date", "transaction_id", "phone_no", "subscription_type_id", "expiry_date"];
	}

	static editFields(): string[] {
		return ["user_id", "subscription_code", "status", "start_date", "transaction_id", "phone_no", "id", "subscription_type_id", "expiry_date"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("user_id LIKE :search"),
			sequelize.literal("subscription_code LIKE :search"),
			sequelize.literal("status LIKE :search"),
			sequelize.literal("start_date LIKE :search"),
			sequelize.literal("phone_no LIKE :search")
		];
	}
}

Subscriptions.initModel();

export default Subscriptions;
