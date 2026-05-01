import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 
interface TutorialRegisterAttributes {
	id: number;
	user_id: number | null;
	transaction_date: string | null;
	transaction_status: string;
	payment_reference: string;
	amount_paid: number;
	expiry_date: string;
	tutorial_id: number | null;
	phone: string | null;
	email: string | null;
}

interface TutorialRegisterCreationAttributes
	extends Optional<TutorialRegisterAttributes, 'id'> {}

type TutorialRegisterInstance = TutorialRegisterAttributes;

class TutorialRegister extends BaseModel<TutorialRegisterAttributes, TutorialRegisterCreationAttributes> {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				user_id: { type: DataTypes.INTEGER, defaultValue: sequelize.literal('DEFAULT') as any },
				transaction_date: { type: DataTypes.STRING },
				transaction_status: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				payment_reference: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				amount_paid: { type: DataTypes.INTEGER, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				expiry_date: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				tutorial_id: { type: DataTypes.INTEGER },
				phone: { type: DataTypes.STRING },
				email: { type: DataTypes.STRING }
			},
			{
				sequelize,
				tableName: "tutorial_register",
				modelName: "tutorial_register"
			}
		);
	}

	static listFields(): string[] {
		return ["id", "user_id", "transaction_date", "transaction_status", "payment_reference", "amount_paid", "expiry_date", "tutorial_id", "phone", "email"];
	}

	static viewFields(): string[] {
		return ["id", "user_id", "transaction_date", "transaction_status", "payment_reference", "amount_paid", "expiry_date", "tutorial_id", "phone", "email"];
	}

	static editFields(): string[] {
		return ["id", "user_id", "transaction_status", "payment_reference", "amount_paid", "expiry_date", "tutorial_id", "phone", "email"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("transaction_date LIKE :search"),
			sequelize.literal("transaction_status LIKE :search"),
			sequelize.literal("payment_reference LIKE :search"),
			sequelize.literal("expiry_date LIKE :search"),
			sequelize.literal("phone LIKE :search"),
			sequelize.literal("email LIKE :search")
		];
	}
}

TutorialRegister.initModel();

export default TutorialRegister;
