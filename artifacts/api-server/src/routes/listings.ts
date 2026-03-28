import { Router } from "express";
import type { Request, Response } from "express";
import { eq, and, gte, lte, ilike, sql, desc, or } from "drizzle-orm";
import { db, listingsTable, usersTable, marketerProfilesTable } from "@workspace/db";

const listingsRouter = Router();

const CITIES = ["الرياض", "جدة", "الدمام", "مكة المكرمة", "المدينة المنورة", "الخبر", "تبوك", "أبها", "الطائف", "بريدة"];

const canEditListing = (req: Request, listing: { userId: number | null }) => {
  if (req.session.isAdmin) return true;
  if (!req.session.isAuthenticated || !req.session.userId) return false;
  return listing.userId === req.session.userId;
};

// Saudi Arabia approximate bounding box
const SA_LAT_MIN = 15.5, SA_LAT_MAX = 32.2;
const SA_LNG_MIN = 34.5, SA_LNG_MAX = 55.8;

function parseCoords(lat: unknown, lng: unknown): { latitude: number; longitude: number } | null {
  if (lat == null && lng == null) return null;
  const latNum = lat != null ? parseFloat(lat as string) : NaN;
  const lngNum = lng != null ? parseFloat(lng as string) : NaN;
  if (isNaN(latNum) || isNaN(lngNum)) return null;
  if (latNum < SA_LAT_MIN || latNum > SA_LAT_MAX || lngNum < SA_LNG_MIN || lngNum > SA_LNG_MAX) return null;
  return { latitude: latNum, longitude: lngNum };
}

// ─── List / Search ────────────────────────────────────────────────────────────
listingsRouter.get("/", async (req: Request, res: Response) => {
  const {
    city, district, propertyType, listingType, listingPurpose,
    minPrice, maxPrice, minArea, maxArea,
    bedrooms, furnished, featured, urgent, exclusive,
    marketerId, search,
    page = "1", limit = "20",
    sort = "newest",
  } = req.query as Record<string, string>;

  const conditions = [eq(listingsTable.status, "active")];

  if (search) {
    conditions.push(
      or(
        ilike(listingsTable.title, `%${search}%`),
        ilike(listingsTable.district, `%${search}%`),
        ilike(listingsTable.city, `%${search}%`),
      )!
    );
  }
  if (city) conditions.push(eq(listingsTable.city, city));
  if (district) conditions.push(ilike(listingsTable.district, `%${district}%`));
  if (propertyType) conditions.push(eq(listingsTable.propertyType, propertyType));
  if (listingType) conditions.push(eq(listingsTable.listingType, listingType));
  if (listingPurpose) conditions.push(eq(listingsTable.listingPurpose, listingPurpose));
  if (minPrice) conditions.push(gte(listingsTable.price, parseFloat(minPrice)));
  if (maxPrice) conditions.push(lte(listingsTable.price, parseFloat(maxPrice)));
  if (minArea) conditions.push(gte(listingsTable.areaSqm, parseFloat(minArea)));
  if (maxArea) conditions.push(lte(listingsTable.areaSqm, parseFloat(maxArea)));
  if (bedrooms) conditions.push(eq(listingsTable.bedrooms, parseInt(bedrooms)));
  if (furnished === "true") conditions.push(eq(listingsTable.furnishingStatus, "مفروش"));
  if (featured === "true") conditions.push(eq(listingsTable.featured, true));
  if (urgent === "true") conditions.push(eq(listingsTable.urgent, true));
  if (exclusive === "true") conditions.push(eq(listingsTable.exclusive, true));
  if (marketerId) conditions.push(eq(listingsTable.userId, parseInt(marketerId)));

  const pageNum = Math.max(1, parseInt(page));
  const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * pageSize;

  const orderBy = sort === "price_asc" ? listingsTable.price
    : sort === "price_desc" ? desc(listingsTable.price)
    : sort === "area_desc" ? desc(listingsTable.areaSqm)
    : desc(listingsTable.createdAt);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: listingsTable.id,
        title: listingsTable.title,
        propertyType: listingsTable.propertyType,
        listingType: listingsTable.listingType,
        listingPurpose: listingsTable.listingPurpose,
        city: listingsTable.city,
        district: listingsTable.district,
        price: listingsTable.price,
        areaSqm: listingsTable.areaSqm,
        pricePerSqm: listingsTable.pricePerSqm,
        bedrooms: listingsTable.bedrooms,
        bathrooms: listingsTable.bathrooms,
        images: listingsTable.images,
        featured: listingsTable.featured,
        urgent: listingsTable.urgent,
        exclusive: listingsTable.exclusive,
        verified: listingsTable.verified,
        furnishingStatus: listingsTable.furnishingStatus,
        status: listingsTable.status,
        createdAt: listingsTable.createdAt,
        userId: listingsTable.userId,
        sellerName: usersTable.fullName,
      })
      .from(listingsTable)
      .leftJoin(usersTable, eq(listingsTable.userId, usersTable.id))
      .where(where)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(listingsTable)
      .where(where),
  ]);

  res.json({
    data: rows,
    total: countResult[0]?.count ?? 0,
    page: pageNum,
    pageSize,
  });
});

