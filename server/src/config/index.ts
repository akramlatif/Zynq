// ============================================================
// ZYNQ — App Configuration
// Centralized config loader from environment variables
// ============================================================

import "dotenv/config";

export const config = {
  // ─── App ──────────────────────────────────────────────────
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  apiUrl: process.env.API_URL || "http://localhost:5000/api/v1",

  // ─── Database ─────────────────────────────────────────────
  db: {
    url: process.env.DATABASE_URL || "postgresql://zynq_user:your_password@localhost:5432/zynq_db",
    ssl: process.env.DB_SSL === "true",
  },

  // ─── Redis ────────────────────────────────────────────────
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
    ttl: parseInt(process.env.REDIS_TTL || "3600", 10),
  },

  // ─── Auth ─────────────────────────────────────────────────
  jwt: {
    secret: process.env.JWT_SECRET || "CHANGE_ME_IN_PRODUCTION",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "CHANGE_ME_REFRESH",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10),

  // ─── Gemini AI ────────────────────────────────────────────
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || "2048", 10),
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || "0.3"),
  },

  // ─── WhatsApp Cloud API ────────────────────────────────────
  whatsapp: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "zynq_webhook_verify_2024",
    apiVersion: process.env.WHATSAPP_API_VERSION || "v19.0",
    dailyLimit: parseInt(process.env.WHATSAPP_DAILY_LIMIT || "1000", 10), // Free tier
  },

  // ─── Rate Limiting ────────────────────────────────────────
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  },

  // ─── Logging ──────────────────────────────────────────────
  log: {
    level: process.env.LOG_LEVEL || "debug",
    dir: process.env.LOG_DIR || "./logs",
  },
} as const;
