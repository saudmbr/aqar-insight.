import { Router, type IRouter } from "express";
import { db, listingsTable } from "@workspace/db";
import { eq, and, gte, lte, sql, count, avg, min, max, desc, ne } from "drizzle-orm";

const LISTING_LABEL_MAP: Record<string, string> = {
  sale: "للبيع", installment: "بيع بالتقسيط", auction: "مزاد علني",
  rent: "للإيجار", rent_annual: "إيجار سنوي", rent_monthly: "إيجار شهري",
  rent_seasonal: "إيجار موسمي",
  investment: "استثماري",
};

const router: IRouter = Router();

// ── Types ───────────────────────────────────────────────────────────────────

type FilterParams = {
  city?: string; district?: string; propertyType?: string; listingType?: string;
  minPrice?: number; maxPrice?: number; minArea?: number; maxArea?: number;
  bedrooms?: number; bathrooms?: number; region?: string; days?: number;
};

function buildListingConditions(f: FilterParams) {
  const conds = [eq(listingsTable.status, "active")];
  if (f.region) conds.push(eq(listingsTable.region, f.region));
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
  if (f.days) {
    const since = new Date();
    since.setDate(since.getDate() - f.days);
    conds.push(gte(listingsTable.createdAt, since));
  }
  return and(...conds);
}

function parseFilters(query: Record<string, string>): FilterParams {
  return {
    region: query.region || undefined,
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
    days: query.days ? Number(query.days) : undefined,
  };
}

function pct(a: number, b: number) {
  return b > 0 ? Math.round((a / b) * 100) : 0;
}

function round(n: number | string | null | undefined): number {
  return Math.round(parseFloat(String(n ?? "0")));
}

// ── Market Score Calculation ────────────────────────────────────────────────

function calcMarketScore(params: {
  newInPeriod: number; totalListings: number; byPropertyType: { count: number }[];
  avgPrice: number; priceStddev: number;
}): { score: number; label: "قوي" | "متوازن" | "ضعيف"; components: { activity: number; diversity: number; stability: number }; explanation: string } {
  const { newInPeriod, totalListings, byPropertyType, avgPrice, priceStddev } = params;

  // Activity component (0-40): based on new listings vs total
  const turnoverRate = totalListings > 0 ? (newInPeriod / totalListings) * 100 : 0;
  const activityScore = turnoverRate > 30 ? 40 : turnoverRate > 20 ? 33 : turnoverRate > 10 ? 24 : turnoverRate > 3 ? 14 : 5;

  // Diversity component (0-30): number of different property types
  const typeCount = byPropertyType.filter(t => t.count > 0).length;
  const diversityScore = typeCount >= 6 ? 30 : typeCount >= 4 ? 22 : typeCount >= 2 ? 14 : typeCount >= 1 ? 7 : 0;

  // Stability component (0-30): coefficient of variation (low = stable)
  const cv = avgPrice > 0 ? priceStddev / avgPrice : 1;
  const stabilityScore = cv < 0.3 ? 30 : cv < 0.6 ? 22 : cv < 1.0 ? 14 : cv < 1.5 ? 8 : 4;

  const score = Math.min(100, activityScore + diversityScore + stabilityScore);
  const label = score >= 65 ? "قوي" : score >= 35 ? "متوازن" : "ضعيف";

  const explanation =
    `النشاط: ${activityScore}/40 — التنوع: ${diversityScore}/30 — الاستقرار: ${stabilityScore}/30`;

  return { score, label, components: { activity: activityScore, diversity: diversityScore, stability: stabilityScore }, explanation };
}

// ── Smart Insights Generator ────────────────────────────────────────────────

