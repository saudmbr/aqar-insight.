import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const marketerProfilesTable = pgTable("marketer_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }).unique().notNull(),

  officeName: text("office_name"),
  bio: text("bio"),
  city: text("city"),
  servedAreas: text("served_areas"),    // JSON array string
  specialties: text("specialties"),     // JSON array string
  yearsExperience: integer("years_experience"),
  licenseNumber: text("license_number"),
  photo: text("photo"),

  phone: text("phone"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  websiteUrl: text("website_url"),
  facebookUrl: text("facebook_url"),
  twitterUrl: text("twitter_url"),
  instagramUrl: text("instagram_url"),
  linkedinUrl: text("linkedin_url"),

  verified: boolean("verified").default(false),
  activeListingsCount: integer("active_listings_count").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MarketerProfile = typeof marketerProfilesTable.$inferSelect;
export type InsertMarketerProfile = typeof marketerProfilesTable.$inferInsert;
