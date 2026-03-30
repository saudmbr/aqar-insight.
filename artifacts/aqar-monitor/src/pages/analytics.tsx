import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/layout/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, BarChart3, Activity,
  Lightbulb, Scale, Target, Zap, Home, AlertCircle,
  Award, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight,
  MapPin, ShoppingCart, Clock, Flame,
} from "lucide-react";
import {
  useAnalytics, useAnalyticsTrends, useAnalyticsFilterOptions,
  computeMarketDirection, computeActivityLevel,
  type AnalyticsFilters, type InsightsData, type TrendPoint,
} from "@/hooks/use-analytics";
import { formatCurrency, formatNumber } from "@/lib/utils";

// ── Design tokens ──────────────────────────────────────────────────────────────
const NAVY     = "#0B1628";
const TEAL     = "#0F7BA0";
const TEAL_LT  = "#E8F4F8";
const GREEN    = "#10B981";
const GREEN_LT = "#ECFDF5";
const AMBER    = "#F59E0B";
const AMBER_LT = "#FFFBEB";
const RED      = "#EF4444";
const RED_LT   = "#FEF2F2";
const PURPLE   = "#8B5CF6";
const SLATE    = "#64748B";

const CHART_PALETTE = [TEAL, PURPLE, GREEN, AMBER, RED, "#F97316", NAVY, SLATE];
const INPUT_CLS = "w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";

// ── Tabs ───────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "A", label: "مؤشر السوق",       icon: Award },
  { id: "B", label: "الأسعار",           icon: BarChart3 },
  { id: "C", label: "العرض والطلب",      icon: Scale },
  { id: "D", label: "الأحياء",           icon: MapPin },
  { id: "E", label: "الذكاء التحليلي",  icon: Lightbulb },
] as const;

type TabId = "A" | "B" | "C" | "D" | "E";

const PERIOD_TABS = [
  { value: "day",     label: "يومي" },
  { value: "week",    label: "أسبوعي" },
  { value: "month",   label: "شهري" },
  { value: "quarter", label: "ربع سنوي" },
  { value: "year",    label: "سنوي" },
];

// ── Helper Components ──────────────────────────────────────────────────────────

function Fade({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      className="space-y-5"
    >
      {children}
    </motion.div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/50">
      <BarChart3 className="w-9 h-9 opacity-20" />
      <p className="text-sm font-medium text-center max-w-xs leading-relaxed">{text}</p>
    </div>
  );
}

