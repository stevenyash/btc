import express, { Request, Response } from "express";
import { Op, type Transaction } from "sequelize";
import mpesaService from "../helpers/MpesaService.js";
import {
  StkPushRequest} from "../types/mpesa.js";
import DB, { op as sequelizeOp } from "../models/db.js";
import { sendSms } from "../helpers/sms.js";
import mailer from "../helpers/mailer.js";
import utils from "../helpers/utils.js";
import crypto from "crypto";
import { b2hService } from "../services/b2hIntegrationService.js";
import {
  clearGuestSessionCookie,
  createGuestSessionKey,
  guestBrowserOriginMiddleware,
  hashGuestSessionKey,
  normalizeGuestPhone,
  setGuestSessionCookie,
} from "../helpers/guestSession.js";
import {
  guestSessionLimiter,
  mpesaPaymentLimiter,
  mpesaVerifyLimiter,
} from "../middleware/rateLimiters.js";

const MpesaController = express.Router();
const op = DB.op || sequelizeOp || Op;

interface StoredPaymentAttempt {
  checkout_request_id: string;
  phone_number: string;
  amount: number | string;
  account_reference: string;
  business_metadata: Record<string, unknown>;
  status: "pending" | "completed" | "failed";
  activation_status: "pending" | "processing" | "completed" | "failed";
  transaction_id: string | null;
  callback_amount: number | string | null;
  callback_phone: string | null;
  guest_session_key_hash: string | null;
  created_at: Date;
  updated_at: Date;
}

