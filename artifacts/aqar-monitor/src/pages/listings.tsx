import { SAUDI_REGIONS_LIST, getMuhafazat, getAllAhyaaForCity, ALL_AHYAA } from "@/lib/saudi-geo";
import { PlatformRatingWidget } from "@/components/platform-rating-widget";
import { PROPERTY_TYPE_GROUPS, PROPERTY_TYPES_FLAT } from "@/lib/property-types";
import { LISTING_TYPE_GROUPS } from "@/lib/listing-types";
import { useState, useEffect, type FormEvent } from "react";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { useAuth } from "@/contexts/auth-context";
import {
  Search, SlidersHorizontal, PlusCircle, Building2,
  ChevronLeft, ChevronRight, X, MapPin, BarChart3,
  ShieldCheck, Zap,
} from "lucide-react";



interface ListingsResponse {
  data: ListingCardData[];
  total: number;
  page: number;
  pageSize: number;
}

export default function Listings() {
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();
  const [showFilters, setShowFilters] = useState(false);

  // Read URL params on mount
  const _init = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();

  // Filters — التسلسل الإداري: منطقة → محافظة → حي
  const [region, setRegion]     = useState(_init.get("region") ?? "");
  const [city, setCity]         = useState(_init.get("city") ?? "");
  const [district, setDistrict] = useState(_init.get("district") ?? "");
  const [search, setSearch]     = useState(_init.get("q") ?? "");
  const [propertyType, setPropertyType] = useState("");
  const [listingType, setListingType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<ListingsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "الإعلانات العقارية – عقار إنسايت";
    return () => { document.title = "عقار إنسايت"; };
  }, []);

  // Sync URL params on navigation (hero search → listings)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const q = p.get("q") ?? "";
    setSearch(q);
    const r = p.get("region") ?? "";
    const c = p.get("city") ?? "";
    const d = p.get("district") ?? "";
    if (r) setRegion(r);
    if (c) setCity(c);
    if (d) setDistrict(d);
    if (r || c) setShowFilters(true);
  }, [location]);

  const buildQuery = (pg = page) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (region) params.set("region", region);
    if (city) params.set("city", city);
    if (district) params.set("district", district);
    if (propertyType) params.set("propertyType", propertyType);
    if (listingType) params.set("listingType", listingType);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (bedrooms) params.set("bedrooms", bedrooms);
    params.set("page", String(pg));
    params.set("limit", "12");
    params.set("sort", "newest");
    return params.toString();
  };

  const fetchListings = async (pg = page) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings?${buildQuery(pg)}`, { credentials: "include" });
      const json = await res.json() as ListingsResponse;
      setData(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchListings(1);
    setPage(1);
  }, [region, city, district, search, propertyType, listingType, minPrice, maxPrice, bedrooms]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    void fetchListings(1);
    setPage(1);
  };

  const resetFilters = () => {
    setRegion(""); setCity(""); setDistrict("");
    setSearch(""); setPropertyType(""); setListingType(""); setMinPrice(""); setMaxPrice(""); setBedrooms("");
  };

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;
  const activeFiltersCount = [region, city, district, search, propertyType, listingType, minPrice, maxPrice, bedrooms].filter(Boolean).length;

  const handleDeleteListing = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإعلان نهائياً؟")) return;
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      setData(prev => prev ? { ...prev, data: prev.data.filter(l => l.id !== id), total: prev.total - 1 } : prev);
    } else {
      alert("فشل الحذف، يرجى المحاولة مجدداً");
    }
  };

  const canEditListing = (listing: { userId?: number | null }) =>
    !!(user?.role === "admin" || (user && listing.userId === user.id));

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        {/* Header Hero — Ultra Premium */}
        <div
          className="relative rounded-[2rem] overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #060e1b 0%, #0F1C3F 45%, #0a2a4a 100%)",
            boxShadow: "0 4px 24px rgba(6,14,27,0.18)",
          }}
        >
          {/* Decorative grid */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
          {/* Radial glow — right */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 55% 70% at 5% 50%, rgba(15,123,160,0.28) 0%, transparent 70%)" }} />
          {/* Radial glow — bottom */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(15,123,160,0.14) 0%, transparent 65%)" }} />
          {/* Animated orb */}
          <div className="absolute pointer-events-none rounded-full animate-pulse"
            style={{ width: 300, height: 300, top: "-80px", left: "15%", background: "radial-gradient(circle, rgba(15,123,160,0.15) 0%, transparent 70%)", filter: "blur(50px)" }} />

          <div className="relative z-10 p-8 md:p-12">
            {/* Top row: badge + button */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
              <div>
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider"
                  style={{ background: "rgba(15,123,160,0.20)", border: "1px solid rgba(15,123,160,0.40)", color: "rgba(148,199,220,1)" }}>
                  <Building2 className="w-3.5 h-3.5" />
                  سوق العقارات السعودي
                </div>
                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-3 tracking-tight">
                  تصفح العقارات
                </h1>
                {/* Description */}
                <p className="text-[15px] md:text-[16px] font-medium leading-relaxed max-w-xl"
                  style={{ color: "rgba(255,255,255,0.65)" }}>
                  آلاف الإعلانات العقارية في كل مناطق المملكة — ابحث وقارن وتواصل مع أفضل المسوقين بكل سهولة
                </p>

                {/* Count pill */}
                <div className="mt-4 inline-flex items-center gap-2"
                  style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", fontWeight: 600 }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  {data ? `${data.total.toLocaleString("en-US")} عقار متاح حالياً` : "جارٍ التحميل…"}
                </div>
              </div>

              {/* CTA Button — distinctive golden — always visible */}
              <Link href={isAuthenticated ? "/listings/new" : "/login"} className="shrink-0">
                <button
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-black text-sm transition-all duration-300 whitespace-nowrap"
                  style={{
                    background: "rgba(245,158,11,0.13)",
                    border: "1.5px solid rgba(245,158,11,0.55)",
                    boxShadow: "0 4px 22px rgba(245,158,11,0.28), inset 0 1px 0 rgba(255,255,255,0.07)",
                    backdropFilter: "blur(8px)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(245,158,11,0.5), 0 0 0 1px rgba(245,158,11,0.45)";
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,158,11,0.20)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 22px rgba(245,158,11,0.28), inset 0 1px 0 rgba(255,255,255,0.07)";
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,158,11,0.13)";
                  }}
                >
                  <PlusCircle className="w-4 h-4 flex-shrink-0"
                    style={{ color: "#f59e0b", filter: "drop-shadow(0 0 5px rgba(245,158,11,0.7))" }} />
                  <span style={{
                    background: "linear-gradient(135deg, #fde68a, #f59e0b, #d97706)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}>
                    أنشر عقارك الآن
                  </span>
                </button>
              </Link>
            </div>

            {/* Feature chips row */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: MapPin,      label: "تغطية كل مناطق المملكة", color: "#0F7BA0" },
                { icon: BarChart3,   label: "تحليلات سوقية مجانية",   color: "#10b981" },
                { icon: ShieldCheck, label: "إعلانات موثّقة",          color: "#8b5cf6" },
                { icon: Zap,         label: "نشر فوري وسريع",          color: "#f59e0b" },
              ].map(f => (
                <div key={f.label}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-semibold"
                  style={{
                    background: `${f.color}12`,
                    border: `1px solid ${f.color}30`,
                    color: "rgba(255,255,255,0.75)",
                  }}>
                  <f.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: f.color }} />
                  {f.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="ابحث بالعقار أو الحي أو المدينة…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-12 h-14 rounded-2xl text-lg font-medium border-border/80 shadow-sm focus:border-primary focus:ring-primary/20"
              />
            </div>
            <Button type="button" variant="outline" size="lg" onClick={() => setShowFilters(!showFilters)} className={`gap-2 rounded-2xl h-14 px-6 font-bold ${activeFiltersCount > 0 ? "border-primary text-primary bg-primary/5" : "border-border shadow-sm"}`}>
              <SlidersHorizontal className="w-5 h-5" />
              فلاتر متقدمة {activeFiltersCount > 0 && <span className="bg-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full mr-1">{activeFiltersCount}</span>}
            </Button>
            {activeFiltersCount > 0 && (
              <Button type="button" variant="ghost" size="icon" onClick={resetFilters} className="rounded-2xl h-14 w-14 hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0" title="مسح الفلاتر">
                <X className="w-6 h-6" />
              </Button>
            )}
          </form>

          {/* Expanded Filters Panel */}
          {showFilters && (
            <div className="p-6 bg-card border border-border shadow-sm rounded-3xl animate-in fade-in slide-in-from-top-4 duration-300 space-y-4">
              {/* Row 1 — التسلسل الإداري */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-foreground">المنطقة</label>
                  <select value={region} onChange={(e) => { setRegion(e.target.value); setCity(""); setDistrict(""); }}
                    className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none">
                    <option value="">جميع المناطق</option>
                    {SAUDI_REGIONS_LIST.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-foreground">المحافظة</label>
                  <select value={city} onChange={(e) => { setCity(e.target.value); setDistrict(""); }} disabled={!region}
                    className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50 disabled:cursor-not-allowed">
                    <option value="">{region ? "جميع المحافظات" : "اختر المنطقة أولاً"}</option>
                    {getMuhafazat(region).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-foreground">الحي</label>
                  {(() => {
                    const ahyaa = city ? getAllAhyaaForCity(region, city) : ALL_AHYAA;
                    const listId = "listings-ahyaa-list";
                    return (
                      <>
                        <datalist id={listId}>
                          {ahyaa.map(h => <option key={h} value={h} />)}
                          <option value="أخرى" />
                        </datalist>
                        <input
                          type="text"
                          list={listId}
                          placeholder={city ? "اكتب أو اختر الحي…" : "جميع الأحياء"}
                          value={district}
                          onChange={e => setDistrict(e.target.value)}
                          className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                          style={{ color: "#111827" }}
                        />
                      </>
                    );
                  })()}
                </div>
              </div>
              {/* Row 2 — نوع + غرض + سعر + غرف */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-foreground">نوع العقار</label>
                  <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none">
                    <option value="">جميع الأنواع</option>
                    {PROPERTY_TYPE_GROUPS.map(g => (
                      <optgroup key={g.label} label={`── ${g.label}`}>
                        {g.types.map(t => <option key={t} value={t}>{t}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-foreground">الغرض</label>
                  <select value={listingType} onChange={(e) => setListingType(e.target.value)} className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none">
                    <option value="">الكل</option>
                    {LISTING_TYPE_GROUPS.map(g => (
                      <optgroup key={g.label} label={`── ${g.label}`}>
                        {g.types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-foreground">السعر (من)</label>
                  <Input type="number" placeholder="مثال: 500,000" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="h-11 rounded-xl font-medium" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-foreground">غرف النوم</label>
                  <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none">
                    <option value="">الكل</option>
                    {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>+{n}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Listing Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-3xl overflow-hidden border border-border shadow-sm bg-card h-[380px] flex flex-col">
                <Skeleton className="h-48 w-full rounded-none shrink-0" />
                <div className="p-5 space-y-4 flex-1 flex flex-col">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="mt-auto">
                    <Skeleton className="h-8 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : data?.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-card rounded-3xl border border-border border-dashed">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <Building2 className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">لا توجد عقارات مطابقة</h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-md">لم يتم العثور على عقارات تتطابق مع معايير البحث الخاصة بك. جرب تغيير الفلاتر.</p>
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="lg" onClick={resetFilters} className="rounded-xl px-8 font-bold border-border">مسح جميع الفلاتر</Button>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data?.data.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  canEdit={canEditListing(listing)}
                  onDelete={handleDeleteListing}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-6 border-t border-border">
                <Button 
                  variant="outline" 
                  size="lg" 
                  disabled={page >= totalPages} 
                  onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                  className="rounded-xl w-12 h-12 p-0 shadow-sm border-border hover:bg-muted"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
                <div className="px-6 py-2 rounded-xl bg-card border border-border shadow-sm font-semibold text-foreground">
                  صفحة {page} من {totalPages}
                </div>
                <Button 
                  variant="outline" 
                  size="lg" 
                  disabled={page <= 1} 
                  onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                  className="rounded-xl w-12 h-12 p-0 shadow-sm border-border hover:bg-muted"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      <PlatformRatingWidget />
    </Layout>
  );
}