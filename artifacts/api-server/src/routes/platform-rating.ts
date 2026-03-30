import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const result = await db.execute(
      sql`SELECT ROUND(AVG(stars)::numeric, 1) as avg, COUNT(*) as count FROM platform_ratings`
    );
    const row = result.rows[0] as { avg: string | null; count: string };
    res.json({
      avg: row.avg ? parseFloat(row.avg) : 0,
      count: parseInt(row.count ?? "0", 10),
    });
  } catch {
    res.json({ avg: 0, count: 0 });
  }
});

router.post("/", async (req, res) => {
  try {
    const stars = parseInt(req.body?.stars, 10);
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ error: "قيمة النجوم غير صالحة" });
    }
    const userId = (req as any).user?.id ?? null;
    await db.execute(
      sql`INSERT INTO platform_ratings (stars, user_id) VALUES (${stars}, ${userId})`
    );
    const result = await db.execute(
      sql`SELECT ROUND(AVG(stars)::numeric, 1) as avg, COUNT(*) as count FROM platform_ratings`
    );
    const row = result.rows[0] as { avg: string | null; count: string };
    res.json({
      success: true,
      avg: row.avg ? parseFloat(row.avg) : 0,
      count: parseInt(row.count ?? "0", 10),
    });
  } catch (err) {
    console.error("platform-rating error:", err);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
