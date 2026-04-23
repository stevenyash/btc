import { BaseModel, sequelize, Sequelize } from './basemodel';
import { Optional, DataTypes } from "sequelize"; 
interface SubtopicsAttributes {
	subtopic_id: number;
	topic_id: number;
	name: string;
}

interface SubtopicsCreationAttributes
	extends Optional<SubtopicsAttributes, 'subtopic_id'> {}

type SubtopicsInstance = SubtopicsAttributes;

class Subtopics extends BaseModel<SubtopicsAttributes, SubtopicsCreationAttributes> {

	static initModel() {
		return super.init(
			{
				subtopic_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				topic_id: { type: DataTypes.INTEGER },
				name: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any }
			},
			{
				sequelize,
				tableName: "subtopics",
				modelName: "subtopics"
			}
		);
	}

	static listFields(): string[] {
		return ['subtopic_id', 'topic_id', 'name'];
	}

	static viewFields(): string[] {
		return ['subtopic_id', 'topic_id', 'name'];
	}

	static editFields(): string[] {
		return ['subtopic_id', 'topic_id', 'name'];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("subtopic_id LIKE :search"),
			sequelize.literal("name LIKE :search")
		];
	}

	static associate(models: any) {
		this.belongsTo(models.Topics, {
			foreignKey: 'topic_id',
			as: 'topic'
		});
	}
}

Subtopics.initModel();

export default Subtopics;