function generateSmartInsights(data: {
  kpis: Record<string, number>;
  byCity: Array<{ city: string; count: number; avgPrice: number; avgPricePerSqm: number }>;
  byDistrict: Array<{ district: string; city: string; count: number; avgPrice?: number; avgPricePerSqm: number }>;
  byPropertyType: Array<{ propertyType: string; count: number; avgPrice: number }>;
  byListingType: Array<{ listingType: string; count: number }>;
  marketScore?: { score: number; label: string };
  supplyDemand?: { marketBalance: string; marketBalanceLabel: string };
}): string[] {
  const insights: string[] = [];
  const { kpis, byCity, byDistrict, byPropertyType, byListingType, marketScore, supplyDemand } = data;

  if (!kpis.totalListings) return ["لا توجد إعلانات نشطة حالياً للتحليل."];

  // Market health
  if (marketScore) {
    insights.push(
      marketScore.score >= 65
        ? `مؤشر السوق قوي (${marketScore.score}/100) — نشاط مرتفع وتنوع جيد في الإعلانات`
        : marketScore.score >= 35
        ? `مؤشر السوق متوازن (${marketScore.score}/100) — الأسعار مستقرة والنشاط معتدل`
        : `مؤشر السوق ضعيف (${marketScore.score}/100) — البيانات محدودة أو النشاط منخفض`
    );
  }

  // Supply/demand balance
  if (supplyDemand?.marketBalance) {
    if (supplyDemand.marketBalance === "higher_demand") {
      insights.push("الطلب يفوق العرض بناءً على معدل دوران الإعلانات — مؤشر على ضغط تصاعدي للأسعار");
    } else if (supplyDemand.marketBalance === "higher_supply") {
      insights.push("العرض يتجاوز الطلب — فرصة تفاوضية أكبر للمشترين");
    } else {
      insights.push("العرض والطلب في حالة توازن نسبي خلال الفترة المحددة");
    }
  }

  // Top property type
  const topType = byPropertyType[0];
  if (topType) {
    insights.push(`${topType.propertyType} هي الفئة الأكثر عرضاً (${pct(topType.count, kpis.totalListings)}% من الإعلانات)`);
  }

  // Top city
  const topCity = byCity[0];
  if (topCity) {
    const cityPct = pct(topCity.count, kpis.totalListings);
    insights.push(`${topCity.city} تستحوذ على ${cityPct}% من الإعلانات النشطة`);
  }

  // Market type distribution
  const salePct = pct(kpis.saleCount, kpis.totalListings);
  const rentPct = pct(kpis.rentCount, kpis.totalListings);
  const investPct = pct(kpis.investCount, kpis.totalListings);
  if (salePct > 0 || rentPct > 0) {
    insights.push(`توزيع السوق: ${salePct}% بيع — ${rentPct}% إيجار${investPct > 0 ? ` — ${investPct}% استثماري` : ""}`);
  }

  // Price comparison
  if (byPropertyType.length >= 2) {
    const [first, second] = byPropertyType;
    if (first.avgPrice > 0 && second.avgPrice > 0) {
      const diff = Math.round(((first.avgPrice - second.avgPrice) / second.avgPrice) * 100);
      if (Math.abs(diff) > 10) {
        const higher = diff > 0 ? first : second;
        const lower = diff > 0 ? second : first;
        insights.push(`متوسط سعر ${higher.propertyType} أعلى من ${lower.propertyType} بنسبة ${Math.abs(diff)}%`);
      }
    }
  }

  // Undervalued districts
  const avgPsm = kpis.avgPricePerSqm;
  if (byDistrict.length > 0 && avgPsm > 0) {
    const undervalued = byDistrict.filter(d => d.avgPricePerSqm > 0 && d.avgPricePerSqm < avgPsm * 0.88);
    if (undervalued.length > 0) {
      insights.push(`حي ${undervalued[0].district} يُعدّ أقل تسعيراً من المتوسط العام — فرصة استثمارية محتملة`);
    }
    const premium = byDistrict.filter(d => d.avgPricePerSqm > avgPsm * 1.15);
    if (premium.length > 0) {
      insights.push(`حي ${premium[0].district} يسجل أسعاراً فوق المتوسط العام بأكثر من 15%`);
    }
  }

  // Activity
  if (kpis.newLast7Days > 0) {
    insights.push(`إضافة ${kpis.newLast7Days} إعلان خلال آخر 7 أيام — معدل ${Math.round(kpis.newLast7Days / 7 * 10) / 10} إعلان/يوم`);
  }

  // Average price vs median
  const avgP = kpis.avgPrice;
  const medP = kpis.medianPrice;
  if (avgP > 0 && medP > 0) {
    const skew = avgP / medP;
    if (skew > 1.2) {
      insights.push("المتوسط أعلى من الوسيط بشكل ملحوظ — عقارات مرتفعة السعر تؤثر على متوسط السوق");
    } else if (skew < 0.88) {
      insights.push("الوسيط أعلى من المتوسط — يشير لتركّز العقارات في النطاق المرتفع");
    }
  }

  return insights.slice(0, 8);
}