// ─── Map pins — lightweight endpoint for the interactive property map ────────
const MAP_CITY_COORDS: Record<string, [number, number]> = {
  "الرياض": [24.7136, 46.6753], "جدة": [21.4858, 39.1925],
  "مكة المكرمة": [21.3891, 39.8579], "المدينة المنورة": [24.5247, 39.5692],
  "الدمام": [26.4207, 50.0888], "الخبر": [26.2172, 50.1971],
  "الظهران": [26.2361, 50.0395], "تبوك": [28.3838, 36.5550],
  "أبها": [18.2164, 42.5053], "نجران": [17.4920, 44.1322],
  "جازان": [16.8892, 42.5611], "حائل": [27.5219, 41.6906],
  "القصيم": [26.3260, 43.9750], "بريدة": [26.3260, 43.9750],
  "الطائف": [21.2854, 40.4149], "القطيف": [26.5569, 50.0073],
  "ينبع": [24.0888, 38.0618], "الجبيل": [27.0174, 49.6581],
  "الأحساء": [25.3787, 49.5862], "خميس مشيط": [18.3059, 42.7289],
  "عرعر": [30.9753, 41.0381], "سكاكا": [29.9708, 40.2064],
};

// Produce a stable, spread-out coordinate for a listing that lacks exact lat/lng
function geocodeListing(id: number, city: string): [number, number] | null {
  const base = MAP_CITY_COORDS[city];
  if (!base) return null;
  // Golden-angle distribution so nearby ids don't cluster on the same spot
  const angleRad = (id * 137.508) * (Math.PI / 180);
  const radius = 0.025 + (id % 12) * 0.015; // 0.025–0.205 degrees (~3–23 km)
  return [base[0] + radius * Math.cos(angleRad), base[1] + radius * Math.sin(angleRad)];
}

listingsRouter.get("/map-pins", async (req: Request, res: Response) => {
  const {
    city, district, propertyType, listingType,
    minPrice, maxPrice, minArea, maxArea,
  } = req.query as Record<string, string>;

  const conditions = [eq(listingsTable.status, "active")];
  if (city) conditions.push(eq(listingsTable.city, city));
  if (district) conditions.push(ilike(listingsTable.district, `%${district}%`));
  if (propertyType) conditions.push(eq(listingsTable.propertyType, propertyType));
  if (listingType) conditions.push(eq(listingsTable.listingType, listingType));
  if (minPrice) conditions.push(gte(listingsTable.price, parseFloat(minPrice)));
  if (maxPrice) conditions.push(lte(listingsTable.price, parseFloat(maxPrice)));
  if (minArea) conditions.push(gte(listingsTable.areaSqm, parseFloat(minArea)));
  if (maxArea) conditions.push(lte(listingsTable.areaSqm, parseFloat(maxArea)));

  const rows = await db
    .select({
      id: listingsTable.id,
      title: listingsTable.title,
      city: listingsTable.city,
      district: listingsTable.district,
      price: listingsTable.price,
      areaSqm: listingsTable.areaSqm,
      propertyType: listingsTable.propertyType,
      listingType: listingsTable.listingType,
      images: listingsTable.images,
      latitude: listingsTable.latitude,
      longitude: listingsTable.longitude,
    })
    .from(listingsTable)
    .where(and(...conditions))
    .orderBy(desc(listingsTable.createdAt))
    .limit(300);

  const pins = rows.map(r => {
    let lat = r.latitude ?? null;
    let lng = r.longitude ?? null;
    if (lat === null || lng === null) {
      const approx = geocodeListing(r.id, r.city);
      if (approx) { lat = approx[0]; lng = approx[1]; }
    }
    return { ...r, lat, lng, geocoded: r.latitude === null };
  }).filter(r => r.lat !== null && r.lng !== null);

  res.json({ pins, total: pins.length });
});

