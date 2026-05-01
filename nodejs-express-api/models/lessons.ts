import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 
interface LessonsAttributes {
	id: number;
	area_id: number | null;
	topic_id: number | null;
	subtopic_id: number | null;
	title: string | null;
	description: string | null;
	s3_key: string | null;
	s3_url: string | null;
	storage_path: string | null;
	bunny_url: string | null;
	bunny_video_id: string | null;
	transcoding_status: 'pending' | 'processing' | 'completed' | 'failed';
	mp4_urls: string | null;
	video_guid: string | null;
	file: string | null;
	filename: string | null;
	file_size: number | null;
	duration: number;
	thumbnail_url: string | null;
	primary_thumbnail: string | null;
	price: number;
	is_preview_available: boolean;
	preview_duration: number;
	is_active: boolean;
}

interface LessonsCreationAttributes
	extends Optional<LessonsAttributes, 'id'> {}


class Lessons extends BaseModel<LessonsAttributes, LessonsCreationAttributes>
	 {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				area_id: { type: DataTypes.INTEGER },
				topic_id: { type: DataTypes.INTEGER },
				subtopic_id: { type: DataTypes.INTEGER },
				title: { type: DataTypes.STRING },
				description: { type: DataTypes.TEXT },
				s3_key: { type: DataTypes.STRING },
				s3_url: { type: DataTypes.STRING },
				storage_path: { type: DataTypes.STRING },
				bunny_url: { type: DataTypes.STRING },
				bunny_video_id: { type: DataTypes.STRING },
				transcoding_status: { type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'), defaultValue: 'pending' },
				mp4_urls: { type: DataTypes.TEXT },
				video_guid: { type: DataTypes.STRING },
				file: { type: DataTypes.STRING },
				filename: { type: DataTypes.STRING },
				file_size: { type: DataTypes.BIGINT },
				duration: { type: DataTypes.INTEGER, defaultValue: 0 },
				thumbnail_url: { type: DataTypes.STRING },
				primary_thumbnail: { type: DataTypes.STRING },
				price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
				is_preview_available: { type: DataTypes.BOOLEAN, defaultValue: false },
				preview_duration: { type: DataTypes.INTEGER, defaultValue: 0 },
				is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
			},
			{
				sequelize,
				tableName: "lessons",
				modelName: "lessons"
			}
		);
	}

	static listFields(): string[] {
		return ["id", "area_id", "topic_id", "subtopic_id", "title", "description", "s3_key", "s3_url", "storage_path", "bunny_url", "bunny_video_id", "transcoding_status", "mp4_urls", "video_guid", "file", "filename", "file_size", "duration", "thumbnail_url", "primary_thumbnail", "price", "is_preview_available", "preview_duration", "is_active"];
	}

	static viewFields(): string[] {
		return ["id", "area_id", "topic_id", "subtopic_id", "title", "description", "s3_key", "s3_url", "storage_path", "bunny_url", "bunny_video_id", "transcoding_status", "mp4_urls", "video_guid", "file", "filename", "file_size", "duration", "thumbnail_url", "primary_thumbnail", "price", "is_preview_available", "preview_duration", "is_active"];
	}

	static editFields(): string[] {
		return ["id", "area_id", "topic_id", "subtopic_id", "title", "description", "s3_key", "s3_url", "storage_path", "bunny_url", "bunny_video_id", "transcoding_status", "mp4_urls", "video_guid", "file_size", "file", "filename", "duration", "thumbnail_url", "primary_thumbnail", "price", "is_preview_available", "preview_duration", "is_active"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("title LIKE :search"),
			sequelize.literal("description LIKE :search")
		];
	}
}

Lessons.initModel();

export default Lessons;