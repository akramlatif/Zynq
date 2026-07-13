// ============================================================
// ZYNQ — Sales Log Table
// Denormalized log for fast analytics queries
// One row per product per sale (exploded from bill items)
// ============================================================

import {
  pgTable,
  uuid,
  integer,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { shops } from "./shops.model";
import { products } from "./products.model";

export const salesLog = pgTable(
  "sales_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shop_id: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    product_id: uuid("product_id")
      .references(() => products.id, { onDelete: "set null" }),
    quantity_sold: integer("quantity_sold").notNull(),
    sale_price: numeric("sale_price", { precision: 12, scale: 2 }).notNull(),
    sold_at: timestamp("sold_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    shopIdIdx: index("idx_sales_log_shop_id").on(table.shop_id),
    soldAtIdx: index("idx_sales_log_sold_at").on(table.sold_at),
    productIdx: index("idx_sales_log_product").on(table.shop_id, table.product_id),
    /** Composite index for time-range analytics per shop */
    analyticsIdx: index("idx_sales_log_analytics").on(
      table.shop_id,
      table.sold_at
    ),
  })
);

export type SalesLog = typeof salesLog.$inferSelect;
export type NewSalesLog = typeof salesLog.$inferInsert;
