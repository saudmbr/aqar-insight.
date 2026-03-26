import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { FileText, PlusCircle, MapPin, User, Calendar } from "lucide-react";

const CATEGORIES = [
  "بحث عن عقار", "بحث عن مقاول", "تشطيبات", "سباكة وكهرباء",
  "تكييف", "دهانات", "تنظيف", "تصميم داخلي", "أخرى",
];
const CITIES = ["الرياض", "جدة", "الدمام", "مكة المكرمة", "المدينة المنورة", "الخبر", "تبوك", "أبها"];

interface CustomerRequest {
  id: number;
  title: string;
  category: string;
  city: string;
  district?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  details?: string | null;
  contactMethod?: string | null;
  status: string;
  createdAt: string;
  posterName?: string | null;
}

export default function Requests() {
  const { isAuthenticated } = useAuth();
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    const params = new URLSearchParams({ status: "open" });
    if (category) params.set("category", category);
    if (city) params.set("city", city);
    const res = await fetch(`/api/customer-requests?${params}`, { credentials: "include" });
    if (res.ok) setRequests(await res.json() as CustomerRequest[]);
    setLoading(false);
  };

  useEffect(() => { void fetchRequests(); }, [category, city]);

  const formatBudget = (min?: number | null, max?: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `${min.toLocaleString("ar-SA")} – ${max.toLocaleString("ar-SA")} ر.س`;
    if (min) return `من ${min.toLocaleString("ar-SA")} ر.س`;
    return `حتى ${max!.toLocaleString("ar-SA")} ر.س`;
  };

  return (
    <Layout>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">الطلبات</h1>
            <p className="text-muted-foreground mt-1">طلبات العملاء المفتوحة التي تبحث عن خدمة أو عقار</p>
          </div>
          {isAuthenticated && (
            <Button asChild className="gap-2 rounded-xl">
              <Link href="/requests/new">
                <PlusCircle className="w-4 h-4" />
                نشر طلب
              </Link>
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory("")}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${!category ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border/60 text-muted-foreground hover:text-foreground"}`}
          >
            الكل
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c === category ? "" : c)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${c === category ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border/60 text-muted-foreground hover:text-foreground"}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <select value={city} onChange={e => setCity(e.target.value)} className="h-10 rounded-xl border border-input bg-background px-3 text-sm">
            <option value="">كل المدن</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد طلبات مفتوحة</h3>
            <p className="text-muted-foreground mb-6">كن أول من ينشر طلبه</p>
            {isAuthenticated ? (
              <Button asChild className="rounded-xl gap-2">
                <Link href="/requests/new"><PlusCircle className="w-4 h-4" />نشر طلب</Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/signup">إنشاء حساب للنشر</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(r => {
              const budget = formatBudget(r.budgetMin, r.budgetMax);
              return (
                <Card key={r.id} className="border-border/60 hover:border-border hover:shadow-sm transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <h3 className="font-semibold text-foreground">{r.title}</h3>
                          <Badge variant="outline" className="shrink-0">{r.category}</Badge>
                        </div>
                        {r.details && (
                          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{r.details}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{r.city}{r.district ? ` · ${r.district}` : ""}</span>
                          {budget && <span className="font-medium text-foreground">الميزانية: {budget}</span>}
                          {r.posterName && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{r.posterName}</span>}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(r.createdAt).toLocaleDateString("ar-SA")}
                          </span>
                          {r.contactMethod && <Badge variant="secondary" className="text-xs">{r.contactMethod}</Badge>}
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
    </Layout>
  );
}
