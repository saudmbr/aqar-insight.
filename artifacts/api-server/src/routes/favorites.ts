import { Router } from "express";
import type { Request, Response } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, favoritesTable, listingsTable } from "@workspace/db";

const favoritesRouter = Router();

// ─── Get my favorites ─────────────────────────────────────────────────────────
favoritesRouter.get("/", async (req: Request, res: Response) => {
  if (!req.session.isAuthenticated) {
    res.status(401).json({ message: "يرجى تسجيل الدخول" }); return;
  }
  if (!req.session.userId) { res.json([]); return; }

  const rows = await db
    .select({
      favoriteId: favoritesTable.id,
      createdAt: favoritesTable.createdAt,
      listing: {
        id: listingsTable.id,
        title: listingsTable.title,
        propertyType: listingsTable.propertyType,
        listingType: listingsTable.listingType,
        city: listingsTable.city,
        district: listingsTable.district,
        price: listingsTable.price,
        areaSqm: listingsTable.areaSqm,
        bedrooms: listingsTable.bedrooms,
        bathrooms: listingsTable.bathrooms,
        images: listingsTable.images,
        status: listingsTable.status,
      },
    })
    .from(favoritesTable)
    .innerJoin(listingsTable, eq(favoritesTable.listingId, listingsTable.id))
    .where(eq(favoritesTable.userId, req.session.userId))
    .orderBy(desc(favoritesTable.createdAt));

  res.json(rows);
});

// ─── Check if listing is favorited ───────────────────────────────────────────
favoritesRouter.get("/:listingId/status", async (req: Request, res: Response) => {
  if (!req.session.isAuthenticated || !req.session.userId) {
    res.json({ isFavorite: false }); return;
  }

  const listingId = parseInt(req.params.listingId);
  if (isNaN(listingId)) { res.json({ isFavorite: false }); return; }

  const [row] = await db
    .select({ id: favoritesTable.id })
    .from(favoritesTable)
    .where(and(eq(favoritesTable.userId, req.session.userId), eq(favoritesTable.listingId, listingId)))
    .limit(1);

  res.json({ isFavorite: !!row });
});

// ─── Toggle favorite ──────────────────────────────────────────────────────────
favoritesRouter.post("/:listingId/toggle", async (req: Request, res: Response) => {
  if (!req.session.isAuthenticated || !req.session.userId) {
    res.status(401).json({ message: "يرجى تسجيل الدخول لحفظ الإعلانات" }); return;
  }

  const listingId = parseInt(req.params.listingId);
  if (isNaN(listingId)) { res.status(400).json({ message: "معرّف غير صحيح" }); return; }

  const [existing] = await db
    .select({ id: favoritesTable.id })
    .from(favoritesTable)
    .where(and(eq(favoritesTable.userId, req.session.userId!), eq(favoritesTable.listingId, listingId)))
    .limit(1);

  if (existing) {
    await db.delete(favoritesTable).where(eq(favoritesTable.id, existing.id));
    res.json({ isFavorite: false });
  } else {
    await db.insert(favoritesTable).values({ userId: req.session.userId!, listingId });
    res.json({ isFavorite: true });
  }
});

export default favoritesRouter;
