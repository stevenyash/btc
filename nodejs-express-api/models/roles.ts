import { BaseModel, sequelize, Sequelize } from './basemodel';
import { Optional, DataTypes } from "sequelize"; 
interface RolesAttributes {
	role_id: number;
	role_name: string;
}

interface RolesCreationAttributes
	extends Optional<RolesAttributes, 'role_id'> {}


class Roles extends BaseModel<RolesAttributes, RolesCreationAttributes>
	 {

	static initModel() {
		return super.init(
			{
				role_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				role_name: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any }
			},
			{
				sequelize,
				tableName: "roles",
				modelName: "roles"
			}
		);
	}

	static listFields(): string[] {
		return ['role_id', 'role_name'];
	}

	static viewFields(): string[] {
		return ['role_id', 'role_name'];
	}

	static editFields(): string[] {
		return ['role_id', 'role_name'];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("role_id LIKE :search"),
			sequelize.literal("role_name LIKE :search")
		];
	}
}

Roles.initModel();

export default Roles;

