import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 
interface PackagesAttributes {
	id: number;
	name: string;
	description: string | null;
	created_at: Date;
	subscription_type_id: number;
	concurrent_access: number;
	no_of_lessons: number;
	watch_time_minutes: number;
	duration_amount: number;
	duration_unit: string;
	fee: number;
}

interface PackagesCreationAttributes
	extends Optional<PackagesAttributes, 'id' | 'description' | 'created_at'> {}

class Packages extends BaseModel<PackagesAttributes, PackagesCreationAttributes>
{

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				name: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				description: { type: DataTypes.STRING },
				created_at: { type: DataTypes.DATE, defaultValue: sequelize.literal('DEFAULT') as any },
				subscription_type_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				concurrent_access: { type: DataTypes.INTEGER, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				no_of_lessons: { type: DataTypes.INTEGER, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				watch_time_minutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
				duration_amount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				duration_unit: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				fee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: sequelize.literal('DEFAULT') }
			},
			{
				sequelize,
				tableName: "packages",
				modelName: "packages"
			}
		);
	}

	static listFields(): string[] {
		return ['id', 'subscription_type_id', 'name', 'description', 'concurrent_access', 'no_of_lessons', 'watch_time_minutes', 'duration_amount', 'duration_unit', 'created_at', 'fee'];
	}

	static viewFields(): string[] {
		return ['id', 'subscription_type_id', 'name', 'description', 'concurrent_access', 'created_at', 'no_of_lessons', 'watch_time_minutes', 'duration_amount', 'duration_unit', 'fee'];
	}

	static editFields(): string[] {
		return ['subscription_type_id', 'name', 'description', 'fee', 'concurrent_access', 'no_of_lessons', 'watch_time_minutes', 'duration_amount', 'duration_unit', 'id'];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("name LIKE :search"),
			sequelize.literal("description LIKE :search"),
			sequelize.literal("duration_unit LIKE :search")
		];
	}

	static associate(models: any) {
		this.belongsTo(models.SubscriptionTypes, {
			foreignKey: 'subscription_type_id',
			as: 'subscription_type'
		});

		this.hasMany(models.Subscriptions, {
			foreignKey: 'package_id',
			as: 'subscriptions'
		});
	}
}

Packages.initModel();

export default Packages;
