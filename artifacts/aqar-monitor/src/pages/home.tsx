import { useState, useCallback, lazy, Suspense } from "react";
import heroBg from "@/assets/hero-bg.jpg";
import { Layout } from "@/components/layout/layout";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { GuestCTA, UserWelcomeBanner } from "@/components/guest-cta";
import { Link, useLocation } from "wouter";
import { formatCurrency, formatNumber, getImageSrc } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, MapPin, Banknote, TrendingUp, Activity, Search,
  BarChart3, AlertCircle, ArrowLeft, Users, Star, Home as HomeIcon,
  Lightbulb, ChevronDown, X, SlidersHorizontal, RefreshCcw,
  ArrowUpRight, ArrowDownRight, PlusCircle, ChevronLeft,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import type { MapPin as MapPinItem } from "@/components/property-map";
import { SAUDI_REGIONS_LIST, getMuhafazat, getMarakiz, getAhyaa } from "@/lib/saudi-geo";
import { PROPERTY_TYPE_GROUPS } from "@/lib/property-types";
import { LISTING_TYPE_GROUPS } from "@/lib/listing-types";

const PropertyMap = lazy(() => import("@/components/property-map"));

const BASE = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

const COLORS = ["#0F7BA0", "#0F1C3F", "#94A3B8", "#64748B", "#34D399", "#F97316", "#8B5CF6"];

// ── Types ────────────────────────────────────────────────────────────────────

type InsightsData = {
  kpis: {
    totalListings: number; avgPricePerSqm: number; avgPrice: number;
    maxPrice: number; minPrice: number; medianPrice: number;
    p25Price: number; p75Price: number; saleCount: number;
    rentCount: number; investCount: number; listingsWithArea: number;
    turnoverRate: number; areaDataRate: number;
    newLast7Days: number; newLast30Days: number;
  };
  byRegion: Array<{ region: string; count: number; avgPrice: number; avgPricePerSqm: number }>;
  byCity: Array<{ city: string; count: number; avgPrice: number; avgPricePerSqm: number }>;
  byDistrict: Array<{ district: string; city: string; count: number; avgPrice: number; avgPricePerSqm: number }>;
  byPropertyType: Array<{ propertyType: string; count: number; avgPrice: number; avgPricePerSqm: number; percentage: number }>;
  byListingType: Array<{ listingType: string; count: number; avgPrice: number; percentage: number; label: string }>;
  smartInsights: string[];
};

type TrendPoint = { period: string; label: string; count: number; avgPrice: number; avgPricePerSqm: number };
type FilterOptions = { cities: string[]; districts: Array<{ district: string; city: string }>; propertyTypes: string[]; listingTypes: Array<{ value: string; label: string }> };
type Listing = {
  id: number; title: string; city: string; district?: string; price: number;
  areaSqm?: number; pricePerSqm?: number; propertyType: string; listingType: string;
  listingPurpose?: string; bedrooms?: number; bathrooms?: number; images?: string;
  featured?: boolean; status: string; createdAt: string;
};
type Filters = {
  city: string; district: string; propertyType: string; listingType: string;
  minPrice: string; maxPrice: string; minArea: string; maxArea: string;
};

const EMPTY_FILTERS: Filters = {
  city: "", district: "", propertyType: "", listingType: "",
  minPrice: "", maxPrice: "", minArea: "", maxArea: "",
};

// Property type quick-access categories
const PROPERTY_CATEGORIES = [
  { label: "شقق",        value: "شقة",          icon: "🏢" },
  { label: "فلل",        value: "فيلا",          icon: "🏡" },
  { label: "أراضي",      value: "أرض",           icon: "🗺️" },
  { label: "عمارات",     value: "عمارة سكنية",   icon: "🏗️" },
  { label: "مكاتب",      value: "مكتب",          icon: "🏛️" },
  { label: "محلات",      value: "محل تجاري",     icon: "🏬" },
  { label: "استوديو",    value: "استوديو",        icon: "🛋️" },
  { label: "دوبلكس",    value: "دوبلكس",         icon: "🏘️" },
  { label: "شاليهات",   value: "شاليه",          icon: "🌴" },
  { label: "استراحات",  value: "استراحة",        icon: "🏕️" },
  { label: "مستودعات",  value: "مستودع",         icon: "🏭" },
  { label: "مزارع",     value: "مزرعة",          icon: "🌾" },
];

function filtersToQuery(f: Filters) {
  const p = new URLSearchParams();
  if (f.city) p.set("city", f.city);
  if (f.district) p.set("district", f.district);
  if (f.propertyType) p.set("propertyType", f.propertyType);
  if (f.listingType) p.set("listingType", f.listingType);
  if (f.minPrice) p.set("minPrice", f.minPrice);
  if (f.maxPrice) p.set("maxPrice", f.maxPrice);
  if (f.minArea) p.set("minArea", f.minArea);
  if (f.maxArea) p.set("maxArea", f.maxArea);
  return p.toString();
}

function hasActiveFilters(f: Filters) {
  return Object.values(f).some(v => v !== "");
}

// ── Shared animation variants ────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

// ── Reusable UI pieces ────────────────────────────────────────────────────────

function SectionLabel({ eyebrow, title, description, action }: {
  eyebrow: string; title: string; description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <p className="text-xs font-bold tracking-widest text-primary uppercase mb-1.5">{eyebrow}</p>
        <h2 className="text-2xl font-extrabold text-foreground leading-snug">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div className="shrink-0 mt-1">{action}</div>}
    </div>
  );
}

