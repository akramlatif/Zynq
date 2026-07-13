// ============================================================
// ZYNQ — Auth Routes
// POST /register, /login, /refresh, /logout
// GET  /me
// ============================================================

import { Router } from "express";
import { body } from "express-validator";
import * as authController from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";

const router = Router();

// ─── Routes ─────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Public — Creates shop + owner, returns JWT
 */
router.post(
  "/register",
  [
    body("name").isLength({ min: 2, max: 150 }).withMessage("Name must be between 2 and 150 characters"),
    body("phone").matches(/^(\+92|0)?3[0-9]{9}$/).withMessage("Invalid Pakistani phone number"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("shop_name").isLength({ min: 2, max: 200 }).withMessage("Shop name must be at least 2 characters"),
    body("city").optional().isLength({ max: 100 }).withMessage("City name is too long")
  ],
  validateRequest,
  authController.register
);

/**
 * POST /api/auth/login
 * Public — Phone + password login
 */
router.post(
  "/login",
  [
    body("phone").matches(/^(\+92|0)?3[0-9]{9}$/).withMessage("Invalid Pakistani phone number"),
    body("password").notEmpty().withMessage("Password is required")
  ],
  validateRequest,
  authController.login
);

/**
 * POST /api/auth/refresh
 * Public — Exchange refresh token for new access token
 */
router.post(
  "/refresh",
  [
    body("refresh_token").notEmpty().withMessage("Refresh token is required")
  ],
  validateRequest,
  authController.refresh
);

/**
 * GET /api/auth/me
 * Protected — Get current user profile
 */
router.get("/me", authenticateToken, authController.me);

/**
 * POST /api/auth/logout
 * Protected — Revoke refresh token
 */
router.post("/logout", authenticateToken, authController.logout);

export default router;
