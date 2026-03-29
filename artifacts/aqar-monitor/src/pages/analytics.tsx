import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/layout/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, BarChart3, Building2,
  MapPin, Activity, Lightbulb, ArrowUpRight, ArrowDownRight,
  Scale, Target, Zap, Star, Home, AlertCircle, CheckCircle2,
  Flame, Clock, Grid3X3, Globe, PieChart as PieChartIcon,
  Award, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  useAnalytics, useAnalyticsTrends, useAnalyticsFilterOptions,
  computeMarketDirection, computeActivityLevel, TIME_WINDOWS,
  type AnalyticsFilters, type InsightsData, type TrendPoint,
} from "@/hooks/use-analytics";
import { formatCurrency, formatNumber } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const SECTION_TABS = [
  { id: "A", label: "مؤشر السوق",       icon: Award },
  { id: "B", label: "الأسعار",           icon: BarChart3 },
  { id: "C", label: "الحركة والنشاط",    icon: Activity },
  { id: "D", label: "العرض والطلب",      icon: Scale },
  { id: "E", label: "الأنواع",           icon: Grid3X3 },
  { id: "F", label: "الأحياء والمدن",   icon: MapPin },
  { id: "G", label: "الذكاء التحليلي",  icon: Lightbulb },
] as const;

type SectionId = "A" | "B" | "C" | "D" | "E" | "F" | "G";

const PERIOD_TABS = [
  { value: "day",     label: "يومي" },
  { value: "week",    label: "أسبوعي" },
  { value: "month",   label: "شهري" },
  { value: "quarter", label: "ربع سنوي" },
  { value: "year",    label: "سنوي" },
];

const BAR_COLORS = ["#0F7BA0","#0F1C3F","#34D399","#8B5CF6","#F97316","#EF4444","#64748B","#F59E0B"];
const PIE_COLORS = ["#0F7BA0","#0F1C3F","#34D399","#8B5CF6","#F97316","#EF4444","#F59E0B","#94A3B8"];
const INPUT_CLS = "w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";

// ── Helper Components ─────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color = "#0F7BA0", loading }: {
  label: string; value: React.ReactNode; sub?: string; color?: string; loading?: boolean;
}) {
  return (
    <div className="bg-card rounded-[22px] border border-border/60 overflow-hidden shadow-sm hover:-translate-y-0.5 transition-transform duration-200">
      <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${color}, ${color}44)` }} />
      <div className="p-5">
        <div className="text-[12px] text-muted-foreground mb-2">{label}</div>
        <div className="text-[1.65rem] font-extrabold leading-none mb-1.5 tabular-nums tracking-tight" style={{ color }}>
          {loading ? <Skeleton className="h-8 w-24 inline-block" /> : value}
        </div>
        {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}

function StatusBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-full"
      style={{ color, background: bg }}>{label}</span>
  );
}

function IndicatorCard({ title, value, status, statusColor, statusBg, detail, icon: Icon, loading }: {
  title: string; value?: string; status: string; statusColor: string; statusBg: string;
  detail?: string; icon: React.ComponentType<{ className?: string }>; loading?: boolean;
}) {
  return (
    <div className="bg-card rounded-[22px] border border-border/60 p-5 shadow-sm hover:-translate-y-0.5 transition-transform duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${statusColor}14` }}>
          <Icon className="w-4 h-4" style={{ color: statusColor }} />
        </div>
        {loading ? <Skeleton className="h-5 w-16" /> : <StatusBadge label={status} color={statusColor} bg={statusBg} />}
      </div>
      <div className="text-[13px] font-bold text-foreground mb-1">{title}</div>
      {value && <div className="text-xl font-extrabold" style={{ color: statusColor }}>{loading ? <Skeleton className="h-6 w-20 inline-block" /> : value}</div>}
      {detail && <div className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{detail}</div>}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3 text-muted-foreground bg-card rounded-2xl border border-dashed border-border/60">
      <BarChart3 className="w-10 h-10 opacity-20" />
      <p className="text-sm font-medium text-center max-w-xs">{text}</p>
    </div>
  );
}

function SectionContainer({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }} className="space-y-5">
      {children}
    </motion.div>
  );
}

