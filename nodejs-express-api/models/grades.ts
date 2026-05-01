import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 
interface GradesAttributes {
	id: number;
	name: string;
	description: string;
	level_id: number;
	is_active: boolean;
}

interface GradesCreationAttributes
	extends Optional<GradesAttributes, 'id'> {}


class Grades extends BaseModel<GradesAttributes, GradesCreationAttributes> {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				name: { type: DataTypes.STRING },
				description: { type: DataTypes.STRING },
				level_id: { type: DataTypes.INTEGER },
				is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
			},
			{
				sequelize,
				tableName: "grades",
				modelName: "grades"
			}
		);
	}

	static listFields(): string[] {
		return ['id', 'name', 'description', 'level_id', 'is_active'];
	}

	static viewFields(): string[] {
		return ['id', 'name', 'description', 'level_id', 'is_active'];
	}

	static editFields(): string[] {
		return ['id', 'name', 'description', 'level_id', 'is_active'];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("name LIKE :search"),
			sequelize.literal("description LIKE :search")
		];
	}

	static associate(models: any) {
		this.belongsTo(models.LearningLevels, {
			foreignKey: 'level_id',
			as: 'learning_level'
		});

		this.hasMany(models.LearningAreas, {
			foreignKey: 'grade_id',
			as: 'learning_areas'
		});
	}
}

Grades.initModel();

export default Grades;