/* Big metric card — number + context label (decision-oriented) */
function MetricCard({
  label, value, context, contextColor = SLATE, accent = TEAL, loading, icon: Icon,
}: {
  label: string; value: React.ReactNode; context?: string;
  contextColor?: string; accent?: string; loading?: boolean;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) {
  return (
    <div
      className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-2"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold text-muted-foreground leading-tight">{label}</span>
        {Icon && (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${accent}18` }}>
            <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
          </div>
        )}
      </div>
      <div className="text-[1.75rem] font-black leading-none tabular-nums tracking-tight" style={{ color: accent }}>
        {loading ? <Skeleton className="h-9 w-28 inline-block" /> : value}
      </div>
      {context && (
        <div className="text-[11px] font-bold" style={{ color: contextColor }}>
          {loading ? <Skeleton className="h-3.5 w-24 inline-block" /> : context}
        </div>
      )}
    </div>
  );
}

/* Status pill badge */
function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-full" style={{ color, background: bg }}>
      {label}
    </span>
  );
}

/* Indicator card — icon + title + status + detail */
function IndicatorCard({
  title, value, status, statusColor, detail, icon: Icon, loading,
}: {
  title: string; value?: string; status: string;
  statusColor: string; detail?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  loading?: boolean;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${statusColor}14` }}>
          <Icon className="w-4 h-4" style={{ color: statusColor }} />
        </div>
        {loading ? <Skeleton className="h-5 w-20" /> : <Pill label={status} color={statusColor} bg={`${statusColor}14`} />}
      </div>
      <div className="text-[13px] font-bold text-foreground mb-1">{title}</div>
      {value && (
        <div className="text-xl font-extrabold" style={{ color: statusColor }}>
          {loading ? <Skeleton className="h-6 w-24 inline-block" /> : value}
        </div>
      )}
      {detail && <div className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{detail}</div>}
    </div>
  );
}

/* Section card wrapper */
function SCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <span className="text-[13px] font-bold text-foreground">{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── Trend Chart ────────────────────────────────────────────────────────────────

function TrendLine({ trends, loading, metric }: { trends?: TrendPoint[]; loading: boolean; metric: "avgPrice" | "count" | "avgPricePerSqm" }) {
  const colorMap = { avgPrice: TEAL, count: PURPLE, avgPricePerSqm: GREEN };
  const color = colorMap[metric];
  const labelMap = { avgPrice: "متوسط السعر", count: "عدد الإعلانات", avgPricePerSqm: "سعر المتر" };

  if (loading) return <Skeleton className="w-full h-full rounded-xl" />;
  if (!trends?.length) return <Empty text="لا توجد بيانات كافية للرسم البياني" />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={trends} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.15} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: SLATE }} />
        <YAxis tick={{ fontSize: 11, fill: SLATE }} tickFormatter={v => metric === "count" ? formatNumber(v) : (v >= 1000 ? `${Math.round(v / 1000)}ك` : String(v))} />
        <Tooltip
          formatter={(v: number) => [metric === "count" ? formatNumber(v) : formatCurrency(v), labelMap[metric]]}
          contentStyle={{ borderRadius: 14, fontFamily: "inherit", direction: "rtl", border: "1px solid #E2E8F0", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
        <Line type="monotone" dataKey={metric} stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color, strokeWidth: 0 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Horizontal Bar Chart ───────────────────────────────────────────────────────

function HBar({ data, dataKey, nameKey, label, formatter }: {
  data: Record<string, number | string>[];
  dataKey: string; nameKey: string; label: string;
  formatter?: (v: number) => string;
}) {
  if (!data.length) return <Empty text="لا توجد بيانات" />;
  const fmt = formatter ?? formatCurrency;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 44, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 10, fill: SLATE }} tickFormatter={v => v >= 1000 ? `${Math.round(v / 1000)}ك` : String(v)} />
        <YAxis type="category" dataKey={nameKey} tick={{ fontSize: 11, fill: "#374151" }} width={64} />
        <Tooltip formatter={(v: number) => [fmt(v), label]} contentStyle={{ borderRadius: 12, fontFamily: "inherit", direction: "rtl", border: "1px solid #E2E8F0" }} />
        <Bar dataKey={dataKey} radius={[0, 7, 7, 0]}>
          {data.map((_: unknown, i: number) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Donut Chart ────────────────────────────────────────────────────────────────

function Donut({ data }: { data: { name: string; value: number; color: string }[] }) {
  if (!data.filter(d => d.value > 0).length) return <Empty text="لا توجد بيانات" />;
  const filtered = data.filter(d => d.value > 0);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={filtered} cx="50%" cy="50%"
          innerRadius={48} outerRadius={78}
          dataKey="value" paddingAngle={3}
          label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
          labelLine={false}
        >
          {filtered.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie>
        <Tooltip formatter={(v: number) => [formatNumber(v), "إعلان"]}
          contentStyle={{ borderRadius: 12, fontFamily: "inherit", direction: "rtl", border: "1px solid #E2E8F0" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Filters Panel ──────────────────────────────────────────────────────────────

function FiltersPanel({ filters, onChange, filterOpts }: {
  filters: AnalyticsFilters;
  onChange: (f: AnalyticsFilters) => void;
  filterOpts?: ReturnType<typeof useAnalyticsFilterOptions>["data"];
}) {
  const [open, setOpen] = useState(false);
  const activeCount = [filters.city, filters.district, filters.propertyType, filters.listingType].filter(Boolean).length;

  return (
    <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span>تصفية البيانات</span>
          {activeCount > 0 && <span className="text-[11px] font-extrabold bg-primary/10 text-primary rounded-full px-2 py-0.5">{activeCount} فلتر</span>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t border-border/40">
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
                  {(filters.city ? filterOpts?.districts.filter(d => d.city === filters.city) : filterOpts?.districts)?.map(d => <option key={d.district} value={d.district}>{d.district}</option>)}
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
                  <button onClick={() => onChange({})} className="text-[12px] text-red-500 hover:text-red-700 font-bold transition-colors">مسح الفلاتر ✕</button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Market Score Widget ────────────────────────────────────────────────────────

function MarketGauge({ score, label, components, explanation, loading }: {
  score: number; label: string;
  components: { activity: number; diversity: number; stability: number };
  explanation?: string; loading?: boolean;
}) {
  const color = score >= 65 ? GREEN : score >= 35 ? TEAL : AMBER;
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const offset = loading ? circ : circ * (1 - score / 100);

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm" style={{ borderTop: `3px solid ${color}` }}>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="shrink-0">
          <svg width="128" height="128" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="11" />
            <circle cx="64" cy="64" r={radius} fill="none" stroke={color}
              strokeWidth="11" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={offset}
              transform="rotate(-90 64 64)"
              style={{ transition: "stroke-dashoffset 1.2s ease" }} />
            <text x="64" y="59" textAnchor="middle" fontSize="28" fontWeight="900" fill={color}>{loading ? "—" : score}</text>
            <text x="64" y="76" textAnchor="middle" fontSize="12" fill={SLATE}>/ 100</text>
          </svg>
        </div>
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[14px] font-extrabold text-foreground">مؤشر صحة السوق</span>
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full" style={{ color, background: `${color}14` }}>
              {loading ? "—" : label}
            </span>
          </div>
          <div className="space-y-2.5">
            {[
              { name: "النشاط", val: components.activity, max: 40, color: TEAL },
              { name: "التنوع",  val: components.diversity, max: 30, color: PURPLE },
              { name: "الاستقرار", val: components.stability, max: 30, color: GREEN },
            ].map(c => (
              <div key={c.name}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-muted-foreground font-medium">{c.name}</span>
                  <span className="font-bold tabular-nums" style={{ color: c.color }}>
                    {loading ? "—" : `${c.val} / ${c.max}`}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: loading ? "0%" : `${(c.val / c.max) * 100}%`, background: c.color }} />
                </div>
              </div>
            ))}
          </div>
          {explanation && <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">{explanation}</p>}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION A — مؤشر السوق
// ══════════════════════════════════════════════════════════════════════════════

function SectionA({ insights, loading }: { insights?: InsightsData; loading: boolean }) {
  const kpis = insights?.kpis;
  const ms   = insights?.marketScore;
  const sd   = insights?.supplyDemand;

  const turnoverRate  = kpis?.turnoverRate ?? 0;
  const turnoverColor = turnoverRate > 30 ? GREEN : turnoverRate > 10 ? TEAL : AMBER;
  const turnoverLabel = turnoverRate > 30 ? "سوق متحرك — دوران سريع" : turnoverRate > 10 ? "نشاط معتدل" : "سوق هادئ — حركة بطيئة";

  const dom   = kpis?.avgDaysOnMarket ?? 0;
  const domColor = dom < 14 ? GREEN : dom < 45 ? TEAL : AMBER;
  const domLabel = dom < 14 ? "إعلانات تُباع بسرعة" : dom < 45 ? "مدة طبيعية" : "إعلانات تبقى طويلاً";

  const balColor = sd?.marketBalance === "higher_demand" ? GREEN : sd?.marketBalance === "higher_supply" ? AMBER : TEAL;
  const balLabel = sd?.marketBalance === "higher_demand" ? "الطلب أعلى — سوق بائعين" : sd?.marketBalance === "higher_supply" ? "العرض أعلى — سوق مشترين" : "سوق متوازن";

  return (
    <Fade>
      <MarketGauge
        score={ms?.score ?? 0}
        label={ms?.label ?? "—"}
        components={ms?.components ?? { activity: 0, diversity: 0, stability: 0 }}
        explanation={ms?.explanation}
        loading={loading}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <IndicatorCard
          title="معدل دوران السوق"
          value={`${turnoverRate}%`}
          status={turnoverLabel}
          statusColor={turnoverColor}
          detail="نسبة الإعلانات الجديدة في آخر 30 يوم من الإجمالي"
          icon={Flame}
          loading={loading}
        />
        <IndicatorCard
          title="توازن العرض والطلب"
          value={sd?.marketBalanceLabel ?? "—"}
          status={balLabel}
          statusColor={balColor}
          detail="مقارنة النشاط الأسبوعي بمعدل الشهر الماضي"
          icon={Scale}
          loading={loading}
        />
        <IndicatorCard
          title="متوسط عمر الإعلان"
          value={dom ? `${dom} يوم` : "—"}
          status={domLabel}
          statusColor={domColor}
          detail="كلما قصر العمر، كلما ارتفع الطلب على النوع المحدد"
          icon={Clock}
          loading={loading}
        />
      </div>
    </Fade>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION B — الأسعار
// ══════════════════════════════════════════════════════════════════════════════

function SectionB({ insights, trends, loading, loadingTrends, period, setPeriod }: {
  insights?: InsightsData; trends?: TrendPoint[];
  loading: boolean; loadingTrends: boolean;
  period: string; setPeriod: (p: string) => void;
}) {
  const kpis = insights?.kpis;
  const avg  = kpis?.avgPrice ?? 0;
  const med  = kpis?.medianPrice ?? 0;
  const psm  = kpis?.avgPricePerSqm ?? 0;

  const dir = computeMarketDirection(trends ?? []);
  const DirIcon = dir.pct > 3 ? ArrowUpRight : dir.pct < -3 ? TrendingDown : Minus;

  const volPct = med > 0 ? Math.round((((kpis?.p75Price ?? 0) - (kpis?.p25Price ?? 0)) / med) * 100) : 0;
  const volLabel = volPct < 20 ? "أسعار مستقرة — قرار آمن" : volPct < 45 ? "تذبذب معتدل" : "تذبذب عالٍ — قارن جيداً";
  const volColor = volPct < 20 ? GREEN : volPct < 45 ? AMBER : RED;

  const avgContext = avg > 0 && med > 0
    ? avg > med * 1.1
      ? "المتوسط مشدود بعقارات غالية — الوسيط أدق"
      : avg < med * 0.9
        ? "المتوسط أقل من الوسيط — سوق في تراجع"
        : "المتوسط والوسيط متقاربان — سوق متوازن"
    : undefined;

  const psmContext = psm > 0 ? "سعر المرجعي للمقارنة بين العقارات" : undefined;

  return (
    <Fade>
      {/* Price KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard
          label="متوسط السعر"
          value={loading ? "—" : formatCurrency(avg)}
          context={avgContext}
          contextColor={avg > (med ?? 0) * 1.1 ? AMBER : GREEN}
          accent={TEAL}
          loading={loading}
          icon={BarChart3}
        />
        <MetricCard
          label="الوسيط السعري"
          value={loading ? "—" : formatCurrency(med)}
          context={med > 0 ? "50% من الإعلانات أقل من هذا السعر" : undefined}
          contextColor={SLATE}
          accent={NAVY}
          loading={loading}
          icon={Activity}
        />
        <MetricCard
          label="متوسط سعر المتر"
          value={loading ? "—" : `${formatCurrency(psm)} /م²`}
          context={psmContext}
          contextColor={TEAL}
          accent={PURPLE}
          loading={loading}
          icon={Target}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard
          label="أقل سعر في السوق"
          value={loading ? "—" : formatCurrency(kpis?.minPrice ?? 0)}
          context="نقطة الدخول للميزانيات المحدودة"
          contextColor={GREEN}
          accent={GREEN}
          loading={loading}
        />
        <MetricCard
          label="أعلى سعر في السوق"
          value={loading ? "—" : formatCurrency(kpis?.maxPrice ?? 0)}
          context="سقف السوق الحالي"
          contextColor={RED}
          accent={RED}
          loading={loading}
        />
        <IndicatorCard
          title="تذبذب الأسعار"
          value={`${volPct}%`}
          status={volLabel}
          statusColor={volColor}
          detail="نطاق الأسعار الوسطى — مقياس تجانس العروض"
          icon={TrendingUp}
          loading={loading}
        />
      </div>

      {/* Direction indicator */}
      <div
        className="flex items-center gap-4 p-4 rounded-2xl border"
        style={{
          background: `${dir.color}08`,
          borderColor: `${dir.color}25`,
        }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${dir.color}16` }}>
          <DirIcon className="w-5 h-5" style={{ color: dir.color }} />
        </div>
        <div>
          <div className="text-[13px] font-extrabold" style={{ color: dir.color }}>
            اتجاه الأسعار: {dir.label}
            {dir.pct !== 0 && <span className="mr-1 text-[12px]">({dir.pct > 0 ? "+" : ""}{dir.pct}%)</span>}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            بناءً على مسار الأسعار في الفترة المحددة
          </div>
        </div>
      </div>

      {/* Trend chart */}
      <SCard
        title="مسار متوسط الأسعار"
        action={
          <div className="flex gap-1 flex-wrap">
            {PERIOD_TABS.map(t => (
              <button key={t.value} onClick={() => setPeriod(t.value)}
                className={`text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all ${period === t.value ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted/60"}`}>
                {t.label}
              </button>
            ))}
          </div>
        }
      >
        <div style={{ height: 240 }}>
          <TrendLine trends={trends} loading={loadingTrends} metric="avgPrice" />
        </div>
      </SCard>
    </Fade>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION C — العرض والطلب
// ══════════════════════════════════════════════════════════════════════════════

function SectionC({ insights, loading }: { insights?: InsightsData; loading: boolean }) {
  const kpis = insights?.kpis;
  const sd   = insights?.supplyDemand;
  const byListingType = insights?.byListingType ?? [];

  const balColor = sd?.marketBalance === "higher_demand" ? GREEN : sd?.marketBalance === "higher_supply" ? AMBER : TEAL;
  const balBg    = sd?.marketBalance === "higher_demand" ? GREEN_LT : sd?.marketBalance === "higher_supply" ? AMBER_LT : TEAL_LT;
  const balLabel = sd?.marketBalance === "higher_demand" ? "الطلب أعلى — فرصة للبيع بسعر جيد" : sd?.marketBalance === "higher_supply" ? "العرض أعلى — فرصة للمشتري في التفاوض" : "السوق متوازن — أسعار مستقرة";

  const total = kpis?.totalListings ?? 0;
  const saleP  = total > 0 ? Math.round(((kpis?.saleCount ?? 0) / total) * 100) : 0;
  const rentP  = total > 0 ? Math.round(((kpis?.rentCount ?? 0) / total) * 100) : 0;
  const invP   = total > 0 ? Math.round(((kpis?.investCount ?? 0) / total) * 100) : 0;

  const donutData = [
    { name: "للبيع",    value: kpis?.saleCount ?? 0,   color: TEAL },
    { name: "للإيجار", value: kpis?.rentCount ?? 0,   color: PURPLE },
    { name: "استثماري",value: kpis?.investCount ?? 0, color: GREEN },
  ];

  return (
    <Fade>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="إجمالي الإعلانات"
          value={loading ? "—" : formatNumber(total)}
          context={total > 0 ? "حجم السوق الحالي على المنصة" : undefined}
          contextColor={TEAL}
          accent={NAVY}
          loading={loading}
          icon={BarChart3}
        />
        <MetricCard
          label="عرض جديد (30 يوم)"
          value={loading ? "—" : formatNumber(sd?.newSupply ?? 0)}
          context={sd?.newSupply && total > 0 ? `${Math.round((sd.newSupply / total) * 100)}% من إجمالي العرض` : undefined}
          contextColor={GREEN}
          accent={GREEN}
          loading={loading}
          icon={TrendingUp}
        />
        <MetricCard
          label="نسبة إعلانات البيع"
          value={loading ? "—" : `${saleP}%`}
          context={saleP > 60 ? "أغلب السوق للبيع" : saleP < 30 ? "السوق يميل للإيجار" : "توازن بين البيع والإيجار"}
          contextColor={saleP > 60 ? TEAL : SLATE}
          accent={TEAL}
          loading={loading}
        />
        <MetricCard
          label="نسبة إعلانات الإيجار"
          value={loading ? "—" : `${rentP}%`}
          context={rentP > 50 ? "سوق إيجار نشط" : "الإيجار أقل من البيع"}
          contextColor={PURPLE}
          accent={PURPLE}
          loading={loading}
        />
      </div>

      {/* Balance highlight */}
      <div className="p-5 rounded-2xl border" style={{ background: balBg, borderColor: `${balColor}30` }}>
        <div className="flex items-center gap-3">
          <Scale className="w-5 h-5 shrink-0" style={{ color: balColor }} />
          <div>
            <div className="text-[14px] font-extrabold" style={{ color: balColor }}>{balLabel}</div>
            <div className="text-[12px] mt-0.5" style={{ color: balColor + "99" }}>
              أسبوع الماضي: <strong>{sd?.newLast7Days ?? 0}</strong> إعلان •
              معدل الأسبوع الشهري: <strong>{sd?.newSupply ? Math.round(sd.newSupply / 4) : 0}</strong> إعلان/أسبوع
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Donut */}
        <SCard title="توزيع أنواع الإعلانات">
          <div style={{ height: 200 }}>
            {loading ? <Skeleton className="w-full h-full rounded-xl" /> : <Donut data={donutData} />}
          </div>
          <div className="flex justify-center gap-4 mt-3">
            {donutData.filter(d => d.value > 0).map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="text-[11px] font-semibold text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        </SCard>

        {/* By listing type breakdown */}
        <SCard title="تفصيل أنواع الإعلانات">
          {loading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
          ) : byListingType.length === 0 ? (
            <Empty text="لا توجد بيانات" />
          ) : (
            <div className="space-y-2">
              {byListingType.map((t, i) => (
                <div key={t.listingType} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CHART_PALETTE[i % CHART_PALETTE.length] }} />
                    <span className="text-[13px] font-bold text-foreground">{t.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-extrabold tabular-nums" style={{ color: CHART_PALETTE[i % CHART_PALETTE.length] }}>{t.count}</div>
                    <div className="text-[11px] text-muted-foreground">{t.percentage}% · {formatCurrency(t.avgPrice)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SCard>
      </div>
    </Fade>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION D — الأحياء
// ══════════════════════════════════════════════════════════════════════════════

function SectionD({ insights, loading, distSort, setDistSort }: {
  insights?: InsightsData; loading: boolean; distSort: string; setDistSort: (s: string) => void;
}) {
  const byCity     = useMemo(() => [...(insights?.byCity ?? [])].sort((a, b) => b.count - a.count).slice(0, 8), [insights]);
  const byDistrict = insights?.byDistrict ?? [];

  const topOpportunity = useMemo(() =>
    [...byDistrict].filter(d => d.avgPricePerSqm > 0).sort((a, b) => a.avgPricePerSqm - b.avgPricePerSqm).slice(0, 5),
    [byDistrict]
  );
  const topPremium = useMemo(() =>
    [...byDistrict].filter(d => d.avgPricePerSqm > 0).sort((a, b) => b.avgPricePerSqm - a.avgPricePerSqm).slice(0, 5),
    [byDistrict]
  );

  const sortedDistricts = useMemo(() => {
    const arr = [...byDistrict];
    if (distSort === "price")    return arr.sort((a, b) => b.avgPrice - a.avgPrice).slice(0, 10);
    if (distSort === "sqm")      return arr.sort((a, b) => b.avgPricePerSqm - a.avgPricePerSqm).slice(0, 10);
    return arr.sort((a, b) => b.count - a.count).slice(0, 10);
  }, [byDistrict, distSort]);

  return (
    <Fade>
      {/* Top 5 opportunity vs premium */}
      {(topOpportunity.length > 0 || topPremium.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topOpportunity.length > 0 && (
            <div className="bg-card rounded-2xl border border-emerald-200/60 p-5 shadow-sm" style={{ borderTop: `3px solid ${GREEN}` }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: GREEN_LT }}>
                  <ShoppingCart className="w-4 h-4" style={{ color: GREEN }} />
                </div>
                <div>
                  <div className="text-[13px] font-extrabold text-foreground">أحياء الفرص</div>
                  <div className="text-[11px] text-muted-foreground">أقل سعر للمتر — مناسبة للشراء</div>
                </div>
              </div>
              <div className="space-y-2.5">
                {topOpportunity.map((d, i) => (
                  <div key={d.district} className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black w-4 text-center" style={{ color: GREEN }}>{i + 1}</span>
                      <div>
                        <div className="text-[13px] font-bold text-foreground">{d.district}</div>
                        <div className="text-[10px] text-muted-foreground">{d.city}</div>
                      </div>
                    </div>
                    <span className="text-[13px] font-extrabold tabular-nums" style={{ color: GREEN }}>{formatCurrency(d.avgPricePerSqm)}/م²</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {topPremium.length > 0 && (
            <div className="bg-card rounded-2xl border border-purple-200/60 p-5 shadow-sm" style={{ borderTop: `3px solid ${PURPLE}` }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#F5F3FF" }}>
                  <Award className="w-4 h-4" style={{ color: PURPLE }} />
                </div>
                <div>
                  <div className="text-[13px] font-extrabold text-foreground">أحياء بريميوم</div>
                  <div className="text-[11px] text-muted-foreground">أعلى سعر للمتر — عقارات فاخرة</div>
                </div>
              </div>
              <div className="space-y-2.5">
                {topPremium.map((d, i) => (
                  <div key={d.district} className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/50 border border-purple-100">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black w-4 text-center" style={{ color: PURPLE }}>{i + 1}</span>
                      <div>
                        <div className="text-[13px] font-bold text-foreground">{d.district}</div>
                        <div className="text-[10px] text-muted-foreground">{d.city}</div>
                      </div>
                    </div>
                    <span className="text-[13px] font-extrabold tabular-nums" style={{ color: PURPLE }}>{formatCurrency(d.avgPricePerSqm)}/م²</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cities bar chart */}
      <SCard title="أبرز المدن — متوسط سعر المتر">
        <div style={{ height: 280 }}>
          {loading ? <Skeleton className="w-full h-full rounded-xl" /> :
            byCity.length === 0 ? <Empty text="لا توجد بيانات للمدن" /> :
            <HBar data={byCity.map(c => ({ ...c, name: c.city }))} dataKey="avgPricePerSqm" nameKey="name" label="سعر المتر" />}
        </div>
      </SCard>

      {/* Districts table */}
      <SCard
        title="تحليل الأحياء المفصّل"
        action={
          <div className="flex gap-1">
            {[{ v: "activity", l: "الأكثر نشاطاً" }, { v: "price", l: "الأعلى سعراً" }, { v: "sqm", l: "سعر المتر" }].map(s => (
              <button key={s.v} onClick={() => setDistSort(s.v)}
                className={`text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all ${distSort === s.v ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted/60"}`}>
                {s.l}
              </button>
            ))}
          </div>
        }
      >
        {loading ? <Skeleton className="h-48 w-full rounded-xl" /> :
         sortedDistricts.length === 0 ? <Empty text="لا توجد بيانات للأحياء" /> : (
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
                    <td className="py-3 pr-2 text-[11px] text-muted-foreground tabular-nums">{i + 1}</td>
                    <td className="py-3 font-bold text-[13px]">{d.district}</td>
                    <td className="py-3 text-muted-foreground text-[12px]">{d.city}</td>
                    <td className="py-3 tabular-nums font-extrabold" style={{ color: CHART_PALETTE[i % CHART_PALETTE.length] }}>{d.count}</td>
                    <td className="py-3 tabular-nums text-[12px]">{formatCurrency(d.avgPrice)}</td>
                    <td className="py-3 tabular-nums text-[12px] font-bold">
                      {d.avgPricePerSqm > 0 ? <>{formatCurrency(d.avgPricePerSqm)}<span className="text-muted-foreground font-normal">/م²</span></> : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SCard>
    </Fade>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION E — الذكاء التحليلي
// ══════════════════════════════════════════════════════════════════════════════

function SectionE({ insights, loading, filters }: { insights?: InsightsData; loading: boolean; filters: AnalyticsFilters }) {
  const smartInsights = insights?.smartInsights ?? [];
  const kpis = insights?.kpis;
  const sd   = insights?.supplyDemand;
  const hasData = (kpis?.totalListings ?? 0) >= 3;

  /* Market direction recommendation */
  const marketRec = useMemo(() => {
    if (!hasData) return null;
    const score = insights?.marketScore?.score ?? 0;
    const balance = sd?.marketBalance;
    const turnover = kpis?.turnoverRate ?? 0;

    if (score >= 65 && balance === "higher_demand" && turnover > 20) {
      return { label: "شراء الآن", icon: ShoppingCart, color: GREEN, bg: GREEN_LT, reason: "السوق قوي، الطلب مرتفع، وسرعة الدوران تشير إلى فرصة حالية" };
    }
    if (score <= 35 || turnover < 5) {
      return { label: "انتظر", icon: Clock, color: AMBER, bg: AMBER_LT, reason: "السوق يمر بمرحلة هدوء — انتظر إشارات الانتعاش قبل الشراء" };
    }
    if (balance === "higher_supply") {
      return { label: "فرصة تفاوض", icon: Scale, color: TEAL, bg: TEAL_LT, reason: "العرض أعلى من الطلب — للمشتري قوة تفاوض جيدة الآن" };
    }
    return { label: "مستقر", icon: Minus, color: SLATE, bg: "#F8FAFC", reason: "السوق في حالة استقرار — قرارك مبني على احتياجك الشخصي" };
  }, [insights, kpis, sd, hasData]);

  /* Buyer recommendation */
  const buyerRec = useMemo(() => {
    if (!hasData) return "البيانات محدودة حالياً — ستتحسن التوصيات مع تراكم الإعلانات.";
    const byD = insights?.byDistrict ?? [];
    const avgSqm = kpis?.avgPricePerSqm ?? 0;
    const cheap = byD.filter(d => d.avgPricePerSqm > 0 && avgSqm > 0 && d.avgPricePerSqm < avgSqm * 0.85);
    const topType = insights?.byPropertyType?.[0];
    const parts: string[] = [];
    if (cheap.length > 0) parts.push(`أفضل قيمة للمال في: ${cheap.slice(0, 2).map(d => d.district).join(" و")}.`);
    if (topType) parts.push(`الأوفر توفراً: ${topType.propertyType} (${topType.percentage}% من السوق).`);
    return parts.join(" ") || "تحقق من الأحياء والأسعار في الفئات المختلفة.";
  }, [insights, kpis, hasData]);

  /* Seller/marketer recommendation */
  const marketerRec = useMemo(() => {
    if (!hasData) return "ستتحسن توصيات التسعير مع زيادة الإعلانات.";
    const avg = kpis?.avgPrice ?? 0;
    const med = kpis?.medianPrice ?? 0;
    if (!avg || !med) return "بيانات التسعير غير كافية بعد.";
    const skew = avg / med;
    if (skew > 1.15) return `سعّر قريباً من الوسيط (${formatCurrency(med)}) لبيع أسرع — المتوسط مشدود بعقارات غالية.`;
    if (skew < 0.88) return `يمكنك التسعير فوق المتوسط دون مخاطر — الوسيط (${formatCurrency(med)}) أعلى من المتوسط.`;
    return `السوق متوازن — ضع سعرك ضمن ±10% من الوسيط (${formatCurrency(med)}).`;
  }, [kpis, hasData]);

  return (
    <Fade>
      {/* Market decision card */}
      {!loading && marketRec && (
        <div className="p-5 rounded-2xl border-2" style={{ background: marketRec.bg, borderColor: `${marketRec.color}40` }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${marketRec.color}18`, border: `1.5px solid ${marketRec.color}30` }}>
              <marketRec.icon className="w-6 h-6" style={{ color: marketRec.color }} />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground mb-0.5">توصية السوق الحالية</div>
              <div className="text-[20px] font-black" style={{ color: marketRec.color }}>{marketRec.label}</div>
              <div className="text-[12px] mt-1 leading-relaxed" style={{ color: marketRec.color + "CC" }}>{marketRec.reason}</div>
            </div>
          </div>
        </div>
      )}

      {/* Smart insights */}
      <SCard title="ملاحظات ذكية">
        {loading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
        ) : !hasData ? (
          <Empty text="البيانات الحالية غير كافية لإظهار تحليل دقيق" />
        ) : smartInsights.length === 0 ? (
          <Empty text="لا توجد بيانات كافية لاستخلاص ملاحظات" />
        ) : (
          <div className="space-y-2.5">
            {smartInsights.slice(0, 5).map((insight, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/30">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${TEAL}18` }}>
                  <span className="text-[10px] font-extrabold" style={{ color: TEAL }}>{i + 1}</span>
                </div>
                <p className="text-[13px] text-foreground leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        )}
      </SCard>

      {/* Role-based recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-blue-200/60 p-5 shadow-sm" style={{ borderTop: `3px solid ${TEAL}` }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: TEAL_LT }}>
              <Home className="w-4 h-4" style={{ color: TEAL }} />
            </div>
            <div>
              <div className="text-[13px] font-extrabold text-foreground">توصية للمشتري</div>
            </div>
          </div>
          {loading
            ? <Skeleton className="h-16 w-full rounded-xl" />
            : !hasData
              ? <p className="text-[12px] text-muted-foreground">البيانات غير كافية حالياً.</p>
              : <p className="text-[13px] text-foreground leading-relaxed">{buyerRec}</p>}
        </div>
        <div className="bg-card rounded-2xl border border-emerald-200/60 p-5 shadow-sm" style={{ borderTop: `3px solid ${GREEN}` }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: GREEN_LT }}>
              <Target className="w-4 h-4" style={{ color: GREEN }} />
            </div>
            <div>
              <div className="text-[13px] font-extrabold text-foreground">توصية للمُسوّق / البائع</div>
            </div>
          </div>
          {loading
            ? <Skeleton className="h-16 w-full rounded-xl" />
            : !hasData
              ? <p className="text-[12px] text-muted-foreground">البيانات غير كافية حالياً.</p>
              : <p className="text-[13px] text-foreground leading-relaxed">{marketerRec}</p>}
        </div>
      </div>

      {/* Data quality notice */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200/60">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-[12px] text-amber-700 leading-relaxed">
          <strong>ملاحظة:</strong> جميع المؤشرات مستخلصة من إعلانات المنصة فقط — كلما زادت الإعلانات كانت التحليلات أكثر دقة.
          {filters.city && <span> النطاق المحدد: <strong>{filters.city}</strong>{filters.district && ` — ${filters.district}`}.</span>}
        </div>
      </div>
    </Fade>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function Analytics() {
  const [tab, setTab]         = useState<TabId>("A");
  const [period, setPeriod]   = useState("month");
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
  const totalStr = loadingInsights ? "جاري التحميل..." : kpis?.totalListings
    ? `${formatNumber(kpis.totalListings)} إعلان نشط • ${formatNumber(kpis.newLast30Days ?? 0)} إعلان هذا الشهر`
    : "لا توجد إعلانات نشطة حالياً";

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="mb-7">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${TEAL}14`, border: `1.5px solid ${TEAL}25` }}>
              <BarChart3 className="w-5 h-5" style={{ color: TEAL }} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">تحليلات السوق العقاري</h1>
              <p className="text-[13px] text-muted-foreground mt-0.5">{totalStr}</p>
            </div>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="mb-5">
          <FiltersPanel filters={filters} onChange={setFilters} filterOpts={filterOpts} />
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold whitespace-nowrap transition-all shrink-0"
                style={active
                  ? { background: NAVY, color: "#fff", boxShadow: `0 3px 12px ${NAVY}40` }
                  : { background: "transparent", color: SLATE, border: "1px solid #E2E8F0" }
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Section content ── */}
        <AnimatePresence mode="wait">
          <div key={tab}>
            {tab === "A" && <SectionA insights={insights} loading={loadingInsights} />}
            {tab === "B" && <SectionB insights={insights} trends={trends} loading={loadingInsights} loadingTrends={loadingTrends} period={period} setPeriod={setPeriod} />}
            {tab === "C" && <SectionC insights={insights} loading={loadingInsights} />}
            {tab === "D" && <SectionD insights={insights} loading={loadingInsights} distSort={distSort} setDistSort={setDistSort} />}
            {tab === "E" && <SectionE insights={insights} loading={loadingInsights} filters={filters} />}
          </div>
        </AnimatePresence>

      </div>
    </Layout>
  );
}
