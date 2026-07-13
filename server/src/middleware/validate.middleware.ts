// ============================================================
// ZYNQ — Express Validator Middleware
// ============================================================

import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

/**
 * Middleware to check for validation errors from express-validator
 */
export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors: Record<string, string[]> = {};
    
    errors.array().forEach((error: any) => {
      const field = error.path || error.param;
      if (!formattedErrors[field]) {
        formattedErrors[field] = [];
      }
      formattedErrors[field].push(error.msg);
    });

    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input data",
        details: formattedErrors,
      },
    });
    return;
  }
  next();
}