function isBusinessMetadata(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseBusinessMetadata(value: unknown): Record<string, unknown> {
  let metadata = value;
  if (typeof metadata === "string") {
    try {
      metadata = JSON.parse(metadata) as unknown;
    } catch {
      throw new Error("Stored M-Pesa business metadata is invalid JSON");
    }
  }
  if (!isBusinessMetadata(metadata)) {
    throw new Error("Stored M-Pesa business metadata must be a JSON object");
  }
  return metadata;
}

function toPaymentRecord(attempt: StoredPaymentAttempt) {
  const businessMetadata = { ...parseBusinessMetadata(attempt.business_metadata) };
  delete businessMetadata.accountUserId;
  return {
    checkoutRequestID: attempt.checkout_request_id,
    phoneNumber: attempt.phone_number,
    amount: Number(attempt.amount),
    accountReference: attempt.account_reference,
    businessMetadata,
    status: attempt.status,
    createdAt: new Date(attempt.created_at),
    updatedAt: new Date(attempt.updated_at),
    transactionID: attempt.transaction_id || undefined,
  };
}

async function needsAccountActivationRepair(attempt: StoredPaymentAttempt): Promise<boolean> {
  const metadata = parseBusinessMetadata(attempt.business_metadata);
  const accountUserId = Number(metadata.accountUserId);
  const activationType = metadata.activationType;
  if (
    !Number.isInteger(accountUserId) ||
    accountUserId <= 0 ||
    ![
      "subscription",
      "package",
      "packages",
      "package_with_subscription",
      "subscribelessonactivation",
    ].includes(String(activationType))
  ) {
    return false;
  }

  const activationTransaction = await DB.Transactions.findOne({
    where: {
      checkout_request_id: attempt.checkout_request_id,
      user_id: accountUserId,
    },
    attributes: ["id"],
    raw: true,
  });
  return !activationTransaction;
}

async function loadPaymentAttempt(checkoutRequestID: string): Promise<StoredPaymentAttempt | null> {
  const attempt = await DB.MpesaPaymentAttempts.findByPk(checkoutRequestID, { raw: true }) as StoredPaymentAttempt | null;
  if (!attempt) return null;
  return {
    ...attempt,
    business_metadata: parseBusinessMetadata(attempt.business_metadata),
  };
}

async function activatePaymentAttempt(attempt: StoredPaymentAttempt): Promise<void> {
  const [claimed] = await DB.MpesaPaymentAttempts.update(
    { activation_status: "processing" },
    {
      where: {
        checkout_request_id: attempt.checkout_request_id,
        status: "completed",
        activation_status: "pending",
      },
    }
  );
  if (!claimed) {
    const current = await loadPaymentAttempt(attempt.checkout_request_id);
    if (current?.activation_status === "completed") return;
    throw new Error("Payment activation is already being processed");
  }

  const record = toPaymentRecord(attempt);
  const metadata = parseBusinessMetadata(attempt.business_metadata);
  const activationType = metadata.activationType as string | undefined;
  let result: { success?: boolean; error?: string } | undefined;
  let activationTransaction: Transaction | undefined;
  let activationTransactionCommitted = false;

  try {
    if ([
      "subscription",
      "package",
      "packages",
      "package_with_subscription",
      "subscribelessonactivation",
    ].includes(activationType || "")) {
      activationTransaction = await DB.Transactions.sequelize.transaction();
    }

    switch (activationType) {
      case "subscription":
        result = await subscriptionActivation(attempt.checkout_request_id, metadata, record, activationTransaction);
        break;
      case "package":
      case "packages":
      case "package_with_subscription":
        result = await packageActivation(attempt.checkout_request_id, metadata, record, activationTransaction);
        break;
      case "subscribelessonactivation":
        result = await subscribedLessonActivation(attempt.checkout_request_id, metadata, record, activationTransaction);
        break;
      case "guestlessonactivation":
        result = await guestLessonActivation(attempt.checkout_request_id, metadata, record);
        break;
      case "weekendTutorial":
        result = await weekendTutorialActivation(attempt.checkout_request_id, metadata, record);
        break;
      default:
        throw new Error("Unsupported payment activation type");
    }

    if (result?.success === false) {
      throw new Error(result.error || "Payment activation failed");
    }

    await activationTransaction?.commit();
    activationTransactionCommitted = Boolean(activationTransaction);
    await DB.MpesaPaymentAttempts.update(
      { activation_status: "completed" },
      { where: { checkout_request_id: attempt.checkout_request_id, activation_status: "processing" } }
    );
  } catch (error) {
    if (activationTransaction && !activationTransactionCommitted) {
      try {
        await activationTransaction.rollback();
      } catch (rollbackError) {
        console.error("Payment activation rollback failed:", rollbackError);
      }
    }
    await DB.MpesaPaymentAttempts.update(
      { activation_status: "pending" },
      { where: { checkout_request_id: attempt.checkout_request_id, activation_status: "processing" } }
    );
    throw error;
  }
}

async function confirmPaymentAndActivate(
  attempt: StoredPaymentAttempt
): Promise<StoredPaymentAttempt> {
  if (attempt.status === "failed") {
    return attempt;
  }

  if (attempt.status !== "completed") {
    const queryResult = await mpesaService.queryStkStatus(attempt.checkout_request_id);
    if ("error" in queryResult || String(queryResult.ResultCode) !== "0") {
      if (!("error" in queryResult) && String(queryResult.ResultCode) !== "4999") {
        await DB.MpesaPaymentAttempts.update(
          { status: "failed" },
          { where: { checkout_request_id: attempt.checkout_request_id, status: "pending" } }
        );
        attempt.status = "failed";
      }
      return attempt;
    }

    await DB.MpesaPaymentAttempts.update(
      { status: "completed", transaction_id: queryResult.MpesaReceiptNumber || null },
      { where: { checkout_request_id: attempt.checkout_request_id, status: "pending" } }
    );
    attempt.status = "completed";
    attempt.transaction_id = queryResult.MpesaReceiptNumber || attempt.transaction_id;
  }

  if (
    attempt.activation_status === "completed" &&
    await needsAccountActivationRepair(attempt)
  ) {
    const [reopened] = await DB.MpesaPaymentAttempts.update(
      { activation_status: "pending" },
      {
        where: {
          checkout_request_id: attempt.checkout_request_id,
          status: "completed",
          activation_status: "completed",
        },
      }
    );
    if (reopened) {
      attempt.activation_status = "pending";
    } else {
      const current = await loadPaymentAttempt(attempt.checkout_request_id);
      if (current?.activation_status === "completed") return current;
      throw new Error("Payment activation is already being processed");
    }
  }

  if (attempt.activation_status !== "completed") {
    await activatePaymentAttempt(attempt);
    attempt.activation_status = "completed";
  }
  return attempt;
}

MpesaController.post("/push", mpesaPaymentLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      amount,
      phoneNumber,
      accountReference,
      businessMetadata,
    }: StkPushRequest = req.body;

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0 ||
        !phoneNumber || typeof phoneNumber !== "string" ||
        !accountReference || typeof accountReference !== "string" || accountReference.length > 100) {
      res.status(400).json({
        error: "A positive amount, phoneNumber, and valid accountReference are required",
      });
      return;
    }

    const cleanPhone = normalizeGuestPhone(phoneNumber);
    if (!cleanPhone) {
      res.status(400).json({
        error: "Invalid phone number. Use format: 254XXXXXXXXX",
      });
      return;
    }

    const normalizedBusinessMetadata = businessMetadata && typeof businessMetadata === "object"
      ? { ...businessMetadata }
      : {};
    const activationType = normalizedBusinessMetadata.activationType;
    const supportedActivationTypes = new Set([
      "subscription",
      "package",
      "packages",
      "package_with_subscription",
      "subscribelessonactivation",
      "guestlessonactivation",
      "weekendTutorial",
    ]);
    if (typeof activationType !== "string" || !supportedActivationTypes.has(activationType)) {
      res.status(400).json({ error: "Unsupported payment activation type" });
      return;
    }
    delete normalizedBusinessMetadata.accountUserId;
    if (
      activationType === "subscription" ||
      activationType === "package" ||
      activationType === "packages" ||
      activationType === "package_with_subscription" ||
      activationType === "subscribelessonactivation"
    ) {
      if (req.user?.id) {
        normalizedBusinessMetadata.accountUserId = Number(req.user.id);
      } else if (activationType !== "subscription") {
        res.status(401).json({ error: "Sign in before purchasing subscriber lessons or a package" });
        return;
      }
    }

    let expectedAmount = Number(amount);
    let guestSessionKey: string | null = null;
    if (normalizedBusinessMetadata.activationType === "guestlessonactivation") {
      const lessonId = Number(normalizedBusinessMetadata.lessonId);
      if (!Number.isInteger(lessonId) || lessonId <= 0) {
        res.status(400).json({ error: "A valid lesson is required for guest lesson payment" });
        return;
      }

      const lesson = await DB.Lessons.findOne({
        where: { id: lessonId, is_active: true },
        attributes: ["id"],
        raw: true,
      });
      if (!lesson) {
        res.status(404).json({ error: "Lesson not found or inactive" });
        return;
      }

      const subscriptionType = req.isSubscriber ? "subscribed" : "non_subscribed";
      const lessonSetting = await DB.LessonSetting.findOne({
        where: { subscription_type: subscriptionType },
        attributes: ["fee", "duration"],
        raw: true,
      });
      if (!lessonSetting) {
        res.status(503).json({ error: "Guest lesson pricing is not configured" });
        return;
      }

      expectedAmount = Number(lessonSetting.fee);
      const lessonDuration = Number(lessonSetting.duration);
      if (!Number.isFinite(expectedAmount) || expectedAmount <= 0 ||
          Number(amount) !== expectedAmount) {
        res.status(400).json({
          error: "The lesson price changed. Refresh the page and try again.",
        });
        return;
      }
      if (!Number.isInteger(lessonDuration) || lessonDuration <= 0) {
        res.status(503).json({ error: "Guest lesson duration is not configured correctly" });
        return;
      }

      normalizedBusinessMetadata.lessonId = lessonId;
      normalizedBusinessMetadata.duration = lessonDuration;
      normalizedBusinessMetadata.lessonFees = expectedAmount;
      guestSessionKey = createGuestSessionKey();
    } else if (normalizedBusinessMetadata.activationType === "subscription") {
      const planId = Number(normalizedBusinessMetadata.planId);
      if (!Number.isInteger(planId) || planId <= 0) {
        res.status(400).json({ error: "A valid subscription plan is required" });
        return;
      }

      const plan = await DB.SubscriptionTypes.findByPk(planId, { raw: true });
      if (!plan) {
        res.status(404).json({ error: "Subscription plan not found" });
        return;
      }
      const planPackage = await DB.Packages.findOne({
        where: { subscription_type_id: planId },
        attributes: ["id"],
        raw: true,
      });
      if (!planPackage) {
        res.status(503).json({ error: "The selected subscription plan is not configured" });
        return;
      }

      expectedAmount = Number(plan.membership_fee);
      if (!Number.isFinite(expectedAmount) || expectedAmount <= 0 || Number(amount) !== expectedAmount) {
        res.status(400).json({ error: "The subscription price changed. Refresh and try again." });
        return;
      }
      normalizedBusinessMetadata.planId = planId;
    } else if (normalizedBusinessMetadata.activationType === "subscribelessonactivation") {
      if (!req.user?.id) {
        res.status(401).json({ error: "Sign in to purchase subscriber lessons" });
        return;
      }
      const lessonIds = Array.isArray(normalizedBusinessMetadata.lessonIds)
        ? normalizedBusinessMetadata.lessonIds.map(Number)
        : [Number(normalizedBusinessMetadata.lessonId)];
      const validLessonIds = [...new Set(lessonIds)];
      if (validLessonIds.length === 0 ||
          validLessonIds.some((id) => !Number.isInteger(id) || id <= 0) ||
          validLessonIds.length > 100) {
        res.status(400).json({ error: "Valid lesson IDs are required" });
        return;
      }

      const activeSubscription = await DB.Subscriptions.findOne({
        where: {
          user_id: req.user.id,
          status: "active",
          expiry_date: { [op.gte]: new Date() },
        },
        raw: true,
      });
      if (!activeSubscription) {
        res.status(403).json({ error: "An active subscription is required for subscriber lesson pricing" });
        return;
      }
      const lessonSetting = await DB.LessonSetting.findOne({
        where: { subscription_type: "subscribed" },
        attributes: ["fee", "duration"],
        raw: true,
      });
      if (!lessonSetting) {
        res.status(503).json({ error: "Subscriber lesson pricing is not configured" });
        return;
      }
      const lessons = await DB.Lessons.findAll({
        where: { id: validLessonIds, is_active: true },
        attributes: ["id"],
        raw: true,
      });
      if (lessons.length !== validLessonIds.length) {
        res.status(404).json({ error: "One or more selected lessons are unavailable" });
        return;
      }

      const lessonFee = Number(lessonSetting.fee);
      const lessonDuration = Number(lessonSetting.duration);
      expectedAmount = lessonFee * validLessonIds.length;
      if (!Number.isFinite(lessonFee) || lessonFee <= 0 ||
          Number(amount) !== expectedAmount) {
        res.status(400).json({ error: "The subscriber lesson price changed. Refresh and try again." });
        return;
      }
      if (!Number.isInteger(lessonDuration) || lessonDuration <= 0) {
        res.status(503).json({ error: "Subscriber lesson duration is not configured correctly" });
        return;
      }
      normalizedBusinessMetadata.lessonIds = validLessonIds;
      normalizedBusinessMetadata.lessonId = validLessonIds[0];
      normalizedBusinessMetadata.duration = lessonDuration;
    } else if (
      normalizedBusinessMetadata.activationType === "package" ||
      normalizedBusinessMetadata.activationType === "packages" ||
      normalizedBusinessMetadata.activationType === "package_with_subscription"
    ) {
      const packageId = Number(normalizedBusinessMetadata.planId);
      if (!Number.isInteger(packageId) || packageId <= 0) {
        res.status(400).json({ error: "A valid package is required" });
        return;
      }

      const packageRecord = await DB.Packages.findByPk(packageId, { raw: true });
      if (!packageRecord) {
        res.status(404).json({ error: "Package not found" });
        return;
      }

      expectedAmount = Number(packageRecord.fee);
      if (normalizedBusinessMetadata.activationType === "package_with_subscription") {
        if (!req.user?.id) {
          res.status(401).json({ error: "Sign in before purchasing a package with a subscription" });
          return;
        }
        const subscriptionPlanId = Number(packageRecord.subscription_type_id);
        const subscriptionPlan = await DB.SubscriptionTypes.findByPk(subscriptionPlanId, { raw: true });
        if (!subscriptionPlan) {
          res.status(503).json({ error: "The package subscription plan is not configured" });
          return;
        }
        expectedAmount += Number(subscriptionPlan.membership_fee);
        normalizedBusinessMetadata.subscriptionPlanId = subscriptionPlanId;
      }

      if (!Number.isFinite(expectedAmount) || expectedAmount <= 0 || Number(amount) !== expectedAmount) {
        res.status(400).json({ error: "The package price changed. Refresh and try again." });
        return;
      }
      normalizedBusinessMetadata.planId = packageId;
    }

    const referralCode = normalizedBusinessMetadata.referralCode as string | undefined;
    console.log('[B2H] Initial STK referral capture:', {
      accountReference,
      activationType: normalizedBusinessMetadata.activationType,
      hasReferralCode: !!referralCode,
      referralCode: referralCode || null,
    });

    const callbackUrl = process.env.MPESA_CALLBACK_URL;

    if (!callbackUrl) {
      res.status(500).json({
        error: "M-Pesa callback URL not configured. Set MPESA_CALLBACK_URL in .env",
      });
      return;
    }

    const response = await mpesaService.lipaNaMpesaOnline(
      expectedAmount,
      cleanPhone,
      callbackUrl
    );

    if ("error" in response) {
      res.status(500).json({
        error: response.error,
      });
      return;
    }

    if (response.CheckoutRequestID) {
      await DB.MpesaPaymentAttempts.create({
        checkout_request_id: response.CheckoutRequestID,
        phone_number: cleanPhone,
        amount: expectedAmount,
        account_reference: accountReference,
        business_metadata: normalizedBusinessMetadata,
        status: "pending",
        activation_status: "pending",
        guest_session_key_hash: guestSessionKey ? hashGuestSessionKey(guestSessionKey) : null,
      });

      res.json({
        success: true,
        checkoutRequestID: response.CheckoutRequestID,
        merchantRequestID: response.MerchantRequestID,
        message: response.CustomerMessage || "STK push sent",
        ...(guestSessionKey && { guestSessionKey }),
      });
    } else {
      res.status(500).json({
        error: response.ResponseDescription || "Failed to initiate STK push",
      });
    }
  } catch (error) {
    console.error("M-Pesa push error:", error);
    res.status(500).json({
      error: "Failed to initiate payment",
    });
  }
});

