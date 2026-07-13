// ============================================================
// ZYNQ — Smart Alerts Service
// Queries DB for stock, expiries, slow movers, and sends WhatsApp alerts.
// ============================================================

import { pool, query } from "../db";
import { logger } from "../utils/logger";
import { sendWhatsAppMessage } from "./whatsapp.service";

/**
 * Helper: Log the alert to the database
 */
async function logAlert(shopId: string, type: string, message: string, status: string) {
  try {
    await query(
      `INSERT INTO alerts_log (shop_id, type, message, status) VALUES ($1, $2, $3, $4)`,
      [shopId, type, message, status]
    );
  } catch (error) {
    logger.error(`[Alerts] Failed to log alert for shop ${shopId}:`, error);
  }
}

/**
 * DAILY STOCK & EXPIRY ALERT
 * Runs daily at 8am.
 * Finds expiring products (<30 days) and low stock (<= threshold).
 */
export async function runDailyStockAndExpiryAlert(targetShopId?: string) {
  const client = await pool.connect();
  try {
    logger.info(`[Alerts] Running Daily Stock & Expiry Alert ${targetShopId ? `for shop ${targetShopId}` : ""}`);
    
    // Get shops to process
    let shopQuery = `SELECT id, name, owner_name, phone FROM shops`;
    let shopParams: any[] = [];
    if (targetShopId) {
      shopQuery += ` WHERE id = $1`;
      shopParams.push(targetShopId);
    }
    const shopsRes = await client.query(shopQuery, shopParams);
    
    for (const shop of shopsRes.rows) {
      // 1. Check expiring products (next 30 days)
      const expiringRes = await client.query(`
        SELECT name, quantity, expiry_date 
        FROM products 
        WHERE shop_id = $1 
          AND expiry_date IS NOT NULL 
          AND expiry_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
        ORDER BY expiry_date ASC
      `, [shop.id]);

      // 2. Check low stock products
      const lowStockRes = await client.query(`
        SELECT name, quantity, alert_threshold 
        FROM products 
        WHERE shop_id = $1 
          AND quantity <= alert_threshold
        ORDER BY quantity ASC
      `, [shop.id]);

      if (expiringRes.rows.length === 0 && lowStockRes.rows.length === 0) {
        continue; // Nothing to report for this shop
      }

      // Format WhatsApp Message
      let message = `🔔 *روزانہ الرٹ - ${shop.name}*\n`;
      message += `السلام علیکم ${shop.owner_name}، آپ کی دکان کی آج کی رپورٹ:\n\n`;

      if (expiringRes.rows.length > 0) {
        message += `⚠️ *جلد ایکسپائر ہونے والی اشیاء:*\n`;
        expiringRes.rows.forEach((p: any) => {
          message += `• ${p.name} (${p.quantity} موجود) - ${new Date(p.expiry_date).toLocaleDateString('ur-PK')}\n`;
        });
        message += `\n`;
      }

      if (lowStockRes.rows.length > 0) {
        message += `📉 *کم اسٹاک والی اشیاء:*\n`;
        lowStockRes.rows.forEach((p: any) => {
          message += `• ${p.name} (صرف ${p.quantity} باقی)\n`;
        });
      }

      message += `\nبراہ کرم ان اشیاء کا آرڈر دے دیں تاکہ آپ کا کاروبار متاثر نہ ہو۔\n— Zynq AI`;

      // Send via WhatsApp
      const result = await sendWhatsAppMessage(shop.phone, message);
      
      // Log it
      await logAlert(
        shop.id, 
        targetShopId ? 'manual_test' : 'daily_stock', 
        message, 
        result.success ? 'sent' : 'failed'
      );
    }
  } catch (error) {
    logger.error("[Alerts] Daily Stock Alert Error:", error);
  } finally {
    client.release();
  }
}

/**
 * WEEKLY SUMMARY ALERT
 * Runs every Monday at 9am.
 * Sends top 5 sellers and total revenue for the past 7 days.
 */
