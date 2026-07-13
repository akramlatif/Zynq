// ============================================================
// ZYNQ — Billing Routes
// ============================================================

import { Router } from "express";
import { body, query, param } from "express-validator";
import * as billingController from "../controllers/billing.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";

const router = Router();
router.use(authenticateToken);

/**
 * POST /api/bills
 * Create a new bill (transactional stock deduction + sales log)
 */
router.post(
  "/",
  [
    body("items").isArray({ min: 1 }).withMessage("Items array must contain at least one item"),
    body("items.*.product_id").isUUID().withMessage("Valid product_id is required"),
    body("items.*.qty").isInt({ min: 1 }).withMessage("Quantity must be a positive integer"),
    body("payment_method").optional().isIn(["cash", "udhaar", "online", "mixed"]),
    body("customer_name").optional().isString().isLength({ max: 150 })
  ],
  validateRequest,
  billingController.createBill
);

/**
 * GET /api/bills
 * Get all bills (paginated, optional date filters)
 */
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("start_date").optional().isISO8601(),
    query("end_date").optional().isISO8601()
  ],
  validateRequest,
  billingController.getBills
);

/**
 * GET /api/bills/:id
 * Get single bill by ID
 */
router.get(
  "/:id",
  [param("id").isUUID().withMessage("Invalid bill ID format")],
  validateRequest,
  billingController.getBillById
);

/**
 * POST /api/bills/:id/send-whatsapp
 * Send bill receipt via WhatsApp to the customer
 */
router.post(
  "/:id/send-whatsapp",
  [
    param("id").isUUID().withMessage("Invalid bill ID format"),
    body("phone").isString().trim().notEmpty().withMessage("Customer phone number is required")
  ],
  validateRequest,
  billingController.sendBillWhatsApp
);

export default router;
