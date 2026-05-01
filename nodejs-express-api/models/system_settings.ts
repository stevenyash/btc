import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 
interface SystemSettingsAttributes {
	id: number;
	setting_key: string;
	setting_value: string;
	description: string | null;
	updated_at: Date;
}

interface SystemSettingsCreationAttributes
	extends Optional<SystemSettingsAttributes, 'id'> {}

class SystemSettings extends BaseModel<SystemSettingsAttributes, SystemSettingsCreationAttributes> {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				setting_key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
				setting_value: { type: DataTypes.STRING(500), allowNull: false },
				description: { type: DataTypes.TEXT, allowNull: true },
				updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
			},
			{
				sequelize,
				tableName: "system_settings",
				modelName: "system_settings",
				timestamps: false
			}
		);
	}

	static listFields(): string[] {
		return ["id", "setting_key", "setting_value", "description", "updated_at"];
	}

	static viewFields(): string[] {
		return ["id", "setting_key", "setting_value", "description", "updated_at"];
	}

	static editFields(): string[] {
		return ["id", "setting_key", "setting_value", "description"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("setting_key LIKE :search"),
			sequelize.literal("setting_value LIKE :search"),
			sequelize.literal("description LIKE :search")
		];
	}

	static async getSetting(key: string, defaultValue: string | null = null): Promise<string | null> {
		const record = await this.findOne({ where: { setting_key: key } }) as SystemSettings | null;
		return record ? (record as any).setting_value : defaultValue;
	}
}

SystemSettings.initModel();

export default SystemSettings;