// ── Main Insights Endpoint ──────────────────────────────────────────────────

router.get("/listings-insights", async (req, res) => {
  const f = parseFilters(req.query as Record<string, string>);
  const where = buildListingConditions(f);

  const now = new Date();
  const last7  = new Date(now); last7.setDate(now.getDate() - 7);
  const last30 = new Date(now); last30.setDate(now.getDate() - 30);
  const last90 = new Date(now); last90.setDate(now.getDate() - 90);

  // Base where without days filter for counts
  const baseWhere = buildListingConditions({ ...f, days: undefined });

  const [kpiRows, byRegionRows, byCityRows, byDistrictRows, byTypeRows, byListingTypeRows, trend7, trend30, trend90] = await Promise.all([
    db.select({
      totalListings: count(),
      avgPricePerSqm: avg(listingsTable.pricePerSqm),
      avgPrice: avg(listingsTable.price),
      maxPrice: max(listingsTable.price),
      minPrice: min(listingsTable.price),
      saleCount:        sql<number>`sum(case when listing_type in ('sale','installment','auction') then 1 else 0 end)::int`,
      rentCount:        sql<number>`sum(case when listing_type in ('rent','rent_annual','rent_monthly','rent_seasonal') then 1 else 0 end)::int`,
      investCount:      sql<number>`sum(case when listing_type = 'investment' then 1 else 0 end)::int`,
      listingsWithArea: sql<number>`sum(case when price_per_sqm is not null and price_per_sqm > 0 then 1 else 0 end)::int`,
      medianPrice:      sql<number>`percentile_cont(0.5) within group (order by price)`,
      p25:              sql<number>`percentile_cont(0.25) within group (order by price)`,
      p75:              sql<number>`percentile_cont(0.75) within group (order by price)`,
      priceStddev:      sql<number>`coalesce(stddev(price), 0)`,
      avgDaysOnMarket:  sql<number>`avg(extract(epoch from (now() - created_at))/86400)`,
    }).from(listingsTable).where(where),

    db.select({ region: listingsTable.region, count: count(), avgPrice: avg(listingsTable.price), avgPricePerSqm: avg(listingsTable.pricePerSqm) })
      .from(listingsTable).where(and(where, sql`region is not null and region != ''`))
      .groupBy(listingsTable.region).orderBy(desc(avg(listingsTable.price))),

    db.select({ city: listingsTable.city, count: count(), avgPrice: avg(listingsTable.price), avgPricePerSqm: avg(listingsTable.pricePerSqm) })
      .from(listingsTable).where(where).groupBy(listingsTable.city).orderBy(desc(avg(listingsTable.price))),

    db.select({ district: listingsTable.district, city: listingsTable.city, count: count(), avgPrice: avg(listingsTable.price), avgPricePerSqm: avg(listingsTable.pricePerSqm) })
      .from(listingsTable).where(and(where, sql`district is not null and district != ''`))
      .groupBy(listingsTable.district, listingsTable.city).orderBy(desc(avg(listingsTable.price))),

    db.select({ propertyType: listingsTable.propertyType, count: count(), avgPrice: avg(listingsTable.price), avgPricePerSqm: avg(listingsTable.pricePerSqm) })
      .from(listingsTable).where(where).groupBy(listingsTable.propertyType).orderBy(desc(count())),

    db.select({ listingType: listingsTable.listingType, count: count(), avgPrice: avg(listingsTable.price) })
      .from(listingsTable).where(where).groupBy(listingsTable.listingType),

    db.select({ count: count() }).from(listingsTable).where(and(baseWhere, gte(listingsTable.createdAt, last7))),
    db.select({ count: count() }).from(listingsTable).where(and(baseWhere, gte(listingsTable.createdAt, last30))),
    db.select({ count: count() }).from(listingsTable).where(and(baseWhere, gte(listingsTable.createdAt, last90))),
  ]);

  const k = kpiRows[0];
  const totalListings = k?.totalListings ?? 0;
  const newLast7Days  = trend7[0]?.count ?? 0;
  const newLast30Days = trend30[0]?.count ?? 0;
  const newLast90Days = trend90[0]?.count ?? 0;
  const avgPriceNum   = round(k?.avgPrice);
  const stddevNum     = round(k?.priceStddev);

  const kpis = {
    totalListings,
    avgPricePerSqm:   round(k?.avgPricePerSqm),
    avgPrice:         avgPriceNum,
    maxPrice:         round(k?.maxPrice),
    minPrice:         round(k?.minPrice),
    medianPrice:      round(k?.medianPrice),
    p25Price:         round(k?.p25),
    p75Price:         round(k?.p75),
    priceStddev:      stddevNum,
    saleCount:        Number(k?.saleCount ?? 0),
    rentCount:        Number(k?.rentCount ?? 0),
    investCount:      Number(k?.investCount ?? 0),
    listingsWithArea: Number(k?.listingsWithArea ?? 0),
    newLast7Days,
    newLast30Days,
    newLast90Days,
    turnoverRate:     pct(newLast30Days, totalListings),
    areaDataRate:     pct(Number(k?.listingsWithArea ?? 0), totalListings),
    avgDaysOnMarket:  Math.round(parseFloat(String(k?.avgDaysOnMarket ?? "0"))),
    priceDeviationPct: avgPriceNum > 0 && round(k?.medianPrice) > 0
      ? Math.round(((avgPriceNum - round(k?.medianPrice)) / round(k?.medianPrice)) * 100)
      : 0,
  };

  const byRegion = byRegionRows.map(r => ({ region: r.region ?? "", count: r.count, avgPrice: round(r.avgPrice), avgPricePerSqm: round(r.avgPricePerSqm) }));
  const byCity   = byCityRows.map(r => ({ city: r.city, count: r.count, avgPrice: round(r.avgPrice), avgPricePerSqm: round(r.avgPricePerSqm) }));
  const byDistrict = byDistrictRows.map(r => ({ district: r.district ?? "", city: r.city, count: r.count, avgPrice: round(r.avgPrice), avgPricePerSqm: round(r.avgPricePerSqm) }));
  const byPropertyType = byTypeRows.map(r => ({ propertyType: r.propertyType, count: r.count, avgPrice: round(r.avgPrice), avgPricePerSqm: round(r.avgPricePerSqm), percentage: pct(r.count, totalListings) }));
  const byListingType  = byListingTypeRows.map(r => ({ listingType: r.listingType, count: r.count, avgPrice: round(r.avgPrice), percentage: pct(r.count, totalListings), label: LISTING_LABEL_MAP[r.listingType] ?? r.listingType })).sort((a, b) => b.count - a.count);

  // Market score
  const marketScore = calcMarketScore({ newInPeriod: newLast30Days, totalListings, byPropertyType, avgPrice: avgPriceNum, priceStddev: stddevNum });

  // Supply/demand balance
  const weeklyRate = newLast30Days > 0 ? newLast30Days / 4 : 0;
  const activityRatio = weeklyRate > 0 ? newLast7Days / weeklyRate : 0;
  const marketBalance = activityRatio > 1.2 ? "higher_demand" : activityRatio < 0.8 ? "higher_supply" : "balanced";
  const marketBalanceLabel = marketBalance === "higher_demand" ? "الطلب أعلى من العرض" : marketBalance === "higher_supply" ? "العرض أعلى من الطلب" : "متوازن";

  // Supply/demand object
  const supplyDemand = {
    totalSupply: totalListings,
    newSupply: newLast30Days,
    newLast7Days,
    activityRatio: Math.round(activityRatio * 100) / 100,
    marketBalance,
    marketBalanceLabel,
    supplyDemandGap: newLast7Days - Math.round(weeklyRate),
  };

  const smartInsights = generateSmartInsights({ kpis, byCity, byDistrict, byPropertyType, byListingType, marketScore, supplyDemand });

  res.json({ kpis, byRegion, byCity, byDistrict, byPropertyType, byListingType, smartInsights, marketScore, supplyDemand });
});

