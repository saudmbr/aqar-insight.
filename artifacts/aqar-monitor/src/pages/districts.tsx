import { useState, useEffect, useRef, useMemo } from "react";
import { Layout } from "@/components/layout/layout";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart, Pie, Cell,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";
import { MapPin, BarChart3, TrendingUp, TrendingDown, X, Info } from "lucide-react";
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
const DONUT_COLORS = [
  "#0F7BA0", "#94A3B8", "#34D399", "#8B5CF6",
  "#F97316", "#EF4444", "#06B6D4", "#F59E0B", "#EC4899", "#14B8A6",
];

const HEAT_STEPS = [
  { max: 0.20, color: "#22C55E", label: "أسعار منخفضة" },
  { max: 0.40, color: "#A3E635", label: "أقل من المتوسط" },
  { max: 0.60, color: "#EAB308", label: "متوسطة" },
  { max: 0.80, color: "#F97316", label: "مرتفعة" },
  { max: 1.01, color: "#EF4444", label: "مرتفعة جداً" },
];

function getHeatColor(ratio: number): string {
  for (const step of HEAT_STEPS) {
    if (ratio < step.max) return step.color;
  }
  return "#EF4444";
}

const INPUT_CLS =
  "w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";

// ── Donut tooltip ─────────────────────────────────────────────────────────────
function DonutTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]!;
  return (
    <div className="bg-card border border-border shadow-xl rounded-xl p-3 text-sm" dir="rtl">
      <div className="font-bold text-foreground mb-1">{d.name}</div>
      <div className="text-primary">{formatCurrency(d.value)} / م²</div>
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

  // Initialise map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      center: [24.7136, 46.6753],
      zoom: 10,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: "© CartoDB",
    }).addTo(map);

    L.control.zoom({ position: "bottomleft" }).addTo(map);

    mapInstanceRef.current = map;
    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Redraw markers when data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const withCoords = districts.filter(d => d.lat && d.lng && d.avgPricePerSqm > 0);
    if (!withCoords.length) return;

    const prices = withCoords.map(d => d.avgPricePerSqm);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);

    withCoords.forEach(d => {
      const ratio = maxP > minP ? (d.avgPricePerSqm - minP) / (maxP - minP) : 0.5;
      const color = getHeatColor(ratio);
      const radius = Math.max(16, Math.min(42, 16 + d.count * 4));

      const circle = L.circleMarker([d.lat!, d.lng!], {
        radius,
        fillColor: color,
        fillOpacity: 0.76,
        color: "rgba(255,255,255,0.9)",
        weight: 2.5,
        interactive: true,
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

  const priceDiff =
    selected && overallAvgPsm > 0 && selected.avgPricePerSqm > 0
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
            className="bg-card rounded-2xl border border-border/60 p-5 shadow-md"
            dir="rtl"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="text-lg font-extrabold text-foreground leading-tight">{selected.district}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{selected.city}</div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="bg-muted/30 rounded-xl p-3 text-center">
                <div className="text-[11px] text-muted-foreground mb-1">متوسط السعر</div>
                <div className="font-bold text-primary text-sm">{formatCurrency(selected.avgPrice)}</div>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 text-center">
                <div className="text-[11px] text-muted-foreground mb-1">سعر المتر</div>
                <div className="font-bold text-foreground text-sm">{formatCurrency(selected.avgPricePerSqm)}</div>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 text-center">
                <div className="text-[11px] text-muted-foreground mb-1">عدد الإعلانات</div>
                <div className="font-bold text-foreground text-sm">{selected.count}</div>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 text-center">
                <div className="text-[11px] text-muted-foreground mb-1">مقارنة بالسوق</div>
                {priceDiff !== null ? (
                  <div className="flex items-center justify-center gap-1">
                    {priceDiff > 0
                      ? <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                      : <TrendingDown className="w-3.5 h-3.5 text-green-500" />}
                    <span className="font-bold text-sm" style={{ color: priceDiff > 0 ? "#EF4444" : "#22C55E" }}>
                      {priceDiff > 0 ? "أعلى" : "أقل"} {Math.abs(priceDiff)}%
                    </span>
                  </div>
                ) : <span className="text-sm text-muted-foreground">—</span>}
              </div>
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Districts() {
  const [city, setCity] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [listingType, setListingType] = useState("");

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

  const donutData = useMemo(() =>
    [...byDistrict]
      .filter(d => d.avgPricePerSqm > 0)
      .sort((a, b) => b.avgPricePerSqm - a.avgPricePerSqm)
      .slice(0, 10),
    [byDistrict],
  );

  const tableData = useMemo(() =>
    [...byDistrict].sort((a, b) => b.avgPrice - a.avgPrice),
    [byDistrict],
  );

  const hasData = byDistrict.length > 0;

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
              خريطة حرارية • مخطط دائري • جدول مقارن
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">مقارنة الأحياء</h1>
            <p className="text-white/70 mt-2 text-sm max-w-xl">تصور تفاعلي لمستويات الأسعار بين الأحياء — مبني على بيانات المنصة الداخلية</p>
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

        {/* ── Donut chart ─────────────────────────────────────────────────── */}
        {(loadingInsights || hasData) && (
          <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
            <div className="mb-5">
              <div className="text-base font-bold text-foreground">توزيع الأسعار بين الأحياء</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">
                أعلى 10 أحياء حسب متوسط سعر المتر — حوّم على القطع لعرض التفاصيل
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              {/* Donut */}
              <div className="relative h-[300px]">
                {loadingInsights ? (
                  <Skeleton className="w-full h-full rounded-2xl" />
                ) : donutData.length < 2 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                    <BarChart3 className="w-8 h-8 opacity-20" />
                    <p className="text-sm text-center">بيانات غير كافية لعرض المخطط الدائري<br /><span className="text-xs opacity-65">يحتاج على الأقل حيّين لعرض المقارنة</span></p>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius="42%"
                          outerRadius="73%"
                          paddingAngle={2}
                          dataKey="avgPricePerSqm"
                          nameKey="district"
                          startAngle={90}
                          endAngle={-270}
                          stroke="none"
                        >
                          {donutData.map((_, i) => (
                            <Cell
                              key={i}
                              fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                              stroke="var(--card)"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<DonutTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <div className="text-[11px] text-muted-foreground">متوسط السوق</div>
                      <div className="text-xl font-extrabold text-foreground leading-none mt-0.5">
                        {formatCurrency(avgPsm)}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">ر.س / م²</div>
                    </div>
                  </>
                )}
              </div>

              {/* Legend list */}
              <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                {donutData.map((d, i) => {
                  const diff = avgPsm > 0 && d.avgPricePerSqm > 0
                    ? Math.round(((d.avgPricePerSqm - avgPsm) / avgPsm) * 100)
                    : null;
                  return (
                    <div
                      key={d.district}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/30 transition-colors"
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                      />
                      <span className="text-sm font-semibold text-foreground flex-1 truncate">{d.district}</span>
                      <span className="text-[12px] text-muted-foreground shrink-0">{formatCurrency(d.avgPricePerSqm)}/م²</span>
                      {diff !== null && (
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-lg shrink-0"
                          style={{
                            color: diff > 10 ? "#EF4444" : diff < -10 ? "#22C55E" : "#64748B",
                            background: diff > 10 ? "rgba(239,68,68,0.1)" : diff < -10 ? "rgba(34,197,94,0.1)" : "rgba(100,116,139,0.1)",
                          }}
                        >
                          {diff > 0 ? "+" : ""}{diff}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
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
              {/* Heatmap legend */}
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
