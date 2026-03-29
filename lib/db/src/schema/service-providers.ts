import { pgTable, serial, integer, text, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const serviceProvidersTable = pgTable("service_providers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),

  businessName: text("business_name").notNull(),
  category: text("category").notNull(),
  region: text("region"),
  city: text("city").notNull(),
  district: text("district"),
  coveredAreas: text("covered_areas"),
  description: text("description"),
  startingPrice: real("starting_price"),
  contactPhone: text("contact_phone"),
  whatsapp: text("whatsapp"),
  workingHours: text("working_hours"),

  // Portfolio images — newline-separated URLs
  portfolioImages: text("portfolio_images"),

  verified: boolean("verified").default(false),
  ratingAvg: real("rating_avg").default(0),
  ratingCount: integer("rating_count").default(0),
  status: text("status").notNull().default("active"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ServiceProvider = typeof serviceProvidersTable.$inferSelect;
export type InsertServiceProvider = typeof serviceProvidersTable.$inferInsert;
