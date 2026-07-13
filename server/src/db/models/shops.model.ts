// ============================================================
// ZYNQ — Shops Table
// Each shop represents a single dukaan/business
// ============================================================

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

/** Subscription plan tiers */
export const planTypeEnum = pgEnum("plan_type", [
  "free",
  "starter",
  "pro",
  "enterprise",
]);

export const shops = pgTable("shops", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  owner_name: varchar("owner_name", { length: 150 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  city: varchar("city", { length: 100 }),
  plan_type: planTypeEnum("plan_type").default("free").notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Shop = typeof shops.$inferSelect;
export type NewShop = typeof shops.$inferInsert;
