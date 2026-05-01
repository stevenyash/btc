import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 
type ReferralStatus = 'CLICKED' | 'SIGNED_UP';

interface ReferralLogsAttributes {
	id: number;
	marketer_id: number | null;
	referred_user_email: string | null;
	status: ReferralStatus | null;
	created_at: Date;
}

interface ReferralLogsCreationAttributes
	extends Optional<ReferralLogsAttributes, 'id'> {}


class ReferralLogs extends BaseModel<ReferralLogsAttributes, ReferralLogsCreationAttributes>
	 {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				marketer_id: { type: DataTypes.INTEGER },
				referred_user_email: { type: DataTypes.STRING },
				status: { type: 'ENUM' as const, values: [] },
				created_at: { type: DataTypes.DATE, allowNull: false }
			},
			{
				sequelize,
				tableName: "referral_logs",
				modelName: "referral_logs"
			}
		);
	}

	static listFields(): string[] {
		return ["id", "marketer_id", "referred_user_email", "status", "created_at"];
	}

	static viewFields(): string[] {
		return ["id", "marketer_id", "referred_user_email", "status", "created_at"];
	}

	static editFields(): string[] {
		return ["id", "marketer_id", "referred_user_email", "status"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("referred_user_email LIKE :search")
		];
	}
}

ReferralLogs.initModel();

export default ReferralLogs;
