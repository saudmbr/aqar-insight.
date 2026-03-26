import {
  pgTable,
  serial,
  text,
  real,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const listingsTable = pgTable("listings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),

  // Core
  title: text("title").notNull(),
  description: text("description"),
  propertyType: text("property_type").notNull(),
  listingType: text("listing_type").notNull(),
  status: text("status").notNull().default("active"),

  // Location
  city: text("city").notNull(),
  district: text("district"),
  location: text("location"),

  // Pricing
  price: real("price").notNull(),
  areaSqm: real("area_sqm"),
  pricePerSqm: real("price_per_sqm"),

  // Rooms
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  livingRooms: integer("living_rooms"),

  // Property details
  propertyAge: integer("property_age"),
  furnishingStatus: text("furnishing_status"),
  streetWidth: real("street_width"),
  facade: text("facade"),
  floorNumber: integer("floor_number"),
  totalFloors: integer("total_floors"),

  // Boolean features
  parking: boolean("parking").default(false),
  elevator: boolean("elevator").default(false),
  garden: boolean("garden").default(false),
  roof: boolean("roof").default(false),
  pool: boolean("pool").default(false),
  maidRoom: boolean("maid_room").default(false),
  driverRoom: boolean("driver_room").default(false),
  kitchen: boolean("kitchen").default(false),
  airConditioning: boolean("air_conditioning").default(false),
  electricityMeter: boolean("electricity_meter").default(false),
  waterMeter: boolean("water_meter").default(false),

  // Documents
  deedStatus: text("deed_status"),
  licenseStatus: text("license_status"),

  // Contact
  contactPhone: text("contact_phone"),
  whatsapp: text("whatsapp"),

  // Images — stored as newline-separated URLs
  images: text("images"),

  // Admin flags
  featured: boolean("featured").default(false),
  verified: boolean("verified").default(false),
  views: integer("views").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Listing = typeof listingsTable.$inferSelect;
export type InsertListing = typeof listingsTable.$inferInsert;
