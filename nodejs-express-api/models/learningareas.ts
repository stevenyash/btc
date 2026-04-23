import { BaseModel, sequelize } from "./basemodel";
import { Optional, DataTypes } from "sequelize";

interface LearningAreasAttributes {
  id: number;
  name: string;
  grade_id: number;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
}

interface LearningAreasCreationAttributes
  extends Optional<LearningAreasAttributes, "id"> {}

class LearningAreas extends BaseModel<
  LearningAreasAttributes,
  LearningAreasCreationAttributes
> {
  static initModel() {
    return super.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING },
        grade_id: { type: DataTypes.INTEGER },
        description: { type: DataTypes.TEXT },
        icon: { type: DataTypes.STRING },
        color: { type: DataTypes.STRING },
        sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
      },
      {
        sequelize,
        tableName: "learning_areas",
        modelName: "learning_areas"
      }
    );
  }

  static listFields(): string[] {
    return ["id", "name", "grade_id", "description", "icon", "color", "sort_order", "is_active"];
  }

  static viewFields(): string[] {
    return ["id", "name", "grade_id", "description", "icon", "color", "sort_order", "is_active"];
  }

  static editFields(): string[] {
    return ["id", "name", "grade_id", "description", "icon", "color", "sort_order", "is_active"];
  }

  static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
    return [
      sequelize.literal("id LIKE :search"),
      sequelize.literal("name LIKE :search"),
      sequelize.literal("description LIKE :search")
    ];
  }

  static associate(models: any) {
    this.belongsTo(models.Grades, {
      foreignKey: "grade_id",
      as: "grade_info"
    });

    this.hasMany(models.Lessons, {
      foreignKey: "area_id",
      as: "lessons"
    });
  }
}

LearningAreas.initModel();
export default LearningAreas;