// ─── My listings ──────────────────────────────────────────────────────────────
listingsRouter.get("/my/listings", async (req: Request, res: Response) => {
  if (!req.session.isAuthenticated) {
    res.status(401).json({ message: "يرجى تسجيل الدخول" }); return;
  }

  const rows = await db
    .select()
    .from(listingsTable)
    .where(
      req.session.isAdmin
        ? undefined
        : req.session.userId
          ? eq(listingsTable.userId, req.session.userId)
          : sql`false`
    )
    .orderBy(desc(listingsTable.createdAt));

  res.json(rows);
});

// ─── Meta options for filters ─────────────────────────────────────────────────
listingsRouter.get("/meta/options", async (_req: Request, res: Response) => {
  const [citiesResult, typesResult, listingTypesResult] = await Promise.all([
    db.selectDistinct({ city: listingsTable.city }).from(listingsTable).where(eq(listingsTable.status, "active")),
    db.selectDistinct({ propertyType: listingsTable.propertyType }).from(listingsTable).where(eq(listingsTable.status, "active")),
    db.selectDistinct({ listingType: listingsTable.listingType }).from(listingsTable).where(eq(listingsTable.status, "active")),
  ]);
  res.json({
    cities: citiesResult.map(r => r.city),
    propertyTypes: typesResult.map(r => r.propertyType),
    listingTypes: listingTypesResult.map(r => r.listingType),
    allCities: CITIES,
  });
});

// ─── Get single listing ───────────────────────────────────────────────────────
listingsRouter.get("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "معرّف غير صحيح" }); return; }

  const rows = await db
    .select({
      listing: listingsTable,
      sellerName: usersTable.fullName,
      sellerUsername: usersTable.username,
      marketerProfileId: marketerProfilesTable.id,
      marketerOfficeName: marketerProfilesTable.officeName,
      marketerPhoto: marketerProfilesTable.photo,
      marketerPhone: marketerProfilesTable.phone,
      marketerWhatsapp: marketerProfilesTable.whatsapp,
      marketerVerified: marketerProfilesTable.verified,
    })
    .from(listingsTable)
    .leftJoin(usersTable, eq(listingsTable.userId, usersTable.id))
    .leftJoin(marketerProfilesTable, eq(marketerProfilesTable.userId, listingsTable.userId))
    .where(eq(listingsTable.id, id))
    .limit(1);

  if (!rows[0]) { res.status(404).json({ message: "الإعلان غير موجود" }); return; }

  void db.update(listingsTable).set({ views: sql`${listingsTable.views} + 1` }).where(eq(listingsTable.id, id));

  const r = rows[0];
  res.json({
    ...r.listing,
    sellerName: r.sellerName,
    sellerUsername: r.sellerUsername,
    marketer: r.marketerProfileId ? {
      id: r.marketerProfileId,
      fullName: r.sellerName,
      officeName: r.marketerOfficeName,
      photo: r.marketerPhoto,
      phone: r.marketerPhone,
      whatsapp: r.marketerWhatsapp,
      verified: r.marketerVerified,
    } : null,
  });
});

// ─── Similar listings ─────────────────────────────────────────────────────────
listingsRouter.get("/:id/similar", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "معرّف غير صحيح" }); return; }

  const [source] = await db.select({ city: listingsTable.city, propertyType: listingsTable.propertyType })
    .from(listingsTable).where(eq(listingsTable.id, id)).limit(1);
  if (!source) { res.json([]); return; }

  const rows = await db
    .select({
      id: listingsTable.id, title: listingsTable.title, propertyType: listingsTable.propertyType,
      listingType: listingsTable.listingType, city: listingsTable.city, district: listingsTable.district,
      price: listingsTable.price, areaSqm: listingsTable.areaSqm, bedrooms: listingsTable.bedrooms,
      bathrooms: listingsTable.bathrooms, images: listingsTable.images, featured: listingsTable.featured,
      urgent: listingsTable.urgent, exclusive: listingsTable.exclusive, createdAt: listingsTable.createdAt,
    })
    .from(listingsTable)
    .where(and(
      eq(listingsTable.status, "active"),
      or(eq(listingsTable.city, source.city), eq(listingsTable.propertyType, source.propertyType)),
      sql`${listingsTable.id} != ${id}`
    ))
    .orderBy(desc(listingsTable.createdAt))
    .limit(6);

  res.json(rows);
});

