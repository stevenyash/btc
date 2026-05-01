import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 
interface SubscriptionTypeAttributes {
	id: number;
	type: string | null;
}

interface SubscriptionTypeCreationAttributes
	extends Optional<SubscriptionTypeAttributes, 'id'> {}

type SubscriptionTypeInstance = SubscriptionTypeAttributes;

class SubscriptionType extends BaseModel<SubscriptionTypeAttributes, SubscriptionTypeCreationAttributes> {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				type: { type: DataTypes.STRING }
			},
			{
				sequelize,
				tableName: "subscription_type",
				modelName: "subscription_type"
			}
		);
	}

	static listFields(): string[] {
		return ["id", "type"];
	}

	static viewFields(): string[] {
		return ["id", "type"];
	}

	static editFields(): string[] {
		return ["id", "type"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("type LIKE :search")
		];
	}
}

SubscriptionType.initModel();

export default SubscriptionType;
