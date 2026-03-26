import { Router, type IRouter } from "express";
import { db, propertiesTable, insertPropertySchema } from "@workspace/db";
import { eq, and, ilike, sql, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const { city, district, propertyType, listingType, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  if (city) conditions.push(eq(propertiesTable.city, city));
  if (district) conditions.push(ilike(propertiesTable.district, `%${district}%`));
  if (propertyType) conditions.push(eq(propertiesTable.propertyType, propertyType));
  if (listingType) conditions.push(eq(propertiesTable.listingType, listingType));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult, data] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(propertiesTable).where(where),
    db.select().from(propertiesTable).where(where).orderBy(desc(propertiesTable.createdAt)).limit(limitNum).offset(offset),
  ]);

  const total = totalResult[0]?.count ?? 0;
  res.json({
    data,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  });
});

router.post("/", async (req, res) => {
  const parsed = insertPropertySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const { price, area, ...rest } = parsed.data;
  const pricePerSqm = area > 0 ? price / area : 0;
  const [property] = await db.insert(propertiesTable).values({ ...rest, price, area, pricePerSqm }).returning();
  res.status(201).json(property);
});

// IMPORTANT: /export must be before /:id to avoid route conflict
router.get("/export", async (req, res) => {
  const { city, district, propertyType, listingType } = req.query as Record<string, string>;
  const conditions = [];
  if (city) conditions.push(eq(propertiesTable.city, city));
  if (district) conditions.push(ilike(propertiesTable.district, `%${district}%`));
  if (propertyType) conditions.push(eq(propertiesTable.propertyType, propertyType));
  if (listingType) conditions.push(eq(propertiesTable.listingType, listingType));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const data = await db.select().from(propertiesTable).where(where).orderBy(desc(propertiesTable.createdAt));

  const headers = ["id", "city", "district", "propertyType", "listingType", "price", "area", "pricePerSqm", "bedrooms", "bathrooms", "year", "month", "recordedAt", "notes", "createdAt"];
  const rows = data.map(r =>
    headers.map(h => {
      const val = (r as Record<string, unknown>)[h];
      if (val === null || val === undefined) return "";
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="aqar-insight-export.csv"`);
  res.send(csv);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, id));
  if (!property) { res.status(404).json({ error: "Not found" }); return; }
  res.json(property);
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const parsed = insertPropertySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const { price, area, ...rest } = parsed.data;
  const pricePerSqm = area > 0 ? price / area : 0;
  const [updated] = await db.update(propertiesTable)
    .set({ ...rest, price, area, pricePerSqm })
    .where(eq(propertiesTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [deleted] = await db.delete(propertiesTable).where(eq(propertiesTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true, id: deleted.id });
});

export default router;
