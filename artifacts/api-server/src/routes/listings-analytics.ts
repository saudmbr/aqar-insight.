import { Router, type IRouter } from "express";
import { db, listingsTable } from "@workspace/db";
import { eq, and, gte, lte, sql, count, avg, min, max, desc } from "drizzle-orm";

const LISTING_LABEL_MAP: Record<string, string> = {
  sale: "للبيع", installment: "بيع بالتقسيط", auction: "مزاد علني",
  rent: "للإيجار", rent_annual: "إيجار سنوي", rent_monthly: "إيجار شهري",
  rent_seasonal: "إيجار موسمي",
  investment: "استثماري",
};

const router: IRouter = Router();

type FilterParams = {
  city?: string;
  district?: string;
  propertyType?: string;
  listingType?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  bathrooms?: number;
};

function buildListingConditions(f: FilterParams) {
  const conds = [eq(listingsTable.status, "active")];
  if (f.city) conds.push(eq(listingsTable.city, f.city));
  if (f.district) conds.push(eq(listingsTable.district, f.district));
  if (f.propertyType) conds.push(eq(listingsTable.propertyType, f.propertyType));
  if (f.listingType) conds.push(eq(listingsTable.listingType, f.listingType));
  if (f.minPrice) conds.push(gte(listingsTable.price, f.minPrice));
  if (f.maxPrice) conds.push(lte(listingsTable.price, f.maxPrice));
  if (f.minArea) conds.push(gte(listingsTable.areaSqm, f.minArea));
  if (f.maxArea) conds.push(lte(listingsTable.areaSqm, f.maxArea));
  if (f.bedrooms != null) conds.push(eq(listingsTable.bedrooms, f.bedrooms));
  if (f.bathrooms != null) conds.push(eq(listingsTable.bathrooms, f.bathrooms));
  return and(...conds);
}

function parseFilters(query: Record<string, string>): FilterParams {
  return {
    city: query.city || undefined,
    district: query.district || undefined,
    propertyType: query.propertyType || undefined,
    listingType: query.listingType || undefined,
    minPrice: query.minPrice ? Number(query.minPrice) : undefined,
    maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
    minArea: query.minArea ? Number(query.minArea) : undefined,
    maxArea: query.maxArea ? Number(query.maxArea) : undefined,
    bedrooms: query.bedrooms ? Number(query.bedrooms) : undefined,
    bathrooms: query.bathrooms ? Number(query.bathrooms) : undefined,
  };
}

function pct(a: number, b: number) {
  return b > 0 ? Math.round((a / b) * 100) : 0;
}

function generateSmartInsights(data: {
  kpis: Record<string, number>;
  byCity: Array<{ city: string; count: number; avgPrice: number; avgPricePerSqm: number }>;
  byDistrict: Array<{ district: string; city: string; count: number; avgPricePerSqm: number }>;
  byPropertyType: Array<{ propertyType: string; count: number; avgPrice: number }>;
  byListingType: Array<{ listingType: string; count: number }>;
}): string[] {
  const insights: string[] = [];
  const { kpis, byCity, byDistrict, byPropertyType, byListingType } = data;

  if (!kpis.totalListings) return ["لا توجد إعلانات نشطة حالياً للتحليل."];

  const topType = byPropertyType[0];
  if (topType) {
    insights.push(`${topType.propertyType} هي الفئة الأكثر عرضاً على المنصة حالياً`);
  }

  const topCity = byCity[0];
  if (topCity) {
    const cityPct = pct(topCity.count, kpis.totalListings);
    insights.push(`مدينة ${topCity.city} تستحوذ على ${cityPct}% من إجمالي الإعلانات المنشورة`);
  }

  // استخدام الأعداد المجمّعة من kpis (تشمل جميع الأنواع في كل فئة)
  if (kpis.totalListings > 0) {
    const salePct   = pct(kpis.saleCount,   kpis.totalListings);
    const rentPct   = pct(kpis.rentCount,   kpis.totalListings);
    const investPct = pct(kpis.investCount, kpis.totalListings);
    if (salePct > 0 || rentPct > 0) {
      insights.push(`السوق يتوزع بين ${salePct}% صفقات بيع و${rentPct}% إيجار${investPct > 0 ? ` و${investPct}% استثماري` : ""}`);
    }
  }

  if (byPropertyType.length >= 2) {
    const [first, second] = byPropertyType;
    if (first.avgPrice > 0 && second.avgPrice > 0) {
      const diff = Math.round(((first.avgPrice - second.avgPrice) / second.avgPrice) * 100);
      if (Math.abs(diff) > 5) {
        const higher = diff > 0 ? first : second;
        const lower = diff > 0 ? second : first;
        insights.push(`${higher.propertyType} تسجل متوسط سعر أعلى من ${lower.propertyType} بنسبة ${Math.abs(diff)}%`);
      }
    }
  }

  const avgPsm = kpis.avgPricePerSqm;
  if (byDistrict.length > 0 && avgPsm > 0) {
    const aboveAvg = byDistrict.filter(d => d.avgPricePerSqm > avgPsm * 1.1);
    if (aboveAvg.length > 0) {
      insights.push(`حي ${aboveAvg[0].district} يسجل متوسط سعر متر أعلى من المتوسط العام للمنصة`);
    }
    const sortedByPsm = [...byDistrict].sort((a, b) => a.avgPricePerSqm - b.avgPricePerSqm);
    const cheapest = sortedByPsm[0];
    if (cheapest && cheapest.avgPricePerSqm > 0) {
      insights.push(`حي ${cheapest.district} من أقل الأحياء سعراً لكل متر مربع ضمن البيانات الحالية`);
    }
  }

  const topActiveDistrict = [...byDistrict].sort((a, b) => b.count - a.count)[0];
  if (topActiveDistrict) {
    insights.push(`حي ${topActiveDistrict.district} هو الأكثر نشاطاً من حيث عدد الإعلانات`);
  }

  if (kpis.newLast7Days > 0) {
    insights.push(`تمت إضافة ${kpis.newLast7Days} إعلان خلال آخر 7 أيام`);
  }

  return insights;
}

