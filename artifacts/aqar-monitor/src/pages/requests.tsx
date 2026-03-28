import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Building2,
  Wrench,
  UserCheck,
  FileText,
  PlusCircle,
  MapPin,
  Calendar,
  Trash2,
  ArrowLeft,
  Search,
  Star,
  Shield,
  Zap,
} from "lucide-react";

const REQUEST_TYPES = [
  { value: "", label: "جميع الطلبات", icon: FileText },
  { value: "property", label: "طلبات عقارية", icon: Building2 },
  { value: "service", label: "طلبات خدمات", icon: Wrench },
  { value: "marketer", label: "طلبات مسوّقين", icon: UserCheck },
];

const TYPE_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string }> = {
  property: { label: "عقار", icon: Building2, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  service:  { label: "خدمة", icon: Wrench,    color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  marketer: { label: "مسوّق", icon: UserCheck, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
};

const STATUS_META: Record<string, { label: string; style: string }> = {
  open:     { label: "مفتوح",   style: "bg-green-100 text-green-800 border-green-200" },
  closed:   { label: "مغلق",    style: "bg-gray-100 text-gray-700 border-gray-200" },
  archived: { label: "مؤرشف",  style: "bg-yellow-100 text-yellow-800 border-yellow-200" },
};

const CITIES = [
  "الرياض", "جدة", "الدمام", "مكة المكرمة", "المدينة المنورة",
  "الخبر", "تبوك", "أبها", "الطائف", "بريدة",
];

interface CustomerRequest {
  id: number;
  userId: number | null;
  requestType: string;
  title: string;
  category?: string | null;
  city: string;
  district?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  details?: string | null;
  marketerName?: string | null;
  contactMethod?: string | null;
  status: string;
  createdAt: string;
  posterName?: string | null;
}

export default function Requests() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestType, setRequestType] = useState("");
  const [city, setCity] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    const params = new URLSearchParams({ status: "open" });
    if (requestType) params.set("requestType", requestType);
    if (city) params.set("city", city);
    const res = await fetch(`/api/customer-requests?${params}`, { credentials: "include" });
    if (res.ok) setRequests(await res.json() as CustomerRequest[]);
    setLoading(false);
  };

  useEffect(() => {
    document.title = "سوق الطلبات – عقار إنسايت";
    return () => { document.title = "عقار إنسايت"; };
  }, []);

  useEffect(() => { void fetchRequests(); }, [requestType, city]);

  const canDelete = (r: CustomerRequest) => {
    if (!isAuthenticated || !user) return false;
    if (user.role === "admin") return true;
    if (user.id != null && r.userId != null) return String(user.id) === String(r.userId);
    return false;
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/customer-requests/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setRequests(prev => prev.filter(r => r.id !== deleteId));
        toast({ title: "تم حذف الطلب بنجاح" });
      } else {
        const data = await res.json() as { message?: string };
        toast({ title: "خطأ", description: data.message ?? "حدث خطأ أثناء الحذف", variant: "destructive" });
      }
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const formatBudget = (min?: number | null, max?: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `${min.toLocaleString("en-US")} – ${max.toLocaleString("en-US")} ر.س`;
    if (min) return `من ${min.toLocaleString("en-US")} ر.س`;
    return `حتى ${max!.toLocaleString("en-US")} ر.س`;
  };

  return (
    <Layout>
      <div className="space-y-10 pb-16 max-w-5xl mx-auto">

        {/* ─── Hero Header ─────────────────────────────────────────────────── */}
        <div
          className="relative rounded-[2rem] overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0F1C3F 0%, #0F1C3F 50%, #0F7BA0 100%)" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_top_right,rgba(201,168,76,0.13),transparent)] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-[radial-gradient(circle,rgba(15,123,160,0.2),transparent_70%)] pointer-events-none" />

          <div className="relative z-10 p-8 md:p-12">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              {/* Copy */}
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/90 px-3 py-1.5 rounded-full text-xs font-bold mb-5 tracking-wide">
                  <Search className="w-3.5 h-3.5" />
                  سوق الطلبات العقارية
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-snug mb-4">
                  ابحث أو انشر طلبك
                </h1>
                <p className="text-white/85 text-base md:text-lg leading-relaxed max-w-xl font-medium">
                  منصة مخصصة لمن يبحث عن عقار أو خدمة أو مسوّق عقاري بعينه. قدّم طلبك بسهولة وسيتواصل معك أصحاب العروض المناسبة بشكل مباشر.
                </p>

                {/* 3 pillars */}
                <div className="flex flex-wrap gap-3 mt-6">
                  <span className="flex items-center gap-2 bg-white/10 border border-white/15 text-white/90 px-4 py-2 rounded-xl text-sm font-semibold">
                    <Building2 className="w-4 h-4 text-[#94A3B8]" />
                    بحث عن عقار
                  </span>
                  <span className="flex items-center gap-2 bg-white/10 border border-white/15 text-white/90 px-4 py-2 rounded-xl text-sm font-semibold">
                    <Wrench className="w-4 h-4 text-[#94A3B8]" />
                    بحث عن خدمة
                  </span>
                  <span className="flex items-center gap-2 bg-white/10 border border-white/15 text-white/90 px-4 py-2 rounded-xl text-sm font-semibold">
                    <UserCheck className="w-4 h-4 text-[#94A3B8]" />
                    بحث عن مسوّق عقاري
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col gap-4 shrink-0">
                {isAuthenticated ? (
                  <Button asChild size="lg" className="gap-2 rounded-2xl h-14 px-8 text-base font-bold bg-[#94A3B8] hover:bg-[#b8973e] text-white border-none shadow-xl shadow-[#94A3B8]/20">
                    <Link href="/requests/new">
                      <PlusCircle className="w-5 h-5" />
                      نشر طلب جديد
                    </Link>
                  </Button>
                ) : (
                  <Button asChild size="lg" className="gap-2 rounded-2xl h-14 px-8 text-base font-bold bg-white/15 hover:bg-white/25 border border-white/25 text-white shadow-none">
                    <Link href="/login">
                      <PlusCircle className="w-5 h-5" />
                      سجّل دخولك لإضافة طلب
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── How it works — 3 cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: Building2, color: "text-blue-600", bg: "bg-blue-50 border-blue-100", title: "بحث عن عقار", desc: "انشر مواصفات العقار الذي تبحث عنه، وسيتواصل معك المسوّقون والملاك المناسبون." },
            { icon: Wrench,    color: "text-orange-600", bg: "bg-orange-50 border-orange-100", title: "بحث عن خدمة", desc: "هل تحتاج إلى مقاول، مصمم داخلي، أو أي خدمة عقارية؟ قدّم طلبك وانتظر العروض." },
            { icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", title: "بحث عن مسوّق", desc: "حدّد اسم مسوّق بعينه أو مواصفاته ليتواصل معك أفضل المسوّقين المؤهلين." },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className={`rounded-2xl border p-6 ${bg}`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-white shadow-sm border ${bg}`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <h3 className="font-bold text-foreground mb-2 text-base">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* ─── Filters ────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1">
            {REQUEST_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setRequestType(value === requestType ? "" : value)}
                className={`shrink-0 h-11 px-5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${value === requestType ? "bg-primary text-white shadow-sm shadow-primary/25" : "bg-card border border-border text-muted-foreground hover:bg-muted hover:border-primary/30"}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
          <div className="shrink-0 w-full md:w-52">
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              className="w-full h-11 rounded-xl border border-border bg-card px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
            >
              <option value="">كل المدن</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* ─── Requests List ──────────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-3xl" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-card rounded-3xl border border-dashed border-border">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/15">
              <FileText className="w-10 h-10 text-primary/50" />
            </div>
            <h3 className="text-2xl font-bold mb-3">لا توجد طلبات حالياً</h3>
            <p className="text-muted-foreground mb-8 max-w-sm text-base">
              {requestType || city
                ? "لا توجد طلبات مطابقة للفلاتر المحددة. جرّب تغيير الفلتر."
                : "لم يتم إضافة أي طلبات بعد. كن أول من ينشر طلباً!"}
            </p>
            {isAuthenticated ? (
              <Button asChild size="lg" className="rounded-xl gap-2 font-bold px-8 shadow-lg shadow-primary/20">
                <Link href="/requests/new"><PlusCircle className="w-5 h-5" />أضف طلبك الآن</Link>
              </Button>
            ) : (
              <Button asChild size="lg" variant="outline" className="rounded-xl gap-2 font-bold px-8">
                <Link href="/login">سجّل دخولك لإضافة طلب جديد</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {requests.map(r => {
              const budget = formatBudget(r.budgetMin, r.budgetMax);
              const typeMeta = TYPE_META[r.requestType] ?? TYPE_META.property;
              const statusMeta = STATUS_META[r.status] ?? { label: r.status, style: "bg-gray-100 text-gray-700 border-gray-200" };
              const TypeIcon = typeMeta.icon;
              return (
                <Card key={r.id} className="border-border rounded-3xl overflow-hidden hover:shadow-md transition-all group bg-card">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row gap-6">

                      {/* Type Icon */}
                      <div className="hidden md:flex flex-col items-center gap-3 shrink-0 w-20">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${typeMeta.bg} ${typeMeta.border}`}>
                          <TypeIcon className={`w-7 h-7 ${typeMeta.color}`} />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground text-center">
                          {new Date(r.createdAt).toLocaleDateString("ar-SA", { day: "numeric", month: "short" })}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${typeMeta.bg} ${typeMeta.border} ${typeMeta.color}`}>
                            <TypeIcon className="w-3.5 h-3.5" />
                            {typeMeta.label}
                          </span>
                          {r.category && (
                            <Badge className="bg-secondary text-secondary-foreground font-semibold px-3 py-1 rounded-lg border-none text-xs">
                              {r.category}
                            </Badge>
                          )}
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${statusMeta.style}`}>
                            {statusMeta.label}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                            <MapPin className="w-3.5 h-3.5" />
                            {r.city}{r.district ? ` ← ${r.district}` : ""}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-extrabold text-foreground group-hover:text-primary transition-colors mb-2 leading-snug">
                          {r.title}
                        </h3>

                        {/* Marketer name if type=marketer */}
                        {r.requestType === "marketer" && r.marketerName && (
                          <div className="flex items-center gap-2 text-sm text-emerald-700 font-semibold mb-2">
                            <UserCheck className="w-4 h-4" />
                            المسوّق المطلوب: {r.marketerName}
                          </div>
                        )}

                        {/* Details */}
                        {r.details && (
                          <div className="bg-muted/40 rounded-2xl p-4 mb-4 border border-border/50">
                            <p className="text-sm text-foreground leading-relaxed line-clamp-2">{r.details}</p>
                          </div>
                        )}

                        {/* Footer row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {r.posterName && (
                              <span className="flex items-center gap-2 font-medium">
                                <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-xs text-primary font-bold">
                                  {r.posterName.charAt(0)}
                                </div>
                                {r.posterName}
                              </span>
                            )}
                            {budget && (
                              <span className="text-green-700 font-bold bg-green-50 px-3 py-1 rounded-lg border border-green-200 text-xs">
                                {budget}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-xs">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(r.createdAt).toLocaleDateString("ar-SA")}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {canDelete(r) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 font-semibold"
                                onClick={() => setDeleteId(r.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                                حذف
                              </Button>
                            )}
                            {r.contactMethod && (
                              <span className="text-xs text-muted-foreground">
                                تواصل عبر: <span className="text-foreground font-bold">{r.contactMethod}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Delete Confirm Dialog ───────────────────────────────────────── */}
      <AlertDialog open={deleteId !== null} onOpenChange={open => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent className="rounded-3xl border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-extrabold">تأكيد حذف الطلب</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذه العملية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl font-bold">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => { e.preventDefault(); void handleDelete(); }}
              className="rounded-xl font-bold bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "جاري الحذف…" : "حذف الطلب"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
