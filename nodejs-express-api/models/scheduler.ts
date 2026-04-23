import { BaseModel, sequelize, Sequelize } from './basemodel';
import { Optional, DataTypes } from "sequelize"; 
interface SchedulerAttributes {
	id: number;
	user_id: string | null;
	grade: string | null;
	learning_area: string | null;
	strand: string | null;
	start_date: string | null;
	end_date: string | null;
	status: string | null;
	link: string | null;
	meetingid: string | null;
}

interface SchedulerCreationAttributes
	extends Optional<SchedulerAttributes, 'id'> {}

type SchedulerInstance = SchedulerAttributes;

class Scheduler extends BaseModel<SchedulerAttributes, SchedulerCreationAttributes> {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				user_id: { type: DataTypes.STRING },
				grade: { type: DataTypes.STRING },
				learning_area: { type: DataTypes.STRING },
				strand: { type: DataTypes.STRING },
				start_date: { type: DataTypes.STRING },
				end_date: { type: DataTypes.STRING },
				status: { type: DataTypes.STRING },
				link: { type: DataTypes.STRING },
				meetingid: { type: DataTypes.STRING }
			},
			{
				sequelize,
				tableName: "scheduler",
				modelName: "scheduler"
			}
		);
	}

	static listFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal('scheduler.id AS id'),
			sequelize.literal("users.username AS users_username"),
			sequelize.literal("users.phone AS users_phone"),
			sequelize.literal("users.email AS users_email"),
			sequelize.literal('scheduler.grade AS grade'),
			sequelize.literal('scheduler.learning_area AS learning_area'),
			sequelize.literal('scheduler.strand AS strand'),
			sequelize.literal('scheduler.start_date AS start_date'),
			sequelize.literal('scheduler.end_date AS end_date'),
			sequelize.literal('scheduler.status AS status'),
			sequelize.literal('scheduler.link AS link'),
			sequelize.literal("users.id AS users_id")
		];
	}

	static viewFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal('scheduler.id AS id'),
			sequelize.literal('scheduler.user_id AS user_id'),
			sequelize.literal('scheduler.grade AS grade'),
			sequelize.literal('scheduler.learning_area AS learning_area'),
			sequelize.literal('scheduler.strand AS strand'),
			sequelize.literal('scheduler.start_date AS start_date'),
			sequelize.literal('scheduler.end_date AS end_date'),
			sequelize.literal('scheduler.status AS status'),
			sequelize.literal('scheduler.link AS link'),
			sequelize.literal('scheduler.meetingId AS meetingid'),
			sequelize.literal("users.id AS users_id"),
			sequelize.literal("users.username AS users_username"),
			sequelize.literal("users.image AS users_image"),
			sequelize.literal("users.phone AS users_phone"),
			sequelize.literal("users.email AS users_email"),
			sequelize.literal("users.account_status AS users_account_status"),
			sequelize.literal("users.user_role_id AS users_user_role_id"),
			sequelize.literal("users.nhif AS users_nhif"),
			sequelize.literal("users.nssf AS users_nssf"),
			sequelize.literal("users.national_id AS users_national_id"),
			sequelize.literal("users.subscription_code AS users_subscription_code"),
			sequelize.literal("users.status AS users_status"),
			sequelize.literal("users.referred_by AS users_referred_by")
		];
	}

	static editFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return ["user_id", "grade", "learning_area", "strand", "start_date", "end_date", "status", "link", sequelize.literal('meetingId AS meetingid'), "id"];
	}

	static teachersschedulerFields(): string[] {
		return ["id", "grade", "learning_area", "strand", "start_date", "end_date", "status", "link"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("scheduler.id LIKE :search"),
			sequelize.literal("users.username LIKE :search"),
			sequelize.literal("users.phone LIKE :search"),
			sequelize.literal("users.email LIKE :search"),
			sequelize.literal("scheduler.grade LIKE :search"),
			sequelize.literal("scheduler.learning_area LIKE :search"),
			sequelize.literal("scheduler.strand LIKE :search"),
			sequelize.literal("scheduler.start_date LIKE :search"),
			sequelize.literal("scheduler.end_date LIKE :search"),
			sequelize.literal("scheduler.status LIKE :search"),
			sequelize.literal("scheduler.link LIKE :search"),
			sequelize.literal("scheduler.meetingId LIKE :search"),
			sequelize.literal("users.id LIKE :search"),
			sequelize.literal("users.account_status LIKE :search"),
			sequelize.literal("users.nhif LIKE :search"),
			sequelize.literal("users.nssf LIKE :search"),
			sequelize.literal("users.national_id LIKE :search"),
			sequelize.literal("users.subscription_code LIKE :search"),
			sequelize.literal("users.referred_by LIKE :search"),
			sequelize.literal("scheduler.user_id LIKE :search"),
			sequelize.literal("users.usercode LIKE :search")
		];
	}
}

Scheduler.initModel();

export default Scheduler;
