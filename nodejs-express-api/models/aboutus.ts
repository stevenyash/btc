import { BaseModel, sequelize } from "./basemodel";
import { Optional, DataTypes } from "sequelize";  // <-- use DataTypes here

interface AboutUsAttributes {
  id: number;
  section: string;
  content: string;
}

interface AboutUsCreationAttributes
  extends Optional<AboutUsAttributes, "id"> {}

class AboutUs extends BaseModel<AboutUsAttributes, AboutUsCreationAttributes> {
  static initModel() {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        section: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: "DEFAULT",
        },
        content: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: "DEFAULT",
        },
      },
      {
        sequelize,
        tableName: "about_us",
        modelName: "about_us",
      }
    );
  }

  static listFields(): string[] {
    return ["id", "section", "content"];
  }

  static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
    return [
      sequelize.literal("id LIKE :search"),
      sequelize.literal("section LIKE :search"),
      sequelize.literal("content LIKE :search"),
    ];
  }
}

AboutUs.initModel();
export default AboutUs;
