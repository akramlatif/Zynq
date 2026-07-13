// ============================================================
// ZYNQ — Supported Intents
// Single source of truth for all AI intents
// ============================================================

export const ZYNQ_INTENTS = {
  ADD_PRODUCT: "add_product",
  DELETE_PRODUCT: "delete_product",
  UPDATE_STOCK: "update_stock",
  GENERATE_BILL: "generate_bill",
  CHECK_STOCK: "check_stock",
  ADD_UDHAAR: "add_udhaar",
  GET_UDHAAR: "get_udhaar",
  GET_INSIGHTS: "get_insights",
  SET_ALERT: "set_alert",
  CLARIFY: "clarify",
  UNKNOWN: "unknown",
} as const;

export type IntentKey = keyof typeof ZYNQ_INTENTS;
export type IntentValue = (typeof ZYNQ_INTENTS)[IntentKey];

/** Human-readable descriptions for each intent (English + Urdu) */
export const INTENT_LABELS: Record<IntentValue, { en: string; ur: string }> = {
  add_product: { en: "Add Product", ur: "پروڈکٹ شامل کریں" },
  delete_product: { en: "Delete Product", ur: "پروڈکٹ حذف کریں" },
  update_stock: { en: "Update Stock", ur: "اسٹاک اپڈیٹ کریں" },
  generate_bill: { en: "Generate Bill", ur: "بل بنائیں" },
  check_stock: { en: "Check Stock", ur: "اسٹاک چیک کریں" },
  add_udhaar: { en: "Add Credit", ur: "ادھار درج کریں" },
  get_udhaar: { en: "View Credits", ur: "ادھار دیکھیں" },
  get_insights: { en: "Business Insights", ur: "کاروباری رپورٹ" },
  set_alert: { en: "Set Alert", ur: "الرٹ سیٹ کریں" },
  clarify: { en: "Need Clarification", ur: "وضاحت درکار" },
  unknown: { en: "Unknown", ur: "نامعلوم" },
};

/** Confidence threshold — below this, intent becomes "clarify" */
export const CONFIDENCE_THRESHOLD = 0.75;
