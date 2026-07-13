// ============================================================
// ZYNQ — Analytics Controller
// Comprehensive data aggregation for Recharts UI
// ============================================================

import { Request, Response, NextFunction } from "express";
import { query } from "../db";

// Helper to resolve period string to PostgreSQL interval
function getStartDateCondition(period: string, column: string = "sold_at"): string {
  switch (period) {
    case "today":
      return `${column} >= CURRENT_DATE`;
    case "week":
      return `${column} >= CURRENT_DATE - INTERVAL '7 days'`;
    case "month":
      return `${column} >= CURRENT_DATE - INTERVAL '1 month'`;
    default:
      // Fallback to month
      return `${column} >= CURRENT_DATE - INTERVAL '1 month'`;
  }
}

// ─── GET /api/analytics/top-sellers ─────────────────────────
export async function getTopSellers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopId = req.user!.shopId;
    const period = (req.query.period as string) || "month";
    const dateCondition = getStartDateCondition(period, "s.sold_at");

    const result = await query(
      `SELECT p.name, SUM(s.quantity_sold)::integer as value
       FROM sales_log s
       JOIN products p ON s.product_id = p.id
       WHERE s.shop_id = $1 AND ${dateCondition}
       GROUP BY p.id, p.name
       ORDER BY value DESC
       LIMIT 10`,
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

// ─── GET /api/analytics/revenue ─────────────────────────────
export async function getRevenue(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopId = req.user!.shopId;
    const period = (req.query.period as string) || "month";
    const dateCondition = getStartDateCondition(period, "created_at");

    const result = await query(
      `SELECT 
         COALESCE(SUM(total), 0)::numeric as total_revenue, 
         COUNT(id)::integer as transaction_count
       FROM bills
       WHERE shop_id = $1 AND ${dateCondition}`,
      [shopId]
    );

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// ─── GET /api/analytics/slow-movers ─────────────────────────
export async function getSlowMovers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopId = req.user!.shopId;
    const days = parseInt(req.query.days as string, 10) || 30;

    const result = await query(
      `SELECT p.name, p.quantity as stock
       FROM products p
       WHERE p.shop_id = $1 
         AND p.quantity > 0
         AND p.id NOT IN (
           SELECT product_id FROM sales_log 
           WHERE shop_id = $1 AND sold_at >= CURRENT_DATE - $2::integer
         )
       ORDER BY p.quantity DESC`,
      [shopId, days]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

// ─── GET /api/analytics/daily-summary ───────────────────────
export async function getDailySummary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopId = req.user!.shopId;

    // Groups revenue by day for the last 30 days formatted for Recharts
    const result = await query(
      `SELECT 
         to_char(created_at, 'Mon DD') as name, 
         SUM(total)::numeric as value
       FROM bills
       WHERE shop_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY to_char(created_at, 'Mon DD'), DATE(created_at)
       ORDER BY DATE(created_at) ASC`,
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

// ─── GET /api/analytics/category-breakdown ──────────────────
export async function getCategoryBreakdown(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopId = req.user!.shopId;
    const period = (req.query.period as string) || "month";
    const dateCondition = getStartDateCondition(period, "s.sold_at");

    const result = await query(
      `SELECT p.category as name, SUM(s.sale_price * s.quantity_sold)::numeric as value
       FROM sales_log s
       JOIN products p ON s.product_id = p.id
       WHERE s.shop_id = $1 AND ${dateCondition}
       GROUP BY p.category
       ORDER BY value DESC`,
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
