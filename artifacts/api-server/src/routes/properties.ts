import { Router, type IRouter } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { db, propertiesTable, insertPropertySchema } from "@workspace/db";
import { eq, and, ilike, sql, desc } from "drizzle-orm";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ─── LIST ─────────────────────────────────────────────────────────────────────
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
  res.json({ data, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
});

// ─── CREATE ───────────────────────────────────────────────────────────────────
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

// ─── EXPORT CSV ───────────────────────────────────────────────────────────────
// Must be before /:id
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

// ─── IMPORT TEMPLATE ──────────────────────────────────────────────────────────
// Must be before /:id
router.get("/import/template", (_req, res) => {
  const headers = [
    "المدينة", "الحي", "نوع العقار", "نوع العملية",
    "السعر", "المساحة", "غرف النوم", "دورات المياه",
    "السنة", "الشهر", "تاريخ التسجيل", "ملاحظات",
  ];

  const sampleRows = [
    ["الرياض", "الملقا", "شقة", "sale", 850000, 120, 3, 2, 2024, 6, "2024-06-15", "تشطيب راقي"],
    ["جدة", "الزهراء", "فيلا", "sale", 2500000, 400, 5, 4, 2024, 3, "2024-03-10", ""],
    ["الدمام", "العزيزية", "شقة", "rent", 35000, 95, 2, 1, 2024, 1, "2024-01-20", ""],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws["!cols"] = headers.map((_, i) => ({ wch: i < 4 ? 20 : 14 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "بيانات العقارات");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="aqar-insight-template.xlsx"`);
  res.send(buf);
});

// ─── IMPORT (bulk) ────────────────────────────────────────────────────────────
// Must be before /:id

function normalizeListingType(val: unknown): "sale" | "rent" | null {
  const s = String(val ?? "").trim().toLowerCase();
  if (["sale", "بيع", "sell", "s"].includes(s)) return "sale";
  if (["rent", "إيجار", "ايجار", "r"].includes(s)) return "rent";
  return null;
}

function validateImportRow(row: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (!row.city || String(row.city).trim().length < 1) errors.push("المدينة مطلوبة");
  if (!row.district || String(row.district).trim().length < 1) errors.push("الحي مطلوب");
  if (!row.propertyType || String(row.propertyType).trim().length < 1) errors.push("نوع العقار مطلوب");

  const lt = normalizeListingType(row.listingType);
  if (!lt) errors.push("نوع العملية يجب أن يكون 'sale' أو 'rent'");

  const price = parseFloat(String(row.price ?? ""));
  if (isNaN(price) || price <= 0) errors.push("السعر يجب أن يكون رقماً موجباً");

  const area = parseFloat(String(row.area ?? ""));
  if (isNaN(area) || area <= 0) errors.push("المساحة يجب أن تكون رقماً موجباً");

  const year = parseInt(String(row.year ?? ""));
  if (isNaN(year) || year < 2000 || year > 2100) errors.push("السنة يجب أن تكون بين 2000 و2100");

  const month = parseInt(String(row.month ?? ""));
  if (isNaN(month) || month < 1 || month > 12) errors.push("الشهر يجب أن يكون بين 1 و12");

  if (!row.recordedAt || String(row.recordedAt).trim().length < 1) errors.push("تاريخ التسجيل مطلوب");

  return errors;
}

function parseExcelDate(val: unknown): string {
  if (!val) return "";
  // xlsx may return Date objects when cellDates: true
  if (val instanceof Date) return val.toISOString().split("T")[0];
  // If it's a number, it might be an Excel serial date
  const num = Number(val);
  if (!isNaN(num) && num > 40000) {
    const d = XLSX.SSF.parse_date_code(num);
    if (d) {
      const m = String(d.m).padStart(2, "0");
      const day = String(d.d).padStart(2, "0");
      return `${d.y}-${m}-${day}`;
    }
  }
  return String(val);
}

router.post("/import", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "لم يتم رفع أي ملف" });
    return;
  }

  let mapping: Record<string, string>;
  try {
    mapping = JSON.parse(req.body.mapping ?? "{}");
  } catch {
    res.status(400).json({ error: "خريطة الأعمدة غير صحيحة" });
    return;
  }

  // Parse workbook
  let rawRows: Record<string, unknown>[];
  try {
    const wb = XLSX.read(req.file.buffer, { type: "buffer", cellDates: true });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  } catch {
    res.status(400).json({ error: "فشل في قراءة الملف، تأكد من أنه ملف Excel أو CSV صحيح" });
    return;
  }

  if (rawRows.length === 0) {
    res.status(400).json({ error: "الملف فارغ أو لا يحتوي على بيانات" });
    return;
  }

  const skipped: { rowIndex: number; reason: string }[] = [];
  const toInsert: (typeof propertiesTable.$inferInsert)[] = [];

  for (const [i, rawRow] of rawRows.entries()) {
    // Apply column mapping
    const row: Record<string, unknown> = {};
    for (const [uploadedCol, dbField] of Object.entries(mapping)) {
      if (dbField && dbField !== "__skip__") {
        row[dbField] = rawRow[uploadedCol];
      }
    }

    // Normalize recordedAt
    if (row.recordedAt !== undefined) row.recordedAt = parseExcelDate(row.recordedAt);

    const errors = validateImportRow(row);
    if (errors.length > 0) {
      skipped.push({ rowIndex: i + 2, reason: errors.join(" | ") });
      continue;
    }

    const price = parseFloat(String(row.price));
    const area = parseFloat(String(row.area));
    const lt = normalizeListingType(row.listingType)!;

    toInsert.push({
      city: String(row.city).trim(),
      district: String(row.district).trim(),
      propertyType: String(row.propertyType).trim(),
      listingType: lt,
      price,
      area,
      pricePerSqm: area > 0 ? price / area : 0,
      bedrooms: row.bedrooms ? parseInt(String(row.bedrooms)) || null : null,
      bathrooms: row.bathrooms ? parseInt(String(row.bathrooms)) || null : null,
      year: parseInt(String(row.year)),
      month: parseInt(String(row.month)),
      recordedAt: String(row.recordedAt).trim(),
      notes: row.notes ? String(row.notes).trim() || null : null,
    });
  }

  // Batch insert in chunks of 500
  let imported = 0;
  const CHUNK = 500;
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK);
    await db.insert(propertiesTable).values(chunk);
    imported += chunk.length;
  }

  res.json({ imported, total: rawRows.length, skipped });
});

// ─── GET by ID ────────────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, id));
  if (!property) { res.status(404).json({ error: "Not found" }); return; }
  res.json(property);
});

// ─── UPDATE ───────────────────────────────────────────────────────────────────
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

// ─── DELETE ───────────────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [deleted] = await db.delete(propertiesTable).where(eq(propertiesTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true, id: deleted.id });
});

export default router;
