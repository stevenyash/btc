import { BaseModel, sequelize, Sequelize } from './basemodel';
import { Optional, DataTypes } from "sequelize"; 
interface ServicesSettingsAttributes {
	id: number;
	level: string | null;
	title: string | null;
	description: string | null;
}

interface ServicesSettingsCreationAttributes
	extends Optional<ServicesSettingsAttributes, 'id'> {}

type ServicesSettingsInstance = ServicesSettingsAttributes;

class ServicesSettings extends BaseModel<ServicesSettingsAttributes, ServicesSettingsCreationAttributes> {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				level: { type: DataTypes.STRING },
				title: { type: DataTypes.STRING },
				description: { type: DataTypes.STRING }
			},
			{
				sequelize,
				tableName: "services_settings",
				modelName: "services_settings"
			}
		);
	}

	static listFields(): string[] {
		return ["id", "level", "title", "description"];
	}

	static viewFields(): string[] {
		return ["id", "level", "title", "description"];
	}

	static editFields(): string[] {
		return ["level", "title", "description", "id"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("level LIKE :search"),
			sequelize.literal("title LIKE :search"),
			sequelize.literal("description LIKE :search")
		];
	}
}

ServicesSettings.initModel();

export default ServicesSettings;
