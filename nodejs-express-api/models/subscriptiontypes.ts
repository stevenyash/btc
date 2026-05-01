import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 
interface SubscriptionTypesAttributes {
	id: number;
	name: string;
	description: string;
	membership_fee: number;
	created_at: Date;
	months: string;
}

interface SubscriptionTypesCreationAttributes
	extends Optional<SubscriptionTypesAttributes, 'id' | 'created_at'> {}

class SubscriptionTypes extends BaseModel<SubscriptionTypesAttributes, SubscriptionTypesCreationAttributes> {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				name: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				description: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				membership_fee: { type: DataTypes.NUMBER, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				created_at: { type: DataTypes.DATE, allowNull: false },
				months: { type: DataTypes.STRING, allowNull: false }
			},
			{
				sequelize,
				tableName: "subscription_types",
				modelName: "subscription_types"
			}
		);
	}

	static listFields(): string[] {
		return ['id', 'name', 'description', 'membership_fee', 'created_at', 'months'];
	}

	static viewFields(): string[] {
		return ['id', 'name', 'description', 'membership_fee', 'created_at', 'months'];
	}

	static editFields(): string[] {
		return ['name', 'description', 'membership_fee', 'id', 'months'];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("name LIKE :search"),
			sequelize.literal("description LIKE :search"),
			sequelize.literal("months LIKE :search")
		];
	}

	static associate(models: any) {
		this.hasMany(models.Packages, {
			foreignKey: 'subscription_type_id',
			as: 'packages'
		});
	}
}

SubscriptionTypes.initModel();

export default SubscriptionTypes;

