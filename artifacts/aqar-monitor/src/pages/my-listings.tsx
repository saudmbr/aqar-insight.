import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getImageSrc } from "@/lib/utils";
import type { Listing } from "@workspace/db";
import {
  PlusCircle, Building2, Eye, Edit, Trash2, RotateCcw,
  CheckCircle, Archive, MapPin, Ruler, BedDouble, AlertTriangle,
  DollarSign, X,
} from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  sold: "مُباع",
  rented: "مُؤجّر",
  cancelled: "مؤرشف",
  pending: "قيد المراجعة",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  sold: "bg-blue-500/10 text-blue-700 border-blue-200",
  rented: "bg-purple-500/10 text-purple-700 border-purple-200",
  cancelled: "bg-rose-500/10 text-rose-700 border-rose-200",
  pending: "bg-amber-500/10 text-amber-700 border-amber-200",
};

const STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-500",
  sold: "bg-blue-500",
  rented: "bg-purple-500",
  cancelled: "bg-rose-400",
  pending: "bg-amber-400",
};

type FilterTab = "all" | "active" | "sold" | "rented" | "cancelled" | "pending";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "active", label: "نشط" },
  { key: "sold", label: "مُباع" },
  { key: "rented", label: "مُؤجّر" },
  { key: "cancelled", label: "مؤرشف" },
  { key: "pending", label: "قيد المراجعة" },
];

function DeleteModal({
  listing,
  onConfirm,
  onCancel,
}: {
  listing: Listing;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">حذف الإعلان</h2>
            <p className="text-muted-foreground text-sm mt-1">
              هل أنت متأكد من حذف إعلان <span className="font-semibold text-foreground">"{listing.title}"</span>؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <Button variant="destructive" className="flex-1 rounded-xl h-11" onClick={onConfirm}>
            <Trash2 className="w-4 h-4 ml-1.5" />حذف الإعلان
          </Button>
          <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={onCancel}>
            <X className="w-4 h-4 ml-1.5" />إلغاء
          </Button>
        </div>
      </div>
    </div>
  );
}

