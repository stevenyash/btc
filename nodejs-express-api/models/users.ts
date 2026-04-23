import { BaseModel, sequelize, Sequelize } from './basemodel';
import { Optional, DataTypes } from "sequelize"; 
interface UsersAttributes {
	id: number;
	username: string | null;
	usercode: string | null;
	image: string | null;
	phone: string | null;
	email: string | null;
	account_status: string | null;
	user_role_id: number | null;
	nhif: string | null;
	nssf: string | null;
	national_id: string | null;
	subscription_code: string | null;
	status: number | null;
	referred_by: string | null;
}

interface UsersCreationAttributes
	extends Optional<UsersAttributes, 'id'> {}

type UsersInstance = UsersAttributes;

class Users extends BaseModel<UsersAttributes, UsersCreationAttributes> {

		static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				username: { type: DataTypes.STRING },
				usercode: { type: DataTypes.STRING },
				image: { type: DataTypes.STRING },
				phone: { type: DataTypes.STRING },
				email: { type: DataTypes.STRING },
				account_status: { type: DataTypes.STRING },
				user_role_id: { type: DataTypes.INTEGER },
				nhif: { type: DataTypes.STRING },
				nssf: { type: DataTypes.STRING },
				national_id: { type: DataTypes.STRING },
				subscription_code: { type: DataTypes.STRING },
				status: { type: DataTypes.INTEGER },
				referred_by: { type: DataTypes.STRING }
			},
			{
				sequelize,
				tableName: "users",
				modelName: "users"
			}
		);
	}

	static listFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("roles.role_name AS roles_role_name"),
			sequelize.literal("users.username AS username"),
			sequelize.literal("users.image AS image"),
			sequelize.literal("users.phone AS phone"),
			sequelize.literal("users.email AS email"),
			sequelize.literal("users.nhif AS nhif"),
			sequelize.literal("users.nssf AS nssf"),
			sequelize.literal("users.national_id AS national_id"),
			sequelize.literal("users.account_status AS account_status"),
			sequelize.literal("users.id AS id"),
			sequelize.literal("roles.role_id AS roles_role_id")
		];
	}

	static viewFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("users.id AS id"),
			sequelize.literal("users.username AS username"),
			sequelize.literal("users.phone AS phone"),
			sequelize.literal("users.email AS email"),
			sequelize.literal("users.account_status AS account_status"),
			sequelize.literal("users.user_role_id AS user_role_id"),
			sequelize.literal("users.nhif AS nhif"),
			sequelize.literal("users.nssf AS nssf"),
			sequelize.literal("users.national_id AS national_id"),
			sequelize.literal("users.subscription_code AS subscription_code"),
			sequelize.literal("users.status AS status"),
			sequelize.literal("users.referred_by AS referred_by"),
			sequelize.literal("roles.role_id AS roles_role_id"),
			sequelize.literal("roles.role_name AS roles_role_name")
		];
	}

	static accounteditFields(): string[] {
		return ["image", "phone", "username", "status", "subscription_code", "user_role_id", "nhif", "nssf", "national_id", "usercode", "email", "referred_by", "id"];
	}

	static accountviewFields(): string[] {
		return ["id", "username", "phone", "email", "account_status", "subscription_code", "status", "referred_by", "usercode"];
	}

	static editFields(): string[] {
		return ["image", "username", "phone", "user_role_id", "nhif", "nssf", "national_id", "account_status", "usercode", "id"];
	}

	static referralsFields(): string[] {
		return ["username", "email", "referred_by", "id"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("roles.role_name LIKE :search"),
			sequelize.literal("users.username LIKE :search"),
			sequelize.literal("users.phone LIKE :search"),
			sequelize.literal("users.email LIKE :search"),
			sequelize.literal("users.nhif LIKE :search"),
			sequelize.literal("users.nssf LIKE :search"),
			sequelize.literal("users.national_id LIKE :search"),
			sequelize.literal("users.account_status LIKE :search"),
			sequelize.literal("users.id LIKE :search"),
			sequelize.literal("roles.role_id LIKE :search"),
			sequelize.literal("users.subscription_code LIKE :search"),
			sequelize.literal("users.referred_by LIKE :search")
		];
	}
}

Users.initModel();

export default Users;
