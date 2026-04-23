import { BaseModel, sequelize, Sequelize } from "./basemodel";
import { Optional, DataTypes } from "sequelize"; 
interface RolePermissionsAttributes {
	id: number;
	list: number;
	edit: number;
	remove: number;
	view: number;
	role_id: number;
	page: string;
	store: number | null;
}

interface RolePermissionsCreationAttributes
	extends Optional<RolePermissionsAttributes, 'id'> {}

class RolePermissions extends BaseModel<RolePermissionsAttributes, RolePermissionsCreationAttributes>
	 {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				list: { type: DataTypes.INTEGER, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				edit: { type: DataTypes.INTEGER, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				remove: { type: DataTypes.INTEGER, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				view: { type: DataTypes.INTEGER, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				role_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				page: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				store: { type: DataTypes.INTEGER }
			},
			{
				sequelize,
				tableName: "role_permissions",
				modelName: "role_permissions",
				indexes: [
					{
						name: 'unique_role_page',
						unique: true,
						fields: ['role_id', 'page']
					}
				]
			}
		);
	}

	static listFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal('role_permissions.id AS id'),
			sequelize.literal("roles.role_name AS roles_role_name"),
			sequelize.literal('role_permissions.page AS page'),
			sequelize.literal('role_permissions.list AS list'),
			sequelize.literal('role_permissions.store AS store'),
			sequelize.literal('role_permissions.edit AS edit'),
			sequelize.literal('role_permissions.remove AS remove'),
			sequelize.literal('role_permissions.view AS view'),
			sequelize.literal('role_permissions.role_id AS role_id'),
			sequelize.literal("roles.role_id AS roles_role_id")
		];
	}

	static viewFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal('role_permissions.id AS id'),
			sequelize.literal('role_permissions.list AS list'),
			sequelize.literal('role_permissions.edit AS edit'),
			sequelize.literal('role_permissions.remove AS remove'),
			sequelize.literal('role_permissions.view AS view'),
			sequelize.literal('role_permissions.role_id AS role_id'),
			sequelize.literal('role_permissions.page AS page'),
			sequelize.literal("roles.role_id AS roles_role_id"),
			sequelize.literal("roles.role_name AS roles_role_name"),
			sequelize.literal('role_permissions.store AS store')
		];
	}

	static editFields(): string[] {
		return ["list", "edit", "remove", "view", "page", "role_id", "store", "id"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("role_permissions.id LIKE :search"),
			sequelize.literal("roles.role_name LIKE :search"),
			sequelize.literal("role_permissions.page LIKE :search"),
			sequelize.literal("roles.role_id LIKE :search")
		];
	}
}

RolePermissions.initModel();

export default RolePermissions;