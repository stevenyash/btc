import axios from "axios";
import moment from "moment";
import crypto from "crypto";
import fs from "fs";
import {
  MpesaAccessTokenResponse,
  StkPushResponse,
  StkQueryResponse,
} from "../types/mpesa.js";

interface MpesaConfigValues {
  APP_KEY: string;
  APP_SECRET: string;
  SHORTCODE: string;
  LNM_PASSKEY: string;
  INITIATOR_NAME?: string;
  INIT_PASSWORD?: string;
  SECURITY_CREDENTIAL?: string;
  CERTIFICATE_PATH?: string;
  INITusercode?: string;
}

class MpesaService {
  private consumerKey: string;
  private consumerSecret: string;
  private organizationShortCode: string;
  private passKey: string;
  private environment: string;
  private initiatorName: string;
  private initPassword: string | undefined;
  private securityCredential: string | undefined;

  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY || '';
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET || '';
    this.organizationShortCode = process.env.MPESA_SHORTCODE || '';
    this.passKey = process.env.MPESA_PASSKEY || '';
    this.environment = process.env.MPESA_ENV || "production";
    this.initiatorName = process.env.MPESA_INITIATOR_NAME || "bitstutorconnect";
    this.initPassword = process.env.MPESA_INIT_PASSWORD;
    this.securityCredential = process.env.MPESA_SECURITY_CREDENTIAL;
  }

  generateSecurityCredential(): string {
    try {
      const certificatePath = process.env.MPESA_CERTIFICATE_PATH;
      const usercode = process.env.MPESA_INIT_USERCODE;
      
      if (!certificatePath || !fs.existsSync(certificatePath)) {
        console.error(`Certificate not found at ${certificatePath}`);
        return "";
      }
      
      const certificate = fs.readFileSync(certificatePath, "utf8");
      const encrypted = crypto.publicEncrypt(
        {
          key: certificate,
          padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        Buffer.from(usercode || "")
      );
      
      return encrypted.toString("base64");
    } catch (error) {
      console.error("Error generating security credential:", error);
      return "";
    }
  }

class MpesaService {
  private consumerKey: string;
  private consumerSecret: string;
  private organizationShortCode: string;
  private passKey: string;
  private environment: string;
  private InitiatorName: string;
  private initPassword: string | undefined;
  private securityCredential: string | undefined;

  constructor() {
    const mpesa = mpesaConfig as { mpesa: MpesaConfigValues };
    this.consumerKey = mpesa.mpesa.APP_KEY;
    this.consumerSecret = mpesa.mpesa.APP_SECRET;
    this.organizationShortCode = mpesa.mpesa.SHORTCODE;
    this.passKey = mpesa.mpesa.LNM_PASSKEY;
    this.environment = process.env.MPESA_ENV || "production";
    this.InitiatorName = mpesa.mpesa.INITIATOR_NAME || "bitstutorconnect";
    this.initPassword = mpesa.mpesa.INIT_PASSWORD;
    this.securityCredential = mpesa.mpesa.SECURITY_CREDENTIAL;
  }

  generateSecurityCredential(): string {
    try {
      const mpesa = mpesaConfig as { mpesa: MpesaConfigValues };
      const certificatePath = mpesa.mpesa.CERTIFICATE_PATH;
      const usercode = mpesa.mpesa.INITusercode;

      if (!certificatePath || !fs.existsSync(certificatePath)) {
        console.error(`Certificate not found at ${certificatePath}`);
        return "";
      }

      const certificate = fs.readFileSync(certificatePath, "utf8");
      const encrypted = crypto.publicEncrypt(
        {
          key: certificate,
          padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        Buffer.from(usercode || "")
      );

      return encrypted.toString("base64");
    } catch (error) {
      console.error("Error generating security credential:", error);
      return "";
    }
  }

  getSecurityCredential(): string {
    if (this.securityCredential) {
      return this.securityCredential;
    }
    return this.generateSecurityCredential();
  }

  async getAccessToken(): Promise<string> {
    const auth = Buffer.from(
      `${this.consumerKey}:${this.consumerSecret}`
    ).toString("base64");

    const maxRetries = 3;
    const retryDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.get<MpesaAccessTokenResponse>(
          `https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`,
          {
            headers: { Authorization: `Basic ${auth}` },
            timeout: 10000,
          }
        );

        return response.data.access_token;
      } catch (error) {
        console.error(`Access token fetch attempt ${attempt}/${maxRetries} failed:`, error instanceof Error ? error.message : String(error));
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        } else {
          throw new Error("Failed to obtain access token after retries.");
        }
      }
    }
    throw new Error("Failed to obtain access token.");
  }

  private generatePassword(): string {
    const timestamp = moment().format("YYYYMMDDHHmmss");
    return Buffer.from(
      `${this.organizationShortCode}${this.passKey}${timestamp}`
    ).toString("base64");
  }

  async lipaNaMpesaOnline(
    amount: number,
    phoneNumber: string,
    callbackUrl: string
  ): Promise<StkPushResponse | { error: string }> {
    const timestamp = moment().format("YYYYMMDDHHmmss");
    const password = this.generatePassword();
    const accessToken = await this.getAccessToken();

    const payload = {
      BusinessShortCode: this.organizationShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: this.organizationShortCode,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrl,
      AccountReference: "BTC Payment",
      TransactionDesc: "Payment",
    };

    try {
      const response = await axios.post<StkPushResponse>(
        "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        payload,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      return response.data;
    } catch (error) {
      console.error("STK Push Error:", error);
      return { error: "An error occurred while initiating the payment." };
    }
  }

  async queryStkStatus(checkoutRequestID: string): Promise<StkQueryResponse | { error: string }> {
    const timestamp = moment().format("YYYYMMDDHHmmss");
    const password = this.generatePassword();
    const accessToken = await this.getAccessToken();

    const payload = {
      BusinessShortCode: this.organizationShortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestID,
    };

    try {
      const response = await axios.post<StkQueryResponse>(
        "https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query",
        payload,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error("STK Query Error:", error);
      return { error: "An error occurred while querying the STK status." };
    }
  }

  async simulateC2B(
    amount: number,
    phoneNumber: string,
    accountNumber: string
  ): Promise<unknown> {
    const accessToken = await this.getAccessToken();

    const payload = {
      ShortCode: this.organizationShortCode,
      CommandID: "CustomerPayBillOnline",
      Amount: amount,
      Msisdn: phoneNumber,
      BillRefNumber: accountNumber,
    };

    try {
      const response = await axios.post(
        "https://api.safaricom.co.ke/mpesa/c2b/v1/simulate",
        payload,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      return response.data;
    } catch (error) {
      console.error("C2B Simulation Error:", error);
      return { error: "An error occurred while simulating the C2B transaction." };
    }
  }

  async registerC2BUrls(
    confirmationURL: string,
    validationURL: string
  ): Promise<unknown> {
    const accessToken = await this.getAccessToken();

    const payload = {
      ShortCode: this.organizationShortCode,
      ResponseType: "Completed",
      ConfirmationURL: confirmationURL,
      ValidationURL: validationURL,
    };

    try {
      const response = await axios.post(
        "https://api.safaricom.co.ke/mpesa/c2b/v1/registerurl",
        payload,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      return response.data;
    } catch (error) {
      console.error("C2B Register URL Error:", error);
      return { error: "An error occurred while registering C2B URLs." };
    }
  }

  async b2cTransfer(
    amount: number,
    phoneNumber: string,
    resultURL: string,
    timeoutURL: string
  ): Promise<unknown> {
    const accessToken = await this.getAccessToken();

    const securityCredential = this.getSecurityCredential();
    if (!securityCredential) {
      return { error: "Security credential not configured." };
    }

    const payload = {
      InitiatorName: this.InitiatorName,
      SecurityCredential: securityCredential,
      CommandID: "BusinessPayment",
      Amount: amount,
      PartyA: this.organizationShortCode,
      PartyB: phoneNumber,
      Remarks: "Payment",
      QueueTimeOutURL: timeoutURL,
      ResultURL: resultURL,
      Occasion: "",
    };

    try {
      const response = await axios.post(
        "https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest",
        payload,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      return response.data;
    } catch (error) {
      console.error("B2C Transfer Error:", error);
      return { error: "An error occurred while initiating B2C transfer." };
    }
  }

  async queryTransactionStatus(
    transactionID: string,
    resultURL: string,
    timeoutURL: string
  ): Promise<unknown> {
    const accessToken = await this.getAccessToken();

    const payload = {
      Initiator: this.InitiatorName,
      SecurityCredential: this.securityCredential,
      CommandID: "TransactionStatusQuery",
      TransactionID: transactionID,
      PartyA: this.organizationShortCode,
      IdentifierType: "4",
      ResultURL: resultURL,
      QueueTimeOutURL: timeoutURL,
      Remarks: "Transaction Status Query",
      Occasion: "",
    };

    try {
      const response = await axios.post(
        "https://api.safaricom.co.ke/mpesa/transactionstatus/v1/query",
        payload,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      return response.data;
    } catch (error) {
      console.error("Transaction Status Error:", error);
      return { error: "An error occurred while querying the transaction status." };
    }
  }

  async getAccountBalance(resultURL: string, timeoutURL: string): Promise<unknown> {
    const accessToken = await this.getAccessToken();

    const payload = {
      Initiator: this.InitiatorName,
      SecurityCredential: this.securityCredential,
      CommandID: "AccountBalance",
      PartyA: this.organizationShortCode,
      IdentifierType: "4",
      Remarks: "Balance Inquiry",
      QueueTimeOutURL: timeoutURL,
      ResultURL: resultURL,
    };

    try {
      const response = await axios.post(
        "https://api.safaricom.co.ke/mpesa/accountbalance/v1/query",
        payload,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      return response.data;
    } catch (error) {
      console.error("Account Balance Error:", error);
      return { error: "An error occurred while fetching the account balance." };
    }
  }

  async reversal(
    amount: number,
    transactionID: string,
    resultURL: string,
    timeoutURL: string
  ): Promise<unknown> {
    const accessToken = await this.getAccessToken();

    const payload = {
      Initiator: this.InitiatorName,
      SecurityCredential: this.securityCredential,
      CommandID: "TransactionReversal",
      TransactionID: transactionID,
      Amount: amount,
      ReceiverParty: this.organizationShortCode,
      RecieverIdentifierType: "4",
      ResultURL: resultURL,
      QueueTimeOutURL: timeoutURL,
      Remarks: "Reversal Request",
      Occasion: "",
    };

    try {
      const response = await axios.post(
        "https://api.safaricom.co.ke/mpesa/reversal/v1/request",
        payload,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      return response.data;
    } catch (error) {
      console.error("Reversal Error:", error);
      return { error: "An error occurred while reversing the transaction." };
    }
  }
}

export default new MpesaService();