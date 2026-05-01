import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 
interface UserGuideSettingAttributes {
	id: number;
	guide: string | null;
}

interface UserGuideSettingCreationAttributes
	extends Optional<UserGuideSettingAttributes, 'id'> {}

type UserGuideSettingInstance = UserGuideSettingAttributes;

class UserGuideSetting extends BaseModel<UserGuideSettingAttributes, UserGuideSettingCreationAttributes> {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				guide: { type: DataTypes.STRING }
			},
			{
				sequelize,
				tableName: "user_guide_setting",
				modelName: "user_guide_setting"
			}
		);
	}

	static listFields(): string[] {
		return ["id", "guide"];
	}

	static viewFields(): string[] {
		return ["id", "guide"];
	}

	static editFields(): string[] {
		return ["guide", "id"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("guide LIKE :search")
		];
	}
}

UserGuideSetting.initModel();

export default UserGuideSetting;
