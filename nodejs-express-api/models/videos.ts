import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 
interface VideosAttributes {
	id: number;
	file: string | null;
	collection: string | null;
	visibility: string | null;
	filename: string | null;
	status: string | null;
	description: string | null;
	category: string | null;
	title: string | null;
	s3_key: string | null;
	s3_url: string | null;
	file_size: number | null;
	uploaded_at: Date | null;
	upload_error: string | null;
}

interface VideosCreationAttributes
	extends Optional<VideosAttributes, 'id'> {}

type VideosInstance = VideosAttributes;

class Videos extends BaseModel<VideosAttributes, VideosCreationAttributes> {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				file: { type: DataTypes.STRING },
				collection: { type: DataTypes.STRING },
				visibility: { type: DataTypes.STRING },
				filename: { type: DataTypes.STRING },
				status: { type: DataTypes.STRING },
				description: { type: DataTypes.STRING },
				category: { type: DataTypes.STRING },
				title: { type: DataTypes.STRING },
				s3_key: { type: DataTypes.STRING(500) },
				s3_url: { type: DataTypes.STRING(500) },
				file_size: { type: DataTypes.BIGINT },
				uploaded_at: { type: DataTypes.DATE },
				upload_error: { type: DataTypes.TEXT }
			},
			{
				sequelize,
				tableName: "Videos",
				modelName: "Videos"
			}
		);
	}

	static listFields(): string[] {
		return ["id", "file", "collection", "visibility", "filename", "status", "description", "category", "title", "s3_key", "s3_url", "file_size", "uploaded_at", "upload_error"];
	}

	static viewFields(): string[] {
		return ["id", "file", "collection", "visibility", "filename", "status", "description", "category", "title", "s3_key", "s3_url", "file_size", "uploaded_at", "upload_error"];
	}

	static editFields(): string[] {
		return ["filename", "title", "file", "collection", "visibility", "status", "category", "description", "s3_key", "s3_url", "file_size", "uploaded_at", "upload_error", "id"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("collection LIKE :search"),
			sequelize.literal("visibility LIKE :search"),
			sequelize.literal("status LIKE :search"),
			sequelize.literal("description LIKE :search"),
			sequelize.literal("category LIKE :search"),
			sequelize.literal("title LIKE :search"),
			sequelize.literal("s3_key LIKE :search"),
			sequelize.literal("s3_url LIKE :search"),
			sequelize.literal("upload_error LIKE :search")
		];
	}
}

Videos.initModel();

export default Videos;