router.get("/listings-insights", async (req, res) => {
  const f = parseFilters(req.query as Record<string, string>);
  const where = buildListingConditions(f);

  const now = new Date();
  const last7 = new Date(now); last7.setDate(now.getDate() - 7);
  const last30 = new Date(now); last30.setDate(now.getDate() - 30);

  const [kpiRows, byRegionRows, byCityRows, byDistrictRows, byTypeRows, byListingTypeRows, trend7, trend30] = await Promise.all([
    db.select({
      totalListings: count(),
      avgPricePerSqm: avg(listingsTable.pricePerSqm),
      avgPrice: avg(listingsTable.price),
      maxPrice: max(listingsTable.price),
      minPrice: min(listingsTable.price),
      saleCount:       sql<number>`sum(case when listing_type in ('sale','installment','auction') then 1 else 0 end)::int`,
      rentCount:       sql<number>`sum(case when listing_type in ('rent','rent_annual','rent_monthly','rent_seasonal') then 1 else 0 end)::int`,
      investCount:     sql<number>`sum(case when listing_type = 'investment' then 1 else 0 end)::int`,
      listingsWithArea:sql<number>`sum(case when price_per_sqm is not null and price_per_sqm > 0 then 1 else 0 end)::int`,
      medianPrice:     sql<number>`percentile_cont(0.5) within group (order by price)`,
      p25:             sql<number>`percentile_cont(0.25) within group (order by price)`,
      p75:             sql<number>`percentile_cont(0.75) within group (order by price)`,
      priceStddev:     sql<number>`stddev(price)`,
    }).from(listingsTable).where(where),

    db.select({
      region: listingsTable.region,
      count: count(),
      avgPrice: avg(listingsTable.price),
      avgPricePerSqm: avg(listingsTable.pricePerSqm),
    }).from(listingsTable).where(and(where, sql`region is not null and region != ''`))
      .groupBy(listingsTable.region)
      .orderBy(desc(avg(listingsTable.price))),

    db.select({
      city: listingsTable.city,
      count: count(),
      avgPrice: avg(listingsTable.price),
      avgPricePerSqm: avg(listingsTable.pricePerSqm),
    }).from(listingsTable).where(where)
      .groupBy(listingsTable.city)
      .orderBy(desc(avg(listingsTable.price))),

    db.select({
      district: listingsTable.district,
      city: listingsTable.city,
      count: count(),
      avgPrice: avg(listingsTable.price),
      avgPricePerSqm: avg(listingsTable.pricePerSqm),
    }).from(listingsTable).where(and(where, sql`district is not null and district != ''`))
      .groupBy(listingsTable.district, listingsTable.city)
      .orderBy(desc(avg(listingsTable.price))),

    db.select({
      propertyType: listingsTable.propertyType,
      count: count(),
      avgPrice: avg(listingsTable.price),
      avgPricePerSqm: avg(listingsTable.pricePerSqm),
    }).from(listingsTable).where(where)
      .groupBy(listingsTable.propertyType)
      .orderBy(desc(count())),

    db.select({
      listingType: listingsTable.listingType,
      count: count(),
      avgPrice: avg(listingsTable.price),
    }).from(listingsTable).where(where)
      .groupBy(listingsTable.listingType),

    db.select({ count: count() }).from(listingsTable)
      .where(and(where, gte(listingsTable.createdAt, last7))),

    db.select({ count: count() }).from(listingsTable)
      .where(and(where, gte(listingsTable.createdAt, last30))),
  ]);

  const k = kpiRows[0];
  const totalListings = k?.totalListings ?? 0;
  const newLast30 = trend30[0]?.count ?? 0;
  const kpis = {
    totalListings,
    avgPricePerSqm:   Math.round(parseFloat(String(k?.avgPricePerSqm ?? "0"))),
    avgPrice:         Math.round(parseFloat(String(k?.avgPrice ?? "0"))),
    maxPrice:         Math.round(parseFloat(String(k?.maxPrice ?? "0"))),
    minPrice:         Math.round(parseFloat(String(k?.minPrice ?? "0"))),
    medianPrice:      Math.round(parseFloat(String(k?.medianPrice ?? "0"))),
    p25Price:         Math.round(parseFloat(String(k?.p25 ?? "0"))),
    p75Price:         Math.round(parseFloat(String(k?.p75 ?? "0"))),
    priceStddev:      Math.round(parseFloat(String(k?.priceStddev ?? "0"))),
    saleCount:        Number(k?.saleCount ?? 0),
    rentCount:        Number(k?.rentCount ?? 0),
    investCount:      Number(k?.investCount ?? 0),
    listingsWithArea: Number(k?.listingsWithArea ?? 0),
    newLast7Days:     trend7[0]?.count ?? 0,
    newLast30Days:    newLast30,
    // معدل دوران السوق: نسبة الإعلانات الجديدة هذا الشهر من إجمالي الإعلانات
    turnoverRate:     totalListings > 0 ? Math.round((newLast30 / totalListings) * 100) : 0,
    // نسبة الإعلانات التي تحتوي على بيانات المساحة
    areaDataRate:     totalListings > 0 ? Math.round((Number(k?.listingsWithArea ?? 0) / totalListings) * 100) : 0,
  };

  const byRegion = byRegionRows.map(r => ({
    region: r.region ?? "",
    count: r.count,
    avgPrice: Math.round(parseFloat(String(r.avgPrice ?? "0"))),
    avgPricePerSqm: Math.round(parseFloat(String(r.avgPricePerSqm ?? "0"))),
  }));

  const byCity = byCityRows.map(r => ({
    city: r.city,
    count: r.count,
    avgPrice: Math.round(parseFloat(String(r.avgPrice ?? "0"))),
    avgPricePerSqm: Math.round(parseFloat(String(r.avgPricePerSqm ?? "0"))),
  }));

  const byDistrict = byDistrictRows.map(r => ({
    district: r.district ?? "",
    city: r.city,
    count: r.count,
    avgPrice: Math.round(parseFloat(String(r.avgPrice ?? "0"))),
    avgPricePerSqm: Math.round(parseFloat(String(r.avgPricePerSqm ?? "0"))),
  }));

  const byPropertyType = byTypeRows.map(r => ({
    propertyType: r.propertyType,
    count: r.count,
    avgPrice: Math.round(parseFloat(String(r.avgPrice ?? "0"))),
    avgPricePerSqm: Math.round(parseFloat(String(r.avgPricePerSqm ?? "0"))),
    percentage: pct(r.count, kpis.totalListings),
  }));

  const byListingType = byListingTypeRows
    .map(r => ({
      listingType: r.listingType,
      count: r.count,
      avgPrice: Math.round(parseFloat(String(r.avgPrice ?? "0"))),
      percentage: pct(r.count, kpis.totalListings),
      label: LISTING_LABEL_MAP[r.listingType] ?? r.listingType,
    }))
    .sort((a, b) => b.count - a.count);

  const smartInsights = generateSmartInsights({ kpis, byCity, byDistrict, byPropertyType, byListingType });

  res.json({ kpis, byRegion, byCity, byDistrict, byPropertyType, byListingType, smartInsights });
});

