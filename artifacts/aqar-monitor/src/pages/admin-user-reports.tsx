import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Flag, Calendar, User, ExternalLink, CheckCircle2, XCircle, Clock, MessageSquare } from "lucide-react";

interface UserReport {
  id: number;
  reporterId: number | null;
  targetType: string;
  targetId: number;
  targetTitle: string | null;
  reason: string;
  details: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

const TARGET_TYPE_META: Record<string, { label: string; href: (id: number) => string; color: string; bg: string }> = {
  listing: { label: "إعلان عقاري", href: (id) => `/listings/${id}`, color: "text-blue-700", bg: "bg-blue-50" },
  marketer: { label: "مسوّق", href: (id) => `/marketers/${id}`, color: "text-emerald-700", bg: "bg-emerald-50" },
  service_provider: { label: "مزود خدمة", href: (id) => `/services/${id}`, color: "text-orange-700", bg: "bg-orange-50" },
  customer_request: { label: "طلب عميل", href: () => "/requests", color: "text-purple-700", bg: "bg-purple-50" },
};

const STATUS_META: Record<string, { label: string; icon: React.ElementType; style: string }> = {
  pending: { label: "قيد المراجعة", icon: Clock, style: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  reviewed: { label: "تمت المراجعة", icon: CheckCircle2, style: "bg-green-100 text-green-800 border-green-300" },
  dismissed: { label: "مرفوض", icon: XCircle, style: "bg-gray-100 text-gray-700 border-gray-300" },
};

export default function AdminUserReports() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [actionId, setActionId] = useState<number | null>(null);
  const [noteValue, setNoteValue] = useState("");

  useEffect(() => {
    if (user && user.role !== "admin") { navigate("/"); return; }
  }, [user]);

  const fetchReports = async () => {
    setLoading(true);
    const params = filter ? `?status=${filter}` : "";
    const res = await fetch(`/api/reports${params}`, { credentials: "include" });
    if (res.ok) setReports(await res.json() as UserReport[]);
    setLoading(false);
  };

  useEffect(() => { void fetchReports(); }, [filter]);

  const handleAction = async (id: number, status: string) => {
    setActionId(id);
    try {
      await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote: noteValue || undefined }),
      });
      toast({ title: status === "reviewed" ? "تم وضع علامة مراجعة" : "تم رفض البلاغ" });
      void fetchReports();
    } finally {
      setActionId(null);
      setNoteValue("");
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
              <Flag className="w-6 h-6 text-destructive" />
              بلاغات المستخدمين
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">إدارة البلاغات المُرسلة من مستخدمي المنصة</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => navigate("/admin")}>
            العودة للوحة الإدارة
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "pending", label: "قيد المراجعة" },
            { value: "reviewed", label: "مراجعة" },
            { value: "dismissed", label: "مرفوضة" },
            { value: "", label: "الكل" },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                filter === opt.value
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-background text-foreground border-border hover:border-primary/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="rounded-2xl animate-pulse">
                <CardContent className="p-6 h-24 bg-muted/30" />
              </Card>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Flag className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-semibold text-lg">لا توجد بلاغات</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map(r => {
              const meta = TARGET_TYPE_META[r.targetType];
              const statusMeta = STATUS_META[r.status] ?? STATUS_META.pending;
              const StatusIcon = statusMeta.icon;
              return (
                <Card key={r.id} className="rounded-3xl border-border overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Header row */}
                        <div className="flex flex-wrap items-center gap-2">
                          {meta && (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${meta.bg} ${meta.color} border-current/20`}>
                              {meta.label} #{r.targetId}
                            </span>
                          )}
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${statusMeta.style}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusMeta.label}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(r.createdAt).toLocaleDateString("ar-SA")}
                          </span>
                          {r.reporterId && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="w-3.5 h-3.5" />
                              مستخدم #{r.reporterId}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        {r.targetTitle && (
                          <p className="text-sm text-muted-foreground font-medium">
                            <span className="text-foreground font-bold">المحتوى:</span> {r.targetTitle}
                          </p>
                        )}

                        {/* Reason */}
                        <div className="bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-2.5">
                          <p className="text-sm font-bold text-destructive">السبب: {r.reason}</p>
                          {r.details && <p className="text-xs text-muted-foreground mt-1">{r.details}</p>}
                        </div>

                        {/* Admin note */}
                        {r.adminNote && (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
                            <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5 mb-1">
                              <MessageSquare className="w-3.5 h-3.5" />
                              ملاحظة الإدارة:
                            </p>
                            <p className="text-xs text-blue-800">{r.adminNote}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col gap-2 shrink-0">
                        {meta && (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="rounded-xl gap-1.5 text-xs font-bold border-border"
                          >
                            <a href={meta.href(r.targetId)} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3.5 h-3.5" />
                              عرض
                            </a>
                          </Button>
                        )}
                        {r.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="rounded-xl gap-1.5 text-xs font-bold bg-green-600 hover:bg-green-700 text-white"
                              disabled={actionId === r.id}
                              onClick={() => void handleAction(r.id, "reviewed")}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              تمت المراجعة
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl gap-1.5 text-xs font-bold border-border text-muted-foreground"
                              disabled={actionId === r.id}
                              onClick={() => void handleAction(r.id, "dismissed")}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              رفض
                            </Button>
                          </>
                        )}
                      </div>
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
