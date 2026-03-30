import { SAUDI_REGIONS_LIST, getMuhafazat } from "@/lib/saudi-geo";
import { PROPERTY_TYPE_GROUPS } from "@/lib/property-types";
import { LISTING_TYPE_GROUPS, LISTING_TYPE_MAP, LISTING_TYPE_COLOR_MAP } from "@/lib/listing-types";
import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getImageSrc } from "@/lib/utils";
import {
  MapPin, Building2, SlidersHorizontal, X, Search,
  BedDouble, Bath, ChevronLeft, RefreshCcw,
  Navigation, Layers, Map,
} from "lucide-react";
import type { MapPin as MapPinType } from "@/components/property-map";

const PropertyMap = lazy(() => import("@/components/property-map"));

const BASE = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

const LISTING_TYPE_LABELS = LISTING_TYPE_MAP;
const LISTING_TYPE_COLORS = LISTING_TYPE_COLOR_MAP;

function formatPrice(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} م ر.س`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} ألف ر.س`;
  return `${n} ر.س`;
}

function getFirstImage(images?: string | null): string | null {
  if (!images) return null;
  const urls = images.split("\n").map(u => u.trim()).filter(Boolean);
  return urls[0] ? getImageSrc(urls[0]) : null;
}

function ListingMiniCard({
  pin,
  isActive,
  onClick,
}: {
  pin: MapPinType;
  isActive: boolean;
  onClick: () => void;
}) {
  const img = getFirstImage(pin.images);
  const color = LISTING_TYPE_COLORS[pin.listingType] ?? "#0F7BA0";
  const label = LISTING_TYPE_LABELS[pin.listingType] ?? pin.listingType;

  return (
    <div
      onClick={onClick}
      className="flex gap-3 p-3 rounded-xl cursor-pointer transition-all border"
      style={{
        borderColor: isActive ? color : "transparent",
        background: isActive ? `${color}10` : "white",
        boxShadow: isActive
          ? `0 2px 12px ${color}25`
          : "0 1px 4px rgba(0,0,0,0.07)",
      }}
    >
      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
        {img
          ? <img src={img} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
              <Building2 className="w-6 h-6" />
            </div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: color }}
          >{label}</span>
          <span className="text-[10px] text-muted-foreground">{pin.propertyType}</span>
        </div>
        <p className="text-xs font-semibold text-foreground truncate mb-1">{pin.title}</p>
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <MapPin className="w-2.5 h-2.5" />
          {pin.city}{pin.district ? ` · ${pin.district}` : ""}
        </p>
        <p className="text-sm font-bold mt-1" style={{ color }}>
          {formatPrice(pin.price)}
        </p>
      </div>
    </div>
  );
}

