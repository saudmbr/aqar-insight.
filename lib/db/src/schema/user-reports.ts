import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const userReportsTable = pgTable("user_reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id"),
  targetType: text("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  targetTitle: text("target_title"),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