router.get("/listings-trends", async (req, res) => {
  const f = parseFilters(req.query as Record<string, string>);
  const period = (req.query.period as string) ?? "month";
  const where = buildListingConditions(f);

  const monthNames = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

  // Build the grouping expression based on period
  const groupExpr =
    period === "day"     ? sql<string>`to_char(created_at, 'YYYY-MM-DD')` :
    period === "week"    ? sql<string>`to_char(date_trunc('week', created_at::timestamptz), 'YYYY-MM-DD')` :
    period === "quarter" ? sql<string>`to_char(created_at, 'YYYY-"Q"Q')` :
    period === "year"    ? sql<string>`to_char(created_at, 'YYYY')` :
                           sql<string>`to_char(created_at, 'YYYY-MM')`;

  const orderExpr =
    period === "day"     ? sql`to_char(created_at, 'YYYY-MM-DD')` :
    period === "week"    ? sql`to_char(date_trunc('week', created_at::timestamptz), 'YYYY-MM-DD')` :
    period === "quarter" ? sql`to_char(created_at, 'YYYY-"Q"Q')` :
    period === "year"    ? sql`to_char(created_at, 'YYYY')` :
                           sql`to_char(created_at, 'YYYY-MM')`;

  const results = await db.select({
    bucket: groupExpr,
    count: count(),
    avgPrice: avg(listingsTable.price),
    avgPricePerSqm: avg(listingsTable.pricePerSqm),
  }).from(listingsTable).where(where)
    .groupBy(groupExpr)
    .orderBy(orderExpr);

  const makeLabel = (bucket: string): string => {
    if (period === "day") {
      const parts = bucket.split("-");
      return `${parts[2]}/${parts[1]}`;
    }
    if (period === "week") {
      const d = new Date(bucket);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    }
    if (period === "quarter") {
      const [yr, q] = bucket.split("Q");
      return `ر${q?.trim() ?? ""} ${yr?.trim() ?? ""}`;
    }
    if (period === "year") return bucket;
    // month: YYYY-MM
    const [, mm] = bucket.split("-");
    return monthNames[parseInt(mm ?? "1") - 1] ?? bucket;
  };

  res.json(results.map(r => ({
    period: r.bucket ?? "",
    label: makeLabel(r.bucket ?? ""),
    count: r.count,
    avgPrice: Math.round(parseFloat(String(r.avgPrice ?? "0"))),
    avgPricePerSqm: Math.round(parseFloat(String(r.avgPricePerSqm ?? "0"))),
  })));
});

