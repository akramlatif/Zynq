// ============================================================
// ZYNQ — Bills Table
// Transaction records with JSONB items array
// ============================================================

import {
  pgTable,
  uuid,
  varchar,
  numeric,
  timestamp,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { shops } from "./shops.model";
import { users } from "./users.model";

/** Payment method options */
export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "udhaar",
  "online",
  "mixed",
]);

/**
 * Shape of each item stored in the JSONB `items` column
 * Example: [{ "name": "Panadol", "qty": 2, "price": 50, "total": 100 }]
 */
export interface BillItemJSON {
  product_id?: string;
  name: string;
  qty: number;
  price: number;
  total: number;
}

export const bills = pgTable(
  "bills",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shop_id: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    cashier_id: uuid("cashier_id")
      .references(() => users.id, { onDelete: "set null" }),
    items: jsonb("items").$type<BillItemJSON[]>().notNull(),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    payment_method: paymentMethodEnum("payment_method")
      .default("cash")
      .notNull(),
    customer_name: varchar("customer_name", { length: 150 }),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    shopIdIdx: index("idx_bills_shop_id").on(table.shop_id),
    cashierIdx: index("idx_bills_cashier_id").on(table.cashier_id),
    createdAtIdx: index("idx_bills_created_at").on(table.shop_id, table.created_at),
  })
);

export type Bill = typeof bills.$inferSelect;
export type NewBill = typeof bills.$inferInsert;
