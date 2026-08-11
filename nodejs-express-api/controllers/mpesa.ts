import express, { Request, Response } from "express";
import { Op } from "sequelize";
import mpesaService from "../helpers/MpesaService.js";
import {
  StkPushRequest} from "../types/mpesa.js";
import DB, { op as sequelizeOp } from "../models/db.js";
import { sendSms } from "../helpers/sms.js";
import mailer from "../helpers/mailer.js";
import utils from "../helpers/utils.js";
import crypto from "crypto";
import transactionStore from "../helpers/transactionStore.js";
import { b2hService } from "../services/b2hIntegrationService.js";

const MpesaController = express.Router();
const op = DB.op || sequelizeOp || Op;

MpesaController.post("/push", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      amount,
      phoneNumber,
      accountReference,
      businessMetadata,
    }: StkPushRequest = req.body;

    if (!amount || !phoneNumber || !accountReference) {
      res.status(400).json({
        error: "Missing required fields: amount, phoneNumber, accountReference",
      });
      return;
    }

    const cleanPhone = phoneNumber.replace(/^0/, "254").replace(/\D/g, "");
    if (!cleanPhone.startsWith("254") || cleanPhone.length !== 12) {
      res.status(400).json({
        error: "Invalid phone number. Use format: 254XXXXXXXXX",
      });
      return;
    }

    const normalizedBusinessMetadata = businessMetadata || {};
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
      amount,
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
      transactionStore.set(response.CheckoutRequestID, {
        checkoutRequestID: response.CheckoutRequestID,
        phoneNumber: cleanPhone,
        amount,
        accountReference,
        businessMetadata: normalizedBusinessMetadata,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      res.json({
        success: true,
        checkoutRequestID: response.CheckoutRequestID,
        merchantRequestID: response.MerchantRequestID,
        message: response.CustomerMessage || "STK push sent",
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
    // Safaricom sends: { Body: { stkCallback: { CheckoutRequestID, ResultCode, ... } } }
    const stkCallback = (req.body as any)?.Body?.stkCallback;
    if (!stkCallback) {
      console.error("Invalid callback: missing Body.stkCallback", req.body);
      res.status(400).json({ ResultCode: 1, ResultDesc: "Invalid payload" });
      return;
    }

    const checkoutRequestID = stkCallback.CheckoutRequestID;
    const resultCode = String(stkCallback.ResultCode);
    const resultDesc = stkCallback.ResultDesc || "Callback received";

    if (!checkoutRequestID) {
      console.error("Invalid callback: missing CheckoutRequestID");
      res.status(400).json({ ResultCode: 1, ResultDesc: "Missing CheckoutRequestID" });
      return;
    }

    const record = transactionStore.get(checkoutRequestID);
    if (!record) {
      console.error(`Transaction not found in store: ${checkoutRequestID}`);
      // Still return 200 to avoid M-Pesa retries
      res.json({ ResultCode: 0, ResultDesc: "Success" });
      return;
    }

    // Update status based on ResultCode
    // "0" = Success, "4999" = Still processing (keep pending), others = Failed
    if (resultCode === "0") {
      record.status = "completed";
    } else if (resultCode === "4999") {
      record.status = "pending"; // Still processing
    } else {
      record.status = "failed";
    }

    // Extract transaction details from callback metadata if available
    const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];
    const getValue = (name: string): string | undefined => {
      const item = callbackMetadata.find((i: any) => i.Name === name);
      return item ? String(item.Value) : undefined;
    };

    if (resultCode === "0") {
      record.transactionID = getValue("MpesaTransID") || undefined;
      record.updatedAt = new Date();
      console.log(`Payment completed: ${checkoutRequestID}, transaction: ${record.transactionID}`);
      
      // Trigger activation based on activationType
      const businessMetadata = record.businessMetadata as Record<string, unknown> || {};
      const activationType = businessMetadata.activationType as string;
      
      if (activationType) {
        try {
          switch (activationType) {
            case "subscription": {
              await subscriptionActivation(checkoutRequestID, businessMetadata, record);
              break;
            }
            case "package":
            case "packages": {
              await packageActivation(checkoutRequestID, businessMetadata, record);
              break;
            }
            case "subscribelessonactivation": {
              await subscribedLessonActivation(checkoutRequestID, businessMetadata, record);
              break;
            }
            case "guestlessonactivation": {
              await guestLessonActivation(checkoutRequestID, businessMetadata, record);
              break;
            }
            case "weekendTutorial": {
              await weekendTutorialActivation(checkoutRequestID, businessMetadata, record);
              break;
            }
          }
        } catch (actErr) {
          console.error(`Activation error for ${checkoutRequestID}:`, actErr);
        }
      }
    } else if (resultCode !== "4999") {
      record.updatedAt = new Date();
      console.log(`Payment failed/processing: ${checkoutRequestID}, code: ${resultCode}, desc: ${resultDesc}`);
    } else {
      // Still processing, just log
      console.log(`Payment still processing: ${checkoutRequestID}`);
    }

    res.json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (error) {
    console.error("M-Pesa callback error:", error);
    res.status(500).json({ ResultCode: 1, ResultDesc: "Internal error" });
  }
});

MpesaController.get("/verify/:checkoutRequestID", async (req: Request, res: Response): Promise<void> => {
   const { checkoutRequestID } = req.params;
   const checkoutID = utils.asString(checkoutRequestID);
   const transaction = transactionStore.get(checkoutID);

  if (!transaction) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  if ((transaction.status as string) === "completed") {
    res.json({ status: "success", transaction });
    return;
  }

  if (transaction.status === "failed") {
    res.json({ status: "failed", error: transaction.updatedAt.toISOString() });
    return;
  }

  // Query Safaricom directly for status if local status is pending
  try {
    const queryResult = await mpesaService.queryStkStatus(checkoutID);
    
    if ("error" in queryResult) {
      res.json({ status: "pending", message: "Transaction still being processed" });
      return;
    }

    const resultCode = String(queryResult.ResultCode || queryResult.ResultCode);
    
    // Update local transaction based on Safaricom response
    if (resultCode === "0") {
      transaction.status = "completed";
      // @ts-expect-error - MpesaReceiptNumber is in the actual response but not in type definition
      transaction.transactionID = queryResult.MpesaReceiptNumber || queryResult.TransID || undefined;
      transaction.updatedAt = new Date();
      
      // Trigger activation for completed payment
      const businessMetadata = transaction.businessMetadata as Record<string, unknown> || {};
      const activationType = businessMetadata.activationType as string;
      
      console.log(`STK Query indicates success for ${checkoutID}, triggering activation`);
      
      if (activationType) {
        try {
          switch (activationType) {
            case "subscription": {
              await subscriptionActivation(checkoutID, businessMetadata, transaction);
              break;
            }
            case "package":
            case "packages": {
              await packageActivation(checkoutID, businessMetadata, transaction);
              break;
            }
            case "subscribelessonactivation": {
              await subscribedLessonActivation(checkoutID, businessMetadata, transaction);
              break;
            }
            case "guestlessonactivation": {
              await guestLessonActivation(checkoutID, businessMetadata, transaction);
              break;
            }
            case "weekendTutorial": {
              await weekendTutorialActivation(checkoutID, businessMetadata, transaction);
              break;
            }
          }
        } catch (actErr) {
          console.error(`Activation error for ${checkoutID}:`, actErr);
        }
      }
      
      res.json({ status: "success", transaction });
    } else if (resultCode === "4999") {
      res.json({ status: "pending", message: "Transaction still being processed" });
    } else {
      transaction.status = "failed";
      transaction.error = queryResult.ResultDesc || "Payment failed";
      transaction.updatedAt = new Date();
      res.json({ status: "failed", error: transaction.error });
    }
  } catch (queryError) {
    console.error("STK Query error:", queryError);
    res.json({ status: "pending", message: "Transaction still being processed" });
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
    const { checkoutRequestID, ...overrides } = req.body;
    const checkoutID = utils.asString(checkoutRequestID);

    if (!checkoutID) {
      res.status(400).json({ error: "Missing checkoutRequestID" });
      return;
    }

    const record = transactionStore.get(checkoutID);
    if (!record) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    if (record.status !== "completed") {
      res.status(400).json({ error: "Payment not completed" });
      return;
    }

    const metadata = { ...record.businessMetadata, ...overrides };
    const activationType = metadata.activationType as string | undefined;

    console.log(`Activation request: type=${activationType}, checkoutId=${checkoutID}`);

    switch (activationType) {
      case "subscription": {
        const result = await subscriptionActivation(checkoutID, metadata, record);
        if (!result.success) {
          res.status(400).json({ error: result.error });
          return;
        }
        res.json(result);
        break;
      }

      case "package":
      case "packages": {
        const result = await packageActivation(checkoutID, metadata, record);
        if (!result.success) {
          res.status(400).json({ error: result.error });
          return;
        }
        res.json(result);
        break;
      }

      case "subscribelessonactivation": {
        const result = await subscribedLessonActivation(checkoutID, metadata, record);
        if (!result.success) {
          res.status(400).json({ error: result.error });
          return;
        }
        res.json(result);
        break;
      }

      case "weekendTutorial": {
        const result = await weekendTutorialActivation(checkoutID, metadata, record);
        if (!result.success) {
          res.status(400).json({ error: result.error });
          return;
        }
        res.json(result);
        break;
      }

      case "guestlessonactivation": {
        const result = await guestLessonActivation(checkoutID, metadata, record);
        if (!result.success) {
          res.status(400).json({ error: result.error });
          return;
        }
        res.json(result);
        break;
      }

      default:
        res.status(400).json({ error: "Unknown activation type" });
    }
  } catch (error) {
    console.error("M-Pesa activation error:", error);
    res.status(500).json({ error: "Failed to activate" });
  }
});

export async function subscribedLessonActivation(
  checkoutRequestID: string,
  businessMetadata: Record<string, unknown>,
  record: { phoneNumber: string; amount: number; status: string; transactionID?: string; createdAt: Date }
): Promise<{ success: boolean; message?: string; lessonId?: number; userId?: number; accessType?: string; expiresAt?: Date; error?: string }> {
  try {
    const lessonId = businessMetadata.lessonId as number;
    const lessonIds = businessMetadata.lessonIds as number[];
    const userPhone = record.phoneNumber;
    
    const lessonSetting = await DB.LessonSetting.findOne({
      where: { subscription_type: 'subscribed' },
      raw: true
    });
    
    if (!lessonSetting) {
      return { success: false, error: "Lesson pricing not configured for subscribers" };
    }
    
    const subscribedFee = parseInt(lessonSetting.fee || '100', 10);
    const duration = lessonSetting.duration || '90';
    
    const lessonsToActivate = lessonIds?.length > 0 ? lessonIds : (lessonId ? [lessonId] : []);
    if (lessonsToActivate.length === 0) {
      return { success: false, error: "No lesson(s) specified" };
    }
    
    const totalExpected = subscribedFee * lessonsToActivate.length;
    const paidAmount = Number(record.amount);
    if (paidAmount !== totalExpected) {
      return { success: false, error: `Amount mismatch: expected ${totalExpected} (${subscribedFee} per lesson x ${lessonsToActivate.length}), got ${paidAmount}` };
    }
    
    const existingUser = await DB.Users.findOne({ where: { phone: userPhone } });
    if (!existingUser) {
      return { success: false, error: "User not found" };
    }
    const userId = (existingUser as unknown as { id: number }).id;
    
    const subscription = await DB.Subscriptions.findOne({
      where: { user_id: userId, status: 'active' }
    });
    if (!subscription) {
      return { success: false, error: "No active subscription" };
    }
    
    const lessonTrack = await DB.LessonTrack.findOne({
      where: { user_id: userId, subscription_id: subscription.id }
    });
    if (lessonTrack && lessonTrack.lesson_balance > 0) {
      // Allow purchase - they can use credits or buy more
      // Just continue with activation
    }
    
    const durationMinutes = parseInt(duration, 10) || 90;
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    
    // Record purchase to purchases table
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
    });
    
    for (const lid of lessonsToActivate) {
      const existingAccess = await DB.LessonAccessLogs.findOne({
        where: {
          phone: userPhone,
          lesson_id: lid,
          status: 'active',
          expires_at: { [op.gt]: new Date() }
        }
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
      });
    }
    
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
    
    if (existingAccess) {
      console.log('[guestLessonActivation] Already active, returning success with canResume');
      return { success: true, message: "Lesson already activated", lessonId, accessType: "guest", canResume: true };
    }
    
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
        expires_at: expiresAt
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
    
    if (!existingAccessLog) {
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
    } else {
      console.log('[guestLessonActivation] lesson_access_logs already exists, skipping');
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
      b2hService.sendConversionWebhook(referralCode, 'TUTORIAL_REGISTRATION', record.amount)
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
  record: { phoneNumber: string; amount: number; status: string; transactionID?: string }
): Promise<{ success: boolean; message?: string; planId?: string; planName?: string; phoneNumber?: string; username?: string; usercode?: string; expiryDate?: string; isNewUser?: boolean; error?: string }> {
  try {
    const { planId, phoneNumber, email, name } = businessMetadata;
    const businessPlanId = planId as string | undefined;
    if (!businessPlanId) {
      return { success: false, error: "Missing planId" };
    }
    const userPhone = String(phoneNumber || record.phoneNumber);
    const userEmail = email as string | null || null;
    const subscriptionPlan = await DB.SubscriptionTypes.findOne({ where: { id: Number(businessPlanId) } });
    if (!subscriptionPlan) {
      return { success: false, error: "Invalid plan ID" };
    }
    const packageRecord = await DB.Packages.findOne({
      where: { subscription_type_id: Number(businessPlanId) },
      order: [["id", "ASC"]],
      raw: true,
    });
    if (!packageRecord) {
      return { success: false, error: "Subscription plan is not properly configured. Please contact support." };
    }
    const expectedAmount = Number(subscriptionPlan.membership_fee);
    const paidAmount = Number(record.amount);
    if (paidAmount !== expectedAmount) {
      return { success: false, error: `Payment amount (${paidAmount}) does not match plan price (${expectedAmount})` };
    }
    const months = parseInt(String(subscriptionPlan.months || "1"), 10) || 1;
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);
    const generatedUsercode = crypto.randomBytes(4).toString("hex").toUpperCase();
    const generatedUsername = `user_${userPhone.slice(-8)}`;
    let existingUser = await DB.Users.findOne({ where: { phone: userPhone } });
    let userId: number;
    let isNewUser = false;
    if (existingUser) {
      userId = (existingUser as unknown as { id: number }).id;
    } else {
      const subscriberRole = await DB.Roles.findOne({ where: { role_name: 'Subscriber' } });
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
      const newUser = await DB.Users.create(userData);
      userId = (newUser as unknown as { id: number }).id;
      isNewUser = true;
    }
    let subscriptionId: number;
    let expiryDateForLessons = expiryDate;
    const existingSubscription = await DB.Subscriptions.findOne({
      where: { user_id: userId, status: 'active' }
    });
    if (existingSubscription) {
      const currentExpiry = new Date(existingSubscription.expiry_date);
      if (currentExpiry > new Date()) {
        currentExpiry.setMonth(currentExpiry.getMonth() + months);
        await DB.Subscriptions.update(
          { expiry_date: currentExpiry },
          { where: { id: existingSubscription.id } }
        );
        subscriptionId = existingSubscription.id;
        expiryDateForLessons = currentExpiry;
      } else {
        await DB.Subscriptions.update(
          { start_date: startDate, expiry_date: expiryDate, status: 'active', phone_no: userPhone, subscription_type_id: Number(businessPlanId) },
          { where: { id: existingSubscription.id } }
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
      });
      subscriptionId = newSubscription.id;
      expiryDateForLessons = expiryDate;
    }
    const purchase = await DB.Purchases.create({
      user_id: userId,
      package_id: packageRecord.id,
      transaction_date: startDate,
      transaction_status: 'success',
      payment_reference: checkoutRequestID,
      amount_paid: record.amount,
      expiry_date: expiryDateForLessons,
    });
    const packageIdForLessons = packageRecord.id;
    const lessontrack = await DB.LessonTrack.findOne({
      where: { user_id: userId, subscription_id: subscriptionId }
    });
    if (lessontrack) {
      const currentExpires = new Date(lessontrack.expires_at);
      if (currentExpires > new Date()) {
        currentExpires.setMonth(currentExpires.getMonth() + months);
        await lessontrack.update({
          expires_at: currentExpires,
          status: 'active'
        });
      } else {
        await lessontrack.update({
          expires_at: expiryDateForLessons,
          status: 'active'
        });
      }
    } else {
      await DB.LessonTrack.create({
        subscription_id: subscriptionId,
        user_id: userId,
        package_id: packageIdForLessons,
        lessons_viewed: 0,
        lesson_balance: packageRecord.no_of_lessons || 10,
        total_lessons: packageRecord.no_of_lessons || 10,
        status: 'active',
        expires_at: expiryDateForLessons,
      });
    }
    const existingActiveSub = await DB.ActiveSubscriptions.findOne({
      where: { phone: userPhone, status: "Active" }
    });
    if (existingActiveSub) {
      const currentExpiry = new Date(existingActiveSub.expiry_date);
      if (currentExpiry > new Date()) {
        currentExpiry.setMonth(currentExpiry.getMonth() + months);
        await DB.ActiveSubscriptions.update(
          { expiry_date: currentExpiry },
          { where: { id: existingActiveSub.id } }
        );
      } else {
        await DB.ActiveSubscriptions.update(
          { start_date: startDate, expiry_date: expiryDateForLessons, status: "Active" },
          { where: { id: existingActiveSub.id } }
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
      });
    }
    try {
      const transaction = await DB.Transactions.create({
        user_id: userId,
        phone_number: userPhone,
        amount: record.amount,
        checkout_request_id: checkoutRequestID,
        transaction_reference: record.transactionID || null,
        status: 'success',
        payment_status: 'completed',
        details_id: subscriptionId,
        response_code: '0',
        response_description: 'Payment successful',
      });
      await DB.Subscriptions.update(
        { transaction_id: transaction.id },
        { where: { id: subscriptionId } }
      );
    } catch (txErr) {
      console.error('Failed to create transaction record:', txErr);
    }
    const referralCode = businessMetadata.referralCode as string | undefined;
    if (referralCode) {
      b2hService.sendConversionWebhook(referralCode, 'SUBSCRIPTION_PURCHASE', record.amount)
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
  record: { phoneNumber: string; amount: number; status: string; transactionID?: string }
): Promise<{ success: boolean; message?: string; packageId?: number; packageName?: string; phoneNumber?: string; username?: string; usercode?: string; expiryDate?: string; isNewUser?: boolean; lessonsAdded?: number; checkoutRequestID?: string; error?: string }> {
  try {
    const { planId, phoneNumber, email, name } = businessMetadata;
    const packageId = planId as string | undefined;
    if (!packageId) {
      return { success: false, error: "Missing packageId" };
    }
    const userPhone = String(phoneNumber || record.phoneNumber) as string;
    const userEmail = email as string | null || null;

    // Look up the specific package
    const packageRecord = await DB.Packages.findOne({
      where: { id: Number(packageId) },
      raw: true
    });
    if (!packageRecord) {
      return { success: false, error: "Invalid package ID" };
    }

    // Validate payment amount matches package fee
    const expectedAmount = Number(packageRecord.fee);
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
    const generatedUsername = `user_${userPhone.slice(-8)}`;

    let existingUser = await DB.Users.findOne({ where: { phone: userPhone } });
    let userId: number;
    let isNewUser = false;
    if (existingUser) {
      userId = (existingUser as unknown as { id: number }).id;
    } else {
      const subscriberRole = await DB.Roles.findOne({ where: { role_name: 'Subscriber' } });
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
      const newUser = await DB.Users.create(userData);
      userId = (newUser as unknown as { id: number }).id;
      isNewUser = true;
    }

    // Find or create subscription (packages are tied to subscription_type)
    const subscriptionTypeId = packageRecord.subscription_type_id;
    let subscriptionId: number;
    let expiryDateForLessons = expiryDate;

    const existingSubscription = await DB.Subscriptions.findOne({
      where: { user_id: userId, status: 'active' }
    });

    if (existingSubscription) {
      // Extend existing subscription expiry
      const currentExpiry = new Date(existingSubscription.expiry_date);
      if (currentExpiry > new Date()) {
        currentExpiry.setTime(currentExpiry.getTime() + (expiryDate.getTime() - startDate.getTime()));
        await DB.Subscriptions.update(
          { expiry_date: currentExpiry },
          { where: { id: existingSubscription.id } }
        );
        subscriptionId = existingSubscription.id;
        expiryDateForLessons = currentExpiry;
      } else {
        await DB.Subscriptions.update(
          { start_date: startDate, expiry_date: expiryDate, status: 'active', phone_no: userPhone, subscription_type_id: subscriptionTypeId },
          { where: { id: existingSubscription.id } }
        );
        subscriptionId = existingSubscription.id;
        expiryDateForLessons = expiryDate;
      }
    } else {
      const newSubscription = await DB.Subscriptions.create({
        user_id: userId,
        subscription_type_id: subscriptionTypeId,
        status: 'active',
        start_date: startDate,
        expiry_date: expiryDate,
        phone_no: userPhone,
        subscription_code: checkoutRequestID,
      });
      subscriptionId = newSubscription.id;
      expiryDateForLessons = expiryDate;
    }

    // Create purchase record

    // Find existing lesson track for this subscription
    const lessontrack = await DB.LessonTrack.findOne({
      where: { user_id: userId, subscription_id: subscriptionId }
    });

    const lessonsToAdd = packageRecord.no_of_lessons || 10;

    if (lessontrack) {
      // TOP-UP: Extend expiry and add lessons to existing track
      const currentExpires = new Date(lessontrack.expires_at);
      if (currentExpires > new Date()) {
        // Add package duration to existing expiry
        currentExpires.setTime(currentExpires.getTime() + (expiryDate.getTime() - startDate.getTime()));
        await lessontrack.update({
          expires_at: currentExpires,
          lesson_balance: (lessontrack.lesson_balance || 0) + lessonsToAdd,
          total_lessons: (lessontrack.total_lessons || 0) + lessonsToAdd,
          status: 'active'
        });
        console.log(`Package top-up: Added ${lessonsToAdd} lessons to existing track. New balance: ${(lessontrack.lesson_balance || 0) + lessonsToAdd}`);
      } else {
        // Expired track - renew with new lessons
        await lessontrack.update({
          expires_at: expiryDateForLessons,
          lesson_balance: lessonsToAdd,
          total_lessons: lessonsToAdd,
          status: 'active',
          package_id: packageRecord.id
        });
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
        status: 'active',
        expires_at: expiryDateForLessons,
      });
      console.log(`New lesson track: ${lessonsToAdd} lessons`);
    }

    // Update active subscription
    const existingActiveSub = await DB.ActiveSubscriptions.findOne({
      where: { phone: userPhone, status: "Active" }
    });
    if (existingActiveSub) {
      const currentExpiry = new Date(existingActiveSub.expiry_date);
      if (currentExpiry > new Date()) {
        currentExpiry.setTime(currentExpiry.getTime() + (expiryDate.getTime() - startDate.getTime()));
        await DB.ActiveSubscriptions.update(
          { expiry_date: currentExpiry },
          { where: { id: existingActiveSub.id } }
        );
      } else {
        await DB.ActiveSubscriptions.update(
          { start_date: startDate, expiry_date: expiryDateForLessons, status: "Active" },
          { where: { id: existingActiveSub.id } }
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
      });
    }

    // Create transaction record
    try {
      const transaction = await DB.Transactions.create({
        user_id: userId,
        phone_number: userPhone,
        amount: record.amount,
        checkout_request_id: checkoutRequestID,
        transaction_reference: record.transactionID || null,
        status: 'success',
        payment_status: 'completed',
        details_id: subscriptionId,
        response_code: '0',
        response_description: 'Package purchase successful',
      });
      await DB.Subscriptions.update(
        { transaction_id: transaction.id },
        { where: { id: subscriptionId } }
      );
    } catch (txErr) {
      console.error('Failed to create transaction record:', txErr);
    }

    const referralCode = businessMetadata.referralCode as string | undefined;
    if (referralCode) {
      b2hService.sendConversionWebhook(referralCode, 'PACKAGE_PURCHASE', record.amount)
        .catch((err) => console.error('[B2H] Package referral webhook failed:', err));
    }

    // Send SMS
    const smsMessage = isNewUser
      ? `Welcome to BTC! Your account is created. Package: ${packageRecord.name}. Lessons: ${lessonsToAdd}. Username: ${generatedUsername}, Usercode: ${generatedUsercode}`
      : `Package purchased: ${packageRecord.name}. ${lessonsToAdd} lessons added. Expires: ${expiryDateForLessons.toDateString()}`;
    try {
      await sendSms(userPhone, smsMessage);
    } catch (smsErr) {
      console.error("SMS sending failed:", smsErr);
    }

    // Send email
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
