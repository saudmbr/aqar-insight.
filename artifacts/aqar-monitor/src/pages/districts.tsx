import { useState, useEffect, useRef, useMemo } from "react";
import { Layout } from "@/components/layout/layout";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
  Tooltip as RechartsTooltip, ResponsiveContainer, LabelList,
} from "recharts";
import { MapPin, BarChart3, TrendingUp, TrendingDown, X, Info, GitCompareArrows, Search } from "lucide-react";
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
type FilterOptions = {
  cities: string[];
  propertyTypes: string[];
};

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

const INPUT_CLS =
  "w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";

// ── Bar chart tooltip ──────────────────────────────────────────────────────────
function BarTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; payload: InsightsDistrict }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]!.payload;
  return (
    <div className="bg-card border border-border shadow-xl rounded-xl p-3 text-sm min-w-[180px]" dir="rtl">
      <div className="font-bold text-foreground mb-2 text-base">{label}</div>
      <div className="space-y-1.5">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground text-xs">سعر المتر</span>
          <span className="font-bold text-primary text-xs">{formatCurrency(d.avgPricePerSqm)} / م²</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground text-xs">متوسط السعر</span>
          <span className="font-semibold text-foreground text-xs">{d.avgPrice > 0 ? formatCurrency(d.avgPrice) : "—"}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground text-xs">عدد الإعلانات</span>
          <span className="font-bold text-[#0F7BA0] text-xs">{d.count} إعلان</span>
        </div>
      </div>
    </div>
  );
}

