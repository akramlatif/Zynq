// ============================================================
// ZYNQ — Inventory Types
// ============================================================

export interface Product {
  id: string;
  name: string;
  name_urdu?: string;
  sku?: string;
  category: string;
  quantity: number;
  price: number;
  cost_price?: number;
  unit: string;
  expiry_date?: Date;
  alert_threshold: number;
  barcode?: string;
  image_url?: string;
  is_active: boolean;
  shop_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface StockMovement {
  id: string;
  product_id: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  reason?: string;
  reference_id?: string;
  created_by: string;
  created_at: Date;
}

export interface Category {
  id: string;
  name: string;
  name_urdu?: string;
  icon?: string;
  shop_id: string;
}

export interface LowStockAlert {
  product_id: string;
  product_name: string;
  current_qty: number;
  threshold_qty: number;
  severity: "warning" | "critical";
}
