// ============================================================
// ZYNQ — Billing Types
// ============================================================

export interface Bill {
  id: string;
  bill_number: string;
  customer_name?: string;
  customer_phone?: string;
  items: BillLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: "cash" | "udhaar" | "online" | "mixed";
  status: "draft" | "completed" | "cancelled" | "refunded";
  notes?: string;
  shop_id: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface BillLineItem {
  id: string;
  bill_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount?: number;
}

export interface DailySummary {
  date: string;
  total_sales: number;
  total_bills: number;
  total_items_sold: number;
  cash_collected: number;
  udhaar_given: number;
}
