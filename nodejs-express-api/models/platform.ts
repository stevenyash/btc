import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 

interface PlatformAttributes {
  id: string;
  name: string;
  description: string | null;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

interface PlatformCreationAttributes
  extends Optional<PlatformAttributes, 'id'> {}

class Platform extends BaseModel<PlatformAttributes, PlatformCreationAttributes> {
  
  static initModel() {
    return super.init(
      {
        id: { type: DataTypes.STRING, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        is_active: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, onUpdate: DataTypes.NOW }
      },
      {
        sequelize,
        tableName: "platforms",
        modelName: "platform",
        timestamps: false
      }
    );
  }

  static listFields(): string[] {
    return ["id", "name", "description", "is_active", "created_at", "updated_at"];
  }

  static viewFields(): string[] {
    return ["id", "name", "description", "is_active", "created_at", "updated_at"];
  }

  static editFields(): string[] {
    return ["id", "name", "description", "is_active"];
  }

  static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
    return [
      sequelize.literal("id LIKE :search"),
      sequelize.literal("name LIKE :search"),
      sequelize.literal("description LIKE :search")
    ];
  }
}

Platform.initModel();

export default Platform;