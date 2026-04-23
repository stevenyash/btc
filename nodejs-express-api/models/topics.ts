import { BaseModel, sequelize, Sequelize } from './basemodel';
import { Optional, DataTypes } from "sequelize"; 
interface TopicsAttributes {
	topic_id: number;
	area_id: number;
	name: string;
}

interface TopicsCreationAttributes
	extends Optional<TopicsAttributes, 'topic_id'> {}

type TopicsInstance = TopicsAttributes;

class Topics extends BaseModel<TopicsAttributes, TopicsCreationAttributes> {

	static initModel() {
		return super.init(
			{
				topic_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				area_id: { type: DataTypes.INTEGER },
				name: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any }
			},
			{
				sequelize,
				tableName: "topics",
				modelName: "topics"
			}
		);
	}

	static listFields(): string[] {
		return ['topic_id', 'area_id', 'name'];
	}

	static viewFields(): string[] {
		return ['topic_id', 'area_id', 'name'];
	}

	static editFields(): string[] {
		return ['topic_id', 'area_id', 'name'];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("topic_id LIKE :search"),
			sequelize.literal("name LIKE :search")
		];
	}

	static associate(models: any) {
		this.hasMany(models.Subtopics, {
			foreignKey: 'topic_id',
			as: 'subtopics'
		});
	}
}

Topics.initModel();

export default Topics;

