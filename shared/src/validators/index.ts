import { z } from "zod";

// ============================================================
// ZYNQ — Shared Zod Validators
// Used by both client (form validation) and server (API validation)
// ============================================================

// ─── AUTH ───────────────────────────────────────────────────

export const loginSchema = z.object({
  email_or_phone: z.string().min(1, "Email or phone is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .regex(/^(\+92|0)?3[0-9]{9}$/, "Invalid Pakistani phone number"),
  password: z.string().min(8).max(128),
  shop_name: z.string().min(2).max(200),
  business_type: z.string().min(1),
  city: z.string().optional(),
});

// ─── PRODUCTS ──────────────────────────────────────────────

export const addProductSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().int().min(0),
  price: z.number().min(0),
  cost_price: z.number().min(0).optional(),
  category: z.string().optional(),
  unit: z.string().default("piece"),
  expiry_date: z.string().datetime().optional(),
  alert_threshold: z.number().int().min(0).default(5),
  barcode: z.string().optional(),
});

export const updateStockSchema = z.object({
  name: z.string().min(1),
  new_quantity: z.number().int().min(0).optional(),
  delta: z.number().int().optional(),
});

// ─── BILLING ───────────────────────────────────────────────

export const billItemSchema = z.object({
  name: z.string().min(1),
  qty: z.number().int().min(1),
  price: z.number().min(0).optional(),
});

export const generateBillSchema = z.object({
  items: z.array(billItemSchema).min(1, "At least one item is required"),
  customer_name: z.string().optional(),
  payment_method: z
    .enum(["cash", "udhaar", "online", "mixed"])
    .default("cash"),
  discount: z.number().min(0).default(0),
});

// ─── UDHAAR ────────────────────────────────────────────────

export const addUdhaarSchema = z.object({
  customer_name: z.string().min(1),
  amount: z.number().min(1, "Amount must be at least 1"),
  note: z.string().optional(),
  customer_phone: z
    .string()
    .regex(/^(\+92|0)?3[0-9]{9}$/)
    .optional(),
  due_date: z.string().datetime().optional(),
});

// ─── INSIGHTS ──────────────────────────────────────────────

export const getInsightsSchema = z.object({
  period: z.enum(["today", "week", "month"]),
  type: z.enum(["top_sellers", "slow", "profit"]),
});

// ─── ALERTS ────────────────────────────────────────────────

export const setAlertSchema = z.object({
  product_name: z.string().min(1),
  threshold_qty: z.number().int().min(1),
});

// ─── PAGINATION ────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
});
