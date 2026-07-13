// ============================================================
// ZYNQ — Authentication Service
// Core auth business logic (register, login, refresh, profile)
// ============================================================

import bcryptjs from "bcryptjs";
import { pool, query } from "../db";
import { config } from "../config";
import {
  AuthPayload,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../middleware/auth.middleware";
import {
  storeRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
} from "../cache";
import { ApiError } from "../middleware/error.middleware";
import { logger } from "../utils/logger";

// ─── Types ──────────────────────────────────────────────────

export interface RegisterInput {
  name: string;
  phone: string;
  password: string;
  shop_name: string;
  city?: string;
}

export interface LoginInput {
  phone: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  role: "owner" | "cashier";
  shop: {
    id: string;
    name: string;
    city: string | null;
    plan_type: string;
  };
}

// ─── Register ───────────────────────────────────────────────

import zxcvbn from "zxcvbn";

/**
 * Creates a new shop + owner user in a single transaction.
 * Returns JWT access + refresh tokens.
 */
export async function registerUser(
  input: RegisterInput
): Promise<{ user: UserProfile; tokens: AuthTokens }> {
  // Check password strength
  const strength = zxcvbn(input.password);
  if (strength.score < 3) {
    throw ApiError.badRequest("Password is too weak. Please use a stronger password.");
  }

  // Check if phone already exists
  const existingRes = await query("SELECT id FROM users WHERE phone = $1 LIMIT 1", [input.phone]);

  if (existingRes.rows.length > 0) {
    throw ApiError.conflict("Phone number already registered");
  }

  // Hash password
  const passwordHash = await bcryptjs.hash(input.password, config.bcryptSaltRounds);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Create shop
    const shopRes = await client.query(
      `INSERT INTO shops (name, owner_name, phone, city, plan_type)
       VALUES ($1, $2, $3, $4, 'free') RETURNING *`,
      [input.shop_name, input.name, input.phone, input.city || null]
    );
    const shop = shopRes.rows[0];

    // 2. Create owner user
    const userRes = await client.query(
      `INSERT INTO users (shop_id, name, phone, role, password_hash)
       VALUES ($1, $2, $3, 'owner', $4) RETURNING *`,
      [shop.id, input.name, input.phone, passwordHash]
    );
    const user = userRes.rows[0];

    await client.query("COMMIT");

    // Generate tokens
    const payload: AuthPayload = {
      userId: user.id,
      shopId: shop.id,
      role: "owner",
    };

    const tokens = await generateAndStoreTokens(payload);

    logger.info(`New shop registered: ${shop.name} by ${user.name}`);

    return {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        shop: {
          id: shop.id,
          name: shop.name,
          city: shop.city,
          plan_type: shop.plan_type,
        },
      },
      tokens,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ─── Login ──────────────────────────────────────────────────

/**
 * Verifies phone + password and returns JWT tokens.
 */
export async function loginUser(
  input: LoginInput
): Promise<{ user: UserProfile; tokens: AuthTokens }> {
  // Find user by phone
  const userRes = await query("SELECT * FROM users WHERE phone = $1 LIMIT 1", [input.phone]);

  if (userRes.rows.length === 0) {
    throw ApiError.unauthorized("Invalid phone number or password");
  }

  const user = userRes.rows[0];

  // Verify password
  const isValid = await bcryptjs.compare(input.password, user.password_hash);

  if (!isValid) {
    throw ApiError.unauthorized("Invalid phone number or password");
  }

  // Get shop info
  const shopRes = await query("SELECT * FROM shops WHERE id = $1 LIMIT 1", [user.shop_id]);

  if (shopRes.rows.length === 0) {
    throw ApiError.notFound("Shop not found for this user");
  }

  const shop = shopRes.rows[0];

  // Generate tokens
  const payload: AuthPayload = {
    userId: user.id,
    shopId: user.shop_id,
    role: user.role,
  };

  const tokens = await generateAndStoreTokens(payload);

  logger.info(`User logged in: ${user.name} (${user.role})`);

  return {
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      shop: {
        id: shop.id,
        name: shop.name,
        city: shop.city,
        plan_type: shop.plan_type,
      },
    },
    tokens,
  };
}

// ─── Refresh Token ──────────────────────────────────────────

/**
 * Validates the refresh token, rotates it, and returns a new access token.
 * Implements token rotation: old refresh token is invalidated.
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<AuthTokens> {
  // 1. Verify the refresh token signature
  let decoded: AuthPayload;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  // 2. Check if this token exists in Redis (not revoked)
  const storedToken = await getRefreshToken(decoded.userId);

  if (!storedToken || storedToken !== refreshToken) {
    // Possible token reuse attack — revoke all tokens for this user
    await deleteRefreshToken(decoded.userId);
    logger.warn(`Possible token reuse attack for user ${decoded.userId}`);
    throw ApiError.unauthorized("Refresh token has been revoked");
  }

  // 3. Rotate: generate new token pair, invalidate old
  const payload: AuthPayload = {
    userId: decoded.userId,
    shopId: decoded.shopId,
    role: decoded.role,
  };

  const tokens = await generateAndStoreTokens(payload);

  logger.info(`Token refreshed for user ${decoded.userId}`);

  return tokens;
}

// ─── Get Profile ────────────────────────────────────────────

/**
 * Returns the current user's profile + shop info.
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const userRes = await query("SELECT * FROM users WHERE id = $1 LIMIT 1", [userId]);

  if (userRes.rows.length === 0) {
    throw ApiError.notFound("User not found");
  }

  const user = userRes.rows[0];

  const shopRes = await query("SELECT * FROM shops WHERE id = $1 LIMIT 1", [user.shop_id]);

  if (shopRes.rows.length === 0) {
    throw ApiError.notFound("Shop not found");
  }

  const shop = shopRes.rows[0];

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    shop: {
      id: shop.id,
      name: shop.name,
      city: shop.city,
      plan_type: shop.plan_type,
    },
  };
}

// ─── Logout ─────────────────────────────────────────────────

/**
 * Revoke refresh token on logout
 */
export async function logoutUser(userId: string): Promise<void> {
  await deleteRefreshToken(userId);
  logger.info(`User logged out: ${userId}`);
}

// ─── Helper ─────────────────────────────────────────────────

async function generateAndStoreTokens(
  payload: AuthPayload
): Promise<AuthTokens> {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store refresh token in Redis with 7-day TTL
  await storeRefreshToken(payload.userId, refreshToken);

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: config.jwt.expiresIn,
  };
}
