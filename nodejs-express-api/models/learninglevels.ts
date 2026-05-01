import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 
interface LearningLevelsAttributes {
	level_id: number;
	name: string | null;
	description: string | null;
	is_active: boolean;
}

interface LearningLevelsCreationAttributes
	extends Optional<LearningLevelsAttributes, 'level_id'> {}


class LearningLevels extends BaseModel<LearningLevelsAttributes, LearningLevelsCreationAttributes>
	 {

	static initModel() {
		return super.init(
			{
				level_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				name: { type: DataTypes.STRING },
				description: { type: DataTypes.TEXT },
				is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
			},
			{
				sequelize,
				tableName: "learning_levels",
				modelName: "learning_levels"
			}
		);
	}

	static listFields(): string[] {
		return ["level_id", "name", "description", "is_active"];
	}

	static viewFields(): string[] {
		return ["level_id", "name", "description", "is_active"];
	}

	static editFields(): string[] {
		return ["level_id", "name", "description", "is_active"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("name LIKE :search"),
			sequelize.literal("description LIKE :search")
		];
	}
}

LearningLevels.initModel();

export default LearningLevels;

