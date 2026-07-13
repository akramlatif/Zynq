// ============================================================
// ZYNQ — Billing Controller
// Handlers for creating bills, deducting stock, logging sales
// ============================================================

import { Request, Response, NextFunction } from "express";
import { pool, query } from "../db";
import { ApiError } from "../middleware/error.middleware";
import { sendReceipt, getRateLimitStatus } from "../services/whatsapp.service";

// ─── POST /api/bills ────────────────────────────────────────
export async function createBill(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const client = await pool.connect();
  
  try {
    const shopId = req.user!.shopId;
    const cashierId = req.user!.userId;
    const { items, payment_method = "cash", customer_name } = req.body;

    await client.query("BEGIN");

    let total = 0;
    const itemsWithPrices = [];

    // 1. Process items, deduct stock, calculate total
    for (const item of items) {
      // Find product and check stock
      const productRes = await client.query(
        "SELECT id, name, price, quantity FROM products WHERE id = $1 AND shop_id = $2 FOR UPDATE",
        [item.product_id, shopId]
      );

      if (productRes.rows.length === 0) {
        throw ApiError.notFound(`Product not found: ${item.product_id}`);
      }

      const product = productRes.rows[0];

      if (product.quantity < item.qty) {
        throw ApiError.badRequest(`Insufficient stock for ${product.name}. Available: ${product.quantity}`);
      }

      // Deduct stock
      await client.query(
        "UPDATE products SET quantity = quantity - $1, updated_at = NOW() WHERE id = $2",
        [item.qty, product.id]
      );

      const itemTotal = Number(product.price) * item.qty;
      total += itemTotal;

      itemsWithPrices.push({
        product_id: product.id,
        name: product.name,
        qty: item.qty,
        price: Number(product.price),
        total: itemTotal,
      });
      
      // 2. Insert into sales_log
      await client.query(
        "INSERT INTO sales_log (shop_id, product_id, quantity_sold, sale_price) VALUES ($1, $2, $3, $4)",
        [shopId, product.id, item.qty, product.price]
      );
    }

    // 3. Generate Bill Number (e.g., BILL-2024-0001)
    const currentYear = new Date().getFullYear();
    const countRes = await client.query(
      "SELECT COUNT(*) FROM bills WHERE shop_id = $1 AND EXTRACT(YEAR FROM created_at) = $2",
      [shopId, currentYear]
    );
    const billCount = parseInt(countRes.rows[0].count, 10) + 1;
    const billNumber = `BILL-${currentYear}-${String(billCount).padStart(4, "0")}`;

    // 4. Create the Bill record
    // Note: We are dynamically adding bill_number to the JSON response even if it's not a standalone column in the schema.
    // If the schema was altered to have bill_number, we would insert it there. For now, we will structure it inside the returned object.
    const billRes = await client.query(
      `INSERT INTO bills (shop_id, cashier_id, items, total, payment_method, customer_name)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [shopId, cashierId, JSON.stringify(itemsWithPrices), total, payment_method, customer_name || null]
    );

    await client.query("COMMIT");

    const createdBill = {
      ...billRes.rows[0],
      bill_number: billNumber,
    };

    res.status(201).json({
      success: true,
      data: createdBill,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
}

// ─── GET /api/bills ─────────────────────────────────────────
export async function getBills(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopId = req.user!.shopId;
    const { page = "1", limit = "20", start_date, end_date } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    let sql = `SELECT * FROM bills WHERE shop_id = $1`;
    let countSql = `SELECT COUNT(*) FROM bills WHERE shop_id = $1`;
    const params: any[] = [shopId];

    if (start_date && end_date) {
      params.push(start_date);
      params.push(end_date);
      sql += ` AND created_at >= $${params.length - 1} AND created_at <= $${params.length}`;
      countSql += ` AND created_at >= $${params.length - 1} AND created_at <= $${params.length}`;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const [billsRes, countRes] = await Promise.all([
      query(sql, [...params, limitNum, offset]),
      query(countSql, params),
    ]);

    const total = parseInt(countRes.rows[0].count, 10);
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: billsRes.rows,
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

// ─── GET /api/bills/:id ─────────────────────────────────────
export async function getBillById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopId = req.user!.shopId;
    const { id } = req.params;

    const result = await query(
      `SELECT * FROM bills WHERE id = $1 AND shop_id = $2 LIMIT 1`,
      [id, shopId]
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound("Bill not found");
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// ─── POST /api/bills/:id/send-whatsapp ──────────────────────
export async function sendBillWhatsApp(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopId = req.user!.shopId;
    const { id } = req.params;
    const { phone } = req.body;

    if (!phone) {
      throw ApiError.badRequest("Customer phone number is required");
    }

    // 1. Fetch the bill
    const billResult = await query(
      `SELECT * FROM bills WHERE id = $1 AND shop_id = $2 LIMIT 1`,
      [id, shopId]
    );

    if (billResult.rows.length === 0) {
      throw ApiError.notFound("Bill not found");
    }

    const bill = billResult.rows[0];

    // 2. Fetch the shop name
    const shopResult = await query(
      `SELECT name FROM shops WHERE id = $1 LIMIT 1`,
      [shopId]
    );
    const shopName = shopResult.rows[0]?.name || "Zynq Shop";

    // 3. Parse items from the bill's JSON column
    const items = typeof bill.items === "string" ? JSON.parse(bill.items) : bill.items;

    // 4. Generate a bill number from ID if not stored
    const billNumber = bill.bill_number || `BILL-${bill.id.substring(0, 8).toUpperCase()}`;

    // 5. Send via WhatsApp
    const result = await sendReceipt(phone, {
      billNumber,
      shopName,
      items: items.map((i: any) => ({
        name: i.name,
        qty: i.qty,
        price: i.price,
      })),
      total: Number(bill.total),
      paymentMethod: bill.payment_method,
      date: new Date(bill.created_at).toLocaleDateString("ur-PK"),
    });

    if (!result.success) {
      throw ApiError.internal(result.error || "Failed to send WhatsApp message");
    }

    res.status(200).json({
      success: true,
      data: {
        messageId: result.messageId,
        rateLimitStatus: getRateLimitStatus(),
      },
    });
  } catch (error) {
    next(error);
  }
}
