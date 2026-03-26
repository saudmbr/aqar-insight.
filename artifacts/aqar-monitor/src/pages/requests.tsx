import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { FileText, PlusCircle, MapPin, User, Calendar, MessageSquare, ArrowLeft } from "lucide-react";

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
      <div className="space-y-8 pb-12 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-card p-8 rounded-3xl border border-border shadow-sm">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2">سوق الطلبات</h1>
            <p className="text-lg text-muted-foreground">تصفح طلبات العملاء أو انشر طلبك للبحث عن عقار أو خدمة</p>
          </div>
          {isAuthenticated ? (
            <Button asChild size="lg" className="gap-2 rounded-2xl h-14 px-8 shadow-lg shadow-primary/20 shrink-0 text-base font-bold">
              <Link href="/requests/new">
                <PlusCircle className="w-5 h-5" />
                اطلب الآن
              </Link>
            </Button>
          ) : (
             <Button asChild size="lg" variant="outline" className="gap-2 rounded-2xl h-14 px-8 shrink-0 text-base font-bold border-border">
              <Link href="/signup">
                سجل حساب للطلب
              </Link>
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1">
            <button
              onClick={() => setCategory("")}
              className={`shrink-0 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${!category ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-card border border-border text-muted-foreground hover:bg-muted"}`}
            >
              جميع الطلبات
            </button>
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c === category ? "" : c)}
                className={`shrink-0 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${c === category ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-card border border-border text-muted-foreground hover:bg-muted"}`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="shrink-0 w-full md:w-64">
            <select value={city} onChange={e => setCity(e.target.value)} className="w-full h-12 rounded-2xl border border-border bg-card px-4 text-base font-semibold outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm">
              <option value="">كل المدن</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-3xl" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-card rounded-3xl border border-border border-dashed">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-foreground">لا توجد طلبات حالياً</h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-md">لم يتم العثور على طلبات مفتوحة في هذا القسم. كن أول من يضيف طلباً!</p>
            {isAuthenticated && (
              <Button asChild size="lg" className="rounded-xl gap-2 font-bold px-8 shadow-lg shadow-primary/20">
                <Link href="/requests/new"><PlusCircle className="w-5 h-5" />نشر طلب جديد</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {requests.map(r => {
              const budget = formatBudget(r.budgetMin, r.budgetMax);
              return (
                <Card key={r.id} className="border-border rounded-3xl overflow-hidden hover-premium-shadow group bg-card transition-all">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row gap-6">
                      
                      {/* Icon side */}
                      <div className="hidden md:flex flex-col items-center gap-3 shrink-0 w-24">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white text-primary transition-colors">
                          <MessageSquare className="w-7 h-7" />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground text-center">
                          {new Date(r.createdAt).toLocaleDateString("ar-SA")}
                        </span>
                      </div>

                      {/* Content side */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <Badge className="bg-secondary text-secondary-foreground font-bold px-3 py-1 rounded-lg border-none">{r.category}</Badge>
                              <span className="text-sm font-medium text-primary flex items-center gap-1.5 bg-primary/5 px-2 py-1 rounded-md">
                                <MapPin className="w-3.5 h-3.5" />{r.city}{r.district ? ` ، ${r.district}` : ""}
                              </span>
                            </div>
                            <h3 className="text-2xl font-extrabold text-foreground group-hover:text-primary transition-colors">{r.title}</h3>
                          </div>
                          
                          {budget && (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-700 px-4 py-2 rounded-xl text-center shrink-0">
                              <p className="text-xs font-bold mb-0.5">الميزانية المتوقعة</p>
                              <p className="text-sm font-extrabold">{budget}</p>
                            </div>
                          )}
                        </div>

                        {r.details && (
                          <div className="bg-muted/40 rounded-2xl p-4 mb-4 border border-border/50">
                            <p className="text-base text-foreground leading-relaxed line-clamp-3">{r.details}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-4 mt-auto pt-4 border-t border-border">
                          <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                            {r.posterName && (
                              <span className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center text-xs text-foreground font-bold">
                                  {r.posterName.charAt(0)}
                                </div>
                                {r.posterName}
                              </span>
                            )}
                            {r.contactMethod && (
                              <span className="flex items-center gap-1.5">
                                • تواصل عبر: <span className="text-foreground font-bold">{r.contactMethod}</span>
                              </span>
                            )}
                          </div>
                          
                          <Button variant="outline" className="rounded-xl font-bold border-primary text-primary hover:bg-primary hover:text-white px-6">
                            عرض التفاصيل <ArrowLeft className="w-4 h-4 ml-2" />
                          </Button>
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
