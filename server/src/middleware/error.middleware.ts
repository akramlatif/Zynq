// ============================================================
// ZYNQ — Global Error Handler Middleware
// Catches all unhandled errors and returns a structured response
// ============================================================

import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

/** Custom API error class with status code */
export class ApiError extends Error {
  public statusCode: number;
  public code: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || "INTERNAL_ERROR";
    this.name = "ApiError";
  }

  // ─── Common Factory Methods ──────────────────────────────

  static badRequest(message: string) {
    return new ApiError(400, message, "BAD_REQUEST");
  }

  static unauthorized(message = "Authentication required") {
    return new ApiError(401, message, "UNAUTHORIZED");
  }

  static forbidden(message = "Access denied") {
    return new ApiError(403, message, "FORBIDDEN");
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, message, "NOT_FOUND");
  }

  static conflict(message: string) {
    return new ApiError(409, message, "CONFLICT");
  }

  static tooMany(message = "Too many requests") {
    return new ApiError(429, message, "RATE_LIMITED");
  }

  static internal(message = "Internal server error") {
    return new ApiError(500, message, "INTERNAL_ERROR");
  }
}

import { pool } from "../db";

/**
 * Global error handling middleware — must be registered LAST in Express
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Fire and forget logging to database
  const logErrorToDb = async (statusCode: number, message: string) => {
    try {
      const shopId = (req as any).user?.shopId || null;
      const endpoint = req.originalUrl;
      const ip = req.ip || req.socket.remoteAddress || "unknown";

      // Build rich metadata context
      const cleanBody = { ...req.body };
      if (cleanBody.password) cleanBody.password = "[REDACTED]";
      if (cleanBody.refresh_token) cleanBody.refresh_token = "[REDACTED]";

      const metadata = {
        query: req.query,
        params: req.params,
        body: cleanBody,
        stack: process.env.NODE_ENV !== "production" ? err.stack : undefined
      };

      await pool.query(
        `INSERT INTO error_logs (shop_id, endpoint, status_code, error_message, ip_address, metadata) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [shopId, endpoint, statusCode, message, ip, JSON.stringify(metadata)]
      );
    } catch (dbErr) {
      logger.error("Failed to write to error_logs table:", dbErr);
    }
  };

  // Known API errors
  if (err instanceof ApiError) {
    logErrorToDb(err.statusCode, err.message);
    
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // Unknown/unexpected errors
  logger.error("Unhandled error:", err);
  logErrorToDb(500, err.message);

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message:
        process.env.NODE_ENV === "production"
          ? "Something went wrong"
          : err.message,
    },
  });
}