function ListingRow({
  listing,
  onChangeStatus,
  onDelete,
  statusLoading,
}: {
  listing: Listing;
  onChangeStatus: (id: number, status: string) => void;
  onDelete: (listing: Listing) => void;
  statusLoading: number | null;
}) {
  const isLoading = statusLoading === listing.id;
  const images = listing.images ? listing.images.split(",").map(s => s.trim()).filter(Boolean) : [];
  const firstImage = images[0] ?? null;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row">
        {/* Thumbnail */}
        <Link href={`/listings/${listing.id}`} className="sm:w-44 shrink-0">
          <div className="h-36 sm:h-full w-full bg-muted relative overflow-hidden">
            {firstImage ? (
              <img
                src={getImageSrc(firstImage)}
                alt={listing.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="w-10 h-10 text-muted-foreground/40" />
              </div>
            )}
            <div className={`absolute top-2 right-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[listing.status] ?? STATUS_COLORS.active}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[listing.status] ?? STATUS_DOT.active}`} />
              {STATUS_LABELS[listing.status] ?? listing.status}
            </div>
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/listings/${listing.id}`} className="group">
              <h3 className="font-bold text-foreground text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
                {listing.title}
              </h3>
            </Link>
            <p className="text-primary font-extrabold text-lg shrink-0">
              {formatCurrency(listing.price)}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{listing.city}{listing.district ? `، ${listing.district}` : ""}</span>
            {listing.areaSqm && <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" />{listing.areaSqm.toLocaleString("en-US")} م²</span>}
            {listing.bedrooms && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{listing.bedrooms} غرف</span>}
            {listing.views != null && <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{listing.views.toLocaleString("en-US")} مشاهدة</span>}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Status actions */}
            {listing.status === "active" && (
              <>
                <button
                  disabled={isLoading}
                  onClick={() => onChangeStatus(listing.id, "sold")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  <DollarSign className="w-3.5 h-3.5" />مُباع
                </button>
                <button
                  disabled={isLoading}
                  onClick={() => onChangeStatus(listing.id, "rented")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-3.5 h-3.5" />مُؤجّر
                </button>
                <button
                  disabled={isLoading}
                  onClick={() => onChangeStatus(listing.id, "cancelled")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50"
                >
                  <Archive className="w-3.5 h-3.5" />أرشفة
                </button>
              </>
            )}
            {(listing.status === "sold" || listing.status === "rented" || listing.status === "cancelled") && (
              <button
                disabled={isLoading}
                onClick={() => onChangeStatus(listing.id, "active")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />إعادة تفعيل
              </button>
            )}

            <div className="flex items-center gap-1.5 mr-auto">
              <Link href={`/listings/${listing.id}`}>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-muted-foreground border border-border transition-colors">
                  <Eye className="w-3.5 h-3.5" />عرض
                </button>
              </Link>
              <Link href={`/listings/${listing.id}/edit`}>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
                  <Edit className="w-3.5 h-3.5" />تعديل
                </button>
              </Link>
              <button
                onClick={() => onDelete(listing)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />حذف
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyListings() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState<number | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [deleteTarget, setDeleteTarget] = useState<Listing | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    const load = async () => {
      const res = await fetch("/api/listings/my/listings", { credentials: "include" });
      if (res.ok) setListings(await res.json() as Listing[]);
      setLoading(false);
    };
    void load();
  }, [isAuthenticated]);

  const changeStatus = async (id: number, status: string) => {
    setStatusLoading(id);
    const res = await fetch(`/api/listings/${id}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setListings(l => l.map(x => x.id === id ? { ...x, status } : x));
      const labels: Record<string, string> = { sold: "مُباع", rented: "مُؤجّر", cancelled: "مؤرشف", active: "نشط" };
      toast({ title: "تم تحديث الحالة", description: `الحالة الجديدة: ${labels[status] ?? status}` });
    } else {
      toast({ title: "فشل تحديث الحالة", variant: "destructive" });
    }
    setStatusLoading(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      setListings(l => l.filter(x => x.id !== id));
      toast({ title: "تم الحذف بنجاح", description: "لن يظهر الإعلان بعد الآن" });
    } else {
      toast({ title: "فشل الحذف", variant: "destructive" });
    }
  };

  const filtered = filterTab === "all" ? listings : listings.filter(l => l.status === filterTab);

  const countByStatus = (status: string) => listings.filter(l => l.status === status).length;

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-4 py-8">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {deleteTarget && (
        <DeleteModal
          listing={deleteTarget}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        {/* Header */}
        <div
          className="rounded-[2rem] overflow-hidden p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative"
          style={{ background: "linear-gradient(135deg, #0F1C3F 0%, #0F1C3F 60%, #0F7BA0 100%)" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_100%_at_top_left,rgba(15,123,160,0.2),transparent)] pointer-events-none" />
          <div className="relative z-10">
            <p className="text-white/60 text-sm mb-1">{isAdmin ? "المدير — جميع الإعلانات" : "لوحة التحكم"}</p>
            <h1 className="text-3xl font-extrabold text-white leading-tight">إعلاناتي</h1>
            <p className="text-white/70 text-sm mt-1.5">{listings.length.toLocaleString("en-US")} إعلان مسجّل في حسابك</p>
          </div>
          <Button
            asChild
            className="relative z-10 gap-2 rounded-xl h-11 px-5 shrink-0 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold shadow-none"
          >
            <Link href="/listings/new"><PlusCircle className="w-5 h-5" />إعلان جديد</Link>
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "نشط", status: "active", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
            { label: "مُباع", status: "sold", color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
            { label: "مُؤجّر", status: "rented", color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
            { label: "مؤرشف", status: "cancelled", color: "text-rose-500", bg: "bg-rose-50 border-rose-100" },
          ].map(s => (
            <button
              key={s.status}
              onClick={() => setFilterTab(s.status as FilterTab)}
              className={`rounded-2xl border p-4 text-center transition-all hover:shadow-sm ${s.bg} ${filterTab === s.status ? "ring-2 ring-offset-1 ring-primary/30" : ""}`}
            >
              <p className={`text-2xl font-extrabold ${s.color}`}>{countByStatus(s.status).toLocaleString("en-US")}</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setFilterTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                filterTab === t.key
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {t.label}
              <span className={`text-xs rounded-full px-1.5 py-0.5 ${filterTab === t.key ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                {t.key === "all" ? listings.length.toLocaleString("en-US") : countByStatus(t.key).toLocaleString("en-US")}
              </span>
            </button>
          ))}
        </div>

        {/* Listings list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-card rounded-2xl border border-border">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <Building2 className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-foreground">
                {filterTab === "all" ? "لا توجد إعلانات بعد" : `لا توجد إعلانات بحالة "${STATUS_LABELS[filterTab]}"`}
              </p>
              <p className="text-muted-foreground text-sm">
                {filterTab === "all" ? "ابدأ بنشر إعلانك العقاري الأول الآن" : "جرب تصفية مختلفة أو أضف إعلاناً جديداً"}
              </p>
            </div>
            {filterTab === "all" && (
              <Button asChild className="gap-2 rounded-xl mt-2">
                <Link href="/listings/new"><PlusCircle className="w-4 h-4" />نشر إعلان جديد</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(listing => (
              <ListingRow
                key={listing.id}
                listing={listing}
                onChangeStatus={changeStatus}
                onDelete={setDeleteTarget}
                statusLoading={statusLoading}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
