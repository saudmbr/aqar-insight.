import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  ShieldCheck, Users, Building2, FileText, Wrench, BarChart3,
  Activity, BellRing, TrendingUp, Star, Eye, MapPin, AlertTriangle, Info,
  CheckCircle2,
} from "lucide-react";

const BASE = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

// ── Types ─────────────────────────────────────────────────────────────────────
type RowKV = { [k: string]: string | number };
type ReportData = {
  period: string;
  overview: {
    totalUsers: number; totalListings: number; activeListings: number;
    archivedListings: number; totalRequests: number; totalServices: number;
    totalMarketers: number; totalFavorites: number;
    newUsers: number; newListings: number; newRequests: number; newServices: number;
  };
  users:    { byRole: RowKV[] };
  listings: {
    byStatus: RowKV[]; byCity: RowKV[]; byType: RowKV[];
    byListingType: RowKV[]; priceStats: RowKV;
    featuredCount: number; verifiedCount: number; topByViews: RowKV[];
  };
  requests: { byStatus: RowKV[]; byType: RowKV[]; byCity: RowKV[] };
  services: { byCategory: RowKV[]; byCity: RowKV[] };
  market:   { byCities: RowKV[]; byDistricts: RowKV[] };
  operational: { activeSessions: number };
  alerts: { type: string; message: string; severity: "high"|"medium"|"low" }[];
};

// ── Constants ─────────────────────────────────────────────────────────────────
const PALETTE = ["#0F7BA0","#DB2777","#34D399","#8B5CF6","#F97316","#EF4444","#06B6D4","#F59E0B","#EC4899","#14B8A6"];

const PERIODS = [
  { value: "day",     label: "اليوم"       },
  { value: "week",    label: "الأسبوع"     },
  { value: "month",   label: "الشهر"       },
  { value: "quarter", label: "ربع سنة"     },
  { value: "year",    label: "السنة"       },
];

const ROLE_LABELS: Record<string, string> = {
  user:                  "مستخدم عادي",
  real_estate_marketer:  "مسوّق عقاري",
  service_provider:      "مقدم خدمة",
  admin:                 "مدير",
};

const STATUS_LABELS: Record<string, string> = {
  active:   "نشط",   archived: "مؤرشف",
  pending:  "معلق",  sold:     "مباع",
  rented:   "مؤجر",  closed:   "مغلق",
};

