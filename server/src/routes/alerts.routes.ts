// ============================================================
// ZYNQ — Alerts Routes
// Exposes a test endpoint for owners to manually trigger alerts
// ============================================================

import { Router } from "express";
import * as alertsController from "../controllers/alerts.controller";
import { authenticateToken, requireRole } from "../middleware/auth.middleware";

const router = Router();
router.use(authenticateToken);

/**
 * POST /api/alerts/test
 * Manually trigger the daily stock & expiry alert for the authenticated shop.
 * Restricted to owners.
 */
router.post(
  "/test",
  requireRole("owner"),
  alertsController.testDailyAlert
);

export default router;
