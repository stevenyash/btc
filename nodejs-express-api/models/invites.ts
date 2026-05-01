import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 
interface InvitesAttributes {
	id: number;
	user_id: string;
	invitee_email: string;
	invitee_phone: string;
	status: string;
	referral_code: string;
	invitee_join_date: Date | null;
}

interface InvitesCreationAttributes
	extends Optional<InvitesAttributes, 'id' | 'invitee_join_date'> {}


class Invites extends BaseModel<InvitesAttributes, InvitesCreationAttributes> {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				user_id: { type: DataTypes.STRING },
				invitee_email: { type: DataTypes.STRING },
				invitee_phone: { type: DataTypes.STRING },
				status: { type: DataTypes.STRING },
				referral_code: { type: DataTypes.STRING },
				invitee_join_date: { type: DataTypes.DATE, allowNull: true }
			},
			{
				sequelize,
				tableName: "invites",
				modelName: "invites"
			}
		);
	}

	static listFields(): string[] {
		return ["id", "user_id", "invitee_email", "invitee_phone", "status", "referral_code", "invitee_join_date"];
	}

	static viewFields(): string[] {
		return ["id", "user_id", "invitee_email", "invitee_phone", "status", "referral_code", "invitee_join_date"];
	}

	static editFields(): string[] {
		return ["invitee_email", "invitee_phone", "referral_code", "invitee_join_date", "id"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("user_id LIKE :search"),
			sequelize.literal("invitee_email LIKE :search"),
			sequelize.literal("invitee_phone LIKE :search"),
			sequelize.literal("status LIKE :search"),
			sequelize.literal("referral_code LIKE :search")
		];
	}
}

Invites.initModel();

export default Invites;


