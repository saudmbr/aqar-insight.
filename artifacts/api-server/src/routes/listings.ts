import { Router } from "express";
import type { Request, Response } from "express";
import { eq, and, gte, lte, ilike, sql, desc, or } from "drizzle-orm";
import { db, listingsTable, usersTable } from "@workspace/db";

const listingsRouter = Router();

const CITIES = ["الرياض", "جدة", "الدمام", "مكة المكرمة", "المدينة المنورة", "الخبر", "تبوك", "أبها", "الطائف", "بريدة"];

const canEditListing = (req: Request, listing: { userId: number | null }) => {
  if (req.session.isAdmin) return true;
  if (!req.session.isAuthenticated || !req.session.userId) return false;
  return listing.userId === req.session.userId;
};

// ─── List / Search ────────────────────────────────────────────────────────────
listingsRouter.get("/", async (req: Request, res: Response) => {
  const {
    city, district, propertyType, listingType,
    minPrice, maxPrice, minArea, maxArea,
    bedrooms, furnished, featured,
    page = "1", limit = "20",
    sort = "newest",
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
  if (bedrooms) conditions.push(eq(listingsTable.bedrooms, parseInt(bedrooms)));
  if (furnished === "true") conditions.push(eq(listingsTable.furnishingStatus, "مفروش"));
  if (featured === "true") conditions.push(eq(listingsTable.featured, true));

  const pageNum = Math.max(1, parseInt(page));
  const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * pageSize;

  const orderBy = sort === "price_asc"
    ? listingsTable.price
    : sort === "price_desc"
    ? desc(listingsTable.price)
    : desc(listingsTable.createdAt);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: listingsTable.id,
        title: listingsTable.title,
        propertyType: listingsTable.propertyType,
        listingType: listingsTable.listingType,
        city: listingsTable.city,
        district: listingsTable.district,
        price: listingsTable.price,
        areaSqm: listingsTable.areaSqm,
        pricePerSqm: listingsTable.pricePerSqm,
        bedrooms: listingsTable.bedrooms,
        bathrooms: listingsTable.bathrooms,
        images: listingsTable.images,
        featured: listingsTable.featured,
        verified: listingsTable.verified,
        furnishingStatus: listingsTable.furnishingStatus,
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

// ─── Get single listing ───────────────────────────────────────────────────────
listingsRouter.get("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "معرّف غير صحيح" }); return; }

  const rows = await db
    .select({
      listing: listingsTable,
      sellerName: usersTable.fullName,
      sellerUsername: usersTable.username,
    })
    .from(listingsTable)
    .leftJoin(usersTable, eq(listingsTable.userId, usersTable.id))
    .where(eq(listingsTable.id, id))
    .limit(1);

  if (!rows[0]) { res.status(404).json({ message: "الإعلان غير موجود" }); return; }

  // Increment view count silently
  void db.update(listingsTable).set({ views: sql`${listingsTable.views} + 1` }).where(eq(listingsTable.id, id));

  res.json({ ...rows[0].listing, sellerName: rows[0].sellerName, sellerUsername: rows[0].sellerUsername });
});

// ─── Create listing ───────────────────────────────────────────────────────────
listingsRouter.post("/", async (req: Request, res: Response) => {
  if (!req.session.isAuthenticated) {
    res.status(401).json({ message: "يرجى تسجيل الدخول لنشر إعلان" }); return;
  }

  const {
    title, description, propertyType, listingType, city, district, location,
    price, areaSqm, bedrooms, bathrooms, livingRooms, propertyAge, furnishingStatus,
    streetWidth, facade, floorNumber, totalFloors,
    parking, elevator, garden, roof, pool, maidRoom, driverRoom, kitchen,
    airConditioning, electricityMeter, waterMeter, deedStatus, licenseStatus,
    contactPhone, whatsapp, images,
  } = req.body as Record<string, unknown>;

  if (!title || !propertyType || !listingType || !city || !price) {
    res.status(400).json({ message: "يرجى ملء الحقول الإلزامية: العنوان، النوع، الغرض، المدينة، السعر" }); return;
  }

  const priceNum = parseFloat(price as string);
  const areaNum = areaSqm ? parseFloat(areaSqm as string) : null;
  const pricePerSqm = areaNum && priceNum ? priceNum / areaNum : null;

  const [created] = await db.insert(listingsTable).values({
    userId: req.session.userId ?? null,
    title: String(title),
    description: description ? String(description) : null,
    propertyType: String(propertyType),
    listingType: String(listingType),
    city: String(city),
    district: district ? String(district) : null,
    location: location ? String(location) : null,
    price: priceNum,
    areaSqm: areaNum,
    pricePerSqm,
    bedrooms: bedrooms ? parseInt(bedrooms as string) : null,
    bathrooms: bathrooms ? parseInt(bathrooms as string) : null,
    livingRooms: livingRooms ? parseInt(livingRooms as string) : null,
    propertyAge: propertyAge ? parseInt(propertyAge as string) : null,
    furnishingStatus: furnishingStatus ? String(furnishingStatus) : null,
    streetWidth: streetWidth ? parseFloat(streetWidth as string) : null,
    facade: facade ? String(facade) : null,
    floorNumber: floorNumber ? parseInt(floorNumber as string) : null,
    totalFloors: totalFloors ? parseInt(totalFloors as string) : null,
    parking: Boolean(parking),
    elevator: Boolean(elevator),
    garden: Boolean(garden),
    roof: Boolean(roof),
    pool: Boolean(pool),
    maidRoom: Boolean(maidRoom),
    driverRoom: Boolean(driverRoom),
    kitchen: Boolean(kitchen),
    airConditioning: Boolean(airConditioning),
    electricityMeter: Boolean(electricityMeter),
    waterMeter: Boolean(waterMeter),
    deedStatus: deedStatus ? String(deedStatus) : null,
    licenseStatus: licenseStatus ? String(licenseStatus) : null,
    contactPhone: contactPhone ? String(contactPhone) : null,
    whatsapp: whatsapp ? String(whatsapp) : null,
    images: images ? String(images) : null,
    status: "active",
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

  const {
    title, description, propertyType, listingType, city, district, location,
    price, areaSqm, bedrooms, bathrooms, livingRooms, propertyAge, furnishingStatus,
    streetWidth, facade, floorNumber, totalFloors,
    parking, elevator, garden, roof, pool, maidRoom, driverRoom, kitchen,
    airConditioning, electricityMeter, waterMeter, deedStatus, licenseStatus,
    contactPhone, whatsapp, images, status,
    featured, verified,
  } = req.body as Record<string, unknown>;

  const priceNum = price ? parseFloat(price as string) : undefined;
  const areaNum = areaSqm ? parseFloat(areaSqm as string) : undefined;
  const newPricePerSqm = priceNum && areaNum ? priceNum / areaNum : undefined;

  await db.update(listingsTable).set({
    ...(title && { title: String(title) }),
    ...(description !== undefined && { description: description ? String(description) : null }),
    ...(propertyType && { propertyType: String(propertyType) }),
    ...(listingType && { listingType: String(listingType) }),
    ...(city && { city: String(city) }),
    ...(district !== undefined && { district: district ? String(district) : null }),
    ...(location !== undefined && { location: location ? String(location) : null }),
    ...(priceNum !== undefined && { price: priceNum }),
    ...(areaNum !== undefined && { areaSqm: areaNum }),
    ...(newPricePerSqm !== undefined && { pricePerSqm: newPricePerSqm }),
    ...(bedrooms !== undefined && { bedrooms: bedrooms ? parseInt(bedrooms as string) : null }),
    ...(bathrooms !== undefined && { bathrooms: bathrooms ? parseInt(bathrooms as string) : null }),
    ...(livingRooms !== undefined && { livingRooms: livingRooms ? parseInt(livingRooms as string) : null }),
    ...(propertyAge !== undefined && { propertyAge: propertyAge ? parseInt(propertyAge as string) : null }),
    ...(furnishingStatus !== undefined && { furnishingStatus: furnishingStatus ? String(furnishingStatus) : null }),
    ...(streetWidth !== undefined && { streetWidth: streetWidth ? parseFloat(streetWidth as string) : null }),
    ...(facade !== undefined && { facade: facade ? String(facade) : null }),
    ...(floorNumber !== undefined && { floorNumber: floorNumber ? parseInt(floorNumber as string) : null }),
    ...(totalFloors !== undefined && { totalFloors: totalFloors ? parseInt(totalFloors as string) : null }),
    ...(parking !== undefined && { parking: Boolean(parking) }),
    ...(elevator !== undefined && { elevator: Boolean(elevator) }),
    ...(garden !== undefined && { garden: Boolean(garden) }),
    ...(roof !== undefined && { roof: Boolean(roof) }),
    ...(pool !== undefined && { pool: Boolean(pool) }),
    ...(maidRoom !== undefined && { maidRoom: Boolean(maidRoom) }),
    ...(driverRoom !== undefined && { driverRoom: Boolean(driverRoom) }),
    ...(kitchen !== undefined && { kitchen: Boolean(kitchen) }),
    ...(airConditioning !== undefined && { airConditioning: Boolean(airConditioning) }),
    ...(electricityMeter !== undefined && { electricityMeter: Boolean(electricityMeter) }),
    ...(waterMeter !== undefined && { waterMeter: Boolean(waterMeter) }),
    ...(deedStatus !== undefined && { deedStatus: deedStatus ? String(deedStatus) : null }),
    ...(licenseStatus !== undefined && { licenseStatus: licenseStatus ? String(licenseStatus) : null }),
    ...(contactPhone !== undefined && { contactPhone: contactPhone ? String(contactPhone) : null }),
    ...(whatsapp !== undefined && { whatsapp: whatsapp ? String(whatsapp) : null }),
    ...(images !== undefined && { images: images ? String(images) : null }),
    ...(status && { status: String(status) }),
    ...(req.session.isAdmin && featured !== undefined && { featured: Boolean(featured) }),
    ...(req.session.isAdmin && verified !== undefined && { verified: Boolean(verified) }),
    updatedAt: new Date(),
  }).where(eq(listingsTable.id, id));

  const [updated] = await db.select().from(listingsTable).where(eq(listingsTable.id, id)).limit(1);
  res.json(updated);
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

// ─── My listings ──────────────────────────────────────────────────────────────
listingsRouter.get("/my/listings", async (req: Request, res: Response) => {
  if (!req.session.isAuthenticated) {
    res.status(401).json({ message: "يرجى تسجيل الدخول" }); return;
  }

  const rows = await db
    .select()
    .from(listingsTable)
    .where(
      req.session.userId
        ? eq(listingsTable.userId, req.session.userId)
        : sql`${listingsTable.userId} IS NULL`
    )
    .orderBy(desc(listingsTable.createdAt));

  res.json(rows);
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
      createdAt: listingsTable.createdAt,
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

// ─── Get distinct cities/types for filters ────────────────────────────────────
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

export default listingsRouter;
