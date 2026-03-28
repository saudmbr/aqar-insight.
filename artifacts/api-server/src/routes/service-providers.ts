import { Router } from "express";
import type { Request, Response } from "express";
import { eq, and, ilike, desc } from "drizzle-orm";
import { db, serviceProvidersTable, usersTable } from "@workspace/db";

const serviceProvidersRouter = Router();

// ─── List providers ───────────────────────────────────────────────────────────
serviceProvidersRouter.get("/", async (req: Request, res: Response) => {
  const { category, city, search } = req.query as Record<string, string>;

  const conditions = [eq(serviceProvidersTable.status, "active")];
  if (category) conditions.push(eq(serviceProvidersTable.category, category));
  if (city) conditions.push(eq(serviceProvidersTable.city, city));
  if (search) conditions.push(ilike(serviceProvidersTable.businessName, `%${search}%`));

  const rows = await db
    .select({
      id: serviceProvidersTable.id,
      businessName: serviceProvidersTable.businessName,
      category: serviceProvidersTable.category,
      city: serviceProvidersTable.city,
      description: serviceProvidersTable.description,
      startingPrice: serviceProvidersTable.startingPrice,
      portfolioImages: serviceProvidersTable.portfolioImages,
      verified: serviceProvidersTable.verified,
      ratingAvg: serviceProvidersTable.ratingAvg,
      ratingCount: serviceProvidersTable.ratingCount,
      createdAt: serviceProvidersTable.createdAt,
      userId: serviceProvidersTable.userId,
    })
    .from(serviceProvidersTable)
    .where(and(...conditions))
    .orderBy(desc(serviceProvidersTable.verified), desc(serviceProvidersTable.ratingAvg));

  res.json(rows);
});

// ─── Get single provider ──────────────────────────────────────────────────────
serviceProvidersRouter.get("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "معرّف غير صحيح" }); return; }

  const [row] = await db
    .select({
      provider: serviceProvidersTable,
      ownerName: usersTable.fullName,
    })
    .from(serviceProvidersTable)
    .leftJoin(usersTable, eq(serviceProvidersTable.userId, usersTable.id))
    .where(eq(serviceProvidersTable.id, id))
    .limit(1);

  if (!row) { res.status(404).json({ message: "مزوّد الخدمة غير موجود" }); return; }
  res.json({ ...row.provider, ownerName: row.ownerName });
});

// ─── Create provider ──────────────────────────────────────────────────────────
serviceProvidersRouter.post("/", async (req: Request, res: Response) => {
  if (!req.session.isAuthenticated) {
    res.status(401).json({ message: "يرجى تسجيل الدخول" }); return;
  }

  const {
    businessName, category, city, coveredAreas, description, startingPrice,
    contactPhone, whatsapp, workingHours, portfolioImages,
  } = req.body as Record<string, unknown>;

  if (!businessName || !category || !city) {
    res.status(400).json({ message: "يرجى ملء اسم النشاط، التصنيف، والمدينة" }); return;
  }

  const [created] = await db.insert(serviceProvidersTable).values({
    userId: req.session.userId ?? null,
    businessName: String(businessName),
    category: String(category),
    city: String(city),
    coveredAreas: coveredAreas ? String(coveredAreas) : null,
    description: description ? String(description) : null,
    startingPrice: startingPrice ? parseFloat(String(startingPrice)) : null,
    contactPhone: contactPhone ? String(contactPhone) : null,
    whatsapp: whatsapp ? String(whatsapp) : null,
    workingHours: workingHours ? String(workingHours) : null,
    portfolioImages: portfolioImages ? String(portfolioImages) : null,
  }).returning();

  res.status(201).json(created);
});

// ─── My provider profile (GET) ────────────────────────────────────────────────
serviceProvidersRouter.get("/my/profile", async (req: Request, res: Response) => {
  if (!req.session.isAuthenticated || !req.session.userId) {
    res.status(401).json({ message: "يرجى تسجيل الدخول" }); return;
  }

  const [row] = await db
    .select()
    .from(serviceProvidersTable)
    .where(eq(serviceProvidersTable.userId, req.session.userId))
    .limit(1);

  res.json(row ?? null);
});

