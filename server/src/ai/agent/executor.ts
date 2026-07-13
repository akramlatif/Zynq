// ============================================================
// ZYNQ — AI Action Executor
// Maps parsed intents to database actions / internal logic
// Handles multi-turn confirmations via Conversation State
// ============================================================

import { query, pool } from "../../db";
import { ClassifierResult, Intent } from "./classifier";
import { redis } from "../../cache";

// ─── Conversation State Manager ──────────────────────────────
interface PendingState {
  action: Intent;
  entities: any;
  timestamp: number;
  context?: any;
}

// Key: `${shopId}_${userId}`
export const conversationState = {
  async get(key: string): Promise<PendingState | null> {
    const val = await redis.get(`chat_state:${key}`);
    return val ? JSON.parse(val) : null;
  },
  async set(key: string, state: PendingState): Promise<void> {
    await redis.set(`chat_state:${key}`, JSON.stringify(state), "EX", 900); // 15 min TTL
  },
  async delete(key: string): Promise<void> {
    await redis.del(`chat_state:${key}`);
  }
};

export interface ExecutorResponse {
  status: "success" | "error" | "pending_confirmation" | "cancelled" | "clarify";
  reply: string;
  data?: any;
}

// ─── Helper: Fuzzy Product Search ────────────────────────────
async function findProduct(shopId: string, name: string) {
  const res = await query(
    `SELECT * FROM products WHERE shop_id = $1 AND name ILIKE $2 LIMIT 1`,
    [shopId, `%${name}%`]
  );
  return res.rows[0]; // undefined if not found
}

