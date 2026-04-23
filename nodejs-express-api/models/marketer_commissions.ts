import { BaseModel, sequelize, Sequelize } from './basemodel';
import { Optional, DataTypes } from "sequelize"; 
type PurchaseType = 'subscription' | 'package' | 'tutorial';
type MarketerCommissionStatus = 'pending' | 'approved' | 'paid';

interface MarketerCommissionsAttributes {
	id: number;
	marketer_id: number;
	user_id: number;
	transaction_id: number | null;
	purchase_type: PurchaseType;
	purchase_amount: number;
	commission_rate: number;
	commission_amount: number;
	status: MarketerCommissionStatus;
	created_at: Date;
}

interface MarketerCommissionsCreationAttributes
	extends Optional<MarketerCommissionsAttributes, 'id' | 'transaction_id'> {}


class MarketerCommissions extends BaseModel<MarketerCommissionsAttributes, MarketerCommissionsCreationAttributes>
 {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				marketer_id: { type: DataTypes.INTEGER, allowNull: false },
				user_id: { type: DataTypes.INTEGER, allowNull: false },
				transaction_id: { type: DataTypes.INTEGER },
				purchase_type: { type: 'ENUM' as const, values: [], allowNull: false },
				purchase_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
				commission_rate: { type: DataTypes.DECIMAL(5, 4), allowNull: false },
				commission_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
				status: { type: 'ENUM' as const, values: [], defaultValue: 'approved' },
				created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
			},
			{
				sequelize,
				tableName: "marketer_commissions",
				modelName: "marketer_commissions",
				timestamps: false
			}
		);
	}

	static listFields(): string[] {
		return ["id", "marketer_id", "user_id", "transaction_id", "purchase_type", "purchase_amount", "commission_rate", "commission_amount", "status", "created_at"];
	}

	static viewFields(): string[] {
		return ["id", "marketer_id", "user_id", "transaction_id", "purchase_type", "purchase_amount", "commission_rate", "commission_amount", "status", "created_at"];
	}

	static editFields(): string[] {
		return ["id", "marketer_id", "user_id", "transaction_id", "purchase_type", "purchase_amount", "commission_rate", "commission_amount", "status"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("purchase_type LIKE :search"),
			sequelize.literal("status LIKE :search")
		];
	}
}

MarketerCommissions.initModel();

export default MarketerCommissions;
