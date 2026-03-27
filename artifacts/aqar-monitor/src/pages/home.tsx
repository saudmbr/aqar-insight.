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
import { motion } from "framer-motion";
import {
  Building2, MapPin, Banknote, TrendingUp, Activity, Search,
  BarChart3, AlertCircle, ArrowLeft, Users, Star, Home as HomeIcon,
  Lightbulb, ChevronDown, X, SlidersHorizontal, RefreshCcw,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";

const ListingsMap = lazy(() => import("@/components/listings-map"));

const BASE = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

const COLORS = ["#0F7BA0", "#0F1C3F", "#C9A84C", "#64748B", "#34D399", "#F97316", "#8B5CF6"];

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

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 22 } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

function KpiCard({ title, value, sub, color, icon }: { title: string; value: React.ReactNode; sub?: string; color: string; icon: React.ReactNode }) {
  return (
    <Card className={`rounded-2xl border-0 shadow-sm overflow-hidden`}>
      <div className="h-1" style={{ background: color }} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + "18" }}>
            <span style={{ color }}>{icon}</span>
          </div>
        </div>
        <div className="text-2xl font-extrabold text-foreground mb-1 leading-tight">{value}</div>
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  const images = listing.images?.split("\n").filter(Boolean) ?? [];
  const img = images[0];
  const purposeLabel = listing.listingPurpose === "owner" ? "مالك مباشر" : listing.listingPurpose === "exclusive" ? "حصري" : null;
  return (
    <Link href={`/listings/${listing.id}`}>
      <div className="group bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300 cursor-pointer">
        <div className="relative h-44 bg-muted overflow-hidden">
          {img ? (
            <img src={img} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Building2 className="w-12 h-12 text-primary/30" />
            </div>
          )}
          <div className="absolute top-3 right-3 flex gap-1.5">
            <Badge className={`text-xs font-semibold px-2.5 py-1 rounded-full ${listing.listingType === "sale" ? "bg-primary text-white border-0" : "bg-accent text-accent-foreground border-0"}`}>
              {listing.listingType === "sale" ? "للبيع" : "للإيجار"}
            </Badge>
            {purposeLabel && (
              <Badge className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gold/90 text-white border-0">{purposeLabel}</Badge>
            )}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-foreground text-sm leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">{listing.title}</h3>
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-3">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{[listing.city, listing.district].filter(Boolean).join(" — ")}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-base font-extrabold text-foreground">{formatCurrency(listing.price)}</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {listing.areaSqm ? <span>{formatNumber(listing.areaSqm)} م²</span> : null}
              {listing.propertyType ? <span className="bg-muted rounded-full px-2 py-0.5">{listing.propertyType}</span> : null}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const applyFilters = useCallback(() => {
    setApplied({ ...filters });
  }, [filters]);

  const resetFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  }, []);

  const qs = filtersToQuery(applied);

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
  const active = hasActiveFilters(applied);

  const filteredDistricts = applied.city
    ? (filterOpts?.districts ?? []).filter(d => d.city === applied.city)
    : (filterOpts?.districts ?? []);

  return (
    <Layout>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-10 pb-16">

        {/* ── A) HERO ─────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="relative rounded-[2rem] overflow-hidden bg-sidebar text-sidebar-foreground shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(15,123,160,0.25),transparent_60%)] pointer-events-none" />
          <div className="absolute left-0 bottom-0 w-72 h-72 bg-accent/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="relative px-8 py-14 md:px-14 md:py-20 max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary-foreground px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <HomeIcon className="w-3.5 h-3.5" />
              المنصة العقارية الذكية
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-5">
              اكتشف سوق العقار<br />
              <span className="text-primary-foreground opacity-80">بذكاء ودقة حقيقية</span>
            </h1>
            <p className="text-lg text-sidebar-foreground/75 leading-relaxed mb-8 max-w-2xl">
              تحليلات ومؤشرات حية مبنية على إعلانات عقارية حقيقية — اكتشف العقارات، قارن الأحياء، وافهم السوق من مصدر واحد موثوق.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/listings">
                <button className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-primary/30">
                  <Search className="w-4 h-4" />
                  تصفح العقارات
                </button>
              </Link>
              <button
                onClick={() => setShowFilters(v => !v)}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
              >
                <SlidersHorizontal className="w-4 h-4" />
                فلتر التحليلات
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </button>
              {active && (
                <button onClick={resetFilters} className="inline-flex items-center gap-2 bg-destructive/70 hover:bg-destructive text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all">
                  <X className="w-3.5 h-3.5" />
                  إلغاء الفلتر
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── B) FILTER BAR ────────────────────────────────────────── */}
        {showFilters && (
          <motion.div variants={fadeUp} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                فلترة التحليلات والإعلانات
              </h3>
              {active && (
                <button onClick={resetFilters} className="text-xs text-destructive hover:underline flex items-center gap-1">
                  <RefreshCcw className="w-3 h-3" />
                  إعادة ضبط
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <select
                value={filters.city}
                onChange={e => setFilters(f => ({ ...f, city: e.target.value, district: "" }))}
                className="border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">كل المدن</option>
                {(filterOpts?.cities ?? []).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={filters.district}
                onChange={e => setFilters(f => ({ ...f, district: e.target.value }))}
                className="border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">كل الأحياء</option>
                {filteredDistricts.map(d => <option key={d.district} value={d.district}>{d.district}</option>)}
              </select>
              <select
                value={filters.propertyType}
                onChange={e => setFilters(f => ({ ...f, propertyType: e.target.value }))}
                className="border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">كل الأنواع</option>
                {(filterOpts?.propertyTypes ?? []).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select
                value={filters.listingType}
                onChange={e => setFilters(f => ({ ...f, listingType: e.target.value }))}
                className="border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">بيع وإيجار</option>
                <option value="sale">بيع</option>
                <option value="rent">إيجار</option>
              </select>
              <input type="number" placeholder="أقل سعر (ر.س)"
                value={filters.minPrice}
                onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                className="border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input type="number" placeholder="أعلى سعر (ر.س)"
                value={filters.maxPrice}
                onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                className="border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input type="number" placeholder="أقل مساحة (م²)"
                value={filters.minArea}
                onChange={e => setFilters(f => ({ ...f, minArea: e.target.value }))}
                className="border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input type="number" placeholder="أعلى مساحة (م²)"
                value={filters.maxArea}
                onChange={e => setFilters(f => ({ ...f, maxArea: e.target.value }))}
                className="border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={applyFilters}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all"
            >
              تطبيق الفلتر
            </button>
            {active && (
              <span className="mr-3 text-xs text-primary font-medium">
                ● الفلتر مفعّل
              </span>
            )}
          </motion.div>
        )}

        {/* ── WELCOME BANNER ───────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          {isAuthenticated && user ? (
            <UserWelcomeBanner fullName={user.fullName ?? user.username} />
          ) : (
            <GuestCTA />
          )}
        </motion.div>

        {/* ── C) MARKET INSIGHTS KPIs ──────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-extrabold text-foreground">مؤشرات السوق</h2>
              <p className="text-sm text-muted-foreground mt-0.5">مبنية على إعلانات حقيقية داخل المنصة فقط</p>
            </div>
            {active && <Badge variant="outline" className="text-primary border-primary/30 font-semibold px-3 py-1">نتائج مفلترة</Badge>}
          </div>

          {!hasData && !loadingInsights ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <BarChart3 className="w-12 h-12 opacity-30" />
              <p className="text-lg font-medium">لا توجد إعلانات نشطة حالياً</p>
              <p className="text-sm">سيتم عرض التحليلات هنا فور نشر الإعلانات الأولى</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <KpiCard icon={<Building2 className="w-5 h-5" />} title="إجمالي الإعلانات" color="#0F7BA0"
                value={loadingInsights ? <Skeleton className="h-7 w-16" /> : formatNumber(kpis?.totalListings)} />
              <KpiCard icon={<Banknote className="w-5 h-5" />} title="متوسط سعر المتر" color="#C9A84C"
                value={loadingInsights ? <Skeleton className="h-7 w-24" /> : formatCurrency(kpis?.avgPricePerSqm)} />
              <KpiCard icon={<TrendingUp className="w-5 h-5" />} title="الوسيط السعري" color="#0F1C3F"
                value={loadingInsights ? <Skeleton className="h-7 w-24" /> : formatCurrency(kpis?.medianPrice)} />
              <KpiCard icon={<Activity className="w-5 h-5" />} title="متوسط السعر" color="#34D399"
                value={loadingInsights ? <Skeleton className="h-7 w-24" /> : formatCurrency(kpis?.avgPrice)} />
              <KpiCard icon={<TrendingUp className="w-5 h-5" />} title="أعلى سعر مدرج" color="#F97316"
                value={loadingInsights ? <Skeleton className="h-7 w-24" /> : formatCurrency(kpis?.maxPrice)} />
              <KpiCard icon={<Activity className="w-5 h-5" />} title="أدنى سعر مدرج" color="#8B5CF6"
                value={loadingInsights ? <Skeleton className="h-7 w-24" /> : formatCurrency(kpis?.minPrice)} />
              <KpiCard icon={<Building2 className="w-5 h-5" />} title="إعلانات للبيع"  color="#0F7BA0"
                value={loadingInsights ? <Skeleton className="h-7 w-14" /> : formatNumber(kpis?.saleCount)}
                sub={kpis?.totalListings ? `${Math.round(((kpis.saleCount ?? 0) / kpis.totalListings) * 100)}% من الإجمالي` : undefined} />
              <KpiCard icon={<HomeIcon className="w-5 h-5" />} title="إعلانات للإيجار" color="#64748B"
                value={loadingInsights ? <Skeleton className="h-7 w-14" /> : formatNumber(kpis?.rentCount)}
                sub={kpis?.totalListings ? `${Math.round(((kpis.rentCount ?? 0) / kpis.totalListings) * 100)}% من الإجمالي` : undefined} />
            </div>
          )}
        </motion.div>

        {/* Growth badges */}
        {hasData && (
          <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700">
                {loadingInsights ? "..." : `${kpis?.newLast7Days ?? 0} إعلان`} جديد خلال 7 أيام
              </span>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">
                {loadingInsights ? "..." : `${kpis?.newLast30Days ?? 0} إعلان`} خلال 30 يوم
              </span>
            </div>
            {(kpis?.p25Price ?? 0) > 0 && (
              <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2.5">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-purple-700">
                  الربع الأول: {formatCurrency(kpis?.p25Price)} — الربع الثالث: {formatCurrency(kpis?.p75Price)}
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* ── D) SMART INSIGHTS ───────────────────────────────────── */}
        {hasData && (insights?.smartInsights?.length ?? 0) > 0 && (
          <motion.div variants={fadeUp}>
            <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2.5 text-xl">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-primary" />
                  </div>
                  ملخص ذكي
                </CardTitle>
                <CardDescription>استنتاجات مبنية على البيانات الفعلية للمنصة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {insights?.smartInsights.map((ins, i) => (
                    <div key={i} className="flex items-start gap-3 bg-background rounded-xl p-3.5 shadow-sm border border-border">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">{i + 1}</span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{ins}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── E) CHARTS ────────────────────────────────────────────── */}
        {hasData && (
          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Price trend chart */}
            <Card className="lg:col-span-2 rounded-2xl border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">تطور الإعلانات والأسعار</CardTitle>
                <CardDescription>عدد الإعلانات ومتوسط الأسعار بمرور الوقت</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[280px]" dir="ltr">
                  {loadingTrends ? (
                    <Skeleton className="w-full h-full rounded-xl" />
                  ) : (trends?.length ?? 0) < 2 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      <AlertCircle className="w-5 h-5 ml-2" /> بيانات غير كافية للرسم البياني
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} dy={10} />
                        <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false}
                          tickFormatter={v => `${(v / 1000).toFixed(0)}k`} dx={8} />
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid var(--border)" }}
                          formatter={(v: number, name: string) => [name === "count" ? `${v} إعلان` : formatCurrency(v), name === "count" ? "عدد الإعلانات" : "متوسط السعر"]} />
                        <Legend wrapperStyle={{ fontSize: 12 }} formatter={v => v === "count" ? "عدد الإعلانات" : "متوسط السعر"} />
                        <Line yAxisId="left" type="monotone" dataKey="count" stroke="#C9A84C" strokeWidth={3} dot={{ r: 4, fill: "#C9A84C" }} />
                        <Line yAxisId="right" type="monotone" dataKey="avgPrice" stroke="#0F7BA0" strokeWidth={3} dot={{ r: 4, fill: "#0F7BA0" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Property type donut */}
            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">توزيع أنواع العقار</CardTitle>
                <CardDescription>نسبة كل نوع من إجمالي الإعلانات</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center pt-2">
                {loadingInsights ? (
                  <Skeleton className="w-full h-[200px] rounded-xl" />
                ) : (
                  <>
                    <div className="h-[200px] w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={insights?.byPropertyType ?? []} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                            paddingAngle={4} dataKey="count" nameKey="propertyType" stroke="none">
                            {(insights?.byPropertyType ?? []).map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number, n: string) => [`${v} إعلان`, n]}
                            contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                      {(insights?.byPropertyType ?? []).map((t, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs font-medium">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span>{t.propertyType}</span>
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

        {/* ── F) CITY / DISTRICT COMPARISON ─────────────────────── */}
        {hasData && (
          <motion.div variants={fadeUp}>
            <div className="mb-5">
              <h2 className="text-2xl font-extrabold text-foreground">مقارنة المدن والأحياء</h2>
              <p className="text-sm text-muted-foreground mt-0.5">مقارنة شاملة بالأسعار والنشاط بين المناطق</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* City comparison */}
              <Card className="rounded-2xl border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    مقارنة المدن
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingInsights ? (
                    <div className="p-5 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                  ) : (insights?.byCity?.length ?? 0) === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">لا توجد بيانات</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-right">
                        <thead className="border-b border-border bg-muted/40">
                          <tr>
                            <th className="px-5 py-3 font-semibold text-muted-foreground">المدينة</th>
                            <th className="px-5 py-3 font-semibold text-muted-foreground">الإعلانات</th>
                            <th className="px-5 py-3 font-semibold text-muted-foreground">متوسط السعر</th>
                            <th className="px-5 py-3 font-semibold text-muted-foreground">سعر المتر</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {(insights?.byCity ?? []).map((c, i) => (
                            <tr key={c.city} className="hover:bg-muted/30 transition-colors">
                              <td className="px-5 py-3.5 font-semibold text-foreground flex items-center gap-2">
                                {i === 0 && <Star className="w-3.5 h-3.5 text-accent" />}
                                {c.city}
                              </td>
                              <td className="px-5 py-3.5">
                                <Badge variant="outline" className="text-primary border-primary/20 font-bold">{c.count}</Badge>
                              </td>
                              <td className="px-5 py-3.5 font-bold">{formatCurrency(c.avgPrice)}</td>
                              <td className="px-5 py-3.5 text-muted-foreground">{c.avgPricePerSqm > 0 ? formatCurrency(c.avgPricePerSqm) : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* District comparison */}
              <Card className="rounded-2xl border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent" />
                    مقارنة الأحياء
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingInsights ? (
                    <div className="p-5 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                  ) : (insights?.byDistrict?.length ?? 0) === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">لا توجد أحياء مدرجة حالياً</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-right">
                        <thead className="border-b border-border bg-muted/40">
                          <tr>
                            <th className="px-5 py-3 font-semibold text-muted-foreground">الحي</th>
                            <th className="px-5 py-3 font-semibold text-muted-foreground">المدينة</th>
                            <th className="px-5 py-3 font-semibold text-muted-foreground">الإعلانات</th>
                            <th className="px-5 py-3 font-semibold text-muted-foreground">سعر المتر</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {(insights?.byDistrict ?? []).slice(0, 8).map((d, i) => (
                            <tr key={`${d.district}-${i}`} className="hover:bg-muted/30 transition-colors">
                              <td className="px-5 py-3.5 font-semibold text-foreground">{d.district}</td>
                              <td className="px-5 py-3.5 text-muted-foreground">{d.city}</td>
                              <td className="px-5 py-3.5">
                                <Badge variant="outline" className="text-accent-foreground border-accent/30 font-bold">{d.count}</Badge>
                              </td>
                              <td className="px-5 py-3.5 font-bold">{d.avgPricePerSqm > 0 ? formatCurrency(d.avgPricePerSqm) : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* City bar chart */}
            {(insights?.byCity?.length ?? 0) > 1 && (
              <Card className="rounded-2xl border-border shadow-sm mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">توزيع الإعلانات والأسعار حسب المدينة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[240px]" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={insights?.byCity ?? []} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="city" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} dy={8} />
                        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false}
                          tickFormatter={v => `${(v / 1000).toFixed(0)}k`} dx={8} />
                        <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }}
                          formatter={(v: number, name: string) => [name === "count" ? `${v} إعلان` : formatCurrency(v), name === "count" ? "الإعلانات" : "متوسط السعر"]} />
                        <Legend wrapperStyle={{ fontSize: 12 }} formatter={v => v === "count" ? "الإعلانات" : "متوسط السعر"} />
                        <Bar yAxisId="left" dataKey="count" fill="#0F7BA0" radius={[6, 6, 0, 0]} />
                        <Bar yAxisId="right" dataKey="avgPrice" fill="#C9A84C" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* ── G) INTERACTIVE MAP ───────────────────────────────────── */}
        {hasData && (
          <motion.div variants={fadeUp}>
            <div className="mb-5">
              <h2 className="text-2xl font-extrabold text-foreground">الخريطة التفاعلية</h2>
              <p className="text-sm text-muted-foreground mt-0.5">توزيع الإعلانات العقارية على الخريطة — الدوائر الأكبر تعني نشاطاً أعلى</p>
            </div>
            <Card className="rounded-2xl overflow-hidden border-border shadow-sm">
              <CardContent className="p-0">
                <Suspense fallback={<Skeleton className="w-full h-[480px]" />}>
                  <ListingsMap
                    cityData={insights?.byCity ?? []}
                    onCityClick={city => {
                      setFilters(f => ({ ...f, city }));
                      setApplied(f => ({ ...f, city }));
                    }}
                    height={480}
                  />
                </Suspense>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground text-center mt-2">
              انقر على دائرة مدينة لفلترة التحليلات على تلك المدينة
            </p>
          </motion.div>
        )}

        {/* ── H) LISTINGS SHOWCASE ─────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-extrabold text-foreground">
                {active ? "نتائج البحث" : "أحدث الإعلانات"}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {active ? "الإعلانات المطابقة لفلترك الحالي" : "أحدث العقارات المضافة على المنصة"}
              </p>
            </div>
            <Link href={`/listings${qs ? `?${qs}` : ""}`}>
              <button className="flex items-center gap-2 text-primary font-semibold text-sm hover:underline">
                عرض الكل
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
          </div>

          {loadingListings ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-border bg-card">
                  <Skeleton className="h-44 w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-6 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (listingsData?.data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Building2 className="w-12 h-12 opacity-30" />
              <p className="text-lg font-medium">لا توجد إعلانات تطابق البحث</p>
              <Link href="/listings/new">
                <button className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold mt-2">
                  أضف أول إعلان
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(listingsData?.data ?? []).map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </motion.div>

        {/* ── I) CTA SECTION ───────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/listings/new">
              <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-white cursor-pointer hover:shadow-lg transition-all group">
                <Building2 className="w-8 h-8 mb-3 opacity-80 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-lg mb-1">أضف عقارك</h3>
                <p className="text-sm opacity-75">انشر إعلانك وتواصل مع آلاف المهتمين</p>
                <div className="flex items-center gap-1 mt-3 text-sm font-semibold">
                  ابدأ الآن <ArrowLeft className="w-4 h-4" />
                </div>
              </div>
            </Link>
            <Link href="/marketers">
              <div className="bg-gradient-to-br from-sidebar to-sidebar/90 rounded-2xl p-6 text-white cursor-pointer hover:shadow-lg transition-all group">
                <Users className="w-8 h-8 mb-3 opacity-80 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-lg mb-1">المسوّقون العقاريون</h3>
                <p className="text-sm opacity-75">تواصل مع أفضل المسوّقين المعتمدين</p>
                <div className="flex items-center gap-1 mt-3 text-sm font-semibold">
                  استعرض الملفات <ArrowLeft className="w-4 h-4" />
                </div>
              </div>
            </Link>
            <Link href="/requests/new">
              <div className="bg-gradient-to-br from-accent/80 to-accent/60 rounded-2xl p-6 text-white cursor-pointer hover:shadow-lg transition-all group">
                <Search className="w-8 h-8 mb-3 opacity-80 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-lg mb-1">اطلب عقاراً</h3>
                <p className="text-sm opacity-75">أخبرنا عن احتياجك وسنجد لك الأفضل</p>
                <div className="flex items-center gap-1 mt-3 text-sm font-semibold">
                  قدّم طلبك <ArrowLeft className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>
        </motion.div>

      </motion.div>
    </Layout>
  );
}
