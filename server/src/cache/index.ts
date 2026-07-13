// ============================================================
// ZYNQ — Redis Cache Layer
// Manages connection + refresh token storage
// ============================================================

import Redis from "ioredis";
import { config } from "../config";

/** Redis client singleton */
export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 3000);
    return delay;
  },
  lazyConnect: true,
});

redis.on("connect", () => console.log("🔴 Redis connected"));
redis.on("error", (err) => console.error("🔴 Redis error:", err.message));

// ─── Refresh Token Operations ────────────────────────────────

const REFRESH_PREFIX = "refresh_token:";
const REFRESH_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Store a refresh token in Redis keyed by userId
 * Each user can have only ONE active refresh token
 */
export async function storeRefreshToken(
  userId: string,
  token: string
): Promise<void> {
  await redis.set(`${REFRESH_PREFIX}${userId}`, token, "EX", REFRESH_TTL);
}

/**
 * Retrieve the stored refresh token for a user
 */
export async function getRefreshToken(
  userId: string
): Promise<string | null> {
  return redis.get(`${REFRESH_PREFIX}${userId}`);
}

/**
 * Delete refresh token (logout / token rotation)
 */
export async function deleteRefreshToken(userId: string): Promise<void> {
  await redis.del(`${REFRESH_PREFIX}${userId}`);
}

/**
 * Graceful shutdown
 */
export async function closeRedis(): Promise<void> {
  await redis.quit();
  console.log("🔴 Redis connection closed");
}