// ─── Main Executor Function ──────────────────────────────────
export async function executeAction(
  shopId: string,
  userId: string,
  rawText: string,
  parsed: ClassifierResult
): Promise<ExecutorResponse> {
  const stateKey = `${shopId}_${userId}`;
  const pending = await conversationState.get(stateKey);

  // 1. Handle Multi-turn Confirmations
  if (pending) {
    const isConfirm = /^(yes|haan|ha|jee|ji|yup|ok|kardo|kar do|bilkul|theek)/i.test(rawText.trim());
    const isCancel = /^(no|nahi|na|cancel|ruk jao|reh do|rehne do)/i.test(rawText.trim());

    if (isConfirm) {
      const result = await executeConfirmedAction(shopId, userId, pending);
      await conversationState.delete(stateKey);
      return result;
    } else if (isCancel) {
      await conversationState.delete(stateKey);
      return { status: "cancelled", reply: "Theek hai, cancel kar diya." };
    }
    
    // If the user said something else entirely, we clear the pending state and evaluate it as a new intent.
    await conversationState.delete(stateKey);
  }

  // 2. Handle Immediate Clarification
  if (parsed.intent === "clarify" || parsed.intent === "unknown") {
    return {
      status: "clarify",
      reply: parsed.reply || "Mujhe samajh nahi aya, kya aap wazahat kar sakte hain?"
    };
  }

  // 3. Process New Intents
  try {
    switch (parsed.intent) {
      
      case "add_product": {
        const { name, quantity = 0, price, category = "other", expiry_date } = parsed.entities;
        if (!name || !price) return { status: "error", reply: "Product ka naam aur price batana zaroori hai." };

        const res = await query(
          `INSERT INTO products (shop_id, name, quantity, price, category, expiry_date) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [shopId, name, quantity, price, category, expiry_date || null]
        );
        return { status: "success", reply: `Done! ${name} stock mein add ho gaya.`, data: res.rows[0] };
      }

      case "update_stock": {
        const { name, new_quantity, delta } = parsed.entities;
        const product = await findProduct(shopId, name);
        if (!product) return { status: "error", reply: `Mujhe '${name}' stock mein nahi mila.` };

        let res;
        if (delta !== undefined) {
          res = await query(
            `UPDATE products SET quantity = GREATEST(quantity + $1, 0), updated_at = NOW() WHERE id = $2 RETURNING *`,
            [delta, product.id]
          );
        } else if (new_quantity !== undefined) {
          res = await query(
            `UPDATE products SET quantity = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [new_quantity, product.id]
          );
        } else {
          return { status: "error", reply: "Nayi quantity batana zaroori hai." };
        }
        return { status: "success", reply: `${product.name} ki quantity update ho gayi hai (New: ${res.rows[0].quantity}).` };
      }

      case "delete_product": {
        const { name } = parsed.entities;
        const product = await findProduct(shopId, name);
        if (!product) return { status: "error", reply: `Mujhe '${name}' delete karne ke liye nahi mila.` };

        // REQUIRE CONFIRMATION
        await conversationState.set(stateKey, {
          action: "delete_product",
          entities: { product_id: product.id },
          timestamp: Date.now()
        });
        return { 
          status: "pending_confirmation", 
          reply: `Aap waqai '${product.name}' ko hamesha ke liye delete karna chahte hain? (Yes/No)` 
        };
      }

      case "generate_bill": {
        const { items, customer_name } = parsed.entities;
        if (!items || !items.length) return { status: "error", reply: "Bill banane ke liye items batana zaroori hai." };

        let total = 0;
        const validatedItems = [];

        // Validate all items exist and have stock
        for (const item of items) {
          const product = await findProduct(shopId, item.name);
          if (!product) return { status: "error", reply: `Item '${item.name}' nahi mila.` };
          if (product.quantity < item.qty) return { status: "error", reply: `'${product.name}' ka stock kam hai. (Available: ${product.quantity})` };
          
          const itemTotal = Number(product.price) * item.qty;
          total += itemTotal;
          validatedItems.push({
            product_id: product.id,
            name: product.name,
            qty: item.qty,
            price: Number(product.price),
            total: itemTotal
          });
        }

        // REQUIRE CONFIRMATION
        await conversationState.set(stateKey, {
          action: "generate_bill",
          entities: { items: validatedItems, customer_name, total },
          timestamp: Date.now()
        });
        return { 
          status: "pending_confirmation", 
          reply: `Bill ka total Rs ${total} ban raha hai. Kya main bill generate kar doon? (Yes/No)` 
        };
      }

      case "check_stock": {
        const { name } = parsed.entities;
        if (name) {
          const product = await findProduct(shopId, name);
          if (!product) return { status: "error", reply: `'${name}' nahi mila.` };
          return { status: "success", reply: `'${product.name}' ka stock abhi ${product.quantity} hai.` };
        } else {
          // Low stock query
          const res = await query(`SELECT name, quantity FROM products WHERE shop_id = $1 AND quantity <= alert_threshold LIMIT 5`, [shopId]);
          if (res.rows.length === 0) return { status: "success", reply: "Sab kuch theek hai. Koi item low stock nahi hai." };
          const list = res.rows.map(r => `${r.name}: ${r.quantity}`).join("\n");
          return { status: "success", reply: `Yeh items khatam hone wale hain:\n${list}` };
        }
      }

      case "add_udhaar": {
        const { customer_name, amount, note } = parsed.entities;
        if (!customer_name || !amount) return { status: "error", reply: "Customer ka naam aur amount batana zaroori hai." };

        await query(
          `INSERT INTO udhaar (shop_id, customer_name, amount, is_paid, note) VALUES ($1, $2, $3, false, $4)`,
          [shopId, customer_name, amount, note || null]
        );
        return { status: "success", reply: `${customer_name} ke khate mein Rs ${amount} udhaar likh diya gaya hai.` };
      }

      case "get_udhaar": {
        const { customer_name } = parsed.entities;
        if (customer_name) {
          const res = await query(
            `SELECT SUM(amount) as total FROM udhaar WHERE shop_id = $1 AND customer_name ILIKE $2 AND is_paid = false`,
            [shopId, `%${customer_name}%`]
          );
          const amount = res.rows[0].total || 0;
          return { status: "success", reply: `${customer_name} ka total Rs ${amount} udhaar baqi hai.` };
        } else {
          const res = await query(
            `SELECT SUM(amount) as total FROM udhaar WHERE shop_id = $1 AND is_paid = false`,
            [shopId]
          );
          const amount = res.rows[0].total || 0;
          return { status: "success", reply: `Dukaan ka total outstanding udhaar Rs ${amount} hai.` };
        }
      }

      case "get_insights": {
        const { type } = parsed.entities;
        if (type === "top_sellers") {
          const res = await query(
            `SELECT p.name, SUM(s.quantity_sold)::int as sold FROM sales_log s JOIN products p ON s.product_id = p.id
             WHERE s.shop_id = $1 AND s.sold_at >= CURRENT_DATE - INTERVAL '30 days' GROUP BY p.name ORDER BY sold DESC LIMIT 3`,
            [shopId]
          );
          const list = res.rows.map(r => `${r.name} (${r.sold})`).join(", ");
          return { status: "success", reply: `Pichle 30 din ke top items yeh hain: ${list}` };
        }
        
        // Default revenue fallback
        const res = await query(`SELECT SUM(total)::numeric as total FROM bills WHERE shop_id = $1 AND created_at >= CURRENT_DATE`, [shopId]);
        const amount = res.rows[0].total || 0;
        return { status: "success", reply: `Aaj ki total sale Rs ${amount} hai.` };
      }

      case "set_alert": {
        const { product_name, threshold_qty } = parsed.entities;
        const product = await findProduct(shopId, product_name);
        if (!product) return { status: "error", reply: `Mujhe '${product_name}' nahi mila.` };

        await query(`UPDATE products SET alert_threshold = $1 WHERE id = $2`, [threshold_qty, product.id]);
        return { status: "success", reply: `Alert set ho gaya. Jab ${product.name} ${threshold_qty} se kam hoga toh main bata doonga.` };
      }

      default:
        return { status: "error", reply: "Oops! Main yeh action execute nahi kar paaya." };
    }
  } catch (error: any) {
    console.error("[Executor Error]:", error);
    return { status: "error", reply: "Internal server error aagaya hai. Thori der baad try karein." };
  }
}

