import { BaseModel, sequelize, Sequelize } from './basemodel';
import { Optional, DataTypes } from "sequelize"; 
type MarketerPointRedemptionStatus = 'pending' | 'approved' | 'rejected';

interface MarketerPointRedemptionsAttributes {
	id: number;
	marketer_id: number;
	points_redeemed: number;
	point_value: number;
	cash_amount: number;
	status: MarketerPointRedemptionStatus;
	remarks: string | null;
	reviewed_by: number | null;
	reviewed_at: Date | null;
	created_at: Date;
}

interface MarketerPointRedemptionsCreationAttributes
	extends Optional<MarketerPointRedemptionsAttributes, 'id' | 'remarks' | 'reviewed_by' | 'reviewed_at'> {}


class MarketerPointRedemptions extends BaseModel<MarketerPointRedemptionsAttributes, MarketerPointRedemptionsCreationAttributes>
	 {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				marketer_id: { type: DataTypes.INTEGER, allowNull: false },
				points_redeemed: { type: DataTypes.INTEGER, allowNull: false },
				point_value: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
				cash_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
				status: { type: 'ENUM' as const, values: [], defaultValue: 'pending' },
				remarks: { type: DataTypes.TEXT, allowNull: true },
				reviewed_by: { type: DataTypes.INTEGER, allowNull: true },
				reviewed_at: { type: DataTypes.DATE, allowNull: true },
				created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
			},
			{
				sequelize,
				tableName: "marketer_point_redemptions",
				modelName: "marketer_point_redemptions",
				timestamps: false
			}
		);
	}

	static listFields(): string[] {
		return ["id", "marketer_id", "points_redeemed", "point_value", "cash_amount", "status", "remarks", "reviewed_by", "reviewed_at", "created_at"];
	}

	static viewFields(): string[] {
		return ["id", "marketer_id", "points_redeemed", "point_value", "cash_amount", "status", "remarks", "reviewed_by", "reviewed_at", "created_at"];
	}

	static editFields(): string[] {
		return ["id", "marketer_id", "points_redeemed", "point_value", "cash_amount", "status", "remarks", "reviewed_by", "reviewed_at"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("status LIKE :search"),
			sequelize.literal("remarks LIKE :search")
		];
	}
}

MarketerPointRedemptions.initModel();

export default MarketerPointRedemptions;