// ─── Create listing ───────────────────────────────────────────────────────────
listingsRouter.post("/", async (req: Request, res: Response) => {
  if (!req.session.isAuthenticated) {
    res.status(401).json({ message: "يرجى تسجيل الدخول لنشر إعلان" }); return;
  }

  const b = req.body as Record<string, unknown>;

  if (!b.title || !b.propertyType || !b.listingType || !b.city || !b.price) {
    res.status(400).json({ message: "يرجى ملء الحقول الإلزامية: العنوان، النوع، الغرض، المدينة، السعر" }); return;
  }

  const priceNum = parseFloat(b.price as string);
  const areaNum = b.areaSqm ? parseFloat(b.areaSqm as string) : null;
  const pricePerSqm = areaNum && priceNum ? priceNum / areaNum : null;

  const bool = (v: unknown) => v === true || v === "true" || v === 1 || v === "1";

  const [created] = await db.insert(listingsTable).values({
    userId: req.session.userId ?? null,
    title: String(b.title),
    description: b.description ? String(b.description) : null,
    propertyType: String(b.propertyType),
    listingType: String(b.listingType),
    listingPurpose: b.listingPurpose ? String(b.listingPurpose) : null,
    status: b.status ? String(b.status) : "active",
    referenceNumber: b.referenceNumber ? String(b.referenceNumber) : null,
    city: String(b.city),
    district: b.district ? String(b.district) : null,
    subDistrict: b.subDistrict ? String(b.subDistrict) : null,
    location: b.location ? String(b.location) : null,
    price: priceNum,
    areaSqm: areaNum,
    pricePerSqm,
    negotiable: bool(b.negotiable),
    bedrooms: b.bedrooms ? parseInt(b.bedrooms as string) : null,
    bathrooms: b.bathrooms ? parseInt(b.bathrooms as string) : null,
    livingRooms: b.livingRooms ? parseInt(b.livingRooms as string) : null,
    kitchens: b.kitchens ? parseInt(b.kitchens as string) : null,
    propertyAge: b.propertyAge ? parseInt(b.propertyAge as string) : null,
    furnishingStatus: b.furnishingStatus ? String(b.furnishingStatus) : null,
    streetWidth: b.streetWidth ? parseFloat(b.streetWidth as string) : null,
    numberOfStreets: b.numberOfStreets ? parseInt(b.numberOfStreets as string) : null,
    facade: b.facade ? String(b.facade) : null,
    floorNumber: b.floorNumber ? parseInt(b.floorNumber as string) : null,
    totalFloors: b.totalFloors ? parseInt(b.totalFloors as string) : null,
    buildingQuality: b.buildingQuality ? String(b.buildingQuality) : null,
    finishingType: b.finishingType ? String(b.finishingType) : null,
    availabilityDate: b.availabilityDate ? String(b.availabilityDate) : null,
    parking: bool(b.parking),
    elevator: bool(b.elevator),
    garden: bool(b.garden),
    roof: bool(b.roof),
    pool: bool(b.pool),
    maidRoom: bool(b.maidRoom),
    driverRoom: bool(b.driverRoom),
    storageRoom: bool(b.storageRoom),
    kitchen: bool(b.kitchen),
    balcony: bool(b.balcony),
    basement: bool(b.basement),
    airConditioning: bool(b.airConditioning),
    smartHome: bool(b.smartHome),
    securitySystem: bool(b.securitySystem),
    internet: bool(b.internet),
    electricityMeter: bool(b.electricityMeter),
    waterMeter: bool(b.waterMeter),
    sewage: bool(b.sewage),
    mortgageEligibility: bool(b.mortgageEligibility),
    nearbySchools: bool(b.nearbySchools),
    nearbyHospitals: bool(b.nearbyHospitals),
    nearbyMosques: bool(b.nearbyMosques),
    nearbyMalls: bool(b.nearbyMalls),
    nearbyTransport: bool(b.nearbyTransport),
    nearbyParks: bool(b.nearbyParks),
    nearbyMainRoads: bool(b.nearbyMainRoads),
    deedStatus: b.deedStatus ? String(b.deedStatus) : null,
    licenseStatus: b.licenseStatus ? String(b.licenseStatus) : null,
    contactPhone: b.contactPhone ? String(b.contactPhone) : null,
    whatsapp: b.whatsapp ? String(b.whatsapp) : null,
    images: b.images ? String(b.images) : null,
    videoUrl: b.videoUrl ? String(b.videoUrl) : null,
    floorPlan: b.floorPlan ? String(b.floorPlan) : null,
    urgent: bool(b.urgent),
    exclusive: bool(b.exclusive),
    ownerDirect: bool(b.ownerDirect),
    internalNotes: b.internalNotes ? String(b.internalNotes) : null,
    ...(() => {
      const coords = parseCoords(b.latitude, b.longitude);
      return coords ? coords : { latitude: null, longitude: null };
    })(),
  }).returning();

  res.status(201).json(created);
});

