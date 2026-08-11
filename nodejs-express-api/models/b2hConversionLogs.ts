import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize";

interface B2HConversionLogsAttributes {
	id: number;
	referral_code: string;
	action: string;
	platform_id: string;
	conversion_status: string;
	converted_at: Date;
	metadata: Record<string, unknown> | null;
	raw_payload: string | null;
	status: string;
	created_at: Date;
}

interface B2HConversionLogsCreationAttributes
	extends Optional<B2HConversionLogsAttributes, 'id' | 'metadata' | 'raw_payload' | 'status' | 'created_at'> {}

class B2HConversionLogs extends BaseModel<B2HConversionLogsAttributes, B2HConversionLogsCreationAttributes> {
	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				referral_code: { type: DataTypes.STRING(255), allowNull: false },
				action: { type: DataTypes.STRING(255), allowNull: false },
				platform_id: { type: DataTypes.STRING(255), allowNull: false },
				conversion_status: { type: DataTypes.STRING(50), allowNull: false },
				converted_at: { type: DataTypes.DATE, allowNull: false },
				metadata: { type: DataTypes.JSON, allowNull: true },
				raw_payload: { type: DataTypes.TEXT, allowNull: true },
				status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'processed' },
				created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
			},
			{
				sequelize,
				tableName: "b2h_conversion_logs",
				modelName: "b2h_conversion_logs",
				timestamps: false,
			}
		);
	}

	static listFields(): string[] {
		return ["id", "referral_code", "action", "platform_id", "conversion_status", "converted_at", "status", "created_at"];
	}

	static viewFields(): string[] {
		return ["id", "referral_code", "action", "platform_id", "conversion_status", "converted_at", "metadata", "raw_payload", "status", "created_at"];
	}

	static editFields(): string[] {
		return ["id", "referral_code", "action", "platform_id", "conversion_status", "converted_at", "status"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("referral_code LIKE :search"),
			sequelize.literal("action LIKE :search"),
			sequelize.literal("platform_id LIKE :search"),
		];
	}
}

B2HConversionLogs.initModel();

export default B2HConversionLogs;