MpesaController.post("/callback", async (req: Request, res: Response): Promise<void> => {
  try {
    const stkCallback = (req.body as any)?.Body?.stkCallback;
    if (!stkCallback) {
      console.error("Invalid callback: missing Body.stkCallback", req.body);
      res.status(400).json({ ResultCode: 1, ResultDesc: "Invalid payload" });
      return;
    }

    const checkoutRequestID = stkCallback.CheckoutRequestID;
    const resultCode = String(stkCallback.ResultCode);

    if (!checkoutRequestID) {
      console.error("Invalid callback: missing CheckoutRequestID");
      res.status(400).json({ ResultCode: 1, ResultDesc: "Missing CheckoutRequestID" });
      return;
    }

    const attempt = await loadPaymentAttempt(checkoutRequestID);
    if (!attempt) {
      console.error(`Payment attempt not persisted for callback: ${checkoutRequestID}`);
      res.status(503).json({ ResultCode: 1, ResultDesc: "Payment attempt is not ready" });
      return;
    }

    if (resultCode === "4999") {
      res.json({ ResultCode: 0, ResultDesc: "Payment is still processing" });
      return;
    }

    if (resultCode !== "0") {
      await DB.MpesaPaymentAttempts.update(
        { status: "failed" },
        { where: { checkout_request_id: checkoutRequestID, status: "pending" } }
      );
      res.json({ ResultCode: 0, ResultDesc: "Payment failure recorded" });
      return;
    }

    const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];
    const getValue = (name: string): unknown => {
      const item = callbackMetadata.find((i: any) => i.Name === name);
      return item?.Value;
    };

    const callbackAmount = Number(getValue("Amount"));
    const callbackPhone = normalizeGuestPhone(String(getValue("PhoneNumber") || ""));
    if (Number.isFinite(callbackAmount) && callbackAmount !== Number(attempt.amount)) {
      console.error(`Callback amount mismatch for payment ${checkoutRequestID}`);
      res.status(400).json({ ResultCode: 1, ResultDesc: "Payment amount mismatch" });
      return;
    }
    if (callbackPhone && callbackPhone !== attempt.phone_number) {
      console.error(`Callback phone mismatch for payment ${checkoutRequestID}`);
      res.status(400).json({ ResultCode: 1, ResultDesc: "Payment phone mismatch" });
      return;
    }

    const transactionID = String(getValue("MpesaReceiptNumber") || "") || null;
    await DB.MpesaPaymentAttempts.update(
      {
        callback_amount: Number.isFinite(callbackAmount) ? callbackAmount : null,
        callback_phone: callbackPhone,
        transaction_id: transactionID,
      },
      { where: { checkout_request_id: checkoutRequestID } }
    );

    await confirmPaymentAndActivate({
      ...attempt,
      callback_amount: Number.isFinite(callbackAmount) ? callbackAmount : null,
      callback_phone: callbackPhone,
      transaction_id: transactionID,
    });
    res.json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (error) {
    console.error("M-Pesa callback error:", error);
    res.status(500).json({ ResultCode: 1, ResultDesc: "Internal error" });
  }
});

MpesaController.get("/verify/:checkoutRequestID", mpesaVerifyLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const checkoutID = utils.asString(req.params.checkoutRequestID);
    let attempt = await loadPaymentAttempt(checkoutID);
    if (!attempt) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    attempt = await confirmPaymentAndActivate(attempt);
    if (attempt.status === "completed" && attempt.activation_status === "completed") {
      res.json({ status: "success", transaction: toPaymentRecord(attempt) });
    } else if (attempt.status === "failed") {
      res.json({ status: "failed", error: "Payment was not completed" });
    } else {
      res.json({ status: "pending", message: "Payment is still being processed" });
    }
  } catch (error) {
    console.error("STK Query error:", error);
    res.status(503).json({ error: "Unable to verify payment right now" });
  }
});

MpesaController.post("/guest-session/clear", guestBrowserOriginMiddleware, (_req: Request, res: Response): void => {
  clearGuestSessionCookie(res);
  res.json({ success: true });
});

MpesaController.post("/guest-session/:checkoutRequestID", guestSessionLimiter, guestBrowserOriginMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const checkoutID = utils.asString(req.params.checkoutRequestID);
    const sessionKey = req.body?.guestSessionKey;
    const attempt = await loadPaymentAttempt(checkoutID);
    if (attempt) {
      if (attempt.business_metadata?.activationType !== "guestlessonactivation" ||
          attempt.status !== "completed" ||
          attempt.activation_status !== "completed") {
        res.status(403).json({ error: "A completed guest lesson payment is required" });
        return;
      }

      if (typeof sessionKey === "string" && sessionKey.length >= 32) {
        if (!attempt.guest_session_key_hash) {
          res.status(403).json({ error: "Invalid payment session key" });
          return;
        }

        const suppliedHash = Buffer.from(hashGuestSessionKey(sessionKey), "hex");
        const storedHash = Buffer.from(attempt.guest_session_key_hash, "hex");
        if (suppliedHash.length !== storedHash.length ||
            !crypto.timingSafeEqual(suppliedHash, storedHash)) {
          res.status(403).json({ error: "Invalid payment session key" });
          return;
        }
      } else {
        const recoveryPhone = normalizeGuestPhone(req.body?.phone);
        if (!recoveryPhone || recoveryPhone !== attempt.phone_number) {
          res.status(403).json({ error: "The phone number must match the completed payment" });
          return;
        }
      }

      setGuestSessionCookie(res, attempt.phone_number);
      res.json({ success: true, phone: attempt.phone_number });
      return;
    }

    const recoveryPhone = normalizeGuestPhone(req.body?.phone);
    if (!recoveryPhone) {
      res.status(400).json({ error: "A valid phone number is required to recover this payment session" });
      return;
    }

    const existingGrant = await DB.GuestLessonPayments.findOne({
      where: {
        checkout_request_id: checkoutID,
        phone: recoveryPhone,
        transaction_status: "completed",
      },
      raw: true,
    });
    if (!existingGrant ||
        Number(existingGrant.watch_time_limit_seconds) <= Number(existingGrant.watch_time_used_seconds)) {
      res.status(403).json({ error: "A completed guest lesson payment matching this phone is required" });
      return;
    }

    setGuestSessionCookie(res, recoveryPhone);
    res.json({ success: true, phone: recoveryPhone });
  } catch (error) {
    console.error("Guest session issuance failed:", error);
    res.status(500).json({ error: "Could not create guest session" });
  }
});

MpesaController.post("/b2c_callback", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = req.body;
    console.log("B2C Callback received:", JSON.stringify(result, null, 2));

    const conversationID = result.ConversationID || result.ConvID;
    const transactionID = result.TransactionID;

    if (!conversationID) {
      console.error("B2C Callback: No ConversationID found");
      res.json({ status: "received" });
      return;
    }

    const withdrawal = await DB.MarketerWithdrawals.findOne({
      where: { checkout_request_id: conversationID }
    });

    if (!withdrawal) {
      console.error("B2C Callback: Withdrawal not found for ConversationID:", conversationID);
      res.json({ status: "received" });
      return;
    }

    const resultCode = result.Result?.ResultCode || result.ResultCode;
    const resultDesc = result.Result?.ResultDesc || result.ResultDesc;

    if (resultCode === 0) {
      await withdrawal.update({
        status: 'completed',
        mpesa_receipt: transactionID || result.TransactionReceipt,
        mpesa_conversation_id: conversationID,
        processed_at: new Date(),
        remarks: 'Payment completed successfully'
      });

      const marketer = await DB.Marketers.findByPk(withdrawal.marketer_id);
      if (marketer) {
        const newWithdrawn = (parseFloat(marketer.withdrawn_earnings) || 0) + Number(withdrawal.amount);
        const newPending = (parseFloat(marketer.pending_earnings) || 0) - Number(withdrawal.amount);
        await marketer.update({
          withdrawn_earnings: newWithdrawn,
          pending_earnings: Math.max(0, newPending)
        });
      }

      console.log(`B2C Payment completed for withdrawal ${withdrawal.id}`);
    } else {
      await withdrawal.update({
        status: 'failed',
        mpesa_receipt: transactionID || null,
        processed_at: new Date(),
        remarks: resultDesc || 'Payment failed'
      });
      console.error(`B2C Payment failed for withdrawal ${withdrawal.id}:`, resultDesc);
    }

    res.json({ status: "received" });
  } catch (error) {
    console.error("B2C Callback error:", error);
    res.json({ status: "received" });
  }
});