export async function runWeeklySummaryAlert(targetShopId?: string) {
  const client = await pool.connect();
  try {
    logger.info(`[Alerts] Running Weekly Summary Alert ${targetShopId ? `for shop ${targetShopId}` : ""}`);
    
    let shopQuery = `SELECT id, name, owner_name, phone FROM shops`;
    let shopParams: any[] = [];
    if (targetShopId) {
      shopQuery += ` WHERE id = $1`;
      shopParams.push(targetShopId);
    }
    const shopsRes = await client.query(shopQuery, shopParams);

    for (const shop of shopsRes.rows) {
      // 1. Get total revenue for last 7 days
      const revenueRes = await client.query(`
        SELECT SUM(total) as revenue 
        FROM bills 
        WHERE shop_id = $1 
          AND created_at >= NOW() - INTERVAL '7 days'
      `, [shop.id]);
      
      const revenue = Number(revenueRes.rows[0]?.revenue || 0);

      // 2. Get top 5 selling products
      const topSellersRes = await client.query(`
        SELECT p.name, SUM(s.quantity_sold) as qty, SUM(s.quantity_sold * s.sale_price) as total_sales
        FROM sales_log s
        JOIN products p ON s.product_id = p.id
        WHERE s.shop_id = $1 
          AND s.sold_at >= NOW() - INTERVAL '7 days'
        GROUP BY p.name
        ORDER BY qty DESC
        LIMIT 5
      `, [shop.id]);

      // Even if revenue is 0, we send the report so they know it was a slow week
      let message = `📊 *ہفتہ وار رپورٹ - ${shop.name}*\n`;
      message += `السلام علیکم ${shop.owner_name}، پچھلے 7 دنوں کا خلاصہ:\n\n`;
      message += `💰 *کل آمدنی:* Rs ${revenue.toLocaleString()}\n\n`;

      if (topSellersRes.rows.length > 0) {
        message += `🏆 *سب سے زیادہ فروخت ہونے والی اشیاء:*\n`;
        topSellersRes.rows.forEach((p: any, i: number) => {
          message += `${i + 1}. ${p.name} - ${p.qty} یونٹ (Rs ${Number(p.total_sales).toLocaleString()})\n`;
        });
      } else {
        message += `اس ہفتے کوئی خاص فروخت ریکارڈ نہیں ہوئی۔\n`;
      }

      message += `\n— Zynq AI`;

      const result = await sendWhatsAppMessage(shop.phone, message);
      await logAlert(shop.id, 'weekly_summary', message, result.success ? 'sent' : 'failed');
    }
  } catch (error) {
    logger.error("[Alerts] Weekly Summary Alert Error:", error);
  } finally {
    client.release();
  }
}

/**
 * SLOW MOVERS CHECK
 * Runs daily at 9pm.
 * Finds products with qty > 0 that haven't sold in 14 days and updates the slow_movers table.
 */
export async function runSlowMoversCheck(targetShopId?: string) {
  const client = await pool.connect();
  try {
    logger.info(`[Alerts] Running Slow Movers Check ${targetShopId ? `for shop ${targetShopId}` : ""}`);
    
    // Find products that exist in inventory (> 0), 
    // and either have NO sales log ever, or no sales log in the last 14 days,
    // AND were created more than 14 days ago (to give new products a chance).
    let slowMoversQuery = `
      SELECT p.shop_id, p.id as product_id, p.quantity,
             MAX(s.sold_at) as last_sale_date
      FROM products p
      LEFT JOIN sales_log s ON p.id = s.product_id
      WHERE p.quantity > 0
        AND p.created_at <= NOW() - INTERVAL '14 days'
    `;
    
    let queryParams: any[] = [];
    if (targetShopId) {
      slowMoversQuery += ` AND p.shop_id = $1`;
      queryParams.push(targetShopId);
    }
    
    slowMoversQuery += `
      GROUP BY p.shop_id, p.id, p.quantity
      HAVING MAX(s.sold_at) IS NULL OR MAX(s.sold_at) <= NOW() - INTERVAL '14 days'
    `;

    const res = await client.query(slowMoversQuery, queryParams);

    // Upsert into slow_movers table
    if (res.rows.length > 0) {
      await client.query("BEGIN");
      
      for (const row of res.rows) {
        await client.query(`
          INSERT INTO slow_movers (shop_id, product_id, last_sale_date, qty_remaining, flagged_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (shop_id, product_id) 
          DO UPDATE SET 
            qty_remaining = EXCLUDED.qty_remaining,
            flagged_at = NOW()
        `, [row.shop_id, row.product_id, row.last_sale_date, row.quantity]);
      }

      await client.query("COMMIT");
      logger.info(`[Alerts] Flagged ${res.rows.length} slow movers.`);
    }

  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("[Alerts] Slow Movers Check Error:", error);
  } finally {
    client.release();
  }
}
