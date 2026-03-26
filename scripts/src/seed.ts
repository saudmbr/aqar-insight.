import { db, propertiesTable } from "@workspace/db";

const cities = [
  { name: "الرياض", districts: ["العليا", "النخيل", "الملقا", "الياسمين", "حطين", "الروضة", "المروج", "الوادي", "الربوة", "الورود"] },
  { name: "جدة", districts: ["الزهراء", "السلامة", "الروضة", "الحمراء", "الصفا", "البوادي", "النسيم", "الفيحاء", "الربوة", "الشاطئ"] },
  { name: "الدمام", districts: ["الشاطئ", "المزروعية", "الفردوس", "الجلوية", "الواجهة البحرية", "العزيزية", "البادية", "الراكة"] },
  { name: "مكة المكرمة", districts: ["العزيزية", "النسيم", "الشوقية", "الهجرة", "أجياد", "الزاهر", "العتيبية"] },
  { name: "المدينة المنورة", districts: ["العوالي", "بني بياضة", "الملك فيصل", "النخيل", "السلام", "الجماوات"] },
];

const propertyTypes = ["شقة", "فيلا", "أرض", "مكتب", "محل تجاري", "دوبلكس"];
const listingTypes: ("sale" | "rent")[] = ["sale", "rent"];

const basePrices: Record<string, Record<string, { sale: number; rent: number }>> = {
  "شقة": { "الرياض": { sale: 850000, rent: 28000 }, "جدة": { sale: 780000, rent: 30000 }, "الدمام": { sale: 600000, rent: 22000 }, "مكة المكرمة": { sale: 920000, rent: 35000 }, "المدينة المنورة": { sale: 650000, rent: 24000 } },
  "فيلا": { "الرياض": { sale: 3200000, rent: 95000 }, "جدة": { sale: 2800000, rent: 90000 }, "الدمام": { sale: 2200000, rent: 70000 }, "مكة المكرمة": { sale: 3500000, rent: 110000 }, "المدينة المنورة": { sale: 2400000, rent: 80000 } },
  "أرض": { "الرياض": { sale: 1800000, rent: 0 }, "جدة": { sale: 1500000, rent: 0 }, "الدمام": { sale: 1100000, rent: 0 }, "مكة المكرمة": { sale: 2200000, rent: 0 }, "المدينة المنورة": { sale: 1300000, rent: 0 } },
  "مكتب": { "الرياض": { sale: 950000, rent: 60000 }, "جدة": { sale: 800000, rent: 55000 }, "الدمام": { sale: 650000, rent: 40000 }, "مكة المكرمة": { sale: 1000000, rent: 70000 }, "المدينة المنورة": { sale: 700000, rent: 45000 } },
  "محل تجاري": { "الرياض": { sale: 600000, rent: 80000 }, "جدة": { sale: 550000, rent: 75000 }, "الدمام": { sale: 420000, rent: 55000 }, "مكة المكرمة": { sale: 700000, rent: 100000 }, "المدينة المنورة": { sale: 480000, rent: 65000 } },
  "دوبلكس": { "الرياض": { sale: 1800000, rent: 65000 }, "جدة": { sale: 1600000, rent: 60000 }, "الدمام": { sale: 1300000, rent: 48000 }, "مكة المكرمة": { sale: 1950000, rent: 72000 }, "المدينة المنورة": { sale: 1400000, rent: 52000 } },
};

const areaRanges: Record<string, { min: number; max: number }> = {
  "شقة": { min: 90, max: 250 },
  "فيلا": { min: 300, max: 800 },
  "أرض": { min: 400, max: 2000 },
  "مكتب": { min: 60, max: 300 },
  "محل تجاري": { min: 30, max: 200 },
  "دوبلكس": { min: 200, max: 450 },
};

const monthNames = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

function randBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number) {
  return Math.floor(randBetween(min, max + 1));
}

function districtMultiplier(district: string, index: number): number {
  const premiumKeywords = ["العليا", "الملقا", "الزهراء", "الشاطئ", "الحمراء", "العزيزية"];
  if (premiumKeywords.some(k => district.includes(k))) return 1.2 + Math.random() * 0.2;
  return 0.85 + Math.random() * 0.3 + index * 0.01;
}

function yearTrend(year: number): number {
  const trends: Record<number, number> = { 2021: 0.85, 2022: 0.92, 2023: 1.0, 2024: 1.08, 2025: 1.14 };
  return trends[year] ?? 1.0;
}

async function seed() {
  console.log("Seeding Saudi real estate data...");
  
  const existing = await db.select().from(propertiesTable).limit(1);
  if (existing.length > 0) {
    console.log("Data already seeded, skipping.");
    process.exit(0);
  }

  const records = [];
  const years = [2021, 2022, 2023, 2024, 2025];

  for (const { name: city, districts } of cities) {
    for (const propertyType of propertyTypes) {
      if (propertyType === "أرض") {
        // land is sale only
        for (const year of years) {
          for (let m = 1; m <= 12; m++) {
            const districtIdx = randInt(0, districts.length - 1);
            const district = districts[districtIdx];
            const base = basePrices[propertyType]?.[city]?.sale ?? 1000000;
            const mult = districtMultiplier(district, districtIdx) * yearTrend(year) * (0.9 + Math.random() * 0.2);
            const area = randBetween(areaRanges[propertyType].min, areaRanges[propertyType].max);
            const price = Math.round((base * mult) / 1000) * 1000;
            const pricePerSqm = Math.round(price / area);
            records.push({
              city, district, propertyType, listingType: "sale" as const,
              price, area: Math.round(area), pricePerSqm,
              year, month: m,
              recordedAt: `${year}-${String(m).padStart(2, "0")}-15`,
            });
          }
        }
        continue;
      }
      for (const listingType of listingTypes) {
        for (const year of years) {
          for (let m = 1; m <= 12; m++) {
            const districtIdx = randInt(0, districts.length - 1);
            const district = districts[districtIdx];
            const base = basePrices[propertyType]?.[city]?.[listingType] ?? 500000;
            const mult = districtMultiplier(district, districtIdx) * yearTrend(year) * (0.88 + Math.random() * 0.24);
            const area = randBetween(areaRanges[propertyType].min, areaRanges[propertyType].max);
            const price = listingType === "rent"
              ? Math.round((base * mult) / 100) * 100
              : Math.round((base * mult) / 1000) * 1000;
            const pricePerSqm = Math.round(price / area);
            const bedrooms = ["شقة","فيلا","دوبلكس"].includes(propertyType) ? randInt(1, propertyType === "فيلا" ? 7 : 4) : null;
            const bathrooms = bedrooms ? Math.max(1, Math.floor(bedrooms * 0.6) + randInt(0, 1)) : null;
            records.push({
              city, district, propertyType, listingType,
              price, area: Math.round(area), pricePerSqm,
              bedrooms, bathrooms,
              year, month: m,
              recordedAt: `${year}-${String(m).padStart(2, "0")}-15`,
            });
          }
        }
      }
    }
  }

  // Insert in batches
  const batchSize = 200;
  for (let i = 0; i < records.length; i += batchSize) {
    await db.insert(propertiesTable).values(records.slice(i, i + batchSize));
    console.log(`Inserted ${Math.min(i + batchSize, records.length)}/${records.length}`);
  }
  console.log(`✅ Seeded ${records.length} property records!`);
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
