import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 
interface LessonFeeAttributes {
	id: number;
	fee: string;
	duaration: string;
}

interface LessonFeeCreationAttributes
	extends Optional<LessonFeeAttributes, 'id'> {}


class LessonFee extends BaseModel<LessonFeeAttributes, LessonFeeCreationAttributes>
	 {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				fee: { type: DataTypes.STRING },
				duaration: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any }
			},
			{
				sequelize,
				tableName: "lesson_fee",
				modelName: "lesson_fee"
			}
		);
	}

	static listFields(): string[] {
		return ['id', 'fee', 'duaration'];
	}

	static viewFields(): string[] {
		return ['id', 'fee', 'duaration'];
	}

	static editFields(): string[] {
		return ['fee', 'duaration', 'id'];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("fee LIKE :search"),
			sequelize.literal("duaration LIKE :search")
		];
	}
}

LessonFee.initModel();

export default LessonFee;