const TYPE_LABELS: Record<string, string> = {
  sale:     "بيع",   rent:     "إيجار",
  property: "طلب عقار", service: "طلب خدمة", marketer: "طلب مسوّق",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function localise(rows: RowKV[], key: string, labelMap: Record<string, string>): RowKV[] {
  return rows.map(r => ({ ...r, [key]: labelMap[String(r[key])] ?? String(r[key]) }));
}

// ── Sub-components ────────────────────────────────────────────────────────────
function KPICard({
  label, value, sub, icon: Icon, color = "#0F7BA0", loading,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color?: string; loading?: boolean;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </span>
      </div>
      {loading ? <Skeleton className="h-8 w-24" /> : (
        <div className="text-2xl font-extrabold text-foreground leading-none">
          {typeof value === "number" ? formatNumber(value) : value}
        </div>
      )}
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function EmptyChart({ message = "لا توجد بيانات كافية لعرض هذا المخطط" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[200px] gap-2 text-muted-foreground">
      <BarChart3 className="w-8 h-8 opacity-20" />
      <p className="text-sm text-center max-w-xs">{message}</p>
    </div>
  );
}

function SectionCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
      <div className="mb-4">
        <div className="text-sm font-bold text-foreground">{title}</div>
        {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function HBarChart({ data, dataKey, nameKey, h = 260 }: { data: RowKV[]; dataKey: string; nameKey: string; h?: number }) {
  if (!data.length) return <EmptyChart />;
  return (
    <div style={{ height: h }} dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 2, right: 20, left: 6, bottom: 2 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
          <YAxis type="category" dataKey={nameKey} axisLine={false} tickLine={false}
            tick={{ fill: "var(--foreground)", fontSize: 11 }} width={90} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 20px -5px rgba(0,0,0,.15)" }}
            cursor={{ fill: "var(--muted)" }}
          />
          <Bar dataKey={dataKey} fill="#0F7BA0" radius={[0, 5, 5, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DonutChart({ data, nameKey, dataKey }: { data: RowKV[]; nameKey: string; dataKey: string }) {
  if (data.length < 2) return <EmptyChart message="بيانات غير كافية لعرض المخطط الدائري" />;
  return (
    <div className="h-[240px]" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius="38%" outerRadius="68%"
            paddingAngle={2} dataKey={dataKey} nameKey={nameKey} startAngle={90} endAngle={-270}>
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="var(--card)" strokeWidth={2} />)}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 20px -5px rgba(0,0,0,.15)" }} />
          <Legend iconType="circle" iconSize={9}
            formatter={(v) => <span style={{ color: "var(--foreground)", fontSize: 11 }}>{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function DataTable({ rows, cols }: { rows: RowKV[]; cols: { key: string; label: string; fmt?: (v: number) => string }[] }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-right">
        <thead className="bg-muted/30 border-b border-border">
          <tr>{cols.map(c => <th key={c.key} className="px-4 py-2.5 text-[11px] font-bold text-muted-foreground">{c.label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-muted/15 transition-colors">
              {cols.map(c => (
                <td key={c.key} className="px-4 py-2.5 text-foreground">
                  {c.fmt ? c.fmt(Number(row[c.key])) : String(row[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminReports() {
  const [period, setPeriod] = useState("month");

  const { data, isLoading, error } = useQuery<ReportData>({
    queryKey: ["admin-reports", period],
    queryFn: async () => {
      const res = await fetch(`${BASE()}/api/admin/reports?period=${period}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    staleTime: 30_000,
    retry: false,
  });

  const highAlerts = useMemo(() => data?.alerts.filter(a => a.severity === "high") ?? [], [data]);

  const currentPeriodLabel = PERIODS.find(p => p.value === period)?.label ?? "";

  if (error) return (
    <Layout>
      <div dir="rtl" className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-muted-foreground">
        <ShieldCheck className="w-10 h-10 opacity-20" />
        <p className="text-sm font-medium">تعذّر تحميل التقارير. تأكد من صلاحيات الأدمن.</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-5 pb-14"
        dir="rtl"
      >

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div
          className="relative rounded-[2rem] overflow-hidden p-8 md:p-10"
          style={{ background: "linear-gradient(140deg, #0F1C3F 0%, #0F1C3F 50%, #0d3d5a 100%)" }}
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.035 }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_90%_at_top_right,rgba(201,168,76,0.12),transparent)] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/90 px-3 py-1 rounded-full text-xs font-bold mb-4">
                <ShieldCheck className="w-3.5 h-3.5" />
                لوحة الأدمن — بيانات حقيقية من المنصة
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">التقارير وأداء المنصة</h1>
              <p className="text-white/65 mt-2 text-sm max-w-lg">نظرة شاملة وحصرية على جميع مؤشرات ونشاط المنصة — مبنية على البيانات الداخلية الفعلية</p>
            </div>
            {/* Period filter */}
            <div className="flex flex-wrap gap-2">
              {PERIODS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
                  style={period === p.value
                    ? { background: "#0F7BA0", color: "#fff", borderColor: "#0F7BA0" }
                    : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)", borderColor: "rgba(255,255,255,0.2)" }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── High-severity alerts banner ───────────────────────────────────── */}
        {highAlerts.length > 0 && (
          <div className="flex flex-col gap-2">
            {highAlerts.map((a, i) => (
              <div key={i} className="flex items-center gap-3 bg-destructive/8 border border-destructive/25 rounded-2xl px-5 py-3">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <span className="text-sm font-medium text-destructive">{a.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Tabs ──────────────────────────────────────────────────────────── */}
        <Tabs defaultValue="overview" dir="rtl">
          <div className="overflow-x-auto pb-1">
            <TabsList className="flex w-max min-w-full bg-muted/40 rounded-2xl p-1 gap-0.5 border border-border/50">
              {[
                { value: "overview",    label: "نظرة عامة",     icon: Activity    },
                { value: "users",       label: "المستخدمون",    icon: Users       },
                { value: "listings",    label: "العقارات",      icon: Building2   },
                { value: "requests",    label: "الطلبات",       icon: FileText    },
                { value: "services",    label: "الخدمات",       icon: Wrench      },
                { value: "market",      label: "السوق",         icon: TrendingUp  },
                { value: "operational", label: "التشغيل",       icon: BarChart3   },
                { value: "alerts",      label: "التنبيهات",     icon: BellRing    },
              ].map(t => (
                <TabsTrigger key={t.value} value={t.value}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl whitespace-nowrap data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-primary">
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ── A: نظرة عامة ─────────────────────────────────────────────── */}
          <TabsContent value="overview" className="mt-5 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <KPICard label="إجمالي المستخدمين"    value={data?.overview.totalUsers    ?? 0} sub={`+${data?.overview.newUsers ?? 0} خلال ${currentPeriodLabel}`}    icon={Users}      loading={isLoading} />
              <KPICard label="إجمالي الإعلانات"    value={data?.overview.totalListings  ?? 0} sub={`+${data?.overview.newListings ?? 0} جديد خلال ${currentPeriodLabel}`} icon={Building2}  color="#DB2777" loading={isLoading} />
              <KPICard label="الإعلانات النشطة"    value={data?.overview.activeListings  ?? 0} sub="الإعلانات الظاهرة حالياً للجمهور"                                  icon={CheckCircle2} color="#34D399" loading={isLoading} />
              <KPICard label="إجمالي الطلبات"      value={data?.overview.totalRequests   ?? 0} sub={`+${data?.overview.newRequests ?? 0} جديد`}                         icon={FileText}   color="#8B5CF6" loading={isLoading} />
              <KPICard label="إجمالي الخدمات"      value={data?.overview.totalServices   ?? 0} sub={`+${data?.overview.newServices ?? 0} جديد`}                         icon={Wrench}     color="#F97316" loading={isLoading} />
              <KPICard label="المسوّقون العقاريون" value={data?.overview.totalMarketers  ?? 0} sub="ملفات المسوّقين المسجلة"                                            icon={Star}       color="#EF4444" loading={isLoading} />
              <KPICard label="المفضّلة"            value={data?.overview.totalFavorites  ?? 0} sub="إجمالي إضافات المفضّلة"                                             icon={Star}       color="#06B6D4" loading={isLoading} />
              <KPICard label="الإعلانات المؤرشفة"  value={data?.overview.archivedListings ?? 0} sub="إعلانات خارج نطاق العرض"                                          icon={FileText}   color="#94A3B8" loading={isLoading} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SectionCard title="النشاط خلال الفترة المحددة" sub={`خلال ${currentPeriodLabel} — أعداد الجديد`}>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {[
                    { label: "مستخدمون جدد",   value: data?.overview.newUsers    ?? 0, color: "#0F7BA0" },
                    { label: "إعلانات جديدة",  value: data?.overview.newListings ?? 0, color: "#DB2777" },
                    { label: "طلبات جديدة",    value: data?.overview.newRequests ?? 0, color: "#8B5CF6" },
                    { label: "خدمات جديدة",    value: data?.overview.newServices ?? 0, color: "#34D399" },
                  ].map(item => (
                    <div key={item.label} className="bg-muted/30 rounded-xl p-3 text-center">
                      {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : (
                        <div className="text-2xl font-extrabold" style={{ color: item.color }}>{formatNumber(item.value)}</div>
                      )}
                      <div className="text-[11px] text-muted-foreground mt-1">{item.label}</div>
                    </div>
                  ))}
                </div>
              </SectionCard>
              <SectionCard title="نسبة النشاط" sub="إعلانات نشطة مقابل الإجمالي">
                {isLoading ? <Skeleton className="h-[140px]" /> : (() => {
                  const total = data?.overview.totalListings ?? 0;
                  const active = data?.overview.activeListings ?? 0;
                  const pct = total > 0 ? Math.round((active / total) * 100) : 0;
                  return (
                    <div className="flex flex-col items-center justify-center gap-3 py-4">
                      <div className="relative w-24 h-24">
                        <svg viewBox="0 0 36 36" className="w-24 h-24 rotate-[-90deg]">
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--muted)" strokeWidth="3" />
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#34D399" strokeWidth="3"
                            strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-extrabold text-foreground">{pct}%</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        {active} إعلان نشط من أصل {total} إعلان
                      </p>
                    </div>
                  );
                })()}
              </SectionCard>
            </div>
          </TabsContent>

          {/* ── B: المستخدمون ─────────────────────────────────────────────── */}
          <TabsContent value="users" className="mt-5 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <KPICard label="إجمالي المستخدمين"  value={data?.overview.totalUsers ?? 0}  icon={Users}   loading={isLoading} />
              <KPICard label="جدد خلال الفترة"    value={data?.overview.newUsers ?? 0}   icon={TrendingUp} color="#34D399" loading={isLoading}
                sub={`خلال ${currentPeriodLabel}`} />
              <KPICard label="المسوّقون المسجلون" value={data?.overview.totalMarketers ?? 0} icon={Star} color="#DB2777" loading={isLoading} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SectionCard title="توزيع المستخدمين حسب الدور" sub="نسبة كل دور من إجمالي المستخدمين">
                {isLoading ? <Skeleton className="h-[240px]" /> : (
                  <DonutChart
                    data={localise(data?.users.byRole ?? [], "role", ROLE_LABELS).map(r => ({ ...r, count: r.count }))}
                    nameKey="role" dataKey="count"
                  />
                )}
              </SectionCard>
              <SectionCard title="الأدوار تفصيلياً" sub="عدد المستخدمين في كل دور">
                {isLoading ? <Skeleton className="h-[240px]" /> : (
                  <DataTable
                    rows={localise(data?.users.byRole ?? [], "role", ROLE_LABELS)}
                    cols={[
                      { key: "role",  label: "الدور"   },
                      { key: "count", label: "العدد", fmt: formatNumber },
                    ]}
                  />
                )}
              </SectionCard>
            </div>
          </TabsContent>

          {/* ── C: العقارات ───────────────────────────────────────────────── */}
          <TabsContent value="listings" className="mt-5 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KPICard label="إجمالي الإعلانات"  value={data?.overview.totalListings ?? 0}   icon={Building2}  loading={isLoading} />
              <KPICard label="نشط"                value={data?.overview.activeListings ?? 0}  icon={CheckCircle2} color="#34D399" loading={isLoading} />
              <KPICard label="مؤرشف"             value={data?.overview.archivedListings ?? 0} icon={FileText}   color="#94A3B8" loading={isLoading} />
              <KPICard label="مميّز (Featured)"   value={data?.listings.featuredCount ?? 0}   icon={Star}       color="#DB2777" loading={isLoading} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm">
                <div className="text-xs font-bold text-muted-foreground mb-1">متوسط السعر</div>
                {isLoading ? <Skeleton className="h-7 w-32" /> : <div className="text-xl font-extrabold text-primary">{formatCurrency(Number(data?.listings.priceStats?.avg_price ?? 0))}</div>}
              </div>
              <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm">
                <div className="text-xs font-bold text-muted-foreground mb-1">متوسط سعر المتر</div>
                {isLoading ? <Skeleton className="h-7 w-32" /> : <div className="text-xl font-extrabold text-foreground">{formatCurrency(Number(data?.listings.priceStats?.avg_psm ?? 0))}</div>}
              </div>
              <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm">
                <div className="text-xs font-bold text-muted-foreground mb-1">موثّق (Verified)</div>
                {isLoading ? <Skeleton className="h-7 w-16" /> : <div className="text-xl font-extrabold text-foreground">{formatNumber(data?.listings.verifiedCount ?? 0)}</div>}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SectionCard title="توزيع حسب الحالة" sub="نشط، مؤرشف، وغيرها">
                {isLoading ? <Skeleton className="h-[240px]" /> : (
                  <DonutChart
                    data={localise(data?.listings.byStatus ?? [], "status", STATUS_LABELS)}
                    nameKey="status" dataKey="count"
                  />
                )}
              </SectionCard>
              <SectionCard title="توزيع بيع / إيجار" sub="طبيعة الإعلانات">
                {isLoading ? <Skeleton className="h-[240px]" /> : (
                  <DonutChart
                    data={localise(data?.listings.byListingType ?? [], "type", TYPE_LABELS)}
                    nameKey="type" dataKey="count"
                  />
                )}
              </SectionCard>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SectionCard title="أكثر المدن إعلانات" sub="أعلى 10 مدن من حيث عدد الإعلانات">
                {isLoading ? <Skeleton className="h-[260px]" /> : (
                  <HBarChart data={data?.listings.byCity ?? []} dataKey="count" nameKey="city" />
                )}
              </SectionCard>
              <SectionCard title="توزيع حسب نوع العقار" sub="أكثر الأنواع حضوراً">
                {isLoading ? <Skeleton className="h-[260px]" /> : (
                  <HBarChart data={data?.listings.byType ?? []} dataKey="count" nameKey="type" />
                )}
              </SectionCard>
            </div>
            {(data?.listings.topByViews ?? []).length > 0 && (
              <SectionCard title="الإعلانات الأكثر مشاهدة" sub="حسب عداد المشاهدات الداخلي">
                <DataTable
                  rows={data?.listings.topByViews ?? []}
                  cols={[
                    { key: "title", label: "عنوان الإعلان" },
                    { key: "city",  label: "المدينة"        },
                    { key: "views", label: "المشاهدات", fmt: formatNumber },
                  ]}
                />
              </SectionCard>
            )}
          </TabsContent>

          {/* ── D: الطلبات ────────────────────────────────────────────────── */}
          <TabsContent value="requests" className="mt-5 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <KPICard label="إجمالي الطلبات"  value={data?.overview.totalRequests ?? 0} icon={FileText}   loading={isLoading} />
              <KPICard label="جدد خلال الفترة" value={data?.overview.newRequests ?? 0}   icon={TrendingUp} color="#34D399" loading={isLoading} sub={`خلال ${currentPeriodLabel}`} />
              <KPICard label="نشطة"            value={(data?.requests.byStatus ?? []).find(r => r.status === "active")?.count ?? 0} icon={Activity} color="#DB2777" loading={isLoading} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SectionCard title="توزيع الطلبات حسب الحالة">
                {isLoading ? <Skeleton className="h-[240px]" /> : (
                  <DonutChart
                    data={localise(data?.requests.byStatus ?? [], "status", STATUS_LABELS)}
                    nameKey="status" dataKey="count"
                  />
                )}
              </SectionCard>
              <SectionCard title="توزيع الطلبات حسب النوع">
                {isLoading ? <Skeleton className="h-[240px]" /> : (
                  <DonutChart
                    data={localise(data?.requests.byType ?? [], "type", TYPE_LABELS)}
                    nameKey="type" dataKey="count"
                  />
                )}
              </SectionCard>
            </div>
            <SectionCard title="أكثر المدن نشاطاً في الطلبات">
              {isLoading ? <Skeleton className="h-[260px]" /> : (
                <HBarChart data={data?.requests.byCity ?? []} dataKey="count" nameKey="city" />
              )}
            </SectionCard>
          </TabsContent>

          {/* ── E: الخدمات ────────────────────────────────────────────────── */}
          <TabsContent value="services" className="mt-5 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <KPICard label="إجمالي الخدمات"  value={data?.overview.totalServices ?? 0} icon={Wrench}     loading={isLoading} />
              <KPICard label="جدد خلال الفترة" value={data?.overview.newServices ?? 0}   icon={TrendingUp} color="#34D399" loading={isLoading} sub={`خلال ${currentPeriodLabel}`} />
              <KPICard label="تصنيفات مختلفة"  value={(data?.services.byCategory ?? []).length} icon={BarChart3} color="#8B5CF6" loading={isLoading} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SectionCard title="توزيع الخدمات حسب التصنيف" sub="أكثر الفئات تسجيلاً">
                {isLoading ? <Skeleton className="h-[260px]" /> : (
                  <HBarChart data={data?.services.byCategory ?? []} dataKey="count" nameKey="category" />
                )}
              </SectionCard>
              <SectionCard title="توزيع الخدمات حسب المدينة">
                {isLoading ? <Skeleton className="h-[260px]" /> : (
                  <HBarChart data={data?.services.byCity ?? []} dataKey="count" nameKey="city" />
                )}
              </SectionCard>
            </div>
          </TabsContent>

          {/* ── F: السوق ──────────────────────────────────────────────────── */}
          <TabsContent value="market" className="mt-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm">
                <div className="text-xs font-bold text-muted-foreground mb-1">متوسط السعر الكلي</div>
                {isLoading ? <Skeleton className="h-7 w-32" /> : <div className="text-xl font-extrabold text-primary">{formatCurrency(Number(data?.listings.priceStats?.avg_price ?? 0))}</div>}
                <div className="text-[11px] text-muted-foreground mt-1">على الإعلانات النشطة</div>
              </div>
              <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm">
                <div className="text-xs font-bold text-muted-foreground mb-1">متوسط سعر المتر</div>
                {isLoading ? <Skeleton className="h-7 w-32" /> : <div className="text-xl font-extrabold text-foreground">{formatCurrency(Number(data?.listings.priceStats?.avg_psm ?? 0))}</div>}
              </div>
              <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm">
                <div className="text-xs font-bold text-muted-foreground mb-1">أعلى سعر مسجّل</div>
                {isLoading ? <Skeleton className="h-7 w-32" /> : <div className="text-xl font-extrabold text-foreground">{formatCurrency(Number(data?.listings.priceStats?.max_price ?? 0))}</div>}
              </div>
            </div>
            <SectionCard title="أعلى المدن سعراً لمتر" sub="مبني على الإعلانات النشطة فقط">
              {isLoading ? <Skeleton className="h-[260px]" /> : data?.market.byCities.length ? (
                <HBarChart data={data.market.byCities} dataKey="avg_psm" nameKey="city" />
              ) : <EmptyChart />}
            </SectionCard>
            <SectionCard title="الأحياء الأعلى سعراً لمتر" sub="أعلى 10 أحياء حسب متوسط السعر / م²">
              {isLoading ? <Skeleton className="h-[240px]" /> : (
                <DataTable
                  rows={data?.market.byDistricts ?? []}
                  cols={[
                    { key: "district",  label: "الحي"         },
                    { key: "city",      label: "المدينة"      },
                    { key: "avg_psm",   label: "سعر المتر",   fmt: formatCurrency },
                    { key: "avg_price", label: "متوسط السعر", fmt: formatCurrency },
                    { key: "count",     label: "إعلانات",     fmt: formatNumber   },
                  ]}
                />
              )}
            </SectionCard>
          </TabsContent>

          {/* ── G: التشغيل ────────────────────────────────────────────────── */}
          <TabsContent value="operational" className="mt-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <KPICard label="جلسات نشطة في الخادم" value={data?.operational.activeSessions ?? 0}
                icon={Activity} color="#0F7BA0" loading={isLoading}
                sub="عدد جلسات تسجيل الدخول المحفوظة في الخادم حالياً" />
              <KPICard label="إعلانات مميّزة" value={data?.listings.featuredCount ?? 0}
                icon={Star} color="#DB2777" loading={isLoading} />
              <KPICard label="إعلانات موثّقة" value={data?.listings.verifiedCount ?? 0}
                icon={CheckCircle2} color="#34D399" loading={isLoading} />
            </div>
            <SectionCard title="التقارير المالية" sub="H — البيانات المالية للمنصة">
              <div className="flex items-center gap-3 bg-muted/30 rounded-xl px-5 py-4">
                <Info className="w-5 h-5 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">
                  لا توجد بيانات مالية كافية حاليًا — هذا القسم سيُفعّل فور ربط نظام الدفع والاشتراكات بالمنصة.
                </p>
              </div>
            </SectionCard>
          </TabsContent>

          {/* ── I: التنبيهات ──────────────────────────────────────────────── */}
          <TabsContent value="alerts" className="mt-5 space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-2xl" />)
            ) : (data?.alerts ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3 text-muted-foreground bg-card rounded-2xl border border-dashed border-border/60">
                <CheckCircle2 className="w-10 h-10 text-green-500 opacity-60" />
                <p className="text-sm font-medium">لا توجد تنبيهات حالياً — المنصة تعمل بشكل طبيعي</p>
              </div>
            ) : (data?.alerts ?? []).map((alert, i) => {
              const colors = { high: "#EF4444", medium: "#F97316", low: "#EAB308" };
              const icons  = { high: AlertTriangle, medium: BellRing, low: Info };
              const labels = { high: "حرج", medium: "متوسط", low: "منخفض" };
              const Icon   = icons[alert.severity];
              const color  = colors[alert.severity];
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 bg-card rounded-2xl border border-border/60 px-5 py-4 shadow-sm"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
                    <Icon className="w-4.5 h-4.5" style={{ color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{alert.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">{alert.type}</p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{ color, background: `${color}15` }}>
                    {labels[alert.severity]}
                  </span>
                </motion.div>
              );
            })}
            {!isLoading && (data?.alerts ?? []).length > 0 && (
              <p className="text-[11px] text-muted-foreground text-center pt-2">
                {(data?.alerts ?? []).length} تنبيه — مبنية على الحالة الفعلية للبيانات الداخلية
              </p>
            )}
          </TabsContent>
        </Tabs>

        {/* ── Footer note ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground pt-2">
          <MapPin className="w-3 h-3 opacity-50" />
          جميع الأرقام مستخرجة من قاعدة بيانات المنصة الداخلية — لا تُعرض لغير المدير
          <Eye className="w-3 h-3 opacity-50" />
        </div>

      </motion.div>
    </Layout>
  );
}
