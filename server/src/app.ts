// ============================================================
// ZYNQ — Express Application Entry Point
// Configures middleware, routes, and starts the server
// ============================================================

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import { config } from "./config";
import { logger } from "./utils/logger";
import { errorHandler } from "./middleware/error.middleware";
import { sqlSanitize } from "./middleware/sanitize.middleware";
import { redis } from "./cache";

// ─── Route Imports ──────────────────────────────────────────

import authRoutes from "./routes/auth.routes";
import inventoryRoutes from "./routes/inventory.routes";
import billingRoutes from "./routes/billing.routes";
import udhaarRoutes from "./routes/udhaar.routes";
import analyticsRoutes from "./routes/analytics.routes";
import agentRoutes from "./routes/agent.routes";
import webhookRoutes from "./routes/webhook.routes";
import alertsRoutes from "./routes/alerts.routes";

import { initCronJobs } from "./jobs/cron";

// ─── Express App Setup ──────────────────────────────────────

const app = express();

// ─── Security Middleware ────────────────────────────────────

// 1. Helmet with strict CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", config.clientUrl],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false, // Often breaks third-party APIs if true without care
  })
);

// 2. CORS (Strict to Vercel production domain and localhost:3000)
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://app.zynq.example.com", // Replace with actual production Vercel domain
];

if (config.clientUrl && !allowedOrigins.includes(config.clientUrl)) {
  allowedOrigins.push(config.clientUrl);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Rate Limiting ──────────────────────────────────────────

// Global Limiter (100 req / 15 min)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests from this IP, please try again after 15 minutes",
    },
  },
});

// Auth Limiter (10 req / 15 min) - Prevents brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many login/register attempts. Please try again later.",
    },
  },
});

app.use("/api", globalLimiter);

// ─── Body Parsing & Sanitization ────────────────────────────

app.use(express.json({ limit: "1mb" })); // Reduced to 1mb for security
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// HTTP Parameter Pollution protection
app.use(hpp());

// Custom SQL Sanitizer
app.use(sqlSanitize);

// ─── HTTP Logging ───────────────────────────────────────────

app.use(
  morgan("short", {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

// ─── Health Check ───────────────────────────────────────────

import { pool } from "./db";

app.get("/api/health", async (_req, res) => {
  let dbOk = false;
  let redisOk = false;

  try {
    const dbRes = await pool.query("SELECT 1");
    if (dbRes.rowCount === 1) dbOk = true;
  } catch (err) {
    logger.error("DB Health Check Failed:", err);
  }

  try {
    const redisPing = await redis.ping();
    if (redisPing === "PONG") redisOk = true;
  } catch (err) {
    logger.error("Redis Health Check Failed:", err);
  }

  const status = dbOk && redisOk ? "ok" : "degraded";

  res.json({
    status,
    db: dbOk,
    redis: redisOk,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ─── API Routes ─────────────────────────────────────────────

app.use("/api/auth", authLimiter, authRoutes);

// Future routes will be added here:
app.use("/api/products", inventoryRoutes);
app.use("/api/bills", billingRoutes);
app.use("/api/udhaar", udhaarRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/alerts", alertsRoutes);

// ─── 404 Handler ────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
    },
  });
});

// ─── Global Error Handler (must be LAST) ────────────────────

app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────

async function startServer() {
  try {
    // Connect Redis
    await redis.connect();

    // Start background jobs
    initCronJobs();

    // Start Express
    app.listen(config.port, () => {
      logger.info(`
  ╔══════════════════════════════════════════╗
  ║        🚀  ZYNQ API Server              ║
  ║        Port: ${String(config.port).padEnd(27)}║
  ║        Env:  ${config.env.padEnd(27)}║
  ║        Time: ${new Date().toLocaleTimeString("en-PK").padEnd(27)}║
  ╚══════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// ─── Graceful Shutdown ──────────────────────────────────────

async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received. Shutting down gracefully...`);

  try {
    const { closeDatabase } = await import("./db");
    await closeDatabase();

    const { closeRedis } = await import("./cache");
    await closeRedis();
  } catch (error) {
    logger.error("Error during shutdown:", error);
  }

  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ─── Start ──────────────────────────────────────────────────

startServer();

export default app;
