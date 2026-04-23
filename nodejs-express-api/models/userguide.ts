import { BaseModel, sequelize, Sequelize } from './basemodel';
import { Optional, DataTypes } from "sequelize"; 
interface UserGuideAttributes {
	id: number;
	title: string;
	icon: string | null;
	content: string;
	created_at: Date | null;
}

interface UserGuideCreationAttributes
	extends Optional<UserGuideAttributes, 'id'> {}

type UserGuideInstance = UserGuideAttributes;

class UserGuide extends BaseModel<UserGuideAttributes, UserGuideCreationAttributes> {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				title: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				icon: { type: DataTypes.STRING },
				content: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				created_at: { type: DataTypes.DATE }
			},
			{
				sequelize,
				tableName: "user_guide",
				modelName: "user_guide"
			}
		);
	}

	static listFields(): string[] {
		return ["id", "title", "icon", "content", "created_at"];
	}

	static viewFields(): string[] {
		return ["id", "title", "icon", "content", "created_at"];
	}

	static editFields(): string[] {
		return ["title", "icon", "content", "id"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("title LIKE :search"),
			sequelize.literal("icon LIKE :search"),
			sequelize.literal("content LIKE :search")
		];
	}
}

UserGuide.initModel();

export default UserGuide;