export default function MapPage() {
  const [, navigate] = useLocation();

  // Filters — التسلسل الإداري: منطقة → محافظة
  const [region, setRegion]     = useState("");
  const [city, setCity]         = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [listingType, setListingType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Data
  const [pins, setPins] = useState<MapPinType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map ↔ list sync
  const [activePinId, setActivePinId] = useState<number | null>(null);
  const [visibleIds, setVisibleIds] = useState<number[]>([]);

  // Mobile view toggle
  const [mobileView, setMobileView] = useState<"map" | "list">("map");

  const buildQuery = () => {
    const p = new URLSearchParams();
    if (region) p.set("region", region);
    if (city) p.set("city", city);
    if (propertyType) p.set("propertyType", propertyType);
    if (listingType) p.set("listingType", listingType);
    if (minPrice) p.set("minPrice", minPrice);
    if (maxPrice) p.set("maxPrice", maxPrice);
    return p.toString();
  };

  const fetchPins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = buildQuery();
      const res = await fetch(`${BASE()}/api/listings/map-pins${q ? `?${q}` : ""}`);
      if (!res.ok) throw new Error("فشل تحميل البيانات");
      const json = await res.json();
      const data: MapPinType[] = (json.pins ?? []).map((p: any) => ({
        id: p.id, title: p.title, city: p.city, district: p.district,
        price: p.price, areaSqm: p.areaSqm, propertyType: p.propertyType,
        listingType: p.listingType, images: p.images,
        lat: p.lat, lng: p.lng, geocoded: p.geocoded,
      }));
      setPins(data);
      setVisibleIds(data.map(p => p.id));
      setActivePinId(null);
      console.log(`[MapPage] Loaded ${data.length} pins`);
    } catch (e) {
      setError("تعذّر تحميل خريطة العقارات. تحقق من الاتصال.");
    } finally {
      setLoading(false);
    }
  }, [region, city, propertyType, listingType, minPrice, maxPrice]);

  useEffect(() => {
    document.title = "خريطة العقارات – عقار إنسايت";
    return () => { document.title = "عقار إنسايت"; };
  }, []);

  useEffect(() => { fetchPins(); }, [fetchPins]);

  // Visible listings = intersection of pins + what's in map viewport
  const visibleSet = new Set(visibleIds);
  const visiblePins = pins.filter(p => visibleSet.has(p.id));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPins();
  };

  const clearFilters = () => {
    setRegion(""); setCity("");
    setPropertyType(""); setListingType("");
    setMinPrice(""); setMaxPrice("");
  };

  const hasFilters = !!(region || city || propertyType || listingType || minPrice || maxPrice);

  return (
    <Layout>
      {/* Page header */}
      <div
        className="relative mb-0 px-6 py-5 flex items-center gap-4"
        style={{
          background: "linear-gradient(135deg, #0F1C3F 0%, #0F1C3F 60%, #0F7BA0 100%)",
        }}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <MapPin className="w-5 h-5 text-white/80" />
            <h1 className="text-xl font-bold text-white">الخريطة التفاعلية</h1>
            <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full border border-white/15">
              {pins.length} عقار
            </span>
          </div>
          <p className="text-white/60 text-sm">
            استعرض العقارات على الخريطة — انقر على أي عقار للتفاصيل
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <Button
              size="sm" variant="ghost"
              className="text-white/70 hover:bg-white/10 gap-1.5 text-xs border border-white/15"
              onClick={clearFilters}
            >
              <X className="w-3.5 h-3.5" />
              مسح الفلاتر
            </Button>
          )}
          <Link href={`${BASE()}/listings`}>
            <Button size="sm" variant="ghost" className="text-white/80 hover:bg-white/10 border border-white/20 gap-2">
              <Layers className="w-4 h-4" />
              <span>قائمة</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter panel — always visible */}
      <div className="border-b border-border shadow-sm" style={{ background: "#f8fafc" }}>
        {/* Filter bar header */}
        <div className="px-4 py-2.5 flex items-center gap-3 border-b border-border/60" style={{ background: "#eef2f7" }}>
          <SlidersHorizontal className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm font-bold text-foreground">فلاتر البحث</span>
          {hasFilters && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary text-white">
              {[region, city, propertyType, listingType, minPrice, maxPrice].filter(Boolean).length} نشط
            </span>
          )}
          <div className="flex-1" />
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200"
            >
              <X className="w-3.5 h-3.5" />
              مسح الكل
            </button>
          )}
        </div>
        <form onSubmit={handleSearch} className="px-4 py-3 flex flex-wrap gap-3 items-end">
          {/* المنطقة */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foreground">المنطقة</label>
            <select
              value={region}
              onChange={e => { setRegion(e.target.value); setCity(""); }}
              className="border-2 border-border bg-white rounded-lg px-3 py-1.5 text-sm h-9 min-w-[130px] focus:outline-none focus:border-primary font-medium text-foreground"
            >
              <option value="">كل المناطق</option>
              {SAUDI_REGIONS_LIST.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* المحافظة */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foreground">المحافظة</label>
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              disabled={!region}
              className="border-2 border-border bg-white rounded-lg px-3 py-1.5 text-sm h-9 min-w-[130px] focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed font-medium text-foreground"
            >
              <option value="">{region ? "كل المحافظات" : "اختر منطقة أولاً"}</option>
              {getMuhafazat(region).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* نوع العقار */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foreground">نوع العقار</label>
            <select
              value={propertyType}
              onChange={e => setPropertyType(e.target.value)}
              className="border-2 border-border bg-white rounded-lg px-3 py-1.5 text-sm h-9 min-w-[130px] focus:outline-none focus:border-primary font-medium text-foreground"
            >
              <option value="">كل الأنواع</option>
              {PROPERTY_TYPE_GROUPS.map(g => (
                <optgroup key={g.label} label={`── ${g.label}`}>
                  {g.types.map(t => <option key={t} value={t}>{t}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          {/* نوع الإعلان */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foreground">نوع الإعلان</label>
            <select
              value={listingType}
              onChange={e => setListingType(e.target.value)}
              className="border-2 border-border bg-white rounded-lg px-3 py-1.5 text-sm h-9 min-w-[120px] focus:outline-none focus:border-primary font-medium text-foreground"
            >
              <option value="">الكل</option>
              {LISTING_TYPE_GROUPS.map(g => (
                <optgroup key={g.label} label={`── ${g.label}`}>
                  {g.types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          {/* نطاق السعر */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foreground">من (ر.س)</label>
            <Input
              type="number" placeholder="0" value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              className="h-9 w-28 text-sm border-2 font-medium"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foreground">إلى (ر.س)</label>
            <Input
              type="number" placeholder="بلا حد" value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              className="h-9 w-28 text-sm border-2 font-medium"
            />
          </div>

          <Button type="submit" size="sm" className="h-9 gap-2 self-end text-sm px-5 font-bold">
            <Search className="w-3.5 h-3.5" />
            بحث
          </Button>
        </form>
      </div>

      {/* Mobile tab bar */}
      <div className="md:hidden flex border-b border-border bg-white">
        <button
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
            mobileView === "map"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setMobileView("map")}
        >
          <Map className="w-4 h-4" />
          <span>الخريطة</span>
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
            mobileView === "list"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setMobileView("list")}
        >
          <Building2 className="w-4 h-4" />
          <span>القائمة {!loading && pins.length > 0 && `(${visiblePins.length})`}</span>
        </button>
      </div>

      {/* Main split layout */}
      <div className="flex" style={{ height: "calc(100vh - 170px)", minHeight: 400 }}>
        {/* Left panel: listing cards */}
        <div
          className={`flex-col bg-muted/40 border-e border-border md:flex-shrink-0 md:w-[280px] md:min-w-[200px] md:max-w-xs ${
            mobileView === "list"
              ? "flex w-full"
              : "hidden md:flex"
          }`}
        >
          {/* Panel header */}
          <div className="px-3 py-3 border-b border-border bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">
                {loading ? "جارٍ التحميل..." : `${visiblePins.length} عقار`}
              </span>
              {!loading && pins.length > visiblePins.length && (
                <span className="text-xs text-muted-foreground">
                  (من {pins.length})
                </span>
              )}
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground"
              onClick={fetchPins}
              title="تحديث"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Listings */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl bg-white">
                  <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-16 rounded" />
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-3/4 rounded" />
                    <Skeleton className="h-4 w-1/2 rounded" />
                  </div>
                </div>
              ))
            ) : error ? (
              <div className="p-4 text-center text-destructive text-sm">{error}</div>
            ) : visiblePins.length === 0 ? (
              <div className="p-6 text-center">
                <MapPin className="w-10 h-10 text-primary/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {pins.length === 0
                    ? "لا توجد عقارات بالفلاتر المختارة"
                    : "لا توجد عقارات في منطقة الخريطة المرئية — جرّب التكبير أو التحريك"}
                </p>
              </div>
            ) : (
              visiblePins.map(pin => (
                <ListingMiniCard
                  key={pin.id}
                  pin={pin}
                  isActive={activePinId === pin.id}
                  onClick={() => setActivePinId(activePinId === pin.id ? null : pin.id)}
                />
              ))
            )}
          </div>

          {/* Footer link */}
          {!loading && pins.length > 0 && (
            <div className="p-3 border-t border-border bg-white">
              <Link href={`${BASE()}/listings`}>
                <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                  <span>عرض كل الإعلانات كقائمة</span>
                  <ChevronLeft className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Right panel: map */}
        <div className={`flex-1 relative ${mobileView === "list" ? "hidden md:block" : "block"}`}>
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl px-6 py-4 shadow-lg flex items-center gap-3">
                <RefreshCcw className="w-5 h-5 text-primary animate-spin" />
                <span className="text-sm font-medium text-foreground">جارٍ تحميل الخريطة…</span>
              </div>
            </div>
          )}

          {/* Stats overlay */}
          {!loading && pins.length > 0 && (
            <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-sm rounded-xl shadow-md px-3 py-2 flex items-center gap-3 border border-border text-xs">
              <Navigation className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-foreground font-medium">{pins.length} عقار على الخريطة</span>
              {hasFilters && (
                <span className="text-primary/70 font-semibold">· مفلتر</span>
              )}
            </div>
          )}

          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center bg-muted/30">
                <div className="text-center space-y-3">
                  <MapPin className="w-12 h-12 text-primary/30 mx-auto" />
                  <p className="text-sm text-muted-foreground">جارٍ تهيئة الخريطة…</p>
                </div>
              </div>
            }
          >
            <PropertyMap
              pins={pins}
              activePinId={activePinId}
              onPinClick={id => setActivePinId(activePinId === id ? null : id)}
              onBoundsChange={setVisibleIds}
              height="100%"
              selectedRegion={region || undefined}
            />
          </Suspense>
        </div>
      </div>
    </Layout>
  );
}
