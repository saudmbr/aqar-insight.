import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/layout/layout";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, BarChart3, Building2,
  MapPin, Activity, AlertTriangle, Lightbulb, Info,
  ArrowUpRight, ArrowDownRight, Scale,
  Home, UserCheck, Wrench, Target, Zap, Star,
} from "lucide-react";
import { LISTING_TYPE_GROUPS } from "@/lib/listing-types";

const BASE = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

// ── Types ─────────────────────────────────────────────────────────────────────
type KpisData = {
  totalListings: number; avgPricePerSqm: number; avgPrice: number;
  maxPrice: number; minPrice: number; medianPrice: number;
  p25Price: number; p75Price: number; priceStddev: number;
  saleCount: number; rentCount: number; newLast7Days: number; newLast30Days: number;
};
type InsightsData = {
  kpis: KpisData;
  byCity: Array<{ city: string; count: number; avgPrice: number; avgPricePerSqm: number }>;
  byDistrict: Array<{ district: string; city: string; count: number; avgPrice: number; avgPricePerSqm: number }>;
  byPropertyType: Array<{ propertyType: string; count: number; avgPrice: number; avgPricePerSqm: number; percentage: number }>;
  byListingType: Array<{ listingType: string; count: number; avgPrice: number; percentage: number; label: string }>;
  smartInsights: string[];
};
type TrendPoint = { period: string; label: string; count: number; avgPrice: number; avgPricePerSqm: number };
type FilterOptions = {
  cities: string[];
  districts: Array<{ district: string; city: string }>;
  propertyTypes: string[];
  listingTypes: Array<{ value: string; label: string }>;
};

// ── Constants ─────────────────────────────────────────────────────────────────
const SECTION_TABS = [
  { id: "A", label: "أ — تحليل السوق",        icon: BarChart3 },
  { id: "B", label: "ب — مقارنة الأحياء",     icon: MapPin },
  { id: "C", label: "ج — مؤشرات السوق",       icon: Activity },
  { id: "D", label: "د — التحليل الكامل",      icon: Lightbulb },
] as const;

type SectionId = "A" | "B" | "C" | "D";

const PERIOD_TABS = [
  { value: "day",     label: "يوم" },
  { value: "week",    label: "أسبوع" },
  { value: "month",   label: "شهر" },
  { value: "quarter", label: "ربع سنة" },
  { value: "year",    label: "سنة" },
];

const DIST_SORT_OPTS = [
  { value: "activity", label: "النشاط" },
  { value: "price",    label: "السعر" },
  { value: "sqm",      label: "سعر المتر" },
];

const BAR_COLORS = ["#0F7BA0", "#0F1C3F", "#94A3B8", "#34D399", "#8B5CF6", "#F97316", "#EF4444", "#64748B"];
const INPUT_CLS = "w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";

