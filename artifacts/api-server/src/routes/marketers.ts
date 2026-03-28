import { Router } from "express";
import type { Request, Response } from "express";
import { eq, desc, sql, and } from "drizzle-orm";
import { db, marketerProfilesTable, usersTable, listingsTable } from "@workspace/db";

const marketersRouter = Router();

// ─── Auth: get own marketer profile ──────────────────────────────────────────
// MUST come before GET /:id to avoid "me" being treated as an id
marketersRouter.get("/me/profile", async (req: Request, res: Response) => {
  if (!req.session.isAuthenticated) {
    res.status(401).json({ message: "يرجى تسجيل الدخول" }); return;
  }
  // Hardcoded admin has no real userId — gracefully return null
  if (!req.session.userId) {
    res.json(null); return;
  }

  const rows = await db
    .select()
    .from(marketerProfilesTable)
    .where(eq(marketerProfilesTable.userId, req.session.userId))
    .limit(1);

  res.json(rows[0] ?? null);
});

// ─── Auth: create or update own marketer profile ──────────────────────────────
// MUST come before GET /:id wildcard
marketersRouter.put("/me/profile", async (req: Request, res: Response) => {
  if (!req.session.isAuthenticated) {
    res.status(401).json({ message: "يرجى تسجيل الدخول" }); return;
  }
  if (!req.session.userId) {
    res.status(403).json({ message: "المدير لا يحتاج ملف مسوّق" }); return;
  }

  const {
    officeName, bio, city, servedAreas, specialties, yearsExperience,
    licenseNumber, photo, phone, whatsapp, email,
    websiteUrl, facebookUrl, twitterUrl, instagramUrl, linkedinUrl,
  } = req.body as Record<string, unknown>;

  const existing = await db
    .select({ id: marketerProfilesTable.id })
    .from(marketerProfilesTable)
    .where(eq(marketerProfilesTable.userId, req.session.userId))
    .limit(1);

  const data = {
    officeName: officeName ? String(officeName) : null,
    bio: bio ? String(bio) : null,
    city: city ? String(city) : null,
    servedAreas: servedAreas ? String(servedAreas) : null,
    specialties: specialties ? String(specialties) : null,
    yearsExperience: yearsExperience ? parseInt(yearsExperience as string) : null,
    licenseNumber: licenseNumber ? String(licenseNumber) : null,
    photo: photo ? String(photo) : null,
    phone: phone ? String(phone) : null,
    whatsapp: whatsapp ? String(whatsapp) : null,
    email: email ? String(email) : null,
    websiteUrl: websiteUrl ? String(websiteUrl) : null,
    facebookUrl: facebookUrl ? String(facebookUrl) : null,
    twitterUrl: twitterUrl ? String(twitterUrl) : null,
    instagramUrl: instagramUrl ? String(instagramUrl) : null,
    linkedinUrl: linkedinUrl ? String(linkedinUrl) : null,
    updatedAt: new Date(),
  };

  let profile;
  if (existing[0]) {
    const [updated] = await db
      .update(marketerProfilesTable)
      .set(data)
      .where(eq(marketerProfilesTable.userId, req.session.userId))
      .returning();
    profile = updated;
  } else {
    // Auto-upgrade role to real_estate_marketer if currently "user"
    await db.update(usersTable)
      .set({ role: "real_estate_marketer" })
      .where(and(eq(usersTable.id, req.session.userId), eq(usersTable.role, "user")));

    const [created] = await db
      .insert(marketerProfilesTable)
      .values({ userId: req.session.userId, ...data })
      .returning();
    profile = created;
    req.session.role = "real_estate_marketer";
  }

  res.json(profile);
});

// ─── Public: list all marketer profiles ───────────────────────────────────────
marketersRouter.get("/", async (_req: Request, res: Response) => {
  const rows = await db
    .select({
      id: marketerProfilesTable.id,
      userId: marketerProfilesTable.userId,
      fullName: usersTable.fullName,
      username: usersTable.username,
      officeName: marketerProfilesTable.officeName,
      bio: marketerProfilesTable.bio,
      city: marketerProfilesTable.city,
      servedAreas: marketerProfilesTable.servedAreas,
      specialties: marketerProfilesTable.specialties,
      yearsExperience: marketerProfilesTable.yearsExperience,
      photo: marketerProfilesTable.photo,
      whatsapp: marketerProfilesTable.whatsapp,
      phone: marketerProfilesTable.phone,
      verified: marketerProfilesTable.verified,
      activeListingsCount: marketerProfilesTable.activeListingsCount,
      createdAt: marketerProfilesTable.createdAt,
    })
    .from(marketerProfilesTable)
    .innerJoin(usersTable, eq(marketerProfilesTable.userId, usersTable.id))
    .orderBy(desc(marketerProfilesTable.createdAt));

  res.json(rows);
});

