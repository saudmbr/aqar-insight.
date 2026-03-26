import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const propertiesTable = pgTable("properties", {
  id: serial("id").primaryKey(),
  city: text("city").notNull(),
  district: text("district").notNull(),
  propertyType: text("property_type").notNull(),
  listingType: text("listing_type").notNull(),
  price: real("price").notNull(),
  area: real("area").notNull(),
  pricePerSqm: real("price_per_sqm").notNull(),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  recordedAt: text("recorded_at").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPropertySchema = createInsertSchema(propertiesTable).omit({
  id: true,
  createdAt: true,
  pricePerSqm: true,
});

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof propertiesTable.$inferSelect;
