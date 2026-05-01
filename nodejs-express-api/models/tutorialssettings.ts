import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 
interface TutorialsSettingsAttributes {
	id: number;
	fee: string | null;
}

interface TutorialsSettingsCreationAttributes
	extends Optional<TutorialsSettingsAttributes, 'id'> {}

type TutorialsSettingsInstance = TutorialsSettingsAttributes;

class TutorialsSettings extends BaseModel<TutorialsSettingsAttributes, TutorialsSettingsCreationAttributes> {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				fee: { type: DataTypes.STRING }
			},
			{
				sequelize,
				tableName: "tutorials_settings",
				modelName: "tutorials_settings"
			}
		);
	}

	static listFields(): string[] {
		return ["id", "fee"];
	}

	static viewFields(): string[] {
		return ["id", "fee"];
	}

	static editFields(): string[] {
		return ["fee", "id"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("fee LIKE :search")
		];
	}
}

TutorialsSettings.initModel();

export default TutorialsSettings;
