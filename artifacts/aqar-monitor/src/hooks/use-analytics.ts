import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const BASE = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

// ── Types ─────────────────────────────────────────────────────────────────────

export type MarketScore = {
  score: number;
  label: "قوي" | "متوازن" | "ضعيف";
  components: { activity: number; diversity: number; stability: number };
  explanation: string;
};

export type SupplyDemand = {
  totalSupply: number;
  newSupply: number;
  newLast7Days: number;
  activityRatio: number;
  marketBalance: "balanced" | "higher_demand" | "higher_supply";
  marketBalanceLabel: string;
  supplyDemandGap: number;
};

export type KpisData = {
  totalListings: number; avgPricePerSqm: number; avgPrice: number;
  maxPrice: number; minPrice: number; medianPrice: number;
  p25Price: number; p75Price: number; priceStddev: number;
  saleCount: number; rentCount: number; investCount: number;
  listingsWithArea: number; turnoverRate: number; areaDataRate: number;
  newLast7Days: number; newLast30Days: number; newLast90Days: number;
  avgDaysOnMarket: number; priceDeviationPct: number;
};

export type InsightsData = {
  kpis: KpisData;
  byRegion: Array<{ region: string; count: number; avgPrice: number; avgPricePerSqm: number }>;
  byCity: Array<{ city: string; count: number; avgPrice: number; avgPricePerSqm: number }>;
  byDistrict: Array<{ district: string; city: string; count: number; avgPrice: number; avgPricePerSqm: number }>;
  byPropertyType: Array<{ propertyType: string; count: number; avgPrice: number; avgPricePerSqm: number; percentage: number }>;
  byListingType: Array<{ listingType: string; count: number; avgPrice: number; percentage: number; label: string }>;
  smartInsights: string[];
  marketScore: MarketScore;
  supplyDemand: SupplyDemand;
};

export type TrendPoint = { period: string; label: string; count: number; avgPrice: number; avgPricePerSqm: number };

export type FilterOptions = {
  cities: string[];
  districts: Array<{ district: string; city: string }>;
  propertyTypes: string[];
  listingTypes: Array<{ value: string; label: string }>;
};

export type ListingBenchmark = {
  listing: { id: number; price: number; pricePerSqm: number; areaSqm: number | null; city: string; district: string | null; propertyType: string };
  districtBenchmark: { count: number; avgPrice: number; avgPricePerSqm: number } | null;
  cityBenchmark: { count: number; avgPrice: number; avgPricePerSqm: number };
  typeBenchmark: { count: number; avgPrice: number; avgPricePerSqm: number } | null;
  position: {
    vsDistrict: { pct: number; label: string; usedPsm: boolean } | null;
    vsCity:     { pct: number; label: string; usedPsm: boolean } | null;
    vsType:     { pct: number; label: string; usedPsm: boolean } | null;
  };
  hasSufficientData: boolean;
};

export type AnalyticsFilters = {
  city?: string; district?: string; propertyType?: string; listingType?: string;
  region?: string; days?: number;
};

// ── Time Window Helpers ────────────────────────────────────────────────────────

export const TIME_WINDOWS = [
  { value: 7,   label: "7 أيام" },
  { value: 30,  label: "30 يوم" },
  { value: 90,  label: "90 يوم" },
  { value: 365, label: "سنة كاملة" },
];

// ── Main Analytics Hook ────────────────────────────────────────────────────────

