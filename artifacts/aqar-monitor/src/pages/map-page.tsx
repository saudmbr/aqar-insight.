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
  Maximize2, BedDouble, Bath, ChevronLeft, RefreshCcw,
  Navigation, Layers,
} from "lucide-react";
import type { MapPin as MapPinType } from "@/components/property-map";

const PropertyMap = lazy(() => import("@/components/property-map"));

const BASE = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

const PROPERTY_TYPES = [
  "شقة", "فيلا", "دور", "أرض", "عمارة", "مكتب",
  "محل", "مستودع", "مزرعة", "شاليه", "عقار تجاري",
];
const LISTING_TYPES = [
  { value: "sale", label: "للبيع" },
  { value: "rent", label: "للإيجار" },
  { value: "daily_rent", label: "إيجار يومي" },
  { value: "monthly_rent", label: "إيجار شهري" },
];
const CITIES = [
  "الرياض", "جدة", "الدمام", "مكة المكرمة", "المدينة المنورة",
  "الخبر", "تبوك", "أبها", "الطائف", "بريدة",
];
const LISTING_TYPE_LABELS: Record<string, string> = {
  sale: "للبيع", rent: "للإيجار",
  daily_rent: "إيجار يومي", monthly_rent: "إيجار شهري",
  investment: "استثماري", auction: "مزاد",
};
const LISTING_TYPE_COLORS: Record<string, string> = {
  sale: "#0F7BA0", rent: "#C9A84C",
  daily_rent: "#f97316", monthly_rent: "#0d9488",
  investment: "#7c3aed", auction: "#e11d48",
};

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
          ? <img src={img} alt="" className="w-full h-full object-cover" />
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

  // Filters
  const [city, setCity] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [listingType, setListingType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Data
  const [pins, setPins] = useState<MapPinType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map ↔ list sync
  const [activePinId, setActivePinId] = useState<number | null>(null);
  const [visibleIds, setVisibleIds] = useState<number[]>([]);

  const buildQuery = () => {
    const p = new URLSearchParams();
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
  }, [city, propertyType, listingType, minPrice, maxPrice]);

  useEffect(() => { fetchPins(); }, [fetchPins]);

  // Visible listings = intersection of pins + what's in map viewport
  const visibleSet = new Set(visibleIds);
  const visiblePins = pins.filter(p => visibleSet.has(p.id));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPins();
  };

  const clearFilters = () => {
    setCity(""); setPropertyType(""); setListingType("");
    setMinPrice(""); setMaxPrice("");
  };

  const hasFilters = !!(city || propertyType || listingType || minPrice || maxPrice);

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
          <Button
            size="sm"
            variant="ghost"
            className="text-white/80 hover:bg-white/10 border border-white/20 gap-2"
            onClick={() => setShowFilters(v => !v)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>فلترة</span>
            {hasFilters && (
              <span className="w-4 h-4 rounded-full bg-accent text-white text-[9px] flex items-center justify-center font-bold">
                !
              </span>
            )}
          </Button>
          <Link href={`${BASE()}/listings`}>
            <Button size="sm" variant="ghost" className="text-white/80 hover:bg-white/10 border border-white/20 gap-2">
              <Layers className="w-4 h-4" />
              <span>قائمة</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white border-b border-border px-6 py-4 shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">المدينة</label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="border border-input bg-background rounded-lg px-3 py-2 text-sm h-9 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">كل المدن</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">نوع العقار</label>
              <select
                value={propertyType}
                onChange={e => setPropertyType(e.target.value)}
                className="border border-input bg-background rounded-lg px-3 py-2 text-sm h-9 min-w-[130px] focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">كل الأنواع</option>
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">نوع الإعلان</label>
              <select
                value={listingType}
                onChange={e => setListingType(e.target.value)}
                className="border border-input bg-background rounded-lg px-3 py-2 text-sm h-9 min-w-[130px] focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">الكل</option>
                {LISTING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">السعر من</label>
              <Input
                type="number" placeholder="0" value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                className="h-9 w-28 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">السعر إلى</label>
              <Input
                type="number" placeholder="بلا حد" value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                className="h-9 w-28 text-sm"
              />
            </div>
            <Button type="submit" size="sm" className="h-9 gap-2">
              <Search className="w-3.5 h-3.5" />
              <span>بحث</span>
            </Button>
            {hasFilters && (
              <Button
                type="button" size="sm" variant="ghost"
                className="h-9 text-muted-foreground gap-2"
                onClick={clearFilters}
              >
                <X className="w-3.5 h-3.5" />
                <span>مسح</span>
              </Button>
            )}
          </form>
        </div>
      )}

      {/* Main split layout */}
      <div className="flex" style={{ height: "calc(100vh - 170px)", minHeight: 500 }}>
        {/* Left panel: listing cards */}
        <div
          className="flex-shrink-0 flex flex-col bg-muted/40 border-e border-border"
          style={{ width: 300 }}
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
        <div className="flex-1 relative">
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
            />
          </Suspense>
        </div>
      </div>
    </Layout>
  );
}
