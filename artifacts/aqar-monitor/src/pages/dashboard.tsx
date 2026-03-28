import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getImageSrc } from "@/lib/utils";
import {
  Building2, Heart, FileText, PlusCircle, Edit, Trash2,
  MapPin, Eye, LayoutDashboard, CheckCircle, Archive, Ban,
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
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<{ favoriteId: number; listing: ListingCardData }[]>([]);
  const [myRequests, setMyRequests] = useState<{ id: number; title: string; category: string; city: string; status: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState<number | null>(null);

  useEffect(() => {
    document.title = "لوحة التحكم – عقار إنسايت";
    return () => { document.title = "عقار إنسايت"; };
  }, []);

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
    setConfirmDeleteId(null);
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      setMyListings(l => l.filter(x => x.id !== id));
      toast({ title: "تم حذف الإعلان بنجاح", description: "لن يظهر الإعلان بعد الآن للزوار" });
    } else {
      toast({ title: "فشل الحذف", description: "حدث خطأ أثناء الحذف، يرجى المحاولة مجدداً", variant: "destructive" });
    }
  };

  const changeStatus = async (id: number, status: string) => {
    setStatusLoading(id);
    const res = await fetch(`/api/listings/${id}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setMyListings(l => l.map(x => x.id === id ? { ...x, status } : x));
      const labels: Record<string, string> = { sold: "مُباع", rented: "مُؤجّر", cancelled: "مؤرشف", active: "نشط" };
      toast({ title: `تم تحديث حالة الإعلان`, description: `الحالة الجديدة: ${labels[status] ?? status}` });
    } else {
      toast({ title: "فشل تحديث الحالة", variant: "destructive" });
    }
    setStatusLoading(null);
  };

  const removeFavorite = async (listingId: number) => {
    await fetch(`/api/favorites/${listingId}/toggle`, { method: "POST", credentials: "include" });
    setFavorites(f => f.filter(x => x.listing.id !== listingId));
    toast({ title: "تم الإزالة من المفضلة" });
  };

  const deleteRequest = async (id: number) => {
    const res = await fetch(`/api/customer-requests/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      setMyRequests(r => r.filter(x => x.id !== id));
      toast({ title: "تم حذف الطلب" });
    }
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
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-foreground">آخر إعلاناتي</h3>
                      <Button variant="ghost" className="text-primary font-semibold rounded-xl" onClick={() => setTab("listings")}>
                        عرض الكل ({myListings.length})
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {myListings.slice(0, 4).map(l => (
                        <ListingCard
                          key={l.id}
                          listing={l as ListingCardData}
                          canEdit
                          onDelete={(id) => setConfirmDeleteId(id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* My Listings Tab */}
            {tab === "listings" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-sm">
                  <p className="font-semibold text-foreground">لديك <span className="text-primary font-bold">{myListings.length}</span> إعلان</p>
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
                          <div className="flex flex-col sm:flex-row items-start gap-5">
                            {/* Thumbnail */}
                            <div className="w-full sm:w-28 h-24 shrink-0 rounded-xl bg-muted/50 overflow-hidden relative border border-border/50">
                              {l.images ? (
                                <img
                                  src={getImageSrc(l.images.split("\n")[0].trim()) ?? ""}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Building2 className="w-8 h-8 text-muted-foreground/25" /></div>
                              )}
                              <span className={`absolute top-1.5 right-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[l.status] ?? "bg-white text-black"}`}>
                                {STATUS_LABELS[l.status] ?? l.status}
                              </span>
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0 w-full">
                              <Link href={`/listings/${l.id}`}>
                                <h4 className="text-lg font-bold text-foreground hover:text-primary transition-colors line-clamp-1 mb-1">{l.title}</h4>
                              </Link>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 font-medium">
                                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                {l.city}{l.district ? ` · ${l.district}` : ""}
                              </div>
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="text-xl font-extrabold text-foreground">{formatCurrency(l.price)}</p>
                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-2">
                                  {/* View */}
                                  <Button asChild size="sm" variant="ghost" className="rounded-lg h-9 w-9 p-0 text-muted-foreground hover:text-foreground" title="معاينة">
                                    <Link href={`/listings/${l.id}`}><Eye className="w-4 h-4" /></Link>
                                  </Button>
                                  {/* Edit */}
                                  <Button asChild size="sm" variant="ghost" className="rounded-lg h-9 w-9 p-0 text-primary hover:bg-primary/5" title="تعديل">
                                    <Link href={`/listings/${l.id}/edit`}><Edit className="w-4 h-4" /></Link>
                                  </Button>
                                  {/* Status actions */}
                                  {l.status !== "sold" && (
                                    <Button size="sm" variant="ghost" className="rounded-lg h-9 w-9 p-0 text-blue-600 hover:bg-blue-50" title="تحديد كمباع" disabled={statusLoading === l.id} onClick={() => void changeStatus(l.id, "sold")}>
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {l.status !== "rented" && (
                                    <Button size="sm" variant="ghost" className="rounded-lg h-9 w-9 p-0 text-purple-600 hover:bg-purple-50" title="تحديد كمؤجّر" disabled={statusLoading === l.id} onClick={() => void changeStatus(l.id, "rented")}>
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {l.status !== "cancelled" && (
                                    <Button size="sm" variant="ghost" className="rounded-lg h-9 w-9 p-0 text-orange-500 hover:bg-orange-50" title="أرشفة" disabled={statusLoading === l.id} onClick={() => void changeStatus(l.id, "cancelled")}>
                                      <Archive className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {l.status !== "active" && (
                                    <Button size="sm" variant="ghost" className="rounded-lg h-9 w-9 p-0 text-emerald-600 hover:bg-emerald-50" title="إعادة تفعيل" disabled={statusLoading === l.id} onClick={() => void changeStatus(l.id, "active")}>
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {/* Delete */}
                                  <Button size="sm" variant="ghost" className="rounded-lg h-9 w-9 p-0 text-destructive hover:bg-destructive/10" title="حذف" onClick={() => setConfirmDeleteId(l.id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              {/* Status actions legend */}
                              <div className="flex gap-3 mt-2 flex-wrap">
                                {l.status !== "sold" && <span className="text-[11px] text-blue-600 font-medium">✓ بيع</span>}
                                {l.status !== "rented" && <span className="text-[11px] text-purple-600 font-medium">✓ تأجير</span>}
                                {l.status !== "cancelled" && <span className="text-[11px] text-orange-500 font-medium">📁 أرشفة</span>}
                                {l.status !== "active" && <span className="text-[11px] text-emerald-600 font-medium">↑ تفعيل</span>}
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
                  <p className="font-semibold text-foreground">لديك <span className="text-primary font-bold">{myRequests.length}</span> طلب</p>
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

      {/* Delete Confirm Dialog */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-card rounded-3xl border border-border shadow-2xl p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-destructive/20">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-xl font-bold text-center text-foreground mb-2">حذف الإعلان</h3>
            <p className="text-center text-muted-foreground mb-8 text-sm">هل أنت متأكد من حذف هذا الإعلان نهائياً؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setConfirmDeleteId(null)}>
                إلغاء
              </Button>
              <Button variant="destructive" className="flex-1 rounded-xl gap-2" onClick={() => void deleteMyListing(confirmDeleteId)}>
                <Ban className="w-4 h-4" />نعم، احذف
              </Button>
            </div>
          </div>
        </div>
      )}
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