// ── Trends Endpoint ─────────────────────────────────────────────────────────

router.get("/listings-trends", async (req, res) => {
  const f = parseFilters(req.query as Record<string, string>);
  const period = (req.query.period as string) ?? "month";
  const where = buildListingConditions(f);

  const monthNames = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

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
    bucket: groupExpr, count: count(), avgPrice: avg(listingsTable.price), avgPricePerSqm: avg(listingsTable.pricePerSqm),
  }).from(listingsTable).where(where).groupBy(groupExpr).orderBy(orderExpr);

  const makeLabel = (bucket: string): string => {
    if (period === "day") { const parts = bucket.split("-"); return `${parts[2]}/${parts[1]}`; }
    if (period === "week") { const d = new Date(bucket); return `${d.getDate()}/${d.getMonth() + 1}`; }
    if (period === "quarter") { const [yr, q] = bucket.split("Q"); return `ر${q?.trim() ?? ""} ${yr?.trim() ?? ""}`; }
    if (period === "year") return bucket;
    const [, mm] = bucket.split("-");
    return monthNames[parseInt(mm ?? "1") - 1] ?? bucket;
  };

  res.json(results.map(r => ({ period: r.bucket ?? "", label: makeLabel(r.bucket ?? ""), count: r.count, avgPrice: round(r.avgPrice), avgPricePerSqm: round(r.avgPricePerSqm) })));
});

