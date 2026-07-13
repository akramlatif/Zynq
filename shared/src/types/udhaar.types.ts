// ============================================================
// ZYNQ — Udhaar (Credit/Khata) Types
// ============================================================

export interface UdhaarRecord {
  id: string;
  customer_name: string;
  customer_phone?: string;
  amount: number;
  type: "given" | "received";
  note?: string;
  bill_id?: string;
  status: "pending" | "partial" | "settled";
  due_date?: Date;
  shop_id: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface UdhaarPayment {
  id: string;
  udhaar_id: string;
  amount: number;
  payment_method: "cash" | "online";
  note?: string;
  created_at: Date;
}

export interface CustomerLedger {
  customer_name: string;
  customer_phone?: string;
  total_udhaar: number;
  total_paid: number;
  balance: number;
  last_transaction: Date;
  records: UdhaarRecord[];
}
