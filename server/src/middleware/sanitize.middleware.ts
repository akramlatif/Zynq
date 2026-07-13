// ============================================================
// ZYNQ — SQL Input Sanitizer Middleware
// Recursively strips common SQL injection vectors from request payload.
// Adapted for SQL protection (similar to express-mongo-sanitize).
// ============================================================

import { Request, Response, NextFunction } from "express";

// Common SQL injection keywords/patterns
const SQL_KEYWORDS = [
  /SELECT\s+/i,
  /INSERT\s+INTO/i,
  /UPDATE\s+/i,
  /DELETE\s+FROM/i,
  /DROP\s+TABLE/i,
  /ALTER\s+TABLE/i,
  /TRUNCATE\s+TABLE/i,
  /--/, // SQL comment
  /;\s*$/, // End of statement
  /UNION\s+ALL/i,
  /UNION\s+SELECT/i,
  /EXEC\s*\(/i,
];

function sanitizeString(val: string): string {
  let sanitized = val;
  for (const pattern of SQL_KEYWORDS) {
    // Strip matches. In a stricter implementation, we could throw an error.
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }
  // Remove single quotes if they are unbalanced or suspicious, but we must be careful 
  // not to break valid names (e.g. O'Connor). The safest approach for raw string inputs 
  // is relying on Parameterized Queries (which Drizzle/pg uses).
  // This sanitizer acts as a defense-in-depth mechanism.
  return sanitized;
}

function sanitizeObject(obj: any): any {
  if (typeof obj === "string") {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (obj !== null && typeof obj === "object") {
    const sanitizedObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitizedObj[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitizedObj;
  }

  return obj;
}

/**
 * Express middleware to sanitize req.body, req.query, and req.params
 */
export function sqlSanitize(req: Request, _res: Response, next: NextFunction): void {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
}
