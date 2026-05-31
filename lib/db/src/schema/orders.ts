import { pgTable, serial, text, integer, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  razorpayOrderId: varchar("razorpay_order_id", { length: 100 }),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 100 }).unique(),
  userId: varchar("user_id"),
  email: varchar("email", { length: 255 }),
  contact: varchar("contact", { length: 30 }),
  totalAmount: integer("total_amount").notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  status: varchar("status", { length: 30 }).notNull().default("paid"),
  items: jsonb("items").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Order = typeof ordersTable.$inferSelect;
export type InsertOrder = typeof ordersTable.$inferInsert;

export interface OrderItem {
  productId: number;
  name: string;
  price: number;
  qty: number;
}