// ─── Update listing ───────────────────────────────────────────────────────────
listingsRouter.put("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "معرّف غير صحيح" }); return; }

  const existing = await db.select({ userId: listingsTable.userId }).from(listingsTable).where(eq(listingsTable.id, id)).limit(1);
  if (!existing[0]) { res.status(404).json({ message: "الإعلان غير موجود" }); return; }
  if (!canEditListing(req, existing[0])) { res.status(403).json({ message: "غير مصرح لك" }); return; }

  const b = req.body as Record<string, unknown>;
  const bool = (v: unknown) => v === true || v === "true" || v === 1 || v === "1";

  const priceNum = b.price ? parseFloat(b.price as string) : undefined;
  const areaNum = b.areaSqm != null ? parseFloat(b.areaSqm as string) : undefined;
  const newPricePerSqm = priceNum && areaNum ? priceNum / areaNum : undefined;

  const setObj: Record<string, unknown> = { updatedAt: new Date() };

  if (b.title) setObj.title = String(b.title);
  if (b.description !== undefined) setObj.description = b.description ? String(b.description) : null;
  if (b.propertyType) setObj.propertyType = String(b.propertyType);
  if (b.listingType) setObj.listingType = String(b.listingType);
  if (b.listingPurpose !== undefined) setObj.listingPurpose = b.listingPurpose ? String(b.listingPurpose) : null;
  if (b.status) setObj.status = String(b.status);
  if (b.referenceNumber !== undefined) setObj.referenceNumber = b.referenceNumber ? String(b.referenceNumber) : null;
  if (b.city) setObj.city = String(b.city);
  if (b.district !== undefined) setObj.district = b.district ? String(b.district) : null;
  if (b.subDistrict !== undefined) setObj.subDistrict = b.subDistrict ? String(b.subDistrict) : null;
  if (b.location !== undefined) setObj.location = b.location ? String(b.location) : null;
  if (priceNum !== undefined) setObj.price = priceNum;
  if (areaNum !== undefined) setObj.areaSqm = areaNum;
  if (newPricePerSqm !== undefined) setObj.pricePerSqm = newPricePerSqm;
  if (b.negotiable !== undefined) setObj.negotiable = bool(b.negotiable);
  if (b.bedrooms !== undefined) setObj.bedrooms = b.bedrooms ? parseInt(b.bedrooms as string) : null;
  if (b.bathrooms !== undefined) setObj.bathrooms = b.bathrooms ? parseInt(b.bathrooms as string) : null;
  if (b.livingRooms !== undefined) setObj.livingRooms = b.livingRooms ? parseInt(b.livingRooms as string) : null;
  if (b.kitchens !== undefined) setObj.kitchens = b.kitchens ? parseInt(b.kitchens as string) : null;
  if (b.propertyAge !== undefined) setObj.propertyAge = b.propertyAge ? parseInt(b.propertyAge as string) : null;
  if (b.furnishingStatus !== undefined) setObj.furnishingStatus = b.furnishingStatus ? String(b.furnishingStatus) : null;
  if (b.streetWidth !== undefined) setObj.streetWidth = b.streetWidth ? parseFloat(b.streetWidth as string) : null;
  if (b.numberOfStreets !== undefined) setObj.numberOfStreets = b.numberOfStreets ? parseInt(b.numberOfStreets as string) : null;
  if (b.facade !== undefined) setObj.facade = b.facade ? String(b.facade) : null;
  if (b.floorNumber !== undefined) setObj.floorNumber = b.floorNumber ? parseInt(b.floorNumber as string) : null;
  if (b.totalFloors !== undefined) setObj.totalFloors = b.totalFloors ? parseInt(b.totalFloors as string) : null;
  if (b.buildingQuality !== undefined) setObj.buildingQuality = b.buildingQuality ? String(b.buildingQuality) : null;
  if (b.finishingType !== undefined) setObj.finishingType = b.finishingType ? String(b.finishingType) : null;
  if (b.availabilityDate !== undefined) setObj.availabilityDate = b.availabilityDate ? String(b.availabilityDate) : null;

  const boolFields = ["parking","elevator","garden","roof","pool","maidRoom","driverRoom","storageRoom",
    "kitchen","balcony","basement","airConditioning","smartHome","securitySystem","internet",
    "electricityMeter","waterMeter","sewage","mortgageEligibility","nearbySchools","nearbyHospitals",
    "nearbyMosques","nearbyMalls","nearbyTransport","nearbyParks","nearbyMainRoads",
    "urgent","exclusive","ownerDirect"];
  for (const f of boolFields) {
    if (b[f] !== undefined) setObj[f] = bool(b[f]);
  }
  if (req.session.isAdmin) {
    if (b.featured !== undefined) setObj.featured = bool(b.featured);
    if (b.verified !== undefined) setObj.verified = bool(b.verified);
  }

  if (b.deedStatus !== undefined) setObj.deedStatus = b.deedStatus ? String(b.deedStatus) : null;
  if (b.licenseStatus !== undefined) setObj.licenseStatus = b.licenseStatus ? String(b.licenseStatus) : null;
  if (b.contactPhone !== undefined) setObj.contactPhone = b.contactPhone ? String(b.contactPhone) : null;
  if (b.whatsapp !== undefined) setObj.whatsapp = b.whatsapp ? String(b.whatsapp) : null;
  if (b.images !== undefined) setObj.images = b.images ? String(b.images) : null;
  if (b.videoUrl !== undefined) setObj.videoUrl = b.videoUrl ? String(b.videoUrl) : null;
  if (b.floorPlan !== undefined) setObj.floorPlan = b.floorPlan ? String(b.floorPlan) : null;
  if (b.internalNotes !== undefined) setObj.internalNotes = b.internalNotes ? String(b.internalNotes) : null;

  // Coordinates: validate Saudi Arabia bounds or clear them
  if (b.latitude !== undefined || b.longitude !== undefined) {
    const coords = parseCoords(b.latitude, b.longitude);
    if (coords) {
      setObj.latitude = coords.latitude;
      setObj.longitude = coords.longitude;
    } else {
      setObj.latitude = null;
      setObj.longitude = null;
    }
  }

  await db.update(listingsTable).set(setObj).where(eq(listingsTable.id, id));
  const [updated] = await db.select().from(listingsTable).where(eq(listingsTable.id, id)).limit(1);
  res.json(updated);
});

