import { BaseModel, sequelize, Sequelize } from './basemodel';
import { Optional, DataTypes } from "sequelize"; 
type WithdrawalSource = 'commission' | 'points' | 'both';
type MarketerWithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface MarketerWithdrawalsAttributes {
  id: number;
  marketer_id: number;
  amount: number;
  phone_number: string;
  source: WithdrawalSource;
  status: MarketerWithdrawalStatus;
  checkout_request_id: string | null;
  mpesa_receipt: string | null;
  mpesa_conversation_id: string | null;
  mpesa_originator_conversation_id: string | null;
  remarks: string | null;
  created_at: Date;
  processed_at: Date | null;
}

interface MarketerWithdrawalsCreationAttributes
	extends Optional<MarketerWithdrawalsAttributes, 'id' | 'mpesa_receipt' | 'mpesa_conversation_id' | 'mpesa_originator_conversation_id' | 'remarks' | 'processed_at'> {}


class MarketerWithdrawals extends BaseModel<MarketerWithdrawalsAttributes, MarketerWithdrawalsCreationAttributes>
 {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
marketer_id: { type: DataTypes.INTEGER, allowNull: false },
        amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
        phone_number: { type: DataTypes.STRING(20), allowNull: false },
        checkout_request_id: { type: DataTypes.STRING(100), allowNull: true },
        source: { type: 'ENUM' as const, values: [], defaultValue: 'both' },
				status: { type: 'ENUM' as const, values: [], defaultValue: 'pending' },
				mpesa_receipt: { type: DataTypes.STRING(50), allowNull: true },
				mpesa_conversation_id: { type: DataTypes.STRING(100), allowNull: true },
				mpesa_originator_conversation_id: { type: DataTypes.STRING(100), allowNull: true },
				remarks: { type: DataTypes.TEXT, allowNull: true },
				created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
				processed_at: { type: DataTypes.DATE, allowNull: true }
			},
			{
				sequelize,
				tableName: "marketer_withdrawals",
				modelName: "marketer_withdrawals",
				timestamps: false
			}
		);
	}

static listFields(): string[] {
    return ["id", "marketer_id", "amount", "phone_number", "checkout_request_id", "source", "status", "mpesa_receipt", "remarks", "created_at", "processed_at"];
  }

  static viewFields(): string[] {
    return ["id", "marketer_id", "amount", "phone_number", "checkout_request_id", "source", "status", "mpesa_receipt", "mpesa_conversation_id", "mpesa_originator_conversation_id", "remarks", "created_at", "processed_at"];
  }

	static editFields(): string[] {
		return ["id", "marketer_id", "amount", "phone_number", "source", "status", "mpesa_receipt", "remarks"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("phone_number LIKE :search"),
			sequelize.literal("status LIKE :search"),
			sequelize.literal("mpesa_receipt LIKE :search")
		];
	}
}

MarketerWithdrawals.initModel();

export default MarketerWithdrawals;
