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
  marketerId: integer("marketer_id").references(() => usersTable.id, { onDelete: "set null" }),

  // Core
  title: text("title").notNull(),
  description: text("description"),
  propertyType: text("property_type").notNull(),
  listingType: text("listing_type").notNull(),
  listingPurpose: text("listing_purpose"),
  status: text("status").notNull().default("active"),
  referenceNumber: text("reference_number"),

  // Location
  city: text("city").notNull(),
  district: text("district"),
  subDistrict: text("sub_district"),
  location: text("location"),
  latitude: real("latitude"),
  longitude: real("longitude"),

  // Pricing
  price: real("price").notNull(),
  areaSqm: real("area_sqm"),
  pricePerSqm: real("price_per_sqm"),
  negotiable: boolean("negotiable").default(false),

  // Rooms
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  livingRooms: integer("living_rooms"),
  kitchens: integer("kitchens"),

  // Property details
  propertyAge: integer("property_age"),
  furnishingStatus: text("furnishing_status"),
  streetWidth: real("street_width"),
  numberOfStreets: integer("number_of_streets"),
  facade: text("facade"),
  floorNumber: integer("floor_number"),
  totalFloors: integer("total_floors"),
  buildingQuality: text("building_quality"),
  finishingType: text("finishing_type"),
  availabilityDate: text("availability_date"),

  // Boolean amenities — أساسية
  parking: boolean("parking").default(false),
  elevator: boolean("elevator").default(false),
  garden: boolean("garden").default(false),
  roof: boolean("roof").default(false),
  pool: boolean("pool").default(false),
  maidRoom: boolean("maid_room").default(false),
  driverRoom: boolean("driver_room").default(false),
  storageRoom: boolean("storage_room").default(false),
  kitchen: boolean("kitchen").default(false),
  balcony: boolean("balcony").default(false),
  basement: boolean("basement").default(false),
  airConditioning: boolean("air_conditioning").default(false),
  majlis: boolean("majlis").default(false),
  prayerRoom: boolean("prayer_room").default(false),
  wardrobeRoom: boolean("wardrobe_room").default(false),
  gym: boolean("gym").default(false),
  jacuzzi: boolean("jacuzzi").default(false),
  annex: boolean("annex").default(false),
  heating: boolean("heating").default(false),
  solarHeater: boolean("solar_heater").default(false),

  // Boolean amenities — بنية تحتية
  smartHome: boolean("smart_home").default(false),
  securitySystem: boolean("security_system").default(false),
  internet: boolean("internet").default(false),
  electricityMeter: boolean("electricity_meter").default(false),
  waterMeter: boolean("water_meter").default(false),
  sewage: boolean("sewage").default(false),
  waterTank: boolean("water_tank").default(false),
  generator: boolean("generator").default(false),
  solarEnergy: boolean("solar_energy").default(false),
  naturalGas: boolean("natural_gas").default(false),
  waterFilter: boolean("water_filter").default(false),
  mortgageEligibility: boolean("mortgage_eligibility").default(false),

  // Nearby places
  nearbySchools: boolean("nearby_schools").default(false),
  nearbyHospitals: boolean("nearby_hospitals").default(false),
  nearbyMosques: boolean("nearby_mosques").default(false),
  nearbyMalls: boolean("nearby_malls").default(false),
  nearbyTransport: boolean("nearby_transport").default(false),
  nearbyParks: boolean("nearby_parks").default(false),
  nearbyMainRoads: boolean("nearby_main_roads").default(false),
  nearbyPharmacies: boolean("nearby_pharmacies").default(false),
  nearbyBanks: boolean("nearby_banks").default(false),
  nearbyRestaurants: boolean("nearby_restaurants").default(false),
  nearbyNurseries: boolean("nearby_nurseries").default(false),
  nearbySports: boolean("nearby_sports").default(false),
  nearbyGasStation: boolean("nearby_gas_station").default(false),
  nearbyUniversities: boolean("nearby_universities").default(false),

  // Documents & legal
  deedStatus: text("deed_status"),
  licenseStatus: text("license_status"),

  // Contact
  contactPhone: text("contact_phone"),
  whatsapp: text("whatsapp"),

  // Media
  images: text("images"),        // newline-separated URLs
  videoUrl: text("video_url"),
  floorPlan: text("floor_plan"),

  // Marketing flags
  featured: boolean("featured").default(false),
  urgent: boolean("urgent").default(false),
  exclusive: boolean("exclusive").default(false),
  ownerDirect: boolean("owner_direct").default(false),
  virtualTour: boolean("virtual_tour").default(false),
  verified: boolean("verified").default(false),

  // Internal
  internalNotes: text("internal_notes"),
  views: integer("views").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Listing = typeof listingsTable.$inferSelect;
export type InsertListing = typeof listingsTable.$inferInsert;
