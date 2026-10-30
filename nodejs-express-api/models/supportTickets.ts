import { BaseModel, sequelize } from "./basemodel.js";
import { DataTypes, Optional } from "sequelize";

type SupportTicketStatus = "open" | "in_progress" | "resolved";

interface SupportTicketAttributes {
  id: number;
  user_id: number | null;
  tracking_token_hash: string;
  customer_name: string;
  customer_email: string;
  phone_number: string;
  payment_reference: string | null;
  category: string;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  admin_response: string | null;
  handled_by_user_id: number | null;
  resolved_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface SupportTicketCreationAttributes
  extends Optional<
    SupportTicketAttributes,
    | "id"
    | "user_id"
    | "payment_reference"
    | "status"
    | "admin_response"
    | "handled_by_user_id"
    | "resolved_at"
    | "created_at"
    | "updated_at"
  > {}

class SupportTickets extends BaseModel<
  SupportTicketAttributes,
  SupportTicketCreationAttributes
> {
  static initModel() {
    return super.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: DataTypes.INTEGER, allowNull: true },
        tracking_token_hash: { type: DataTypes.CHAR(64), allowNull: false, unique: true },
        customer_name: { type: DataTypes.STRING(100), allowNull: false },
        customer_email: { type: DataTypes.STRING(255), allowNull: false },
        phone_number: { type: DataTypes.STRING(20), allowNull: false },
        payment_reference: { type: DataTypes.STRING(100), allowNull: true },
        category: { type: DataTypes.STRING(32), allowNull: false },
        subject: { type: DataTypes.STRING(150), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: false },
        status: {
          type: DataTypes.ENUM("open", "in_progress", "resolved"),
          allowNull: false,
          defaultValue: "open",
        },
        admin_response: { type: DataTypes.TEXT, allowNull: true },
        handled_by_user_id: { type: DataTypes.INTEGER, allowNull: true },
        resolved_at: { type: DataTypes.DATE, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      },
      {
        sequelize,
        tableName: "support_tickets",
        modelName: "support_tickets",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        indexes: [
          { fields: ["status", "created_at"] },
          { fields: ["user_id", "created_at"] },
        ],
      }
    );
  }
}

SupportTickets.initModel();
export default SupportTickets;
