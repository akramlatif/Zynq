// ============================================================
// ZYNQ — Analytics Routes
// Scoped to req.user.shopId via authenticateToken
// ============================================================

import { Router } from "express";
import { query } from "express-validator";
import * as analyticsController from "../controllers/analytics.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/analytics/top-sellers
 * Returns top 10 products by quantity sold in the period.
 * Format: [{ name: "Product", value: 150 }]
 */
router.get(
  "/top-sellers",
  [
    query("period")
      .optional()
      .isIn(["today", "week", "month"])
      .withMessage("Period must be today, week, or month"),
  ],
  validateRequest,
  analyticsController.getTopSellers
);

/**
 * GET /api/analytics/revenue
 * Returns total revenue and transaction count for the period.
 * Format: { total_revenue: "1500.00", transaction_count: 24 }
 */
router.get(
  "/revenue",
  [
    query("period")
      .optional()
      .isIn(["today", "week", "month"])
      .withMessage("Period must be today, week, or month"),
  ],
  validateRequest,
  analyticsController.getRevenue
);

/**
 * GET /api/analytics/slow-movers
 * Returns products with 0 sales in the last N days but have stock > 0.
 * Format: [{ name: "Product", stock: 50 }]
 */
router.get(
  "/slow-movers",
  [
    query("days")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Days must be a positive integer"),
  ],
  validateRequest,
  analyticsController.getSlowMovers
);

/**
 * GET /api/analytics/daily-summary
 * Returns revenue by day for the last 30 days for charting.
 * Format: [{ name: "Jan 01", value: "250.00" }]
 */
router.get("/daily-summary", analyticsController.getDailySummary);

/**
 * GET /api/analytics/category-breakdown
 * Returns revenue generated per category in the given period.
 * Format: [{ name: "medicine", value: "3400.00" }]
 */
router.get(
  "/category-breakdown",
  [
    query("period")
      .optional()
      .isIn(["today", "week", "month"])
      .withMessage("Period must be today, week, or month"),
  ],
  validateRequest,
  analyticsController.getCategoryBreakdown
);

export default router;
