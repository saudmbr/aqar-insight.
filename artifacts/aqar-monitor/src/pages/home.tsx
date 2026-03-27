import { useState, useCallback, lazy, Suspense } from "react";
import { Layout } from "@/components/layout/layout";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { GuestCTA, UserWelcomeBanner } from "@/components/guest-cta";
import { Link } from "wouter";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, MapPin, Banknote, TrendingUp, Activity, Search,
  BarChart3, AlertCircle, ArrowLeft, Users, Star, Home as HomeIcon,
  Lightbulb, ChevronDown, X, SlidersHorizontal, RefreshCcw,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";

const ListingsMap = lazy(() => import("@/components/listings-map"));

const BASE = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

const COLORS = ["#0F7BA0", "#0F1C3F", "#C9A84C", "#64748B", "#34D399", "#F97316", "#8B5CF6"];

// ── Types ────────────────────────────────────────────────────────────────────

type InsightsData = {
  kpis: {
    totalListings: number; avgPricePerSqm: number; avgPrice: number;
    maxPrice: number; minPrice: number; medianPrice: number;
    p25Price: number; p75Price: number; saleCount: number;
    rentCount: number; newLast7Days: number; newLast30Days: number;
  };
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
    <Card className={`rounded-2xl overflow-hidden transition-shadow hover:shadow-md ${highlight ? "ring-1 ring-primary/20" : ""}`} style={{ borderColor: color + "22" }}>
      <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
      <CardContent className="p-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: color + "15" }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <div className="text-[1.6rem] font-extrabold text-foreground leading-none mb-1.5 tabular-nums">{value}</div>
        <div className="text-[13px] font-medium text-muted-foreground">{title}</div>
        {sub && <div className="text-[11px] text-muted-foreground/70 mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  const images = listing.images?.split("\n").filter(Boolean) ?? [];
  const img = images[0];
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
          <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-border/50">
            <span className="text-[15px] font-extrabold text-foreground">{formatCurrency(listing.price)}</span>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {listing.areaSqm ? <span className="bg-muted rounded-md px-1.5 py-0.5">{formatNumber(listing.areaSqm)} م²</span> : null}
              {listing.propertyType ? <span className="bg-muted rounded-md px-1.5 py-0.5">{listing.propertyType}</span> : null}
            </div>
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
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const applyFilters = useCallback(() => setApplied({ ...filters }), [filters]);
  const resetFilters = useCallback(() => { setFilters(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); }, []);

  const qs = filtersToQuery(applied);
  const active = hasActiveFilters(applied);

  const { data: insights, isLoading: loadingInsights } = useQuery<InsightsData>({
    queryKey: ["listings-insights", qs],
    queryFn: async () => {
      const res = await fetch(`${BASE()}/api/analytics/listings-insights${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("فشل في تحميل البيانات");
      return res.json();
    },
    staleTime: 60_000,
  });

  const { data: trends, isLoading: loadingTrends } = useQuery<TrendPoint[]>({
    queryKey: ["listings-trends", qs],
    queryFn: async () => {
      const res = await fetch(`${BASE()}/api/analytics/listings-trends${qs ? `?${qs}` : ""}`);
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
    queryKey: ["home-listings", qs],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "6", sort: "newest" });
      if (applied.city) params.set("city", applied.city);
      if (applied.district) params.set("district", applied.district);
      if (applied.propertyType) params.set("propertyType", applied.propertyType);
      if (applied.listingType) params.set("listingType", applied.listingType);
      if (applied.minPrice) params.set("minPrice", applied.minPrice);
      if (applied.maxPrice) params.set("maxPrice", applied.maxPrice);
      const res = await fetch(`${BASE()}/api/listings?${params.toString()}`);
      if (!res.ok) throw new Error("فشل");
      return res.json();
    },
    staleTime: 60_000,
  });

  const kpis = insights?.kpis;
  const hasData = (kpis?.totalListings ?? 0) > 0;

  const filteredDistricts = applied.city
    ? (filterOpts?.districts ?? []).filter(d => d.city === applied.city)
    : (filterOpts?.districts ?? []);

  return (
    <Layout>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-14 pb-16">

        {/* ══════════════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp}>
          <div className="relative rounded-[2rem] overflow-hidden bg-sidebar text-white shadow-2xl">
            {/* Radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_top_right,rgba(15,123,160,0.3),transparent)] pointer-events-none" />
            <div className="absolute -left-20 bottom-0 w-96 h-64 bg-accent/8 blur-[140px] rounded-full pointer-events-none" />

            <div className="relative px-8 py-14 md:px-14 md:py-20 flex flex-col md:flex-row md:items-end md:gap-12">
              {/* Left: copy */}
              <div className="flex-1 max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/25 text-white/90 px-4 py-1.5 rounded-full text-[13px] font-medium mb-5">
                  <HomeIcon className="w-3.5 h-3.5" />
                  المنصة العقارية الذكية
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.08] tracking-tight mb-4">
                  اكتشف سوق العقار
                  <br />
                  <span className="text-primary-foreground/75">بذكاء ودقة حقيقية</span>
                </h1>
                <p className="text-[17px] text-white/85 leading-relaxed mb-8 max-w-xl">
                  تحليلات ومؤشرات حية مبنية على إعلانات عقارية حقيقية — اكتشف، قارن، وافهم السوق.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/listings">
                    <button className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-primary/30 transition-all">
                      <Search className="w-4 h-4" />
                      تصفح العقارات
                    </button>
                  </Link>
                  <button
                    onClick={() => setShowFilters(v => !v)}
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    فلتر التحليلات
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`} />
                  </button>
                  {active && (
                    <button onClick={resetFilters} className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-red-500/60 border border-white/15 text-white px-4 py-3 rounded-xl font-semibold text-sm transition-all">
                      <X className="w-3.5 h-3.5" />
                      إلغاء الفلتر
                    </button>
                  )}
                </div>
              </div>

              {/* Right: quick stats (desktop only) */}
              {hasData && (
                <div className="hidden md:flex gap-4 shrink-0">
                  {[
                    { label: "إعلان نشط", value: formatNumber(kpis?.totalListings) },
                    { label: "متوسط سعر المتر", value: formatCurrency(kpis?.avgPricePerSqm) },
                    { label: "إعلانات جديدة هذا الشهر", value: formatNumber(kpis?.newLast30Days) },
                  ].map(s => (
                    <div key={s.label} className="bg-white/8 border border-white/10 rounded-2xl px-5 py-4 min-w-[130px] text-center backdrop-blur-sm">
                      <div className="text-xl font-extrabold text-white mb-1">{s.value}</div>
                      <div className="text-[11px] text-white/80 leading-tight">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            FILTER PANEL — animated open/close
        ══════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: -24 }}
              animate={{ opacity: 1, height: "auto", marginTop: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: -24 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-foreground flex items-center gap-2 text-[15px]">
                    <SlidersHorizontal className="w-4 h-4 text-primary" />
                    فلترة التحليلات والإعلانات
                    {active && <Badge className="bg-primary/10 text-primary border-primary/20 text-[11px] font-bold">مفعّل</Badge>}
                  </span>
                  {active && (
                    <button onClick={resetFilters} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
                      <RefreshCcw className="w-3 h-3" /> إعادة ضبط
                    </button>
                  )}
                </div>
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
                    <option value="">بيع وإيجار</option>
                    <option value="sale">للبيع</option>
                    <option value="rent">للإيجار</option>
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

        {/* ══════════════════════════════════════════════════════════════
            MARKET KPIs
        ══════════════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp}>
          <SectionLabel
            eyebrow="مؤشرات السوق"
            title="نظرة شاملة على السوق"
            description="مبنية حصراً على الإعلانات الحقيقية المنشورة داخل المنصة"
            action={active ? <Badge variant="outline" className="text-primary border-primary/30 font-bold text-xs">نتائج مفلترة</Badge> : undefined}
          />

          {!hasData && !loadingInsights ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <BarChart3 className="w-14 h-14 opacity-20" />
              <p className="text-lg font-semibold">لا توجد إعلانات نشطة حالياً</p>
              <p className="text-sm opacity-70">ستظهر التحليلات تلقائياً فور نشر الإعلانات الأولى</p>
              <Link href="/listings/new">
                <button className="mt-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-all">
                  أضف أول إعلان
                </button>
              </Link>
            </div>
          ) : (
            <>
              {/* Primary KPIs — large */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <KpiCard highlight icon={<Building2 className="w-5 h-5" />} title="إجمالي الإعلانات النشطة" color="#0F7BA0"
                  value={loadingInsights ? <Skeleton className="h-8 w-16" /> : formatNumber(kpis?.totalListings)} />
                <KpiCard icon={<Banknote className="w-5 h-5" />} title="متوسط سعر المتر المربع" color="#C9A84C"
                  value={loadingInsights ? <Skeleton className="h-8 w-24" /> : formatCurrency(kpis?.avgPricePerSqm)} />
                <KpiCard icon={<TrendingUp className="w-5 h-5" />} title="الوسيط السعري للعقارات" color="#0F1C3F"
                  value={loadingInsights ? <Skeleton className="h-8 w-24" /> : formatCurrency(kpis?.medianPrice)} />
                <KpiCard icon={<Activity className="w-5 h-5" />} title="متوسط السعر الكلي" color="#34D399"
                  value={loadingInsights ? <Skeleton className="h-8 w-24" /> : formatCurrency(kpis?.avgPrice)} />
              </div>

              {/* Secondary KPIs — smaller, with inline growth stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <KpiCard icon={<ArrowUpRight className="w-4 h-4" />} title="أعلى سعر مدرج" color="#F97316"
                  value={loadingInsights ? <Skeleton className="h-6 w-20" /> : formatCurrency(kpis?.maxPrice)} />
                <KpiCard icon={<ArrowDownRight className="w-4 h-4" />} title="أدنى سعر مدرج" color="#8B5CF6"
                  value={loadingInsights ? <Skeleton className="h-6 w-20" /> : formatCurrency(kpis?.minPrice)} />
                <KpiCard icon={<Building2 className="w-4 h-4" />} title="إعلانات للبيع" color="#0F7BA0"
                  value={loadingInsights ? <Skeleton className="h-6 w-14" /> : formatNumber(kpis?.saleCount)}
                  sub={kpis?.totalListings ? `${Math.round(((kpis.saleCount ?? 0) / kpis.totalListings) * 100)}% من الإجمالي` : undefined} />
                <KpiCard icon={<HomeIcon className="w-4 h-4" />} title="إعلانات للإيجار" color="#64748B"
                  value={loadingInsights ? <Skeleton className="h-6 w-14" /> : formatNumber(kpis?.rentCount)}
                  sub={kpis?.totalListings ? `${Math.round(((kpis.rentCount ?? 0) / kpis.totalListings) * 100)}% من الإجمالي` : undefined} />
                <KpiCard icon={<TrendingUp className="w-4 h-4" />} title="جديد في 7 أيام" color="#34D399"
                  value={loadingInsights ? <Skeleton className="h-6 w-10" /> : formatNumber(kpis?.newLast7Days)} />
                <KpiCard icon={<Activity className="w-4 h-4" />} title="جديد في 30 يوماً" color="#0F7BA0"
                  value={loadingInsights ? <Skeleton className="h-6 w-10" /> : formatNumber(kpis?.newLast30Days)} />
              </div>

              {/* Quartile band — only when data available */}
              {(kpis?.p25Price ?? 0) > 0 && (
                <div className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground bg-muted/40 rounded-xl px-4 py-2.5 w-fit">
                  <BarChart3 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>توزيع الأسعار: الربع الأول <strong className="text-foreground">{formatCurrency(kpis?.p25Price)}</strong> — الربع الثالث <strong className="text-foreground">{formatCurrency(kpis?.p75Price)}</strong></span>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            SMART INSIGHTS + TYPE BREAKDOWN  (2-col)
        ══════════════════════════════════════════════════════════════ */}
        {hasData && (
          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Smart Insights — 3 cols */}
            {(insights?.smartInsights?.length ?? 0) > 0 && (
              <Card className="lg:col-span-3 rounded-2xl border-border/60 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Lightbulb className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">ملخص ذكي</CardTitle>
                      <CardDescription className="text-[12px] mt-0.5">استنتاجات من البيانات الفعلية للمنصة</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2.5">
                  {insights?.smartInsights.map((ins, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl px-3.5 py-3 bg-muted/40 hover:bg-muted/70 transition-colors">
                      <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-[13px] text-foreground leading-relaxed">{ins}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Property type donut — 2 cols */}
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
                        <Line yAxisId="l" type="monotone" dataKey="count" stroke="#C9A84C" strokeWidth={2.5} dot={{ r: 4, fill: "#C9A84C", strokeWidth: 0 }} name="count" />
                        <Line yAxisId="r" type="monotone" dataKey="avgPrice" stroke="#0F7BA0" strokeWidth={2.5} dot={{ r: 4, fill: "#0F7BA0", strokeWidth: 0 }} name="avgPrice" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="flex items-center justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <span className="w-5 h-0.5 bg-[#C9A84C] rounded-full inline-block" />
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
            GEOGRAPHIC ANALYSIS — city + district tables
        ══════════════════════════════════════════════════════════════ */}
        {hasData && (
          <motion.div variants={fadeUp}>
            <SectionLabel
              eyebrow="التحليل الجغرافي"
              title="مقارنة المدن والأحياء"
              description="أسعار، نشاط، وتوزيع الإعلانات حسب المنطقة"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Cities */}
              <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="pb-0 pt-5 px-5">
                  <CardTitle className="text-[15px] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> المدن
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 mt-3">
                  {loadingInsights ? (
                    <div className="p-5 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                  ) : (insights?.byCity?.length ?? 0) === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">لا توجد بيانات</div>
                  ) : (
                    <table className="w-full text-sm text-right">
                      <thead className="border-b border-border bg-muted/30">
                        <tr>
                          <th className="px-5 py-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">المدينة</th>
                          <th className="px-5 py-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">إعلانات</th>
                          <th className="px-5 py-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">متوسط السعر</th>
                          <th className="px-5 py-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">سعر المتر</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {(insights?.byCity ?? []).map((c, i) => (
                          <tr key={c.city} className="hover:bg-muted/20 transition-colors">
                            <td className="px-5 py-3.5 font-semibold text-foreground flex items-center gap-1.5">
                              {i === 0 && <Star className="w-3 h-3 text-accent shrink-0" />}
                              {c.city}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="inline-flex items-center justify-center bg-primary/10 text-primary text-[12px] font-bold rounded-lg px-2.5 py-0.5">{c.count}</span>
                            </td>
                            <td className="px-5 py-3.5 font-semibold text-foreground">{formatCurrency(c.avgPrice)}</td>
                            <td className="px-5 py-3.5 text-muted-foreground">{c.avgPricePerSqm > 0 ? formatCurrency(c.avgPricePerSqm) : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>

              {/* Districts */}
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

            {/* City bar chart — only when 2+ cities */}
            {(insights?.byCity?.length ?? 0) > 1 && (
              <Card className="rounded-2xl border-border/60 shadow-sm mt-5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[15px]">توزيع الإعلانات والأسعار حسب المدينة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={insights?.byCity ?? []} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                        <XAxis dataKey="city" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} dy={6} />
                        <YAxis yAxisId="l" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false}
                          tickFormatter={v => `${(v / 1000).toFixed(0)}k`} dx={6} />
                        <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid var(--border)" }}
                          formatter={(v: number, name: string) => [name === "count" ? `${v} إعلان` : formatCurrency(v), name === "count" ? "الإعلانات" : "متوسط السعر"]} />
                        <Bar yAxisId="l" dataKey="count" fill="#0F7BA0" radius={[5, 5, 0, 0]} name="count" />
                        <Bar yAxisId="r" dataKey="avgPrice" fill="#C9A84C" radius={[5, 5, 0, 0]} name="avgPrice" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            INTERACTIVE MAP
        ══════════════════════════════════════════════════════════════ */}
        {hasData && (
          <motion.div variants={fadeUp}>
            <SectionLabel
              eyebrow="الخريطة التفاعلية"
              title="توزيع العقارات جغرافياً"
              description="الدوائر الأكبر تعني نشاطاً أعلى — انقر على مدينة لفلترة التحليلات"
            />
            <Card className="rounded-2xl overflow-hidden border-border/60 shadow-sm">
              <CardContent className="p-0">
                <Suspense fallback={<Skeleton className="w-full h-[460px] rounded-2xl" />}>
                  <ListingsMap
                    cityData={insights?.byCity ?? []}
                    onCityClick={city => { setFilters(f => ({ ...f, city })); setApplied(f => ({ ...f, city })); }}
                    height={460}
                  />
                </Suspense>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            LISTINGS SHOWCASE
        ══════════════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp}>
          <SectionLabel
            eyebrow={active ? "نتائج البحث" : "أحدث الإعلانات"}
            title={active ? "الإعلانات المطابقة لفلترك" : "أحدث العقارات على المنصة"}
            description={active ? "الإعلانات التي تطابق معايير الفلتر الحالي" : "أحدث الإعلانات العقارية المضافة على المنصة"}
            action={
              <Link href={`/listings${qs ? `?${qs}` : ""}`}>
                <button className="flex items-center gap-1.5 text-primary font-bold text-[13px] hover:underline underline-offset-2">
                  عرض الكل <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </Link>
            }
          />

          {loadingListings ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
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
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground border border-dashed border-border/60 rounded-2xl">
              <Building2 className="w-12 h-12 opacity-20" />
              <p className="text-base font-semibold">لا توجد إعلانات تطابق البحث</p>
              {active && (
                <button onClick={resetFilters} className="text-primary text-sm font-bold hover:underline mt-1">
                  إزالة الفلتر لعرض كل الإعلانات
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(listingsData?.data ?? []).map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            WELCOME / GUEST BANNER
        ══════════════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp}>
          {isAuthenticated && user ? (
            <UserWelcomeBanner fullName={user.fullName ?? user.username} />
          ) : (
            <GuestCTA />
          )}
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            PLATFORM CTA CARDS
        ══════════════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/listings/new">
              <div className="bg-sidebar rounded-2xl p-7 text-white cursor-pointer hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(15,123,160,0.3),transparent_70%)] pointer-events-none" />
                <div className="relative">
                  <Building2 className="w-8 h-8 mb-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                  <h3 className="font-bold text-lg mb-1.5">أضف عقارك</h3>
                  <p className="text-[13px] text-white/80 mb-4">انشر إعلانك وتواصل مع آلاف المهتمين على المنصة</p>
                  <div className="flex items-center gap-1.5 text-[13px] font-bold text-primary">
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
                  <p className="text-[13px] text-white/85 mb-4">تواصل مع أفضل المسوّقين المعتمدين وصحاب الخبرة</p>
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

      </motion.div>
    </Layout>
  );
}
