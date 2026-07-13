// ============================================================
// ZYNQ — Winston Logger
// Structured logging with file rotation
// ============================================================

import winston from "winston";
import path from "path";
import { config } from "../config";

const { combine, timestamp, printf, colorize, errors } = winston.format;

/** Custom log format */
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
});

/** Logger instance */
export const logger = winston.createLogger({
  level: config.log.level,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    logFormat
  ),
  defaultMeta: { service: "zynq-api" },
  transports: [
    // Console (colorized in dev)
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),

    // Error log file
    new winston.transports.File({
      filename: path.join(config.log.dir, "error.log"),
      level: "error",
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),

    // Combined log file
    new winston.transports.File({
      filename: path.join(config.log.dir, "combined.log"),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
  ],
});
