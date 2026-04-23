import { BaseModel, sequelize, Sequelize } from './basemodel';
import { Optional, DataTypes } from "sequelize";
interface AssignRightsAttributes {
	id: number;
	description: string | null;
	permission: string;
}

interface AssignRightsCreationAttributes
	extends Optional<AssignRightsAttributes, 'id'> {}


class AssignRights extends BaseModel<AssignRightsAttributes, AssignRightsCreationAttributes> {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				description: { type: DataTypes.STRING },
				permission: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any }
			},
			{
				sequelize,
				tableName: "assign_rights",
				modelName: "assign_rights",
				indexes: [
					{
						name: 'unique_assign_rights_permission',
						unique: true,
						fields: ['permission']
					}
				]
			}
		);
	}

	static listFields(): string[] {
		return ["id", "description", "permission"];
	}

	static viewFields(): string[] {
		return ["id", "description", "permission"];
	}

	static editFields(): string[] {
		return ["id", "description", "permission"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("description LIKE :search"),
			sequelize.literal("permission LIKE :search")
		];
	}
}

AssignRights.initModel();

export default AssignRights;
