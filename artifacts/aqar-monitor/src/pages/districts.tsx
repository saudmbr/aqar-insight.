import { useState, useEffect, useRef, useMemo } from "react";
import { Layout } from "@/components/layout/layout";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { SAR } from "@/components/sar-amount";
import { LISTING_TYPE_GROUPS } from "@/lib/listing-types";
import { SAUDI_REGIONS_LIST } from "@/lib/saudi-geo";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
  Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  MapPin, BarChart3, TrendingUp, TrendingDown, X, Info,
  GitCompareArrows, Search, Sparkles, Trophy, Zap, AlertCircle,
  ChevronDown, ChevronUp, Star,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const BASE = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

// ── Types ─────────────────────────────────────────────────────────────────────
type DistrictMapData = {
  district: string; city: string; count: number;
  avgPrice: number; avgPricePerSqm: number;
  lat: number | null; lng: number | null;
};
type InsightsDistrict = {
  district: string; city: string; count: number;
  avgPrice: number; avgPricePerSqm: number;
};
type FilterOptions = { cities: string[]; propertyTypes: string[] };

// ── Smart label logic ─────────────────────────────────────────────────────────
type DistrictLabel = "فرصة" | "متوازن" | "مرتفع";
function getDistrictLabel(psm: number, avgPsm: number): DistrictLabel {
  if (!avgPsm || !psm) return "متوازن";
  const ratio = psm / avgPsm;
  if (ratio < 0.90)  return "فرصة";
  if (ratio <= 1.10) return "متوازن";
  return "مرتفع";
}
const LABEL_CONFIG: Record<DistrictLabel, { dot: string; bg: string; text: string; border: string }> = {
  "فرصة":   { dot: "#22C55E", bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
  "متوازن": { dot: "#F59E0B", bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  "مرتفع":  { dot: "#EF4444", bg: "#FFF1F2", text: "#BE123C", border: "#FECDD3" },
};
function LabelBadge({ label, small }: { label: DistrictLabel; small?: boolean }) {
  const cfg = LABEL_CONFIG[label];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold ${small ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"}`}
      style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
      {label}
    </span>
  );
}

// ── Color helpers ─────────────────────────────────────────────────────────────
const BAR_COLORS = [
  "#0F7BA0", "#16A34A", "#8B5CF6", "#EA580C", "#0891B2",
  "#CA8A04", "#DC2626", "#EC4899", "#14B8A6", "#6366F1",
  "#F97316", "#84CC16", "#A855F7", "#22D3EE", "#FB923C",
];
const HEAT_STEPS = [
  { max: 0.20, color: "#22C55E", label: "أسعار منخفضة" },
  { max: 0.40, color: "#A3E635", label: "أقل من المتوسط" },
  { max: 0.60, color: "#EAB308", label: "متوسطة" },
  { max: 0.80, color: "#F97316", label: "مرتفعة" },
  { max: 1.01, color: "#EF4444", label: "مرتفعة جداً" },
];
function getHeatColor(ratio: number): string {
  for (const step of HEAT_STEPS) { if (ratio < step.max) return step.color; }
  return "#EF4444";
}

// ── Input class ───────────────────────────────────────────────────────────────
const INPUT_CLS =
  "w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#0F7BA0]/20 focus:border-[#0F7BA0] transition-all";

// ── Bar chart tooltip ──────────────────────────────────────────────────────────
function BarTooltip({ active, payload, label, avgPsm }: {
  active?: boolean; payload?: Array<{ value: number; payload: InsightsDistrict }>;
  label?: string; avgPsm: number;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]!.payload;
  const lbl = getDistrictLabel(d.avgPricePerSqm, avgPsm);
  const cfg = LABEL_CONFIG[lbl];
  return (
    <div className="bg-white border border-[#E2E8F0] shadow-2xl rounded-2xl p-4 text-sm min-w-[200px]" dir="rtl"
      style={{ boxShadow: "0 8px 32px rgba(11,22,40,0.12)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="font-black text-foreground text-base">{label}</div>
        <LabelBadge label={lbl} small />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between gap-6 items-center">
          <span className="text-muted-foreground text-xs">سعر المتر</span>
          <span className="font-black text-sm" style={{ color: "#0F7BA0" }}><SAR value={d.avgPricePerSqm} perSqm /></span>
        </div>
        <div className="flex justify-between gap-6 items-center">
          <span className="text-muted-foreground text-xs">متوسط السعر</span>
          <span className="font-bold text-foreground text-xs">{d.avgPrice > 0 ? <SAR value={d.avgPrice} /> : "—"}</span>
        </div>
        <div className="flex justify-between gap-6 items-center">
          <span className="text-muted-foreground text-xs">عدد الإعلانات</span>
          <span className="font-bold text-xs" style={{ color: "#0B1628" }}>{d.count} إعلان</span>
        </div>
      </div>
      {avgPsm > 0 && d.avgPricePerSqm > 0 && (
        <div className="mt-3 pt-2.5 border-t border-[#F1F5F9]">
          <div className="text-[11px] font-bold rounded-lg px-2.5 py-1.5 text-center" style={{ background: cfg.bg, color: cfg.text }}>
            {lbl === "فرصة"   && `أقل من السوق بـ ${Math.abs(Math.round(((d.avgPricePerSqm / avgPsm) - 1) * 100))}% — فرصة سعرية`}
            {lbl === "مرتفع"  && `أعلى من السوق بـ ${Math.round(((d.avgPricePerSqm / avgPsm) - 1) * 100)}% — مرتفع نسبياً`}
            {lbl === "متوازن" && "ضمن المدى السعري الطبيعي للسوق"}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Smart Best-District banner ─────────────────────────────────────────────────
function SmartBanner({ districts, avgPsm }: { districts: InsightsDistrict[]; avgPsm: number }) {
  const best = useMemo(() => {
    const qualified = districts.filter(d => d.avgPricePerSqm > 0 && d.count >= 2);
    if (!qualified.length) return null;
    // Score: lower price ratio is better, more listings = more confidence
    const avgCount = qualified.reduce((s, d) => s + d.count, 0) / qualified.length;
    return qualified.reduce((best, d) => {
      const priceScore = avgPsm > 0 ? 1 - (d.avgPricePerSqm / avgPsm) : 0;
      const activityScore = d.count / (avgCount * 2);
      const score = priceScore * 0.7 + activityScore * 0.3;
      const bPriceScore = avgPsm > 0 ? 1 - (best.avgPricePerSqm / avgPsm) : 0;
      const bActivityScore = best.count / (avgCount * 2);
      const bScore = bPriceScore * 0.7 + bActivityScore * 0.3;
      return score > bScore ? d : best;
    });
  }, [districts, avgPsm]);

  const mostActive = useMemo(() =>
    districts.length ? [...districts].sort((a, b) => b.count - a.count)[0] : null,
    [districts]
  );

  if (!best || !avgPsm) return null;

  const diff = Math.round(((best.avgPricePerSqm - avgPsm) / avgPsm) * 100);
  const label = getDistrictLabel(best.avgPricePerSqm, avgPsm);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Best opportunity */}
      <div className="relative rounded-2xl p-5 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0B1628 0%, #0F3A5C 50%, #0F7BA0 100%)", boxShadow: "0 4px 24px rgba(11,22,40,0.18)" }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(15,123,160,0.3) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
        <div className="relative z-10 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(15,123,160,0.35)", border: "1px solid rgba(15,123,160,0.4)" }}>
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-white/60 text-[11px] font-bold uppercase tracking-wider mb-1">أفضل حي حالياً</div>
            <div className="text-white font-black text-[17px] leading-tight">{best.district}</div>
            <div className="text-white/70 text-[12px] mt-1 leading-relaxed">
              {label === "فرصة"
                ? `سعر أقل من السوق بـ ${Math.abs(diff)}% مع نشاط ${best.count >= (mostActive?.count ?? 0) * 0.7 ? "مرتفع" : "معقول"}`
                : `ضمن المدى السعري الطبيعي — ${best.count} إعلان نشط`
              }
            </div>
            <div className="mt-2.5">
              <LabelBadge label={label} />
            </div>
          </div>
        </div>
      </div>

      {/* Most active */}
      {mostActive && (
        <div className="relative rounded-2xl p-5 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #064E3B 0%, #065F46 50%, #059669 100%)", boxShadow: "0 4px 24px rgba(6,78,59,0.2)" }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(5,150,105,0.3) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
          <div className="relative z-10 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(5,150,105,0.35)", border: "1px solid rgba(5,150,105,0.4)" }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-white/60 text-[11px] font-bold uppercase tracking-wider mb-1">الأكثر نشاطاً</div>
              <div className="text-white font-black text-[17px] leading-tight">{mostActive.district}</div>
              <div className="text-white/70 text-[12px] mt-1">
                {mostActive.count} إعلان نشط — أعلى حركة في السوق
              </div>
              <div className="mt-2.5">
                <LabelBadge label={getDistrictLabel(mostActive.avgPricePerSqm, avgPsm)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Smart Insights bar ─────────────────────────────────────────────────────────
function SmartInsights({ districts, avgPsm }: { districts: InsightsDistrict[]; avgPsm: number }) {
  const insights = useMemo(() => {
    if (!districts.length || !avgPsm) return [];
    const sorted = [...districts].filter(d => d.avgPricePerSqm > 0);
    const cheapest = [...sorted].sort((a, b) => a.avgPricePerSqm - b.avgPricePerSqm)[0];
    const busiest  = [...sorted].sort((a, b) => b.count - a.count)[0];
    const result: { icon: React.ReactNode; text: string; color: string; bg: string }[] = [];
    if (cheapest) {
      const diff = Math.round(((cheapest.avgPricePerSqm - avgPsm) / avgPsm) * 100);
      if (diff < -5) result.push({
        icon: <TrendingDown className="w-3.5 h-3.5" />,
        text: `${cheapest.district} يسجّل أدنى سعر للمتر (${formatCurrency(cheapest.avgPricePerSqm)}) — أقل من المتوسط بـ ${Math.abs(diff)}%`,
        color: "#15803D", bg: "#F0FDF4",
      });
    }
    if (busiest) result.push({
      icon: <BarChart3 className="w-3.5 h-3.5" />,
      text: `${busiest.district} هو الأكثر نشاطاً بـ ${busiest.count} إعلان نشط حالياً`,
      color: "#0F7BA0", bg: "#F0F9FF",
    });
    if (sorted.length >= 3) {
      const top3Avg = sorted.slice(0, 3).reduce((s, d) => s + d.avgPricePerSqm, 0) / 3;
      const diff = Math.round(((top3Avg - avgPsm) / avgPsm) * 100);
      if (Math.abs(diff) > 5) result.push({
        icon: <Info className="w-3.5 h-3.5" />,
        text: `متوسط أسعار أعلى ٣ أحياء ${diff > 0 ? "أعلى" : "أقل"} من وسط السوق بـ ${Math.abs(diff)}%`,
        color: "#B45309", bg: "#FFFBEB",
      });
    }
    return result.slice(0, 3);
  }, [districts, avgPsm]);

  if (!insights.length) return null;
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {insights.map((ins, i) => (
        <div key={i} className="flex items-start gap-2.5 flex-1 rounded-2xl px-4 py-3 border"
          style={{ background: ins.bg, borderColor: ins.color + "33", color: ins.color }}>
          <span className="mt-0.5 shrink-0">{ins.icon}</span>
          <span className="text-[12px] font-semibold leading-relaxed">{ins.text}</span>
        </div>
      ))}
    </div>
  );
}

// ── Heatmap Map ───────────────────────────────────────────────────────────────
function DistrictHeatMap({ districts, overallAvgPsm }: { districts: DistrictMapData[]; overallAvgPsm: number }) {
  const mapRef     = useRef<HTMLDivElement>(null);
  const mapInstRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const [selected, setSelected] = useState<DistrictMapData | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstRef.current) return;
    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false, center: [24.7136, 46.6753], zoom: 10 });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
    L.control.zoom({ position: "bottomleft" }).addTo(map);
    mapInstRef.current = map;
    return () => { mapInstRef.current?.remove(); mapInstRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapInstRef.current;
    if (!map) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    const withCoords = districts.filter(d => d.lat && d.lng && d.avgPricePerSqm > 0);
    if (!withCoords.length) return;
    const prices = withCoords.map(d => d.avgPricePerSqm);
    const minP = Math.min(...prices), maxP = Math.max(...prices);
    withCoords.forEach(d => {
      const ratio  = maxP > minP ? (d.avgPricePerSqm - minP) / (maxP - minP) : 0.5;
      const color  = getHeatColor(ratio);
      const radius = Math.max(16, Math.min(44, 16 + d.count * 4));
      const lbl    = getDistrictLabel(d.avgPricePerSqm, overallAvgPsm);
      const cfg    = LABEL_CONFIG[lbl];
      const circle = L.circleMarker([d.lat!, d.lng!], {
        radius, fillColor: color, fillOpacity: 0.82,
        color: "rgba(255,255,255,0.95)", weight: 2.5, interactive: true,
      });
      circle.bindTooltip(
        `<div dir="rtl" style="font-family:Cairo,sans-serif;min-width:170px;padding:4px 2px">
          <div style="font-weight:900;font-size:13px;color:#0F1C3F;margin-bottom:4px">${d.district}</div>
          <div style="font-size:11px;color:#64748B">${formatCurrency(d.avgPricePerSqm)} / م² • ${d.count} إعلان</div>
          <div style="margin-top:6px;display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:${cfg.bg};color:${cfg.text};border:1px solid ${cfg.border}">
            <span style="width:6px;height:6px;border-radius:50%;background:${cfg.dot};display:inline-block"></span>
            ${lbl}
          </div>
        </div>`,
        { direction: "top", offset: L.point(0, -(radius + 4)), className: "premium-tooltip" },
      );
      circle.on("click", () => setSelected(d));
      circle.addTo(map);
      markersRef.current.push(circle);
    });
    try {
      const g = L.featureGroup(markersRef.current);
      map.fitBounds(g.getBounds(), { padding: [50, 50], maxZoom: 13 });
    } catch (_) { /* no-op */ }
  }, [districts, overallAvgPsm]);

  const withCoords  = districts.filter(d => d.lat && d.lng);
  const priceDiff   = selected && overallAvgPsm > 0 && selected.avgPricePerSqm > 0
    ? Math.round(((selected.avgPricePerSqm - overallAvgPsm) / overallAvgPsm) * 100)
    : null;
  const selLabel = selected ? getDistrictLabel(selected.avgPricePerSqm, overallAvgPsm) : null;

  const popupInsight = (() => {
    if (!selected || priceDiff === null) return "لا توجد بيانات كافية للمقارنة";
    if (priceDiff < -10) return `فرصة سعرية — أقل من السوق بـ ${Math.abs(priceDiff)}%`;
    if (priceDiff > 15)  return `أعلى من السوق بـ ${priceDiff}% — يحتاج دراسة متأنية`;
    return "ضمن النطاق السعري الطبيعي للسوق";
  })();

  return (
    <div className="space-y-4">
      <div className="relative">
        <div ref={mapRef} className="w-full h-[460px] rounded-2xl overflow-hidden border border-[#E2E8F0]"
          style={{ boxShadow: "inset 0 0 0 1px rgba(15,123,160,0.08)" }} />
        {withCoords.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/90 backdrop-blur-sm rounded-2xl">
            <MapPin className="w-10 h-10 text-muted-foreground opacity-20" />
            <p className="text-sm font-semibold text-muted-foreground text-center max-w-xs leading-relaxed">
              الخريطة الحرارية تحتاج إحداثيات جغرافية في الإعلانات
              <span className="block text-xs opacity-65 mt-1">تُفعَّل تلقائياً عند إضافة إعلانات بموقع محدد</span>
            </p>
          </div>
        )}
      </div>

      {/* Map popup card */}
      <AnimatePresence>
        {selected && selLabel && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="bg-white rounded-2xl border p-5 shadow-lg" dir="rtl"
            style={{ borderColor: "#E2E8F0", boxShadow: "0 4px 24px rgba(11,22,40,0.1)" }}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(15,123,160,0.08)" }}>
                  <MapPin className="w-4 h-4" style={{ color: "#0F7BA0" }} />
                </div>
                <div>
                  <div className="text-lg font-black text-foreground leading-tight">{selected.district}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{selected.city}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <LabelBadge label={selLabel} />
                <button onClick={() => setSelected(null)}
                  className="text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-[#F8FAFC] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: "متوسط السعر",    val: <SAR value={selected.avgPrice} />,             accent: true },
                { label: "سعر المتر",       val: <><SAR value={selected.avgPricePerSqm} /> / م²</>, accent: false },
                { label: "الإعلانات",       val: `${selected.count} إعلان`,              accent: false },
                {
                  label: "مقارنة بالسوق",
                  val: priceDiff !== null ? `${priceDiff > 0 ? "+" : ""}${priceDiff}%` : "—",
                  accent: false,
                  color: priceDiff === null ? undefined : priceDiff > 0 ? "#EF4444" : "#22C55E",
                },
              ].map(({ label, val, accent, color }) => (
                <div key={label} className="rounded-xl p-3 text-center" style={{ background: accent ? "#F0F9FF" : "#F8FAFC" }}>
                  <div className="text-[10px] text-muted-foreground mb-1 font-semibold">{label}</div>
                  <div className="font-black text-sm" style={{ color: color ?? (accent ? "#0F7BA0" : "#0B1628") }}>{val}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-xl px-4 py-3"
              style={{ background: LABEL_CONFIG[selLabel].bg, border: `1px solid ${LABEL_CONFIG[selLabel].border}` }}>
              <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: LABEL_CONFIG[selLabel].text }} />
              <span className="text-[12px] font-bold" style={{ color: LABEL_CONFIG[selLabel].text }}>{popupInsight}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── District Comparison ────────────────────────────────────────────────────────
function DistrictComparison({ districts, avgPsm }: { districts: InsightsDistrict[]; avgPsm: number }) {
  const [distA, setDistA] = useState("");
  const [distB, setDistB] = useState("");
  const [search, setSearch] = useState("");

  const districtNames = useMemo(() =>
    districts.map(d => d.district).sort((a, b) => a.localeCompare(b, "ar")),
    [districts]
  );
  const filtered = useMemo(() =>
    districtNames.filter(n => !search || n.includes(search)),
    [districtNames, search]
  );

  const dA = districts.find(d => d.district === distA) ?? null;
  const dB = districts.find(d => d.district === distB) ?? null;

  const diff = (val: number, ref: number) =>
    ref > 0 && val > 0 ? Math.round(((val - ref) / ref) * 100) : null;

  const metrics = (d: InsightsDistrict | null) => ({
    avgPrice:      d?.avgPrice ?? 0,
    avgPricePerSqm: d?.avgPricePerSqm ?? 0,
    count:         d?.count ?? 0,
    vsMarketPsm:   d ? diff(d.avgPricePerSqm, avgPsm) : null,
  });
  const mA = metrics(dA), mB = metrics(dB);

  // ── Smart verdict ─────────────────────────────────────────────────────────
  const verdict = useMemo(() => {
    if (!dA || !dB || !avgPsm) return null;
    const scoreA = (avgPsm > 0 ? (1 - dA.avgPricePerSqm / avgPsm) : 0) * 0.6 + (dA.count / Math.max(dA.count, dB.count)) * 0.4;
    const scoreB = (avgPsm > 0 ? (1 - dB.avgPricePerSqm / avgPsm) : 0) * 0.6 + (dB.count / Math.max(dA.count, dB.count)) * 0.4;
    if (Math.abs(scoreA - scoreB) < 0.05) return { winner: null, text: "الحيّان متقاربان — لا توجد أفضلية واضحة في الوقت الحالي" };
    const winner = scoreA > scoreB ? dA : dB;
    const loser  = scoreA > scoreB ? dB : dA;
    const reasons: string[] = [];
    if (winner.avgPricePerSqm < loser.avgPricePerSqm)
      reasons.push(`سعر أقل بـ ${Math.round(((loser.avgPricePerSqm - winner.avgPricePerSqm) / loser.avgPricePerSqm) * 100)}%`);
    if (winner.count > loser.count)
      reasons.push(`نشاط أعلى (${winner.count} مقابل ${loser.count} إعلان)`);
    return {
      winner: winner.district,
      text: `${winner.district} أفضل للشراء حالياً — ${reasons.join(" و")}`,
    };
  }, [dA, dB, avgPsm]);

  const ROWS: { label: string; key: keyof ReturnType<typeof metrics>; format: (v: number | null) => string }[] = [
    { label: "متوسط السعر",        key: "avgPrice",       format: v => v && v > 0 ? formatCurrency(v) : "—" },
    { label: "سعر المتر",          key: "avgPricePerSqm", format: v => v && v > 0 ? `${formatCurrency(v)} / م²` : "—" },
    { label: "عدد الإعلانات",      key: "count",          format: v => v ? `${v} إعلان` : "—" },
    { label: "مقارنة بمتوسط السوق", key: "vsMarketPsm",   format: v => v !== null && v !== undefined ? `${v > 0 ? "+" : ""}${v}%` : "—" },
  ];

  const hasSelection = distA && distB;

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-6"
      style={{ boxShadow: "0 2px 16px rgba(11,22,40,0.06)" }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(15,123,160,0.08)" }}>
          <GitCompareArrows className="w-4.5 h-4.5" style={{ color: "#0F7BA0" }} />
        </div>
        <div>
          <div className="text-base font-black text-foreground">مقارنة بين حيّين</div>
          <div className="text-[12px] text-muted-foreground">اختر حيّين لعرض مقارنة تفصيلية مع حكم ذكي</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: "الحي الأول", val: distA, set: setDistA, other: distB, color: "#0F7BA0", colorBg: "#F0F9FF" },
          { label: "الحي الثاني", val: distB, set: setDistB, other: distA, color: "#8B5CF6", colorBg: "#F5F3FF" },
        ].map(({ label, val, set, other, color, colorBg }) => (
          <div key={label} className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest"
              style={{ color }}>{label}</label>
            <div className="relative">
              <select
                value={val}
                onChange={e => set(e.target.value)}
                className="w-full h-11 rounded-xl border px-3 pr-4 text-sm font-semibold text-foreground outline-none transition-all appearance-none"
                style={{ background: val ? colorBg : "#F8FAFC", borderColor: val ? color : "#E2E8F0", color: "#111827" }}
              >
                <option value="" style={{ color: "#111827", background: "#fff" }}>اختر الحي…</option>
                {filtered.filter(n => n !== other).map(n => (
                  <option key={n} value={n} style={{ color: "#111827", background: "#fff" }}>{n}</option>
                ))}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>

      {districts.length > 8 && (
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث في الأحياء…"
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F7BA0]/20 focus:border-[#0F7BA0] transition-all"
          />
        </div>
      )}

      {/* ── Verdict banner ── */}
      <AnimatePresence>
        {verdict && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="rounded-2xl px-5 py-4 flex items-start gap-3"
              style={{
                background: verdict.winner ? "linear-gradient(135deg, #F0FDF4, #ECFDF5)" : "#F8FAFC",
                border: `1.5px solid ${verdict.winner ? "#86EFAC" : "#E2E8F0"}`,
              }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: verdict.winner ? "#22C55E" : "#94A3B8" }}>
                {verdict.winner ? <Star className="w-4 h-4 text-white" /> : <Info className="w-4 h-4 text-white" />}
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider mb-0.5"
                  style={{ color: verdict.winner ? "#15803D" : "#64748B" }}>
                  {verdict.winner ? "الحكم الذكي" : "النتيجة"}
                </div>
                <div className="text-sm font-bold leading-relaxed"
                  style={{ color: verdict.winner ? "#14532D" : "#475569" }}>
                  {verdict.text}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Comparison table ── */}
      {hasSelection ? (
        <div className="overflow-hidden rounded-2xl border border-[#E2E8F0]">
          <table className="w-full text-sm text-right">
            <thead style={{ background: "#F8FAFC" }} className="border-b border-[#E2E8F0]">
              <tr>
                <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground tracking-wide">المؤشر</th>
                <th className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-black"
                    style={{ background: "#F0F9FF", color: "#0F7BA0", border: "1px solid #BAE6FD" }}>{distA}</span>
                </th>
                <th className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-black"
                    style={{ background: "#F5F3FF", color: "#7C3AED", border: "1px solid #DDD6FE" }}>{distB}</span>
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-bold text-muted-foreground tracking-wide">الفرق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {ROWS.map(row => {
                const vA = mA[row.key] as number | null;
                const vB = mB[row.key] as number | null;
                const delta = typeof vA === "number" && typeof vB === "number" && vA > 0 && vB > 0
                  ? Math.round(((vA - vB) / vB) * 100) : null;
                const winner = delta !== null ? (delta > 0 ? "A" : delta < 0 ? "B" : "tie") : null;
                return (
                  <tr key={row.label} className="hover:bg-[#FAFBFF] transition-colors">
                    <td className="px-4 py-4 font-semibold text-foreground text-[13px]">{row.label}</td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-black text-sm" style={{ color: winner === "A" ? "#0F7BA0" : "#0B1628" }}>
                          {row.format(vA)}
                        </span>
                        {winner === "A" && row.key !== "count" && row.key !== "vsMarketPsm" && (
                          <span className="text-[10px] font-black rounded-lg px-2 py-0.5"
                            style={{ background: "#F0F9FF", color: "#0F7BA0" }}>الأفضل</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-black text-sm" style={{ color: winner === "B" ? "#7C3AED" : "#0B1628" }}>
                          {row.format(vB)}
                        </span>
                        {winner === "B" && row.key !== "count" && row.key !== "vsMarketPsm" && (
                          <span className="text-[10px] font-black rounded-lg px-2 py-0.5"
                            style={{ background: "#F5F3FF", color: "#7C3AED" }}>الأفضل</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {delta !== null && row.key !== "vsMarketPsm" ? (
                        <span className="inline-block text-[12px] font-black px-2.5 py-1 rounded-xl"
                          style={{
                            color: Math.abs(delta) < 5 ? "#64748B" : delta > 0 ? "#EF4444" : "#22C55E",
                            background: Math.abs(delta) < 5 ? "#F8FAFC" : delta > 0 ? "#FFF1F2" : "#F0FDF4",
                          }}>
                          {delta > 0 ? `+${delta}%` : `${delta}%`}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-[#E2E8F0] rounded-2xl gap-3">
          <GitCompareArrows className="w-9 h-9 opacity-15" style={{ color: "#0F7BA0" }} />
          <p className="text-sm font-semibold text-muted-foreground">اختر حيّين من القوائم أعلاه لبدء المقارنة</p>
        </div>
      )}

      {/* ── Mini summary cards ── */}
      {hasSelection && dA && dB && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { d: dA, color: "#0F7BA0", borderColor: "#BAE6FD", bg: "#F0F9FF", label: distA },
            { d: dB, color: "#7C3AED", borderColor: "#DDD6FE", bg: "#F5F3FF", label: distB },
          ].map(({ d, color, borderColor, bg, label }) => {
            const marketDiff = avgPsm > 0 && d.avgPricePerSqm > 0
              ? Math.round(((d.avgPricePerSqm - avgPsm) / avgPsm) * 100) : null;
            const lbl = getDistrictLabel(d.avgPricePerSqm, avgPsm);
            return (
              <div key={label} className="rounded-2xl p-4 space-y-3" style={{ background: bg, border: `1.5px solid ${borderColor}` }}>
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm" style={{ color }}>{label}</span>
                  <LabelBadge label={lbl} small />
                </div>
                <div>
                  <div className="text-2xl font-black text-foreground leading-none">
                    {d.avgPricePerSqm > 0 ? <SAR value={d.avgPricePerSqm} perSqm /> : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">ريال / م²</div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="bg-white/70 rounded-lg px-2 py-1 font-bold" style={{ color: "#0B1628" }}>{d.count} إعلان</span>
                  {marketDiff !== null && (
                    <span className="flex items-center gap-1 font-bold" style={{ color: marketDiff > 0 ? "#EF4444" : "#22C55E" }}>
                      {marketDiff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {marketDiff > 0 ? "+" : ""}{marketDiff}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Districts() {
  const [region,       setRegion]       = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [listingType,  setListingType]  = useState("");
  const [barSort,      setBarSort]      = useState<"price" | "count">("price");
  const [showAllLegend, setShowAllLegend] = useState(false);

  useEffect(() => {
    document.title = "مقارنة الأحياء – عقار إنسايت";
    return () => { document.title = "عقار إنسايت"; };
  }, []);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (region)       p.set("region", region);
    if (propertyType) p.set("propertyType", propertyType);
    if (listingType)  p.set("listingType", listingType);
    return p.toString();
  }, [region, propertyType, listingType]);

  const { data: filterOpts } = useQuery<FilterOptions>({
    queryKey: ["dist-filter-opts"],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/listings-filter-options`);
      if (!res.ok) throw new Error();
      return res.json() as Promise<FilterOptions>;
    },
    staleTime: 300_000,
  });

  const { data: insights, isLoading: loadingInsights } = useQuery<{ byDistrict: InsightsDistrict[]; kpis: { avgPricePerSqm: number } }>({
    queryKey: ["dist-insights", qs],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/listings-insights${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    staleTime: 60_000,
  });

  const { data: mapData, isLoading: loadingMap } = useQuery<DistrictMapData[]>({
    queryKey: ["dist-map", qs],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/listings-districts-map${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error();
      return res.json() as Promise<DistrictMapData[]>;
    },
    staleTime: 60_000,
  });

  const byDistrict = insights?.byDistrict ?? [];
  const avgPsm     = insights?.kpis?.avgPricePerSqm ?? 0;
  const hasData    = byDistrict.length > 0;

  const barData = useMemo(() => {
    return [...byDistrict]
      .filter(d => d.avgPricePerSqm > 0)
      .sort((a, b) => barSort === "price" ? b.avgPricePerSqm - a.avgPricePerSqm : b.count - a.count)
      .slice(0, 15);
  }, [byDistrict, barSort]);

  const tableData = useMemo(() =>
    [...byDistrict].sort((a, b) => b.avgPrice - a.avgPrice),
    [byDistrict]
  );

  const psmTick = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}م`;
    if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}ك`;
    return String(v);
  };

  const legendItems = showAllLegend ? barData : barData.slice(0, 8);

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-7 pb-16"
        dir="rtl"
      >
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div
          className="relative rounded-[28px] overflow-hidden p-8 md:p-10"
          style={{ background: "linear-gradient(140deg, #0B1628 0%, #0F1C3F 55%, #0F7BA0 100%)" }}
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.03 }} />
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 50% 80% at top right, rgba(201,168,76,0.08), transparent)" }} />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/90 px-3 py-1.5 rounded-full text-xs font-bold mb-4">
                <MapPin className="w-3.5 h-3.5" />
                مخطط الأحياء • مقارنة تفاعلية • خريطة حرارية
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">مقارنة الأحياء</h1>
              <p className="text-white/60 mt-2 text-sm max-w-xl">تصور تفاعلي لمستويات الأسعار والإعلانات — مبني على بيانات المنصة الداخلية</p>
            </div>
            {hasData && avgPsm > 0 && (
              <div className="flex gap-3 shrink-0">
                {([
                  { label: "فرصة",   count: byDistrict.filter(d => getDistrictLabel(d.avgPricePerSqm, avgPsm) === "فرصة").length   },
                  { label: "متوازن", count: byDistrict.filter(d => getDistrictLabel(d.avgPricePerSqm, avgPsm) === "متوازن").length },
                  { label: "مرتفع",  count: byDistrict.filter(d => getDistrictLabel(d.avgPricePerSqm, avgPsm) === "مرتفع").length  },
                ] as { label: DistrictLabel; count: number }[]).map(({ label, count }) => (
                  <div key={label} className="text-center px-4 py-2.5 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <div className="text-xl font-black text-white">{count}</div>
                    <div className="text-[11px] mt-0.5">
                      <LabelBadge label={label} small />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Filters ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4"
          style={{ boxShadow: "0 1px 8px rgba(11,22,40,0.05)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select value={region}       onChange={e => setRegion(e.target.value)}       className={INPUT_CLS} style={{ color: "#111827", background: "#fff" }}>
              <option value="" style={{ color: "#111827" }}>كل المناطق</option>
              {SAUDI_REGIONS_LIST.map(r => <option key={r} value={r} style={{ color: "#111827" }}>{r}</option>)}
            </select>
            <select value={propertyType} onChange={e => setPropertyType(e.target.value)} className={INPUT_CLS} style={{ color: "#111827", background: "#fff" }}>
              <option value="" style={{ color: "#111827" }}>كل أنواع العقارات</option>
              {(filterOpts?.propertyTypes ?? []).map(t => <option key={t} value={t} style={{ color: "#111827" }}>{t}</option>)}
            </select>
            <select value={listingType}  onChange={e => setListingType(e.target.value)}  className={INPUT_CLS} style={{ color: "#111827", background: "#fff" }}>
              <option value="" style={{ color: "#111827" }}>كل الصفقات</option>
              {LISTING_TYPE_GROUPS.map(g => (
                <optgroup key={g.label} label={`── ${g.label}`}>
                  {g.types.map(t => <option key={t.value} value={t.value} style={{ color: "#111827" }}>{t.label}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          {(region || propertyType || listingType) && (
            <button
              onClick={() => { setRegion(""); setPropertyType(""); setListingType(""); }}
              className="mt-3 text-xs font-semibold text-muted-foreground hover:text-red-500 border border-[#E2E8F0] hover:border-red-200 rounded-xl px-4 py-2 transition-all"
            >
              × مسح الفلاتر
            </button>
          )}
        </div>

        {/* ── Empty state ────────────────────────────────────────────────── */}
        {!loadingInsights && !hasData && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground bg-white rounded-2xl border-2 border-dashed border-[#E2E8F0]">
            <BarChart3 className="w-12 h-12 opacity-15" />
            <div className="text-center">
              <p className="text-sm font-bold text-foreground">لا توجد بيانات أحياء</p>
              <p className="text-xs text-muted-foreground mt-1">تأكد من أن الإعلانات تحتوي على اسم الحي، أو غيّر الفلاتر</p>
            </div>
          </div>
        )}

        {/* ── Smart banner & insights ─────────────────────────────────────── */}
        {!loadingInsights && hasData && avgPsm > 0 && (
          <div className="space-y-4">
            <SmartBanner  districts={byDistrict} avgPsm={avgPsm} />
            <SmartInsights districts={byDistrict} avgPsm={avgPsm} />
          </div>
        )}
        {loadingInsights && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        )}

        {/* ── Bar chart ──────────────────────────────────────────────────── */}
        {(loadingInsights || hasData) && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6"
            style={{ boxShadow: "0 2px 16px rgba(11,22,40,0.06)" }}>
            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
              <div>
                <div className="text-base font-black text-foreground">الأسعار والإعلانات لكل حي</div>
                <div className="text-[12px] text-muted-foreground mt-0.5">
                  كل عمود يمثل حياً — الارتفاع = سعر المتر — اللون يعكس ترتيب الحي
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-[#F8FAFC] rounded-xl p-1 border border-[#E2E8F0]">
                {[{ key: "price", label: "حسب السعر" }, { key: "count", label: "حسب الإعلانات" }].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setBarSort(opt.key as "price" | "count")}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                    style={{
                      background:  barSort === opt.key ? "#fff" : "transparent",
                      color:       barSort === opt.key ? "#0F7BA0" : "#64748B",
                      boxShadow:   barSort === opt.key ? "0 1px 4px rgba(11,22,40,0.08)" : "none",
                      border:      barSort === opt.key ? "1px solid #E2E8F0" : "1px solid transparent",
                    }}
                  >{opt.label}</button>
                ))}
              </div>
            </div>

            {loadingInsights ? (
              <Skeleton className="w-full h-[380px] rounded-2xl" />
            ) : barData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] gap-2 text-muted-foreground">
                <BarChart3 className="w-8 h-8 opacity-20" />
                <p className="text-sm">لا توجد بيانات كافية</p>
              </div>
            ) : (
              <div className="w-full" style={{ height: Math.max(320, barData.length * 46) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ top: 4, right: 90, left: 0, bottom: 4 }} barSize={24} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                    <YAxis
                      dataKey="district" type="category" width={95}
                      tick={{ fontFamily: "Cairo, sans-serif", fontSize: 12, fill: "#64748B", fontWeight: 600 }}
                      tickLine={false} axisLine={false}
                    />
                    <XAxis
                      type="number" tickFormatter={psmTick}
                      tick={{ fontFamily: "Cairo, sans-serif", fontSize: 11, fill: "#94A3B8" }}
                      tickLine={false} axisLine={false} domain={[0, "dataMax + 800"]}
                    />
                    {avgPsm > 0 && (
                      <ReferenceLine
                        x={avgPsm} stroke="#F59E0B" strokeDasharray="5 4" strokeWidth={2}
                        label={{ value: "متوسط السوق", position: "top", fontFamily: "Cairo, sans-serif", fontSize: 10, fill: "#B45309", fontWeight: 700 }}
                      />
                    )}
                    <RechartsTooltip
                      content={<BarTooltip avgPsm={avgPsm} />}
                      cursor={{ fill: "#F0F9FF", opacity: 0.7 }}
                    />
                    <Bar dataKey="avgPricePerSqm" radius={[0, 10, 10, 0]}>
                      {barData.map((entry, i) => (
                        <Cell key={entry.district} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Market avg indicator */}
            {avgPsm > 0 && !loadingInsights && (
              <div className="mt-5 flex items-center gap-2.5 text-xs bg-[#FFFBEB] rounded-xl px-4 py-2.5 border border-[#FDE68A] w-fit">
                <span className="w-5 h-0.5 bg-amber-400 shrink-0 rounded" style={{ borderTop: "2px dashed #F59E0B" }} />
                <span className="text-amber-700 font-semibold">متوسط سعر السوق:</span>
                <span className="font-black text-amber-800"><SAR value={avgPsm} perSqm /></span>
              </div>
            )}

            {/* Legend */}
            {!loadingInsights && barData.length > 0 && (
              <div className="mt-5 pt-5 border-t border-[#F1F5F9]">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">الأحياء في المخطط</div>
                  {barData.length > 8 && (
                    <button
                      onClick={() => setShowAllLegend(p => !p)}
                      className="flex items-center gap-1 text-[11px] font-semibold transition-colors"
                      style={{ color: "#0F7BA0" }}
                    >
                      {showAllLegend ? <><ChevronUp className="w-3 h-3" />إخفاء</> : <><ChevronDown className="w-3 h-3" />عرض الكل</>}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {legendItems.map((d, i) => {
                    const lbl = getDistrictLabel(d.avgPricePerSqm, avgPsm);
                    const cfg = LABEL_CONFIG[lbl];
                    return (
                      <div key={d.district}
                        className="flex items-center gap-2 rounded-xl px-3 py-1.5 border transition-all"
                        style={{ background: cfg.bg, borderColor: cfg.border }}>
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
                        <span className="text-[12px] font-bold text-foreground">{d.district}</span>
                        <span className="text-[10px] font-black rounded-lg px-1.5 py-0.5" style={{ background: "rgba(255,255,255,0.7)", color: cfg.text }}>{d.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── District Comparison ─────────────────────────────────────────── */}
        {(loadingInsights || hasData) && (
          <>
            {loadingInsights
              ? <Skeleton className="w-full h-64 rounded-2xl" />
              : <DistrictComparison districts={byDistrict} avgPsm={avgPsm} />
            }
          </>
        )}

        {/* ── Heatmap ─────────────────────────────────────────────────────── */}
        {(loadingMap || hasData) && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6"
            style={{ boxShadow: "0 2px 16px rgba(11,22,40,0.06)" }}>
            <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
              <div>
                <div className="text-base font-black text-foreground">الخريطة الحرارية للأسعار</div>
                <div className="text-[12px] text-muted-foreground mt-0.5">
                  الحجم = عدد الإعلانات — اللون = مستوى السعر — اضغط على أي حي للتفاصيل
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {HEAT_STEPS.map(s => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
            {loadingMap
              ? <Skeleton className="w-full h-[460px] rounded-2xl" />
              : <DistrictHeatMap districts={mapData ?? []} overallAvgPsm={avgPsm} />
            }
          </div>
        )}

        {/* ── Data table ─────────────────────────────────────────────────── */}
        {(loadingInsights || hasData) && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden"
            style={{ boxShadow: "0 2px 16px rgba(11,22,40,0.06)" }}>
            <div className="px-6 py-5 border-b border-[#F1F5F9]">
              <div className="text-base font-black text-foreground">البيانات التفصيلية للأحياء</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">مرتبة تنازلياً حسب متوسط السعر — يشمل تصنيف الفرصة وفرق السعر عن السوق</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead style={{ background: "#F8FAFC" }} className="border-b border-[#E2E8F0]">
                  <tr>
                    {["#", "الحي", "المدينة", "الإعلانات", "متوسط السعر", "سعر المتر", "التصنيف", "فرق عن السوق"].map(h => (
                      <th key={h} className="px-5 py-3.5 text-[11px] font-black text-muted-foreground tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8FAFC]">
                  {loadingInsights
                    ? Array.from({ length: 7 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-5 py-4"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                    : tableData.map((d, i) => {
                      const diff  = avgPsm > 0 && d.avgPricePerSqm > 0
                        ? Math.round(((d.avgPricePerSqm - avgPsm) / avgPsm) * 100) : null;
                      const lbl   = getDistrictLabel(d.avgPricePerSqm, avgPsm);
                      const isTop = i < 3;
                      return (
                        <tr key={`${d.district}-${i}`}
                          className="hover:bg-[#FAFBFF] transition-colors"
                          style={{ background: i === 0 ? "#FAFBFF" : undefined }}>
                          <td className="px-5 py-4">
                            {i < 3
                              ? <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black"
                                  style={{ background: i === 0 ? "#FEF3C7" : i === 1 ? "#F0F9FF" : "#F5F3FF", color: i === 0 ? "#B45309" : i === 1 ? "#0F7BA0" : "#7C3AED" }}>
                                  {i + 1}
                                </span>
                              : <span className="text-muted-foreground text-[12px] font-semibold">{i + 1}</span>
                            }
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              {isTop && <Trophy className="w-3 h-3 shrink-0" style={{ color: i === 0 ? "#D97706" : i === 1 ? "#0F7BA0" : "#7C3AED" }} />}
                              <span className={`font-${isTop ? "black" : "semibold"} text-foreground`}>{d.district}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-muted-foreground text-[12px] font-medium">{d.city}</td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center rounded-xl px-2.5 py-0.5 text-[12px] font-black"
                              style={{ background: "#F0F9FF", color: "#0F7BA0" }}>
                              {d.count}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-bold text-foreground">
                            {d.avgPrice > 0 ? <SAR value={d.avgPrice} /> : "—"}
                          </td>
                          <td className="px-5 py-4 font-semibold text-muted-foreground text-[13px]">
                            {d.avgPricePerSqm > 0 ? <SAR value={d.avgPricePerSqm} perSqm /> : "—"}
                          </td>
                          <td className="px-5 py-4">
                            <LabelBadge label={lbl} small />
                          </td>
                          <td className="px-5 py-4">
                            {diff === null
                              ? <span className="text-muted-foreground text-xs">—</span>
                              : <span className="text-[12px] font-black px-2.5 py-1 rounded-xl inline-block"
                                  style={{
                                    color:      Math.abs(diff) < 5 ? "#64748B" : diff > 0 ? "#BE123C" : "#15803D",
                                    background: Math.abs(diff) < 5 ? "#F8FAFC"  : diff > 0 ? "#FFF1F2" : "#F0FDF4",
                                  }}>
                                  {diff > 0 ? `+${diff}%` : `${diff}%`}
                                </span>
                            }
                          </td>
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}

      </motion.div>

      {/* Tooltip CSS override */}
      <style>{`
        .premium-tooltip .leaflet-tooltip { background: #fff; border: 1px solid #E2E8F0; border-radius: 14px; padding: 10px 12px; box-shadow: 0 8px 24px rgba(11,22,40,0.12); }
        .premium-tooltip .leaflet-tooltip::before { display: none; }
      `}</style>
    </Layout>
  );
}

