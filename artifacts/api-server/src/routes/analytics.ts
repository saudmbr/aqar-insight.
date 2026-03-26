import { Router, type IRouter } from "express";
import { db, propertiesTable } from "@workspace/db";
import { eq, and, avg, count, sql } from "drizzle-orm";

const router: IRouter = Router();

function buildConditions(city?: string, propertyType?: string, listingType?: string) {
  const conditions = [];
  if (city) conditions.push(eq(propertiesTable.city, city));
  if (propertyType) conditions.push(eq(propertiesTable.propertyType, propertyType));
  if (listingType) conditions.push(eq(propertiesTable.listingType, listingType));
  return conditions.length > 0 ? and(...conditions) : undefined;
}

router.get("/kpis", async (req, res) => {
  const { city, propertyType, listingType } = req.query as Record<string, string>;
  const where = buildConditions(city, propertyType, listingType);

  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;

  const [current, previous, byType] = await Promise.all([
    db.select({
      avgPrice: avg(propertiesTable.price),
      avgPricePerSqm: avg(propertiesTable.pricePerSqm),
      totalListings: count(),
      avgArea: avg(propertiesTable.area),
      saleCount: sql<number>`sum(case when listing_type = 'sale' then 1 else 0 end)::int`,
      rentCount: sql<number>`sum(case when listing_type = 'rent' then 1 else 0 end)::int`,
    }).from(propertiesTable).where(where),
    db.select({ avgPrice: avg(propertiesTable.price) })
      .from(propertiesTable)
      .where(and(where, eq(propertiesTable.year, prevYear))),
    db.select({ count: count() }).from(propertiesTable).where(where),
  ]);

  const cur = current[0];
  const prevAvg = parseFloat(previous[0]?.avgPrice ?? "0");
  const curAvg = parseFloat(cur?.avgPrice ?? "0");
  const priceChangePercent = prevAvg > 0 ? ((curAvg - prevAvg) / prevAvg) * 100 : 0;

  res.json({
    avgPrice: parseFloat(cur?.avgPrice ?? "0"),
    avgPricePerSqm: parseFloat(cur?.avgPricePerSqm ?? "0"),
    totalListings: cur?.totalListings ?? 0,
    avgArea: parseFloat(cur?.avgArea ?? "0"),
    priceChangePercent: Math.round(priceChangePercent * 10) / 10,
    saleCount: cur?.saleCount ?? 0,
    rentCount: cur?.rentCount ?? 0,
  });
});

router.get("/price-trends", async (req, res) => {
  const { city, propertyType, listingType, year } = req.query as Record<string, string>;
  const conditions = [];
  if (city) conditions.push(eq(propertiesTable.city, city));
  if (propertyType) conditions.push(eq(propertiesTable.propertyType, propertyType));
  if (listingType) conditions.push(eq(propertiesTable.listingType, listingType));
  if (year) conditions.push(eq(propertiesTable.year, parseInt(year)));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select({
      year: propertiesTable.year,
      month: propertiesTable.month,
      avgPrice: avg(propertiesTable.price),
      avgPricePerSqm: avg(propertiesTable.pricePerSqm),
      count: count(),
    })
    .from(propertiesTable)
    .where(where)
    .groupBy(propertiesTable.year, propertiesTable.month)
    .orderBy(propertiesTable.year, propertiesTable.month);

  const monthNames = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

  res.json(results.map(r => ({
    month: `${monthNames[(r.month ?? 1) - 1]} ${r.year}`,
    avgPrice: Math.round(parseFloat(r.avgPrice ?? "0")),
    avgPricePerSqm: Math.round(parseFloat(r.avgPricePerSqm ?? "0")),
    count: r.count,
  })));
});

router.get("/property-types", async (req, res) => {
  const { city, listingType } = req.query as Record<string, string>;
  const conditions = [];
  if (city) conditions.push(eq(propertiesTable.city, city));
  if (listingType) conditions.push(eq(propertiesTable.listingType, listingType));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select({
      propertyType: propertiesTable.propertyType,
      avgPrice: avg(propertiesTable.price),
      avgPricePerSqm: avg(propertiesTable.pricePerSqm),
      count: count(),
    })
    .from(propertiesTable)
    .where(where)
    .groupBy(propertiesTable.propertyType)
    .orderBy(sql`count(*) desc`);

  res.json(results.map(r => ({
    propertyType: r.propertyType,
    avgPrice: Math.round(parseFloat(r.avgPrice ?? "0")),
    avgPricePerSqm: Math.round(parseFloat(r.avgPricePerSqm ?? "0")),
    count: r.count,
  })));
});

router.get("/yearly-comparison", async (req, res) => {
  const { city, listingType } = req.query as Record<string, string>;
  const conditions = [];
  if (city) conditions.push(eq(propertiesTable.city, city));
  if (listingType) conditions.push(eq(propertiesTable.listingType, listingType));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select({
      year: propertiesTable.year,
      avgPrice: avg(propertiesTable.price),
      avgPricePerSqm: avg(propertiesTable.pricePerSqm),
      count: count(),
    })
    .from(propertiesTable)
    .where(where)
    .groupBy(propertiesTable.year)
    .orderBy(propertiesTable.year);

  res.json(results.map(r => ({
    year: r.year,
    avgPrice: Math.round(parseFloat(r.avgPrice ?? "0")),
    avgPricePerSqm: Math.round(parseFloat(r.avgPricePerSqm ?? "0")),
    count: r.count,
  })));
});

export default router;