// ─── Quick status change (owner/admin only) ───────────────────────────────────
listingsRouter.patch("/:id/status", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "معرّف غير صحيح" }); return; }

  const ALLOWED = ["active", "sold", "rented", "cancelled"] as const;
  const { status } = req.body as { status?: string };
  if (!status || !ALLOWED.includes(status as typeof ALLOWED[number])) {
    res.status(400).json({ message: "الحالة غير صحيحة" }); return;
  }

  const existing = await db.select({ userId: listingsTable.userId }).from(listingsTable).where(eq(listingsTable.id, id)).limit(1);
  if (!existing[0]) { res.status(404).json({ message: "الإعلان غير موجود" }); return; }
  if (!canEditListing(req, existing[0])) { res.status(403).json({ message: "غير مصرح لك بتعديل هذا الإعلان" }); return; }

  const [updated] = await db.update(listingsTable).set({ status: status as typeof ALLOWED[number], updatedAt: new Date() }).where(eq(listingsTable.id, id)).returning({ id: listingsTable.id, status: listingsTable.status });
  res.json({ success: true, ...updated });
});

// ─── Delete listing ───────────────────────────────────────────────────────────
listingsRouter.delete("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "معرّف غير صحيح" }); return; }

  const existing = await db.select({ userId: listingsTable.userId }).from(listingsTable).where(eq(listingsTable.id, id)).limit(1);
  if (!existing[0]) { res.status(404).json({ message: "الإعلان غير موجود" }); return; }
  if (!canEditListing(req, existing[0])) { res.status(403).json({ message: "غير مصرح لك" }); return; }

  await db.delete(listingsTable).where(eq(listingsTable.id, id));
  res.json({ success: true });
});

export default listingsRouter;
