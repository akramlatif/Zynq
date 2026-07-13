// ============================================================
// ZYNQ — Authentication Middleware
// JWT verification + role-based access control
// ============================================================

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { ApiError } from "./error.middleware";

// ─── Extend Express Request with user info ──────────────────

export interface AuthPayload {
  userId: string;
  shopId: string;
  role: "owner" | "cashier";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// ─── JWT Token Utilities ────────────────────────────────────

/**
 * Generate an access token (short-lived)
 */
export function generateAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

/**
 * Generate a refresh token (long-lived)
 */
export function generateRefreshToken(payload: AuthPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
}

/**
 * Verify and decode an access token
 */
export function verifyAccessToken(token: string): AuthPayload {
  return jwt.verify(token, config.jwt.secret) as AuthPayload;
}

/**
 * Verify and decode a refresh token
 */
export function verifyRefreshToken(token: string): AuthPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as AuthPayload;
}

// ─── Middleware: Authenticate Token ─────────────────────────

/**
 * Extracts JWT from the Authorization header, verifies it,
 * and attaches `req.user` with { userId, shopId, role }.
 *
 * Usage: router.get("/me", authenticateToken, controller.me);
 */
export function authenticateToken(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Missing or invalid Authorization header");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw ApiError.unauthorized("Token not provided");
    }

    const decoded = verifyAccessToken(token);

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      shopId: decoded.shopId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      next(ApiError.unauthorized("Token expired"));
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      next(ApiError.unauthorized("Invalid token"));
      return;
    }

    next(error);
  }
}

// ─── Middleware: Require Role ────────────────────────────────

/**
 * Role guard — restricts access to users with specific roles.
 * Must be used AFTER authenticateToken.
 *
 * Usage: router.delete("/product/:id", authenticateToken, requireRole("owner"), controller.delete);
 */
export function requireRole(...roles: Array<"owner" | "cashier">) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized("Authentication required"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(
        ApiError.forbidden(
          `Access denied. Required role: ${roles.join(" or ")}`
        )
      );
      return;
    }

    next();
  };
}
