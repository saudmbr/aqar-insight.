import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import {
  Search, PlusCircle, MapPin, Star, Verified,
  Phone, MessageSquare, Wrench,
} from "lucide-react";

const CATEGORIES = [
  "بناء وتشييد", "تشطيبات وديكور", "كهرباء ومياه", "تكييف وتبريد", "دهانات", "أرضيات",
  "مطابخ", "مصاعد", "نظافة ومكافحة حشرات", "تصميم داخلي", "تصميم معماري", "تقييم عقاري",
  "إدارة عقارات", "تصوير عقاري", "صيانة", "مقاولات", "مواد بناء",
];
const CITIES = ["الرياض", "جدة", "الدمام", "مكة المكرمة", "المدينة المنورة", "الخبر", "تبوك", "أبها", "الطائف", "بريدة"];

interface Provider {
  id: number;
  businessName: string;
  category: string;
  city: string;
  description?: string | null;
  startingPrice?: number | null;
  portfolioImages?: string | null;
  verified?: boolean | null;
  ratingAvg?: number | null;
  ratingCount?: number | null;
}

export default function Services() {
  const { isAuthenticated } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");

  const fetchProviders = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (city) params.set("city", city);
    if (search) params.set("search", search);
    const res = await fetch(`/api/service-providers?${params}`, { credentials: "include" });
    if (res.ok) setProviders(await res.json() as Provider[]);
    setLoading(false);
  };

  useEffect(() => { void fetchProviders(); }, [category, city]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchProviders();
  };

  const getFirstImage = (images?: string | null) => {
    if (!images) return null;
    return images.split("\n").map(u => u.trim()).filter(Boolean)[0] ?? null;
  };

  return (
    <Layout>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">سوق الخدمات</h1>
            <p className="text-muted-foreground mt-1">جميع الخدمات العقارية والإنشائية في مكان واحد</p>
          </div>
          {isAuthenticated && (
            <Button asChild className="gap-2 rounded-xl">
              <Link href="/services/new">
                <PlusCircle className="w-4 h-4" />
                أضف خدمتك
              </Link>
            </Button>
          )}
        </div>

        {/* Category Quick Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setCategory("")}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${!category ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border/60 text-muted-foreground hover:text-foreground"}`}
          >
            الكل
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c === category ? "" : c)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${c === category ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border/60 text-muted-foreground hover:text-foreground"}`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Search & City filter */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input placeholder="ابحث باسم النشاط…" value={search} onChange={e => setSearch(e.target.value)} className="pr-9 h-11 rounded-xl" />
          </div>
          <select value={city} onChange={e => setCity(e.target.value)} className="h-11 rounded-xl border border-input bg-background px-3 text-sm">
            <option value="">كل المدن</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </form>

        {/* Providers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/50 overflow-hidden">
                <Skeleton className="h-40 w-full rounded-none" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Wrench className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد خدمات بعد</h3>
            <p className="text-muted-foreground mb-6">كن أول من يضيف خدمته في المنطقة</p>
            {isAuthenticated && (
              <Button asChild className="rounded-xl gap-2">
                <Link href="/services/new"><PlusCircle className="w-4 h-4" />أضف خدمتك</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map(p => {
              const img = getFirstImage(p.portfolioImages);
              return (
                <Card key={p.id} className="border-border/50 rounded-2xl overflow-hidden hover:shadow-lg hover:border-border/80 transition-all duration-200">
                  {/* Image */}
                  <div className="h-40 bg-muted/30 relative">
                    {img ? (
                      <img src={img} alt={p.businessName} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Wrench className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                    )}
                    {p.verified && (
                      <div className="absolute top-3 right-3">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 flex items-center gap-1">
                          <Verified className="w-3 h-3" />موثّق
                        </span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-foreground leading-tight">{p.businessName}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">{p.category}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{p.city}</span>
                      </div>
                    </div>
                    {(p.ratingAvg ?? 0) > 0 && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{p.ratingAvg?.toFixed(1)}</span>
                        <span className="text-muted-foreground text-xs">({p.ratingCount} تقييم)</span>
                      </div>
                    )}
                    {p.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                    )}
                    {p.startingPrice && (
                      <p className="text-sm font-semibold text-foreground">يبدأ من {p.startingPrice.toLocaleString("ar-SA")} ر.س</p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Button asChild variant="outline" size="sm" className="flex-1 rounded-xl gap-1.5 h-9">
                        <Link href={`/services/${p.id}`}>
                          <span>التفاصيل</span>
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
