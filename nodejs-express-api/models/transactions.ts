import { BaseModel, sequelize } from "./basemodel";
import { Optional, DataTypes } from "sequelize";

interface TransactionsAttributes {
  id: number;
  user_id: number;
  phone_number: string;
  amount: number;
  transaction_reference: string | null;
  checkout_request_id: string | null;
  status: string | null;
  description: string | null;
  response_code: string | null;
  response_description: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  transactiondate: string | null;
  payment_status: string;
  details_id: number;
}

interface TransactionsCreationAttributes
  extends Optional<
    TransactionsAttributes,
    | "id"
    | "transactiondate"
    | "created_at"
    | "updated_at"
    | "transaction_reference"
    | "checkout_request_id"
    | "status"
    | "description"
    | "response_code"
    | "response_description"
  > {}

class Transactions extends BaseModel<
  TransactionsAttributes,
  TransactionsCreationAttributes
> {
  static initModel() {
    return super.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        phone_number: { type: DataTypes.STRING(15), allowNull: false, defaultValue: "DEFAULT" },
        amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
        transaction_reference: { type: DataTypes.STRING },
        checkout_request_id: { type: DataTypes.STRING(50) },
        status: { type: DataTypes.STRING },
        description: { type: DataTypes.STRING },
        response_code: { type: DataTypes.STRING },
        response_description: { type: DataTypes.STRING },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE },
        transactiondate: { type: DataTypes.STRING },
        payment_status: { type: DataTypes.STRING, allowNull: false },
        details_id: { type: DataTypes.INTEGER, allowNull: false },
      },
      {
        sequelize,
        tableName: "transactions",
        modelName: "transactions",
      }
    );
  }

  static listFields(): (string | ReturnType<typeof sequelize.literal>)[] {
    return [
      "id",
      "user_id",
      "phone_number",
      "amount",
      "transaction_reference",
      "checkout_request_id",
      "status",
      "description",
      "response_code",
      "response_description",
      "created_at",
      "updated_at",
      sequelize.literal("transaction_date AS transactiondate"),
      "payment_status",
      "details_id",
    ];
  }

  static viewFields(): (string | ReturnType<typeof sequelize.literal>)[] {
    return this.listFields();
  }

  static editFields(): (string | ReturnType<typeof sequelize.literal>)[] {
    return [
      "id",
      "user_id",
      "phone_number",
      "amount",
      "transaction_reference",
      "checkout_request_id",
      "status",
      "description",
      "response_code",
      "response_description",
      sequelize.literal("transaction_date AS transactiondate"),
      "payment_status",
      "details_id",
    ];
  }

  static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
    return [
      sequelize.literal("phone_number LIKE :search"),
      sequelize.literal("transaction_reference LIKE :search"),
      sequelize.literal("checkout_request_id LIKE :search"),
      sequelize.literal("description LIKE :search"),
      sequelize.literal("response_code LIKE :search"),
      sequelize.literal("response_description LIKE :search"),
      sequelize.literal("id LIKE :search"),
      sequelize.literal("transaction_date LIKE :search"),
      sequelize.literal("payment_status LIKE :search"),
    ];
  }

  static associate(models: any) {
    this.belongsTo(models.Users, {
      foreignKey: "user_id",
      as: "user",
    });

    this.belongsTo(models.Subscriptions, {
      foreignKey: "details_id",
      as: "subscription",
    });
  }
}

Transactions.initModel();
export default Transactions;