function KpiCard({
  title, value, sub, color, icon, highlight,
}: {
  title: string; value: React.ReactNode; sub?: string;
  color: string; icon: React.ReactNode; highlight?: boolean;
}) {
  return (
    <div
      className={`relative bg-card rounded-[22px] overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-default ${highlight ? "ring-1.5 ring-primary/25" : ""}`}
      style={{
        border: `1.5px solid ${color}20`,
        boxShadow: "0 2px 16px rgba(15,28,63,0.06), 0 1px 4px rgba(15,28,63,0.03)",
      }}
    >
      <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}55)` }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: color + "12" }}
          >
            <span style={{ color }}>{icon}</span>
          </div>
          {highlight && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: color + "15", color }}>
              رئيسي
            </span>
          )}
        </div>
        <div className="text-[1.65rem] font-extrabold text-foreground leading-none mb-2 tabular-nums tracking-tight">{value}</div>
        <div className="text-[12.5px] font-medium text-muted-foreground leading-snug">{title}</div>
        {sub && (
          <div className="text-[11px] text-muted-foreground/80 mt-1.5 font-medium">{sub}</div>
        )}
      </div>
    </div>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  const images = listing.images?.split("\n").filter(Boolean) ?? [];
  const img = getImageSrc(images[0]);
  const isForSale = listing.listingType === "sale";
  return (
    <Link href={`/listings/${listing.id}`}>
      <div className="group bg-card rounded-2xl overflow-hidden border border-border/60 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col">
        <div className="relative h-48 bg-muted overflow-hidden shrink-0">
          {img ? (
            <img src={img} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/8 to-muted">
              <Building2 className="w-10 h-10 text-primary/20" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${isForSale ? "bg-primary text-white" : "bg-accent text-accent-foreground"}`}>
              {isForSale ? "للبيع" : "للإيجار"}
            </span>
          </div>
          {listing.featured && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/40 to-transparent" />
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-foreground text-sm leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors flex-1">{listing.title}</h3>
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-3">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{[listing.city, listing.district].filter(Boolean).join(" — ")}</span>
          </div>
          <div className="mt-auto pt-3 border-t border-border/50">
            {/* السعر + المساحة في صف واحد */}
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[15px] font-extrabold text-foreground min-w-0 truncate">{formatCurrency(listing.price)}</span>
              {listing.areaSqm ? (
                <span className="flex-shrink-0 bg-muted rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground whitespace-nowrap">
                  {formatNumber(listing.areaSqm)} م²
                </span>
              ) : null}
            </div>
            {/* نوع العقار في صف منفصل */}
            {listing.propertyType ? (
              <span className="inline-block bg-primary/8 text-primary rounded-md px-2 py-0.5 text-[10px] font-semibold max-w-full truncate">
                {listing.propertyType}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

const INPUT_CLS = "border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 w-full";

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();

  // Quick search state (hero bar) — منطقة → محافظة → مركز → حي
  const [quickRegion, setQuickRegion]           = useState("");
  const [quickCity, setQuickCity]               = useState("");
  const [quickMarkaz, setQuickMarkaz]           = useState("");
  const [quickDistrict, setQuickDistrict]       = useState("");
  const [quickType, setQuickType]               = useState("");
  const [quickListingType, setQuickListingType] = useState("");

  // Category quick filter (pills)
  const [activeCategory, setActiveCategory] = useState("");

  // Analytics filter state (separate from listings quick-search)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [showAnalyticsFilters, setShowAnalyticsFilters] = useState(false);

  const applyFilters = useCallback(() => setApplied({ ...filters }), [filters]);
  const resetFilters = useCallback(() => { setFilters(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); }, []);

  // Listings filters = category pill OR analytics filter
  const listingsPropertyType = activeCategory || applied.propertyType;
  const listingsQs = (() => {
    const p = new URLSearchParams({ limit: "8", sort: "newest" });
    if (applied.city) p.set("city", applied.city);
    if (applied.district) p.set("district", applied.district);
    if (listingsPropertyType) p.set("propertyType", listingsPropertyType);
    if (applied.listingType) p.set("listingType", applied.listingType);
    if (applied.minPrice) p.set("minPrice", applied.minPrice);
    if (applied.maxPrice) p.set("maxPrice", applied.maxPrice);
    return p.toString();
  })();

  const analyticsQs = filtersToQuery(applied);
  const active = hasActiveFilters(applied);

  const { data: insights, isLoading: loadingInsights } = useQuery<InsightsData>({
    queryKey: ["listings-insights", analyticsQs],
    queryFn: async () => {
      const res = await fetch(`${BASE()}/api/analytics/listings-insights${analyticsQs ? `?${analyticsQs}` : ""}`);
      if (!res.ok) throw new Error("فشل في تحميل البيانات");
      return res.json();
    },
    staleTime: 60_000,
  });

  const { data: trends, isLoading: loadingTrends } = useQuery<TrendPoint[]>({
    queryKey: ["listings-trends", analyticsQs],
    queryFn: async () => {
      const res = await fetch(`${BASE()}/api/analytics/listings-trends${analyticsQs ? `?${analyticsQs}` : ""}`);
      if (!res.ok) throw new Error("فشل");
      return res.json();
    },
    staleTime: 60_000,
  });

  const { data: filterOpts } = useQuery<FilterOptions>({
    queryKey: ["listings-filter-options"],
    queryFn: async () => {
      const res = await fetch(`${BASE()}/api/analytics/listings-filter-options`);
      if (!res.ok) throw new Error("فشل");
      return res.json();
    },
    staleTime: 300_000,
  });

  const { data: listingsData, isLoading: loadingListings } = useQuery<{ data: Listing[]; total: number }>({
    queryKey: ["home-listings", listingsQs],
    queryFn: async () => {
      const res = await fetch(`${BASE()}/api/listings?${listingsQs}`);
      if (!res.ok) throw new Error("فشل");
      return res.json();
    },
    staleTime: 60_000,
  });

  // Map filters
  const [mapRegion, setMapRegion]           = useState("");
  const [mapCity, setMapCity]               = useState("");
  const [mapListingType, setMapListingType] = useState("");
  const [mapPropertyType, setMapPropertyType] = useState("");

  const mapHasFilters = !!(mapRegion || mapCity || mapListingType || mapPropertyType);

  // Map pins — individual property markers
  const { data: mapPinsData } = useQuery<{ pins: MapPinItem[] }>({
    queryKey: ["home-map-pins", mapRegion, mapCity, mapListingType, mapPropertyType],
    queryFn: async () => {
      const p = new URLSearchParams({ limit: "300" });
      if (mapRegion) p.set("region", mapRegion);
      if (mapCity) p.set("city", mapCity);
      if (mapListingType) p.set("listingType", mapListingType);
      if (mapPropertyType) p.set("propertyType", mapPropertyType);
      const res = await fetch(`${BASE()}/api/listings/map-pins?${p}`);
      if (!res.ok) throw new Error("فشل");
      return res.json();
    },
    staleTime: 120_000,
  });
  const mapPins: MapPinItem[] = mapPinsData?.pins ?? [];

  const kpis = insights?.kpis;
  const hasData = (kpis?.totalListings ?? 0) > 0;

  // ── Derived market analytics ──────────────────────────────────────────────
  const mkt_avgP   = kpis?.avgPrice ?? 0;
  const mkt_medP   = kpis?.medianPrice ?? 0;
  const mkt_new7   = kpis?.newLast7Days ?? 0;
  const mkt_new30  = kpis?.newLast30Days ?? 0;
  const mkt_tot    = kpis?.totalListings ?? 0;
  const mkt_saleC  = kpis?.saleCount ?? 0;

  // ميل توزيع الأسعار: هل المتوسط مشدود للأعلى بسبب إعلانات غالية؟ (skewness)
  const mkt_skewRatio  = mkt_medP > 0 ? mkt_avgP / mkt_medP : 1;
  const mkt_fairLabel  = mkt_skewRatio > 1.20 ? "يميل للغالي" : mkt_skewRatio > 1.05 ? "ميل طفيف" : "موزع بانتظام";
  const mkt_fairColor  = mkt_skewRatio > 1.20 ? "#F59E0B" : mkt_skewRatio > 1.05 ? "#0F7BA0" : "#22C55E";
  const mkt_fairBg     = mkt_skewRatio > 1.20 ? "rgba(245,158,11,0.07)" : mkt_skewRatio > 1.05 ? "rgba(15,123,160,0.07)" : "rgba(34,197,94,0.07)";
  const mkt_fairRatio  = mkt_skewRatio; // للتوافق مع الكود القديم

  const weeklyRate      = mkt_new30 > 0 ? mkt_new30 / 4 : 0;
  const mkt_demandRate  = weeklyRate > 0 ? mkt_new7 / weeklyRate : 0;
  // نشاط الإعلانات الأسبوعي (ليس "طلب" — نقيس حركة العرض فقط)
  const mkt_demandLabel = mkt_demandRate > 1.2 ? "نشاط مرتفع" : mkt_demandRate < 0.8 ? "نشاط هادئ" : "نشاط عادي";
  const mkt_demandColor = mkt_demandRate > 1.2 ? "#22C55E" : mkt_demandRate < 0.8 ? "#F59E0B" : "#0F7BA0";

  // نسب فئات الصفقات (بيع / إيجار / استثمار)
  const mkt_investC    = kpis?.investCount ?? 0;
  const mkt_saleRatio  = mkt_tot > 0 ? Math.round((mkt_saleC  / mkt_tot) * 100) : 0;
  const mkt_rentRatio  = mkt_tot > 0 ? Math.round(((kpis?.rentCount ?? 0) / mkt_tot) * 100) : 0;
  const mkt_investRatio= mkt_tot > 0 ? Math.round((mkt_investC / mkt_tot) * 100) : 0;

  // معدل دوران السوق: نسبة الإعلانات الجديدة من الإجمالي
  const mkt_turnoverRate  = kpis?.turnoverRate ?? (mkt_tot > 0 ? Math.round((mkt_new30 / mkt_tot) * 100) : 0);
  const mkt_supplyTrend   = mkt_turnoverRate > 30 ? "سوق متحرك" : mkt_turnoverRate > 10 ? "نشاط معتدل" : "سوق هادئ";
  const mkt_supplyColor   = mkt_turnoverRate > 30 ? "#22C55E" : mkt_turnoverRate > 10 ? "#0F7BA0" : "#F59E0B";

  const filteredDistricts = applied.city
    ? (filterOpts?.districts ?? []).filter(d => d.city === applied.city)
    : (filterOpts?.districts ?? []);

  // Derived lists — التسلسل الإداري: منطقة → محافظة → مركز → حي
  const muhafazatForRegion: string[] = getMuhafazat(quickRegion);
  const marakizForMuhafaza: string[] = getMarakiz(quickRegion, quickCity);
  const ahyaaForMarkaz: string[]     = getAhyaa(quickRegion, quickCity, quickMarkaz);

  // Quick search → navigate to /listings with params
  const handleQuickSearch = () => {
    const p = new URLSearchParams();
    if (quickRegion)  p.set("region",  quickRegion);
    if (quickCity)    p.set("city",    quickCity);
    if (quickMarkaz)  p.set("markaz",  quickMarkaz);
    if (quickDistrict) p.set("district", quickDistrict);
    if (quickType) p.set("propertyType", quickType);
    if (quickListingType) p.set("listingType", quickListingType);
    navigate(`/listings${p.toString() ? `?${p.toString()}` : ""}`);
  };

  return (
    <Layout>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-14 pb-16">

        {/* ══════════════════════════════════════════════════════════════
            HERO — Ultra Premium Saudi Real Estate Platform
        ══════════════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp}>
          <div
            className="relative rounded-[2rem] overflow-hidden text-white"
            style={{
              minHeight: 520,
              boxShadow: "0 40px 100px rgba(6,18,32,0.65), 0 8px 32px rgba(6,18,32,0.40)",
            }}
          >
            {/* Background image — flipped for RTL (skyline on left, open space on right for text) */}
            <img
              src={heroBg}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none"
              style={{ transform: "scaleX(-1)" }}
              draggable={false}
            />

            {/* ── Gradient overlays (RTL-optimised) ── */}
            {/* Main: deep dark on right (text area) → transparent left (show image) */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(to left, rgba(5,14,27,0.96) 0%, rgba(5,14,27,0.82) 32%, rgba(5,14,27,0.45) 60%, rgba(5,14,27,0.08) 100%)" }}
            />
            {/* Bottom vignette for search bar readability */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(to top, rgba(5,14,27,0.90) 0%, rgba(5,14,27,0.35) 28%, transparent 55%)" }}
            />
            {/* Top vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(to bottom, rgba(5,14,27,0.60) 0%, transparent 28%)" }}
            />
            {/* Teal glow accent — left center where skyline shows */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 55% 70% at 18% 45%, rgba(15,123,160,0.22) 0%, transparent 70%)" }}
            />
            {/* Warm golden accent from the sunset on the image */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 40% 35% at 12% 20%, rgba(234,179,8,0.10) 0%, transparent 70%)" }}
            />

            {/* ── Floating ambient glass cards ── */}
            {/* Top-left: price per sqm — 3 key regions */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="absolute top-6 left-7 hidden lg:flex flex-col gap-0 rounded-2xl px-4 py-3 pointer-events-none w-60"
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.16)",
                backdropFilter: "blur(14px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.30)",
              }}
            >
              {/* عنوان البطاقة */}
              <div className="flex items-center gap-2 mb-2.5 pb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="w-6 h-6 rounded-lg bg-cyan-400/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-300" />
                </div>
                <p className="text-[10px] text-white/70 font-bold tracking-wide">متوسط سعر المتر² / م²</p>
              </div>
              {/* الرياض */}
              {(() => {
                const city = insights?.byCity?.find(c => c.city === "الرياض");
                const psm = city?.avgPricePerSqm ?? 0;
                return (
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[11px] text-white/80 font-medium">الرياض</span>
                    <span className="text-[12px] font-black text-white tabular-nums">
                      {psm > 0 ? formatCurrency(psm) : "—"}
                    </span>
                  </div>
                );
              })()}
              {/* جدة */}
              {(() => {
                const city = insights?.byCity?.find(c => c.city === "جدة");
                const psm = city?.avgPricePerSqm ?? 0;
                return (
                  <div className="flex items-center justify-between py-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                    <span className="text-[11px] text-white/80 font-medium">جدة</span>
                    <span className="text-[12px] font-black text-white tabular-nums">
                      {psm > 0 ? formatCurrency(psm) : "—"}
                    </span>
                  </div>
                );
              })()}
              {/* المنطقة الشرقية */}
              {(() => {
                const reg = insights?.byRegion?.find(r => r.region === "المنطقة الشرقية");
                const psm = reg?.avgPricePerSqm ?? 0;
                return (
                  <div className="flex items-center justify-between py-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                    <span className="text-[11px] text-white/80 font-medium">المنطقة الشرقية</span>
                    <span className="text-[12px] font-black text-white tabular-nums">
                      {psm > 0 ? formatCurrency(psm) : "—"}
                    </span>
                  </div>
                );
              })()}
            </motion.div>

            {/* Bottom-left: live listings count */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="absolute bottom-28 left-7 hidden xl:flex flex-col gap-1 rounded-2xl px-4 py-4 pointer-events-none w-44"
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.16)",
                backdropFilter: "blur(14px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.30)",
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                <span className="text-[10px] text-white/55 font-medium tracking-wide">إعلانات مباشرة</span>
              </div>
              <p className="text-3xl font-black text-white leading-none">{kpis ? formatNumber(kpis.totalListings) : "—"}</p>
              <p className="text-[10px] text-white/50 mt-0.5">عقار متاح الآن</p>
            </motion.div>

            {/* Bottom-left-2: this month listings */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="absolute bottom-28 left-56 hidden xl:flex flex-col gap-1 rounded-2xl px-4 py-4 pointer-events-none w-44"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.13)",
                backdropFilter: "blur(14px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Activity className="w-3 h-3 text-cyan-300 flex-shrink-0" />
                <span className="text-[10px] text-white/55 font-medium tracking-wide">هذا الشهر</span>
              </div>
              <p className="text-3xl font-black text-white leading-none">{kpis ? formatNumber(kpis.newLast30Days) : "—"}</p>
              <p className="text-[10px] text-white/50 mt-0.5">إعلان جديد</p>
            </motion.div>

            {/* Main content */}
            <div className="relative px-6 py-14 md:px-14 md:py-16">
              {/* Eyebrow badge */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="inline-flex items-center gap-2 text-white/90 px-4 py-1.5 rounded-full text-[13px] font-semibold mb-6"
                style={{
                  background: "rgba(15,123,160,0.25)",
                  border: "1px solid rgba(15,123,160,0.45)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <BarChart3 className="w-3.5 h-3.5 text-cyan-300" />
                عقار إنسايت · منصة العقارات الذكية
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, type: "spring", stiffness: 200 }}
                className="text-[2.6rem] md:text-[3.5rem] font-extrabold leading-[1.05] tracking-tight mb-5 text-white max-w-2xl"
              >
                خذ القرار الصح
                <br />
                <span style={{ color: "#94C7DC" }}>في عقارك</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="text-[16px] md:text-[17px] leading-relaxed mb-8 max-w-xl font-medium"
                style={{ color: "rgba(255,255,255,0.72)" }}
              >
                قارن الأسعار في مئات الأحياء، تابع المشاريع المستقبلية، وتواصل مع أفضل المسوّقين
              </motion.p>

              {/* Search bar — two-row layout */}
              <div
                className="backdrop-blur-xl border rounded-2xl p-3 md:p-4 flex flex-col gap-2.5 max-w-3xl mb-6"
                style={{
                  background: "rgba(5,14,27,0.55)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              >
                {/* Row 1 — Location: المنطقة → المحافظة → المركز → الحي */}
                <div className="flex flex-col md:flex-row gap-2.5">
                  {/* المنطقة */}
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-[11px] font-bold text-white px-1 tracking-wider drop-shadow">المنطقة</span>
                    <select
                      value={quickRegion}
                      onChange={e => {
                        setQuickRegion(e.target.value);
                        setQuickCity("");
                        setQuickMarkaz("");
                        setQuickDistrict("");
                      }}
                      className="bg-white/15 border border-white/20 rounded-xl px-3 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-white/35 w-full cursor-pointer"
                      style={{ color: "white" }}
                    >
                      <option value="" style={{ color: "#0F1C3F" }}>كل المناطق</option>
                      {SAUDI_REGIONS_LIST.map(r => (
                        <option key={r} value={r} style={{ color: "#0F1C3F" }}>{r}</option>
                      ))}
                    </select>
                  </div>

                  {/* المحافظة */}
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-[11px] font-bold text-white px-1 tracking-wider drop-shadow">المحافظة</span>
                    <select
                      value={quickCity}
                      onChange={e => {
                        setQuickCity(e.target.value);
                        setQuickMarkaz("");
                        setQuickDistrict("");
                      }}
                      disabled={!quickRegion}
                      className="bg-white/15 border border-white/20 rounded-xl px-3 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-white/35 w-full cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                      style={{ color: "white" }}
                    >
                      <option value="" style={{ color: "#0F1C3F" }}>
                        {quickRegion ? "كل المحافظات" : "اختر المنطقة أولاً"}
                      </option>
                      {muhafazatForRegion.map(m => (
                        <option key={m} value={m} style={{ color: "#0F1C3F" }}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* المركز */}
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-[11px] font-bold text-white px-1 tracking-wider drop-shadow">المركز</span>
                    <select
                      value={quickMarkaz}
                      onChange={e => {
                        setQuickMarkaz(e.target.value);
                        setQuickDistrict("");
                      }}
                      disabled={!quickCity || marakizForMuhafaza.length === 0}
                      className="bg-white/15 border border-white/20 rounded-xl px-3 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-white/35 w-full cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                      style={{ color: "white" }}
                    >
                      <option value="" style={{ color: "#0F1C3F" }}>
                        {!quickCity ? "اختر المحافظة أولاً" : "كل المراكز"}
                      </option>
                      {marakizForMuhafaza.map(m => (
                        <option key={m} value={m} style={{ color: "#0F1C3F" }}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* الحي */}
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-[11px] font-bold text-white px-1 tracking-wider drop-shadow">الحي</span>
                    <select
                      value={quickDistrict}
                      onChange={e => setQuickDistrict(e.target.value)}
                      disabled={!quickCity || ahyaaForMarkaz.length === 0}
                      className="bg-white/15 border border-white/20 rounded-xl px-3 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-white/35 w-full cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                      style={{ color: "white" }}
                    >
                      <option value="" style={{ color: "#0F1C3F" }}>
                        {!quickCity ? "اختر المحافظة أولاً" : ahyaaForMarkaz.length === 0 ? "أدخل المركز" : "كل الأحياء"}
                      </option>
                      {ahyaaForMarkaz.map(h => (
                        <option key={h} value={h} style={{ color: "#0F1C3F" }}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2 — Type + Search button */}
                <div className="flex flex-col md:flex-row gap-2.5">
                  {/* نوع العقار */}
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-[11px] font-bold text-white px-1 tracking-wider drop-shadow">نوع العقار</span>
                    <select
                      value={quickType}
                      onChange={e => setQuickType(e.target.value)}
                      className="bg-white/15 border border-white/20 rounded-xl px-3 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-white/35 w-full cursor-pointer"
                      style={{ color: "white" }}
                    >
                      <option value="" style={{ color: "#0F1C3F" }}>كل أنواع العقارات</option>
                      {PROPERTY_TYPE_GROUPS.map(g => (
                        <optgroup key={g.label} label={`── ${g.label}`}>
                          {g.types.map(t => (
                            <option key={t} value={t} style={{ color: "#0F1C3F" }}>{t}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* بيع / إيجار */}
                  <div className="flex flex-col gap-1 md:w-36 shrink-0">
                    <span className="text-[11px] font-bold text-white px-1 tracking-wider drop-shadow">نوع الصفقة</span>
                    <select
                      value={quickListingType}
                      onChange={e => setQuickListingType(e.target.value)}
                      className="bg-white/15 border border-white/20 rounded-xl px-3 py-3 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-white/35 w-full cursor-pointer"
                      style={{ color: "white" }}
                    >
                      <option value="" style={{ color: "#0F1C3F" }}>كل الصفقات</option>
                      {LISTING_TYPE_GROUPS.map(g => (
                        <optgroup key={g.label} label={`── ${g.label}`}>
                          {g.types.map(t => (
                            <option key={t.value} value={t.value} style={{ color: "#0F1C3F" }}>{t.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* زر البحث */}
                  <div className="flex flex-col gap-1 justify-end md:w-28 shrink-0">
                    <span className="text-[10px] font-bold text-white/0 px-1 tracking-wider select-none">.</span>
                    <button
                      onClick={handleQuickSearch}
                      className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white w-full py-3 rounded-xl font-bold text-sm transition-all"
                      style={{ boxShadow: "0 4px 18px rgba(15,123,160,0.55)" }}
                    >
                      <Search className="w-4 h-4" />
                      بحث
                    </button>
                  </div>
                </div>
              </div>

              {/* CTA row */}
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/listings/new">
                  <button
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm text-white border border-[#94A3B8]/60 bg-[#94A3B8]/15 hover:bg-[#94A3B8]/25 transition-all"
                    style={{ boxShadow: "0 2px 12px rgba(201,168,76,0.2)" }}
                  >
                    <PlusCircle className="w-4 h-4 text-[#94A3B8]" />
                    أضف عقارك الآن
                  </button>
                </Link>
                <Link href="/listings">
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white/75 hover:text-white transition-colors">
                    تصفح جميع العقارات
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </Link>
              </div>

              {/* Stats strip */}
              {hasData && (
                <div className="hidden md:flex items-center gap-8 mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                  {[
                    { label: "إعلان نشط", value: formatNumber(kpis?.totalListings), icon: Building2 },
                    { label: "متوسط سعر المتر", value: formatCurrency(kpis?.avgPricePerSqm), icon: Banknote },
                    { label: "إعلانات هذا الشهر", value: formatNumber(kpis?.newLast30Days), icon: Activity },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(15,123,160,0.20)", border: "1px solid rgba(15,123,160,0.30)" }}>
                        <s.icon className="w-4 h-4 text-cyan-300" />
                      </div>
                      <div>
                        <div className="text-lg font-extrabold text-white leading-none">{s.value}</div>
                        <div className="text-[11px] text-white/55 mt-0.5">{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            CATEGORY QUICK-ACCESS PILLS
        ══════════════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp}>
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={() => setActiveCategory("")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold border transition-all duration-200 ${
                activeCategory === ""
                  ? "bg-primary text-white border-primary shadow-sm shadow-primary/25"
                  : "bg-card text-muted-foreground border-border/60 hover:border-primary/30 hover:text-primary"
              }`}
            >
              الكل
            </button>
            {PROPERTY_CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(prev => prev === cat.value ? "" : cat.value)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold border transition-all duration-200 ${
                  activeCategory === cat.value
                    ? "bg-primary text-white border-primary shadow-sm shadow-primary/25"
                    : "bg-card text-muted-foreground border-border/60 hover:border-primary/30 hover:text-primary"
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
            <div className="mr-auto">
              <Link href="/listings/new">
                <button className="inline-flex items-center gap-2 bg-sidebar text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:opacity-90 transition-all">
                  <PlusCircle className="w-4 h-4" />
                  أضف إعلانك
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            LISTINGS SHOWCASE — PRIMARY CONTENT
        ══════════════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp}>
          <SectionLabel
            eyebrow={activeCategory ? `عقارات: ${activeCategory}` : (active ? "نتائج البحث" : "أحدث الإعلانات")}
            title={activeCategory ? `إعلانات ${activeCategory}` : (active ? "الإعلانات المطابقة لبحثك" : "أحدث العقارات على المنصة")}
            description={active || activeCategory ? "الإعلانات التي تطابق معايير الفلتر الحالي" : "أحدث الإعلانات العقارية المضافة — يتم التحديث تلقائياً"}
            action={
              <Link href={`/listings${listingsPropertyType ? `?propertyType=${encodeURIComponent(listingsPropertyType)}` : ""}`}>
                <button className="flex items-center gap-1.5 text-primary font-bold text-[13px] hover:underline underline-offset-2">
                  عرض الكل <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </Link>
            }
          />

          {loadingListings ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-border/60 bg-card">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-4 space-y-2.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-5 w-1/3 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (listingsData?.data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 bg-card rounded-3xl border border-dashed border-border/60">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl border border-primary/15 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary/40" />
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-foreground mb-1">لا توجد إعلانات {activeCategory ? `لـ "${activeCategory}"` : ""}بعد</p>
                <p className="text-sm text-muted-foreground">كن أول من ينشر إعلاناً على المنصة</p>
              </div>
              {(active || activeCategory) && (
                <button onClick={() => { resetFilters(); setActiveCategory(""); }} className="text-primary text-sm font-bold hover:underline">
                  عرض جميع الإعلانات
                </button>
              )}
              <Link href="/listings/new">
                <button className="mt-1 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-all">
                  أضف أول إعلان
                </button>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {(listingsData?.data ?? []).map(listing => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              {(listingsData?.total ?? 0) > 8 && (
                <div className="mt-8 text-center">
                  <Link href={`/listings${listingsPropertyType ? `?propertyType=${encodeURIComponent(listingsPropertyType)}` : ""}`}>
                    <button className="inline-flex items-center gap-2 border border-primary/30 text-primary font-bold px-8 py-3 rounded-2xl hover:bg-primary/5 transition-all text-sm">
                      عرض جميع الإعلانات ({formatNumber(listingsData?.total ?? 0)})
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            INTERACTIVE MAP — individual property pins
        ══════════════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp}>
          <SectionLabel
            eyebrow="استكشاف جغرافي"
            title="العقارات على الخريطة"
            description="انقر على أي عقار للاطلاع على التفاصيل — تعمل مع بيانات حقيقية"
            action={
              <Link href="/map">
                <Button size="sm" variant="outline" className="gap-2 rounded-xl border-primary/30 text-primary hover:bg-primary/5">
                  <span>فتح الخريطة الكاملة</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
              </Link>
            }
          />
          <Card className="rounded-2xl overflow-hidden border-border/60 shadow-sm">
            {/* Map filter bar */}
            <div className="px-4 py-3 border-b border-border/60 bg-muted/30 flex flex-wrap items-end gap-3">
              <div className="flex items-center gap-2 me-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">فلترة الخريطة</span>
                {mapHasFilters && (
                  <span className="text-[10px] px-1.5 py-0 h-4 inline-flex items-center rounded-full bg-primary/10 text-primary font-bold">
                    {[mapRegion, mapCity, mapListingType, mapPropertyType].filter(Boolean).length} نشط
                  </span>
                )}
              </div>

              {/* المنطقة */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] text-muted-foreground">المنطقة</label>
                <select
                  value={mapRegion}
                  onChange={e => { setMapRegion(e.target.value); setMapCity(""); }}
                  className="border border-input bg-background rounded-lg px-2.5 text-xs h-7 min-w-[110px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">كل المناطق</option>
                  {SAUDI_REGIONS_LIST.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* المحافظة */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] text-muted-foreground">المحافظة</label>
                <select
                  value={mapCity}
                  onChange={e => setMapCity(e.target.value)}
                  disabled={!mapRegion}
                  className="border border-input bg-background rounded-lg px-2.5 text-xs h-7 min-w-[110px] focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-40"
                >
                  <option value="">{mapRegion ? "كل المحافظات" : "— اختر منطقة"}</option>
                  {getMuhafazat(mapRegion).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* نوع الإعلان */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] text-muted-foreground">نوع الإعلان</label>
                <select
                  value={mapListingType}
                  onChange={e => setMapListingType(e.target.value)}
                  className="border border-input bg-background rounded-lg px-2.5 text-xs h-7 min-w-[110px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">الكل</option>
                  {LISTING_TYPE_GROUPS.map(g => (
                    <optgroup key={g.label} label={`── ${g.label}`}>
                      {g.types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* نوع العقار */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] text-muted-foreground">نوع العقار</label>
                <select
                  value={mapPropertyType}
                  onChange={e => setMapPropertyType(e.target.value)}
                  className="border border-input bg-background rounded-lg px-2.5 text-xs h-7 min-w-[110px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">كل الأنواع</option>
                  {PROPERTY_TYPE_GROUPS.map(g => (
                    <optgroup key={g.label} label={`── ${g.label}`}>
                      {g.types.map(t => <option key={t} value={t}>{t}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>

              {mapHasFilters && (
                <button
                  onClick={() => { setMapRegion(""); setMapCity(""); setMapListingType(""); setMapPropertyType(""); }}
                  className="h-7 px-2.5 text-[11px] text-muted-foreground hover:text-destructive border border-border rounded-lg flex items-center gap-1 self-end transition-colors"
                >
                  <X className="w-3 h-3" />
                  مسح
                </button>
              )}

              <div className="flex-1" />
              <span className="text-[11px] text-muted-foreground self-end">
                {mapPins.length} عقار
              </span>
            </div>

            <CardContent className="p-0">
              <Suspense fallback={<Skeleton className="w-full h-[440px] rounded-none" />}>
                <PropertyMap
                  pins={mapPins}
                  onPinClick={id => navigate(`/listings/${id}`)}
                  height={440}
                />
              </Suspense>
            </CardContent>
          </Card>
          {mapPins.length === 0 && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              جارٍ تحميل مواقع العقارات…
            </p>
          )}
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            PLATFORM CTA CARDS
        ══════════════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp}>
          {isAuthenticated && user ? (
            <UserWelcomeBanner fullName={user.fullName ?? user.username} />
          ) : (
            <GuestCTA />
          )}
        </motion.div>

        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/listings/new">
              <div className="bg-sidebar rounded-2xl p-7 text-white cursor-pointer hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(15,123,160,0.3),transparent_70%)] pointer-events-none" />
                <div className="relative">
                  <Building2 className="w-8 h-8 mb-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                  <h3 className="font-bold text-lg mb-1.5">أضف عقارك</h3>
                  <p className="text-[13px] text-white/80 mb-4">انشر إعلانك واعرضه على المهتمين والباحثين عن عقار</p>
                  <div className="flex items-center gap-1.5 text-[13px] font-bold text-white/90 group-hover:text-white transition-colors">
                    ابدأ الآن <ArrowLeft className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/marketers">
              <div className="bg-gradient-to-br from-accent/80 to-accent/50 rounded-2xl p-7 text-white cursor-pointer hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_70%)] pointer-events-none" />
                <div className="relative">
                  <Users className="w-8 h-8 mb-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                  <h3 className="font-bold text-lg mb-1.5">المسوّقون العقاريون</h3>
                  <p className="text-[13px] text-white/85 mb-4">تصفّح ملفات المسوّقين العقاريين المسجّلين وتواصل معهم مباشرةً</p>
                  <div className="flex items-center gap-1.5 text-[13px] font-bold text-white/90">
                    استعرض الملفات <ArrowLeft className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/requests/new">
              <div className="bg-gradient-to-br from-primary to-primary/70 rounded-2xl p-7 text-white cursor-pointer hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none" />
                <div className="relative">
                  <Search className="w-8 h-8 mb-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                  <h3 className="font-bold text-lg mb-1.5">اطلب عقاراً</h3>
                  <p className="text-[13px] text-white/85 mb-4">أخبرنا عن احتياجك وسنجد لك أفضل الخيارات المتاحة</p>
                  <div className="flex items-center gap-1.5 text-[13px] font-bold text-white/90">
                    قدّم طلبك <ArrowLeft className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            MARKET INSIGHTS — Supporting layer
        ══════════════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp}>
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-bold tracking-widest text-primary uppercase mb-1.5">ذكاء السوق</p>
              <h2 className="text-2xl font-extrabold text-foreground leading-snug">مؤشرات السوق العقاري</h2>
              <p className="text-sm text-muted-foreground mt-1">مبنية حصراً على الإعلانات الحقيقية المنشورة داخل المنصة</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 mt-1">
              {active && <Badge variant="outline" className="text-primary border-primary/30 font-bold text-xs">نتائج مفلترة</Badge>}
              <button
                onClick={() => setShowAnalyticsFilters(v => !v)}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-primary border border-border rounded-xl px-3 py-2 transition-all"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                فلترة
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAnalyticsFilters ? "rotate-180" : ""}`} />
              </button>
              {active && (
                <button onClick={resetFilters} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive border border-border rounded-xl px-3 py-2 transition-all">
                  <X className="w-3 h-3" /> إعادة ضبط
                </button>
              )}
            </div>
          </div>

          {/* Analytics filter panel */}
          <AnimatePresence>
            {showAnalyticsFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="overflow-hidden mb-6"
              >
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <select value={filters.city}
                      onChange={e => setFilters(f => ({ ...f, city: e.target.value, district: "" }))}
                      className={INPUT_CLS}>
                      <option value="">كل المدن</option>
                      {(filterOpts?.cities ?? []).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={filters.district}
                      onChange={e => setFilters(f => ({ ...f, district: e.target.value }))}
                      className={INPUT_CLS}>
                      <option value="">كل الأحياء</option>
                      {filteredDistricts.map(d => <option key={d.district} value={d.district}>{d.district}</option>)}
                    </select>
                    <select value={filters.propertyType}
                      onChange={e => setFilters(f => ({ ...f, propertyType: e.target.value }))}
                      className={INPUT_CLS}>
                      <option value="">كل الأنواع</option>
                      {(filterOpts?.propertyTypes ?? []).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select value={filters.listingType}
                      onChange={e => setFilters(f => ({ ...f, listingType: e.target.value }))}
                      className={INPUT_CLS}>
                      <option value="">كل الصفقات</option>
                      {LISTING_TYPE_GROUPS.map(g => (
                        <optgroup key={g.label} label={`── ${g.label}`}>
                          {g.types.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <input type="number" placeholder="أقل سعر (ر.س)" value={filters.minPrice}
                      onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))} className={INPUT_CLS} />
                    <input type="number" placeholder="أعلى سعر (ر.س)" value={filters.maxPrice}
                      onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))} className={INPUT_CLS} />
                    <input type="number" placeholder="أقل مساحة (م²)" value={filters.minArea}
                      onChange={e => setFilters(f => ({ ...f, minArea: e.target.value }))} className={INPUT_CLS} />
                    <input type="number" placeholder="أعلى مساحة (م²)" value={filters.maxArea}
                      onChange={e => setFilters(f => ({ ...f, maxArea: e.target.value }))} className={INPUT_CLS} />
                  </div>
                  <button onClick={applyFilters}
                    className="bg-primary hover:bg-primary/90 text-white px-7 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm shadow-primary/20">
                    تطبيق الفلتر
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Market Insights Dashboard ─────────────────────────────── */}
          {!hasData && !loadingInsights ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3 bg-card rounded-2xl border border-dashed border-border/60">
              <BarChart3 className="w-12 h-12 opacity-20" />
              <p className="text-base font-semibold">لا توجد إعلانات نشطة حالياً</p>
              <p className="text-sm opacity-70">ستظهر المؤشرات تلقائياً فور نشر الإعلانات الأولى</p>
              <Link href="/listings/new">
                <button className="mt-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-all">
                  أضف أول إعلان
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">

              {/* ── A: نظرة عامة على السوق ───────────────────────────── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  <span className="text-sm font-extrabold text-foreground">أ — نظرة عامة على السوق</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <KpiCard highlight icon={<Building2 className="w-5 h-5" />} title="إجمالي الإعلانات النشطة" color="#0F7BA0"
                    value={loadingInsights ? <Skeleton className="h-8 w-16" /> : formatNumber(kpis?.totalListings)}
                    sub="إعلان مدرج حالياً في المنصة" />
                  <KpiCard icon={<Banknote className="w-5 h-5" />} title="متوسط سعر العقار" color="#94A3B8"
                    value={loadingInsights ? <Skeleton className="h-8 w-24" /> : formatCurrency(kpis?.avgPrice)}
                    sub={mkt_new30 > 0 ? `↑ ${mkt_new30} إعلان جديد هذا الشهر` : "متوسط إجمالي للسوق"} />
                  <KpiCard icon={<TrendingUp className="w-5 h-5" />} title="الوسيط السعري" color="#0F1C3F"
                    value={loadingInsights ? <Skeleton className="h-8 w-24" /> : formatCurrency(kpis?.medianPrice)}
                    sub="50% من العقارات أقل من هذا السعر" />
                  <KpiCard icon={<Activity className="w-5 h-5" />} title="متوسط سعر المتر" color="#34D399"
                    value={loadingInsights ? <Skeleton className="h-8 w-24" /> : formatCurrency(kpis?.avgPricePerSqm)}
                    sub="ريال سعودي / م²" />
                </div>
              </div>

              {/* ── B: ذكاء الأسعار ─────────────────────────────────── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-5 rounded-full" style={{ background: "#94A3B8" }} />
                  <span className="text-sm font-extrabold text-foreground">ب — ذكاء الأسعار</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* ميل توزيع الأسعار — بديل "القيمة العادلة" المضلل */}
                  <div className="bg-card rounded-[22px] border border-border/60 p-5 shadow-sm hover:-translate-y-0.5 transition-transform duration-300" style={{ borderColor: mkt_fairColor + "30" }}>
                    <div className="h-[3px] w-full rounded-full mb-4" style={{ background: `linear-gradient(90deg, ${mkt_fairColor}, ${mkt_fairColor}44)` }} />
                    <p className="text-[12px] text-muted-foreground mb-2">ميل توزيع الأسعار</p>
                    <div className="text-2xl font-extrabold mb-1" style={{ color: mkt_fairColor }}>
                      {loadingInsights ? <Skeleton className="h-7 w-24" /> : mkt_fairLabel}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      {loadingInsights ? <Skeleton className="h-3 w-32" /> :
                        mkt_skewRatio > 1.20
                          ? `المتوسط أعلى من الوسيط بـ ${Math.round((mkt_skewRatio - 1) * 100)}% — إعلانات غالية تشد المتوسط للأعلى`
                          : `المتوسط والوسيط متقاربان — توزيع متجانس`}
                    </p>
                  </div>

                  {/* Price Distribution */}
                  <div className="bg-card rounded-[22px] border border-border/60 p-5 shadow-sm hover:-translate-y-0.5 transition-transform duration-300">
                    <div className="h-[3px] w-full rounded-full mb-4" style={{ background: "linear-gradient(90deg, #94A3B8, #94A3B844)" }} />
                    <p className="text-[12px] text-muted-foreground mb-2">نطاق الأسعار (ر.س)</p>
                    {(kpis?.p25Price ?? 0) > 0 ? (
                      <>
                        <div className="text-[11px] text-muted-foreground">الشريحة المنخفضة</div>
                        <div className="text-base font-bold text-foreground mb-1.5">{loadingInsights ? <Skeleton className="h-5 w-24" /> : formatCurrency(kpis?.p25Price)}</div>
                        <div className="text-[11px] text-muted-foreground">الشريحة العالية</div>
                        <div className="text-base font-bold" style={{ color: "#94A3B8" }}>{loadingInsights ? <Skeleton className="h-5 w-24" /> : formatCurrency(kpis?.p75Price)}</div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-3">سيظهر التوزيع مع تراكم الإعلانات</p>
                    )}
                  </div>

                  {/* Max / Min */}
                  <div className="bg-card rounded-[22px] border border-border/60 p-5 shadow-sm hover:-translate-y-0.5 transition-transform duration-300">
                    <div className="h-[3px] w-full rounded-full mb-4" style={{ background: "linear-gradient(90deg, #F97316, #F9731644)" }} />
                    <p className="text-[12px] text-muted-foreground mb-3">نطاق إعلانات السوق</p>
                    <div className="flex items-center gap-1.5 mb-1">
                      <ArrowUpRight className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <div className="text-sm font-bold text-foreground">{loadingInsights ? <Skeleton className="h-4 w-20" /> : formatCurrency(kpis?.maxPrice)}</div>
                    </div>
                    <div className="text-[11px] text-muted-foreground mb-3">أعلى سعر مدرج</div>
                    <div className="flex items-center gap-1.5">
                      <ArrowDownRight className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      <div className="text-sm font-bold text-foreground">{loadingInsights ? <Skeleton className="h-4 w-20" /> : formatCurrency(kpis?.minPrice)}</div>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">أدنى سعر مدرج</div>
                  </div>

                  {/* توزيع الصفقات: بيع / إيجار / استثماري */}
                  <div className="bg-card rounded-[22px] border border-border/60 p-5 shadow-sm hover:-translate-y-0.5 transition-transform duration-300">
                    <div className="h-[3px] w-full rounded-full mb-4" style={{ background: "linear-gradient(90deg, #0F7BA0, #0F7BA044)" }} />
                    <p className="text-[12px] text-muted-foreground mb-3">توزيع نوع الصفقة</p>
                    {loadingInsights ? (
                      <div className="space-y-2">{[0,1,2].map(i=><Skeleton key={i} className="h-4 w-full" />)}</div>
                    ) : (
                      <div className="space-y-2.5">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-muted-foreground">للبيع</span>
                            <span className="font-bold text-primary">{mkt_saleRatio}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${mkt_saleRatio}%`, background: "#0F7BA0" }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-muted-foreground">للإيجار</span>
                            <span className="font-bold" style={{ color: "#5B8DB8" }}>{mkt_rentRatio}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${mkt_rentRatio}%`, background: "#5B8DB8" }} />
                          </div>
                        </div>
                        {mkt_investRatio > 0 && (
                          <div>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-muted-foreground">استثماري</span>
                              <span className="font-bold" style={{ color: "#D4A017" }}>{mkt_investRatio}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${mkt_investRatio}%`, background: "#D4A017" }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── C: العرض والطلب ──────────────────────────────────── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-5 rounded-full bg-green-500" />
                  <span className="text-sm font-extrabold text-foreground">ج — العرض والطلب</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <KpiCard icon={<TrendingUp className="w-4 h-4" />} title="جديد خلال 7 أيام" color="#22C55E"
                    value={loadingInsights ? <Skeleton className="h-7 w-14" /> : formatNumber(mkt_new7)}
                    sub="إعلان أضيف هذا الأسبوع" />
                  <KpiCard icon={<Activity className="w-4 h-4" />} title="جديد خلال 30 يوماً" color="#0F7BA0"
                    value={loadingInsights ? <Skeleton className="h-7 w-14" /> : formatNumber(mkt_new30)}
                    sub="إعلان أضيف هذا الشهر" />
                  {/* معدل دوران السوق — بديل "اتجاه العرض" المكرر */}
                  <div className="bg-card rounded-[22px] border border-border/60 p-5 shadow-sm hover:-translate-y-0.5 transition-transform duration-300">
                    <div className="h-[3px] w-full rounded-full mb-4" style={{ background: `linear-gradient(90deg, ${mkt_supplyColor}, ${mkt_supplyColor}44)` }} />
                    <div className="text-[12px] text-muted-foreground mb-1">معدل دوران السوق</div>
                    <div className="text-xl font-extrabold mt-1" style={{ color: mkt_supplyColor }}>{loadingInsights ? <Skeleton className="h-6 w-20" /> : mkt_supplyTrend}</div>
                    <div className="text-[11px] text-muted-foreground mt-2">
                      {loadingInsights ? <Skeleton className="h-3 w-24" /> : `${mkt_turnoverRate}% من الإعلانات جديدة هذا الشهر`}
                    </div>
                  </div>
                  {/* نشاط الإعلانات — بديل "مستوى الطلب" المضلل */}
                  <div className="bg-card rounded-[22px] border border-border/60 p-5 shadow-sm hover:-translate-y-0.5 transition-transform duration-300">
                    <div className="h-[3px] w-full rounded-full mb-4" style={{ background: `linear-gradient(90deg, ${mkt_demandColor}, ${mkt_demandColor}44)` }} />
                    <div className="text-[12px] text-muted-foreground mb-1">نشاط الإعلانات</div>
                    <div className="text-xl font-extrabold mt-1" style={{ color: mkt_demandColor }}>{loadingInsights ? <Skeleton className="h-6 w-20" /> : mkt_demandLabel}</div>
                    <div className="text-[11px] text-muted-foreground mt-2">حركة الإضافات الأسبوعية في المنصة</div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            BLOCK D: الفرص والتوصيات + توزيع أنواع العقارات
        ══════════════════════════════════════════════════════════════ */}
        {hasData && (
          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* D: الفرص والتوصيات */}
            <div className="lg:col-span-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 rounded-full" style={{ background: "#8B5CF6" }} />
                <span className="text-sm font-extrabold text-foreground">د — الفرص والتوصيات</span>
                <span className="text-[11px] text-muted-foreground font-medium">مبني على بيانات الإعلانات الفعلية</span>
              </div>

              {(insights?.smartInsights?.length ?? 0) === 0 ? (
                <div className="flex items-center justify-center py-10 rounded-2xl border border-dashed border-border/60 bg-card text-muted-foreground text-sm gap-2">
                  <Lightbulb className="w-5 h-5 opacity-30" />
                  ستظهر التوصيات مع تراكم بيانات السوق
                </div>
              ) : (
                <div className="space-y-2.5">
                  {(insights?.smartInsights ?? []).map((ins, i) => {
                    const isPositive = /فرصة|نمو|منخفض|مناسب|طلب عالٍ|مستقر/.test(ins);
                    const isWarning  = /مرتفع|انخفاض|تحذير|مخاطر|احتراز/.test(ins);
                    const color  = isPositive ? "#22C55E" : isWarning ? "#EF4444" : "#0F7BA0";
                    const bg     = isPositive ? "rgba(34,197,94,0.06)" : isWarning ? "rgba(239,68,68,0.06)" : "rgba(15,123,160,0.06)";
                    const icon   = isPositive ? "💡" : isWarning ? "⚠️" : "📊";
                    const badge  = isPositive ? "فرصة" : isWarning ? "تنبيه" : "بيانات";
                    const badgeBg = isPositive ? "rgba(34,197,94,0.12)" : isWarning ? "rgba(239,68,68,0.12)" : "rgba(15,123,160,0.12)";
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-2xl px-4 py-3.5 border transition-all hover:-translate-y-0.5 duration-200 cursor-default"
                        style={{ background: bg, borderColor: color + "20" }}
                      >
                        <span className="text-base shrink-0 mt-0.5">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-foreground leading-relaxed">{ins}</p>
                        </div>
                        <span
                          className="text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 mt-0.5"
                          style={{ background: badgeBg, color }}
                        >
                          {badge}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* أنواع العقارات */}
            <Card className="lg:col-span-2 rounded-2xl border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">أنواع العقارات</CardTitle>
                <CardDescription className="text-[12px]">التوزيع النسبي حسب نوع العقار</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center pt-2">
                {loadingInsights ? (
                  <Skeleton className="w-40 h-40 rounded-full" />
                ) : (insights?.byPropertyType?.length ?? 0) === 0 ? (
                  <div className="py-8 text-muted-foreground text-sm text-center">لا بيانات</div>
                ) : (
                  <>
                    <div className="h-[190px] w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={insights?.byPropertyType ?? []} cx="50%" cy="50%"
                            innerRadius={60} outerRadius={88} paddingAngle={4}
                            dataKey="count" nameKey="propertyType" stroke="none">
                            {(insights?.byPropertyType ?? []).map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number, n: string) => [`${v} إعلان`, n]}
                            contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid var(--border)" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
                      {(insights?.byPropertyType ?? []).map((t, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[12px]">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="font-medium text-foreground">{t.propertyType}</span>
                          <span className="text-muted-foreground">({t.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TREND CHART
        ══════════════════════════════════════════════════════════════ */}
        {hasData && (
          <motion.div variants={fadeUp}>
            <SectionLabel
              eyebrow="تطور السوق"
              title="اتجاهات الأسعار والإعلانات"
              description="تطور عدد الإعلانات ومتوسط الأسعار بمرور الوقت"
              action={
                <Link href="/analytics">
                  <button className="flex items-center gap-1.5 text-primary font-bold text-[13px] hover:underline underline-offset-2">
                    التحليل الكامل <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </Link>
              }
            />
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardContent className="pt-6 pb-4 px-6">
                <div className="h-[280px]" dir="ltr">
                  {loadingTrends ? (
                    <Skeleton className="w-full h-full rounded-xl" />
                  ) : (trends?.length ?? 0) < 2 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                      <AlertCircle className="w-8 h-8 opacity-30" />
                      <p className="text-sm">بيانات غير كافية لعرض الاتجاه — سيظهر الرسم البياني مع تراكم الإعلانات</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trends} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} dy={8} />
                        <YAxis yAxisId="l" orientation="left" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false}
                          tickFormatter={v => `${(v / 1000).toFixed(0)}k`} dx={8} />
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}
                          formatter={(v: number, name: string) => [name === "count" ? `${v} إعلان` : formatCurrency(v), name === "count" ? "عدد الإعلانات" : "متوسط السعر"]} />
                        <Line yAxisId="l" type="monotone" dataKey="count" stroke="#94A3B8" strokeWidth={2.5} dot={{ r: 4, fill: "#94A3B8", strokeWidth: 0 }} name="count" />
                        <Line yAxisId="r" type="monotone" dataKey="avgPrice" stroke="#0F7BA0" strokeWidth={2.5} dot={{ r: 4, fill: "#0F7BA0", strokeWidth: 0 }} name="avgPrice" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="flex items-center justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <span className="w-5 h-0.5 bg-[#94A3B8] rounded-full inline-block" />
                    عدد الإعلانات
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <span className="w-5 h-0.5 bg-[#0F7BA0] rounded-full inline-block" />
                    متوسط السعر
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            GEOGRAPHIC ANALYSIS
        ══════════════════════════════════════════════════════════════ */}
        {hasData && (
          <motion.div variants={fadeUp}>
            <SectionLabel
              eyebrow="التحليل الجغرافي"
              title="مقارنة المدن والأحياء"
              description="أسعار، نشاط، وتوزيع الإعلانات حسب المنطقة"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="pb-0 pt-5 px-5">
                  <CardTitle className="text-[15px] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> المناطق
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 mt-3">
                  {loadingInsights ? (
                    <div className="p-5 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                  ) : (insights?.byRegion?.length ?? 0) === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">لا توجد بيانات</div>
                  ) : (
                    <table className="w-full text-sm text-right">
                      <thead className="border-b border-border bg-muted/30">
                        <tr>
                          <th className="px-5 py-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">المنطقة</th>
                          <th className="px-5 py-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">إعلانات</th>
                          <th className="px-5 py-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">متوسط السعر</th>
                          <th className="px-5 py-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">سعر المتر</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {(insights?.byRegion ?? []).map((r, i) => (
                          <tr key={r.region} className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate(`/listings?region=${encodeURIComponent(r.region)}`)}>
                            <td className="px-5 py-3.5 font-semibold text-foreground flex items-center gap-1.5">
                              {i === 0 && <Star className="w-3 h-3 text-accent shrink-0" />}
                              {r.region}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="inline-flex items-center justify-center bg-primary/10 text-primary text-[12px] font-bold rounded-lg px-2.5 py-0.5">{r.count}</span>
                            </td>
                            <td className="px-5 py-3.5 font-semibold text-foreground">{formatCurrency(r.avgPrice)}</td>
                            <td className="px-5 py-3.5 text-muted-foreground">{r.avgPricePerSqm > 0 ? formatCurrency(r.avgPricePerSqm) : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="pb-0 pt-5 px-5">
                  <CardTitle className="text-[15px] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent" /> الأحياء
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 mt-3">
                  {loadingInsights ? (
                    <div className="p-5 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                  ) : (insights?.byDistrict?.length ?? 0) === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">لا توجد أحياء مدرجة بعد</div>
                  ) : (
                    <table className="w-full text-sm text-right">
                      <thead className="border-b border-border bg-muted/30">
                        <tr>
                          <th className="px-5 py-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">الحي</th>
                          <th className="px-5 py-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">المدينة</th>
                          <th className="px-5 py-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">إعلانات</th>
                          <th className="px-5 py-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">سعر المتر</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {(insights?.byDistrict ?? []).slice(0, 8).map((d, i) => (
                          <tr key={`${d.district}-${i}`} className="hover:bg-muted/20 transition-colors">
                            <td className="px-5 py-3.5 font-semibold text-foreground">{d.district}</td>
                            <td className="px-5 py-3.5 text-muted-foreground text-[12px]">{d.city}</td>
                            <td className="px-5 py-3.5">
                              <span className="inline-flex items-center justify-center bg-accent/10 text-accent-foreground text-[12px] font-bold rounded-lg px-2.5 py-0.5">{d.count}</span>
                            </td>
                            <td className="px-5 py-3.5 font-semibold text-foreground">{d.avgPricePerSqm > 0 ? formatCurrency(d.avgPricePerSqm) : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </div>

            {(insights?.byRegion?.length ?? 0) > 1 && (
              <Card className="rounded-2xl border-border/60 shadow-sm mt-5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[15px]">توزيع الإعلانات والأسعار حسب المنطقة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={insights?.byRegion ?? []} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                        <XAxis dataKey="region" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} dy={6} interval={0} />
                        <YAxis yAxisId="l" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false}
                          tickFormatter={v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}م` : `${(v / 1000).toFixed(0)}k`} dx={6} />
                        <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid var(--border)" }}
                          formatter={(v: number, name: string) => [name === "count" ? `${v} إعلان` : formatCurrency(v), name === "count" ? "عدد الإعلانات" : "متوسط السعر (ر.س)"]} />
                        <Bar yAxisId="l" dataKey="count" fill="#0F7BA0" radius={[5, 5, 0, 0]} name="count" />
                        <Bar yAxisId="r" dataKey="avgPrice" fill="#94A3B8" radius={[5, 5, 0, 0]} name="avgPrice" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* مفتاح الألوان */}
                  <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-border/40">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm shrink-0 inline-block" style={{ background: "#0F7BA0" }} />
                      <span className="text-[12px] text-muted-foreground">عدد الإعلانات <span className="text-foreground/50">(محور يسار)</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm shrink-0 inline-block" style={{ background: "#94A3B8" }} />
                      <span className="text-[12px] text-muted-foreground">متوسط السعر <span className="text-foreground/50">(محور يمين)</span></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

      </motion.div>
    </Layout>
  );
}