// ── Heatmap Map component ─────────────────────────────────────────────────────
function DistrictHeatMap({
  districts, overallAvgPsm,
}: {
  districts: DistrictMapData[]; overallAvgPsm: number;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const [selected, setSelected] = useState<DistrictMapData | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current, {
      zoomControl: false, attributionControl: false,
      center: [24.7136, 46.6753], zoom: 10,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 19, attribution: "© CartoDB" }).addTo(map);
    L.control.zoom({ position: "bottomleft" }).addTo(map);
    mapInstanceRef.current = map;
    return () => { mapInstanceRef.current?.remove(); mapInstanceRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    const withCoords = districts.filter(d => d.lat && d.lng && d.avgPricePerSqm > 0);
    if (!withCoords.length) return;
    const prices = withCoords.map(d => d.avgPricePerSqm);
    const minP = Math.min(...prices), maxP = Math.max(...prices);
    withCoords.forEach(d => {
      const ratio = maxP > minP ? (d.avgPricePerSqm - minP) / (maxP - minP) : 0.5;
      const color = getHeatColor(ratio);
      const radius = Math.max(16, Math.min(42, 16 + d.count * 4));
      const circle = L.circleMarker([d.lat!, d.lng!], {
        radius, fillColor: color, fillOpacity: 0.76,
        color: "rgba(255,255,255,0.9)", weight: 2.5, interactive: true,
      });
      circle.bindTooltip(
        `<div dir="rtl" style="font-family:Cairo,sans-serif;min-width:150px;padding:2px 0">
          <div style="font-weight:800;font-size:13px;color:#0F1C3F">${d.district}</div>
          <div style="font-size:11px;color:#64748B;margin-top:3px">${formatCurrency(d.avgPricePerSqm)} / م²</div>
          <div style="font-size:11px;color:#64748B">${d.count} إعلان</div>
        </div>`,
        { direction: "top", offset: L.point(0, -(radius + 4)) },
      );
      circle.on("click", () => setSelected(d));
      circle.addTo(map);
      markersRef.current.push(circle);
    });
    try {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 13 });
    } catch (_) { /* no-op */ }
  }, [districts]);

  const withCoords = districts.filter(d => d.lat && d.lng);
  const priceDiff = selected && overallAvgPsm > 0 && selected.avgPricePerSqm > 0
    ? Math.round(((selected.avgPricePerSqm - overallAvgPsm) / overallAvgPsm) * 100)
    : null;

  const insight = (() => {
    if (!selected) return null;
    if (priceDiff === null) return "لا توجد بيانات كافية لحساب المقارنة";
    if (priceDiff > 15) return `${selected.district} يسجل أسعاراً أعلى من متوسط السوق بـ ${priceDiff}% — يحتاج دراسة متأنية`;
    if (priceDiff < -10) return `${selected.district} يعرض أسعاراً أقل من متوسط السوق بـ ${Math.abs(priceDiff)}% — فرصة سعرية محتملة`;
    if (selected.count >= 5) return `${selected.district} ضمن النطاق السعري المتوسط مع نشاط معقول`;
    return `${selected.district} ضمن النطاق السعري المتوسط للسوق`;
  })();

  return (
    <div className="space-y-3">
      <div className="relative">
        <div ref={mapRef} className="w-full h-[440px] rounded-2xl overflow-hidden border border-border/60 shadow-sm" />
        {withCoords.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/85 backdrop-blur-sm rounded-2xl">
            <MapPin className="w-10 h-10 text-muted-foreground opacity-20" />
            <p className="text-sm font-medium text-muted-foreground text-center max-w-xs leading-relaxed">
              الخريطة الحرارية تحتاج إحداثيات جغرافية في الإعلانات
              <span className="block text-xs opacity-65 mt-1">تُفعَّل تلقائياً عند إضافة إعلانات بموقع محدد على الخريطة</span>
            </p>
          </div>
        )}
      </div>
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="bg-card rounded-2xl border border-border/60 p-5 shadow-md" dir="rtl"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="text-lg font-extrabold text-foreground">{selected.district}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{selected.city}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/50 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {[
                { label: "متوسط السعر", val: formatCurrency(selected.avgPrice), cls: "text-primary" },
                { label: "سعر المتر", val: formatCurrency(selected.avgPricePerSqm), cls: "text-foreground" },
                { label: "عدد الإعلانات", val: String(selected.count), cls: "text-foreground" },
                {
                  label: "مقارنة بالسوق", val: priceDiff !== null ? `${priceDiff > 0 ? "+" : ""}${priceDiff}%` : "—",
                  cls: priceDiff === null ? "text-muted-foreground" : priceDiff > 0 ? "text-red-500" : "text-green-600",
                },
              ].map(({ label, val, cls }) => (
                <div key={label} className="bg-muted/30 rounded-xl p-3 text-center">
                  <div className="text-[11px] text-muted-foreground mb-1">{label}</div>
                  <div className={`font-bold text-sm ${cls}`}>{val}</div>
                </div>
              ))}
            </div>
            {insight && (
              <div className="flex items-start gap-2 bg-primary/6 border border-primary/15 rounded-xl px-4 py-3">
                <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span className="text-[12px] text-foreground">{insight}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── District Comparison panel ──────────────────────────────────────────────────
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
    avgPrice: d?.avgPrice ?? 0,
    avgPricePerSqm: d?.avgPricePerSqm ?? 0,
    count: d?.count ?? 0,
    vsMarketPsm: d ? diff(d.avgPricePerSqm, avgPsm) : null,
  });

  const mA = metrics(dA);
  const mB = metrics(dB);

  const ROWS: { label: string; keyA: keyof typeof mA; format: (v: number | null) => string }[] = [
    { label: "متوسط السعر", keyA: "avgPrice", format: v => v && v > 0 ? formatCurrency(v) : "—" },
    { label: "سعر المتر (م²)", keyA: "avgPricePerSqm", format: v => v && v > 0 ? `${formatCurrency(v)} / م²` : "—" },
    { label: "عدد الإعلانات", keyA: "count", format: v => v ? `${v} إعلان` : "—" },
    { label: "مقارنة بمتوسط السوق", keyA: "vsMarketPsm", format: v => v !== null && v !== undefined ? `${v > 0 ? "+" : ""}${v}%` : "—" },
  ];

  const hasSelection = distA && distB;

  return (
    <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <GitCompareArrows className="w-5 h-5 text-primary" />
          <div className="text-base font-bold text-foreground">مقارنة بين حيّين</div>
        </div>
        <div className="text-[12px] text-muted-foreground">اختر حيّين من القائمة لعرض مقارنة تفصيلية بينهما</div>
      </div>

      {/* Selection row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: "الحي الأول", val: distA, set: setDistA, other: distB },
          { label: "الحي الثاني", val: distB, set: setDistB, other: distA },
        ].map(({ label, val, set, other }) => (
          <div key={label} className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
            <div className="relative">
              <select
                value={val}
                onChange={e => set(e.target.value)}
                className={INPUT_CLS}
              >
                <option value="">اختر الحي…</option>
                {filtered.filter(n => n !== other).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Quick search */}
      {districts.length > 8 && (
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="تصفية الأحياء…"
            className="w-full bg-muted/30 border border-border rounded-xl pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      )}

      {/* Comparison table */}
      {hasSelection ? (
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <table className="w-full text-sm text-right">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground tracking-wide">المؤشر</th>
                <th className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-lg px-3 py-1 text-xs font-bold">{distA}</span>
                </th>
                <th className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 rounded-lg px-3 py-1 text-xs font-bold">{distB}</span>
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-bold text-muted-foreground tracking-wide">الفرق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {ROWS.map(row => {
                const vA = mA[row.keyA] as number | null;
                const vB = mB[row.keyA] as number | null;
                const delta = typeof vA === "number" && typeof vB === "number" && vA > 0 && vB > 0
                  ? Math.round(((vA - vB) / vB) * 100)
                  : null;
                const winner = delta !== null ? (delta > 0 ? "A" : delta < 0 ? "B" : "tie") : null;

                return (
                  <tr key={row.label} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-foreground text-[13px]">{row.label}</td>
                    <td className={`px-4 py-3.5 text-center font-bold text-sm ${winner === "A" ? "text-primary" : "text-foreground"}`}>
                      {row.format(vA)}
                      {winner === "A" && row.keyA !== "count" && row.keyA !== "vsMarketPsm" && (
                        <span className="mr-1.5 text-[10px] bg-primary/10 text-primary rounded-md px-1.5 py-0.5">الأعلى</span>
                      )}
                    </td>
                    <td className={`px-4 py-3.5 text-center font-bold text-sm ${winner === "B" ? "text-purple-600" : "text-foreground"}`}>
                      {row.format(vB)}
                      {winner === "B" && row.keyA !== "count" && row.keyA !== "vsMarketPsm" && (
                        <span className="mr-1.5 text-[10px] bg-purple-100 text-purple-600 rounded-md px-1.5 py-0.5">الأعلى</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {delta !== null && row.keyA !== "vsMarketPsm" ? (
                        <span
                          className="inline-block text-[12px] font-bold px-2.5 py-1 rounded-lg"
                          style={{
                            color: Math.abs(delta) < 5 ? "#64748B" : delta > 0 ? "#EF4444" : "#22C55E",
                            background: Math.abs(delta) < 5 ? "rgba(100,116,139,0.1)" : delta > 0 ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                          }}
                        >
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
        <div className="flex flex-col items-center justify-center py-10 border border-dashed border-border/60 rounded-2xl text-muted-foreground gap-3">
          <GitCompareArrows className="w-8 h-8 opacity-20" />
          <p className="text-sm text-center">اختر حيّين من القوائم أعلاه لبدء المقارنة</p>
        </div>
      )}

      {/* Mini donut comparison */}
      {hasSelection && dA && dB && (
        <div className="grid grid-cols-2 gap-4 pt-2">
          {[
            { d: dA, color: "#0F7BA0", label: distA },
            { d: dB, color: "#8B5CF6", label: distB },
          ].map(({ d, color, label }) => {
            const marketDiff = avgPsm > 0 && d.avgPricePerSqm > 0
              ? Math.round(((d.avgPricePerSqm - avgPsm) / avgPsm) * 100)
              : null;
            return (
              <div key={label} className="bg-muted/20 rounded-2xl p-4 text-center border border-border/40">
                <div className="text-sm font-bold mb-2" style={{ color }}>{label}</div>
                <div className="text-2xl font-extrabold text-foreground">
                  {d.avgPricePerSqm > 0 ? formatCurrency(d.avgPricePerSqm) : "—"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">سعر المتر</div>
                <div className="mt-3 text-xs font-semibold">
                  <span className="bg-primary/10 text-primary rounded-lg px-2.5 py-1">{d.count} إعلان</span>
                </div>
                {marketDiff !== null && (
                  <div className="mt-2 flex items-center justify-center gap-1 text-[11px]" style={{ color: marketDiff > 0 ? "#EF4444" : "#22C55E" }}>
                    {marketDiff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {marketDiff > 0 ? "أعلى" : "أقل"} من السوق بـ {Math.abs(marketDiff)}%
                  </div>
                )}
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
  const [city, setCity] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [listingType, setListingType] = useState("");
  const [barSort, setBarSort] = useState<"price" | "count">("price");

  useEffect(() => {
    document.title = "مقارنة الأحياء – عقار إنسايت";
    return () => { document.title = "عقار إنسايت"; };
  }, []);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (city) p.set("city", city);
    if (propertyType) p.set("propertyType", propertyType);
    if (listingType) p.set("listingType", listingType);
    return p.toString();
  }, [city, propertyType, listingType]);

  const { data: filterOpts } = useQuery<FilterOptions>({
    queryKey: ["dist-filter-opts"],
    queryFn: async () => {
      const res = await fetch(`${BASE()}/api/analytics/listings-filter-options`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    staleTime: 300_000,
  });

  const { data: insights, isLoading: loadingInsights } = useQuery<{ byDistrict: InsightsDistrict[]; kpis: { avgPricePerSqm: number } }>({
    queryKey: ["dist-insights", qs],
    queryFn: async () => {
      const res = await fetch(`${BASE()}/api/analytics/listings-insights${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    staleTime: 60_000,
  });

  const { data: mapData, isLoading: loadingMap } = useQuery<DistrictMapData[]>({
    queryKey: ["dist-map", qs],
    queryFn: async () => {
      const res = await fetch(`${BASE()}/api/analytics/listings-districts-map${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    staleTime: 60_000,
  });

  const byDistrict = insights?.byDistrict ?? [];
  const avgPsm = insights?.kpis?.avgPricePerSqm ?? 0;
  const hasData = byDistrict.length > 0;

  // Bar chart data — each district with price + count
  const barData = useMemo(() => {
    const sorted = [...byDistrict]
      .filter(d => d.avgPricePerSqm > 0)
      .sort((a, b) =>
        barSort === "price"
          ? b.avgPricePerSqm - a.avgPricePerSqm
          : b.count - a.count
      )
      .slice(0, 15);
    return sorted;
  }, [byDistrict, barSort]);

  const tableData = useMemo(() =>
    [...byDistrict].sort((a, b) => b.avgPrice - a.avgPrice),
    [byDistrict],
  );

  // Tick formatter for Y axis
  const psmTick = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}م`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}ك`;
    return String(v);
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6 pb-14"
        dir="rtl"
      >
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <div
          className="relative rounded-[2rem] overflow-hidden p-8 md:p-10"
          style={{ background: "linear-gradient(140deg, #0F1C3F 0%, #0F1C3F 55%, #0F7BA0 100%)" }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.035 }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_top_right,rgba(201,168,76,0.12),transparent)] pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/90 px-3 py-1 rounded-full text-xs font-bold mb-4">
              <MapPin className="w-3.5 h-3.5" />
              مخطط الأحياء • مقارنة تفاعلية • خريطة حرارية
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">مقارنة الأحياء</h1>
            <p className="text-white/70 mt-2 text-sm max-w-xl">تصور تفاعلي لمستويات الأسعار والإعلانات بين الأحياء — مبني على بيانات المنصة الداخلية</p>
          </div>
        </div>

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select value={city} onChange={e => setCity(e.target.value)} className={INPUT_CLS}>
              <option value="">كل المدن</option>
              {(filterOpts?.cities ?? []).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={propertyType} onChange={e => setPropertyType(e.target.value)} className={INPUT_CLS}>
              <option value="">كل أنواع العقارات</option>
              {(filterOpts?.propertyTypes ?? []).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={listingType} onChange={e => setListingType(e.target.value)} className={INPUT_CLS}>
              <option value="">بيع وإيجار</option>
              <option value="sale">للبيع</option>
              <option value="rent">للإيجار</option>
            </select>
          </div>
          {(city || propertyType || listingType) && (
            <button
              onClick={() => { setCity(""); setPropertyType(""); setListingType(""); }}
              className="mt-3 text-xs text-muted-foreground hover:text-destructive border border-border rounded-lg px-3 py-1.5 transition-all"
            >
              مسح الفلاتر
            </button>
          )}
        </div>

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {!loadingInsights && !hasData && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground bg-card rounded-2xl border border-dashed border-border/60">
            <BarChart3 className="w-10 h-10 opacity-20" />
            <p className="text-sm font-medium text-center max-w-xs">
              لا توجد بيانات أحياء بعد. تأكد من أن الإعلانات تحتوي على اسم الحي، أو غيّر الفلاتر.
            </p>
          </div>
        )}

        {/* ── Bar chart: Prices + Listings per district ─────────────────── */}
        {(loadingInsights || hasData) && (
          <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
              <div>
                <div className="text-base font-bold text-foreground">الأسعار والإعلانات لكل حي</div>
                <div className="text-[12px] text-muted-foreground mt-0.5">
                  كل عمود يمثل حياً — الارتفاع = سعر المتر — حوّم للاطلاع على التفاصيل
                </div>
              </div>
              {/* Sort toggle */}
              <div className="flex items-center gap-2 bg-muted/30 rounded-xl p-1">
                {[
                  { key: "price", label: "حسب السعر" },
                  { key: "count", label: "حسب الإعلانات" },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setBarSort(opt.key as "price" | "count")}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${barSort === opt.key
                      ? "bg-card shadow-sm text-primary border border-border/60"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {opt.label}
                  </button>
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
              <div className="w-full" style={{ height: Math.max(300, barData.length * 44) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    layout="vertical"
                    margin={{ top: 4, right: 60, left: 0, bottom: 4 }}
                    barSize={22}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <YAxis
                      dataKey="district"
                      type="category"
                      width={90}
                      tick={{ fontFamily: "Cairo, sans-serif", fontSize: 12, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <XAxis
                      type="number"
                      tickFormatter={psmTick}
                      tick={{ fontFamily: "Cairo, sans-serif", fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, "dataMax + 500"]}
                    />
                    <RechartsTooltip
                      content={<BarTooltip />}
                      cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                    />
                    <Bar dataKey="avgPricePerSqm" radius={[0, 8, 8, 0]}>
                      {barData.map((entry, i) => (
                        <Cell
                          key={entry.district}
                          fill={BAR_COLORS[i % BAR_COLORS.length]}
                        />
                      ))}
                      {/* Listing count label on the right side of bar */}
                      <LabelList
                        dataKey="count"
                        position="right"
                        formatter={(v: number) => `${v} إعلان`}
                        style={{ fontFamily: "Cairo, sans-serif", fontSize: 11, fill: "var(--muted-foreground)" }}
                      />
                    </Bar>

                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Market average indicator */}
            {avgPsm > 0 && !loadingInsights && (
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-xl px-4 py-2.5 border border-border/40">
                <span className="w-3 h-0.5 bg-amber-500 shrink-0 inline-block rounded" />
                متوسط سعر السوق الحالي:
                <span className="font-bold text-foreground">{formatCurrency(avgPsm)} / م²</span>
              </div>
            )}

            {/* Listing count legend per district */}
            {!loadingInsights && barData.length > 0 && (
              <div className="mt-5 pt-4 border-t border-border/40">
                <div className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wide">عدد الإعلانات لكل حي</div>
                <div className="flex flex-wrap gap-2">
                  {barData.map((d, i) => (
                    <div
                      key={d.district}
                      className="flex items-center gap-1.5 bg-muted/30 border border-border/40 rounded-xl px-3 py-1.5"
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
                      <span className="text-xs font-semibold text-foreground">{d.district}</span>
                      <span className="text-[11px] font-bold text-primary bg-primary/10 rounded-lg px-1.5">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── District Comparison ──────────────────────────────────────────── */}
        {(loadingInsights || hasData) && (
          <>
            {loadingInsights ? (
              <Skeleton className="w-full h-64 rounded-2xl" />
            ) : (
              <DistrictComparison districts={byDistrict} avgPsm={avgPsm} />
            )}
          </>
        )}

        {/* ── Heatmap section ──────────────────────────────────────────────── */}
        {(loadingMap || hasData) && (
          <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
              <div>
                <div className="text-base font-bold text-foreground">الخريطة الحرارية للأسعار</div>
                <div className="text-[12px] text-muted-foreground mt-0.5">
                  كل دائرة = حي — الحجم يعكس عدد الإعلانات — اللون يعكس سعر المتر
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {HEAT_STEPS.map(s => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
            {loadingMap ? (
              <Skeleton className="w-full h-[440px] rounded-2xl" />
            ) : (
              <DistrictHeatMap districts={mapData ?? []} overallAvgPsm={avgPsm} />
            )}
          </div>
        )}

        {/* ── Data table ──────────────────────────────────────────────────── */}
        {(loadingInsights || hasData) && (
          <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border/40">
              <div className="text-base font-bold text-foreground">البيانات التفصيلية للأحياء</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">مرتبة تنازلياً حسب متوسط السعر — عمود الفرق مقارنةً بسعر المتر في السوق الحالي</div>
            </div>
            <div className="overflow-x-auto">
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
                  {loadingInsights
                    ? Array.from({ length: 7 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-5 py-3.5"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                    : tableData.map((d, i) => {
                      const diff = avgPsm > 0 && d.avgPricePerSqm > 0
                        ? Math.round(((d.avgPricePerSqm - avgPsm) / avgPsm) * 100)
                        : null;
                      const diffColor =
                        diff === null ? "var(--muted-foreground)"
                          : diff > 10 ? "#EF4444"
                            : diff < -10 ? "#22C55E"
                              : "var(--muted-foreground)";
                      return (
                        <tr key={`${d.district}-${i}`} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3.5 text-muted-foreground text-[12px]">{i + 1}</td>
                          <td className="px-5 py-3.5 font-semibold text-foreground">{d.district}</td>
                          <td className="px-5 py-3.5 text-muted-foreground text-[12px]">{d.city}</td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center bg-primary/10 text-primary text-[12px] font-bold rounded-lg px-2 py-0.5">
                              {d.count}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-foreground">
                            {d.avgPrice > 0 ? formatCurrency(d.avgPrice) : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground">
                            {d.avgPricePerSqm > 0 ? formatCurrency(d.avgPricePerSqm) : "—"}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-[13px]" style={{ color: diffColor }}>
                            {diff === null ? "—" : diff > 0 ? `+${diff}%` : `${diff}%`}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </motion.div>
    </Layout>
  );
}
