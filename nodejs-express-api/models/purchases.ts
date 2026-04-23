import { BaseModel, sequelize, Sequelize } from './basemodel';
import { Optional, DataTypes } from "sequelize"; 
type TransactionStatus = 'pending' | 'success' | 'failed';

interface PurchasesAttributes {
	id: number;
	user_id: number;
	package_id: number | null;
	lesson_id: number | null;
	phone_number: string | null;
	checkout_request_id: string | null;
	transaction_date: Date | null;
	transaction_status: TransactionStatus | null;
	payment_reference: string | null;
	amount_paid: number | null;
	expiry_date: Date | null;
}

interface PurchasesCreationAttributes
	extends Optional<PurchasesAttributes, 'id'> {}

class Purchases extends BaseModel<PurchasesAttributes, PurchasesCreationAttributes>
	 {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				user_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				package_id: { type: DataTypes.INTEGER, allowNull: true },
				lesson_id: { type: DataTypes.INTEGER, allowNull: true },
				phone_number: { type: DataTypes.STRING(15), allowNull: true },
				checkout_request_id: { type: DataTypes.STRING(50), allowNull: true },
				transaction_date: { type: DataTypes.DATE, defaultValue: sequelize.literal('DEFAULT') as any },
				transaction_status: { type: 'ENUM' as const, values: [] },
				payment_reference: { type: DataTypes.STRING },
				amount_paid: { type: DataTypes.NUMBER },
				expiry_date: { type: DataTypes.DATE, defaultValue: sequelize.literal('DEFAULT') }
			},
			{
				sequelize,
				tableName: "purchases",
				modelName: "purchases",
				indexes: [
					{ fields: ['phone_number', 'lesson_id'] }
				]
			}
		);
	}

	static listFields(): string[] {
		return ["id", "user_id", "package_id", "lesson_id", "phone_number", "checkout_request_id", "transaction_date", "transaction_status", "payment_reference", "amount_paid", "expiry_date"];
	}

	static viewFields(): string[] {
		return ["id", "user_id", "package_id", "lesson_id", "phone_number", "checkout_request_id", "transaction_date", "transaction_status", "payment_reference", "amount_paid", "expiry_date"];
	}

	static editFields(): string[] {
		return ["user_id", "package_id", "lesson_id", "phone_number", "checkout_request_id", "transaction_status", "payment_reference", "amount_paid", "expiry_date", "id"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("payment_reference LIKE :search")
		];
	}
}

Purchases.initModel();

export default Purchases;
