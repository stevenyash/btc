import { BaseModel, sequelize, Sequelize } from './basemodel';
import { Optional, DataTypes } from "sequelize"; 
interface ContactUsAttributes {
	id: number;
	type: string;
	detail: string;
}

interface ContactUsCreationAttributes
	extends Optional<ContactUsAttributes, 'id'> {}


class ContactUs extends BaseModel<ContactUsAttributes, ContactUsCreationAttributes> {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				type: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				detail: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') }
			},
			{
				sequelize,
				tableName: "contact_us",
				modelName: "contact_us"
			}
		);
	}

	static listFields(): string[] {
		return ["id", "type", "detail"];
	}

	static viewFields(): string[] {
		return ["id", "type", "detail"];
	}

	static editFields(): string[] {
		return ["id", "type", "detail"];
	}

	static contactuseditFields(): string[] {
		return ["id", "type", "detail"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("type LIKE :search"),
			sequelize.literal("detail LIKE :search")
		];
	}
}

ContactUs.initModel();

export default ContactUs;

