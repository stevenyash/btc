import { BaseModel, sequelize } from './basemodel.js';
import { Optional, DataTypes, Op } from "sequelize";

type GuestLessonPaymentStatus = 'pending' | 'completed' | 'failed';

interface GuestLessonPaymentsAttributes {
	id: number;
	phone: string;
	lesson_id: number;
	checkout_request_id: string;
	transaction_status: GuestLessonPaymentStatus;
	amount: number | null;
	paid_at: Date | null;
	expires_at: Date;
	created_at: Date;
	updated_at: Date;
}

interface GuestLessonPaymentsCreationAttributes
	extends Optional<GuestLessonPaymentsAttributes, 'id' | 'amount' | 'paid_at' | 'created_at' | 'updated_at'> {}


class GuestLessonPayments extends BaseModel<GuestLessonPaymentsAttributes, GuestLessonPaymentsCreationAttributes> {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				phone: { type: DataTypes.STRING(15), allowNull: false },
				lesson_id: { type: DataTypes.INTEGER, allowNull: false },
				checkout_request_id: { type: DataTypes.STRING(50), allowNull: false },
				transaction_status: {
					type: 'ENUM' as const,
					values: ['pending', 'completed', 'failed'],
					defaultValue: 'pending'
				},
				amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
				paid_at: { type: DataTypes.DATE, allowNull: true },
				expires_at: { type: DataTypes.DATE, allowNull: false },
				created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
				updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
			},
			{
				sequelize,
				tableName: "guest_lesson_payments",
				modelName: "guest_lesson_payments",
				timestamps: true,
				createdAt: 'created_at',
				updatedAt: 'updated_at',
				indexes: [
					{ fields: ['phone', 'lesson_id'] },
					{ fields: ['checkout_request_id'] },
					{ fields: ['transaction_status', 'expires_at'] }
				]
			}
		);
	}

	static listFields(): string[] {
		return ["id", "phone", "lesson_id", "checkout_request_id", "transaction_status", "amount", "paid_at", "expires_at", "created_at"];
	}

	static viewFields(): string[] {
		return ["id", "phone", "lesson_id", "checkout_request_id", "transaction_status", "amount", "paid_at", "expires_at", "created_at", "updated_at"];
	}

	static editFields(): string[] {
		return ["phone", "lesson_id", "checkout_request_id", "transaction_status", "amount", "paid_at", "expires_at", "id"];
	}

	static async findByPhoneAndLesson(phone: string, lessonId: number) {
		return this.findOne({
			where: {
				phone,
				lesson_id: lessonId,
				transaction_status: 'completed'
			}
		});
	}

 	static async findActiveByPhoneAndLesson(phone: string, lessonId: number) {
 		const now = new Date();
 		return this.findOne({
 			where: {
 				phone,
 				lesson_id: lessonId,
 				transaction_status: 'completed',
 				expires_at: { [Op.gt]: now }
 			}
 		});
 	}
}

GuestLessonPayments.initModel();

export default GuestLessonPayments;
