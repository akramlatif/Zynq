// ============================================================
// ZYNQ — Products Table
// Inventory items tracked per shop
// ============================================================

import {
  pgTable,
  uuid,
  varchar,
  integer,
  numeric,
  timestamp,
  date,
  index,
} from "drizzle-orm/pg-core";
import { shops } from "./shops.model";

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shop_id: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    category: varchar("category", { length: 100 }).default("other").notNull(),
    quantity: integer("quantity").default(0).notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    cost_price: numeric("cost_price", { precision: 12, scale: 2 }),
    expiry_date: date("expiry_date"),
    alert_threshold: integer("alert_threshold").default(5).notNull(),
    barcode: varchar("barcode", { length: 100 }),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    shopIdIdx: index("idx_products_shop_id").on(table.shop_id),
    categoryIdx: index("idx_products_category").on(table.shop_id, table.category),
    barcodeIdx: index("idx_products_barcode").on(table.barcode),
    nameIdx: index("idx_products_name").on(table.shop_id, table.name),
  })
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