// ─── Update my own provider profile (must be before /:id) ────────────────────
serviceProvidersRouter.put("/my/profile", async (req: Request, res: Response) => {
  if (!req.session.isAuthenticated || !req.session.userId) {
    res.status(401).json({ message: "يرجى تسجيل الدخول" }); return;
  }

  const [existing] = await db
    .select({ id: serviceProvidersTable.id })
    .from(serviceProvidersTable)
    .where(eq(serviceProvidersTable.userId, req.session.userId))
    .limit(1);

  const { businessName, category, city, coveredAreas, description, startingPrice, contactPhone, whatsapp, workingHours, portfolioImages } = req.body as Record<string, unknown>;

  if (!existing) {
    // Create new profile
    if (!businessName || !category || !city) {
      res.status(400).json({ message: "يرجى ملء اسم النشاط، التصنيف، والمدينة" }); return;
    }
    const [created] = await db.insert(serviceProvidersTable).values({
      userId: req.session.userId,
      businessName: String(businessName),
      category: String(category),
      city: String(city),
      coveredAreas: coveredAreas ? String(coveredAreas) : null,
      description: description ? String(description) : null,
      startingPrice: startingPrice ? parseFloat(String(startingPrice)) : null,
      contactPhone: contactPhone ? String(contactPhone) : null,
      whatsapp: whatsapp ? String(whatsapp) : null,
      workingHours: workingHours ? String(workingHours) : null,
      portfolioImages: portfolioImages ? String(portfolioImages) : null,
    }).returning();
    res.status(201).json(created);
    return;
  }

  await db.update(serviceProvidersTable).set({
    ...(businessName !== undefined && { businessName: String(businessName) }),
    ...(category !== undefined && { category: String(category) }),
    ...(city !== undefined && { city: String(city) }),
    ...(coveredAreas !== undefined && { coveredAreas: coveredAreas ? String(coveredAreas) : null }),
    ...(description !== undefined && { description: description ? String(description) : null }),
    ...(startingPrice !== undefined && { startingPrice: startingPrice ? parseFloat(String(startingPrice)) : null }),
    ...(contactPhone !== undefined && { contactPhone: contactPhone ? String(contactPhone) : null }),
    ...(whatsapp !== undefined && { whatsapp: whatsapp ? String(whatsapp) : null }),
    ...(workingHours !== undefined && { workingHours: workingHours ? String(workingHours) : null }),
    ...(portfolioImages !== undefined && { portfolioImages: portfolioImages ? String(portfolioImages) : null }),
    updatedAt: new Date(),
  }).where(eq(serviceProvidersTable.id, existing.id));

  const [updated] = await db.select().from(serviceProvidersTable).where(eq(serviceProvidersTable.id, existing.id)).limit(1);
  res.json(updated);
});

// ─── Update provider by ID (admin or owner) ───────────────────────────────────
serviceProvidersRouter.put("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "معرّف غير صحيح" }); return; }

  const [existing] = await db.select({ userId: serviceProvidersTable.userId }).from(serviceProvidersTable).where(eq(serviceProvidersTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ message: "غير موجود" }); return; }

  const isOwner = req.session.userId && existing.userId === req.session.userId;
  if (!req.session.isAdmin && !isOwner) { res.status(403).json({ message: "غير مصرح لك" }); return; }

  const { businessName, category, city, coveredAreas, description, startingPrice, contactPhone, whatsapp, workingHours, portfolioImages } = req.body as Record<string, unknown>;

  await db.update(serviceProvidersTable).set({
    ...(businessName !== undefined && { businessName: String(businessName) }),
    ...(category !== undefined && { category: String(category) }),
    ...(city !== undefined && { city: String(city) }),
    ...(coveredAreas !== undefined && { coveredAreas: coveredAreas ? String(coveredAreas) : null }),
    ...(description !== undefined && { description: description ? String(description) : null }),
    ...(startingPrice !== undefined && { startingPrice: startingPrice ? parseFloat(String(startingPrice)) : null }),
    ...(contactPhone !== undefined && { contactPhone: contactPhone ? String(contactPhone) : null }),
    ...(whatsapp !== undefined && { whatsapp: whatsapp ? String(whatsapp) : null }),
    ...(workingHours !== undefined && { workingHours: workingHours ? String(workingHours) : null }),
    ...(portfolioImages !== undefined && { portfolioImages: portfolioImages ? String(portfolioImages) : null }),
    updatedAt: new Date(),
  }).where(eq(serviceProvidersTable.id, id));

  const [updated] = await db.select().from(serviceProvidersTable).where(eq(serviceProvidersTable.id, id)).limit(1);
  res.json(updated);
});

// ─── Delete provider (owner or admin) ────────────────────────────────────────
serviceProvidersRouter.delete("/:id", async (req: Request, res: Response) => {
  if (!req.session.isAuthenticated) {
    res.status(401).json({ message: "يرجى تسجيل الدخول" }); return;
  }

  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: "معرّف غير صحيح" }); return; }

  const [existing] = await db.select({ userId: serviceProvidersTable.userId }).from(serviceProvidersTable).where(eq(serviceProvidersTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ message: "غير موجود" }); return; }

  const isOwner = req.session.userId && existing.userId === req.session.userId;
  if (!req.session.isAdmin && !isOwner) { res.status(403).json({ message: "غير مصرح لك" }); return; }

  await db.delete(serviceProvidersTable).where(eq(serviceProvidersTable.id, id));
  res.json({ message: "تم الحذف بنجاح" });
});

// ─── Get distinct categories ──────────────────────────────────────────────────
serviceProvidersRouter.get("/meta/categories", async (_req: Request, res: Response) => {
  const rows = await db.selectDistinct({ category: serviceProvidersTable.category }).from(serviceProvidersTable);
  res.json(rows.map(r => r.category));
});

export default serviceProvidersRouter;
