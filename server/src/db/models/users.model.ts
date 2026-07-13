// ============================================================
// ZYNQ — Users Table
// Shop staff: owners and cashiers
// ============================================================

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { shops } from "./shops.model";

/** User role within a shop */
export const userRoleEnum = pgEnum("user_role", ["owner", "cashier"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shop_id: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull().unique(),
    role: userRoleEnum("role").default("cashier").notNull(),
    password_hash: varchar("password_hash", { length: 255 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    shopIdIdx: index("idx_users_shop_id").on(table.shop_id),
    phoneIdx: index("idx_users_phone").on(table.phone),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
