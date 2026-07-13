// ============================================================
// ZYNQ — Udhaar Controller
// Handlers for managing shop credits/khatas
// ============================================================

import { Request, Response, NextFunction } from "express";
import { query } from "../db";
import { ApiError } from "../middleware/error.middleware";

// ─── POST /api/udhaar ───────────────────────────────────────
export async function addUdhaar(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopId = req.user!.shopId;
    const { customer_name, customer_phone = null, amount, note = null } = req.body;

    const result = await query(
      `INSERT INTO udhaar (shop_id, customer_name, customer_phone, amount, is_paid, note) 
       VALUES ($1, $2, $3, $4, false, $5) RETURNING *`,
      [shopId, customer_name, customer_phone, amount, note]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// ─── GET /api/udhaar ────────────────────────────────────────
// Lists all customers with an outstanding balance
export async function getOutstandingUdhaar(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopId = req.user!.shopId;

    const result = await query(
      `SELECT customer_name, customer_phone, SUM(amount) as total_unpaid, COUNT(*) as unpaid_records
       FROM udhaar 
       WHERE shop_id = $1 AND is_paid = false 
       GROUP BY customer_name, customer_phone
       ORDER BY total_unpaid DESC`,
      [shopId]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

// ─── GET /api/udhaar/:customerName ──────────────────────────
export async function getCustomerUdhaarHistory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopId = req.user!.shopId;
    const { customerName } = req.params;

    const result = await query(
      `SELECT * FROM udhaar 
       WHERE shop_id = $1 AND customer_name = $2 
       ORDER BY created_at DESC`,
      [shopId, customerName]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

// ─── PATCH /api/udhaar/:id/pay ──────────────────────────────
export async function markUdhaarAsPaid(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopId = req.user!.shopId;
    const { id } = req.params;

    const result = await query(
      `UPDATE udhaar SET is_paid = true WHERE id = $1 AND shop_id = $2 RETURNING *`,
      [id, shopId]
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound("Udhaar record not found");
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}