// ─── Execute Confirmed Actions ───────────────────────────────
async function executeConfirmedAction(shopId: string, userId: string, pending: PendingState): Promise<ExecutorResponse> {
  const client = await pool.connect();

  try {
    if (pending.action === "delete_product") {
      await client.query(`DELETE FROM products WHERE id = $1 AND shop_id = $2`, [pending.entities.product_id, shopId]);
      return { status: "success", reply: "Product delete kar diya gaya hai." };
    }

    if (pending.action === "generate_bill") {
      await client.query("BEGIN");
      
      const { items, customer_name, total } = pending.entities;
      
      // Deduct stock & log sales
      for (const item of items) {
        await client.query(`UPDATE products SET quantity = quantity - $1 WHERE id = $2`, [item.qty, item.product_id]);
        await client.query(
          `INSERT INTO sales_log (shop_id, product_id, quantity_sold, sale_price) VALUES ($1, $2, $3, $4)`,
          [shopId, item.product_id, item.qty, item.price]
        );
      }

      // Generate Bill Record
      await client.query(
        `INSERT INTO bills (shop_id, cashier_id, items, total, customer_name) VALUES ($1, $2, $3, $4, $5)`,
        [shopId, userId, JSON.stringify(items), total, customer_name || null]
      );

      await client.query("COMMIT");
      return { status: "success", reply: `Bill successful generate ho gaya! Total: Rs ${total}` };
    }

    return { status: "error", reply: "Unknown pending action." };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[Confirmation Error]:", err);
    return { status: "error", reply: "Bill banate waqt error aagaya. Shayad stock kam hai." };
  } finally {
    client.release();
  }
}
