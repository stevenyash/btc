export interface MpesaConfig {
  APP_KEY: string;
  APP_SECRET: string;
  SHORTCODE: string;
  LNM_PASSKEY: string;
  INITIATOR_NAME?: string;
  SECURITY_CREDENTIAL?: string;
  CERTIFICATE_PATH?: string;
  INITusercode?: string;
}

export interface MpesaAccessTokenResponse {
  access_token: string;
  expires_in: string;
}

export interface StkPushRequest {
  amount: number;
  phoneNumber: string;
  accountReference: string;
  transactionDesc?: string;
  callbackUrl?: string;
  businessMetadata?: Record<string, unknown>;
}

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface StkQueryRequest {
  checkoutRequestID: string;
}

export interface StkQueryResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
  MpesaReceiptNumber?: string;
}

export interface MpesaCallbackBody {
  BusinessShortCode: string;
  TransactionType: string;
  TransID: string;
  TransTime: string;
  TransAmount: string;
  BillRefNumber: string;
  InvoiceNumber: string;
  OrgAccountBalance: string;
  ThirdPartyTransID: string;
  MSISDN: string;
  FirstName: string;
  MiddleName: string;
  LastName: string;
}

export interface MpesaCallbackResponse {
  Result: {
    ResultCode: number;
    ResultDesc: string;
    TransactionID?: string;
    TransactionStatus?: string;
    CallbackMetadata?: {
      Item: Array<{
        Name: string;
        Value: string | number;
      }>;
    };
  };
}

export interface MpesaPaymentResult {
  success: boolean;
  checkoutRequestID?: string;
  transactionID?: string;
  amount?: number;
  phoneNumber?: string;
  accountReference?: string;
  businessMetadata?: Record<string, unknown>;
  error?: string;
  timestamp?: string;
}
