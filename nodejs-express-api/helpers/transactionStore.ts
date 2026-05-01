interface TransactionRecord {
  checkoutRequestID: string;
  phoneNumber: string;
  amount: number;
  accountReference: string;
  businessMetadata?: Record<string, unknown>;
  status: "pending" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
  transactionID?: string;
  error?: string;
}

const transactionStore = new Map<string, TransactionRecord>();

export default transactionStore;
