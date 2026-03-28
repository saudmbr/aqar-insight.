import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const adminReportsRouter = Router();

// Admin-only middleware
adminReportsRouter.use((req: Request, res: Response, next) => {
  if (!req.session.isAdmin) {
    res.status(403).json({ message: "غير مصرح لك" });
    return;
  }
  next();
});

function getPeriodStart(period: string): string {
  const now = new Date();
  switch (period) {
    case "day":     now.setDate(now.getDate() - 1); break;
    case "week":    now.setDate(now.getDate() - 7); break;
    case "quarter": now.setDate(now.getDate() - 90); break;
    case "year":    now.setDate(now.getDate() - 365); break;
    default:        now.setDate(now.getDate() - 30);  // month
  }
  return now.toISOString();
}

adminReportsRouter.get("/", async (req: Request, res: Response) => {
  const period = (req.query.period as string) || "month";
  const since = getPeriodStart(period);

  try {
    const [
      overviewResult,
      newUsersResult,
      newListingsResult,
      newRequestsResult,
      newServicesResult,
      usersByRoleResult,
      listingsByStatusResult,
      listingsByCityResult,
      listingsByTypeResult,
      listingsByListingTypeResult,
      priceStatsResult,
      requestsByStatusResult,
      requestsByTypeResult,
      requestsByCityResult,
      servicesByCategoryResult,
      servicesByCityResult,
      marketCitiesResult,
      marketDistrictsResult,
      sessionsResult,
      featuredVerifiedResult,
      listingsWithViewsResult,
    ] = await Promise.all([

      // ── Overview totals (single query) ─────────────────────────────────────
      db.execute(sql`
        SELECT
          (SELECT COUNT(*)::int FROM users)                               AS total_users,
          (SELECT COUNT(*)::int FROM listings)                            AS total_listings,
          (SELECT COUNT(*)::int FROM listings WHERE status = 'active')    AS active_listings,
          (SELECT COUNT(*)::int FROM listings WHERE status = 'archived')  AS archived_listings,
          (SELECT COUNT(*)::int FROM customer_requests)                   AS total_requests,
          (SELECT COUNT(*)::int FROM service_providers)                   AS total_services,
          (SELECT COUNT(*)::int FROM marketer_profiles)                   AS total_marketers,
          (SELECT COUNT(*)::int FROM favorites)                           AS total_favorites
      `),

      // ── New this period ────────────────────────────────────────────────────
      db.execute(sql`SELECT COUNT(*)::int AS count FROM users            WHERE created_at >= ${since}::timestamptz`),
      db.execute(sql`SELECT COUNT(*)::int AS count FROM listings         WHERE created_at >= ${since}::timestamp`),
      db.execute(sql`SELECT COUNT(*)::int AS count FROM customer_requests WHERE created_at >= ${since}::timestamp`),
      db.execute(sql`SELECT COUNT(*)::int AS count FROM service_providers WHERE created_at >= ${since}::timestamp`),

      // ── Users by role ─────────────────────────────────────────────────────
      db.execute(sql`
        SELECT role, COUNT(*)::int AS count FROM users
        GROUP BY role ORDER BY count DESC
      `),

      // ── Listings breakdown ────────────────────────────────────────────────
      db.execute(sql`SELECT status, COUNT(*)::int AS count FROM listings GROUP BY status ORDER BY count DESC`),
      db.execute(sql`
        SELECT city, COUNT(*)::int AS count FROM listings
        WHERE city IS NOT NULL AND city != ''
        GROUP BY city ORDER BY count DESC LIMIT 10
      `),
      db.execute(sql`
        SELECT property_type AS type, COUNT(*)::int AS count FROM listings
        WHERE property_type IS NOT NULL AND property_type != ''
        GROUP BY property_type ORDER BY count DESC LIMIT 10
      `),
      db.execute(sql`
        SELECT listing_type AS type, COUNT(*)::int AS count FROM listings
        WHERE listing_type IS NOT NULL
        GROUP BY listing_type ORDER BY count DESC
      `),

      // ── Price stats ───────────────────────────────────────────────────────
      db.execute(sql`
        SELECT
          ROUND(AVG(price))::int         AS avg_price,
          ROUND(MIN(price))::int         AS min_price,
          ROUND(MAX(price))::int         AS max_price,
          ROUND(AVG(price_per_sqm))::int AS avg_psm
        FROM listings WHERE status = 'active' AND price > 0
      `),

      // ── Requests breakdown ────────────────────────────────────────────────
      db.execute(sql`SELECT status, COUNT(*)::int AS count FROM customer_requests GROUP BY status ORDER BY count DESC`),
      db.execute(sql`
        SELECT request_type AS type, COUNT(*)::int AS count FROM customer_requests
        WHERE request_type IS NOT NULL
        GROUP BY request_type ORDER BY count DESC
      `),
      db.execute(sql`
        SELECT city, COUNT(*)::int AS count FROM customer_requests
        WHERE city IS NOT NULL AND city != ''
        GROUP BY city ORDER BY count DESC LIMIT 8
      `),

      // ── Services breakdown ────────────────────────────────────────────────
      db.execute(sql`
        SELECT category, COUNT(*)::int AS count FROM service_providers
        WHERE category IS NOT NULL AND category != ''
        GROUP BY category ORDER BY count DESC LIMIT 10
      `),
      db.execute(sql`
        SELECT city, COUNT(*)::int AS count FROM service_providers
        WHERE city IS NOT NULL AND city != ''
        GROUP BY city ORDER BY count DESC LIMIT 8
      `),

      // ── Market ───────────────────────────────────────────────────────────
      db.execute(sql`
        SELECT city,
          ROUND(AVG(price))::int         AS avg_price,
          ROUND(AVG(price_per_sqm))::int AS avg_psm,
          COUNT(*)::int                  AS count
        FROM listings
        WHERE status = 'active' AND price > 0 AND city IS NOT NULL AND city != ''
        GROUP BY city ORDER BY avg_psm DESC LIMIT 10
      `),
      db.execute(sql`
        SELECT district, city,
          ROUND(AVG(price))::int         AS avg_price,
          ROUND(AVG(price_per_sqm))::int AS avg_psm,
          COUNT(*)::int                  AS count
        FROM listings
        WHERE status = 'active' AND price > 0
          AND district IS NOT NULL AND district != ''
        GROUP BY district, city ORDER BY avg_psm DESC LIMIT 10
      `),

      // ── Operational ───────────────────────────────────────────────────────
      db.execute(sql`SELECT COUNT(*)::int AS count FROM session`),
      db.execute(sql`
        SELECT
          COUNT(CASE WHEN featured = true THEN 1 END)::int AS featured,
          COUNT(CASE WHEN verified = true THEN 1 END)::int AS verified
        FROM listings
      `),

      // ── Listings with views ────────────────────────────────────────────────
      db.execute(sql`
        SELECT id, title, city, views
        FROM listings WHERE views > 0
        ORDER BY views DESC LIMIT 5
      `),
    ]);

    const ov = (overviewResult.rows[0] as Record<string, number>) ?? {};
    const n  = (r: typeof overviewResult) => (r.rows[0] as any)?.count ?? 0;
    const ra = (r: typeof overviewResult) => (r.rows as any[]) ?? [];

    // ── Smart alerts ───────────────────────────────────────────────────────
    const alerts: Array<{ type: string; message: string; severity: "high"|"medium"|"low" }> = [];

    if (!ov.total_listings)        alerts.push({ type: "listings",  message: "لا توجد إعلانات في المنصة بعد — أضف إعلانات لتبدأ التحليلات",         severity: "high"   });
    else if (!ov.active_listings)  alerts.push({ type: "listings",  message: "لا توجد إعلانات نشطة حالياً — راجع حالة الإعلانات الموجودة",           severity: "high"   });
    if (!ov.total_users)           alerts.push({ type: "users",     message: "لا يوجد مستخدمون مسجلون في المنصة بعد",                                severity: "high"   });
    if (n(newListingsResult) === 0 && ov.total_listings > 0)
                                   alerts.push({ type: "listings",  message: "لا توجد إعلانات جديدة خلال الفترة المحددة",                            severity: "medium" });
    if (n(newUsersResult) === 0 && ov.total_users > 0)
                                   alerts.push({ type: "users",     message: "لا يوجد مستخدمون جدد خلال الفترة المحددة",                              severity: "medium" });
    if (!ov.total_requests)        alerts.push({ type: "requests",  message: "لا توجد طلبات مسجلة في المنصة بعد",                                    severity: "low"    });
    if (!ov.total_services)        alerts.push({ type: "services",  message: "لا يوجد مقدمو خدمات مسجلون بعد",                                       severity: "low"    });
    if (!ov.total_marketers)       alerts.push({ type: "marketers", message: "لا يوجد مسوّقون عقاريون مسجلون بعد",                                   severity: "low"    });
    if (ov.archived_listings > ov.active_listings && ov.total_listings > 0)
                                   alerts.push({ type: "listings",  message: "عدد الإعلانات المؤرشفة يتجاوز النشطة — راجع الإعلانات المؤرشفة",        severity: "medium" });

    res.json({
      period,
      overview: {
        totalUsers:       ov.total_users       ?? 0,
        totalListings:    ov.total_listings     ?? 0,
        activeListings:   ov.active_listings    ?? 0,
        archivedListings: ov.archived_listings  ?? 0,
        totalRequests:    ov.total_requests     ?? 0,
        totalServices:    ov.total_services     ?? 0,
        totalMarketers:   ov.total_marketers    ?? 0,
        totalFavorites:   ov.total_favorites    ?? 0,
        newUsers:         n(newUsersResult),
        newListings:      n(newListingsResult),
        newRequests:      n(newRequestsResult),
        newServices:      n(newServicesResult),
      },
      users: {
        byRole: ra(usersByRoleResult),
      },
      listings: {
        byStatus:       ra(listingsByStatusResult),
        byCity:         ra(listingsByCityResult),
        byType:         ra(listingsByTypeResult),
        byListingType:  ra(listingsByListingTypeResult),
        priceStats:     (priceStatsResult.rows[0] as any) ?? {},
        featuredCount:  (featuredVerifiedResult.rows[0] as any)?.featured ?? 0,
        verifiedCount:  (featuredVerifiedResult.rows[0] as any)?.verified ?? 0,
        topByViews:     ra(listingsWithViewsResult),
      },
      requests: {
        byStatus: ra(requestsByStatusResult),
        byType:   ra(requestsByTypeResult),
        byCity:   ra(requestsByCityResult),
      },
      services: {
        byCategory: ra(servicesByCategoryResult),
        byCity:     ra(servicesByCityResult),
      },
      market: {
        byCities:    ra(marketCitiesResult),
        byDistricts: ra(marketDistrictsResult),
      },
      operational: {
        activeSessions: n(sessionsResult),
      },
      alerts,
    });

  } catch (err) {
    console.error("[admin-reports]", err);
    res.status(500).json({ message: "حدث خطأ في الخادم أثناء تحميل التقارير" });
  }
});

export default adminReportsRouter;