// ─── Public: get one marketer profile ─────────────────────────────────────────
marketersRouter.get("/:id", async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ message: "معرّف غير صحيح" }); return; }

  const rows = await db
    .select({
      id: marketerProfilesTable.id,
      userId: marketerProfilesTable.userId,
      fullName: usersTable.fullName,
      username: usersTable.username,
      officeName: marketerProfilesTable.officeName,
      bio: marketerProfilesTable.bio,
      city: marketerProfilesTable.city,
      servedAreas: marketerProfilesTable.servedAreas,
      specialties: marketerProfilesTable.specialties,
      yearsExperience: marketerProfilesTable.yearsExperience,
      licenseNumber: marketerProfilesTable.licenseNumber,
      photo: marketerProfilesTable.photo,
      phone: marketerProfilesTable.phone,
      whatsapp: marketerProfilesTable.whatsapp,
      email: marketerProfilesTable.email,
      websiteUrl: marketerProfilesTable.websiteUrl,
      facebookUrl: marketerProfilesTable.facebookUrl,
      twitterUrl: marketerProfilesTable.twitterUrl,
      instagramUrl: marketerProfilesTable.instagramUrl,
      linkedinUrl: marketerProfilesTable.linkedinUrl,
      verified: marketerProfilesTable.verified,
      activeListingsCount: marketerProfilesTable.activeListingsCount,
      createdAt: marketerProfilesTable.createdAt,
    })
    .from(marketerProfilesTable)
    .innerJoin(usersTable, eq(marketerProfilesTable.userId, usersTable.id))
    .where(eq(marketerProfilesTable.id, id))
    .limit(1);

  if (!rows[0]) { res.status(404).json({ message: "المسوّق غير موجود" }); return; }
  res.json(rows[0]);
});

// ─── Public: get marketer's listings ─────────────────────────────────────────
marketersRouter.get("/:id/listings", async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ message: "معرّف غير صحيح" }); return; }

  const [profile] = await db
    .select({ userId: marketerProfilesTable.userId })
    .from(marketerProfilesTable)
    .where(eq(marketerProfilesTable.id, id))
    .limit(1);

  if (!profile) { res.status(404).json({ message: "المسوّق غير موجود" }); return; }

  const { sort = "newest", status = "active" } = req.query as Record<string, string>;

  const orderBy = sort === "price_asc" ? listingsTable.price
    : sort === "price_desc" ? desc(listingsTable.price)
    : sort === "area_desc" ? desc(listingsTable.areaSqm)
    : sort === "oldest" ? listingsTable.createdAt
    : desc(listingsTable.createdAt);

  const conditions = [eq(listingsTable.userId, profile.userId)];
  if (status !== "all") conditions.push(eq(listingsTable.status, status));

  const rows = await db
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
    })
    .from(listingsTable)
    .where(and(...conditions))
    .orderBy(orderBy);

  // Sync active count on the profile
  if (status === "active") {
    await db.update(marketerProfilesTable)
      .set({ activeListingsCount: rows.length })
      .where(eq(marketerProfilesTable.id, id));
  }

  res.json(rows);
});

// ─── Admin: verify or unverify a marketer ─────────────────────────────────────
marketersRouter.put("/:id/verify", async (req: Request, res: Response) => {
  if (!req.session.isAdmin) { res.status(403).json({ message: "غير مصرح" }); return; }
  const id = parseInt(String(req.params.id));
  const { verified } = req.body as { verified: boolean };
  const [updated] = await db
    .update(marketerProfilesTable)
    .set({ verified: Boolean(verified) })
    .where(eq(marketerProfilesTable.id, id))
    .returning();
  res.json(updated);
});

// ─── Admin: delete a marketer profile ─────────────────────────────────────────
marketersRouter.delete("/:id", async (req: Request, res: Response) => {
  if (!req.session.isAdmin) { res.status(403).json({ message: "غير مصرح" }); return; }
  const id = parseInt(String(req.params.id));
  await db.delete(marketerProfilesTable).where(eq(marketerProfilesTable.id, id));
  res.json({ success: true });
});

export default marketersRouter;
