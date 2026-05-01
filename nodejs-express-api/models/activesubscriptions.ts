import { BaseModel, sequelize } from "./basemodel.js";
import { Optional, DataTypes } from "sequelize";

interface ActiveSubscriptionsAttributes {
  id: number;
  username: string | null;
  image: string | null;
  phone: string | null;
  email: string | null;
  subscription_code: string | null;
  referred_by: string | null;
  status: string | null;
  start_date: Date | null;
  expiry_date: Date | null;
}

interface ActiveSubscriptionsCreationAttributes
  extends Optional<ActiveSubscriptionsAttributes, "id"> {}

class ActiveSubscriptions extends BaseModel<
  ActiveSubscriptionsAttributes,
  ActiveSubscriptionsCreationAttributes
> {
  static initModel() {
    return super.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        username: { type: DataTypes.STRING },
        image: { type: DataTypes.STRING },
        phone: { type: DataTypes.STRING },
        email: { type: DataTypes.STRING },
        subscription_code: { type: DataTypes.STRING },
        referred_by: { type: DataTypes.STRING },
        status: { type: DataTypes.STRING },
        start_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        expiry_date: { type: DataTypes.DATE },
      },
      {
        sequelize,
        tableName: "active_subscriptions",
        modelName: "active_subscriptions",
      }
    );
  }

  static listFields(): string[] {
    return [
      "id",
      "username",
      "image",
      "phone",
      "email",
      "subscription_code",
      "referred_by",
      "status",
      "start_date",
      "expiry_date",
    ];
  }

  static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
    return [
      sequelize.literal("id LIKE :search"),
      sequelize.literal("username LIKE :search"),
      sequelize.literal("phone LIKE :search"),
      sequelize.literal("email LIKE :search"),
      sequelize.literal("subscription_code LIKE :search"),
      sequelize.literal("referred_by LIKE :search"),
      sequelize.literal("status LIKE :search"),
    ];
  }
}

ActiveSubscriptions.initModel();
export default ActiveSubscriptions;
