// ============================================================
// ZYNQ — Udhaar (Credit/Khata) Table
// Tracks credit given to customers
// ============================================================

import {
  pgTable,
  uuid,
  varchar,
  numeric,
  boolean,
  timestamp,
  text,
  index,
} from "drizzle-orm/pg-core";
import { shops } from "./shops.model";

export const udhaar = pgTable(
  "udhaar",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shop_id: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    customer_name: varchar("customer_name", { length: 150 }).notNull(),
    customer_phone: varchar("customer_phone", { length: 20 }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    is_paid: boolean("is_paid").default(false).notNull(),
    note: text("note"),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    shopIdIdx: index("idx_udhaar_shop_id").on(table.shop_id),
    customerIdx: index("idx_udhaar_customer").on(
      table.shop_id,
      table.customer_name
    ),
    isPaidIdx: index("idx_udhaar_is_paid").on(table.shop_id, table.is_paid),
  })
);

export type Udhaar = typeof udhaar.$inferSelect;
export type NewUdhaar = typeof udhaar.$inferInsert;
