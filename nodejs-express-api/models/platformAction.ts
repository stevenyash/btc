import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 

interface PlatformActionAttributes {
  id: number;
  platform_id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_approved: number;
  approved_at: Date | null;
  approved_by: number | null;
  created_at: Date;
  updated_at: Date;
}

interface PlatformActionCreationAttributes
  extends Optional<PlatformActionAttributes, 'id'> {}

class PlatformAction extends BaseModel<PlatformActionAttributes, PlatformActionCreationAttributes> {
  
  static initModel() {
    return super.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        platform_id: { type: DataTypes.STRING, allowNull: false },
        name: { type: DataTypes.STRING, allowNull: false },
        display_name: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        is_approved: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
        approved_at: { type: DataTypes.DATE, allowNull: true },
        approved_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, onUpdate: DataTypes.NOW }
      },
      {
        sequelize,
        tableName: "platform_actions",
        modelName: "platformAction",
        timestamps: false
      }
    );
  }

  static listFields(): string[] {
    return ["id", "platform_id", "name", "display_name", "description", "is_approved", "approved_at", "approved_by", "created_at", "updated_at"];
  }

  static viewFields(): string[] {
    return ["id", "platform_id", "name", "display_name", "description", "is_approved", "approved_at", "approved_by", "created_at", "updated_at"];
  }

  static editFields(): string[] {
    return ["id", "platform_id", "name", "display_name", "description", "is_approved", "approved_at", "approved_by"];
  }

  static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
    return [
      sequelize.literal("id LIKE :search"),
      sequelize.literal("platform_id LIKE :search"),
      sequelize.literal("name LIKE :search"),
      sequelize.literal("display_name LIKE :search"),
      sequelize.literal("description LIKE :search")
    ];
  }
}

PlatformAction.initModel();

export default PlatformAction;