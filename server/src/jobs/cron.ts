// ============================================================
// ZYNQ — Background Cron Jobs
// Scheduled tasks for smart alerts and DB maintenance.
// ============================================================

import cron from "node-cron";
import { logger } from "../utils/logger";
import {
  runDailyStockAndExpiryAlert,
  runWeeklySummaryAlert,
  runSlowMoversCheck,
} from "../services/alerts.service";

/**
 * Initializes all background cron jobs.
 * Should be called once during server startup.
 */
export function initCronJobs() {
  logger.info("[Cron] Initializing background jobs (Timezone: Asia/Karachi)");

  // 1. Daily Stock & Expiry Alert
  // Runs every day at 8:00 AM Pakistan Time (UTC+5)
  cron.schedule(
    "0 8 * * *",
    async () => {
      logger.info("[Cron] Triggered: Daily Stock & Expiry Alert");
      await runDailyStockAndExpiryAlert();
    },
    {
      timezone: "Asia/Karachi",
    }
  );

  // 2. Weekly Summary Alert
  // Runs every Monday at 9:00 AM Pakistan Time
  cron.schedule(
    "0 9 * * 1",
    async () => {
      logger.info("[Cron] Triggered: Weekly Summary Alert");
      await runWeeklySummaryAlert();
    },
    {
      timezone: "Asia/Karachi",
    }
  );

  // 3. Slow Movers Check
  // Runs every day at 9:00 PM Pakistan Time
  cron.schedule(
    "0 21 * * *",
    async () => {
      logger.info("[Cron] Triggered: Slow Movers Check");
      await runSlowMoversCheck();
    },
    {
      timezone: "Asia/Karachi",
    }
  );

  logger.info("[Cron] All jobs scheduled successfully.");
}
