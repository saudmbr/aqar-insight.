import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const customerRequestsTable = pgTable("customer_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),

  requestType: text("request_type").notNull().default("property"),
  title: text("title").notNull(),
  category: text("category"),
  region: text("region"),
  city: text("city").notNull(),
  district: text("district"),
  budgetMin: real("budget_min"),
  budgetMax: real("budget_max"),
  details: text("details"),
  marketerName: text("marketer_name"),
  contactMethod: text("contact_method"),
  contactInfo: text("contact_info"),
  status: text("status").notNull().default("open"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CustomerRequest = typeof customerRequestsTable.$inferSelect;
export type InsertCustomerRequest = typeof customerRequestsTable.$inferInsert;
