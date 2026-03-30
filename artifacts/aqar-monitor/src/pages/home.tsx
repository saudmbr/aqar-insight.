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
  ArrowUpRight, ArrowDownRight, PlusCircle, ChevronLeft, Wrench, BadgeCheck,
  Lock, Map, Loader2,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import type { MapPin as MapPinItem } from "@/components/property-map";
import { SAUDI_REGIONS_LIST, getMuhafazat, getAllAhyaaForCity, ALL_AHYAA } from "@/lib/saudi-geo";
import { PlatformRatingWidget } from "@/components/platform-rating-widget";
import { SAR } from "@/components/sar-amount";
import { PROPERTY_TYPE_GROUPS } from "@/lib/property-types";
import { LISTING_TYPE_GROUPS } from "@/lib/listing-types";

const PropertyMap = lazy(() => import("@/components/property-map"));

const BASE = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

const COLORS = ["#0F7BA0", "#0F1C3F", "#94A3B8", "#64748B", "#34D399", "#F97316", "#8B5CF6"];

const REGION_COLORS = [
  "#0F7BA0",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EF4444",
  "#3B82F6",
  "#EC4899",
  "#F97316",
  "#14B8A6",
  "#6366F1",
  "#84CC16",
  "#06B6D4",
  "#A855F7",
];

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
type ServiceProvider = {
  id: number; businessName: string; category: string; city: string;
  description?: string; startingPrice?: number; portfolioImages?: string;
  verified: boolean; ratingAvg: number; ratingCount: number; createdAt: string;
};
type CustomerRequest = {
  id: number; requestType: string; title: string; category?: string;
  city: string; district?: string; budgetMin?: number; budgetMax?: number;
  details?: string; status: string; createdAt: string; posterName?: string;
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
              <span className="text-[15px] font-extrabold text-foreground min-w-0 truncate"><SAR value={listing.price} /></span>
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

  const handlePostProperty = () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    navigate(user?.role === "service_provider" ? "/services/new" : "/listings/new");
  };

  // Quick search state (hero bar) — منطقة → محافظة → حي
  const [quickRegion, setQuickRegion]           = useState("");
  const [quickCity, setQuickCity]               = useState("");
  const [quickDistrictInput, setQuickDistrictInput] = useState("");
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

  const { data: latestServices } = useQuery<ServiceProvider[]>({
    queryKey: ["home-latest-services"],
    queryFn: async () => {
      const res = await fetch(`${BASE()}/api/service-providers`);
      if (!res.ok) throw new Error("فشل");
      return res.json();
    },
    staleTime: 120_000,
  });

  const { data: latestRequests } = useQuery<CustomerRequest[]>({
    queryKey: ["home-latest-requests"],
    queryFn: async () => {
      const res = await fetch(`${BASE()}/api/customer-requests?status=open`);
      if (!res.ok) throw new Error("فشل");
      return res.json();
    },
    staleTime: 120_000,
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
  const [mapDistrict, setMapDistrict]       = useState("");
  const [mapListingType, setMapListingType] = useState("");
  const [mapPropertyType, setMapPropertyType] = useState("");
  const [regionMetric, setRegionMetric] = useState<"count"|"avgPrice"|"avgPricePerSqm">("count");

  const mapHasFilters = !!(mapRegion || mapCity || mapDistrict || mapListingType || mapPropertyType);

  // Derived districts list for map filter
  const mapAhyaa: string[] = getAllAhyaaForCity(mapRegion, mapCity);

  // Map pins — individual property markers
  const { data: mapPinsData } = useQuery<{ pins: MapPinItem[] }>({
    queryKey: ["home-map-pins", mapRegion, mapCity, mapDistrict, mapListingType, mapPropertyType],
    queryFn: async () => {
      const p = new URLSearchParams({ limit: "300" });
      if (mapRegion) p.set("region", mapRegion);
      if (mapCity) p.set("city", mapCity);
      if (mapDistrict) p.set("district", mapDistrict);
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

  // Derived lists — منطقة → محافظة → حي (مباشرةً)
  const muhafazatForRegion: string[] = getMuhafazat(quickRegion);
  const ahyaaForCity: string[]       = getAllAhyaaForCity(quickRegion, quickCity);

  // Quick search → navigate to /listings with params
  const handleQuickSearch = () => {
    const p = new URLSearchParams();
    if (quickRegion)  p.set("region",  quickRegion);
    if (quickCity)    p.set("city",    quickCity);
    const dist = quickDistrict || quickDistrictInput;
    if (dist) p.set("district", dist);
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
              boxShadow: "0 16px 60px rgba(6,18,32,0.38), 0 4px 18px rgba(6,18,32,0.22)",
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
            {/* Main: dark on right (text area) → transparent left (show image) */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(to left, rgba(5,14,27,0.92) 0%, rgba(5,14,27,0.76) 32%, rgba(5,14,27,0.38) 62%, rgba(5,14,27,0.06) 100%)" }}
            />
            {/* Bottom vignette for search bar readability */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(to top, rgba(5,14,27,0.82) 0%, rgba(5,14,27,0.28) 28%, transparent 52%)" }}
            />
            {/* Top vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(to bottom, rgba(5,14,27,0.42) 0%, transparent 26%)" }}
            />
            {/* Teal glow accent */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 55% 65% at 18% 48%, rgba(15,123,160,0.22) 0%, transparent 70%)" }}
            />
            {/* Cool blue accent */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 40% 35% at 12% 20%, rgba(100,160,220,0.08) 0%, transparent 70%)" }}
            />
            {/* Subtle grid overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
              style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
            {/* Animated floating orb 1 */}
            <motion.div
              className="absolute pointer-events-none rounded-full"
              style={{ width: 380, height: 380, top: "10%", right: "8%", background: "radial-gradient(circle, rgba(15,123,160,0.18) 0%, transparent 70%)", filter: "blur(50px)" }}
              animate={{ y: [0, -20, 0], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Animated floating orb 2 */}
            <motion.div
              className="absolute pointer-events-none rounded-full"
              style={{ width: 240, height: 240, bottom: "15%", left: "20%", background: "radial-gradient(circle, rgba(100,200,255,0.12) 0%, transparent 70%)", filter: "blur(40px)" }}
              animate={{ y: [0, 16, 0], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
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
                boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
              }}
            >
              {/* عنوان البطاقة */}
              <div className="flex items-center gap-2 mb-2.5 pb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="w-6 h-6 rounded-lg bg-cyan-400/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-300" />
                </div>
                <p className="text-[10px] text-white/70 font-bold tracking-wide">أعلى 5 مناطق · متوسط سعر م²</p>
              </div>
              {/* أعلى 5 مناطق حسب متوسط سعر المتر — بيانات حقيقية */}
              {insights?.byRegion && insights.byRegion.length > 0
                ? [...insights.byRegion]
                    .filter(r => (r.avgPricePerSqm ?? 0) > 0)
                    .sort((a, b) => (b.avgPricePerSqm ?? 0) - (a.avgPricePerSqm ?? 0))
                    .slice(0, 5)
                    .map((r, i) => (
                      <div key={r.region} className="flex items-center justify-between py-1.5"
                        style={i > 0 ? { borderTop: "1px solid rgba(255,255,255,0.07)" } : {}}>
                        <span className="text-[11px] text-white/80 font-medium truncate max-w-[120px]">{r.region}</span>
                        <span className="text-[12px] font-black text-white tabular-nums">
                          <SAR value={r.avgPricePerSqm ?? 0} perSqm dark />
                        </span>
                      </div>
                    ))
                : <p className="text-[11px] text-white/50 py-2 text-center">لا توجد بيانات بعد</p>
              }
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
                {/* Row 1 — Location: المنطقة → المحافظة → الحي */}
                <div className="flex flex-col md:flex-row gap-2.5">
                  {/* المنطقة */}
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-[11px] font-bold text-white px-1 tracking-wider drop-shadow">المنطقة</span>
                    <select
                      value={quickRegion}
                      onChange={e => {
                        setQuickRegion(e.target.value);
                        setQuickCity("");
                        setQuickDistrict("");
                        setQuickDistrictInput("");
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
                        setQuickDistrict("");
                        setQuickDistrictInput("");
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

                  {/* الحي — جميع الأحياء */}
                  <div className="flex flex-col gap-1 flex-[2]">
                    <span className="text-[11px] font-bold text-white px-1 tracking-wider drop-shadow">الحي</span>
                    <datalist id="ahyaa-list">
                      {(quickCity ? getAllAhyaaForCity(quickRegion, quickCity) : ALL_AHYAA).map(h => (
                        <option key={h} value={h} />
                      ))}
                    </datalist>
                    <input
                      type="text"
                      list="ahyaa-list"
                      value={quickDistrictInput}
                      onChange={e => {
                        setQuickDistrictInput(e.target.value);
                        setQuickDistrict(e.target.value);
                      }}
                      placeholder="اكتب أو اختر الحي…"
                      className="bg-white/15 border border-white/20 rounded-xl px-3 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-white/35 w-full placeholder:text-white/45"
                      style={{ color: "white" }}
                    />
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
                <motion.button
                  onClick={handlePostProperty}
                  whileHover={{ scale: 1.03, boxShadow: "0 8px 32px rgba(245,158,11,0.6), 0 0 0 1px rgba(245,158,11,0.5)" }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-black text-sm transition-all"
                  style={{
                    background: "rgba(245,158,11,0.12)",
                    border: "1.5px solid rgba(245,158,11,0.55)",
                    boxShadow: "0 4px 20px rgba(245,158,11,0.30), inset 0 1px 0 rgba(255,255,255,0.08)",
                    color: "#fbbf24",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <PlusCircle className="w-4 h-4" style={{ filter: "drop-shadow(0 0 4px rgba(251,191,36,0.8))" }} />
                  <span style={{
                    background: "linear-gradient(135deg, #fde68a, #f59e0b, #d97706)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    filter: "drop-shadow(0 0 8px rgba(245,158,11,0.5))",
                  }}>
                    أضف إعلانك الآن
                  </span>
                </motion.button>
                <Link href="/listings">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-sm text-white/80 hover:text-white transition-all backdrop-blur-md"
                    style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)" }}
                  >
                    تصفح جميع العقارات
                    <ArrowLeft className="w-4 h-4" />
                  </motion.button>
                </Link>
              </div>

              {/* Stats strip — premium */}
              {hasData && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="hidden md:flex items-center gap-6 mt-8 pt-6"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}
                >
                  {[
                    { label: "إعلان نشط", value: formatNumber(kpis?.totalListings), icon: Building2, color: "#0F7BA0" },
                    { label: "متوسط سعر المتر", value: <SAR value={kpis?.avgPricePerSqm} perSqm dark />, icon: Banknote, color: "#10b981" },
                    { label: "إعلانات هذا الشهر", value: formatNumber(kpis?.newLast30Days), icon: Activity, color: "#8b5cf6" },
                  ].map((s, i) => (
                    <div key={s.label} className="flex items-center gap-3 group/stat">
                      {i > 0 && <div className="w-px h-8 opacity-20" style={{ background: "rgba(255,255,255,0.4)" }} />}
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover/stat:scale-110"
                        style={{ background: `rgba(${s.color === "#0F7BA0" ? "15,123,160" : s.color === "#10b981" ? "16,185,129" : "139,92,246"},0.18)`, border: `1px solid ${s.color}40`, boxShadow: `0 0 12px ${s.color}25` }}>
                        <s.icon className="w-4.5 h-4.5" style={{ color: s.color }} />
                      </div>
                      <div>
                        <div className="text-[1.15rem] font-extrabold text-white leading-none tracking-tight tabular-nums">{s.value}</div>
                        <div className="text-[10.5px] font-medium mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{s.label}</div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            INTERACTIVE MAP — HERO SECTION
        ══════════════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp}>
          <div className="relative rounded-3xl overflow-hidden"
            style={{ height: 340, border: "1px solid rgba(226,232,240,0.7)", boxShadow: "0 4px 24px rgba(11,22,40,0.08)" }}>
            {/* Header bar */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-3.5"
              style={{ background: "linear-gradient(to bottom, rgba(6,13,28,0.88), transparent)" }}>
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-cyan-300" />
                <span className="font-bold text-white text-[13.5px]">الخريطة التفاعلية</span>
                <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>· استعرض العقارات على الخريطة</span>
              </div>
              {isAuthenticated && (
                <Link href="/map">
                  <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-bold text-white transition-all hover:opacity-90"
                    style={{ background: "rgba(15,123,160,0.4)", border: "1px solid rgba(15,123,160,0.55)" }}>
                    فتح الخريطة الكاملة <ArrowLeft className="w-3 h-3" />
                  </button>
                </Link>
              )}
            </div>

            {isAuthenticated ? (
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center" style={{ background: "#0B1628" }}>
                  <Loader2 className="w-7 h-7 text-primary animate-spin" />
                </div>
              }>
                <PropertyMap pins={mapPins} clustered />
              </Suspense>
            ) : (
              <div className="w-full h-full relative flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #0B1628 0%, #0F2744 50%, #0B1628 100%)" }}>
                {/* Dot grid pattern */}
                <div className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: "radial-gradient(circle, rgba(15,123,160,0.6) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
                {/* Fake pin dots */}
                {[{t:22,l:35},{t:45,l:60},{t:30,l:72},{t:60,l:20},{t:55,l:45},{t:70,l:78}].map((p,i)=>(
                  <div key={i} className="absolute w-3 h-3 rounded-full animate-pulse"
                    style={{ top:`${p.t}%`, left:`${p.l}%`, background:"#0F7BA0", boxShadow:"0 0 8px rgba(15,123,160,0.8)", animationDelay:`${i*0.4}s` }} />
                ))}
                {/* Login overlay */}
                <div className="relative z-10 flex flex-col items-center gap-4 text-center px-6"
                  style={{ background: "rgba(6,13,28,0.65)", backdropFilter: "blur(12px)", borderRadius: 24, padding: "32px 40px", border: "1px solid rgba(15,123,160,0.2)" }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(15,123,160,0.15)", border: "1px solid rgba(15,123,160,0.3)" }}>
                    <Lock className="w-6 h-6" style={{ color: "#0F7BA0" }} />
                  </div>
                  <div>
                    <p className="text-white font-bold text-[16px] mb-1.5">سجّل للوصول للخريطة التفاعلية</p>
                    <p className="text-[12.5px] font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>
                      استعرض مئات العقارات على الخريطة وقارن الأسعار بين الأحياء
                    </p>
                  </div>
                  <Link href="/login">
                    <button className="px-7 py-2.5 rounded-xl font-bold text-white text-[13px] transition-all hover:opacity-90"
                      style={{ background: "#0F7BA0", boxShadow: "0 4px 18px rgba(15,123,160,0.45)" }}>
                      تسجيل الدخول
                    </button>
                  </Link>
                </div>
              </div>
            )}
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
              <button onClick={handlePostProperty} className="inline-flex items-center gap-2 bg-sidebar text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:opacity-90 transition-all">
                <PlusCircle className="w-4 h-4" />
                أضف إعلانك
              </button>
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
              <button onClick={handlePostProperty} className="mt-1 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-all">
                أضف أول إعلان
              </button>
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
            SERVICES SECTION
        ══════════════════════════════════════════════════════════════ */}
        {(latestServices?.length ?? 0) > 0 && (
          <motion.div variants={fadeUp} className="mt-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[18px] font-black text-foreground tracking-tight">أحدث مزودي الخدمات</h2>
                <p className="text-[12.5px] text-muted-foreground mt-0.5">خدمات عقارية موثوقة من مزودين معتمدين</p>
              </div>
              <Link href="/services"
                className="text-[12px] font-black px-4 py-1.5 rounded-xl transition-colors hover:opacity-75"
                style={{ color: "#0F7BA0", background: "rgba(15,123,160,0.07)" }}>
                عرض الكل
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
              {(latestServices ?? []).slice(0, 8).map(sp => {
                const imgs = (() => { try { return JSON.parse((sp as any).portfolioImages ?? "[]") as string[]; } catch { return []; } })();
                const heroImg = getImageSrc(imgs[0]) ?? getImageSrc((sp as any).coverImage) ?? getImageSrc((sp as any).profileImage);
                return (
                  <Link key={sp.id} href={`/services/${sp.id}`}
                    className="shrink-0 w-[240px] rounded-2xl overflow-hidden flex flex-col hover:-translate-y-0.5 transition-transform"
                    style={{ background: "#fff", boxShadow: "0 2px 12px rgba(11,22,40,0.08)", border: "1px solid rgba(226,232,240,0.8)" }}
                  >
                    <div className="h-[120px] relative overflow-hidden"
                      style={{ background: "linear-gradient(135deg, #0B1628 0%, #0F3A5C 60%, #0F7BA0 100%)" }}>
                      {heroImg
                        ? <img src={heroImg} alt={sp.businessName} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center opacity-30">
                            <Wrench className="w-10 h-10 text-white" />
                          </div>
                      }
                      {sp.verified && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black"
                          style={{ background: "rgba(15,123,160,0.85)", color: "#fff", backdropFilter: "blur(6px)" }}>
                          <BadgeCheck className="w-3 h-3" /> موثوق
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex-1 flex flex-col gap-1.5">
                      <p className="font-black text-[13px] text-foreground leading-tight line-clamp-1">{sp.businessName}</p>
                      <p className="text-[11px] font-semibold px-2 py-0.5 rounded-lg w-fit"
                        style={{ background: "rgba(15,123,160,0.07)", color: "#0F7BA0" }}>{sp.category}</p>
                      <div className="flex items-center justify-between mt-auto pt-1.5"
                        style={{ borderTop: "1px solid #F1F5F9" }}>
                        <span className="text-[11px] text-muted-foreground">{sp.city}</span>
                        {sp.startingPrice && sp.startingPrice > 0
                          ? <span className="text-[11px] font-black" style={{ color: "#C9A84C" }}>يبدأ من <SAR value={sp.startingPrice} /></span>
                          : <span className="text-[10px] text-muted-foreground/50">تواصل للسعر</span>
                        }
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            CUSTOMER REQUESTS SECTION
        ══════════════════════════════════════════════════════════════ */}
        {(latestRequests?.length ?? 0) > 0 && (
          <motion.div variants={fadeUp} className="mt-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[18px] font-black text-foreground tracking-tight">أحدث طلبات العملاء</h2>
                <p className="text-[12.5px] text-muted-foreground mt-0.5">طلبات مفتوحة تبحث عن عقار أو خدمة مناسبة</p>
              </div>
              <Link href="/requests"
                className="text-[12px] font-black px-4 py-1.5 rounded-xl transition-colors hover:opacity-75"
                style={{ color: "#C9A84C", background: "rgba(201,168,76,0.08)" }}>
                عرض الكل
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
              {(latestRequests ?? []).slice(0, 8).map(req => (
                <Link key={req.id} href={`/requests/${req.id}`}
                  className="shrink-0 w-[260px] rounded-2xl p-4 flex flex-col gap-2 hover:-translate-y-0.5 transition-transform"
                  style={{ background: "#fff", boxShadow: "0 2px 12px rgba(11,22,40,0.08)", border: "1px solid rgba(226,232,240,0.8)" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-black text-[13px] text-foreground leading-snug line-clamp-2 flex-1">{req.title}</p>
                    <span className="shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-black"
                      style={{ background: req.requestType === "buy" ? "rgba(15,123,160,0.08)" : "rgba(201,168,76,0.08)", color: req.requestType === "buy" ? "#0F7BA0" : "#B8860B" }}>
                      {req.requestType === "buy" ? "شراء" : req.requestType === "rent" ? "إيجار" : req.requestType === "invest" ? "استثمار" : "خدمة"}
                    </span>
                  </div>
                  {req.category && (
                    <p className="text-[11px] text-muted-foreground/80 font-medium">{req.category}</p>
                  )}
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-auto pt-2"
                    style={{ borderTop: "1px solid #F1F5F9" }}>
                    <MapPin className="w-3 h-3 shrink-0" style={{ color: "#0F7BA0" }} />
                    <span className="font-medium">{req.city}{req.district ? ` / ${req.district}` : ""}</span>
                    {(req.budgetMin || req.budgetMax) && (
                      <>
                        <span className="text-muted-foreground/40 mx-1">·</span>
                        <SAR value={req.budgetMax ?? req.budgetMin} className="font-black" />
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

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
                    {[mapRegion, mapCity, mapDistrict, mapListingType, mapPropertyType].filter(Boolean).length} نشط
                  </span>
                )}
              </div>

              {/* المنطقة */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] text-muted-foreground">المنطقة</label>
                <select
                  value={mapRegion}
                  onChange={e => { setMapRegion(e.target.value); setMapCity(""); setMapDistrict(""); }}
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
                  onChange={e => { setMapCity(e.target.value); setMapDistrict(""); }}
                  disabled={!mapRegion}
                  className="border border-input bg-background rounded-lg px-2.5 text-xs h-7 min-w-[110px] focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-40"
                >
                  <option value="">{mapRegion ? "كل المحافظات" : "— اختر منطقة"}</option>
                  {getMuhafazat(mapRegion).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* الحي */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] text-muted-foreground">الحي</label>
                <select
                  value={mapDistrict}
                  onChange={e => setMapDistrict(e.target.value)}
                  disabled={!mapCity}
                  className="border border-input bg-background rounded-lg px-2.5 text-xs h-7 min-w-[110px] focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-40"
                >
                  <option value="">{mapCity ? "كل الأحياء" : "— اختر محافظة"}</option>
                  {mapAhyaa.map(h => <option key={h} value={h}>{h}</option>)}
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
                  onClick={() => { setMapRegion(""); setMapCity(""); setMapDistrict(""); setMapListingType(""); setMapPropertyType(""); }}
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
            <button onClick={handlePostProperty} className="text-right">
              <div className="bg-sidebar rounded-2xl p-7 text-white cursor-pointer hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(15,123,160,0.3),transparent_70%)] pointer-events-none" />
                <div className="relative">
                  <Building2 className="w-8 h-8 mb-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                  <h3 className="font-bold text-lg mb-1.5">أضف إعلانك</h3>
                  <p className="text-[13px] text-white/80 mb-4">انشر إعلانك واعرضه على المهتمين والباحثين عن عقار</p>
                  <div className="flex items-center gap-1.5 text-[13px] font-bold text-white/90 group-hover:text-white transition-colors">
                    ابدأ الآن <ArrowLeft className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </button>
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
            MARKET INSIGHTS HERO
        ══════════════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp}>
          <div
            className="relative overflow-hidden rounded-3xl border border-primary/20"
            style={{ background: "linear-gradient(135deg, #0B1628 0%, #0a2a42 55%, #0B1628 100%)" }}
          >
            {/* Teal radial glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 65% 70% at 18% 50%, rgba(15,123,160,0.25) 0%, transparent 70%)" }} />
            {/* Dot grid */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
              style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
            {/* Decorative rings on the left (RTL) */}
            <div className="absolute -left-24 top-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-white/[0.04] pointer-events-none" />
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-52 h-52 rounded-full border border-white/[0.05] pointer-events-none" />

            <div className="relative z-10 px-8 py-12 md:px-14 md:py-16 flex flex-col lg:flex-row items-center lg:items-start gap-10">
              {/* Text block */}
              <div className="flex-1 text-right">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5 border border-primary/40"
                  style={{ background: "rgba(15,123,160,0.18)" }}>
                  <BarChart3 className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-extrabold text-primary tracking-widest uppercase">ذكاء السوق</span>
                </div>

                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-snug">
                  مؤشرات السوق العقاري
                </h2>
                <p className="text-white/55 text-base leading-relaxed mb-8 max-w-lg">
                  تحليلات معمّقة مبنية حصراً على الإعلانات الحقيقية — اكتشف أسعار السوق، اتجاهاته، وأبرز الفرص في كل منطقة ومدينة
                </p>

                {/* Feature tags */}
                <div className="flex flex-wrap gap-2.5 mb-10">
                  {[
                    { icon: TrendingUp, label: "اتجاهات الأسعار" },
                    { icon: MapPin,     label: "مقارنة جغرافية" },
                    { icon: Activity,   label: "مؤشر صحة السوق" },
                    { icon: Lightbulb,  label: "رؤى ذكية تلقائية" },
                    { icon: Building2,  label: "توزيع أنواع العقارات" },
                  ].map(f => (
                    <div key={f.label}
                      className="flex items-center gap-2 rounded-xl px-3.5 py-2 border border-white/10"
                      style={{ background: "rgba(255,255,255,0.06)" }}>
                      <f.icon className="w-3.5 h-3.5 text-primary" />
                      <span className="text-sm font-medium text-white/75">{f.label}</span>
                    </div>
                  ))}
                </div>

                {/* CTA button */}
                <Link href="/analytics">
                  <button className="inline-flex items-center gap-2.5 bg-primary hover:bg-primary/90 text-white px-8 py-3.5 rounded-2xl font-bold text-base transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 active:translate-y-0 duration-200">
                    استعرض مؤشرات السوق
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </Link>
              </div>

              {/* Decorative stat cards — purely visual, no live data */}
              <div className="hidden lg:flex flex-col gap-3 shrink-0">
                {[
                  { label: "مؤشر السوق",    value: "متوازن",   color: "#0F7BA0" },
                  { label: "نشاط الإعلانات", value: "مرتفع",   color: "#22C55E" },
                  { label: "العرض والطلب",  value: "متقارب", color: "#F59E0B" },
                ].map(s => (
                  <div key={s.label}
                    className="rounded-2xl px-5 py-3.5 border border-white/10 min-w-[168px]"
                    style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(8px)" }}>
                    <p className="text-[11px] text-white/40 mb-1">{s.label}</p>
                    <p className="text-lg font-extrabold" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
                  {(insights?.smartInsights ?? []).slice(2).map((ins, i) => {
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
                          <tr key={r.region} className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate(`${BASE()}/listings?region=${encodeURIComponent(r.region)}`)}>
                            <td className="px-5 py-3.5 font-semibold text-foreground flex items-center gap-1.5">
                              {i === 0 && <Star className="w-3 h-3 text-accent shrink-0" />}
                              {r.region}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="inline-flex items-center justify-center bg-primary/10 text-primary text-[12px] font-bold rounded-lg px-2.5 py-0.5">{r.count}</span>
                            </td>
                            <td className="px-5 py-3.5 font-semibold text-foreground"><SAR value={r.avgPrice} /></td>
                            <td className="px-5 py-3.5 text-muted-foreground">{r.avgPricePerSqm > 0 ? <SAR value={r.avgPricePerSqm} perSqm /> : "—"}</td>
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
                            <td className="px-5 py-3.5 font-semibold text-foreground">{d.avgPricePerSqm > 0 ? <SAR value={d.avgPricePerSqm} perSqm /> : "—"}</td>
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
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-[15px]">توزيع الإعلانات والأسعار حسب المنطقة</CardTitle>
                      <p className="text-[12px] text-muted-foreground mt-0.5">اضغط على منطقة في الرسم لتصفح إعلاناتها</p>
                    </div>
                    {/* Tab switcher */}
                    <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(15,123,160,0.06)", border: "1px solid rgba(15,123,160,0.12)" }}>
                      {([
                        { key: "count",           label: "عدد الإعلانات" },
                        { key: "avgPrice",        label: "متوسط السعر" },
                        { key: "avgPricePerSqm",  label: "سعر المتر" },
                      ] as const).map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setRegionMetric(tab.key)}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200"
                          style={regionMetric === tab.key
                            ? { background: "#0F7BA0", color: "#fff", boxShadow: "0 2px 8px rgba(15,123,160,0.35)" }
                            : { color: "var(--muted-foreground)" }}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[260px]" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={(insights?.byRegion ?? []).map((r, i) => ({
                          ...r,
                          fill: REGION_COLORS[i % REGION_COLORS.length],
                        }))}
                        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                        onClick={(data) => {
                          if (data?.activePayload?.[0]?.payload?.region) {
                            window.location.href = `${BASE()}/listings?region=${encodeURIComponent(data.activePayload[0].payload.region)}`;
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                        <XAxis
                          dataKey="region"
                          tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontFamily: "Cairo, sans-serif" }}
                          axisLine={false} tickLine={false} dy={6} interval={0}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                          axisLine={false} tickLine={false}
                          tickFormatter={v =>
                            regionMetric === "count"
                              ? `${v}`
                              : v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}م` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : `${v}`
                          }
                          width={50}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                          cursor={{ fill: "rgba(15,123,160,0.06)" }}
                          formatter={(v: number) => [
                            regionMetric === "count"
                              ? `${v} إعلان`
                              : formatCurrency(v),
                            regionMetric === "count"
                              ? "عدد الإعلانات"
                              : regionMetric === "avgPrice"
                              ? "متوسط السعر (ريال)"
                              : "سعر المتر (ريال/م²)",
                          ]}
                          labelFormatter={(label) => `📍 ${label}`}
                        />
                        <Bar dataKey={regionMetric} radius={[6, 6, 0, 0]} maxBarSize={52}>
                          {(insights?.byRegion ?? []).map((_, i) => (
                            <Cell key={i} fill={REGION_COLORS[i % REGION_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Color legend — region colors */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-3 border-t border-border/40 justify-center">
                    {(insights?.byRegion ?? []).map((r, i) => (
                      <button
                        key={r.region}
                        onClick={() => window.location.href = `${BASE()}/listings?region=${encodeURIComponent(r.region)}`}
                        className="flex items-center gap-1.5 hover:opacity-75 transition-opacity"
                      >
                        <span className="w-3 h-3 rounded-sm shrink-0 inline-block" style={{ background: REGION_COLORS[i % REGION_COLORS.length] }} />
                        <span className="text-[11px] font-semibold text-muted-foreground">{r.region}</span>
                        <span className="text-[10px] text-foreground/40">
                          ({regionMetric === "count"
                            ? `${r.count} إعلان`
                            : regionMetric === "avgPrice"
                            ? formatCurrency(r.avgPrice)
                            : r.avgPricePerSqm > 0 ? formatCurrency(r.avgPricePerSqm) : "—"})
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

      {/* ══════════════════════════════════════════════════════════════
          SERVICES SECTION (OLD - REMOVED)
      ══════════════════════════════════════════════════════════════ */}
      {false && (latestServices?.length ?? 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-10 px-4 md:px-0"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[18px] font-black text-foreground tracking-tight">أحدث مزودي الخدمات</h2>
              <p className="text-[12.5px] text-muted-foreground mt-0.5">خدمات عقارية موثوقة من مزودين معتمدين</p>
            </div>
            <Link href="/services"
              className="text-[12px] font-black px-4 py-1.5 rounded-xl transition-colors hover:opacity-75"
              style={{ color: "#0F7BA0", background: "rgba(15,123,160,0.07)" }}>
              عرض الكل
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
            {(latestServices ?? []).slice(0, 8).map(sp => {
              const imgs = (() => { try { return JSON.parse(sp.portfolioImages ?? "[]") as string[]; } catch { return []; } })();
              return (
                <Link key={sp.id} href={`/services/${sp.id}`}
                  className="shrink-0 w-[240px] rounded-2xl overflow-hidden flex flex-col hover:-translate-y-0.5 transition-transform"
                  style={{ background: "#fff", boxShadow: "0 2px 12px rgba(11,22,40,0.08)", border: "1px solid rgba(226,232,240,0.8)" }}
                >
                  {/* Image or placeholder */}
                  <div className="h-[120px] relative overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #0B1628 0%, #0F3A5C 60%, #0F7BA0 100%)" }}>
                    {imgs[0]
                      ? <img src={getImageSrc(imgs[0])} alt={sp.businessName} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center opacity-30">
                          <Wrench className="w-10 h-10 text-white" />
                        </div>
                    }
                    {sp.verified && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black"
                        style={{ background: "rgba(15,123,160,0.85)", color: "#fff", backdropFilter: "blur(6px)" }}>
                        <BadgeCheck className="w-3 h-3" /> موثوق
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex-1 flex flex-col gap-1.5">
                    <p className="font-black text-[13px] text-foreground leading-tight line-clamp-1">{sp.businessName}</p>
                    <p className="text-[11px] font-semibold px-2 py-0.5 rounded-lg w-fit"
                      style={{ background: "rgba(15,123,160,0.07)", color: "#0F7BA0" }}>{sp.category}</p>
                    <div className="flex items-center justify-between mt-auto pt-1.5"
                      style={{ borderTop: "1px solid #F1F5F9" }}>
                      <span className="text-[11px] text-muted-foreground">{sp.city}</span>
                      {sp.startingPrice && sp.startingPrice > 0
                        ? <span className="text-[11px] font-black" style={{ color: "#C9A84C" }}>يبدأ من {formatCurrency(sp.startingPrice)}</span>
                        : <span className="text-[10px] text-muted-foreground/50">تواصل للسعر</span>
                      }
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}

      </motion.div>
      <PlatformRatingWidget />
    </Layout>
  );
}