function ChartCard({ title, children, height = 240 }: { title: string; children: React.ReactNode; height?: number }) {
  return (
    <div className="bg-card rounded-[22px] border border-border/60 p-5 shadow-sm">
      <div className="text-[13px] font-bold text-foreground mb-4">{title}</div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}

// ── Market Score Widget ───────────────────────────────────────────────────────

function MarketScoreWidget({ score, label, components, explanation, loading }: {
  score: number; label: string; components: { activity: number; diversity: number; stability: number };
  explanation?: string; loading?: boolean;
}) {
  const color = score >= 65 ? "#22C55E" : score >= 35 ? "#0F7BA0" : "#F59E0B";
  const bg = score >= 65 ? "#F0FDF4" : score >= 35 ? "#EFF6FF" : "#FFFBEB";
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = loading ? circumference : circumference * (1 - score / 100);

  return (
    <div className="bg-card rounded-[22px] border border-border/60 p-6 shadow-sm">
      <div className="flex items-start gap-6">
        {/* Gauge */}
        <div className="shrink-0">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="10" />
            <circle cx="60" cy="60" r={radius} fill="none" stroke={color}
              strokeWidth="10" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 60 60)"
              style={{ transition: "stroke-dashoffset 1s ease" }} />
            <text x="60" y="56" textAnchor="middle" fontSize="24" fontWeight="800" fill={color}>{loading ? "—" : score}</text>
            <text x="60" y="72" textAnchor="middle" fontSize="11" fill="#64748B">/ 100</text>
          </svg>
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0 pt-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[13px] font-bold text-foreground">مؤشر صحة السوق</span>
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full" style={{ color, background: bg }}>
              {loading ? "—" : label}
            </span>
          </div>
          {/* Component bars */}
          <div className="space-y-2">
            {[
              { name: "النشاط", val: components.activity, max: 40, color: "#0F7BA0" },
              { name: "التنوع", val: components.diversity, max: 30, color: "#8B5CF6" },
              { name: "الاستقرار", val: components.stability, max: 30, color: "#22C55E" },
            ].map(c => (
              <div key={c.name}>
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="text-muted-foreground">{c.name}</span>
                  <span className="font-bold tabular-nums" style={{ color: c.color }}>{loading ? "—" : `${c.val}/${c.max}`}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: loading ? "0%" : `${(c.val / c.max) * 100}%`, background: c.color }} />
                </div>
              </div>
            ))}
          </div>
          {explanation && <div className="text-[10px] text-muted-foreground mt-2">{explanation}</div>}
        </div>
      </div>
    </div>
  );
}

// ── Trend Chart ───────────────────────────────────────────────────────────────

function TrendChart({ trends, loading, metric }: { trends?: TrendPoint[]; loading: boolean; metric: "avgPrice" | "count" | "avgPricePerSqm" }) {
  const colorMap = { avgPrice: "#0F7BA0", count: "#8B5CF6", avgPricePerSqm: "#22C55E" };
  const color = colorMap[metric];
  const labelMap = { avgPrice: "متوسط السعر", count: "عدد الإعلانات", avgPricePerSqm: "سعر المتر" };

  if (loading) return <Skeleton className="w-full h-full rounded-xl" />;
  if (!trends?.length) return <EmptyState text="لا توجد بيانات كافية للرسم البياني" />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={trends} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => metric === "count" ? formatNumber(v) : (v >= 1000 ? `${Math.round(v / 1000)}ك` : String(v))} />
        <Tooltip
          formatter={(v: number) => [metric === "count" ? formatNumber(v) : formatCurrency(v), labelMap[metric]]}
          contentStyle={{ borderRadius: 12, fontFamily: "inherit", direction: "rtl", border: "1px solid #E2E8F0" }} />
        <Line type="monotone" dataKey={metric} stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Bar Chart Component ───────────────────────────────────────────────────────