// ── District Map Endpoint ────────────────────────────────────────────────────

router.get("/listings-districts-map", async (req, res) => {
  const f = parseFilters(req.query as Record<string, string>);
  const where = buildListingConditions(f);

  const results = await db.select({
    district: listingsTable.district, city: listingsTable.city,
    count: count(), avgPrice: avg(listingsTable.price), avgPricePerSqm: avg(listingsTable.pricePerSqm),
    avgLat: sql<number | null>`avg(latitude)`, avgLng: sql<number | null>`avg(longitude)`,
  }).from(listingsTable)
    .where(and(where, sql`district is not null`, sql`district != ''`, sql`latitude is not null`, sql`longitude is not null`))
    .groupBy(listingsTable.district, listingsTable.city).orderBy(desc(count()));

  res.json(results.map(r => ({
    district: r.district ?? "", city: r.city, count: r.count,
    avgPrice: round(r.avgPrice), avgPricePerSqm: round(r.avgPricePerSqm),
    lat: r.avgLat ? parseFloat(String(r.avgLat)) : null,
    lng: r.avgLng ? parseFloat(String(r.avgLng)) : null,
  })));
});

// ── Filter Options Endpoint ─────────────────────────────────────────────────

router.get("/listings-filter-options", async (req, res) => {
  const [cities, districts, types] = await Promise.all([
    db.selectDistinct({ city: listingsTable.city }).from(listingsTable).where(eq(listingsTable.status, "active")).orderBy(listingsTable.city),
    db.selectDistinct({ district: listingsTable.district, city: listingsTable.city })
      .from(listingsTable).where(and(eq(listingsTable.status, "active"), sql`district is not null and district != ''`)).orderBy(listingsTable.district),
    db.selectDistinct({ propertyType: listingsTable.propertyType }).from(listingsTable).where(eq(listingsTable.status, "active")).orderBy(listingsTable.propertyType),
  ]);

  res.json({
    cities: cities.map(r => r.city),
    districts: districts.map(r => ({ district: r.district ?? "", city: r.city })),
    propertyTypes: types.map(r => r.propertyType),
    listingTypes: [{ value: "sale", label: "بيع" }, { value: "rent", label: "إيجار" }],
  });
});

// ── Listing Benchmark Endpoint ───────────────────────────────────────────────

