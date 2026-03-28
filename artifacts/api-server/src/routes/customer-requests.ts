import { Router } from "express";
import type { Request, Response } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, customerRequestsTable, usersTable } from "@workspace/db";

const customerRequestsRouter = Router();

// ─── List requests ────────────────────────────────────────────────────────────
customerRequestsRouter.get("/", async (req: Request, res: Response) => {
  const { requestType, city, status = "open" } = req.query as Record<string, string>;

  const conditions = [eq(customerRequestsTable.status, status)];
  if (requestType) conditions.push(eq(customerRequestsTable.requestType, requestType));
  if (city) conditions.push(eq(customerRequestsTable.city, city));

  const rows = await db
    .select({
      id: customerRequestsTable.id,
      userId: customerRequestsTable.userId,
      requestType: customerRequestsTable.requestType,
      title: customerRequestsTable.title,
      category: customerRequestsTable.category,
      city: customerRequestsTable.city,
      district: customerRequestsTable.district,
      budgetMin: customerRequestsTable.budgetMin,
      budgetMax: customerRequestsTable.budgetMax,
      details: customerRequestsTable.details,
      marketerName: customerRequestsTable.marketerName,
      contactMethod: customerRequestsTable.contactMethod,
      status: customerRequestsTable.status,
      createdAt: customerRequestsTable.createdAt,
      posterName: usersTable.fullName,
    })
    .from(customerRequestsTable)
    .leftJoin(usersTable, eq(customerRequestsTable.userId, usersTable.id))
    .where(and(...conditions))
    .orderBy(desc(customerRequestsTable.createdAt));

  res.json(rows);
});

// ─── My requests — MUST come before /:id wildcard ────────────────────────────
customerRequestsRouter.get("/my/requests", async (req: Request, res: Response) => {
  if (!req.session.isAuthenticated) {
    res.status(401).json({ message: "يرجى تسجيل الدخول" }); return;
  }
  if (!req.session.userId) { res.json([]); return; }

  const rows = await db
    .select()
    .from(customerRequestsTable)
    .where(eq(customerRequestsTable.userId, req.session.userId))
    .orderBy(desc(customerRequestsTable.createdAt));

  res.json(rows);
});

// ─── Get single request ───────────────────────────────────────────────────────
customerRequestsRouter.get("/:id", async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ message: "معرّف غير صحيح" }); return; }

  const [row] = await db
    .select({
      request: customerRequestsTable,
      posterName: usersTable.fullName,
    })
    .from(customerRequestsTable)
    .leftJoin(usersTable, eq(customerRequestsTable.userId, usersTable.id))
    .where(eq(customerRequestsTable.id, id))
    .limit(1);

  if (!row) { res.status(404).json({ message: "الطلب غير موجود" }); return; }
  res.json({ ...row.request, posterName: row.posterName });
});

// ─── Create request ───────────────────────────────────────────────────────────
customerRequestsRouter.post("/", async (req: Request, res: Response) => {
  if (!req.session.isAuthenticated) {
    res.status(401).json({ message: "يرجى تسجيل الدخول لنشر طلب" }); return;
  }

  const { requestType, title, category, city, district, budgetMin, budgetMax, details, marketerName, contactMethod, contactInfo } = req.body as Record<string, unknown>;

  if (!requestType || !title || !city) {
    res.status(400).json({ message: "يرجى ملء العنوان، نوع الطلب، والمدينة" }); return;
  }

  const validTypes = ["property", "service", "marketer"];
  if (!validTypes.includes(String(requestType))) {
    res.status(400).json({ message: "نوع الطلب غير صحيح" }); return;
  }

  const [created] = await db.insert(customerRequestsTable).values({
    userId: req.session.userId ?? null,
    requestType: String(requestType),
    title: String(title),
    category: category ? String(category) : null,
    city: String(city),
    district: district ? String(district) : null,
    budgetMin: budgetMin ? parseFloat(String(budgetMin)) : null,
    budgetMax: budgetMax ? parseFloat(String(budgetMax)) : null,
    details: details ? String(details) : null,
    marketerName: marketerName ? String(marketerName) : null,
    contactMethod: contactMethod ? String(contactMethod) : null,
    contactInfo: contactInfo ? String(contactInfo) : null,
  }).returning();

  res.status(201).json(created);
});

// ─── Delete request — owner or admin only ─────────────────────────────────────
customerRequestsRouter.delete("/:id", async (req: Request, res: Response) => {
  if (!req.session.isAuthenticated) {
    res.status(401).json({ message: "يرجى تسجيل الدخول" }); return;
  }

  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ message: "معرّف غير صحيح" }); return; }

  const [existing] = await db
    .select({ userId: customerRequestsTable.userId })
    .from(customerRequestsTable)
    .where(eq(customerRequestsTable.id, id))
    .limit(1);

  if (!existing) { res.status(404).json({ message: "الطلب غير موجود" }); return; }

  const isOwner = req.session.userId != null && existing.userId === req.session.userId;
  if (!req.session.isAdmin && !isOwner) {
    res.status(403).json({ message: "غير مصرح لك بحذف هذا الطلب" }); return;
  }

  await db.delete(customerRequestsTable).where(eq(customerRequestsTable.id, id));
  res.json({ success: true });
});

export default customerRequestsRouter;
