import { BaseModel, sequelize, Sequelize } from './basemodel';
import { Optional, DataTypes } from "sequelize"; 
interface MarketersAttributes {
	id: number;
	name: string;
	email: string;
	phone: string;
	referral_code: string;
	points: number;
	join_date: Date | null;
	commission_rate: number;
	total_earnings: number;
	pending_earnings: number;
	withdrawn_earnings: number;
	redeemed_points: number;
}

interface MarketersCreationAttributes
	extends Optional<MarketersAttributes, 'id' | 'join_date'> {}


class Marketers extends BaseModel<MarketersAttributes, MarketersCreationAttributes>
	 {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				name: { type: DataTypes.STRING },
				email: { type: DataTypes.STRING },
				phone: { type: DataTypes.STRING },
				referral_code: { type: DataTypes.STRING },
				points: { type: DataTypes.INTEGER },
				join_date: { type: DataTypes.DATE, allowNull: true },
				commission_rate: { type: DataTypes.DECIMAL(5, 4), defaultValue: 0.10 },
				total_earnings: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
				pending_earnings: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
				withdrawn_earnings: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
				redeemed_points: { type: DataTypes.INTEGER, defaultValue: 0 }
			},
			{
				sequelize,
				tableName: "marketers",
				modelName: "marketers"
			}
		);
	}

	static listFields(): string[] {
		return [
			"id", "name", "email", "phone", "referral_code", "points",
			"join_date", "commission_rate", "total_earnings", "pending_earnings",
			"withdrawn_earnings", "redeemed_points"
		];
	}

	static viewFields(): string[] {
		return [
			"id", "name", "email", "phone", "referral_code", "points",
			"join_date", "commission_rate", "total_earnings", "pending_earnings",
			"withdrawn_earnings", "redeemed_points"
		];
	}

	static editFields(): string[] {
		return [
			"name", "email", "phone", "referral_code", "points",
			"join_date", "commission_rate", "total_earnings", "pending_earnings",
			"withdrawn_earnings", "redeemed_points", "id"
		];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("name LIKE :search"),
			sequelize.literal("email LIKE :search"),
			sequelize.literal("phone LIKE :search"),
			sequelize.literal("referral_code LIKE :search")
		];
	}
}

Marketers.initModel();

export default Marketers;