MpesaController.post("/b2c_timeout", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = req.body;
    console.log("B2C Timeout received:", JSON.stringify(result, null, 2));

    const conversationID = result.ConversationID || result.ConvID;

    if (conversationID) {
      const withdrawal = await DB.MarketerWithdrawals.findOne({
        where: { checkout_request_id: conversationID }
      });

      if (withdrawal) {
        await withdrawal.update({
          status: 'failed',
          processed_at: new Date(),
          remarks: 'Payment timed out'
        });
        console.log(`B2C Payment timed out for withdrawal ${withdrawal.id}`);
      }
    }

    res.json({ status: "received" });
  } catch (error) {
    console.error("B2C Timeout error:", error);
    res.json({ status: "received" });
  }
});

MpesaController.post("/manualactivate", async (req: Request, res: Response): Promise<void> => {
  try {
    const checkoutID = utils.asString(req.body?.checkoutRequestID);

    if (!checkoutID) {
      res.status(400).json({ error: "Missing checkoutRequestID" });
      return;
    }

    let attempt = await loadPaymentAttempt(checkoutID);
    if (!attempt) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    attempt = await confirmPaymentAndActivate(attempt);
    if (attempt.status !== "completed") {
      res.status(400).json({ error: "Payment not completed" });
      return;
    }
    if (attempt.activation_status !== "completed") {
      res.status(503).json({ error: "Payment was confirmed but activation is pending. Retry shortly." });
      return;
    }
    res.json({ success: true, activated: true });
  } catch (error) {
    console.error("M-Pesa activation error:", error);
    res.status(500).json({ error: "Failed to activate" });
  }
});

export async function subscribedLessonActivation(
  checkoutRequestID: string,
  businessMetadata: Record<string, unknown>,
  record: { phoneNumber: string; amount: number; status: string; transactionID?: string; createdAt: Date },
  activationTransaction?: Transaction,
): Promise<{ success: boolean; message?: string; lessonId?: number; userId?: number; accessType?: string; expiresAt?: Date; error?: string }> {
  try {
    const lessonId = Number(businessMetadata.lessonId);
    const lessonIds = Array.isArray(businessMetadata.lessonIds)
      ? businessMetadata.lessonIds.map(Number)
      : [];
    const accountUserId = Number(businessMetadata.accountUserId);
    
    const lessonSetting = await DB.LessonSetting.findOne({
      where: { subscription_type: 'subscribed' },
      attributes: ["duration"],
      raw: true,
      transaction: activationTransaction,
    });
    
    if (!lessonSetting && businessMetadata.duration === undefined) {
      return { success: false, error: "Lesson pricing not configured for subscribers" };
    }
    
    const duration = Number(businessMetadata.duration ?? lessonSetting?.duration ?? 90);
    if (!Number.isInteger(duration) || duration <= 0) {
      return { success: false, error: "Subscriber lesson duration is invalid" };
    }
    
    const lessonsToActivate = lessonIds?.length > 0 ? lessonIds : (lessonId ? [lessonId] : []);
    if (lessonsToActivate.length === 0) {
      return { success: false, error: "No lesson(s) specified" };
    }
    
    const paidAmount = Number(record.amount);
    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      return { success: false, error: "Subscriber lesson payment amount is invalid" };
    }
    
    if (!Number.isInteger(accountUserId) || accountUserId <= 0) {
      return { success: false, error: "Authenticated account is required for subscriber lesson purchases" };
    }

    const existingUser = await DB.Users.findByPk(accountUserId, { transaction: activationTransaction });
    if (!existingUser) {
      return { success: false, error: "Subscriber account not found" };
    }
    const userId = (existingUser as unknown as { id: number }).id;
    const userPhone = normalizeGuestPhone((existingUser as unknown as { phone?: string }).phone)
      || (existingUser as unknown as { phone: string }).phone;
    
    const subscription = await DB.Subscriptions.findOne({
      where: {
        user_id: userId,
        status: 'active',
        expiry_date: { [op.gte]: new Date() },
      },
      transaction: activationTransaction,
    });
    if (!subscription) {
      return { success: false, error: "No active subscription" };
    }
    const priorTransaction = await DB.Transactions.findOne({
      where: { checkout_request_id: checkoutRequestID, user_id: userId },
      transaction: activationTransaction,
    });
    if (priorTransaction) {
      return {
        success: true,
        message: "Subscriber lesson purchase was already activated",
        lessonId: lessonsToActivate[0],
        userId,
        accessType: "subscribed",
      };
    }
    
    const lessonTrack = await DB.LessonTrack.findOne({
      where: { user_id: userId, subscription_id: subscription.id },
      transaction: activationTransaction,
    });
    if (lessonTrack && lessonTrack.lesson_balance > 0) {
      // Allow purchase - they can use credits or buy more
      // Just continue with activation
    }
    
    const expiresAt = new Date(Date.now() + duration * 60 * 1000);
    
    // Record purchase to purchases table
    const existingPurchase = await DB.Purchases.findOne({
      where: { checkout_request_id: checkoutRequestID, user_id: userId },
      transaction: activationTransaction,
    });
    if (!existingPurchase) {
      await DB.Purchases.create({
        user_id: userId,
        lesson_id: lessonId,
        phone_number: userPhone,
        checkout_request_id: checkoutRequestID,
        transaction_date: new Date(),
        transaction_status: 'success',
        payment_reference: record.transactionID || null,
        amount_paid: record.amount,
        expiry_date: expiresAt
      }, { transaction: activationTransaction });
    }

    for (const lid of lessonsToActivate) {
      const existingIndividualPayment = await DB.GuestLessonPayments.findOne({
        where: {
          phone: userPhone,
          lesson_id: lid,
          checkout_request_id: checkoutRequestID,
        },
        transaction: activationTransaction,
      });
      if (!existingIndividualPayment) {
        await DB.GuestLessonPayments.create({
          phone: userPhone,
          lesson_id: lid,
          checkout_request_id: checkoutRequestID,
          transaction_status: "completed",
          amount: Number(record.amount) / lessonsToActivate.length,
          paid_at: new Date(),
          expires_at: expiresAt,
          watch_time_limit_seconds: duration * 60,
          watch_time_used_seconds: 0,
        }, { transaction: activationTransaction });
      }

      const existingAccess = await DB.LessonAccessLogs.findOne({
        where: {
          phone: userPhone,
          lesson_id: lid,
          status: 'active',
          expires_at: { [op.gt]: new Date() }
        },
        transaction: activationTransaction,
      });
      
      if (existingAccess) continue;
      
      await DB.LessonAccessLogs.create({
        user_id: userId,
        phone: userPhone,
        lesson_id: lid,
        access_type: "subscribed",
        session_id: checkoutRequestID,
        expires_at: expiresAt,
        accessed_at: new Date(),
        watch_time: 0,
        status: "active"
      }, { transaction: activationTransaction });
    }

    await DB.Transactions.create({
      user_id: userId,
      phone_number: record.phoneNumber,
      amount: record.amount,
      checkout_request_id: checkoutRequestID,
      transaction_reference: record.transactionID || null,
      status: "success",
      payment_status: "completed",
      details_id: subscription.id,
      response_code: "0",
      response_description: "Subscriber lesson purchase successful",
    }, { transaction: activationTransaction });
    
    return {
      success: true,
      message: `Lesson access granted for ${lessonsToActivate.length} lesson(s)`,
      lessonId: lessonsToActivate[0],
      userId,
      accessType: "subscribed",
      expiresAt
    };
  } catch (error) {
    console.error("Subscribed lesson activation error:", error);
    return { success: false, error: "Failed to activate subscription" };
  }
}