function HBarChart({ data, dataKey, nameKey, label, color = "#0F7BA0", formatter }: {
  data: Record<string, number | string>[]; dataKey: string; nameKey: string;
  label: string; color?: string; formatter?: (v: number) => string;
}) {
  if (!data.length) return <EmptyState text="لا توجد بيانات" />;
  const fmt = formatter ?? ((v: number) => formatCurrency(v));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 40, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => v >= 1000 ? `${Math.round(v / 1000)}ك` : String(v)} />
        <YAxis type="category" dataKey={nameKey} tick={{ fontSize: 11 }} width={60} />
        <Tooltip formatter={(v: number) => [fmt(v), label]} contentStyle={{ borderRadius: 12, fontFamily: "inherit", direction: "rtl", border: "1px solid #E2E8F0" }} />
        <Bar dataKey={dataKey} radius={[0, 6, 6, 0]}>
          {data.map((_: unknown, i: number) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Filters Panel ─────────────────────────────────────────────────────────────

function FiltersPanel({ filters, onChange, filterOpts }: {
  filters: AnalyticsFilters;
  onChange: (f: AnalyticsFilters) => void;
  filterOpts?: ReturnType<typeof useAnalyticsFilterOptions>["data"];
}) {
  const [open, setOpen] = useState(false);

  const activeCount = [filters.city, filters.district, filters.propertyType, filters.listingType].filter(Boolean).length;

  return (
    <div className="bg-card rounded-[22px] border border-border/60 overflow-hidden shadow-sm">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span>تصفية البيانات</span>
          {activeCount > 0 && (
            <span className="text-[11px] font-extrabold bg-primary/10 text-primary rounded-full px-2 py-0.5">{activeCount} فلتر</span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden border-t border-border/40">
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">المدينة</label>
                <select className={INPUT_CLS} value={filters.city ?? ""} onChange={e => onChange({ ...filters, city: e.target.value || undefined, district: undefined })}>
                  <option value="">الكل</option>
                  {filterOpts?.cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">الحي</label>
                <select className={INPUT_CLS} value={filters.district ?? ""} onChange={e => onChange({ ...filters, district: e.target.value || undefined })}>
                  <option value="">الكل</option>
                  {(filters.city
                    ? filterOpts?.districts.filter(d => d.city === filters.city)
                    : filterOpts?.districts
                  )?.map(d => <option key={d.district} value={d.district}>{d.district}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">نوع العقار</label>
                <select className={INPUT_CLS} value={filters.propertyType ?? ""} onChange={e => onChange({ ...filters, propertyType: e.target.value || undefined })}>
                  <option value="">الكل</option>
                  {filterOpts?.propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">نوع الإعلان</label>
                <select className={INPUT_CLS} value={filters.listingType ?? ""} onChange={e => onChange({ ...filters, listingType: e.target.value || undefined })}>
                  <option value="">الكل</option>
                  {filterOpts?.listingTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {activeCount > 0 && (
                <div className="col-span-2 md:col-span-4 flex justify-end">
                  <button onClick={() => onChange({})}
                    className="text-[12px] text-red-500 hover:text-red-700 font-bold transition-colors">
                    مسح الفلاتر ✕
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Section A: Market Health Score ───────────────────────────────────────────

function SectionA({ insights, loading }: { insights?: InsightsData; loading: boolean }) {
  const kpis = insights?.kpis;
  const ms = insights?.marketScore;
  const sd = insights?.supplyDemand;

  const turnoverLabel = (kpis?.turnoverRate ?? 0) > 30 ? "سوق متحرك" : (kpis?.turnoverRate ?? 0) > 10 ? "نشاط معتدل" : "سوق هادئ";
  const turnoverColor = (kpis?.turnoverRate ?? 0) > 30 ? "#22C55E" : (kpis?.turnoverRate ?? 0) > 10 ? "#0F7BA0" : "#F59E0B";
  const turnoverBg    = (kpis?.turnoverRate ?? 0) > 30 ? "rgba(34,197,94,0.1)" : (kpis?.turnoverRate ?? 0) > 10 ? "rgba(15,123,160,0.1)" : "rgba(245,158,11,0.1)";

  const adrLabel = (kpis?.avgDaysOnMarket ?? 0) < 14 ? "سريع الحركة" : (kpis?.avgDaysOnMarket ?? 0) < 45 ? "حركة طبيعية" : "بطيء الحركة";
  const adrColor = (kpis?.avgDaysOnMarket ?? 0) < 14 ? "#22C55E" : (kpis?.avgDaysOnMarket ?? 0) < 45 ? "#0F7BA0" : "#F59E0B";
  const adrBg    = (kpis?.avgDaysOnMarket ?? 0) < 14 ? "rgba(34,197,94,0.1)" : (kpis?.avgDaysOnMarket ?? 0) < 45 ? "rgba(15,123,160,0.1)" : "rgba(245,158,11,0.1)";

  const balColor = sd?.marketBalance === "higher_demand" ? "#22C55E" : sd?.marketBalance === "higher_supply" ? "#F59E0B" : "#0F7BA0";
  const balBg    = sd?.marketBalance === "higher_demand" ? "rgba(34,197,94,0.1)" : sd?.marketBalance === "higher_supply" ? "rgba(245,158,11,0.1)" : "rgba(15,123,160,0.1)";

  return (
    <SectionContainer>
      {/* Market Score */}
      <MarketScoreWidget
        score={ms?.score ?? 0}
        label={ms?.label ?? "—"}
        components={ms?.components ?? { activity: 0, diversity: 0, stability: 0 }}
        explanation={ms?.explanation}
        loading={loading} />

      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="إجمالي الإعلانات" value={loading ? "—" : formatNumber(kpis?.totalListings ?? 0)} color="#0F1C3F" loading={loading} />
        <KpiCard label="إعلانات الأسبوع الماضي" value={loading ? "—" : formatNumber(kpis?.newLast7Days ?? 0)} color="#0F7BA0" loading={loading} />
        <KpiCard label="إعلانات الشهر الماضي" value={loading ? "—" : formatNumber(kpis?.newLast30Days ?? 0)} color="#8B5CF6" loading={loading} />
        <KpiCard label="إعلانات 90 يوم" value={loading ? "—" : formatNumber(kpis?.newLast90Days ?? 0)} color="#22C55E" loading={loading} />
      </div>

      {/* Market Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <IndicatorCard title="معدل دوران السوق" value={`${kpis?.turnoverRate ?? 0}%`}
          status={turnoverLabel} statusColor={turnoverColor} statusBg={turnoverBg}
          detail="نسبة الإعلانات الجديدة خلال 30 يوم من الإجمالي" icon={Activity} loading={loading} />
        <IndicatorCard title="توازن العرض والطلب"
          value={sd?.marketBalanceLabel ?? "—"}
          status={`نسبة النشاط: ${sd?.activityRatio ?? "—"}`}
          statusColor={balColor} statusBg={balBg}
          detail="مقارنة الأسبوع الأخير بمعدل الشهر الماضي" icon={Scale} loading={loading} />
        <IndicatorCard title="متوسط عمر الإعلان"
          value={kpis?.avgDaysOnMarket ? `${kpis.avgDaysOnMarket} يوم` : "—"}
          status={adrLabel} statusColor={adrColor} statusBg={adrBg}
          detail="متوسط عدد الأيام منذ نشر الإعلان" icon={Clock} loading={loading} />
      </div>
    </SectionContainer>
  );
}

// ── Section B: Price Intelligence ────────────────────────────────────────────

function SectionB({ insights, trends, loading, loadingTrends, period, setPeriod }: {
  insights?: InsightsData; trends?: TrendPoint[]; loading: boolean; loadingTrends: boolean;
  period: string; setPeriod: (p: string) => void;
}) {
  const kpis = insights?.kpis;
  const avg = kpis?.avgPrice ?? 0;
  const med = kpis?.medianPrice ?? 0;
  const skew = med > 0 ? avg / med : 1;
  const skewLabel = skew > 1.2 ? "يميل للغالي" : skew > 1.05 ? "ميل طفيف" : "موزع بانتظام";
  const skewColor = skew > 1.2 ? "#F59E0B" : skew > 1.05 ? "#0F7BA0" : "#22C55E";
  const skewBg    = skew > 1.2 ? "rgba(245,158,11,0.1)" : skew > 1.05 ? "rgba(15,123,160,0.1)" : "rgba(34,197,94,0.1)";

  const vol = med > 0 ? Math.round(((( kpis?.p75Price ?? 0) - (kpis?.p25Price ?? 0)) / med) * 100) : 0;
  const volLabel = vol < 20 ? "مستقر" : vol < 45 ? "متوسط" : "متذبذب";
  const volColor = vol < 20 ? "#22C55E" : vol < 45 ? "#F59E0B" : "#EF4444";
  const volBg    = vol < 20 ? "rgba(34,197,94,0.1)" : vol < 45 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)";

  const devPct = kpis?.priceDeviationPct ?? 0;
  const devLabel = Math.abs(devPct) < 5 ? "توافق عالٍ" : Math.abs(devPct) < 15 ? "فارق معتدل" : "فارق كبير";
  const devColor = Math.abs(devPct) < 5 ? "#22C55E" : Math.abs(devPct) < 15 ? "#F59E0B" : "#EF4444";
  const devBg    = Math.abs(devPct) < 5 ? "rgba(34,197,94,0.1)" : Math.abs(devPct) < 15 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)";

  return (
    <SectionContainer>
      {/* Price KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="متوسط السعر" value={loading ? "—" : formatCurrency(avg)} color="#0F7BA0" loading={loading} />
        <KpiCard label="الوسيط" value={loading ? "—" : formatCurrency(med)} color="#0F1C3F" loading={loading} />
        <KpiCard label="متوسط سعر المتر" value={loading ? "—" : formatCurrency(kpis?.avgPricePerSqm ?? 0)} color="#8B5CF6" sub="ريال/م²" loading={loading} />
        <KpiCard label="الانحراف المعياري" value={loading ? "—" : formatCurrency(kpis?.priceStddev ?? 0)} color="#F59E0B" loading={loading} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="أدنى سعر" value={loading ? "—" : formatCurrency(kpis?.minPrice ?? 0)} color="#22C55E" loading={loading} />
        <KpiCard label="أعلى سعر" value={loading ? "—" : formatCurrency(kpis?.maxPrice ?? 0)} color="#EF4444" loading={loading} />
        <KpiCard label="الربيع الأول (Q1)" value={loading ? "—" : formatCurrency(kpis?.p25Price ?? 0)} color="#64748B" loading={loading} />
        <KpiCard label="الربيع الثالث (Q3)" value={loading ? "—" : formatCurrency(kpis?.p75Price ?? 0)} color="#64748B" loading={loading} />
      </div>

      {/* Price Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <IndicatorCard title="توزيع الأسعار" value={`${devPct > 0 ? "+" : ""}${devPct}%`}
          status={devLabel} statusColor={devColor} statusBg={devBg}
          detail="الفارق بين المتوسط والوسيط — يكشف تأثير العقارات الغالية" icon={BarChart3} loading={loading} />
        <IndicatorCard title="ميل الأسعار"
          status={skewLabel} statusColor={skewColor} statusBg={skewBg}
          detail="وجود عقارات مرتفعة تشد المتوسط فوق الوسيط" icon={TrendingUp} loading={loading} />
        <IndicatorCard title="تذبذب الأسعار" value={`${vol}%`}
          status={volLabel} statusColor={volColor} statusBg={volBg}
          detail="نطاق IQR كنسبة من الوسيط — مقياس تجانس السوق" icon={Activity} loading={loading} />
      </div>

      {/* Trend Chart */}
      <div className="bg-card rounded-[22px] border border-border/60 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
          <span className="text-[13px] font-bold text-foreground">مسار متوسط السعر</span>
          <div className="flex gap-1">
            {PERIOD_TABS.map(t => (
              <button key={t.value} onClick={() => setPeriod(t.value)}
                className={`text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all ${period === t.value ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted/60"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: 240 }}>
          <TrendChart trends={trends} loading={loadingTrends} metric="avgPrice" />
        </div>
      </div>
    </SectionContainer>
  );
}

// ── Section C: Activity & Movement ───────────────────────────────────────────

function SectionC({ insights, trends, loading, loadingTrends, period, setPeriod }: {
  insights?: InsightsData; trends?: TrendPoint[]; loading: boolean; loadingTrends: boolean;
  period: string; setPeriod: (p: string) => void;
}) {
  const kpis = insights?.kpis;
  const act = computeActivityLevel(kpis?.newLast7Days ?? 0, kpis?.newLast30Days ?? 0);
  const dir = computeMarketDirection(trends ?? []);
  const DirIcon = dir.pct > 3 ? ArrowUpRight : dir.pct < -3 ? ArrowDownRight : Minus;

  const adrColor = (kpis?.avgDaysOnMarket ?? 0) < 14 ? "#22C55E" : (kpis?.avgDaysOnMarket ?? 0) < 45 ? "#0F7BA0" : "#F59E0B";
  const adrBg    = (kpis?.avgDaysOnMarket ?? 0) < 14 ? "rgba(34,197,94,0.1)" : (kpis?.avgDaysOnMarket ?? 0) < 45 ? "rgba(15,123,160,0.1)" : "rgba(245,158,11,0.1)";
  const adrLabel = (kpis?.avgDaysOnMarket ?? 0) < 14 ? "سريع الحركة" : (kpis?.avgDaysOnMarket ?? 0) < 45 ? "حركة طبيعية" : "بطيء الحركة";

  return (
    <SectionContainer>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="إعلانات آخر 7 أيام" value={loading ? "—" : formatNumber(kpis?.newLast7Days ?? 0)} color="#0F7BA0" loading={loading} />
        <KpiCard label="إعلانات آخر 30 يوم" value={loading ? "—" : formatNumber(kpis?.newLast30Days ?? 0)} color="#8B5CF6" loading={loading} />
        <KpiCard label="إعلانات 90 يوم" value={loading ? "—" : formatNumber(kpis?.newLast90Days ?? 0)} color="#22C55E" loading={loading} />
        <KpiCard label="متوسط الإضافة اليومية" value={loading ? "—" : ((kpis?.newLast30Days ?? 0) / 30).toFixed(1)} color="#F59E0B" sub="إعلان/يوم" loading={loading} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <IndicatorCard title="نشاط الإضافات" value={`نسبة ${act.ratio.toFixed(2)}`}
          status={act.label} statusColor={act.color} statusBg={`${act.color}18`}
          detail="مقارنة أسبوع الماضي بمعدل الأسابيع الأربعة" icon={Flame} loading={loading} />
        <IndicatorCard title="اتجاه السوق (السعري)"
          value={dir.pct !== 0 ? `${dir.pct > 0 ? "+" : ""}${dir.pct}%` : "ثابت"}
          status={dir.label} statusColor={dir.color} statusBg={`${dir.color}18`}
          detail="التغير في متوسط السعر من أول إلى آخر نقطة في مسار الاتجاه" icon={DirIcon} loading={loading} />
        <IndicatorCard title="متوسط عمر الإعلان"
          value={kpis?.avgDaysOnMarket ? `${kpis.avgDaysOnMarket} يوم` : "—"}
          status={adrLabel} statusColor={adrColor} statusBg={adrBg}
          detail="متوسط عدد الأيام منذ نشر الإعلان" icon={Clock} loading={loading} />
      </div>

      {/* Count trend chart */}
      <div className="bg-card rounded-[22px] border border-border/60 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
          <span className="text-[13px] font-bold text-foreground">مسار حجم الإعلانات</span>
          <div className="flex gap-1">
            {PERIOD_TABS.map(t => (
              <button key={t.value} onClick={() => setPeriod(t.value)}
                className={`text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all ${period === t.value ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted/60"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: 240 }}>
          <TrendChart trends={trends} loading={loadingTrends} metric="count" />
        </div>
      </div>
    </SectionContainer>
  );
}

// ── Section D: Supply & Demand ────────────────────────────────────────────────

function SectionD({ insights, loading }: { insights?: InsightsData; loading: boolean }) {
  const sd = insights?.supplyDemand;
  const kpis = insights?.kpis;
  const byListingType = insights?.byListingType ?? [];

  const balColor = sd?.marketBalance === "higher_demand" ? "#22C55E" : sd?.marketBalance === "higher_supply" ? "#F59E0B" : "#0F7BA0";
  const balBg    = sd?.marketBalance === "higher_demand" ? "rgba(34,197,94,0.1)" : sd?.marketBalance === "higher_supply" ? "rgba(245,158,11,0.1)" : "rgba(15,123,160,0.1)";

  const pieData = [
    { name: "للبيع",      value: kpis?.saleCount ?? 0 },
    { name: "للإيجار",    value: kpis?.rentCount ?? 0 },
    { name: "استثماري",   value: kpis?.investCount ?? 0 },
  ].filter(d => d.value > 0);

  return (
    <SectionContainer>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="إجمالي العرض" value={loading ? "—" : formatNumber(sd?.totalSupply ?? 0)} color="#0F7BA0" loading={loading} />
        <KpiCard label="عرض جديد (30 يوم)" value={loading ? "—" : formatNumber(sd?.newSupply ?? 0)} color="#22C55E" loading={loading} />
        <KpiCard label="نسبة البيع" value={loading ? "—" : `${kpis?.saleCount && kpis.totalListings ? Math.round((kpis.saleCount/kpis.totalListings)*100) : 0}%`} color="#8B5CF6" loading={loading} />
        <KpiCard label="نسبة الإيجار" value={loading ? "—" : `${kpis?.rentCount && kpis.totalListings ? Math.round((kpis.rentCount/kpis.totalListings)*100) : 0}%`} color="#F97316" loading={loading} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supply/Demand Balance */}
        <div className="bg-card rounded-[22px] border border-border/60 p-5 shadow-sm">
          <div className="text-[13px] font-bold text-foreground mb-4">توازن العرض والطلب</div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: balBg }}>
              <span className="text-[13px] font-bold" style={{ color: balColor }}>{sd?.marketBalanceLabel ?? "—"}</span>
              <span className="text-[12px] text-muted-foreground">نسبة النشاط: {sd?.activityRatio ?? "—"}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/30 text-center">
                <div className="text-[11px] text-muted-foreground mb-1">أسبوع الماضي</div>
                <div className="text-2xl font-extrabold text-primary">{sd?.newLast7Days ?? "—"}</div>
                <div className="text-[11px] text-muted-foreground">إعلان</div>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 text-center">
                <div className="text-[11px] text-muted-foreground mb-1">معدل الشهر (أسبوعي)</div>
                <div className="text-2xl font-extrabold text-primary">
                  {sd?.newSupply ? Math.round(sd.newSupply / 4) : "—"}
                </div>
                <div className="text-[11px] text-muted-foreground">إعلان/أسبوع</div>
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground text-center">
              الفارق: {sd?.supplyDemandGap !== undefined ? (sd.supplyDemandGap > 0 ? `+${sd.supplyDemandGap}` : sd.supplyDemandGap) : "—"} إعلان عن معدل الأسابيع
            </div>
          </div>
        </div>

        {/* Listing Type Pie */}
        <ChartCard title="توزيع أنواع الإعلانات" height={200}>
          {loading ? <Skeleton className="w-full h-full rounded-xl" /> : pieData.length === 0 ? <EmptyState text="لا توجد بيانات" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
                  {pieData.map((_: unknown, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, fontFamily: "inherit", direction: "rtl" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Listing type breakdown */}
      {byListingType.length > 0 && (
        <div className="bg-card rounded-[22px] border border-border/60 p-5 shadow-sm">
          <div className="text-[13px] font-bold text-foreground mb-4">تفصيل أنواع الإعلانات</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {byListingType.map((t, i) => (
              <div key={t.listingType} className="p-3 rounded-xl border border-border/40 bg-muted/20">
                <div className="text-[11px] text-muted-foreground mb-1">{t.label}</div>
                <div className="text-xl font-extrabold tabular-nums" style={{ color: BAR_COLORS[i % BAR_COLORS.length] }}>{t.count}</div>
                <div className="text-[11px] text-muted-foreground">{t.percentage}% من السوق</div>
                <div className="text-[11px] font-bold text-foreground mt-1">{formatCurrency(t.avgPrice)} متوسط</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionContainer>
  );
}

// ── Section E: Property Types ─────────────────────────────────────────────────

function SectionE({ insights, loading }: { insights?: InsightsData; loading: boolean }) {
  const byType = [...(insights?.byPropertyType ?? [])].sort((a, b) => b.count - a.count).slice(0, 10);
  const bySqm  = [...(insights?.byPropertyType ?? [])].filter(t => t.avgPricePerSqm > 0).sort((a, b) => b.avgPricePerSqm - a.avgPricePerSqm).slice(0, 10);

  return (
    <SectionContainer>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="أكثر الأنواع إعلاناً" height={280}>
          {loading ? <Skeleton className="w-full h-full rounded-xl" /> :
            <HBarChart data={byType.map(t => ({ ...t, name: t.propertyType }))}
              dataKey="count" nameKey="name" label="عدد الإعلانات" formatter={v => formatNumber(v)} />}
        </ChartCard>
        <ChartCard title="متوسط سعر المتر حسب النوع" height={280}>
          {loading ? <Skeleton className="w-full h-full rounded-xl" /> :
            <HBarChart data={bySqm.map(t => ({ ...t, name: t.propertyType }))}
              dataKey="avgPricePerSqm" nameKey="name" label="سعر المتر" />}
        </ChartCard>
      </div>

      {byType.length > 0 && (
        <div className="bg-card rounded-[22px] border border-border/60 p-5 shadow-sm">
          <div className="text-[13px] font-bold text-foreground mb-4">تفاصيل أنواع العقارات</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {byType.map((t, i) => (
              <div key={t.propertyType} className="p-3 rounded-xl border border-border/40 hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
                  <span className="text-[12px] font-bold text-foreground truncate">{t.propertyType}</span>
                </div>
                <div className="text-xl font-extrabold tabular-nums" style={{ color: BAR_COLORS[i % BAR_COLORS.length] }}>{t.count}</div>
                <div className="text-[11px] text-muted-foreground">{t.percentage}% · متوسط {formatCurrency(t.avgPrice)}</div>
                {t.avgPricePerSqm > 0 && <div className="text-[11px] text-muted-foreground">{formatCurrency(t.avgPricePerSqm)}/م²</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionContainer>
  );
}

// ── Section F: Location Intelligence ─────────────────────────────────────────

function SectionF({ insights, loading, distSort, setDistSort }: {
  insights?: InsightsData; loading: boolean; distSort: string; setDistSort: (s: string) => void;
}) {
  const byCity = [...(insights?.byCity ?? [])].sort((a, b) => b.count - a.count).slice(0, 10);
  const byDistrict = [...(insights?.byDistrict ?? [])];
  const sortedDistricts = useMemo(() => {
    const arr = [...byDistrict];
    if (distSort === "price") return arr.sort((a, b) => b.avgPrice - a.avgPrice).slice(0, 10);
    if (distSort === "sqm") return arr.sort((a, b) => b.avgPricePerSqm - a.avgPricePerSqm).slice(0, 10);
    return arr.sort((a, b) => b.count - a.count).slice(0, 10);
  }, [byDistrict, distSort]);

  const topBudget   = [...byDistrict].filter(d => d.avgPricePerSqm > 0).sort((a, b) => a.avgPricePerSqm - b.avgPricePerSqm).slice(0, 3);
  const topPremium  = [...byDistrict].filter(d => d.avgPricePerSqm > 0).sort((a, b) => b.avgPricePerSqm - a.avgPricePerSqm).slice(0, 3);

  return (
    <SectionContainer>
      {/* Quick highlights */}
      {(topBudget.length > 0 || topPremium.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topBudget.length > 0 && (
            <div className="bg-card rounded-[22px] border border-emerald-200/60 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Star className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-[13px] font-bold text-foreground">أحياء الفرص</span>
                <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">أقل سعر للمتر</span>
              </div>
              <div className="space-y-2">
                {topBudget.map((d, i) => (
                  <div key={d.district} className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-foreground">
                      <span className="text-emerald-400 ml-2">{i + 1}.</span>
                      {d.district} <span className="text-muted-foreground font-normal text-[11px]">({d.city})</span>
                    </span>
                    <span className="text-[13px] font-extrabold text-emerald-600 tabular-nums">{formatCurrency(d.avgPricePerSqm)}/م²</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {topPremium.length > 0 && (
            <div className="bg-card rounded-[22px] border border-purple-200/60 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Award className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-[13px] font-bold text-foreground">أحياء بريميوم</span>
                <span className="text-[11px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full">أعلى سعر للمتر</span>
              </div>
              <div className="space-y-2">
                {topPremium.map((d, i) => (
                  <div key={d.district} className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-foreground">
                      <span className="text-purple-400 ml-2">{i + 1}.</span>
                      {d.district} <span className="text-muted-foreground font-normal text-[11px]">({d.city})</span>
                    </span>
                    <span className="text-[13px] font-extrabold text-purple-600 tabular-nums">{formatCurrency(d.avgPricePerSqm)}/م²</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cities chart */}
      <ChartCard title="أبرز المدن — متوسط سعر المتر" height={280}>
        {loading ? <Skeleton className="w-full h-full rounded-xl" /> :
          byCity.length === 0 ? <EmptyState text="لا توجد بيانات للمدن" /> :
          <HBarChart data={byCity.map(c => ({ ...c, name: c.city }))}
            dataKey="avgPricePerSqm" nameKey="name" label="سعر المتر" />}
      </ChartCard>

      {/* Districts table */}
      <div className="bg-card rounded-[22px] border border-border/60 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <span className="text-[13px] font-bold text-foreground">تحليل الأحياء</span>
          <div className="flex gap-1">
            {[{ v: "activity", l: "الأكثر نشاطاً" }, { v: "price", l: "الأعلى سعراً" }, { v: "sqm", l: "سعر المتر" }].map(s => (
              <button key={s.v} onClick={() => setDistSort(s.v)}
                className={`text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all ${distSort === s.v ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted/60"}`}>
                {s.l}
              </button>
            ))}
          </div>
        </div>
        {loading ? <Skeleton className="h-40 w-full rounded-xl" /> :
         sortedDistricts.length === 0 ? <EmptyState text="لا توجد بيانات للأحياء" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-right text-[11px] font-bold text-muted-foreground pb-2 pr-2">#</th>
                  <th className="text-right text-[11px] font-bold text-muted-foreground pb-2">الحي</th>
                  <th className="text-right text-[11px] font-bold text-muted-foreground pb-2">المدينة</th>
                  <th className="text-right text-[11px] font-bold text-muted-foreground pb-2">الإعلانات</th>
                  <th className="text-right text-[11px] font-bold text-muted-foreground pb-2">متوسط السعر</th>
                  <th className="text-right text-[11px] font-bold text-muted-foreground pb-2">سعر المتر</th>
                </tr>
              </thead>
              <tbody>
                {sortedDistricts.map((d, i) => (
                  <tr key={`${d.district}-${d.city}`} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 pr-2 text-[11px] text-muted-foreground tabular-nums">{i + 1}</td>
                    <td className="py-2.5 font-bold text-[13px]">{d.district}</td>
                    <td className="py-2.5 text-muted-foreground text-[12px]">{d.city}</td>
                    <td className="py-2.5 tabular-nums font-bold" style={{ color: BAR_COLORS[i % BAR_COLORS.length] }}>{d.count}</td>
                    <td className="py-2.5 tabular-nums text-[12px]">{formatCurrency(d.avgPrice)}</td>
                    <td className="py-2.5 tabular-nums text-[12px] font-bold">{d.avgPricePerSqm > 0 ? formatCurrency(d.avgPricePerSqm) : "—"}<span className="text-muted-foreground font-normal">/م²</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SectionContainer>
  );
}

// ── Section G: Smart Insights ─────────────────────────────────────────────────

function SectionG({ insights, loading, filters }: { insights?: InsightsData; loading: boolean; filters: AnalyticsFilters }) {
  const smartInsights = insights?.smartInsights ?? [];
  const kpis = insights?.kpis;
  const hasData = (kpis?.totalListings ?? 0) > 0;

  const buyerRec = useMemo(() => {
    if (!hasData || (kpis?.totalListings ?? 0) < 3) return "البيانات محدودة حالياً — ستتحسن التوصيات مع تراكم الإعلانات.";
    const parts: string[] = [];
    const byD = insights?.byDistrict ?? [];
    const avgSqm = kpis?.avgPricePerSqm ?? 0;
    const cheap = byD.filter(d => d.avgPricePerSqm > 0 && avgSqm > 0 && d.avgPricePerSqm < avgSqm * 0.9);
    if (cheap.length > 0) parts.push(`أفضل قيمة للمال في: ${cheap.slice(0, 2).map(d => d.district).join(" و")}.`);
    const topT = insights?.byPropertyType?.[0];
    if (topT) parts.push(`الأوفر توفراً: ${topT.propertyType} (${topT.percentage}% من الإعلانات).`);
    if (parts.length === 0) parts.push("البيانات كافية لقرار مدروس — تحقق من الأحياء والأسعار في الفئات المختلفة.");
    return parts.join(" ");
  }, [insights, kpis, hasData]);

  const marketerRec = useMemo(() => {
    if (!hasData || (kpis?.totalListings ?? 0) < 3) return "ستتحسن توصيات التسعير مع زيادة الإعلانات.";
    const avg = kpis?.avgPrice ?? 0;
    const med = kpis?.medianPrice ?? 0;
    if (!avg || !med) return "بيانات التسعير غير كافية بعد.";
    const skew = avg / med;
    return skew > 1.15
      ? `المتوسط (${formatCurrency(avg)}) أعلى من الوسيط (${formatCurrency(med)}) — سعّر قريباً من الوسيط لبيع أسرع.`
      : skew < 0.88
      ? `الوسيط أعلى — يمكنك التسعير فوق المتوسط دون الخروج من السوق.`
      : `السوق متوازن — ضع سعرك ضمن ±10% من الوسيط (${formatCurrency(med)}).`;
  }, [kpis, hasData]);

  return (
    <SectionContainer>
      {/* Insights list */}
      <div className="bg-card rounded-[22px] border border-border/60 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-[13px] font-bold text-foreground">ملاحظات ذكية</div>
            <div className="text-[11px] text-muted-foreground">مستخلصة من بيانات السوق الحالية</div>
          </div>
        </div>
        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}</div>
        ) : smartInsights.length === 0 ? (
          <EmptyState text="لا توجد بيانات كافية لاستخلاص ملاحظات ذكية" />
        ) : (
          <div className="space-y-2">
            {smartInsights.map((insight, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-extrabold text-primary">{i + 1}</span>
                </div>
                <p className="text-[13px] text-foreground leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role-based recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-[22px] border border-blue-200/60 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Home className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-foreground">توصية للمشتري / المستأجر</div>
            </div>
          </div>
          {loading ? <Skeleton className="h-16 w-full rounded-xl" /> :
            <p className="text-[13px] text-foreground leading-relaxed">{buyerRec}</p>}
        </div>
        <div className="bg-card rounded-[22px] border border-emerald-200/60 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Target className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-foreground">توصية للمُسوّق / البائع</div>
            </div>
          </div>
          {loading ? <Skeleton className="h-16 w-full rounded-xl" /> :
            <p className="text-[13px] text-foreground leading-relaxed">{marketerRec}</p>}
        </div>
      </div>

      {/* Data quality notice */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200/60">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-[12px] text-amber-700 leading-relaxed">
          <strong>ملاحظة:</strong> جميع المؤشرات مستخلصة من إعلانات المنصة فقط وتعكس نشاط المنصة — وليست بيانات السوق الشاملة. كلما زادت الإعلانات، كانت التحليلات أكثر دقة.
          {filters.city && <span> النطاق المحدد: <strong>{filters.city}</strong>{filters.district && ` — ${filters.district}`}.</span>}
        </div>
      </div>
    </SectionContainer>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Analytics() {
  const [section, setSection] = useState<SectionId>("A");
  const [period, setPeriod] = useState("month");
  const [distSort, setDistSort] = useState("activity");
  const [filters, setFilters] = useState<AnalyticsFilters>({});

  useEffect(() => {
    document.title = "تحليلات السوق – عقار إنسايت";
    return () => { document.title = "عقار إنسايت"; };
  }, []);

  const { insights, isLoading: loadingInsights } = useAnalytics(filters);
  const { data: trends, isLoading: loadingTrends } = useAnalyticsTrends(filters, period);
  const { data: filterOpts } = useAnalyticsFilterOptions();

  const kpis = insights?.kpis;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">تحليلات السوق العقاري</h1>
              <p className="text-[13px] text-muted-foreground">
                {loadingInsights ? "جاري التحميل..." : kpis?.totalListings
                  ? `${formatNumber(kpis.totalListings)} إعلان نشط • ${formatNumber(kpis.newLast30Days)} إعلان الشهر الماضي`
                  : "لا توجد إعلانات نشطة حالياً"}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5">
          <FiltersPanel filters={filters} onChange={setFilters} filterOpts={filterOpts} />
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
          {SECTION_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setSection(tab.id as SectionId)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold whitespace-nowrap transition-all shrink-0 ${
                  section === tab.id
                    ? "bg-primary text-white shadow-md"
                    : "bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}>
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Section Content */}
        <AnimatePresence mode="wait">
          <div key={section}>
            {section === "A" && <SectionA insights={insights} loading={loadingInsights} />}
            {section === "B" && <SectionB insights={insights} trends={trends} loading={loadingInsights} loadingTrends={loadingTrends} period={period} setPeriod={setPeriod} />}
            {section === "C" && <SectionC insights={insights} trends={trends} loading={loadingInsights} loadingTrends={loadingTrends} period={period} setPeriod={setPeriod} />}
            {section === "D" && <SectionD insights={insights} loading={loadingInsights} />}
            {section === "E" && <SectionE insights={insights} loading={loadingInsights} />}
            {section === "F" && <SectionF insights={insights} loading={loadingInsights} distSort={distSort} setDistSort={setDistSort} />}
            {section === "G" && <SectionG insights={insights} loading={loadingInsights} filters={filters} />}
          </div>
        </AnimatePresence>
      </div>
    </Layout>
  );
}
