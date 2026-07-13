// ============================================================
// ZYNQ — Alerts Controller
// Handle manual alert triggering
// ============================================================

import { Request, Response, RequestHandler } from "express";
import { logger } from "../utils/logger";
import { runDailyStockAndExpiryAlert } from "../services/alerts.service";

/**
 * Trigger the daily stock and expiry alert manually for the shop.
 */
export const testDailyAlert: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const shopId = req.user?.shopId;
    if (!shopId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    // Run the alert asynchronously so the request doesn't block
    runDailyStockAndExpiryAlert(shopId).catch(err => {
      logger.error(`[Alerts] Error running manual test alert for shop ${shopId}:`, err);
    });

    res.status(200).json({
      success: true,
      message: "Daily alert triggered. You should receive a WhatsApp message shortly if you have low stock or expiring products.",
    });
  } catch (error: any) {
    logger.error("[Alerts Controller] testDailyAlert Error:", error);
    res.status(500).json({ success: false, error: "Failed to trigger alert" });
  }
};
