import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 

interface PlatformApiKeyAttributes {
  id: number;
  platform_id: string;
  api_key: string;
  name: string;
  is_active: number;
  created_at: Date;
  updated_at: Date;
  expires_at: Date | null;
}

interface PlatformApiKeyCreationAttributes
  extends Optional<PlatformApiKeyAttributes, 'id'> {}

class PlatformApiKey extends BaseModel<PlatformApiKeyAttributes, PlatformApiKeyCreationAttributes> {
  
  static initModel() {
    return super.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        platform_id: { type: DataTypes.STRING, allowNull: false },
        api_key: { type: DataTypes.STRING, allowNull: false, unique: true },
        name: { type: DataTypes.STRING, allowNull: false },
        is_active: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, onUpdate: DataTypes.NOW },
        expires_at: { type: DataTypes.DATE, allowNull: true }
      },
      {
        sequelize,
        tableName: "platform_api_keys",
        modelName: "platformApiKey",
        timestamps: false
      }
    );
  }

  static listFields(): string[] {
    return ["id", "platform_id", "api_key", "name", "is_active", "created_at", "updated_at", "expires_at"];
  }

  static viewFields(): string[] {
    return ["id", "platform_id", "api_key", "name", "is_active", "created_at", "updated_at", "expires_at"];
  }

  static editFields(): string[] {
    return ["id", "platform_id", "api_key", "name", "is_active", "expires_at"];
  }

  static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
    return [
      sequelize.literal("id LIKE :search"),
      sequelize.literal("platform_id LIKE :search"),
      sequelize.literal("api_key LIKE :search"),
      sequelize.literal("name LIKE :search")
    ];
  }
}

PlatformApiKey.initModel();

export default PlatformApiKey;