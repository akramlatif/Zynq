// ============================================================
// ZYNQ — Agent Routes
// ============================================================

import { Router } from "express";
import { body, query } from "express-validator";
import multer from "multer";
import os from "os";
import * as agentController from "../controllers/agent.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";

const upload = multer({
  dest: os.tmpdir(), // Use OS temp dir
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const router = Router();
router.use(authenticateToken);

/**
 * POST /api/agent/chat
 * Primary entry point for AI natural language commands
 */
router.post(
  "/chat",
  [
    body("message").isString().trim().notEmpty().withMessage("Message cannot be empty"),
    body("conversationId").isString().notEmpty().withMessage("Conversation ID is required")
  ],
  validateRequest,
  agentController.handleChat
);

/**
 * POST /api/agent/voice
 * Handles audio uploads for voice chat
 */
router.post(
  "/voice",
  upload.single("audio"),
  agentController.handleVoice
);

/**
 * GET /api/agent/history
 * Fetch the last 20 conversational turns
 */
router.get(
  "/history",
  [
    query("conversationId").isString().notEmpty().withMessage("Conversation ID is required")
  ],
  validateRequest,
  agentController.getHistory
);

export default router;
