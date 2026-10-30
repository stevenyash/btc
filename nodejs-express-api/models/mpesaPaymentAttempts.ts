import { BaseModel, sequelize } from "./basemodel.js";
import { DataTypes, Optional } from "sequelize";

type PaymentStatus = "pending" | "completed" | "failed";
type ActivationStatus = "pending" | "processing" | "completed" | "failed";

interface MpesaPaymentAttemptAttributes {
  checkout_request_id: string;
  phone_number: string;
  amount: number;
  account_reference: string;
  business_metadata: Record<string, unknown>;
  status: PaymentStatus;
  activation_status: ActivationStatus;
  transaction_id: string | null;
  callback_amount: number | null;
  callback_phone: string | null;
  guest_session_key_hash: string | null;
  created_at: Date;
  updated_at: Date;
}

interface MpesaPaymentAttemptCreationAttributes
  extends Optional<
    MpesaPaymentAttemptAttributes,
    | "transaction_id"
    | "callback_amount"
    | "callback_phone"
    | "guest_session_key_hash"
    | "created_at"
    | "updated_at"
  > {}

class MpesaPaymentAttempts extends BaseModel<
  MpesaPaymentAttemptAttributes,
  MpesaPaymentAttemptCreationAttributes
> {
  static initModel() {
    return super.init(
      {
        checkout_request_id: { type: DataTypes.STRING(50), primaryKey: true },
        phone_number: { type: DataTypes.STRING(15), allowNull: false },
        amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        account_reference: { type: DataTypes.STRING(100), allowNull: false },
        business_metadata: { type: DataTypes.JSON, allowNull: false },
        status: {
          type: DataTypes.ENUM("pending", "completed", "failed"),
          allowNull: false,
          defaultValue: "pending",
        },
        activation_status: {
          type: DataTypes.ENUM("pending", "processing", "completed", "failed"),
          allowNull: false,
          defaultValue: "pending",
        },
        transaction_id: { type: DataTypes.STRING(50), allowNull: true },
        callback_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
        callback_phone: { type: DataTypes.STRING(15), allowNull: true },
        guest_session_key_hash: { type: DataTypes.STRING(64), allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      },
      {
        sequelize,
        tableName: "mpesa_payment_attempts",
        modelName: "mpesa_payment_attempts",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        indexes: [
          { fields: ["phone_number", "created_at"] },
          { fields: ["status", "activation_status"] },
        ],
      }
    );
  }
}

MpesaPaymentAttempts.initModel();
export default MpesaPaymentAttempts;