export async function guestLessonActivation(
  checkoutRequestID: string,
  businessMetadata: Record<string, unknown>,
  record: { phoneNumber: string; amount: number; status: string; transactionID?: string; createdAt: Date }
): Promise<{ success: boolean; message?: string; lessonId?: number; userId?: number; accessType?: string; expiresAt?: Date; canResume?: boolean; error?: string }> {
  try {
    console.log('[guestLessonActivation] Starting with record:', record);
    const lessonId = businessMetadata.lessonId as number;
    const userPhone = record.phoneNumber;
    const durationMinutes = businessMetadata.duration
      ? parseInt(businessMetadata.duration as string, 10)
      : 90;
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    console.log('[guestLessonActivation] lessonId:', lessonId, 'phone:', userPhone);
    
    const existingAccess = await DB.LessonAccessLogs.findOne({
      where: {
        phone: userPhone,
        lesson_id: lessonId,
        status: 'active',
        expires_at: { [op.gt]: new Date() }
      },
      raw: true
    });
    console.log('[guestLessonActivation] existingAccess:', existingAccess);
    
    let existingUser = await DB.Users.findOne({ where: { phone: userPhone } });
    if (!existingUser) {
      const guestRole = await DB.Roles.findOne({ where: { role_name: 'Subscriber' } });
      const guestRoleId = (guestRole as unknown as { role_id: number })?.role_id || 3;
      const generatedUsercode = crypto.randomBytes(6).toString("hex").toUpperCase();
      const guestUsername = `guest_${userPhone.slice(-6)}`;
      existingUser = await DB.Users.create({
        username: guestUsername,
        phone: userPhone,
        usercode: utils.usercodeHash(generatedUsercode),
        user_role_id: guestRoleId,
        account_status: 'Active',
        status: 1,
      }) as unknown as { id: number };
    }
    const userId = (existingUser as unknown as { id: number }).id;
    
    const existingPayment = await DB.GuestLessonPayments.findOne({
      where: {
        phone: userPhone,
        lesson_id: lessonId,
        checkout_request_id: checkoutRequestID,
        transaction_status: 'completed'
      }
    });
    
    if (!existingPayment) {
      console.log('[guestLessonActivation] Creating guest_lesson_payments...');
      await DB.GuestLessonPayments.create({
        phone: userPhone,
        lesson_id: lessonId,
        checkout_request_id: checkoutRequestID,
        transaction_status: "completed",
        amount: record.amount,
        paid_at: new Date(),
        expires_at: expiresAt,
        watch_time_limit_seconds: durationMinutes * 60,
        watch_time_used_seconds: 0,
      });
      console.log('[guestLessonActivation] guest_lesson_payments created');
    }
    
    const existingAccessLog = await DB.LessonAccessLogs.findOne({
      where: {
        phone: userPhone,
        lesson_id: lessonId,
        session_id: checkoutRequestID
      }
    });
    
    if (!existingAccessLog && !existingAccess) {
      console.log('[guestLessonActivation] Creating lesson_access_logs...');
      await DB.LessonAccessLogs.create({
        user_id: userId,
        phone: userPhone,
        lesson_id: lessonId,
        access_type: "guest",
        session_id: checkoutRequestID,
        expires_at: expiresAt,
        accessed_at: new Date(),
        watch_time: 0,
        status: "active"
      });
      console.log('[guestLessonActivation] lesson_access_logs created');
    } else if (existingAccessLog || existingAccess) {
      console.log('[guestLessonActivation] Active lesson access already exists, preserving it');
    }

    const referralCode = businessMetadata.referralCode;
    if (typeof referralCode === "string" && referralCode.trim()) {
      b2hService.sendConversionWebhook(
        referralCode.trim(),
        "GUEST_LESSON_PURCHASE",
        record.amount,
        record.transactionID || checkoutRequestID,
        String(userId),
        userPhone,
      ).catch((err) => console.error("[B2H] Guest lesson referral webhook failed:", err));
    }
    
    return { 
      success: true, 
      message: "Lesson access purchased", 
      lessonId, 
      userId, 
      accessType: "guest",
      expiresAt
    };
  } catch (err) {
    console.error('[guestLessonActivation] Error:', err);
    console.error("Guest lesson activation error:", err);
    return { success: false, error: "Failed to activate lesson" };
  }
}

export async function weekendTutorialActivation(
  checkoutRequestID: string,
  businessMetadata: Record<string, unknown>,
  record: { phoneNumber: string; amount: number; status: string; transactionID?: string; createdAt: Date }
): Promise<{ success: boolean; message?: string; tutorialId?: number; error?: string }> {
  try {
    const tutorialId = businessMetadata.tutorial_id as number;
    const email = businessMetadata.email as string | undefined;
    const userPhone = record.phoneNumber;
    const tutorial = await DB.Scheduler.findOne({
      where: { id: tutorialId },
      attributes: ["learning_area", "start_date", "link", "grade"],
    });
    if (!tutorial) {
      return { success: false, error: "Tutorial not found" };
    }
    const existingUser = await DB.Users.findOne({ where: { phone: userPhone } });
    if (!existingUser) {
      return { success: false, error: "User not found. Please register first." };
    }
    const userId = (existingUser as unknown as { id: number }).id;
    const classDateTime = new Date(tutorial.start_date);
    const now = new Date();
    if (classDateTime <= now) {
      return { success: false, error: "Tutorial has already started" };
    }
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (7 - expiryDate.getDay()));
    expiryDate.setHours(23, 59, 59, 999);
    const purchaseData = {
      user_id: userId,
      transaction_date: record.createdAt.toISOString().slice(0, 19).replace("T", " "),
      transaction_status: "success",
      payment_reference: record.transactionID || checkoutRequestID,
      amount_paid: record.amount,
      expiry_date: expiryDate.toISOString().slice(0, 19).replace("T", " "),
      tutorial_id: tutorialId,
      phone: userPhone,
      email: email || null,
    };
    await DB.TutorialRegister.create(purchaseData);
    const tutorialSubject = tutorial.learning_area;
    const classStartTime = new Date(tutorial.start_date);
    classStartTime.setMinutes(classStartTime.getMinutes() - 15);
    const meetLink = tutorial.link || "http://bitstutorconnect.co.ke/weekendtutorials";
    const message = `Thank you for registering for your ${tutorialSubject} tutorial! Join class at ${classStartTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} (15min before start) via: ${meetLink}`;
    try {
      await sendSms(userPhone, message);
    } catch (smsErr) {
      console.error("SMS failed:", smsErr);
    }
    const referralCode = businessMetadata.referralCode as string | undefined;
    if (referralCode) {
      b2hService.sendConversionWebhook(
        referralCode,
        'TUTORIAL_REGISTRATION',
        record.amount,
        record.transactionID || checkoutRequestID,
        String(userId),
        userPhone,
      )
        .catch((err) => console.error('[B2H] Tutorial referral webhook failed:', err));
    }
    return { success: true, message: "Registered for weekend tutorial", tutorialId };
  } catch (err) {
    console.error("Weekend tutorial activation error:", err);
    return { success: false, error: "Failed to register" };
  }
}

