import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import {
  AnalyticsInsights,
  apiFetch,
  endpoints,
  formatPrice,
  formatNumber,
} from '@/constants/api';

const { width } = Dimensions.get('window');

const TABS = [
  { key: 'overview', label: 'نظرة عامة' },
  { key: 'types', label: 'الأنواع' },
  { key: 'regions', label: 'المناطق' },
  { key: 'insights', label: 'الذكاء التحليلي' },
];

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const [tab, setTab] = useState('overview');

  const { data, isLoading, refetch } = useQuery<AnalyticsInsights>({
    queryKey: ['analytics-insights-full'],
    queryFn: () => apiFetch<AnalyticsInsights>(endpoints.analyticsInsights),
    staleTime: 1000 * 60 * 5,
  });

  const kpis = data?.kpis;
  const marketScore = data?.marketScore;
  const insights = data?.smartInsights ?? [];
  const byType = data?.byPropertyType ?? [];
  const byRegion = data?.byRegion ?? [];
  const byCity = data?.byCity ?? [];
  const supplyDemand = data?.supplyDemand;
  const byListingType = data?.byListingType ?? [];

  const maxTypeCount = Math.max(...byType.map((t) => t.count), 1);
  const maxRegionCount = Math.max(...byRegion.map((r) => r.count), 1);
  const maxCityCount = Math.max(...byCity.map((c) => c.count), 1);

  return (
    <View style={[styles.screen, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>تحليلات السوق</Text>
        <Pressable onPress={() => refetch()} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={18} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.teal} size="large" />
          <Text style={styles.loadingText}>جارٍ تحميل البيانات...</Text>
        </View>
      ) : (
        <>
          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScroll}
          >
            {TABS.map((t) => (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                style={[styles.tab, tab === t.key && styles.tabActive]}
              >
                <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: botPad + 20 }]}
          >
            {/* ═══ OVERVIEW TAB ═══ */}
            {tab === 'overview' && (
              <>
                {/* Market Score */}
                {marketScore && (
                  <View style={styles.scoreCard}>
                    <View style={styles.scoreCircle}>
                      <Text style={styles.scoreNum}>{marketScore.score}</Text>
                      <Text style={styles.scoreLabel}>{marketScore.label}</Text>
                    </View>
                    <View style={styles.scoreInfo}>
                      <Text style={styles.scoreTitle}>مؤشر صحة السوق</Text>
                      {marketScore.components && (
                        <View style={styles.scoreComponents}>
                          {Object.entries(marketScore.components).map(([k, v]) => {
                            const labels: Record<string, string> = {
                              activity: 'النشاط',
                              diversity: 'التنوع',
                              stability: 'الاستقرار',
                            };
                            const maxes: Record<string, number> = { activity: 40, diversity: 30, stability: 30 };
                            const pct = (v / (maxes[k] ?? 40)) * 100;
                            return (
                              <View key={k} style={styles.componentRow}>
                                <Text style={styles.componentScore}>{v}</Text>
                                <View style={styles.componentBar}>
                                  <View style={[styles.componentFill, { width: `${pct}%` as any }]} />
                                </View>
                                <Text style={styles.componentLabel}>{labels[k] ?? k}</Text>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* KPIs Grid */}
                {kpis && (
                  <>
                    <Text style={styles.sectionTitle}>المؤشرات الرئيسية</Text>
                    <View style={styles.kpiGrid}>
                      {[
                        { label: 'إجمالي العقارات', value: formatNumber(kpis.totalListings), icon: 'home', color: Colors.teal },
                        { label: 'متوسط السعر', value: `${formatPrice(kpis.avgPrice)} ر`, icon: 'dollar-sign', color: Colors.gold },
                        { label: 'وسيط السعر', value: `${formatPrice(kpis.medianPrice)} ر`, icon: 'trending-up', color: '#10b981' },
                        { label: 'للبيع', value: String(kpis.saleCount), icon: 'tag', color: Colors.teal },
                        { label: 'للإيجار', value: String(kpis.rentCount), icon: 'key', color: Colors.gold },
                        { label: 'جديد هذا الأسبوع', value: String(kpis.newLast7Days), icon: 'clock', color: '#8b5cf6' },
                        { label: 'جديد هذا الشهر', value: String(kpis.newLast30Days), icon: 'calendar', color: '#f59e0b' },
                        { label: 'معدل الدوران', value: `${kpis.turnoverRate}%`, icon: 'activity', color: '#ef4444' },
                      ].map((k, i) => (
                        <View key={i} style={styles.kpiCard}>
                          <View style={[styles.kpiIconWrap, { backgroundColor: `${k.color}18` }]}>
                            <Feather name={k.icon as any} size={16} color={k.color} />
                          </View>
                          <Text style={styles.kpiValue}>{k.value}</Text>
                          <Text style={styles.kpiLabel}>{k.label}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {/* Supply/Demand */}
                {supplyDemand && (
                  <>
                    <Text style={styles.sectionTitle}>العرض والطلب</Text>
                    <View style={styles.sdCard}>
                      <View style={styles.sdRow}>
                        <Text style={styles.sdValue}>{supplyDemand.marketBalanceLabel}</Text>
                        <Text style={styles.sdLabel}>توازن السوق</Text>
                      </View>
                      <View style={styles.sdDivider} />
                      <View style={styles.sdRow}>
                        <Text style={styles.sdValue}>{(supplyDemand.activityRatio * 100).toFixed(0)}%</Text>
                        <Text style={styles.sdLabel}>نسبة النشاط</Text>
                      </View>
                    </View>
                  </>
                )}

                {/* Listing type split */}
                {byListingType.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>توزيع نوع الإعلان</Text>
                    <View style={styles.splitCard}>
                      {byListingType.map((lt, i) => {
                        const total = byListingType.reduce((a, b) => a + b.count, 0);
                        const pct = total > 0 ? ((lt.count / total) * 100).toFixed(0) : 0;
                        return (
                          <View key={i} style={styles.splitRow}>
                            <Text style={styles.splitPct}>{pct}%</Text>
                            <View style={styles.splitBar}>
                              <View style={[styles.splitFill, {
                                width: `${pct}%` as any,
                                backgroundColor: i === 0 ? Colors.teal : Colors.gold,
                              }]} />
                            </View>
                            <Text style={styles.splitLabel}>
                              {lt.listingType === 'sale' ? 'للبيع' :
                               lt.listingType === 'rent' ? 'للإيجار' :
                               lt.name ?? lt.listingType ?? '—'}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </>
                )}
              </>
            )}

            {/* ═══ TYPES TAB ═══ */}
            {tab === 'types' && (
              <>
                <Text style={styles.sectionTitle}>توزيع أنواع العقارات</Text>
                {byType.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <Feather name="bar-chart" size={36} color={Colors.textMuted} />
                    <Text style={styles.emptyText}>لا توجد بيانات</Text>
                  </View>
                ) : (
                  <View style={styles.barChart}>
                    {byType.map((t, i) => {
                      const pct = (t.count / maxTypeCount) * 100;
                      const barColors = [Colors.teal, Colors.gold, '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
                      const color = barColors[i % barColors.length];
                      return (
                        <View key={i} style={styles.barRow}>
                          <Text style={styles.barValue}>{formatPrice(t.avgPrice)} ر</Text>
                          <View style={styles.barTrack}>
                            <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
                          </View>
                          <View style={styles.barLabelWrap}>
                            <Text style={styles.barCount}>{t.count}</Text>
                            <Text style={styles.barLabel}>{t.propertyType}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Type cards */}
                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>تفاصيل الأنواع</Text>
                <View style={styles.typeCards}>
                  {byType.map((t, i) => (
                    <Pressable
                      key={i}
                      style={styles.typeCard}
                      onPress={() => router.push({ pathname: '/(tabs)/listings', params: { propertyType: t.propertyType } })}
                    >
                      <Text style={styles.typeCardNum}>{t.count}</Text>
                      <Text style={styles.typeCardName}>{t.propertyType}</Text>
                      <Text style={styles.typeCardPrice}>{formatPrice(t.avgPrice)} ر</Text>
                      {t.percentage != null && (
                        <View style={styles.typeBarWrap}>
                          <View style={[styles.typeBarFill, { width: `${Math.min(t.percentage, 100)}%` as any }]} />
                        </View>
                      )}
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {/* ═══ REGIONS TAB ═══ */}
            {tab === 'regions' && (
              <>
                {byRegion.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>توزيع المناطق</Text>
                    <View style={styles.barChart}>
                      {byRegion.map((r, i) => {
                        const name = r.region ?? r.name ?? '—';
                        const pct = (r.count / maxRegionCount) * 100;
                        return (
                          <View key={i} style={styles.barRow}>
                            <Text style={styles.barValue}>{r.count}</Text>
                            <View style={styles.barTrack}>
                              <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: Colors.teal }]} />
                            </View>
                            <Text style={styles.barLabel}>{name}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </>
                )}

                {byCity.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, { marginTop: 16 }]}>توزيع المدن</Text>
                    <View style={styles.barChart}>
                      {byCity.slice(0, 10).map((c, i) => {
                        const name = c.city ?? c.name ?? '—';
                        const pct = (c.count / maxCityCount) * 100;
                        return (
                          <View key={i} style={styles.barRow}>
                            <Text style={styles.barValue}>{c.count}</Text>
                            <View style={styles.barTrack}>
                              <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: Colors.gold }]} />
                            </View>
                            <Text style={styles.barLabel}>{name}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </>
                )}

                {byRegion.length === 0 && byCity.length === 0 && (
                  <View style={styles.emptyWrap}>
                    <Feather name="map" size={36} color={Colors.textMuted} />
                    <Text style={styles.emptyText}>لا توجد بيانات جغرافية</Text>
                    <Text style={styles.emptySubText}>تُضاف البيانات عند إدراج عقارات جديدة</Text>
                  </View>
                )}
              </>
            )}

            {/* ═══ INSIGHTS TAB ═══ */}
            {tab === 'insights' && (
              <>
                <Text style={styles.sectionTitle}>التحليلات الذكية</Text>
                {insights.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <Feather name="cpu" size={36} color={Colors.textMuted} />
                    <Text style={styles.emptyText}>لا توجد تحليلات كافية</Text>
                  </View>
                ) : (
                  <View style={styles.insightsList}>
                    {insights.map((insight, i) => (
                      <View key={i} style={styles.insightCard}>
                        <View style={styles.insightNum}>
                          <Text style={styles.insightNumText}>{i + 1}</Text>
                        </View>
                        <Text style={styles.insightText}>{insight}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Price Range */}
                {kpis && (kpis.maxPrice || kpis.minPrice) && (
                  <>
                    <Text style={[styles.sectionTitle, { marginTop: 16 }]}>نطاق الأسعار</Text>
                    <View style={styles.priceRangeCard}>
                      <View style={styles.priceRangeItem}>
                        <Text style={styles.priceRangeLabel}>الحد الأدنى</Text>
                        <Text style={styles.priceRangeValue}>{kpis.minPrice ? formatPrice(kpis.minPrice) + ' ر' : '—'}</Text>
                      </View>
                      <View style={styles.priceRangeDivider} />
                      <View style={styles.priceRangeItem}>
                        <Text style={styles.priceRangeLabel}>المتوسط</Text>
                        <Text style={[styles.priceRangeValue, { color: Colors.teal }]}>{formatPrice(kpis.avgPrice)} ر</Text>
                      </View>
                      <View style={styles.priceRangeDivider} />
                      <View style={styles.priceRangeItem}>
                        <Text style={styles.priceRangeLabel}>الحد الأقصى</Text>
                        <Text style={styles.priceRangeValue}>{kpis.maxPrice ? formatPrice(kpis.maxPrice) + ' ر' : '—'}</Text>
                      </View>
                    </View>
                  </>
                )}
              </>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.navy, paddingHorizontal: 16, paddingBottom: 16,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.white, flex: 1 },
  refreshBtn: { padding: 6 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: Colors.textMuted },
  tabsScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row-reverse' },
  tab: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  tabText: { fontSize: 12, fontWeight: '600', color: Colors.textSub },
  tabTextActive: { color: Colors.white },
  scrollContent: { paddingHorizontal: 16, gap: 4 },
  scoreCard: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 16, marginBottom: 16,
    flexDirection: 'row-reverse', gap: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  scoreCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.teal,
  },
  scoreNum: { fontSize: 26, fontWeight: '900', color: Colors.white },
  scoreLabel: { fontSize: 11, color: Colors.teal, fontWeight: '700', marginTop: -2 },
  scoreInfo: { flex: 1 },
  scoreTitle: { fontSize: 14, fontWeight: '800', color: Colors.text, textAlign: 'right', marginBottom: 8 },
  scoreComponents: { gap: 6 },
  componentRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  componentLabel: { fontSize: 10, color: Colors.textMuted, width: 50, textAlign: 'right' },
  componentBar: { flex: 1, height: 5, backgroundColor: Colors.skeleton, borderRadius: 3, overflow: 'hidden' },
  componentFill: { height: 5, backgroundColor: Colors.teal, borderRadius: 3 },
  componentScore: { fontSize: 10, fontWeight: '700', color: Colors.navy, width: 24, textAlign: 'right' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, textAlign: 'right', marginBottom: 10, marginTop: 8 },
  kpiGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  kpiCard: {
    width: (width - 52) / 2,
    backgroundColor: Colors.card, borderRadius: 16, padding: 14,
    alignItems: 'flex-end', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  kpiIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontSize: 18, fontWeight: '900', color: Colors.navy },
  kpiLabel: { fontSize: 11, color: Colors.textMuted, textAlign: 'right' },
  sdCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 4,
  },
  sdRow: { flex: 1, alignItems: 'center', gap: 4 },
  sdValue: { fontSize: 16, fontWeight: '800', color: Colors.navy },
  sdLabel: { fontSize: 11, color: Colors.textMuted },
  sdDivider: { width: 1, height: 40, backgroundColor: Colors.border },
  splitCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 14,
    gap: 10, marginBottom: 4,
  },
  splitRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  splitLabel: { width: 60, fontSize: 12, fontWeight: '700', color: Colors.text, textAlign: 'right' },
  splitBar: { flex: 1, height: 8, backgroundColor: Colors.skeleton, borderRadius: 4, overflow: 'hidden' },
  splitFill: { height: 8, borderRadius: 4 },
  splitPct: { width: 36, fontSize: 12, fontWeight: '700', color: Colors.textSub, textAlign: 'right' },
  barChart: { gap: 10, marginBottom: 8 },
  barRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  barValue: { width: 65, fontSize: 10, color: Colors.textSub, textAlign: 'right' },
  barTrack: { flex: 1, height: 8, backgroundColor: Colors.skeleton, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  barLabelWrap: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, width: 70 },
  barLabel: { fontSize: 11, color: Colors.text, fontWeight: '600', textAlign: 'right', width: 60, flex: 1 },
  barCount: { fontSize: 10, fontWeight: '800', color: Colors.navy },
  typeCards: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  typeCard: {
    width: (width - 52) / 2,
    backgroundColor: Colors.card, borderRadius: 16, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  typeCardNum: { fontSize: 22, fontWeight: '900', color: Colors.navy, textAlign: 'right' },
  typeCardName: { fontSize: 13, fontWeight: '700', color: Colors.text, textAlign: 'right' },
  typeCardPrice: { fontSize: 11, color: Colors.teal, fontWeight: '600', textAlign: 'right' },
  typeBarWrap: { height: 4, backgroundColor: Colors.skeleton, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  typeBarFill: { height: 4, backgroundColor: Colors.teal, borderRadius: 2 },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 8 },
  emptyText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  emptySubText: { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
  insightsList: { gap: 10 },
  insightCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 14,
    flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10,
    borderRightWidth: 3, borderRightColor: Colors.teal,
  },
  insightNum: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 1,
  },
  insightNumText: { fontSize: 12, fontWeight: '800', color: Colors.white },
  insightText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 20, textAlign: 'right' },
  priceRangeCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    flexDirection: 'row-reverse', alignItems: 'center',
  },
  priceRangeItem: { flex: 1, alignItems: 'center', gap: 4 },
  priceRangeLabel: { fontSize: 11, color: Colors.textMuted },
  priceRangeValue: { fontSize: 15, fontWeight: '800', color: Colors.navy },
  priceRangeDivider: { width: 1, height: 40, backgroundColor: Colors.border },
});