export function useAnalytics(filters: AnalyticsFilters = {}) {
  const queryStr = useMemo(() => {
    const p = new URLSearchParams();
    if (filters.region) p.set("region", filters.region);
    if (filters.city) p.set("city", filters.city);
    if (filters.district) p.set("district", filters.district);
    if (filters.propertyType) p.set("propertyType", filters.propertyType);
    if (filters.listingType) p.set("listingType", filters.listingType);
    if (filters.days) p.set("days", String(filters.days));
    return p.toString();
  }, [filters.region, filters.city, filters.district, filters.propertyType, filters.listingType, filters.days]);

  const { data: insights, isLoading, isError } = useQuery<InsightsData>({
    queryKey: ["analytics-insights", queryStr],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/listings-insights${queryStr ? `?${queryStr}` : ""}`);
      if (!res.ok) throw new Error("Analytics API failed");
      return res.json();
    },
    staleTime: 60_000,
  });

  const kpis = insights?.kpis;
  const hasData = (kpis?.totalListings ?? 0) > 0;
  const hasSufficientData = (kpis?.totalListings ?? 0) >= 3;

  return { insights, kpis, hasData, hasSufficientData, isLoading, isError, queryStr };
}

// ── Trends Hook ───────────────────────────────────────────────────────────────

export function useAnalyticsTrends(filters: AnalyticsFilters = {}, period = "month") {
  const queryStr = useMemo(() => {
    const p = new URLSearchParams();
    if (filters.region) p.set("region", filters.region);
    if (filters.city) p.set("city", filters.city);
    if (filters.district) p.set("district", filters.district);
    if (filters.propertyType) p.set("propertyType", filters.propertyType);
    if (filters.listingType) p.set("listingType", filters.listingType);
    p.set("period", period);
    return p.toString();
  }, [filters.region, filters.city, filters.district, filters.propertyType, filters.listingType, period]);

  return useQuery<TrendPoint[]>({
    queryKey: ["analytics-trends", queryStr],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/listings-trends?${queryStr}`);
      if (!res.ok) throw new Error("Trends API failed");
      return res.json();
    },
    staleTime: 60_000,
  });
}

// ── Filter Options Hook ───────────────────────────────────────────────────────

export function useAnalyticsFilterOptions() {
  return useQuery<FilterOptions>({
    queryKey: ["analytics-filter-options"],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/listings-filter-options`);
      if (!res.ok) throw new Error("Filter options API failed");
      return res.json();
    },
    staleTime: 300_000,
  });
}

// ── Listing Benchmark Hook ────────────────────────────────────────────────────

export function useListingBenchmark(listingId: number | null) {
  return useQuery<ListingBenchmark>({
    queryKey: ["listing-benchmark", listingId],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/listing-benchmark/${listingId}`);
      if (!res.ok) throw new Error("Benchmark API failed");
      return res.json();
    },
    enabled: listingId !== null && listingId > 0,
    staleTime: 120_000,
  });
}

// ── Computed Indicators (shared logic) ────────────────────────────────────────

export function computeMarketDirection(trends: TrendPoint[]) {
  if (!trends.length) return { label: "—", color: "#94A3B8", pct: 0 };
  const first = trends[0]?.avgPrice ?? 0;
  const last  = trends[trends.length - 1]?.avgPrice ?? 0;
  const pct   = first > 0 ? Math.round(((last - first) / first) * 100) : 0;
  return {
    label: pct > 3 ? "صاعد ↑" : pct < -3 ? "هابط ↓" : "مستقر →",
    color: pct > 3 ? "#22C55E" : pct < -3 ? "#EF4444" : "#0F7BA0",
    pct,
  };
}

export function computeActivityLevel(newLast7: number, newLast30: number) {
  const weeklyAvg = newLast30 / 4;
  const ratio = weeklyAvg > 0 ? newLast7 / weeklyAvg : 0;
  return {
    ratio,
    label: ratio > 1.2 ? "نشاط مرتفع" : ratio < 0.8 ? "نشاط هادئ" : "نشاط عادي",
    color: ratio > 1.2 ? "#22C55E" : ratio < 0.8 ? "#F59E0B" : "#0F7BA0",
  };
}

export function positionLabelColor(label: string): string {
  if (label === "أقل من السوق") return "#22C55E";
  if (label === "أعلى من السوق") return "#EF4444";
  return "#0F7BA0";
}