export async function subscriptionActivation(
  checkoutRequestID: string,
  businessMetadata: Record<string, unknown>,
  record: { phoneNumber: string; amount: number; status: string; transactionID?: string },
  activationTransaction?: Transaction,
): Promise<{ success: boolean; message?: string; planId?: string; planName?: string; phoneNumber?: string; username?: string; usercode?: string; expiryDate?: string; isNewUser?: boolean; error?: string }> {
  try {
    const { planId, phoneNumber, email, name } = businessMetadata;
    const businessPlanId = planId as string | undefined;
    if (!businessPlanId) {
      return { success: false, error: "Missing planId" };
    }
    const requestedAccountPhone = normalizeGuestPhone(phoneNumber) || record.phoneNumber;
    const accountUserIdValue = Number(businessMetadata.accountUserId);
    const subscriptionPlan = await DB.SubscriptionTypes.findOne({
      where: { id: Number(businessPlanId) },
      transaction: activationTransaction,
    });
    if (!subscriptionPlan) {
      return { success: false, error: "Invalid plan ID" };
    }
    const packageRecord = await DB.Packages.findOne({
      where: { subscription_type_id: Number(businessPlanId) },
      order: [["id", "ASC"]],
      raw: true,
      transaction: activationTransaction,
    });
    if (!packageRecord) {
      return { success: false, error: "Subscription plan is not properly configured. Please contact support." };
    }
    const expectedAmount = Number(subscriptionPlan.membership_fee);
    if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
      return { success: false, error: "Subscription plan price is invalid" };
    }
    const paidAmount = Number(record.amount);
    if (paidAmount !== expectedAmount) {
      return { success: false, error: `Payment amount (${paidAmount}) does not match plan price (${expectedAmount})` };
    }
    const months = Number(subscriptionPlan.months);
    if (!Number.isInteger(months) || months <= 0) {
      return { success: false, error: "Subscription plan duration is invalid" };
    }
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);
    const generatedUsercode = crypto.randomBytes(4).toString("hex").toUpperCase();
    let existingUser = Number.isInteger(accountUserIdValue) && accountUserIdValue > 0
      ? await DB.Users.findByPk(accountUserIdValue, { transaction: activationTransaction })
      : await DB.Users.findOne({ where: { phone: requestedAccountPhone }, transaction: activationTransaction });
    if (Number.isInteger(accountUserIdValue) && accountUserIdValue > 0 && !existingUser) {
      return { success: false, error: "Authenticated account not found" };
    }
    const userPhone = existingUser
      ? String((existingUser as unknown as { phone: string }).phone || requestedAccountPhone)
      : requestedAccountPhone;
    const userEmail = existingUser
      ? (existingUser as unknown as { email?: string | null }).email || null
      : email as string | null || null;
    const generatedUsername = `user_${userPhone.slice(-8)}`;
    let userId: number;
    let isNewUser = false;
    if (existingUser) {
      userId = (existingUser as unknown as { id: number }).id;
    } else {
      const subscriberRole = await DB.Roles.findOne({
        where: { role_name: 'Subscriber' },
        transaction: activationTransaction,
      });
      const subscriberRoleId = (subscriberRole as unknown as { role_id: number })?.role_id || 3;
      const userData = {
        username: generatedUsername,
        phone: userPhone,
        email: userEmail,
        usercode: utils.usercodeHash(generatedUsercode),
        user_role_id: subscriberRoleId,
        account_status: 'Active',
        status: 1,
      };
      const newUser = await DB.Users.create(userData, { transaction: activationTransaction });
      userId = (newUser as unknown as { id: number }).id;
      isNewUser = true;
    }
    const priorTransaction = await DB.Transactions.findOne({
      where: { checkout_request_id: checkoutRequestID, user_id: userId },
      transaction: activationTransaction,
    });
    if (priorTransaction) {
      return {
        success: true,
        message: "Subscription was already activated",
        planId: String(businessPlanId),
        planName: (subscriptionPlan as unknown as { name: string }).name,
        phoneNumber: userPhone,
      };
    }
    let subscriptionId: number;
    let expiryDateForLessons = expiryDate;
    const existingSubscription = await DB.Subscriptions.findOne({
      where: { user_id: userId, status: 'active' },
      transaction: activationTransaction,
    });
    if (existingSubscription) {
      const currentExpiry = new Date(existingSubscription.expiry_date);
      if (currentExpiry > new Date()) {
        currentExpiry.setMonth(currentExpiry.getMonth() + months);
        await DB.Subscriptions.update(
          {
            expiry_date: currentExpiry,
            subscription_type_id: Number(businessPlanId),
          },
          { where: { id: existingSubscription.id }, transaction: activationTransaction }
        );
        subscriptionId = existingSubscription.id;
        expiryDateForLessons = currentExpiry;
      } else {
        await DB.Subscriptions.update(
          { start_date: startDate, expiry_date: expiryDate, status: 'active', phone_no: userPhone, subscription_type_id: Number(businessPlanId) },
          { where: { id: existingSubscription.id }, transaction: activationTransaction }
        );
        subscriptionId = existingSubscription.id;
        expiryDateForLessons = expiryDate;
      }
    } else {
      const newSubscription = await DB.Subscriptions.create({
        user_id: userId,
        subscription_type_id: Number(businessPlanId),
        status: 'active',
        start_date: startDate,
        expiry_date: expiryDate,
        phone_no: userPhone,
        subscription_code: checkoutRequestID,
      }, { transaction: activationTransaction });
      subscriptionId = newSubscription.id;
      expiryDateForLessons = expiryDate;
    }
    const existingPurchase = await DB.Purchases.findOne({
      where: { checkout_request_id: checkoutRequestID, user_id: userId },
      transaction: activationTransaction,
    });
    if (!existingPurchase) {
      await DB.Purchases.create({
        user_id: userId,
        package_id: packageRecord.id,
        transaction_date: startDate,
        transaction_status: 'success',
        payment_reference: checkoutRequestID,
        checkout_request_id: checkoutRequestID,
        amount_paid: record.amount,
        expiry_date: expiryDateForLessons,
      }, { transaction: activationTransaction });
    }
    const packageIdForLessons = packageRecord.id;
    const packageWatchTimeSeconds = Number(packageRecord.watch_time_minutes || 0) * 60;
    const lessontrack = await DB.LessonTrack.findOne({
      where: { user_id: userId, subscription_id: subscriptionId },
      transaction: activationTransaction,
    });
    if (lessontrack) {
      const currentExpires = new Date(lessontrack.expires_at);
      if (currentExpires > new Date()) {
        currentExpires.setMonth(currentExpires.getMonth() + months);
        await lessontrack.update({
          expires_at: currentExpires,
          status: 'active',
          total_watch_time_seconds: Number(lessontrack.total_watch_time_seconds || 0) + packageWatchTimeSeconds,
          remaining_watch_time_seconds: Number(lessontrack.remaining_watch_time_seconds || 0) + packageWatchTimeSeconds,
          total_lessons: Number(lessontrack.total_lessons || 0) + Number(packageRecord.no_of_lessons || 0),
          lesson_balance: Number(lessontrack.lesson_balance || 0) + Number(packageRecord.no_of_lessons || 0),
        }, { transaction: activationTransaction });
      } else {
        await DB.SubscriptionLessonUsage.destroy({
          where: { subscription_id: subscriptionId },
          transaction: activationTransaction,
        });
        await lessontrack.update({
          expires_at: expiryDateForLessons,
          lessons_viewed: 0,
          status: 'active',
          package_id: packageIdForLessons,
          total_lessons: Number(packageRecord.no_of_lessons || 0),
          lesson_balance: Number(packageRecord.no_of_lessons || 0),
          total_watch_time_seconds: packageWatchTimeSeconds,
          remaining_watch_time_seconds: packageWatchTimeSeconds,
        }, { transaction: activationTransaction });
      }
    } else {
      await DB.LessonTrack.create({
        subscription_id: subscriptionId,
        user_id: userId,
        package_id: packageIdForLessons,
        lessons_viewed: 0,
        lesson_balance: packageRecord.no_of_lessons || 10,
        total_lessons: packageRecord.no_of_lessons || 10,
        total_watch_time_seconds: packageWatchTimeSeconds,
        remaining_watch_time_seconds: packageWatchTimeSeconds,
        status: 'active',
        expires_at: expiryDateForLessons,
      }, { transaction: activationTransaction });
    }
    const existingActiveSub = await DB.ActiveSubscriptions.findOne({
      where: { phone: userPhone, status: "Active" },
      transaction: activationTransaction,
    });
    if (existingActiveSub) {
      const currentExpiry = new Date(existingActiveSub.expiry_date);
      if (currentExpiry > new Date()) {
        currentExpiry.setMonth(currentExpiry.getMonth() + months);
        await DB.ActiveSubscriptions.update(
          { expiry_date: currentExpiry },
          { where: { id: existingActiveSub.id }, transaction: activationTransaction }
        );
      } else {
        await DB.ActiveSubscriptions.update(
          { start_date: startDate, expiry_date: expiryDateForLessons, status: "Active" },
          { where: { id: existingActiveSub.id }, transaction: activationTransaction }
        );
      }
    } else {
      await DB.ActiveSubscriptions.create({
        username: generatedUsername,
        phone: userPhone,
        email: userEmail,
        subscription_code: checkoutRequestID,
        status: "Active",
        start_date: startDate,
        expiry_date: expiryDateForLessons,
      }, { transaction: activationTransaction });
    }
    try {
      const transaction = await DB.Transactions.create({
        user_id: userId,
        phone_number: record.phoneNumber,
        amount: record.amount,
        checkout_request_id: checkoutRequestID,
        transaction_reference: record.transactionID || null,
        status: 'success',
        payment_status: 'completed',
        details_id: subscriptionId,
        response_code: '0',
        response_description: 'Payment successful',
      }, { transaction: activationTransaction });
      await DB.Subscriptions.update(
        { transaction_id: transaction.id },
        { where: { id: subscriptionId }, transaction: activationTransaction }
      );
    } catch (txErr) {
      console.error('Failed to create transaction record:', txErr);
      throw txErr;
    }
    const sendActivationNotifications = async () => {
      const referralCode = businessMetadata.referralCode as string | undefined;
      if (referralCode) {
        b2hService.sendConversionWebhook(
          referralCode,
          'SUBSCRIPTION_PURCHASE',
          record.amount,
          record.transactionID || checkoutRequestID,
          String(userId),
          userPhone,
        )
          .catch((err) => console.error('[B2H] Subscription referral webhook failed:', err));
      }

      const smsMessage = isNewUser
        ? `Welcome to BTC! Your login credentials:\nUsername: ${generatedUsername}\nUsercode: ${generatedUsercode}\nPhone: ${userPhone}\nVisit https://bitstutorconnect.co.ke to login.`
        : `Your BTC subscription has been activated!\nPlan: ${(subscriptionPlan as unknown as { name: string }).name}\nExpires: ${expiryDate.toDateString()}`;
      try {
        await sendSms(userPhone, smsMessage);
      } catch (smsErr) {
        console.error("SMS sending failed:", smsErr);
      }

      if (userEmail) {
        const emailSubject = isNewUser ? "Welcome to BTC - Account Created" : "BTC Subscription Activated";
        const emailBody = isNewUser
          ? `<h2>Welcome to BTC!</h2><p>Your account has been created successfully.</p><p><strong>Username:</strong> ${generatedUsername}<br><strong>Usercode:</strong> ${generatedUsercode}</p><p>Login at: https://bitstutorconnect.co.ke</p>`
          : `<h2>Subscription Activated</h2><p>Your BTC subscription has been activated.</p><p><strong>Plan:</strong> ${(subscriptionPlan as unknown as { name: string }).name}<br><strong>Expires:</strong> ${expiryDate.toDateString()}</p>`;
        try {
          await mailer.sendMail(userEmail, emailSubject, emailBody);
        } catch (emailErr) {
          console.error("Email sending failed:", emailErr);
        }
      }
    };
    if (activationTransaction) {
      activationTransaction.afterCommit(sendActivationNotifications);
    } else {
      await sendActivationNotifications();
    }

     return { 
       success: true, 
       message: "Subscription activated successfully",
       planId: String(businessPlanId),
       planName: (subscriptionPlan as unknown as { name: string }).name,
       phoneNumber: userPhone,
       expiryDate: expiryDate.toISOString(),
       isNewUser
     };
   } catch (error) {
    console.error("Subscription activation error:", error);
    return { success: false, error: "Failed to activate subscription" };
  }
}