router.get("/listings-districts-map", async (req, res) => {
  const f = parseFilters(req.query as Record<string, string>);
  const where = buildListingConditions(f);

  const results = await db.select({
    district: listingsTable.district,
    city: listingsTable.city,
    count: count(),
    avgPrice: avg(listingsTable.price),
    avgPricePerSqm: avg(listingsTable.pricePerSqm),
    avgLat: sql<number | null>`avg(latitude)`,
    avgLng: sql<number | null>`avg(longitude)`,
  }).from(listingsTable)
    .where(and(
      where,
      sql`district is not null`,
      sql`district != ''`,
      sql`latitude is not null`,
      sql`longitude is not null`,
    ))
    .groupBy(listingsTable.district, listingsTable.city)
    .orderBy(desc(count()));

  res.json(results.map(r => ({
    district: r.district ?? "",
    city: r.city,
    count: r.count,
    avgPrice: Math.round(parseFloat(String(r.avgPrice ?? "0"))),
    avgPricePerSqm: Math.round(parseFloat(String(r.avgPricePerSqm ?? "0"))),
    lat: r.avgLat ? parseFloat(String(r.avgLat)) : null,
    lng: r.avgLng ? parseFloat(String(r.avgLng)) : null,
  })));
});

router.get("/listings-filter-options", async (req, res) => {
  const [cities, districts, types] = await Promise.all([
    db.selectDistinct({ city: listingsTable.city })
      .from(listingsTable).where(eq(listingsTable.status, "active"))
      .orderBy(listingsTable.city),
    db.selectDistinct({ district: listingsTable.district, city: listingsTable.city })
      .from(listingsTable)
      .where(and(eq(listingsTable.status, "active"), sql`district is not null and district != ''`))
      .orderBy(listingsTable.district),
    db.selectDistinct({ propertyType: listingsTable.propertyType })
      .from(listingsTable).where(eq(listingsTable.status, "active"))
      .orderBy(listingsTable.propertyType),
  ]);

  res.json({
    cities: cities.map(r => r.city),
    districts: districts.map(r => ({ district: r.district ?? "", city: r.city })),
    propertyTypes: types.map(r => r.propertyType),
    listingTypes: [
      { value: "sale", label: "بيع" },
      { value: "rent", label: "إيجار" },
    ],
  });
});

export default router;
