import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { useAuth } from "@/contexts/auth-context";
import { formatCurrency } from "@/lib/utils";
import {
  Building2, Heart, FileText, PlusCircle, Edit, Trash2,
  MapPin, Eye, LayoutDashboard,
} from "lucide-react";
import type { Listing } from "@workspace/db";

const STATUS_LABELS: Record<string, string> = {
  active: "نشط", sold: "مُباع", rented: "مُؤجّر", cancelled: "ملغي", pending: "قيد المراجعة",
};
const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  sold: "bg-blue-500/10 text-blue-700 border-blue-200",
  rented: "bg-purple-500/10 text-purple-700 border-purple-200",
  cancelled: "bg-rose-500/10 text-rose-700 border-rose-200",
  pending: "bg-amber-500/10 text-amber-700 border-amber-200",
};

type Tab = "overview" | "listings" | "favorites" | "requests";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("overview");

  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<{ favoriteId: number; listing: ListingCardData }[]>([]);
  const [myRequests, setMyRequests] = useState<{ id: number; title: string; category: string; city: string; status: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    const loadAll = async () => {
      setLoading(true);
      const [lRes, fRes, rRes] = await Promise.all([
        fetch("/api/listings/my/listings", { credentials: "include" }),
        fetch("/api/favorites", { credentials: "include" }),
        fetch("/api/customer-requests/my/requests", { credentials: "include" }),
      ]);
      if (lRes.ok) setMyListings(await lRes.json() as Listing[]);
      if (fRes.ok) setFavorites(await fRes.json() as typeof favorites);
      if (rRes.ok) setMyRequests(await rRes.json() as typeof myRequests);
      setLoading(false);
    };
    void loadAll();
  }, [isAuthenticated]);

  const deleteMyListing = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإعلان؟")) return;
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) setMyListings(l => l.filter(x => x.id !== id));
  };

  const removeFavorite = async (listingId: number) => {
    await fetch(`/api/favorites/${listingId}/toggle`, { method: "POST", credentials: "include" });
    setFavorites(f => f.filter(x => x.listing.id !== listingId));
  };

  const deleteRequest = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطلب؟")) return;
    const res = await fetch(`/api/customer-requests/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) setMyRequests(r => r.filter(x => x.id !== id));
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "overview", label: "نظرة عامة", icon: <LayoutDashboard className="w-5 h-5" />, count: 0 },
    { key: "listings", label: "إعلاناتي", icon: <Building2 className="w-5 h-5" />, count: myListings.length },
    { key: "favorites", label: "المفضلة", icon: <Heart className="w-5 h-5" />, count: favorites.length },
    { key: "requests", label: "طلباتي", icon: <FileText className="w-5 h-5" />, count: myRequests.length },
  ];

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        {/* Header Hero */}
        <div
          className="relative rounded-[2rem] overflow-hidden p-8 md:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
          style={{ background: "linear-gradient(135deg, #0F1C3F 0%, #0F1C3F 65%, #0F7BA0 100%)" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_100%_at_top_left,rgba(15,123,160,0.2),transparent)] pointer-events-none" />
          <div className="relative z-10">
            <p className="text-white/70 text-sm font-medium mb-1">مرحباً بك،</p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">{user?.fullName ?? user?.username}</h1>
            <p className="text-white/75 mt-2 text-sm">لوحتك العقارية الشخصية — أدِر إعلاناتك، مفضلتك، وطلباتك</p>
          </div>
          <Button asChild className="relative z-10 gap-2 rounded-xl h-12 px-6 shrink-0 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold shadow-none">
            <Link href="/listings/new"><PlusCircle className="w-5 h-5" />نشر إعلان جديد</Link>
          </Button>
        </div>

        {/* Premium Tab Bar */}
        <div className="flex gap-2 p-1.5 bg-muted/60 rounded-2xl w-fit border border-border">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                tab === t.key 
                  ? "bg-white text-primary shadow-sm border border-border/50" 
                  : "text-muted-foreground hover:text-foreground hover:bg-black/5"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.count > 0 && (
                <span className={`text-xs rounded-full px-2 py-0.5 ${tab === t.key ? "bg-primary/10 text-primary" : "bg-black/10 text-muted-foreground"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {tab === "overview" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <StatCard icon={<Building2 className="w-7 h-7" />} label="إجمالي إعلاناتي" value={String(myListings.length)} color="text-primary" bg="bg-primary/10" border="border-primary/20" />
                  <StatCard icon={<Eye className="w-7 h-7" />} label="إجمالي المشاهدات" value={myListings.reduce((s, l) => s + (l.views ?? 0), 0).toLocaleString("en-US")} color="text-accent" bg="bg-accent/10" border="border-accent/20" />
                  <StatCard icon={<Heart className="w-7 h-7" />} label="العقارات المفضّلة" value={String(favorites.length)} color="text-destructive" bg="bg-destructive/10" border="border-destructive/20" />
                </div>

                {myListings.length === 0 && favorites.length === 0 && (
                  <EmptyState icon={<Building2 className="w-10 h-10" />} title="ابدأ بنشر أول إعلان" message="انشر إعلانك العقاري الأول وابدأ في استقبال المهتمين بسهولة" cta={{ label: "نشر إعلان جديد", href: "/listings/new" }} />
                )}

                {myListings.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-6">آخر إعلاناتي</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {myListings.slice(0, 4).map(l => <ListingCard key={l.id} listing={l as ListingCardData} />)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* My Listings Tab */}
            {tab === "listings" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-sm">
                  <p className="font-semibold text-foreground">لديك {myListings.length} إعلان</p>
                  <Button asChild size="sm" className="gap-2 rounded-xl">
                    <Link href="/listings/new"><PlusCircle className="w-4 h-4" />إضافة</Link>
                  </Button>
                </div>
                {myListings.length === 0 ? (
                  <EmptyState icon={<Building2 className="w-10 h-10"/>} title="لا توجد إعلانات" message="لم تقم بنشر أي إعلانات حتى الآن" cta={{ label: "نشر إعلان", href: "/listings/new" }} />
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {myListings.map(l => (
                      <Card key={l.id} className="border-border hover-premium-shadow rounded-2xl transition-all">
                        <CardContent className="p-5">
                          <div className="flex flex-col sm:flex-row items-start gap-6">
                            <div className="w-full sm:w-32 sm:h-32 shrink-0 rounded-xl bg-muted/50 overflow-hidden relative border border-border/50">
                              {l.images ? (
                                <img src={l.images.split("\n")[0].trim()} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🏠</div>
                              )}
                              <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[l.status] ?? "bg-white text-black"}`}>
                                {STATUS_LABELS[l.status] ?? l.status}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 w-full">
                              <Link href={`/listings/${l.id}`}>
                                <h4 className="text-xl font-bold text-foreground hover:text-primary transition-colors truncate mb-2">{l.title}</h4>
                              </Link>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                <MapPin className="w-4 h-4 text-primary" />
                                {l.city}{l.district ? ` · ${l.district}` : ""}
                              </div>
                              <div className="flex items-end justify-between mt-auto">
                                <div>
                                  <p className="text-2xl font-extrabold text-foreground">{formatCurrency(l.price)}</p>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1 font-medium"><Eye className="w-4 h-4" />{l.views ?? 0} مشاهدة</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button asChild variant="secondary" className="rounded-xl px-4 gap-2">
                                    <Link href={`/listings/${l.id}/edit`}><Edit className="w-4 h-4" />تعديل</Link>
                                  </Button>
                                  <Button variant="outline" className="rounded-xl px-3 text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive" onClick={() => void deleteMyListing(l.id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Favorites Tab */}
            {tab === "favorites" && (
              <div className="space-y-6">
                {favorites.length === 0 ? (
                  <EmptyState icon={<Heart className="w-10 h-10"/>} title="لا توجد عقارات مفضّلة" message="تصفح العقارات المتاحة واحفظ ما يثير اهتمامك" cta={{ label: "تصفح العقارات", href: "/listings" }} />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {favorites.map(f => (
                      <div key={f.favoriteId} className="relative group h-full">
                        <ListingCard listing={f.listing} />
                        <button
                          onClick={() => void removeFavorite(f.listing.id)}
                          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-destructive border border-border opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-white"
                          title="إزالة من المفضلة"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Requests Tab */}
            {tab === "requests" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-sm">
                  <p className="font-semibold text-foreground">لديك {myRequests.length} طلب</p>
                  <Button asChild size="sm" className="gap-2 rounded-xl">
                    <Link href="/requests/new"><PlusCircle className="w-4 h-4" />طلب جديد</Link>
                  </Button>
                </div>
                {myRequests.length === 0 ? (
                  <EmptyState icon={<FileText className="w-10 h-10"/>} title="لا توجد طلبات" message="لم تقم بتقديم أي طلبات عقارية أو خدمية" cta={{ label: "نشر طلب", href: "/requests/new" }} />
                ) : (
                  <div className="grid gap-4">
                    {myRequests.map(r => (
                      <Card key={r.id} className="border-border hover-premium-shadow rounded-2xl transition-all">
                        <CardContent className="p-5 flex items-center gap-5">
                          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                            <FileText className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link href={`/requests`}>
                              <h4 className="text-lg font-bold text-foreground hover:text-primary transition-colors">{r.title}</h4>
                            </Link>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <Badge className="bg-secondary text-secondary-foreground font-medium rounded-lg">{r.category}</Badge>
                              <span className="text-sm text-muted-foreground flex items-center gap-1.5 font-medium"><MapPin className="w-4 h-4 text-primary" />{r.city}</span>
                            </div>
                          </div>
                          <Button variant="outline" className="rounded-xl w-10 h-10 p-0 text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive shrink-0" onClick={() => void deleteRequest(r.id)}>
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

function StatCard({ icon, label, value, color, bg, border }: { icon: React.ReactNode; label: string; value: string; color: string; bg: string; border: string; }) {
  return (
    <Card className="border-border premium-shadow rounded-2xl overflow-hidden group">
      <CardContent className="p-6 flex items-center gap-5">
        <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center ${color} border ${border} transition-transform group-hover:scale-110`}>{icon}</div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">{label}</p>
          <p className="text-3xl font-extrabold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon, title, message, cta }: { icon: React.ReactNode; title: string; message: string; cta: { label: string; href: string } }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card rounded-3xl border border-border border-dashed">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-6 shadow-inner">{icon}</div>
      <h3 className="text-2xl font-bold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground mb-8 max-w-sm text-lg">{message}</p>
      <Button asChild size="lg" className="rounded-xl gap-2 h-12 px-8 shadow-lg shadow-primary/20 font-bold text-base">
        <Link href={cta.href}><PlusCircle className="w-5 h-5" />{cta.label}</Link>
      </Button>
    </div>
  );
}