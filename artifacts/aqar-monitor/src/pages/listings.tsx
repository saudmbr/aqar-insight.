import { SAUDI_CITIES as CITIES } from "@/lib/saudi-cities";
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
  ChevronLeft, ChevronRight, X,
} from "lucide-react";

const PROPERTY_TYPES = [
  "شقة", "فيلا", "دور", "أرض", "عمارة", "مكتب", "محل", "مستودع",
  "مزرعة", "شاليه", "غرفة", "سكن عمالة", "عقار تجاري", "عقار صناعي", "مشروع تطويري",
];
const LISTING_TYPES = [
  { value: "sale", label: "للبيع" },
  { value: "rent", label: "للإيجار" },
  { value: "monthly_rent", label: "إيجار شهري" },
  { value: "investment", label: "استثماري" },
  { value: "auction", label: "مزاد" },
];


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

  // Read ?q= from URL on mount
  const urlSearch = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("q") ?? "";

  // Filters
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [search, setSearch] = useState(urlSearch);
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

  // Sync URL ?q= changes (e.g. from the top-bar search)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q") ?? "";
    setSearch(q);
  }, [location]);

  const buildQuery = (pg = page) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
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
  }, [city, district, search, propertyType, listingType, minPrice, maxPrice, bedrooms]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    void fetchListings(1);
    setPage(1);
  };

  const resetFilters = () => {
    setCity(""); setDistrict(""); setSearch(""); setPropertyType(""); setListingType(""); setMinPrice(""); setMaxPrice(""); setBedrooms("");
  };

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;
  const activeFiltersCount = [city, district, search, propertyType, listingType, minPrice, maxPrice, bedrooms].filter(Boolean).length;

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
        {/* Header Hero */}
        <div
          className="relative rounded-[2rem] overflow-hidden p-8 md:p-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
          style={{ background: "linear-gradient(135deg, #0F1C3F 0%, #0F1C3F 60%, #0F7BA0 100%)" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_top_left,rgba(15,123,160,0.25),transparent)] pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/25 text-white/90 px-3 py-1 rounded-full text-xs font-semibold mb-3">
              <Building2 className="w-3.5 h-3.5" />
              سوق العقارات السعودي
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">تصفح العقارات</h1>
            <p className="text-white/80 mt-2 text-base font-medium">
              {data ? `${data.total.toLocaleString("en-US")} عقار متاح حالياً` : "جارٍ تحميل العقارات…"}
            </p>
          </div>
          {isAuthenticated && (
            <Button asChild size="lg" className="relative z-10 gap-2 rounded-xl shrink-0 whitespace-nowrap px-8 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold shadow-none">
              <Link href="/listings/new">
                <PlusCircle className="w-5 h-5" />
                نشر إعلان عقاري
              </Link>
            </Button>
          )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 p-6 bg-card border border-border shadow-sm rounded-3xl animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">المدينة</label>
                <select value={city} onChange={(e) => setCity(e.target.value)} className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="">جميع المدن</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">النوع</label>
                <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="">جميع الأنواع</option>
                  {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">الغرض</label>
                <select value={listingType} onChange={(e) => setListingType(e.target.value)} className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="">الكل</option>
                  {LISTING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">السعر (من)</label>
                <Input type="number" placeholder="مثال: 500,000" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="h-11 rounded-xl font-medium" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">السعر (إلى)</label>
                <Input type="number" placeholder="مثال: 2,000,000" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="h-11 rounded-xl font-medium" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">غرف النوم</label>
                <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="">الكل</option>
                  {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>+{n}</option>)}
                </select>
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
    </Layout>
  );
}