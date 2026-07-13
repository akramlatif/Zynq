// ============================================================
// ZYNQ — AI Intent & Entity Types
// Core types for the NLP intent parsing system
// ============================================================

/** All supported intents the AI agent can recognize */
export type ZynqIntent =
  | "add_product"
  | "delete_product"
  | "update_stock"
  | "generate_bill"
  | "check_stock"
  | "add_udhaar"
  | "get_udhaar"
  | "get_insights"
  | "set_alert"
  | "clarify"
  | "unknown";

/** Entity shapes for each intent */
export interface AddProductEntities {
  name: string;
  quantity: number;
  price: number;
  category?: string;
  expiry_date?: string;
}

export interface DeleteProductEntities {
  name?: string;
  product_id?: string;
}

export interface UpdateStockEntities {
  name: string;
  new_quantity?: number;
  delta?: number;
}

export interface BillItem {
  name: string;
  qty: number;
  price?: number;
}

export interface GenerateBillEntities {
  items: BillItem[];
  customer_name?: string;
}

export interface CheckStockEntities {
  name?: string | null;
}

export interface AddUdhaarEntities {
  customer_name: string;
  amount: number;
  note?: string;
}

export interface GetUdhaarEntities {
  customer_name?: string;
}

export interface GetInsightsEntities {
  period: "today" | "week" | "month";
  type: "top_sellers" | "slow" | "profit";
}

export interface SetAlertEntities {
  product_name: string;
  threshold_qty: number;
}

/** The universal AI response structure */
export interface ZynqAIResponse<T = Record<string, unknown>> {
  intent: ZynqIntent;
  entities: T;
  confidence: number;
  reply: string;
}

/** Conversation memory entry */
export interface ConversationEntry {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  intent?: ZynqIntent;
}
