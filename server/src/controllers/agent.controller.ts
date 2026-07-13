// ============================================================
// ZYNQ — Agent Controller
// Orchestrates the AI chat pipeline with DB history and timeouts
// ============================================================

import { Request, Response, NextFunction } from "express";
import { query } from "../db";
import { classifyIntent } from "../ai/agent/classifier";
import { executeAction, conversationState } from "../ai/agent/executor";
import { ApiError } from "../middleware/error.middleware";
import { transcribeAudio } from "../services/transcription.service";
import fs from "fs";

// Initialize conversation_history table if it doesn't exist
(async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS conversation_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
        conversation_id VARCHAR(100) NOT NULL,
        role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'agent')),
        message TEXT NOT NULL,
        intent_detected VARCHAR(50),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_chat_hist ON conversation_history(shop_id, conversation_id, created_at DESC);
    `);
  } catch (err) {
    console.error("Failed to initialize conversation_history table:", err);
  }
})();

/**
 * Timeout Wrapper Function
 * Rejects the promise if it takes longer than `ms` milliseconds.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// ─── POST /api/agent/chat ───────────────────────────────────
export async function handleChat(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopId = req.user!.shopId;
    const userId = req.user!.userId;
    const { message, conversationId } = req.body;

    // 1. Log the user's message immediately
    await query(
      `INSERT INTO conversation_history (shop_id, conversation_id, role, message) 
       VALUES ($1, $2, 'user', $3)`,
      [shopId, conversationId, message]
    );

    const stateKey = `${shopId}_${userId}`;
    const pending = conversationState.get(stateKey);

    let reply = "";
    let action_taken = null;
    let data = null;
    let requires_confirmation = false;
    let intent_detected = "unknown";

    // Build the async pipeline closure
    const runPipeline = async () => {
      // 2. Check Conversation State for multi-turn skip
      if (pending) {
        const isConfirm = /^(yes|haan|ha|jee|ji|yup|ok|kardo|kar do|bilkul|theek)/i.test(message.trim());
        const isCancel = /^(no|nahi|na|cancel|ruk jao|reh do|rehne do)/i.test(message.trim());

        if (isConfirm || isCancel) {
          intent_detected = isConfirm ? `confirm_${pending.action}` : `cancel_${pending.action}`;
          
          // Let the executor handle the actual execution since it shares the same state map
          const execRes = await executeAction(shopId, userId, message, {
            intent: pending.action,
            entities: {},
            confidence: 1,
            reply: ""
          });

          return {
            reply: execRes.reply,
            action_taken: isConfirm ? pending.action : "cancelled",
            data: execRes.data || null,
            requires_confirmation: false
          };
        }
      }

      // 3. Otherwise, run the Classifier
      const classified = await classifyIntent(message);
      intent_detected = classified.intent;

      // 4. Run the Executor
      const execRes = await executeAction(shopId, userId, message, classified);

      return {
        reply: execRes.reply,
        action_taken: execRes.status === "success" ? classified.intent : null,
        data: execRes.data || null,
        requires_confirmation: execRes.status === "pending_confirmation"
      };
    };

    try {
      // Execute the pipeline with a strict 3-second timeout
      const result = await withTimeout(runPipeline(), 3000);
      
      reply = result.reply;
      action_taken = result.action_taken;
      data = result.data;
      requires_confirmation = result.requires_confirmation;

    } catch (error: any) {
      if (error.message === "Timeout") {
        reply = "Maazrat, system abhi thora slow hai. Ek minute baad dobara koshish karein.";
      } else {
        console.error("Agent Pipeline Error:", error);
        reply = "Koi internal error aagaya hai. Main yeh action perform nahi kar saka.";
      }
    }

    // 5. Log the agent's reply
    await query(
      `INSERT INTO conversation_history (shop_id, conversation_id, role, message, intent_detected) 
       VALUES ($1, $2, 'agent', $3, $4)`,
      [shopId, conversationId, reply, intent_detected]
    );

    // 6. Return standard formatted response
    res.status(200).json({
      success: true,
      data: {
        reply,
        action_taken,
        data,
        requires_confirmation
      }
    });

  } catch (error) {
    next(error);
  }
}

// ─── POST /api/agent/voice ───────────────────────────────────
export async function handleVoice(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopId = req.user!.shopId;
    const userId = req.user!.userId;
    const conversationId = req.body.conversationId || `voice_${Date.now()}`;
    
    if (!req.file) {
      throw ApiError.badRequest("No audio file uploaded.");
    }

    const filePath = req.file.path;
    let transcription = "";

    // 1. Transcribe the audio
    try {
      transcription = await transcribeAudio(filePath);
    } catch (error) {
      // Clean up the temporary file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw ApiError.internal("Voice transcription failed.");
    }

    // Clean up the temporary file immediately after successful transcription
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    if (!transcription || transcription.trim() === "") {
      res.status(200).json({
        success: true,
        data: {
          transcription: "",
          reply: "Mujhe apki awaz nahi ayi. Dobara koshish karein.",
          action_taken: null,
          data: null,
          requires_confirmation: false
        }
      });
      return;
    }

    // 2. Log the user's transcribed message
    await query(
      `INSERT INTO conversation_history (shop_id, conversation_id, role, message) 
       VALUES ($1, $2, 'user', $3)`,
      [shopId, conversationId, transcription]
    );

    const stateKey = `${shopId}_${userId}`;
    const pending = conversationState.get(stateKey);

    let reply = "";
    let action_taken = null;
    let data = null;
    let requires_confirmation = false;
    let intent_detected = "unknown";

    // 3. Reuse the Agent Pipeline
    const runPipeline = async () => {
      if (pending) {
        const isConfirm = /^(yes|haan|ha|jee|ji|yup|ok|kardo|kar do|bilkul|theek)/i.test(transcription.trim());
        const isCancel = /^(no|nahi|na|cancel|ruk jao|reh do|rehne do)/i.test(transcription.trim());

        if (isConfirm || isCancel) {
          intent_detected = isConfirm ? `confirm_${pending.action}` : `cancel_${pending.action}`;
          
          const execRes = await executeAction(shopId, userId, transcription, {
            intent: pending.action,
            entities: {},
            confidence: 1,
            reply: ""
          });

          return {
            reply: execRes.reply,
            action_taken: isConfirm ? pending.action : "cancelled",
            data: execRes.data || null,
            requires_confirmation: false
          };
        }
      }

      const classified = await classifyIntent(transcription);
      intent_detected = classified.intent;

      const execRes = await executeAction(shopId, userId, transcription, classified);

      return {
        reply: execRes.reply,
        action_taken: execRes.status === "success" ? classified.intent : null,
        data: execRes.data || null,
        requires_confirmation: execRes.status === "pending_confirmation"
      };
    };

    try {
      const result = await withTimeout(runPipeline(), 5000); // 5 sec timeout for voice
      
      reply = result.reply;
      action_taken = result.action_taken;
      data = result.data;
      requires_confirmation = result.requires_confirmation;

    } catch (error: any) {
      if (error.message === "Timeout") {
        reply = "Maazrat, system abhi thora slow hai. Ek minute baad dobara koshish karein.";
      } else {
        console.error("Agent Pipeline Error:", error);
        reply = "Koi internal error aagaya hai. Main yeh action perform nahi kar saka.";
      }
    }

    // 4. Log the agent's reply
    await query(
      `INSERT INTO conversation_history (shop_id, conversation_id, role, message, intent_detected) 
       VALUES ($1, $2, 'agent', $3, $4)`,
      [shopId, conversationId, reply, intent_detected]
    );

    // 5. Return response with transcription included
    res.status(200).json({
      success: true,
      data: {
        transcription,
        reply,
        action_taken,
        data,
        requires_confirmation
      }
    });

  } catch (error) {
    // Attempt cleanup again just in case
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
}

// ─── GET /api/agent/history ─────────────────────────────────
export async function getHistory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopId = req.user!.shopId;
    const conversationId = req.query.conversationId as string;

    if (!conversationId) {
      throw ApiError.badRequest("conversationId query parameter is required");
    }

    // Fetch last 20 turns, ordered incrementally
    const result = await query(
      `SELECT role, message, intent_detected, created_at 
       FROM conversation_history 
       WHERE shop_id = $1 AND conversation_id = $2
       ORDER BY created_at DESC 
       LIMIT 20`,
      [shopId, conversationId]
    );

    // Reverse to chronological order for UI display
    const history = result.rows.reverse();

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
}
