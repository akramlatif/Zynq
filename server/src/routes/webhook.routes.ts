// ============================================================
// ZYNQ — WhatsApp Webhook Routes
// Handles Meta webhook verification and delivery receipts.
// ============================================================

import { Router, Request, Response } from "express";
import { config } from "../config";
import { logger } from "../utils/logger";

const router = Router();

/**
 * GET /api/webhooks/whatsapp
 * Meta Webhook Verification (required during setup)
 * Meta sends a GET request with hub.mode, hub.verify_token, and hub.challenge.
 * We must respond with hub.challenge if the token matches.
 */
router.get("/whatsapp", (req: Request, res: Response): void => {
  const mode = req.query["hub.mode"] as string;
  const token = req.query["hub.verify_token"] as string;
  const challenge = req.query["hub.challenge"] as string;

  if (mode === "subscribe" && token === config.whatsapp.verifyToken) {
    logger.info("[Webhook] WhatsApp webhook verified successfully");
    res.status(200).send(challenge);
    return;
  }

  logger.warn("[Webhook] WhatsApp webhook verification failed — token mismatch");
  res.status(403).json({ error: "Verification failed" });
});

/**
 * POST /api/webhooks/whatsapp
 * Receives delivery receipts and status updates from Meta.
 * Status types: sent, delivered, read, failed
 */
router.post("/whatsapp", (req: Request, res: Response): void => {
  try {
    const body = req.body;

    // Meta always sends an `object` field with value "whatsapp_business_account"
    if (body.object !== "whatsapp_business_account") {
      res.sendStatus(404);
      return;
    }

    // Process each entry from the webhook payload
    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        if (change.field !== "messages") continue;

        const value = change.value;

        // Process delivery status updates
        const statuses = value.statuses || [];
        for (const status of statuses) {
          const { id: messageId, status: deliveryStatus, timestamp, recipient_id } = status;

          logger.info(
            `[Webhook] Message ${messageId} → ${deliveryStatus} | Recipient: ${recipient_id} | Time: ${new Date(parseInt(timestamp) * 1000).toISOString()}`
          );

          // Handle specific statuses
          switch (deliveryStatus) {
            case "sent":
              logger.debug(`[Webhook] Message ${messageId} sent to WhatsApp servers`);
              break;
            case "delivered":
              logger.info(`[Webhook] Message ${messageId} delivered to device`);
              break;
            case "read":
              logger.info(`[Webhook] Message ${messageId} read by recipient`);
              break;
            case "failed":
              const errors = status.errors || [];
              logger.error(
                `[Webhook] Message ${messageId} FAILED. Errors: ${JSON.stringify(errors)}`
              );
              break;
          }

          // TODO: In production, update a message_delivery_log table:
          // await query(
          //   `UPDATE whatsapp_messages SET status = $1, updated_at = NOW() WHERE message_id = $2`,
          //   [deliveryStatus, messageId]
          // );
        }

        // Process incoming messages (if customer replies)
        const messages = value.messages || [];
        for (const msg of messages) {
          logger.info(
            `[Webhook] Incoming message from ${msg.from}: ${msg.text?.body || "(media)"}`
          );
          // TODO: Route incoming replies to the agent chat system
        }
      }
    }

    // Meta requires a 200 response within 20 seconds, or it retries
    res.sendStatus(200);
  } catch (error) {
    logger.error("[Webhook] Error processing WhatsApp webhook:", error);
    // Still return 200 to prevent Meta from retrying endlessly
    res.sendStatus(200);
  }
});

export default router;
