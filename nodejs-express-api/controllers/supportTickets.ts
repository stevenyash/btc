import { Router, Request, Response } from "express";
import { createHash, randomBytes } from "crypto";
import DB from "../models/db.js";
import { supportTicketLimiter, supportTrackingLimiter } from "../middleware/rateLimiters.js";

const router = Router();
const categories = new Set(["payment", "lesson_access", "account", "other"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hashTrackingToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function ticketReference(id: number): string {
  return `BTC-${String(id).padStart(8, "0")}`;
}

router.post("/", supportTicketLimiter, async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const paymentReference = typeof body.paymentReference === "string"
      ? body.paymentReference.trim()
      : "";
    const category = typeof body.category === "string" ? body.category : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({ error: "Name must be between 2 and 100 characters" });
    }
    if (!emailPattern.test(email) || email.length > 255) {
      return res.status(400).json({ error: "A valid email address is required" });
    }
    if (phone.length < 7 || phone.length > 20) {
      return res.status(400).json({ error: "A valid phone number is required" });
    }
    if (!req.user && paymentReference.length === 0) {
      return res.status(400).json({ error: "Guest reports must include an M-Pesa receipt or checkout reference" });
    }
    if (paymentReference.length > 100) {
      return res.status(400).json({ error: "Payment reference must be 100 characters or fewer" });
    }
    if (!categories.has(category)) {
      return res.status(400).json({ error: "Choose a valid issue category" });
    }
    if (subject.length < 5 || subject.length > 150) {
      return res.status(400).json({ error: "Subject must be between 5 and 150 characters" });
    }
    if (description.length < 10 || description.length > 5000) {
      return res.status(400).json({ error: "Description must be between 10 and 5000 characters" });
    }

    const trackingCode = randomBytes(32).toString("hex");
    const user = req.user;
    const ticket = await DB.SupportTickets.create({
      user_id: user?.id || null,
      tracking_token_hash: hashTrackingToken(trackingCode),
      customer_name: user?.username || name,
      customer_email: user?.email || email,
      phone_number: phone,
      payment_reference: paymentReference || null,
      category,
      subject,
      description,
    });

    return res.status(201).json({
      reference: ticketReference(ticket.id),
      trackingCode,
      status: ticket.status,
      createdAt: ticket.created_at,
    });
  } catch (error) {
    console.error("Failed to create support ticket:", error);
    return res.status(500).json({ error: "Unable to submit support request" });
  }
});

router.get("/track/:trackingCode", supportTrackingLimiter, async (req: Request, res: Response) => {
  try {
    const trackingCode = typeof req.params.trackingCode === "string"
      ? req.params.trackingCode.trim().toLowerCase()
      : "";
    if (!/^[a-f0-9]{64}$/.test(trackingCode)) {
      return res.status(404).json({ error: "Support request not found" });
    }

    const ticket = await DB.SupportTickets.findOne({
      where: { tracking_token_hash: hashTrackingToken(trackingCode) },
      attributes: ["id", "subject", "status", "admin_response", "created_at", "updated_at"],
      raw: true,
    });
    if (!ticket) {
      return res.status(404).json({ error: "Support request not found" });
    }

    return res.json({
      reference: ticketReference(ticket.id),
      subject: ticket.subject,
      status: ticket.status,
      response: ticket.admin_response,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
    });
  } catch (error) {
    console.error("Failed to retrieve support ticket status:", error);
    return res.status(500).json({ error: "Unable to retrieve support request status" });
  }
});

export default router;