// ── Helper components ─────────────────────────────────────────────────────────
function KpiBlock({ label, value, sub, color, loading }: {
  label: string; value: React.ReactNode; sub?: string; color: string; loading?: boolean;
}) {
  return (
    <div className="bg-card rounded-[22px] border border-border/60 overflow-hidden shadow-sm hover:-translate-y-0.5 transition-transform duration-200">
      <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${color}, ${color}44)` }} />
      <div className="p-5">
        <div className="text-[12px] text-muted-foreground mb-2">{label}</div>
        <div className="text-[1.65rem] font-extrabold leading-none mb-1.5 tabular-nums tracking-tight" style={{ color }}>
          {loading ? <Skeleton className="h-8 w-24" /> : value}
        </div>
        {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}

function IndicatorBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
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
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: statusColor + "14" }}>
          <Icon className="w-4 h-4" style={{ color: statusColor }} />
        </div>
        {loading ? <Skeleton className="h-5 w-16" /> : (
          <IndicatorBadge label={status} color={statusColor} bg={statusBg} />
        )}
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Analytics() {
  const [section, setSection] = useState<SectionId>("A");
  const [period, setPeriod] = useState("month");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [listingType, setListingType] = useState("");
  const [districtSort, setDistrictSort] = useState("activity");
  const [userRole, setUserRole] = useState<"buyer" | "marketer" | "provider">("buyer");

  useEffect(() => {
    document.title = "تحليلات السوق – عقار إنسايت";
    return () => { document.title = "عقار إنسايت"; };
  }, []);

  const queryStr = useMemo(() => {
    const p = new URLSearchParams();
    if (city) p.set("city", city);
    if (district) p.set("district", district);
    if (propertyType) p.set("propertyType", propertyType);
    if (listingType) p.set("listingType", listingType);
    return p.toString();
  }, [city, district, propertyType, listingType]);

  const { data: insights, isLoading: loadingInsights } = useQuery<InsightsData>({
    queryKey: ["mkt-insights", queryStr],
    queryFn: async () => {
      const res = await fetch(`${BASE()}/api/analytics/listings-insights${queryStr ? `?${queryStr}` : ""}`);
      if (!res.ok) throw new Error("فشل");
      return res.json();
    },
    staleTime: 60_000,
  });

  const { data: trends, isLoading: loadingTrends } = useQuery<TrendPoint[]>({
    queryKey: ["mkt-trends", queryStr, period],
    queryFn: async () => {
      const p = new URLSearchParams(queryStr);
      p.set("period", period);
      const res = await fetch(`${BASE()}/api/analytics/listings-trends?${p.toString()}`);
      if (!res.ok) throw new Error("فشل");
      return res.json();
    },
    staleTime: 60_000,
  });

  const { data: filterOpts } = useQuery<FilterOptions>({
    queryKey: ["mkt-filter-options"],
    queryFn: async () => {
      const res = await fetch(`${BASE()}/api/analytics/listings-filter-options`);
      if (!res.ok) throw new Error("فشل");
      return res.json();
    },
    staleTime: 300_000,
  });

  // ── Computed indicators ──────────────────────────────────────────────────────
  const kpis = insights?.kpis;
  const hasData = (kpis?.totalListings ?? 0) > 0;

  const avgP   = kpis?.avgPrice ?? 0;
  const medP   = kpis?.medianPrice ?? 0;
  const avgSqm = kpis?.avgPricePerSqm ?? 0;
  const p25    = kpis?.p25Price ?? 0;
  const p75    = kpis?.p75Price ?? 0;
  const new7   = kpis?.newLast7Days ?? 0;
  const new30  = kpis?.newLast30Days ?? 0;
  const tot    = kpis?.totalListings ?? 0;
  const saleC  = kpis?.saleCount ?? 0;

  // Price volatility: IQR as % of median (platform-internal, no external data)
  const volatility = medP > 0 ? Math.round(((p75 - p25) / medP) * 100) : 0;
  const stabilityLabel = volatility < 20 ? "مستقر" : volatility < 45 ? "متوسط التذبذب" : "متذبذب";
  const stabilityColor = volatility < 20 ? "#22C55E" : volatility < 45 ? "#F59E0B" : "#EF4444";
  const stabilityBg    = volatility < 20 ? "rgba(34,197,94,0.1)" : volatility < 45 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)";

  // Market direction from trend data
  const trendLen  = trends?.length ?? 0;
  const firstAvg  = trends?.[0]?.avgPrice ?? 0;
  const lastAvg   = trends?.[trendLen - 1]?.avgPrice ?? 0;
  const priceChange = firstAvg > 0 ? Math.round(((lastAvg - firstAvg) / firstAvg) * 100) : 0;
  const marketDirLabel = priceChange > 3 ? "صاعد ↑" : priceChange < -3 ? "هابط ↓" : "مستقر →";
  const marketDirColor = priceChange > 3 ? "#22C55E" : priceChange < -3 ? "#EF4444" : "#0F7BA0";
  const marketDirBg    = priceChange > 3 ? "rgba(34,197,94,0.1)" : priceChange < -3 ? "rgba(239,68,68,0.1)" : "rgba(15,123,160,0.1)";
  const marketDirIcon  = priceChange > 3 ? TrendingUp : priceChange < -3 ? TrendingDown : Minus;

  // Demand/supply (platform data: listing counts by time)
  const weeklyRate = new30 > 0 ? new30 / 4 : 0;
  const demandRate = weeklyRate > 0 ? new7 / weeklyRate : 0;
  const demandLabel = demandRate > 1.2 ? "مرتفع" : demandRate < 0.8 ? "منخفض" : "متوسط";
  const demandColor = demandRate > 1.2 ? "#22C55E" : demandRate < 0.8 ? "#EF4444" : "#0F7BA0";
  const demandBg    = demandRate > 1.2 ? "rgba(34,197,94,0.1)" : demandRate < 0.8 ? "rgba(239,68,68,0.1)" : "rgba(15,123,160,0.1)";

  const supplyLabel = new7 > weeklyRate * 1.1 ? "متزايد" : new7 < weeklyRate * 0.9 ? "متناقص" : "مستقر";
  const supplyColor = new7 > weeklyRate * 1.1 ? "#22C55E" : new7 < weeklyRate * 0.9 ? "#F59E0B" : "#0F7BA0";
  const supplyBg    = new7 > weeklyRate * 1.1 ? "rgba(34,197,94,0.1)" : new7 < weeklyRate * 0.9 ? "rgba(245,158,11,0.1)" : "rgba(15,123,160,0.1)";

  // Risk: based on price volatility + data density
  const riskLabel = volatility < 20 ? "منخفض" : volatility < 40 ? "متوسط" : "مرتفع";
  const riskColor = volatility < 20 ? "#22C55E" : volatility < 40 ? "#F59E0B" : "#EF4444";
  const riskBg    = volatility < 20 ? "rgba(34,197,94,0.1)" : volatility < 40 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)";

  // Fair value: median vs avg ratio (platform-internal only)
  const fairRatio  = avgP > 0 ? medP / avgP : 1;
  const fairLabel  = fairRatio > 1.12 ? "مرتفع عن السوق" : fairRatio < 0.88 ? "أقل من السوق" : "ضمن متوسط السوق";
  const fairColor  = fairRatio > 1.12 ? "#EF4444" : fairRatio < 0.88 ? "#22C55E" : "#0F7BA0";
  const fairBg     = fairRatio > 1.12 ? "rgba(239,68,68,0.1)" : fairRatio < 0.88 ? "rgba(34,197,94,0.1)" : "rgba(15,123,160,0.1)";

  // Investment opportunity: districts below market price-per-sqm average
  const byDistrict = insights?.byDistrict ?? [];
  const cheapDistricts = byDistrict.filter(d => d.avgPricePerSqm > 0 && avgSqm > 0 && d.avgPricePerSqm < avgSqm * 0.9);
  const investLabel = cheapDistricts.length > 0 ? "فرصة متاحة" : "السوق متوازن";
  const investColor = cheapDistricts.length > 0 ? "#22C55E" : "#0F7BA0";
  const investBg    = cheapDistricts.length > 0 ? "rgba(34,197,94,0.1)" : "rgba(15,123,160,0.1)";

  // ── Role-based insight computations ─────────────────────────────────────────
  // Shared
  const topCheapDistricts4 = [...byDistrict].filter(d => d.avgPricePerSqm > 0).sort((a, b) => a.avgPricePerSqm - b.avgPricePerSqm).slice(0, 4);
  const topActiveDistricts4 = [...byDistrict].sort((a, b) => b.count - a.count).slice(0, 4);
  const hotPropertyTypes = [...(insights?.byPropertyType ?? [])].sort((a, b) => b.percentage - a.percentage).slice(0, 4);

  // Buyer
  const buyTimingStatus = priceChange < -3 ? "ممتاز للشراء" : priceChange < 2 ? "مناسب للشراء" : "السوق صاعد";
  const buyTimingColor  = priceChange < -3 ? "#22C55E" : priceChange < 2 ? "#0F7BA0" : "#F59E0B";
  const buyTimingDesc   = priceChange < -5
    ? `الأسعار انخفضت ${Math.abs(priceChange)}% مؤخراً — فرصة للدخول قبل التعافي.`
    : priceChange < 0
    ? `الأسعار في تراجع طفيف — مناسب للمفاوضة والحصول على سعر أفضل.`
    : priceChange < 5
    ? `الأسعار مستقرة — السوق معقول ومناسب للشراء.`
    : `السوق في ارتفاع (${priceChange}%) — سارع في القرار أو انتظر تصحيحاً.`;
  const buyerRecommendation = (() => {
    if (!hasData || tot < 3) return "البيانات محدودة حالياً — ستتحسن التوصيات مع تراكم الإعلانات.";
    const parts: string[] = [];
    if (priceChange < -3) parts.push(`الأسعار في تراجع — نافذة جيدة للشراء.`);
    else if (priceChange > 5) parts.push(`الأسعار ترتفع — سارع لاتخاذ قرارك.`);
    else parts.push(`السوق في حالة استقرار نسبي.`);
    if (topCheapDistricts4.length > 0) parts.push(`أفضل قيمة للمال في ${topCheapDistricts4.slice(0, 2).map(d => d.district).join(" و")}.`);
    if (hotPropertyTypes[0]) parts.push(`النوع الأوفر توفراً: ${hotPropertyTypes[0].propertyType} (${hotPropertyTypes[0].percentage}% من الإعلانات).`);
    return parts.join(" ");
  })();

  // Marketer
  const pricingSkew     = (avgP > 0 && medP > 0) ? avgP / medP : 1;
  const pricingTipColor = pricingSkew > 1.15 ? "#F59E0B" : pricingSkew < 0.88 ? "#22C55E" : "#0F7BA0";
  const pricingTipBadge = pricingSkew > 1.15 ? "سعّر أقل من المتوسط" : pricingSkew < 0.88 ? "هامش للرفع" : "السوق متوازن";
  const pricingTip = avgP > 0 && medP > 0
    ? pricingSkew > 1.15
      ? `المتوسط (${formatCurrency(avgP)}) أعلى من الوسيط (${formatCurrency(medP)}) — وجود إعلانات مرتفعة تشوّه السوق. ضع سعرك قريباً من الوسيط لتحقيق بيع أسرع.`
      : pricingSkew < 0.88
      ? `معظم الإعلانات منخفضة السعر — هامش للتسعير فوق المتوسط دون الخروج من السوق.`
      : `الأسعار متوازنة — ضع سعرك ضمن ±10% من الوسيط (${formatCurrency(medP)}) للحصول على أفضل استجابة.`
    : "بيانات التسعير غير كافية بعد.";
  const listingMomentumLabel = demandRate > 1.3 ? "نشاط مرتفع" : demandRate > 1 ? "نشاط جيد" : demandRate > 0.7 ? "معتدل" : "هادئ";
  const listingMomentumColor = demandRate > 1.3 ? "#22C55E" : demandRate > 1 ? "#0F7BA0" : demandRate > 0.7 ? "#F59E0B" : "#EF4444";
  const listingMomentumDesc  = demandRate > 1.3
    ? `نشاط إضافات مرتفع — الإعلانات تلقى استجابة أسرع هذا الأسبوع.`
    : demandRate > 1
    ? `السوق نشط — وقت مناسب لنشر إعلاناتك.`
    : demandRate > 0.7
    ? `النشاط معتدل — ركّز على جودة الصور والوصف لتميّز إعلانك.`
    : `السوق هادئ — ركّز على تحسين العروض لجذب المهتمين.`;
  const cityAvgCount  = (insights?.byCity?.length ?? 0) > 0 ? tot / (insights!.byCity.length) : 0;
  const lowSupplyCities = [...(insights?.byCity ?? [])].filter(c => c.count < cityAvgCount * 0.6).sort((a, b) => a.count - b.count).slice(0, 3);
  const marketerRecommendation = (() => {
    if (!hasData || tot < 3) return "البيانات محدودة حالياً — ستتحسن التوصيات مع تراكم الإعلانات.";
    const parts: string[] = [];
    parts.push(pricingSkew > 1.15 ? "التسعير عند أو أسفل الوسيط يزيد فرص البيع." : "التسعير ضمن نطاق السوق يضمن الظهور الجيد.");
    if (lowSupplyCities.length > 0) parts.push(`مناطق ${lowSupplyCities.map(c => c.city).join("، ")} فيها عدد قليل من الإعلانات — منافسة أقل.`);
    if (demandRate > 1.2) parts.push(`السوق نشط — الوقت مناسب لنشر إعلانات جديدة.`);
    if (hotPropertyTypes[0]) parts.push(`النوع الأعلى طلباً: ${hotPropertyTypes[0].propertyType} — ينصح بالتركيز عليه.`);
    return parts.join(" ");
  })();

  // Service Provider
  const highValueTypes = [...(insights?.byPropertyType ?? [])].filter(t => t.avgPricePerSqm > 0).sort((a, b) => b.avgPricePerSqm - a.avgPricePerSqm).slice(0, 3);
  const growthSignal  = demandRate > 1.2 ? "نمو إيجابي" : demandRate < 0.8 ? "تباطؤ نسبي" : "مستقر";
  const growthColor   = demandRate > 1.2 ? "#22C55E" : demandRate < 0.8 ? "#F59E0B" : "#0F7BA0";
  const providerGrowthDesc = demandRate > 1.2
    ? `السوق ينمو بمعدل ${Math.round(demandRate * 100)}% مقارنة بالمعدل الطبيعي — الطلب على الخدمات العقارية في تصاعد.`
    : demandRate < 0.8
    ? `النشاط أبطأ من المعتاد — ركّز على الجودة وبناء العلاقات مع المسوّقين.`
    : `السوق مستقر — حافظ على حضورك وتابع الأحياء النشطة.`;
  const providerRecommendation = (() => {
    if (!hasData || tot < 3) return "البيانات محدودة حالياً — ستتحسن التوصيات مع تراكم الإعلانات.";
    const parts: string[] = [];
    if (topActiveDistricts4.length > 0) parts.push(`ركّز تسويقك في ${topActiveDistricts4.slice(0, 2).map(d => d.district).join(" و")} حيث النشاط العقاري أعلى.`);
    if (highValueTypes.length > 0) parts.push(`خدمات ${highValueTypes[0].propertyType} مجدية مالياً لارتفاع قيمتها (${formatCurrency(highValueTypes[0].avgPricePerSqm)}/م²).`);
    if (demandRate > 1.2) parts.push(`السوق في نمو — توقع طلباً متزايداً على التشطيب والصيانة.`);
    else parts.push(`ركّز على تحسين جودة خدماتك وبناء قاعدة عملاء راسخة.`);
    return parts.join(" ");
  })();

  // District sorting for section B
  const sortedDistricts = useMemo(() => {
    const arr = [...byDistrict];
    if (districtSort === "price")    return arr.sort((a, b) => b.avgPrice - a.avgPrice);
    if (districtSort === "sqm")      return arr.sort((a, b) => b.avgPricePerSqm - a.avgPricePerSqm);
    return arr.sort((a, b) => b.count - a.count);
  }, [byDistrict, districtSort]);

  // Market summary for section D
  const marketSummary = (() => {
    if (!hasData) return "البيانات الحالية غير كافية لإصدار ملخص دقيق.";
    const parts: string[] = [];
    if (priceChange > 3) parts.push(`السوق في اتجاه صاعد بنسبة ${priceChange}% خلال الفترة المحددة.`);
    else if (priceChange < -3) parts.push(`الأسعار في تراجع نسبي بنسبة ${Math.abs(priceChange)}%.`);
    else parts.push("الأسعار مستقرة نسبيًا خلال الفترة المحددة.");
    if (volatility < 20) parts.push("تذبذب الأسعار منخفض مما يعكس سوقًا متجانسًا.");
    else if (volatility > 45) parts.push("يُلاحظ تفاوت كبير في الأسعار، ينصح بالدراسة الدقيقة قبل أي قرار.");
    if (demandRate > 1.2) parts.push("نشاط الإضافات الأسبوعية مرتفع مما يشير إلى طلب قوي.");
    if (cheapDistricts.length > 0) {
      parts.push(`رُصدت فرصة سعرية في ${cheapDistricts.length} ${cheapDistricts.length === 1 ? "حي" : "أحياء"} تقل أسعارها عن متوسط السوق.`);
    }
    return parts.join(" ");
  })();

  // Recommendation text for section D
  const recommendation = (() => {
    if (!hasData) return "البيانات الحالية غير كافية لإصدار توصية. أضف المزيد من الإعلانات لتفعيل التحليل.";
    if (tot < 3) return "البيانات الحالية محدودة جدًا. نتائج التحليل ستتحسن مع تراكم الإعلانات.";
    if (priceChange > 5 && demandRate > 1.2) return "السوق في زخم إيجابي — ارتفاع في الأسعار مع نشاط إضافات مرتفع. قد يكون الوقت مناسباً للبيع.";
    if (priceChange < -5) return "الأسعار في تراجع — قد يمثل ذلك فرصة شراء بأسعار أقل من المعتاد.";
    if (volatility > 50) return "السوق يُظهر تفاوتًا سعريًا كبيرًا — ينصح بمقارنة الأحياء بعناية قبل اتخاذ أي قرار.";
    if (cheapDistricts.length > 0) return `توجد فرصة سعرية في ${cheapDistricts.map(d => d.district).slice(0, 2).join(" و")} حيث الأسعار أقل من متوسط السوق.`;
    return "السوق مستقر نسبيًا بناءً على البيانات المتاحة. يُنصح بمتابعة الاتجاهات دوريًا لاتخاذ قرار مدروس.";
  })();

  const filteredDistricts = city
    ? (filterOpts?.districts ?? []).filter(d => d.city === city)
    : (filterOpts?.districts ?? []);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-6 pb-14"
        dir="rtl"
      >
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div
          className="relative rounded-[2rem] overflow-hidden p-8 md:p-10"
          style={{ background: "linear-gradient(140deg, #0F1C3F 0%, #0F1C3F 55%, #0F7BA0 100%)" }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.035 }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_top_right,rgba(201,168,76,0.12),transparent)] pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/90 px-3 py-1 rounded-full text-xs font-bold mb-4">
              <BarChart3 className="w-3.5 h-3.5" />
              مبني حصراً على بيانات المنصة الداخلية
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">مؤشرات السوق العقاري</h1>
            <p className="text-white/70 mt-2 text-sm max-w-xl">تحليل شامل مبني على إعلانات المنصة — لا يعتمد على أي بيانات خارجية أو حكومية</p>
          </div>
        </div>

        {/* ── Filters ───────────────────────────────────────────────────── */}
        <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select value={city} onChange={e => { setCity(e.target.value); setDistrict(""); }} className={INPUT_CLS}>
              <option value="">كل المدن</option>
              {(filterOpts?.cities ?? []).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={district} onChange={e => setDistrict(e.target.value)} className={INPUT_CLS}>
              <option value="">كل الأحياء</option>
              {filteredDistricts.map(d => <option key={d.district} value={d.district}>{d.district}</option>)}
            </select>
            <select value={propertyType} onChange={e => setPropertyType(e.target.value)} className={INPUT_CLS}>
              <option value="">كل الأنواع</option>
              {(filterOpts?.propertyTypes ?? []).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={listingType} onChange={e => setListingType(e.target.value)} className={INPUT_CLS}>
              <option value="">كل الصفقات</option>
              {LISTING_TYPE_GROUPS.map(g => (
                <optgroup key={g.label} label={`── ${g.label}`}>
                  {g.types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          {(city || district || propertyType || listingType) && (
            <button
              onClick={() => { setCity(""); setDistrict(""); setPropertyType(""); setListingType(""); }}
              className="mt-3 text-xs text-muted-foreground hover:text-destructive border border-border rounded-lg px-3 py-1.5 transition-all"
            >
              مسح الفلاتر
            </button>
          )}
        </div>

        {/* ── Section Tabs ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SECTION_TABS.map(tab => {
            const Icon = tab.icon;
            const active = section === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSection(tab.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border shrink-0"
                style={active ? {
                  background: "#0F7BA0",
                  color: "#fff",
                  borderColor: "#0F7BA0",
                } : {
                  background: "transparent",
                  color: "var(--muted-foreground)",
                  borderColor: "var(--border)",
                }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SECTION A — تحليل السوق
        ══════════════════════════════════════════════════════════════ */}
        {section === "A" && (
          <div className="space-y-6">
            {!hasData && !loadingInsights ? (
              <EmptyState text="لا توجد إعلانات نشطة تطابق الفلاتر الحالية. سيظهر التحليل تلقائياً فور نشر الإعلانات." />
            ) : (
              <>
                {/* A1: Main KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <KpiBlock label="متوسط سعر العقار" color="#0F7BA0" loading={loadingInsights}
                    value={formatCurrency(avgP)} sub="متوسط أسعار جميع الإعلانات النشطة" />
                  <KpiBlock label="الوسيط السعري" color="#94A3B8" loading={loadingInsights}
                    value={formatCurrency(medP)} sub="50% من الإعلانات أقل من هذا السعر" />
                  <KpiBlock label="متوسط سعر المتر" color="#34D399" loading={loadingInsights}
                    value={formatCurrency(avgSqm)} sub="ريال سعودي / م²" />
                  <KpiBlock label="إجمالي الإعلانات النشطة" color="#8B5CF6" loading={loadingInsights}
                    value={formatNumber(tot)} sub={`${saleC} للبيع · ${kpis?.rentCount ?? 0} للإيجار`} />
                </div>

                {/* A2: Stability + Trend direction */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-card rounded-[22px] border border-border/60 p-5 shadow-sm hover:-translate-y-0.5 transition-transform duration-200">
                    <div className="text-[12px] text-muted-foreground mb-2">استقرار السوق</div>
                    {loadingInsights ? <Skeleton className="h-6 w-24" /> : (
                      <>
                        <div className="text-xl font-extrabold mb-1" style={{ color: stabilityColor }}>{stabilityLabel}</div>
                        <div className="text-[11px] text-muted-foreground">معامل التذبذب: {volatility}%</div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, volatility)}%`, background: stabilityColor }} />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="bg-card rounded-[22px] border border-border/60 p-5 shadow-sm hover:-translate-y-0.5 transition-transform duration-200">
                    <div className="text-[12px] text-muted-foreground mb-2">اتجاه الأسعار</div>
                    {loadingTrends ? <Skeleton className="h-6 w-24" /> : trendLen < 2 ? (
                      <div className="text-sm text-muted-foreground">بيانات غير كافية</div>
                    ) : (
                      <>
                        <div className="text-xl font-extrabold mb-1" style={{ color: marketDirColor }}>{marketDirLabel}</div>
                        <div className="text-[11px] text-muted-foreground">{priceChange > 0 ? "+" : ""}{priceChange}% خلال الفترة المحددة</div>
                      </>
                    )}
                  </div>
                  <div className="bg-card rounded-[22px] border border-border/60 p-5 shadow-sm hover:-translate-y-0.5 transition-transform duration-200">
                    <div className="text-[12px] text-muted-foreground mb-2">نطاق الأسعار (ر.س)</div>
                    {loadingInsights ? <Skeleton className="h-14 w-full" /> : p25 > 0 ? (
                      <>
                        <div className="flex items-center gap-1 mb-1">
                          <ArrowDownRight className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          <div className="text-sm font-bold text-foreground">{formatCurrency(p25)}</div>
                          <div className="text-[11px] text-muted-foreground">منخفض</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <ArrowUpRight className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <div className="text-sm font-bold text-foreground">{formatCurrency(p75)}</div>
                          <div className="text-[11px] text-muted-foreground">مرتفع</div>
                        </div>
                      </>
                    ) : <div className="text-sm text-muted-foreground">بيانات غير كافية</div>}
                  </div>
                  <div className="bg-card rounded-[22px] border border-border/60 p-5 shadow-sm hover:-translate-y-0.5 transition-transform duration-200">
                    <div className="text-[12px] text-muted-foreground mb-2">معدل تغير الأسعار</div>
                    {loadingTrends ? <Skeleton className="h-6 w-24" /> : trendLen < 2 ? (
                      <div className="text-sm text-muted-foreground">بيانات غير كافية</div>
                    ) : (
                      <>
                        <div className="text-xl font-extrabold mb-1" style={{ color: marketDirColor }}>
                          {priceChange > 0 ? "+" : ""}{priceChange}%
                        </div>
                        <div className="text-[11px] text-muted-foreground">من أول نقطة إلى آخر نقطة في البيانات</div>
                      </>
                    )}
                  </div>
                </div>

                {/* A3: Trend Chart with period toggle */}
                <div className="bg-card rounded-2xl border border-border/60 shadow-sm">
                  <div className="p-5 border-b border-border/40 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <div className="text-base font-bold text-foreground">اتجاهات السوق</div>
                      <div className="text-[12px] text-muted-foreground mt-0.5">متوسط الأسعار وعدد الإعلانات بمرور الوقت</div>
                    </div>
                    <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
                      {PERIOD_TABS.map(pt => (
                        <button
                          key={pt.value}
                          onClick={() => setPeriod(pt.value)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          style={period === pt.value ? {
                            background: "#0F7BA0", color: "#fff",
                          } : {
                            color: "var(--muted-foreground)",
                          }}
                        >
                          {pt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="h-[280px]" dir="ltr">
                      {loadingTrends ? (
                        <Skeleton className="w-full h-full rounded-xl" />
                      ) : (trends?.length ?? 0) < 2 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                          <Info className="w-7 h-7 opacity-30" />
                          <p className="text-sm text-center">البيانات التاريخية غير كافية لعرض الاتجاه لهذه الفترة</p>
                          <p className="text-xs text-center opacity-70">ستظهر الرسوم البيانية مع تراكم الإعلانات عبر الزمن</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trends} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} dy={8} />
                            <YAxis yAxisId="l" orientation="left" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} dx={8} />
                            <Tooltip
                              contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}
                              formatter={(v: number, name: string) => [
                                name === "count" ? `${v} إعلان` : formatCurrency(v),
                                name === "count" ? "عدد الإعلانات" : "متوسط السعر",
                              ]}
                            />
                            <Line yAxisId="l" type="monotone" dataKey="count" stroke="#94A3B8" strokeWidth={2.5} dot={{ r: 3, fill: "#94A3B8", strokeWidth: 0 }} name="count" />
                            <Line yAxisId="r" type="monotone" dataKey="avgPrice" stroke="#0F7BA0" strokeWidth={2.5} dot={{ r: 3, fill: "#0F7BA0", strokeWidth: 0 }} name="avgPrice" />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-2">
                      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                        <span className="w-5 h-0.5 bg-[#94A3B8] rounded-full inline-block" /> عدد الإعلانات
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                        <span className="w-5 h-0.5 bg-[#0F7BA0] rounded-full inline-block" /> متوسط السعر
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION B — مقارنة الأحياء
        ══════════════════════════════════════════════════════════════ */}
        {section === "B" && (
          <div className="space-y-5">
            {(byDistrict.length === 0 && !loadingInsights) ? (
              <EmptyState text="لا توجد بيانات أحياء لعرضها. تأكد من أن الإعلانات تحتوي على اسم الحي، أو غيّر الفلاتر." />
            ) : (
              <>
                {/* Sort */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-base font-bold text-foreground">مقارنة الأحياء</div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">مبنية على إعلانات المنصة النشطة فقط</div>
                  </div>
                  <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
                    {DIST_SORT_OPTS.map(s => (
                      <button key={s.value} onClick={() => setDistrictSort(s.value)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        style={districtSort === s.value ? { background: "#0F7BA0", color: "#fff" } : { color: "var(--muted-foreground)" }}
                      >
                        ترتيب بـ {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bar chart */}
                {sortedDistricts.length >= 2 && (
                  <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
                    <div className="text-sm font-bold text-foreground mb-4">
                      {districtSort === "sqm" ? "متوسط سعر المتر لكل حي" :
                       districtSort === "price" ? "متوسط السعر الكلي لكل حي" :
                       "عدد الإعلانات لكل حي"}
                    </div>
                    <div className="h-[220px]" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sortedDistricts.slice(0, 10)} margin={{ top: 0, right: 16, bottom: 0, left: 0 }} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.5} />
                          <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false}
                            tickFormatter={v => districtSort === "activity" ? `${v}` : `${(v / 1000).toFixed(0)}k`} />
                          <YAxis type="category" dataKey="district" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={80} />
                          <Tooltip
                            contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid var(--border)" }}
                            formatter={(v: number) => [
                              districtSort === "activity" ? `${v} إعلان` : formatCurrency(v),
                              districtSort === "activity" ? "عدد الإعلانات" : districtSort === "sqm" ? "سعر المتر" : "متوسط السعر",
                            ]}
                          />
                          <Bar dataKey={districtSort === "activity" ? "count" : districtSort === "sqm" ? "avgPricePerSqm" : "avgPrice"} radius={[0, 4, 4, 0]}>
                            {sortedDistricts.slice(0, 10).map((_, i) => (
                              <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Comparison table */}
                <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                  {loadingInsights ? (
                    <div className="p-5 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                  ) : (
                    <table className="w-full text-sm text-right">
                      <thead className="bg-muted/30 border-b border-border">
                        <tr>
                          <th className="px-5 py-3 text-[11px] font-bold text-muted-foreground tracking-wide">#</th>
                          <th className="px-5 py-3 text-[11px] font-bold text-muted-foreground tracking-wide">الحي</th>
                          <th className="px-5 py-3 text-[11px] font-bold text-muted-foreground tracking-wide">المدينة</th>
                          <th className="px-5 py-3 text-[11px] font-bold text-muted-foreground tracking-wide">إعلانات</th>
                          <th className="px-5 py-3 text-[11px] font-bold text-muted-foreground tracking-wide">متوسط السعر</th>
                          <th className="px-5 py-3 text-[11px] font-bold text-muted-foreground tracking-wide">سعر المتر</th>
                          <th className="px-5 py-3 text-[11px] font-bold text-muted-foreground tracking-wide">فرق عن السوق</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {sortedDistricts.map((d, i) => {
                          const diff = avgSqm > 0 && d.avgPricePerSqm > 0
                            ? Math.round(((d.avgPricePerSqm - avgSqm) / avgSqm) * 100)
                            : null;
                          const diffColor = diff === null ? "var(--muted-foreground)" : diff > 10 ? "#EF4444" : diff < -10 ? "#22C55E" : "var(--muted-foreground)";
                          return (
                            <tr key={`${d.district}-${i}`} className="hover:bg-muted/20 transition-colors">
                              <td className="px-5 py-3.5 text-muted-foreground text-[12px]">{i + 1}</td>
                              <td className="px-5 py-3.5 font-semibold text-foreground">{d.district}</td>
                              <td className="px-5 py-3.5 text-muted-foreground text-[12px]">{d.city}</td>
                              <td className="px-5 py-3.5">
                                <span className="inline-flex items-center bg-primary/10 text-primary text-[12px] font-bold rounded-lg px-2 py-0.5">{d.count}</span>
                              </td>
                              <td className="px-5 py-3.5 font-semibold text-foreground">{d.avgPrice > 0 ? formatCurrency(d.avgPrice) : "—"}</td>
                              <td className="px-5 py-3.5 text-muted-foreground">{d.avgPricePerSqm > 0 ? formatCurrency(d.avgPricePerSqm) : "—"}</td>
                              <td className="px-5 py-3.5 font-bold text-[13px]" style={{ color: diffColor }}>
                                {diff === null ? "—" : diff > 0 ? `+${diff}%` : `${diff}%`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {byDistrict.length > 0 && (
                  <div className="text-[11px] text-muted-foreground px-1">
                    * عمود "فرق عن السوق" يقارن سعر المتر للحي بمتوسط سعر المتر العام في الفلاتر الحالية
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION C — مؤشرات السوق
        ══════════════════════════════════════════════════════════════ */}
        {section === "C" && (
          <div className="space-y-5">
            {!hasData && !loadingInsights ? (
              <EmptyState text="لا توجد بيانات كافية لحساب المؤشرات. أضف إعلانات لتفعيل هذا القسم." />
            ) : (
              <>
                <div>
                  <div className="text-base font-bold text-foreground mb-1">مؤشرات السوق العقاري</div>
                  <div className="text-[12px] text-muted-foreground">جميع المؤشرات مبنية حصراً على بيانات الإعلانات المنشورة داخل المنصة</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <IndicatorCard
                    title="مؤشر القيمة العادلة"
                    value={fairLabel}
                    status={fairLabel}
                    statusColor={fairColor}
                    statusBg={fairBg}
                    detail={`نسبة الوسيط السعري إلى متوسط السوق: ${Math.round(fairRatio * 100)}%. القيم بين 88–112% تعتبر ضمن النطاق الطبيعي.`}
                    icon={Scale}
                    loading={loadingInsights}
                  />
                  <IndicatorCard
                    title="مؤشر فرصة الاستثمار"
                    value={cheapDistricts.length > 0 ? `${cheapDistricts.length} حي` : "—"}
                    status={investLabel}
                    statusColor={investColor}
                    statusBg={investBg}
                    detail={cheapDistricts.length > 0
                      ? `أحياء بأسعار أقل من متوسط السوق: ${cheapDistricts.slice(0, 3).map(d => d.district).join("، ")}`
                      : "لم تُرصد أحياء بفجوة سعرية واضحة عن المتوسط العام."}
                    icon={Lightbulb}
                    loading={loadingInsights}
                  />
                  <IndicatorCard
                    title="مؤشر قوة الطلب"
                    value={demandLabel}
                    status={demandLabel}
                    statusColor={demandColor}
                    statusBg={demandBg}
                    detail={`إضافات الأسبوع الحالي: ${new7} إعلان. المعدل الأسبوعي للشهر الماضي: ${Math.round(weeklyRate)} إعلان. البيانات تعتمد على نشاط الإضافات الداخلي للمنصة.`}
                    icon={Activity}
                    loading={loadingInsights}
                  />
                  <IndicatorCard
                    title="مؤشر العرض"
                    value={supplyLabel}
                    status={supplyLabel}
                    statusColor={supplyColor}
                    statusBg={supplyBg}
                    detail={`${new30} إعلان في آخر 30 يوماً — ${new7} في آخر 7 أيام. الاتجاه مستنتج من معدل الإضافات فقط.`}
                    icon={Building2}
                    loading={loadingInsights}
                  />
                  <IndicatorCard
                    title="مؤشر المخاطرة"
                    value={riskLabel}
                    status={riskLabel}
                    statusColor={riskColor}
                    statusBg={riskBg}
                    detail={`معامل التذبذب السعري: ${volatility}% (IQR ÷ وسيط). أقل من 20% = منخفض. 20–40% = متوسط. أعلى من 40% = مرتفع.`}
                    icon={AlertTriangle}
                    loading={loadingInsights}
                  />
                  <IndicatorCard
                    title="اتجاه السوق العام"
                    value={trendLen >= 2 ? marketDirLabel : "بيانات غير كافية"}
                    status={trendLen >= 2 ? marketDirLabel : "يحتاج حذر"}
                    statusColor={trendLen >= 2 ? marketDirColor : "#64748B"}
                    statusBg={trendLen >= 2 ? marketDirBg : "rgba(100,116,139,0.1)"}
                    detail={trendLen >= 2
                      ? `معدل التغيير: ${priceChange > 0 ? "+" : ""}${priceChange}% من أول نقطة تاريخية إلى آخرها. مبني على بيانات الإعلانات فقط.`
                      : "البيانات التاريخية غير كافية لحساب اتجاه السوق. ستظهر النتيجة مع تراكم الإعلانات عبر الوقت."}
                    icon={marketDirIcon}
                    loading={loadingTrends}
                  />
                </div>
                <div className="flex items-start gap-2 bg-muted/40 rounded-xl px-4 py-3 text-[12px] text-muted-foreground">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                  <span>جميع هذه المؤشرات مستخرجة حصرياً من قاعدة بيانات المنصة الداخلية — لا يُستخدم أي مصدر خارجي أو افتراض لا تدعمه البيانات الفعلية.</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION D — الفرص والتوصيات الذكية
        ══════════════════════════════════════════════════════════════ */}
        {section === "D" && (
          <div className="space-y-5">
            {!hasData && !loadingInsights ? (
              <EmptyState text="لا توجد بيانات كافية. أضف إعلانات لتفعيل الفرص والتوصيات." />
            ) : (
              <>
                {/* Role selector card */}
                <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm">
                  <div className="flex items-center gap-2 p-5 pb-4">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-foreground">الفرص والتوصيات الذكية</div>
                      <div className="text-[11px] text-muted-foreground">مبنية حصرياً على بيانات إعلانات المنصة — اختر شخصيتك</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 border-t border-border/60">
                    {([
                      { id: "buyer",    label: "عميل",        sub: "شراء / إيجار",        Icon: Home,      color: "#0F7BA0" },
                      { id: "marketer", label: "مسوّق",        sub: "تسويق عقاري",         Icon: UserCheck, color: "#7C3AED" },
                      { id: "provider", label: "مزود خدمة",   sub: "بناء وتشطيب وصيانة", Icon: Wrench,    color: "#D97706" },
                    ] as const).map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setUserRole(r.id)}
                        className={`flex flex-col items-center gap-1 py-4 px-2 text-center transition-all border-r last:border-r-0 border-border/60 relative ${
                          userRole === r.id ? "bg-muted/40" : "hover:bg-muted/20"
                        }`}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center mb-0.5 transition-all"
                          style={userRole === r.id ? { background: `${r.color}18`, border: `1.5px solid ${r.color}40` } : { background: "transparent" }}
                        >
                          <r.Icon className="w-4.5 h-4.5" style={{ color: userRole === r.id ? r.color : "#94A3B8" }} />
                        </div>
                        <div className="text-[13px] font-bold text-foreground">{r.label}</div>
                        <div className="text-[10px] text-muted-foreground leading-tight">{r.sub}</div>
                        {userRole === r.id && (
                          <div className="absolute bottom-0 inset-x-0 h-0.5 rounded-full" style={{ background: r.color }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── BUYER INSIGHTS ──────────────────────────────────── */}
                {userRole === "buyer" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* B1: Timing */}
                      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <Zap className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-sm font-bold text-foreground">توقيت الشراء الآن</span>
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
                            style={{ background: `${buyTimingColor}18`, color: buyTimingColor }}>
                            {buyTimingStatus}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{buyTimingDesc}</p>
                        {trendLen >= 2 && (
                          <div className="mt-3 flex items-center gap-2 pt-3 border-t border-border/50 text-[12px]">
                            <span className="text-muted-foreground">تغير أسعار السوق:</span>
                            <span className="font-extrabold" style={{ color: priceChange < 0 ? "#22C55E" : priceChange > 5 ? "#EF4444" : "#0F7BA0" }}>
                              {priceChange > 0 ? "+" : ""}{priceChange}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* B2: Best value areas */}
                      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-sm font-bold text-foreground">أذكى الأحياء سعراً</span>
                        </div>
                        {topCheapDistricts4.length === 0 ? (
                          <p className="text-sm text-muted-foreground">لا توجد بيانات أحياء كافية بعد</p>
                        ) : (
                          <div className="space-y-2.5">
                            {topCheapDistricts4.map((d, i) => {
                              const savings = avgSqm > 0 ? Math.round((1 - d.avgPricePerSqm / avgSqm) * 100) : 0;
                              return (
                                <div key={i} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-green-500/10 text-green-600 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                                    <span className="text-sm font-medium text-foreground">{d.district}</span>
                                    <span className="text-[11px] text-muted-foreground">{d.city}</span>
                                  </div>
                                  {savings > 0 && (
                                    <span className="text-[11px] font-bold bg-green-500/8 text-green-600 px-2 py-0.5 rounded-full shrink-0">
                                      وفر {savings}%
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                            <div className="text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                              متوسط السوق: {formatCurrency(avgSqm)} / م²
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* B3: Available listings */}
                      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-4 h-4 text-primary" />
                          <span className="text-xs font-bold text-foreground">حجم الخيارات المتاحة</span>
                        </div>
                        <div className="text-2xl font-extrabold text-foreground mt-1">{formatNumber(tot)}</div>
                        <div className="text-[12px] text-muted-foreground">إعلان متاح حالياً</div>
                        <div className="mt-2 text-[12px]">
                          <span className="font-bold" style={{ color: new7 >= weeklyRate ? "#22C55E" : "#F59E0B" }}>
                            {new7} إعلان
                          </span>
                          <span className="text-muted-foreground"> أضيفت هذا الأسبوع</span>
                        </div>
                      </div>

                      {/* B4: Price range */}
                      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Scale className="w-4 h-4 text-primary" />
                          <span className="text-xs font-bold text-foreground">نطاق الأسعار</span>
                        </div>
                        {p25 > 0 ? (
                          <div className="space-y-1.5 mt-1">
                            <div className="flex justify-between text-[12px]">
                              <span className="text-green-600 font-semibold">الأفضل سعراً</span>
                              <span className="font-bold text-foreground">{formatCurrency(p25)}</span>
                            </div>
                            <div className="flex justify-between text-[12px]">
                              <span className="text-primary font-semibold">وسيط السوق</span>
                              <span className="font-bold text-foreground">{formatCurrency(medP)}</span>
                            </div>
                            <div className="flex justify-between text-[12px]">
                              <span className="text-amber-600 font-semibold">الفئة المرتفعة</span>
                              <span className="font-bold text-foreground">{formatCurrency(p75)}</span>
                            </div>
                          </div>
                        ) : <p className="text-sm text-muted-foreground mt-1">بيانات غير كافية</p>}
                      </div>

                      {/* B5: Most available types */}
                      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-bold text-foreground">أكثر الأنواع توفراً</span>
                        </div>
                        <div className="space-y-1.5 mt-1">
                          {hotPropertyTypes.slice(0, 3).map((t, i) => (
                            <div key={i} className="flex items-center justify-between text-[12px]">
                              <span className="text-foreground">{t.propertyType}</span>
                              <span className="font-bold text-muted-foreground">{t.percentage}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Buyer recommendation */}
                    <div className="rounded-2xl border p-5" style={{ background: "rgba(15,123,160,0.04)", borderColor: "rgba(15,123,160,0.2)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold text-foreground">توصية للعميل (مشتري / مستأجر)</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{loadingInsights || loadingTrends ? <Skeleton className="h-10 w-full" /> : buyerRecommendation}</p>
                    </div>
                  </div>
                )}

                {/* ── MARKETER INSIGHTS ───────────────────────────────── */}
                {userRole === "marketer" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* M1: Pricing advice */}
                      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(124,58,237,0.1)" }}>
                              <BarChart3 className="w-4 h-4" style={{ color: "#7C3AED" }} />
                            </div>
                            <span className="text-sm font-bold text-foreground">توصية التسعير</span>
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
                            style={{ background: `${pricingTipColor}18`, color: pricingTipColor }}>
                            {pricingTipBadge}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{pricingTip}</p>
                        {avgP > 0 && medP > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-2 pt-3 border-t border-border/50">
                            <div className="bg-muted/30 rounded-xl p-2.5 text-center">
                              <div className="text-[10px] text-muted-foreground mb-1">متوسط السوق</div>
                              <div className="text-[13px] font-bold text-foreground">{formatCurrency(avgP)}</div>
                            </div>
                            <div className="rounded-xl p-2.5 text-center" style={{ background: "rgba(124,58,237,0.08)" }}>
                              <div className="text-[10px] mb-1" style={{ color: "#7C3AED" }}>وسيط السوق</div>
                              <div className="text-[13px] font-bold text-foreground">{formatCurrency(medP)}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* M2: Listing momentum */}
                      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <Activity className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-sm font-bold text-foreground">حركة السوق الأسبوعية</span>
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
                            style={{ background: `${listingMomentumColor}18`, color: listingMomentumColor }}>
                            {listingMomentumLabel}
                          </span>
                        </div>
                        <div className="flex items-end gap-4 mb-3">
                          <div>
                            <div className="text-2xl font-extrabold text-foreground">{new7}</div>
                            <div className="text-[12px] text-muted-foreground">إعلان هذا الأسبوع</div>
                          </div>
                          <div className="text-[12px] text-muted-foreground pb-0.5">
                            مقابل معدل {Math.round(weeklyRate)} / أسبوع
                          </div>
                        </div>
                        <p className="text-[12px] text-muted-foreground leading-relaxed">{listingMomentumDesc}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* M3: Hot property types */}
                      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="w-4 h-4" style={{ color: "#7C3AED" }} />
                          <span className="text-sm font-bold text-foreground">أنواع العقارات الأعلى طلباً</span>
                        </div>
                        <div className="space-y-2.5">
                          {hotPropertyTypes.map((t, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
                                style={{ background: "rgba(124,58,237,0.1)", color: "#7C3AED" }}>{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-[13px] font-medium text-foreground truncate">{t.propertyType}</span>
                                  <span className="text-[12px] font-bold shrink-0 mr-2" style={{ color: "#7C3AED" }}>{t.percentage}%</span>
                                </div>
                                <div className="h-1 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${t.percentage}%`, background: "#7C3AED88" }} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* M4: Low supply = opportunity */}
                      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-bold text-foreground">مناطق شُح العرض — فرصة للمسوّق</span>
                        </div>
                        {lowSupplyCities.length === 0 ? (
                          <p className="text-sm text-muted-foreground">العرض موزع بشكل متوازن بين المناطق</p>
                        ) : (
                          <>
                            <p className="text-[12px] text-muted-foreground mb-3 leading-relaxed">
                              المناطق التالية لديها إعلانات أقل من المتوسط — منافسة أضعف وفرصة تسويقية أفضل:
                            </p>
                            <div className="space-y-2">
                              {lowSupplyCities.map((c, i) => (
                                <div key={i} className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-foreground">{c.city}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[12px] text-muted-foreground">{c.count} إعلان</span>
                                    <span className="text-[11px] font-bold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full">فرصة</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* M5: Competition in districts */}
                    {topActiveDistricts4.length > 0 && (
                      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Building2 className="w-4 h-4 text-primary" />
                          <span className="text-sm font-bold text-foreground">مستوى المنافسة في الأحياء</span>
                          <span className="text-[11px] text-muted-foreground mr-auto">عدد أعلى = منافسة أشد</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {topActiveDistricts4.map((d, i) => (
                            <div key={i} className="rounded-xl p-3 text-center border border-border/60"
                              style={{ background: i === 0 ? "rgba(124,58,237,0.06)" : "rgba(100,116,139,0.05)" }}>
                              <div className="text-xl font-extrabold text-foreground">{d.count}</div>
                              <div className="text-[12px] font-semibold text-foreground mt-0.5">{d.district}</div>
                              <div className="text-[10px] text-muted-foreground">{d.city}</div>
                              {i === 0 && <div className="text-[10px] font-bold mt-1" style={{ color: "#7C3AED" }}>الأعلى منافسة</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Marketer recommendation */}
                    <div className="rounded-2xl border p-5" style={{ background: "rgba(124,58,237,0.04)", borderColor: "rgba(124,58,237,0.2)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4" style={{ color: "#7C3AED" }} />
                        <span className="text-sm font-bold text-foreground">توصية للمسوّق العقاري</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{loadingInsights || loadingTrends ? <Skeleton className="h-10 w-full" /> : marketerRecommendation}</p>
                    </div>
                  </div>
                )}

                {/* ── SERVICE PROVIDER INSIGHTS ───────────────────────── */}
                {userRole === "provider" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* P1: Most active districts */}
                      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(217,119,6,0.1)" }}>
                            <MapPin className="w-4 h-4" style={{ color: "#D97706" }} />
                          </div>
                          <span className="text-sm font-bold text-foreground">أكثر الأحياء نشاطاً</span>
                        </div>
                        <p className="text-[12px] text-muted-foreground mb-3 leading-relaxed">النشاط العالي = طلب أعلى على خدمات التشطيب والصيانة والتجديد:</p>
                        <div className="space-y-2.5">
                          {topActiveDistricts4.map((d, i) => {
                            const pct = byDistrict[0]?.count > 0 ? Math.round((d.count / byDistrict[0].count) * 100) : 0;
                            return (
                              <div key={i} className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0"
                                  style={{ background: "rgba(217,119,6,0.1)", color: "#D97706" }}>{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <div>
                                      <span className="text-[13px] font-medium text-foreground">{d.district}</span>
                                      <span className="text-[11px] text-muted-foreground mr-1">{d.city}</span>
                                    </div>
                                    <span className="text-[12px] font-bold shrink-0" style={{ color: "#D97706" }}>{d.count}</span>
                                  </div>
                                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#D97706AA" }} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* P2: Growth signal */}
                      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(217,119,6,0.1)" }}>
                              <TrendingUp className="w-4 h-4" style={{ color: "#D97706" }} />
                            </div>
                            <span className="text-sm font-bold text-foreground">مؤشر نمو السوق</span>
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
                            style={{ background: `${growthColor}18`, color: growthColor }}>
                            {growthSignal}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-muted/30 rounded-xl p-3 text-center">
                            <div className="text-xl font-extrabold text-foreground">{new7}</div>
                            <div className="text-[11px] text-muted-foreground">إعلان هذا الأسبوع</div>
                          </div>
                          <div className="bg-muted/30 rounded-xl p-3 text-center">
                            <div className="text-xl font-extrabold text-foreground">{new30}</div>
                            <div className="text-[11px] text-muted-foreground">إعلان هذا الشهر</div>
                          </div>
                        </div>
                        <p className="text-[12px] text-muted-foreground leading-relaxed">{providerGrowthDesc}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* P3: High value property types */}
                      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-bold text-foreground">الأنواع الأعلى قيمة</span>
                        </div>
                        <p className="text-[12px] text-muted-foreground mb-3">العقارات الأعلى سعراً تتطلب خدمات أرقى بميزانيات أكبر:</p>
                        {highValueTypes.length === 0 ? (
                          <p className="text-sm text-muted-foreground">بيانات غير كافية</p>
                        ) : (
                          <div className="space-y-2.5">
                            {highValueTypes.map((t, i) => (
                              <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                                  <span className="text-sm font-medium text-foreground">{t.propertyType}</span>
                                </div>
                                <span className="text-[12px] font-bold text-amber-600">{formatCurrency(t.avgPricePerSqm)} / م²</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* P4: Deal type distribution */}
                      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="w-4 h-4" style={{ color: "#D97706" }} />
                          <span className="text-sm font-bold text-foreground">توزيع نوع الصفقة</span>
                        </div>
                        <p className="text-[12px] text-muted-foreground mb-3">صفقات البيع والتجديد تستهدف خدماتك أكثر من الإيجار:</p>
                        {(insights?.byListingType?.length ?? 0) > 0 ? (
                          <div className="space-y-2">
                            {insights!.byListingType.slice(0, 5).map((t, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-[13px] text-foreground truncate">{t.label || t.listingType}</span>
                                    <span className="text-[12px] font-bold text-foreground shrink-0 mr-2">{t.count}</span>
                                  </div>
                                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${t.percentage}%`, background: "#D97706AA" }} />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">بيانات غير متوفرة</p>
                        )}
                      </div>
                    </div>

                    {/* Provider recommendation */}
                    <div className="rounded-2xl border p-5" style={{ background: "rgba(217,119,6,0.04)", borderColor: "rgba(217,119,6,0.25)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-bold text-foreground">توصية لعارض الخدمات</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{loadingInsights || loadingTrends ? <Skeleton className="h-10 w-full" /> : providerRecommendation}</p>
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="flex items-start gap-2 bg-muted/30 rounded-xl px-4 py-3 text-[11px] text-muted-foreground">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                  <span>جميع الفرص والتوصيات مستنتجة حصرياً من بيانات إعلانات المنصة الداخلية — لا تعكس مصادر خارجية وليست استشارة مالية أو استثمارية.</span>
                </div>
              </>
            )}
          </div>
        )}

      </motion.div>
    </Layout>
  );
}
