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
  { value: "daily_rent", label: "إيجار يومي" },
  { value: "monthly_rent", label: "إيجار شهري" },
  { value: "investment", label: "استثماري" },
  { value: "auction", label: "مزاد" },
];
const CITIES = ["الرياض", "جدة", "الدمام", "مكة المكرمة", "المدينة المنورة", "الخبر", "تبوك", "أبها", "الطائف", "بريدة"];

interface ListingsResponse {
  data: ListingCardData[];
  total: number;
  page: number;
  pageSize: number;
}

export default function Listings() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [listingType, setListingType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<ListingsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const buildQuery = (pg = page) => {
    const params = new URLSearchParams();
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
  }, [city, district, propertyType, listingType, minPrice, maxPrice, bedrooms]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    void fetchListings(1);
    setPage(1);
  };

  const resetFilters = () => {
    setCity(""); setDistrict(""); setPropertyType(""); setListingType(""); setMinPrice(""); setMaxPrice(""); setBedrooms("");
  };

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;
  const activeFiltersCount = [city, district, propertyType, listingType, minPrice, maxPrice, bedrooms].filter(Boolean).length;

  return (
    <Layout>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">العقارات</h1>
            <p className="text-muted-foreground mt-1">
              {data ? `${data.total.toLocaleString("ar-SA")} إعلان متاح` : "جارٍ التحميل…"}
            </p>
          </div>
          {isAuthenticated && (
            <Button asChild className="gap-2 rounded-xl">
              <Link href="/listings/new">
                <PlusCircle className="w-4 h-4" />
                نشر إعلان
              </Link>
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="ابحث بالحي أو المنطقة…"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="pr-9 h-11 rounded-xl"
            />
          </div>
          <Button type="button" variant="outline" onClick={() => setShowFilters(!showFilters)} className={`gap-2 rounded-xl h-11 ${activeFiltersCount > 0 ? "border-primary text-primary" : ""}`}>
            <SlidersHorizontal className="w-4 h-4" />
            فلاتر{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ""}
          </Button>
          {activeFiltersCount > 0 && (
            <Button type="button" variant="ghost" onClick={resetFilters} className="rounded-xl h-11 px-3">
              <X className="w-4 h-4" />
            </Button>
          )}
        </form>

        {/* Filters Panel */}
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 bg-muted/30 border border-border/50 rounded-2xl">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">المدينة</label>
              <select value={city} onChange={(e) => setCity(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm">
                <option value="">الكل</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">نوع العقار</label>
              <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm">
                <option value="">الكل</option>
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">الغرض</label>
              <select value={listingType} onChange={(e) => setListingType(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm">
                <option value="">الكل</option>
                {LISTING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">السعر من</label>
              <Input type="number" placeholder="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="h-9 rounded-lg" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">السعر إلى</label>
              <Input type="number" placeholder="∞" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="h-9 rounded-lg" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">غرف النوم</label>
              <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm">
                <option value="">الكل</option>
                {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}+</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Listing Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-border/50">
                <Skeleton className="h-44 w-full rounded-none" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-6 w-1/2 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد إعلانات</h3>
            <p className="text-muted-foreground mb-6">لم يتم العثور على عقارات بهذه المعايير</p>
            {activeFiltersCount > 0 && (
              <Button variant="outline" onClick={resetFilters} className="rounded-xl">إزالة الفلاتر</Button>
            )}
            {isAuthenticated && (
              <Button asChild className="mt-3 rounded-xl">
                <Link href="/listings/new">نشر أول إعلان</Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data?.data.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage(p => p - 1); void fetchListings(page - 1); }} className="rounded-xl gap-1">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">صفحة {page} من {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => { setPage(p => p + 1); void fetchListings(page + 1); }} className="rounded-xl gap-1">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
