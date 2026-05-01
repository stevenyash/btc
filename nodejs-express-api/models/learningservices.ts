import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 
interface LearningServicesAttributes {
	id: number;
	name: string;
	label: string;
	description: string;
	created_at: Date;
	updated_at: Date;
}

interface LearningServicesCreationAttributes
	extends Optional<LearningServicesAttributes, 'id'> {}


class LearningServices extends BaseModel<LearningServicesAttributes, LearningServicesCreationAttributes>
 {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				name: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				label: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				description: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				created_at: { type: DataTypes.DATE, allowNull: false },
				updated_at: { type: DataTypes.DATE, allowNull: false }
			},
			{
				sequelize,
				tableName: "learning_services",
				modelName: "learning_services"
			}
		);
	}

	static listFields(): string[] {
		return ["id", "name", "label", "description", "created_at", "updated_at"];
	}

	static viewFields(): string[] {
		return ["id", "name", "label", "description", "created_at", "updated_at"];
	}

	static editFields(): string[] {
		return ["id", "name", "label", "description"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("name LIKE :search"),
			sequelize.literal("label LIKE :search"),
			sequelize.literal("description LIKE :search")
		];
	}
}

LearningServices.initModel();

export default LearningServices;

