import { BaseModel, sequelize, Sequelize } from './basemodel';
import { Optional, DataTypes } from "sequelize"; 
interface LessonSettingAttributes {
	id: number;
	fee: string | null;
	duration: string;
	subscription_type: string;
}

interface LessonSettingCreationAttributes
	extends Optional<LessonSettingAttributes, 'id'> {}


class LessonSetting extends BaseModel<LessonSettingAttributes, LessonSettingCreationAttributes>
	 {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				fee: { type: DataTypes.STRING },
				duration: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				subscription_type: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') }
			},
			{
				sequelize,
				tableName: "lesson_setting",
				modelName: "lesson_setting"
			}
		);
	}

	static listFields(): string[] {
		return ["id", "fee", "duration", "subscription_type"];
	}

	static viewFields(): string[] {
		return ["id", "fee", "duration", "subscription_type"];
	}

	static editFields(): string[] {
		return ["fee", "duration", "subscription_type", "id"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("fee LIKE :search"),
			sequelize.literal("duration LIKE :search"),
			sequelize.literal("subscription_type LIKE :search")
		];
	}
}

LessonSetting.initModel();

export default LessonSetting;
