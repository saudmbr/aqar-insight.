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
  active: "bg-green-500/10 text-green-600 border-green-200",
  sold: "bg-blue-500/10 text-blue-600 border-blue-200",
  rented: "bg-purple-500/10 text-purple-600 border-purple-200",
  cancelled: "bg-red-500/10 text-red-600 border-red-200",
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-300",
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
    { key: "overview", label: "نظرة عامة", icon: <LayoutDashboard className="w-4 h-4" />, count: 0 },
    { key: "listings", label: "إعلاناتي", icon: <Building2 className="w-4 h-4" />, count: myListings.length },
    { key: "favorites", label: "المفضلة", icon: <Heart className="w-4 h-4" />, count: favorites.length },
    { key: "requests", label: "طلباتي", icon: <FileText className="w-4 h-4" />, count: myRequests.length },
  ];

  return (
    <Layout>
      <div className="space-y-6 pb-10">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">لوحتي</h1>
            <p className="text-muted-foreground mt-1">مرحباً، {user?.fullName ?? user?.username}</p>
          </div>
          <Button asChild className="gap-2 rounded-xl">
            <Link href="/listings/new"><PlusCircle className="w-4 h-4" />نشر إعلان</Link>
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-2xl w-fit">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.count > 0 && (
                <span className="text-xs bg-primary/10 text-primary rounded-full px-1.5 py-0.5">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {tab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard icon={<Building2 className="w-5 h-5" />} label="إجمالي إعلاناتي" value={String(myListings.length)} color="text-primary" />
                  <StatCard icon={<Eye className="w-5 h-5" />} label="إجمالي المشاهدات" value={myListings.reduce((s, l) => s + (l.views ?? 0), 0).toLocaleString("ar-SA")} color="text-blue-600" />
                  <StatCard icon={<Heart className="w-5 h-5" />} label="العقارات المفضّلة" value={String(favorites.length)} color="text-red-500" />
                </div>

                {myListings.length === 0 && favorites.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Building2 className="w-14 h-14 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">ابدأ بنشر أول إعلان</h3>
                    <p className="text-muted-foreground mb-6">انشر إعلانك العقاري وابدأ في استقبال المهتمين</p>
                    <Button asChild className="gap-2 rounded-xl">
                      <Link href="/listings/new"><PlusCircle className="w-4 h-4" />نشر إعلان جديد</Link>
                    </Button>
                  </div>
                )}

                {myListings.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">آخر إعلاناتي</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {myListings.slice(0, 3).map(l => <ListingCard key={l.id} listing={l as ListingCardData} />)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* My Listings Tab */}
            {tab === "listings" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">{myListings.length} إعلان</p>
                  <Button asChild size="sm" className="gap-1 rounded-xl">
                    <Link href="/listings/new"><PlusCircle className="w-3.5 h-3.5" />إضافة</Link>
                  </Button>
                </div>
                {myListings.length === 0 ? (
                  <EmptyState icon={<Building2 />} message="لا توجد إعلانات بعد" cta={{ label: "نشر إعلان", href: "/listings/new" }} />
                ) : (
                  <div className="space-y-3">
                    {myListings.map(l => (
                      <Card key={l.id} className="border-border/60">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 shrink-0 rounded-xl bg-muted/50 overflow-hidden">
                              {l.images ? (
                                <img src={l.images.split("\n")[0].trim()} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">🏠</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <Link href={`/listings/${l.id}`}>
                                    <h4 className="font-semibold text-sm text-foreground hover:text-primary transition-colors truncate">{l.title}</h4>
                                  </Link>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                    <MapPin className="w-3 h-3" />{l.city}{l.district ? ` · ${l.district}` : ""}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[l.status] ?? ""}`}>
                                    {STATUS_LABELS[l.status] ?? l.status}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <div>
                                  <p className="font-bold text-foreground text-sm">{formatCurrency(l.price)}</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Eye className="w-3 h-3" />{l.views ?? 0} مشاهدة</p>
                                </div>
                                <div className="flex gap-1.5">
                                  <Button asChild size="sm" variant="outline" className="rounded-lg h-8 px-2.5">
                                    <Link href={`/listings/${l.id}/edit`}><Edit className="w-3.5 h-3.5" /></Link>
                                  </Button>
                                  <Button size="sm" variant="outline" className="rounded-lg h-8 px-2.5 text-destructive border-destructive/30" onClick={() => void deleteMyListing(l.id)}>
                                    <Trash2 className="w-3.5 h-3.5" />
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
              <div className="space-y-4">
                {favorites.length === 0 ? (
                  <EmptyState icon={<Heart />} message="لا توجد عقارات مفضّلة" cta={{ label: "تصفح العقارات", href: "/listings" }} />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favorites.map(f => (
                      <div key={f.favoriteId} className="relative group">
                        <ListingCard listing={f.listing} />
                        <button
                          onClick={() => void removeFavorite(f.listing.id)}
                          className="absolute top-3 left-3 z-10 w-7 h-7 rounded-full bg-background/90 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Requests Tab */}
            {tab === "requests" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">{myRequests.length} طلب</p>
                  <Button asChild size="sm" className="gap-1 rounded-xl">
                    <Link href="/requests/new"><PlusCircle className="w-3.5 h-3.5" />طلب جديد</Link>
                  </Button>
                </div>
                {myRequests.length === 0 ? (
                  <EmptyState icon={<FileText />} message="لا توجد طلبات بعد" cta={{ label: "نشر طلب", href: "/requests/new" }} />
                ) : (
                  <div className="space-y-3">
                    {myRequests.map(r => (
                      <Card key={r.id} className="border-border/60">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <Link href={`/requests`}>
                              <p className="font-semibold text-sm text-foreground hover:text-primary">{r.title}</p>
                            </Link>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="outline" className="text-xs">{r.category}</Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{r.city}</span>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="rounded-lg h-8 px-2.5 text-destructive border-destructive/30 shrink-0" onClick={() => void deleteRequest(r.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
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

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center ${color}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon, message, cta }: { icon: React.ReactNode; message: string; cta: { label: string; href: string } }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground/40 mb-4">{icon}</div>
      <p className="text-muted-foreground mb-4">{message}</p>
      <Button asChild variant="outline" className="rounded-xl gap-2">
        <Link href={cta.href}>{cta.label}</Link>
      </Button>
    </div>
  );
}
