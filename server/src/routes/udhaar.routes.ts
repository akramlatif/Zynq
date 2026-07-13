// ============================================================
// ZYNQ — Udhaar Routes
// ============================================================

import { Router } from "express";
import { body, param } from "express-validator";
import * as udhaarController from "../controllers/udhaar.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";

const router = Router();
router.use(authenticateToken);

/**
 * POST /api/udhaar
 * Add a new credit/khata entry for a customer
 */
router.post(
  "/",
  [
    body("customer_name").isString().notEmpty().withMessage("Customer name is required"),
    body("customer_phone").optional().matches(/^(\+92|0)?3[0-9]{9}$/).withMessage("Invalid Pakistani phone number"),
    body("amount").isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0"),
    body("note").optional().isString()
  ],
  validateRequest,
  udhaarController.addUdhaar
);

/**
 * GET /api/udhaar
 * List all customers with an outstanding balance
 */
router.get("/", udhaarController.getOutstandingUdhaar);

/**
 * GET /api/udhaar/:customerName
 * Get full udhaar history for a specific customer
 */
router.get(
  "/:customerName",
  [param("customerName").isString().notEmpty()],
  validateRequest,
  udhaarController.getCustomerUdhaarHistory
);

/**
 * PATCH /api/udhaar/:id/pay
 * Mark a specific udhaar record as paid
 */
router.patch(
  "/:id/pay",
  [param("id").isUUID().withMessage("Invalid udhaar ID format")],
  validateRequest,
  udhaarController.markUdhaarAsPaid
);

export default router;
