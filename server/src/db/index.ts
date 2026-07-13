// ============================================================
// ZYNQ — Database Connection Pool
// Setup using the pg library
// ============================================================

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import postgres from "postgres";
import { config } from "../config";
import { logger } from "../utils/logger";
import * as schema from "./models";

// Create a new PostgreSQL connection pool
export const pool = new Pool({
  connectionString: config.db.url,
  ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
  max: 10, // max number of clients in the pool
  idleTimeoutMillis: 30000,
});

pool.on("connect", () => {
  logger.info("🟢 Database connected successfully");
});

pool.on("error", (err: Error) => {
  logger.error("🔴 Unexpected error on idle client", err);
  process.exit(-1);
});

// Initialize Drizzle ORM client
export const db = drizzle(pool, { schema });

// Initialize connection for raw SQL queries/scripts (like reset.ts)
export const connection = postgres(config.db.url);

/**
 * Helper to execute queries
 */
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  logger.debug(`Executed query`, { text, duration, rows: res.rowCount });
  return res;
}

/** Graceful shutdown helper */
export async function closeDatabase(): Promise<void> {
  await pool.end();
  await connection.end();
  logger.info("🔌 Database connection closed");
}
