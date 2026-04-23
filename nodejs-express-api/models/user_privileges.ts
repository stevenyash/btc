import { BaseModel, sequelize, Sequelize } from './basemodel';
import { Optional, DataTypes } from "sequelize"; 

interface UserPrivilegesAttributes {
	id: number;
	user_id: number;
	privilege: string;
	granted_by: number;
	granted_at: Date;
	is_active: number;
	expires_at: Date | null;
}

interface UserPrivilegesCreationAttributes
	extends Optional<UserPrivilegesAttributes, 'id'> {}

class UserPrivileges extends BaseModel<UserPrivilegesAttributes, UserPrivilegesCreationAttributes> {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				user_id: { type: DataTypes.INTEGER, allowNull: false },
				privilege: { type: DataTypes.STRING(255), allowNull: false },
				granted_by: { type: DataTypes.INTEGER, allowNull: false },
				granted_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
				is_active: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
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
						fields: ['user_id', 'privilege', 'is_active']
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
		return ["is_active", "expires_at"];
	}
}

UserPrivileges.initModel();

export default UserPrivileges;