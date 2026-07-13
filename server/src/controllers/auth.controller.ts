// ============================================================
// ZYNQ — Auth Controller
// Request handlers for authentication endpoints
// ============================================================

import { Request, Response, NextFunction } from "express";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  getUserProfile,
  logoutUser,
} from "../services/auth.service";

/**
 * POST /api/auth/register
 * Creates a new shop + owner user, returns JWT tokens
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { user, tokens } = await registerUser(req.body);

    res.status(201).json({
      success: true,
      data: { user, tokens },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Verifies phone + password, returns JWT tokens
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { user, tokens } = await loginUser(req.body);

    res.status(200).json({
      success: true,
      data: { user, tokens },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/refresh
 * Rotates refresh token and returns new access token
 */
export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "refresh_token is required",
        },
      });
      return;
    }

    const tokens = await refreshAccessToken(refresh_token);

    res.status(200).json({
      success: true,
      data: { tokens },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile
 */
export async function me(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await getUserProfile(req.user!.userId);

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout
 * Revokes the user's refresh token
 */
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await logoutUser(req.user!.userId);

    res.status(200).json({
      success: true,
      data: { message: "Logged out successfully" },
    });
  } catch (error) {
    next(error);
  }
}
