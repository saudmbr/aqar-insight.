import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "@workspace/db";
import { userReportsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const userReportsRouter = Router();

// POST /api/reports — any user (or anonymous) submits a report
userReportsRouter.post("/", async (req: Request, res: Response) => {
  const { targetType, targetId, targetTitle, reason, details } = req.body as Record<string, unknown>;

  if (!targetType || !targetId || !reason) {
    res.status(400).json({ message: "يرجى تحديد نوع البلاغ والسبب" });
    return;
  }

  const ALLOWED_TYPES = ["listing", "marketer", "service_provider", "customer_request"];
  if (!ALLOWED_TYPES.includes(String(targetType))) {
    res.status(400).json({ message: "نوع بلاغ غير صحيح" });
    return;
  }

  const [created] = await db.insert(userReportsTable).values({
    reporterId: req.session.userId ?? null,
    targetType: String(targetType),
    targetId: parseInt(String(targetId)),
    targetTitle: targetTitle ? String(targetTitle) : null,
    reason: String(reason),
    details: details ? String(details) : null,
  }).returning();

  res.status(201).json(created);
});

// GET /api/reports — admin only
userReportsRouter.get("/", async (req: Request, res: Response) => {
  if (!req.session.isAdmin) {
    res.status(403).json({ message: "غير مصرح لك" });
    return;
  }

  const status = req.query.status as string | undefined;

  const rows = await db
    .select()
    .from(userReportsTable)
    .where(status ? eq(userReportsTable.status, status) : undefined)
    .orderBy(desc(userReportsTable.createdAt))
    .limit(200);

  res.json(rows);
});

// PATCH /api/reports/:id — admin only — update status / add note
userReportsRouter.patch("/:id", async (req: Request, res: Response) => {
  if (!req.session.isAdmin) {
    res.status(403).json({ message: "غير مصرح لك" });
    return;
  }

  const id = parseInt(req.params.id);
  const { status, adminNote } = req.body as Record<string, unknown>;

  await db.update(userReportsTable).set({
    ...(status !== undefined && { status: String(status) }),
    ...(adminNote !== undefined && { adminNote: String(adminNote) }),
    updatedAt: new Date(),
  }).where(eq(userReportsTable.id, id));

  const [updated] = await db.select().from(userReportsTable).where(eq(userReportsTable.id, id)).limit(1);
  res.json(updated);
});

export default userReportsRouter;
