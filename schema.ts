import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  ownerName: varchar("owner_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 80 }).notNull().default(""),
  address: varchar("address", { length: 255 }).notNull().default(""),
  currency: varchar("currency", { length: 12 }).notNull().default("د.ج"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activities = pgTable(
  "activities",
  {
    id: serial("id").primaryKey(),
    shopId: integer("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 64 }).notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("activities_shop_type_idx").on(table.shopId, table.type)],
);

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 80 }).notNull().default(""),
  activityType: varchar("activity_type", { length: 64 }).notNull(),
  purchasePrice: doublePrecision("purchase_price").notNull().default(0),
  stock: doublePrecision("stock").notNull().default(0),
  unit: varchar("unit", { length: 40 }).notNull().default("قطعة"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  customerName: varchar("customer_name", { length: 255 }).notNull().default(""),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  activityType: varchar("activity_type", { length: 64 }).notNull(),
  quantity: doublePrecision("quantity").notNull().default(1),
  unitPrice: doublePrecision("unit_price").notNull().default(0),
  unitCost: doublePrecision("unit_cost").notNull().default(0),
  rent: doublePrecision("rent").notNull().default(0),
  wages: doublePrecision("wages").notNull().default(0),
  transport: doublePrecision("transport").notNull().default(0),
  food: doublePrecision("food").notNull().default(0),
  other: doublePrecision("other").notNull().default(0),
  status: varchar("status", { length: 24 }).notNull().default("completed"),
  note: text("note").notNull().default(""),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 64 }).notNull(),
  amount: doublePrecision("amount").notNull().default(0),
  note: text("note").notNull().default(""),
  vendor: varchar("vendor", { length: 255 }).notNull().default(""),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const shareLinks = pgTable("share_links", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 96 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  periodStart: timestamp("period_start", { withTimezone: true }),
  periodEnd: timestamp("period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Shop = typeof shops.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type ShareLink = typeof shareLinks.$inferSelect;
