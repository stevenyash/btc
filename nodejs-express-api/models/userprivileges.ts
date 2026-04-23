import { BaseModel, sequelize, Sequelize } from './basemodel';
import { Optional, DataTypes } from "sequelize"; 
interface UserPrivilegesAttributes {
	id: number;
	user_id: number;
	privilege: string;
	granted_by: number;
	granted_at: Date;
	is_active: boolean;
	expires_at: Date | null;
}

interface UserPrivilegesCreationAttributes
	extends Optional<UserPrivilegesAttributes, 'id'> {}

type UserPrivilegesInstance = UserPrivilegesAttributes;

class UserPrivileges extends BaseModel<UserPrivilegesAttributes, UserPrivilegesCreationAttributes> {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				user_id: { type: DataTypes.INTEGER, allowNull: false },
				privilege: { type: DataTypes.STRING, allowNull: false },
				granted_by: { type: DataTypes.INTEGER, allowNull: false },
				granted_at: { type: DataTypes.DATE, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
				is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
				expires_at: { type: DataTypes.DATE, allowNull: true }
			},
			{
				sequelize,
				tableName: "user_privileges",
				modelName: "user_privileges",
				indexes: [
					{
						name: 'unique_user_privilege',
						unique: true,
						fields: ['user_id', 'privilege']
					}
				]
			}
		);
	}

	static listFields(): string[] {
		return ["id", "user_id", "privilege", "granted_by", "granted_at", "is_active", "expires_at"];
	}

	static viewFields(): string[] {
		return ["id", "user_id", "privilege", "granted_by", "granted_at", "is_active", "expires_at"];
	}

	static editFields(): string[] {
		return ["user_id", "privilege", "is_active", "expires_at", "id"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("user_privileges.id LIKE :search"),
			sequelize.literal("user_privileges.privilege LIKE :search")
		];
	}
}

UserPrivileges.initModel();

export default UserPrivileges;
