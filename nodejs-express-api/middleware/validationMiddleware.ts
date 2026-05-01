import { body, param, query, ValidationChain, body as validateBody, query as validateQuery } from "express-validator";

export const validateLessonAccess: ValidationChain[] = [
  param("recid").isInt({ min: 1 }).withMessage("Invalid lesson ID"),
  query("guest").optional({ nullable: true, checkFalsy: true }).isIn(["true", "false"]).withMessage("Guest must be true or false"),
  query("phone").optional({ nullable: true, checkFalsy: true }).isMobilePhone('any' as any).withMessage("Valid phone number required for guest access"),
  query("user_id").optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }).withMessage("User ID required for subscribers"),
  query("expiresIn").optional({ nullable: true, checkFalsy: true }).isInt({ min: 300, max: 86400 }).withMessage("ExpiresIn must be between 300 and 86400 seconds"),
];

export const validateLessonCreate: ValidationChain[] = [
  body("area_id").optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }),
  body("topic_id").optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }),
  body("subtopic_id").optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }),
  body("title").trim().isLength({ min: 1, max: 255 }).withMessage("Title must be between 1 and 255 characters"),
  body("description").optional().trim().isLength({ max: 1000 }).withMessage("Description too long"),
  body("duration").optional().isInt({ min: 1 }).withMessage("Duration must be positive integer"),
  body("price").optional().isFloat({ min: 0 }).withMessage("Price must be non-negative"),
  body("preview_duration").optional().isInt({ min: 0 }).withMessage("Preview duration must be non-negative"),
];

export const validateLessonUpdate: ValidationChain[] = [
  param("recid").isInt({ min: 1 }).withMessage("Invalid lesson ID"),
  ...validateLessonCreate,
];

export const validateSessionComplete: ValidationChain[] = [
  param("sessionId").isLength({ min: 1 }).withMessage("Session ID required"),
  body("status").optional().isIn(["completed", "expired", "cancelled"]).withMessage("Invalid status"),
  body("watch_time").optional().isInt({ min: 0 }).withMessage("Watch time must be non-negative"),
  body("completion_percentage").optional().isInt({ min: 0, max: 100 }).withMessage("Completion percentage must be 0-100"),
];