router.get("/listing-benchmark/:id", async (req, res) => {
  const listingId = parseInt(req.params.id ?? "0");
  if (!listingId) return res.status(400).json({ error: "Invalid listing ID" });

  // Fetch the listing
  const listingRows = await db.select({
    id: listingsTable.id, price: listingsTable.price, pricePerSqm: listingsTable.pricePerSqm,
    areaSqm: listingsTable.areaSqm, city: listingsTable.city, district: listingsTable.district,
    propertyType: listingsTable.propertyType, listingType: listingsTable.listingType,
  }).from(listingsTable).where(eq(listingsTable.id, listingId)).limit(1);

  const listing = listingRows[0];
  if (!listing) return res.status(404).json({ error: "Listing not found" });

  // District benchmark (exclude this listing)
  const districtBenchmark = listing.district
    ? await db.select({ count: count(), avgPrice: avg(listingsTable.price), avgPricePerSqm: avg(listingsTable.pricePerSqm) })
        .from(listingsTable)
        .where(and(eq(listingsTable.status, "active"), eq(listingsTable.city, listing.city), eq(listingsTable.district, listing.district), ne(listingsTable.id, listingId)))
    : null;

  // City benchmark (exclude this listing)
  const cityBenchmark = await db.select({ count: count(), avgPrice: avg(listingsTable.price), avgPricePerSqm: avg(listingsTable.pricePerSqm) })
    .from(listingsTable)
    .where(and(eq(listingsTable.status, "active"), eq(listingsTable.city, listing.city), ne(listingsTable.id, listingId)));

  // Property type benchmark in the same city
  const typeBenchmark = await db.select({ count: count(), avgPrice: avg(listingsTable.price), avgPricePerSqm: avg(listingsTable.pricePerSqm) })
    .from(listingsTable)
    .where(and(eq(listingsTable.status, "active"), eq(listingsTable.city, listing.city), eq(listingsTable.propertyType, listing.propertyType), ne(listingsTable.id, listingId)));

  const dist = districtBenchmark?.[0];
  const city = cityBenchmark[0];
  const typeB = typeBenchmark[0];

  const distAvgPsm = round(dist?.avgPricePerSqm);
  const distAvgPrice = round(dist?.avgPrice);
  const cityAvgPsm = round(city?.avgPricePerSqm);
  const cityAvgPrice = round(city?.avgPrice);
  const typeAvgPsm = round(typeB?.avgPricePerSqm);
  const typeAvgPrice = round(typeB?.avgPrice);
  const listingPsm = listing.pricePerSqm ?? 0;
  const listingPrice = listing.price ?? 0;

  function positionLabel(pct: number): "أقل من السوق" | "قريب من السوق" | "أعلى من السوق" {
    if (pct < -8) return "أقل من السوق";
    if (pct > 8) return "أعلى من السوق";
    return "قريب من السوق";
  }

  // Price per sqm comparison (preferred metric)
  const vsDistrictPsm = distAvgPsm > 0 && listingPsm > 0 ? Math.round(((listingPsm - distAvgPsm) / distAvgPsm) * 100) : null;
  const vsCityPsm     = cityAvgPsm > 0 && listingPsm > 0 ? Math.round(((listingPsm - cityAvgPsm) / cityAvgPsm) * 100) : null;
  const vsTypePsm     = typeAvgPsm > 0 && listingPsm > 0 ? Math.round(((listingPsm - typeAvgPsm) / typeAvgPsm) * 100) : null;

  // Price comparison (fallback)
  const vsDistrictPrice = distAvgPrice > 0 ? Math.round(((listingPrice - distAvgPrice) / distAvgPrice) * 100) : null;
  const vsCityPrice     = cityAvgPrice > 0 ? Math.round(((listingPrice - cityAvgPrice) / cityAvgPrice) * 100) : null;

  // Use pricePerSqm if available, otherwise price
  const primaryVsDistrict = vsDistrictPsm ?? vsDistrictPrice;
  const primaryVsCity     = vsCityPsm ?? vsCityPrice;

  const hasSufficientData = (dist?.count ?? 0) >= 2 || (city?.count ?? 0) >= 2;

  res.json({
    listing: { id: listing.id, price: listingPrice, pricePerSqm: listingPsm, areaSqm: listing.areaSqm, city: listing.city, district: listing.district, propertyType: listing.propertyType },
    districtBenchmark: dist ? { count: dist.count, avgPrice: distAvgPrice, avgPricePerSqm: distAvgPsm } : null,
    cityBenchmark: { count: city?.count ?? 0, avgPrice: cityAvgPrice, avgPricePerSqm: cityAvgPsm },
    typeBenchmark: typeB ? { count: typeB.count, avgPrice: typeAvgPrice, avgPricePerSqm: typeAvgPsm } : null,
    position: {
      vsDistrict: primaryVsDistrict !== null ? { pct: primaryVsDistrict, label: positionLabel(primaryVsDistrict), usedPsm: vsDistrictPsm !== null } : null,
      vsCity:     primaryVsCity !== null     ? { pct: primaryVsCity,     label: positionLabel(primaryVsCity),     usedPsm: vsCityPsm !== null }     : null,
      vsType:     vsTypePsm !== null         ? { pct: vsTypePsm,         label: positionLabel(vsTypePsm),         usedPsm: true }                   : null,
    },
    hasSufficientData,
  });
});

export default router;
