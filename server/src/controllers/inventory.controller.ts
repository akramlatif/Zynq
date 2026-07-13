// ============================================================
// ZYNQ — Inventory Controller
// Handlers for products CRUD, low-stock, and expiring items
// ============================================================

import { Request, Response, NextFunction } from "express";
import { query } from "../db";
import { ApiError } from "../middleware/error.middleware";

// ─── GET /api/products ──────────────────────────────────────
export async function getProducts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopId = req.user!.shopId;
    const { page = "1", limit = "20", search, category } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    let sql = `SELECT * FROM products WHERE shop_id = $1`;
    const params: any[] = [shopId];

    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (name ILIKE $${params.length} OR barcode ILIKE $${params.length})`;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    
    // Create count query for pagination metadata
    let countSql = `SELECT COUNT(*) FROM products WHERE shop_id = $1`;
    const countParams: any[] = [shopId];

    if (category) {
      countParams.push(category);
      countSql += ` AND category = $${countParams.length}`;
    }

    if (search) {
      countParams.push(`%${search}%`);
      countSql += ` AND (name ILIKE $${countParams.length} OR barcode ILIKE $${countParams.length})`;
    }

    const [productsRes, countRes] = await Promise.all([
      query([...params, limitNum, offset].join(" ") ? sql : sql, [...params, limitNum, offset]),
      query(countSql, countParams),
    ]);

    const total = parseInt(countRes.rows[0].count, 10);
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: productsRes.rows,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: totalPages,
        has_next: pageNum < totalPages,
        has_prev: pageNum > 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── GET /api/products/low-stock ────────────────────────────
export async function getLowStock(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopId = req.user!.shopId;

    const result = await query(
      `SELECT * FROM products 
       WHERE shop_id = $1 AND quantity <= alert_threshold 
       ORDER BY quantity ASC`,
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

// ─── GET /api/products/expiring ─────────────────────────────
export async function getExpiring(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopId = req.user!.shopId;
    const days = parseInt(req.query.days as string, 10) || 30;

    const result = await query(
      `SELECT * FROM products 
       WHERE shop_id = $1 
         AND expiry_date IS NOT NULL 
         AND expiry_date <= CURRENT_DATE + $2::integer
         AND expiry_date >= CURRENT_DATE
       ORDER BY expiry_date ASC`,
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

// ─── GET /api/products/:id ──────────────────────────────────
export async function getProductById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopId = req.user!.shopId;
    const { id } = req.params;

    const result = await query(
      `SELECT * FROM products WHERE id = $1 AND shop_id = $2 LIMIT 1`,
      [id, shopId]
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound("Product not found");
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// ─── POST /api/products ─────────────────────────────────────
export async function addProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopId = req.user!.shopId;
    const {
      name,
      category = "other",
      quantity = 0,
      price,
      cost_price = null,
      expiry_date = null,
      alert_threshold = 5,
      barcode = null,
    } = req.body;

    const result = await query(
      `INSERT INTO products 
        (shop_id, name, category, quantity, price, cost_price, expiry_date, alert_threshold, barcode) 
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [shopId, name, category, quantity, price, cost_price, expiry_date, alert_threshold, barcode]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// ─── PUT /api/products/:id ──────────────────────────────────
export async function updateProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopId = req.user!.shopId;
    const { id } = req.params;
    const {
      name,
      category,
      quantity,
      price,
      cost_price,
      expiry_date,
      alert_threshold,
      barcode,
    } = req.body;

    const result = await query(
      `UPDATE products SET 
         name = COALESCE($1, name),
         category = COALESCE($2, category),
         quantity = COALESCE($3, quantity),
         price = COALESCE($4, price),
         cost_price = COALESCE($5, cost_price),
         expiry_date = COALESCE($6, expiry_date),
         alert_threshold = COALESCE($7, alert_threshold),
         barcode = COALESCE($8, barcode),
         updated_at = NOW()
       WHERE id = $9 AND shop_id = $10 
       RETURNING *`,
      [name, category, quantity, price, cost_price, expiry_date, alert_threshold, barcode, id, shopId]
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound("Product not found");
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// ─── DELETE /api/products/:id ───────────────────────────────
export async function deleteProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopId = req.user!.shopId;
    const { id } = req.params;

    const result = await query(
      `DELETE FROM products WHERE id = $1 AND shop_id = $2 RETURNING id`,
      [id, shopId]
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound("Product not found");
    }

    res.status(200).json({
      success: true,
      data: { message: "Product deleted successfully" },
    });
  } catch (error) {
    next(error);
  }
}

// ─── PATCH /api/products/:id/stock ──────────────────────────
export async function updateStock(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopId = req.user!.shopId;
    const { id } = req.params;
    const delta = parseInt(req.body.delta as string, 10);

    // Ensure quantity doesn't drop below zero
    const result = await query(
      `UPDATE products 
       SET quantity = GREATEST(quantity + $1, 0),
           updated_at = NOW()
       WHERE id = $2 AND shop_id = $3
       RETURNING *`,
      [delta, id, shopId]
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound("Product not found");
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}
