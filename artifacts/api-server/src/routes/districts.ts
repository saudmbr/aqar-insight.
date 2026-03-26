import { Router, type IRouter } from "express";
import { db, propertiesTable } from "@workspace/db";
import { eq, and, avg, count, min, max, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/comparison", async (req, res) => {
  const { city, propertyType, listingType } = req.query as Record<string, string>;
  if (!city) {
    res.status(400).json({ error: "city is required" });
    return;
  }

  const conditions = [eq(propertiesTable.city, city)];
  if (propertyType) conditions.push(eq(propertiesTable.propertyType, propertyType));
  if (listingType) conditions.push(eq(propertiesTable.listingType, listingType));

  const results = await db
    .select({
      district: propertiesTable.district,
      avgPrice: avg(propertiesTable.price),
      avgPricePerSqm: avg(propertiesTable.pricePerSqm),
      count: count(),
      minPrice: min(propertiesTable.price),
      maxPrice: max(propertiesTable.price),
    })
    .from(propertiesTable)
    .where(and(...conditions))
    .groupBy(propertiesTable.district)
    .orderBy(sql`avg(price) desc`);

  res.json(results.map(r => ({
    district: r.district,
    avgPrice: Math.round(parseFloat(r.avgPrice ?? "0")),
    avgPricePerSqm: Math.round(parseFloat(r.avgPricePerSqm ?? "0")),
    count: r.count,
    minPrice: Math.round(r.minPrice ?? 0),
    maxPrice: Math.round(r.maxPrice ?? 0),
  })));
});

router.get("/cities", async (_req, res) => {
  const results = await db
    .selectDistinct({ city: propertiesTable.city })
    .from(propertiesTable)
    .orderBy(propertiesTable.city);
  res.json(results.map(r => r.city));
});

router.get("/types", async (_req, res) => {
  const results = await db
    .selectDistinct({ propertyType: propertiesTable.propertyType })
    .from(propertiesTable)
    .orderBy(propertiesTable.propertyType);
  res.json(results.map(r => r.propertyType));
});

export default router;