export async function packageActivation(
  checkoutRequestID: string,
  businessMetadata: Record<string, unknown>,
  record: { phoneNumber: string; amount: number; status: string; transactionID?: string },
  activationTransaction?: Transaction,
): Promise<{ success: boolean; message?: string; packageId?: number; packageName?: string; phoneNumber?: string; username?: string; usercode?: string; expiryDate?: string; isNewUser?: boolean; lessonsAdded?: number; checkoutRequestID?: string; error?: string }> {
  try {
    const { planId, phoneNumber, email } = businessMetadata;
    const packageId = Number(planId);
    if (!Number.isInteger(packageId) || packageId <= 0) {
      return { success: false, error: "Missing packageId" };
    }
    const activationType = String(businessMetadata.activationType || "package");
    const accountUserId = Number(businessMetadata.accountUserId);
    const requestedAccountPhone = normalizeGuestPhone(phoneNumber) || record.phoneNumber;

    // Look up the specific package
    const packageRecord = await DB.Packages.findOne({
      where: { id: Number(packageId) },
      raw: true,
      transaction: activationTransaction,
    });
    if (!packageRecord) {
      return { success: false, error: "Invalid package ID" };
    }

    // Validate payment amount matches package fee
    let expectedAmount = Number(packageRecord.fee);
    if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
      return { success: false, error: "Package price is invalid" };
    }
    let subscriptionPlan: Record<string, unknown> | null = null;
    if (activationType === "package_with_subscription") {
      const requestedPlanId = Number(businessMetadata.subscriptionPlanId);
      subscriptionPlan = await DB.SubscriptionTypes.findByPk(requestedPlanId, {
        raw: true,
        transaction: activationTransaction,
      }) as unknown as Record<string, unknown> | null;
      if (!subscriptionPlan ||
          Number(subscriptionPlan.id) !== Number(packageRecord.subscription_type_id)) {
        return { success: false, error: "Package subscription plan does not match" };
      }
      expectedAmount += Number(subscriptionPlan.membership_fee);
      if (!Number.isFinite(expectedAmount) || expectedAmount <= Number(packageRecord.fee)) {
        return { success: false, error: "Subscription plan price is invalid" };
      }
    }
    const paidAmount = Number(record.amount);
    if (paidAmount !== expectedAmount) {
      return { success: false, error: `Payment amount (${paidAmount}) does not match package price (${expectedAmount})` };
    }

    // Calculate expiry based on package duration
    const startDate = new Date();
    const expiryDate = new Date();
    const durationAmount = Number(packageRecord.duration_amount) || 30;
    const durationUnit = packageRecord.duration_unit || 'days';
    if (durationUnit === 'months') {
      expiryDate.setMonth(expiryDate.getMonth() + durationAmount);
    } else if (durationUnit === 'years') {
      expiryDate.setFullYear(expiryDate.getFullYear() + durationAmount);
    } else {
      expiryDate.setDate(expiryDate.getDate() + durationAmount);
    }

    const generatedUsercode = crypto.randomBytes(4).toString("hex").toUpperCase();
    let existingUser = Number.isInteger(accountUserId) && accountUserId > 0
      ? await DB.Users.findByPk(accountUserId, { transaction: activationTransaction })
      : await DB.Users.findOne({ where: { phone: requestedAccountPhone }, transaction: activationTransaction });
    if (Number.isInteger(accountUserId) && accountUserId > 0 && !existingUser) {
      return { success: false, error: "Authenticated account not found" };
    }
    const userPhone = existingUser
      ? String((existingUser as unknown as { phone: string }).phone || requestedAccountPhone)
      : requestedAccountPhone;
    const userEmail = existingUser
      ? (existingUser as unknown as { email?: string | null }).email || null
      : email as string | null || null;
    const generatedUsername = `user_${userPhone.slice(-8)}`;

    let userId: number;
    let isNewUser = false;
    if (existingUser) {
      userId = (existingUser as unknown as { id: number }).id;
    } else {
      const subscriberRole = await DB.Roles.findOne({
        where: { role_name: 'Subscriber' },
        transaction: activationTransaction,
      });
      const subscriberRoleId = (subscriberRole as unknown as { role_id: number })?.role_id || 3;
      const userData = {
        username: generatedUsername,
        phone: userPhone,
        email: userEmail,
        usercode: utils.usercodeHash(generatedUsercode),
        user_role_id: subscriberRoleId,
        account_status: 'Active',
        status: 1,
      };
      const newUser = await DB.Users.create(userData, { transaction: activationTransaction });
      userId = (newUser as unknown as { id: number }).id;
      isNewUser = true;
    }

    const priorTransaction = await DB.Transactions.findOne({
      where: { checkout_request_id: checkoutRequestID, user_id: userId },
      transaction: activationTransaction,
    });
    if (priorTransaction) {
      return {
        success: true,
        message: "Package was already activated",
        checkoutRequestID,
        packageId: packageRecord.id,
        packageName: packageRecord.name,
        phoneNumber: userPhone,
      };
    }

    // Find or create subscription (packages are tied to subscription_type)
    const subscriptionTypeId = subscriptionPlan
      ? Number(subscriptionPlan.id)
      : Number(packageRecord.subscription_type_id);
    let subscriptionId: number;
    let expiryDateForLessons = expiryDate;
    let subscriptionExpiryDate = expiryDate;
    const combinedPlanMonths = subscriptionPlan ? Number(subscriptionPlan.months) : 0;
    if (subscriptionPlan && (!Number.isInteger(combinedPlanMonths) || combinedPlanMonths <= 0)) {
      return { success: false, error: "Subscription plan duration is invalid" };
    }
    if (subscriptionPlan) {
      subscriptionExpiryDate = new Date(startDate);
      subscriptionExpiryDate.setMonth(subscriptionExpiryDate.getMonth() + combinedPlanMonths);
    }

    const existingSubscription = await DB.Subscriptions.findOne({
      where: { user_id: userId, status: 'active' },
      transaction: activationTransaction,
    });

    if (existingSubscription) {
      // Extend existing subscription expiry
      const currentExpiry = new Date(existingSubscription.expiry_date);
      if (currentExpiry > new Date()) {
        if (subscriptionPlan) {
          currentExpiry.setMonth(currentExpiry.getMonth() + combinedPlanMonths);
        } else {
          currentExpiry.setTime(currentExpiry.getTime() + (expiryDate.getTime() - startDate.getTime()));
        }
        await DB.Subscriptions.update(
          { expiry_date: currentExpiry, subscription_type_id: subscriptionTypeId },
          { where: { id: existingSubscription.id }, transaction: activationTransaction }
        );
        subscriptionId = existingSubscription.id;
        if (!subscriptionPlan) subscriptionExpiryDate = currentExpiry;
      } else {
        await DB.Subscriptions.update(
          { start_date: startDate, expiry_date: subscriptionExpiryDate, status: 'active', phone_no: userPhone, subscription_type_id: subscriptionTypeId },
          { where: { id: existingSubscription.id }, transaction: activationTransaction }
        );
        subscriptionId = existingSubscription.id;
        expiryDateForLessons = expiryDate;
        if (!subscriptionPlan) subscriptionExpiryDate = expiryDate;
      }
    } else {
      const newSubscription = await DB.Subscriptions.create({
        user_id: userId,
        subscription_type_id: subscriptionTypeId,
        status: 'active',
        start_date: startDate,
        expiry_date: subscriptionExpiryDate,
        phone_no: userPhone,
        subscription_code: checkoutRequestID,
      }, { transaction: activationTransaction });
      subscriptionId = newSubscription.id;
      expiryDateForLessons = expiryDate;
      if (!subscriptionPlan) subscriptionExpiryDate = expiryDate;
    }

    const existingPurchase = await DB.Purchases.findOne({
      where: { checkout_request_id: checkoutRequestID, user_id: userId },
      transaction: activationTransaction,
    });
    if (!existingPurchase) {
      await DB.Purchases.create({
        user_id: userId,
        package_id: packageRecord.id,
        transaction_date: startDate,
        transaction_status: 'success',
        payment_reference: record.transactionID || checkoutRequestID,
        checkout_request_id: checkoutRequestID,
        amount_paid: record.amount,
        expiry_date: expiryDate,
      }, { transaction: activationTransaction });
    }

    // Find existing lesson track for this subscription
    const lessontrack = await DB.LessonTrack.findOne({
      where: { user_id: userId, subscription_id: subscriptionId },
      transaction: activationTransaction,
    });

    const lessonsToAdd = packageRecord.no_of_lessons || 10;
    const packageWatchTimeSeconds = Number(packageRecord.watch_time_minutes || 0) * 60;

    if (lessontrack) {
      // TOP-UP: Extend expiry and add lessons to existing track
      const currentExpires = new Date(lessontrack.expires_at);
      if (currentExpires > new Date()) {
        // Add package duration to existing expiry
        currentExpires.setTime(currentExpires.getTime() + (expiryDate.getTime() - startDate.getTime()));
        await lessontrack.update({
          expires_at: currentExpires,
          package_id: packageRecord.id,
          lesson_balance: (lessontrack.lesson_balance || 0) + lessonsToAdd,
          total_lessons: (lessontrack.total_lessons || 0) + lessonsToAdd,
          total_watch_time_seconds: Number(lessontrack.total_watch_time_seconds || 0) + packageWatchTimeSeconds,
          remaining_watch_time_seconds: Number(lessontrack.remaining_watch_time_seconds || 0) + packageWatchTimeSeconds,
          status: 'active'
        }, { transaction: activationTransaction });
        console.log(`Package top-up: Added ${lessonsToAdd} lessons to existing track. New balance: ${(lessontrack.lesson_balance || 0) + lessonsToAdd}`);
      } else {
        await DB.SubscriptionLessonUsage.destroy({
          where: { subscription_id: subscriptionId },
          transaction: activationTransaction,
        });
        // Expired track - renew with new lessons
        await lessontrack.update({
          expires_at: expiryDateForLessons,
          lessons_viewed: 0,
          lesson_balance: lessonsToAdd,
          total_lessons: lessonsToAdd,
          total_watch_time_seconds: packageWatchTimeSeconds,
          remaining_watch_time_seconds: packageWatchTimeSeconds,
          status: 'active',
          package_id: packageRecord.id
        }, { transaction: activationTransaction });
        console.log(`Package renewed: Set to ${lessonsToAdd} lessons`);
      }
    } else {
      // NEW: Create lesson track
      await DB.LessonTrack.create({
        subscription_id: subscriptionId,
        user_id: userId,
        package_id: packageRecord.id,
        lessons_viewed: 0,
        lesson_balance: lessonsToAdd,
        total_lessons: lessonsToAdd,
        total_watch_time_seconds: packageWatchTimeSeconds,
        remaining_watch_time_seconds: packageWatchTimeSeconds,
        status: 'active',
        expires_at: expiryDateForLessons,
      }, { transaction: activationTransaction });
      console.log(`New lesson track: ${lessonsToAdd} lessons`);
    }

    // Update active subscription
    const existingActiveSub = await DB.ActiveSubscriptions.findOne({
      where: { phone: userPhone, status: "Active" },
      transaction: activationTransaction,
    });
    if (existingActiveSub) {
      const currentExpiry = new Date(existingActiveSub.expiry_date);
      if (currentExpiry > new Date()) {
        if (subscriptionPlan) {
          currentExpiry.setMonth(currentExpiry.getMonth() + combinedPlanMonths);
        } else {
          currentExpiry.setTime(currentExpiry.getTime() + (expiryDate.getTime() - startDate.getTime()));
        }
        await DB.ActiveSubscriptions.update(
          { expiry_date: currentExpiry },
          { where: { id: existingActiveSub.id }, transaction: activationTransaction }
        );
      } else {
        await DB.ActiveSubscriptions.update(
          { start_date: startDate, expiry_date: subscriptionExpiryDate, status: "Active" },
          { where: { id: existingActiveSub.id }, transaction: activationTransaction }
        );
      }
    } else {
      await DB.ActiveSubscriptions.create({
        username: generatedUsername,
        phone: userPhone,
        email: userEmail,
        subscription_code: checkoutRequestID,
        status: "Active",
        start_date: startDate,
        expiry_date: subscriptionExpiryDate,
      }, { transaction: activationTransaction });
    }

    // Create transaction record
    try {
      const transaction = await DB.Transactions.create({
        user_id: userId,
        phone_number: record.phoneNumber,
        amount: record.amount,
        checkout_request_id: checkoutRequestID,
        transaction_reference: record.transactionID || null,
        status: 'success',
        payment_status: 'completed',
        details_id: subscriptionId,
        response_code: '0',
        response_description: 'Package purchase successful',
      }, { transaction: activationTransaction });
      await DB.Subscriptions.update(
        { transaction_id: transaction.id },
        { where: { id: subscriptionId }, transaction: activationTransaction }
      );
    } catch (txErr) {
      console.error('Failed to create transaction record:', txErr);
      throw txErr;
    }

    const sendActivationNotifications = async () => {
      const referralCode = businessMetadata.referralCode as string | undefined;
      if (referralCode) {
        b2hService.sendConversionWebhook(
          referralCode,
          'PACKAGE_PURCHASE',
          record.amount,
          record.transactionID || checkoutRequestID,
          String(userId),
          userPhone,
        )
          .catch((err) => console.error('[B2H] Package referral webhook failed:', err));
      }

      const smsMessage = isNewUser
        ? `Welcome to BTC! Your account is created. Package: ${packageRecord.name}. Lessons: ${lessonsToAdd}. Username: ${generatedUsername}, Usercode: ${generatedUsercode}`
        : `Package purchased: ${packageRecord.name}. ${lessonsToAdd} lessons added. Expires: ${expiryDateForLessons.toDateString()}`;
      try {
        await sendSms(userPhone, smsMessage);
      } catch (smsErr) {
        console.error("SMS sending failed:", smsErr);
      }

      if (userEmail) {
        const emailSubject = isNewUser ? "Welcome to BTC - Account & Package Created" : "BTC Package Purchased";
        const emailBody = isNewUser
          ? `<h2>Welcome to BTC!</h2><p>Your account and package have been created.</p><p><strong>Package:</strong> ${packageRecord.name}<br><strong>Lessons:</strong> ${lessonsToAdd}<br><strong>Username:</strong> ${generatedUsername}<br><strong>Usercode:</strong> ${generatedUsercode}</p>`
          : `<h2>Package Purchased</h2><p><strong>Package:</strong> ${packageRecord.name}</p><p><strong>Lessons added:</strong> ${lessonsToAdd}</p><p><strong>Expires:</strong> ${expiryDateForLessons.toDateString()}</p>`;
        try {
          await mailer.sendMail(userEmail, emailSubject, emailBody);
        } catch (emailErr) {
          console.error("Email sending failed:", emailErr);
        }
      }
    };
    if (activationTransaction) {
      activationTransaction.afterCommit(sendActivationNotifications);
    } else {
      await sendActivationNotifications();
    }

    console.log(`Package activated for ${userPhone}, package: ${packageRecord.name}, lessons: ${lessonsToAdd}, userId: ${userId}`);
    return {
      success: true,
      message: "Package activated successfully",
      checkoutRequestID,
      packageId: packageRecord.id,
      packageName: packageRecord.name,
      phoneNumber: userPhone,
      username: generatedUsername,
      usercode: generatedUsercode,
      expiryDate: expiryDateForLessons.toISOString(),
      isNewUser,
      lessonsAdded: lessonsToAdd,
    };
  } catch (error) {
    console.error("Package activation error:", error);
    return { success: false, error: "Failed to activate package" };
  }
}

export default MpesaController;
