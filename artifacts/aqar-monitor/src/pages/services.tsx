import { SAUDI_REGIONS_LIST } from "@/lib/saudi-geo";
import { PlatformRatingWidget } from "@/components/platform-rating-widget";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { getImageSrc } from "@/lib/utils";
import {
  Search, PlusCircle, MapPin, Star, Verified,
  Wrench, ArrowLeft, Filter, Pencil, Trash2,
} from "lucide-react";

const CATEGORIES = [
  "بناء وتشييد", "تشطيبات وديكور", "كهرباء ومياه", "تكييف وتبريد", "دهانات", "أرضيات",
  "مطابخ", "مصاعد", "نظافة ومكافحة حشرات", "تصميم داخلي", "تصميم معماري", "تقييم عقاري",
  "إدارة عقارات", "تصوير عقاري", "صيانة", "مقاولات", "مواد بناء",
];


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
  userId?: number | null;
}

export default function Services() {
  const { isAuthenticated, user } = useAuth();
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
    const raw = images.split("\n").map(u => u.trim()).filter(Boolean)[0] ?? null;
    return getImageSrc(raw);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإعلان نهائياً؟")) return;
    const res = await fetch(`/api/service-providers/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      setProviders(prev => prev.filter(p => p.id !== id));
    } else {
      alert("فشل الحذف، يرجى المحاولة مجدداً");
    }
  };

  const canManage = (p: Provider) =>
    user?.role === "admin" || (user && p.userId === user.id);

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        {/* Header Hero */}
        <div
          className="relative rounded-[2rem] overflow-hidden text-sidebar-foreground shadow-xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8"
          style={{ background: "linear-gradient(135deg, #0F1C3F 0%, #0F1C3F 60%, #0F7BA0 100%)" }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.04 }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_top_left,rgba(201,168,76,0.10),transparent)] pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">دليل مزودي الخدمات <span className="text-accent">العقارية</span></h1>
            <p className="text-lg text-white/85 leading-relaxed">
              ابحث عن أفضل شركات المقاولات، مكاتب التصميم، ومزودي خدمات الصيانة الموثوقين في منطقتك.
            </p>
          </div>
          {isAuthenticated && (
            <Button asChild size="lg" className="relative z-10 rounded-xl h-14 px-8 bg-accent text-accent-foreground hover:bg-accent/90 border-none shadow-lg shadow-accent/20 shrink-0 font-bold text-lg">
              <Link href="/services/new">
                <PlusCircle className="w-5 h-5 ml-2" />
                أضف نشاطك التجاري
              </Link>
            </Button>
          )}
        </div>

        {/* Filters Section */}
        <div className="bg-card p-4 sm:p-6 rounded-3xl border border-border shadow-sm space-y-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <Input placeholder="ابحث عن اسم شركة أو نشاط..." value={search} onChange={e => setSearch(e.target.value)} className="pr-12 h-14 rounded-2xl text-lg font-medium bg-muted/30 border-border/80" />
            </div>
            <div className="relative sm:w-64 shrink-0">
              <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <select value={city} onChange={e => setCity(e.target.value)} className="w-full h-14 pr-12 rounded-2xl border border-border/80 bg-muted/30 text-base font-medium appearance-none outline-none focus:ring-2 focus:ring-primary/20" style={{ color: "#111827" }}>
                <option value="">جميع المناطق</option>
                {SAUDI_REGIONS_LIST.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <Button type="submit" size="lg" className="h-14 rounded-2xl px-8 font-bold text-base shrink-0 hidden sm:flex">
              بحث
            </Button>
          </form>

          {/* Categories Pill Bar */}
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1 mask-edges">
              <button
                onClick={() => setCategory("")}
                className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${!category ? "bg-primary text-white shadow-md" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
              >
                الكل
              </button>
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c === category ? "" : c)}
                  className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${c === category ? "bg-primary text-white shadow-md" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Providers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden h-[340px] flex flex-col">
                <Skeleton className="h-44 w-full rounded-none shrink-0" />
                <div className="p-5 space-y-4 flex-1">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-card rounded-3xl border border-border border-dashed">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/15">
              <Wrench className="w-10 h-10 text-primary/60" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-foreground">لا توجد خدمات متاحة</h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-md">لم نجد مزودي خدمة يطابقون بحثك. كن أنت الأول في المنطقة!</p>
            {isAuthenticated ? (
              <Button asChild size="lg" className="rounded-xl gap-2 font-bold px-8">
                <Link href="/services/new"><PlusCircle className="w-5 h-5" />سجل نشاطك الآن</Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="rounded-xl font-bold px-8">
                <Link href="/signup">إنشاء حساب جديد</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {providers.map(p => {
              const img = getFirstImage(p.portfolioImages);
              return (
                <Card key={p.id} className="border-border rounded-[20px] overflow-hidden hover-premium-shadow group bg-card flex flex-col h-full">
                  {/* Image Header */}
                  <div className="h-48 bg-muted relative shrink-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none" />
                    {img ? (
                      <img src={img} alt={p.businessName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-secondary/80 to-muted/50">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl border border-primary/15 flex items-center justify-center">
                          <Wrench className="w-7 h-7 text-primary/50" />
                        </div>
                      </div>
                    )}
                    
                    <div className="absolute top-4 right-4 z-20">
                      <Badge className="bg-white/90 text-foreground border-white/20 backdrop-blur-md shadow-sm font-bold">
                        {p.category}
                      </Badge>
                    </div>
                    
                    {p.verified && (
                      <div className="absolute top-4 left-4 z-20">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary text-white shadow-sm flex items-center gap-1">
                          <Verified className="w-3.5 h-3.5" />موثّق
                        </span>
                      </div>
                    )}

                    <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 text-white text-sm font-medium">
                      <MapPin className="w-4 h-4 text-accent" />
                      {p.city}
                    </div>
                  </div>
                  
                  <CardContent className="p-5 flex flex-col flex-1">
                    <h3 className="text-xl font-bold text-foreground leading-tight mb-2 group-hover:text-primary transition-colors">{p.businessName}</h3>
                    
                    {(p.ratingAvg ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5 text-sm mb-3">
                        <div className="flex items-center text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-md font-bold">
                          <Star className="w-3.5 h-3.5 fill-yellow-500 ml-1" />
                          {p.ratingAvg?.toFixed(1)}
                        </div>
                        <span className="text-muted-foreground text-xs font-medium">({p.ratingCount} تقييم)</span>
                      </div>
                    )}
                    
                    {p.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4">{p.description}</p>
                    )}
                    
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/60">
                      {p.startingPrice ? (
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">تبدأ الأسعار من</p>
                          <p className="text-lg font-extrabold text-foreground">{p.startingPrice.toLocaleString("en-US")} <span className="text-sm font-medium text-muted-foreground">ر.س</span></p>
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-muted-foreground">السعر حسب الطلب</p>
                      )}
                      
                      <div className="flex items-center gap-1">
                        {canManage(p) && (
                          <>
                            <Button asChild variant="ghost" size="icon" className="rounded-xl h-9 w-9 hover:bg-primary/8 hover:text-primary transition-colors" title="تعديل">
                              <Link href="/services/dashboard">
                                <Pencil className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-xl h-9 w-9 hover:bg-destructive/10 hover:text-destructive transition-colors"
                              title="حذف"
                              onClick={(e) => { e.preventDefault(); void handleDelete(p.id); }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button asChild variant="ghost" className="rounded-xl h-9 px-3 hover:bg-primary/5 hover:text-primary transition-colors">
                          <Link href={`/services/${p.id}`}>
                            <ArrowLeft className="w-5 h-5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <PlatformRatingWidget />
    </Layout>
  );
}
