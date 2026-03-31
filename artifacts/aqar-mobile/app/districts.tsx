import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState, useMemo } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { apiFetch, endpoints, formatPrice, SAUDI_REGIONS } from '@/constants/api';

interface DistrictData {
  district: string;
  city: string;
  count: number;
  avgPrice: number;
  avgPricePerSqm: number;
  vsMarketPsm?: number;
}

function getHeatColor(vsMarket: number | null): string {
  if (vsMarket === null || vsMarket === undefined) return Colors.textMuted;
  if (vsMarket > 40) return '#EF4444';
  if (vsMarket > 20) return '#F97316';
  if (vsMarket > 0) return '#EAB308';
  if (vsMarket > -20) return '#A3E635';
  return '#22C55E';
}

function getHeatLabel(vsMarket: number | null): string {
  if (vsMarket === null || vsMarket === undefined) return 'غير محدد';
  if (vsMarket > 40) return 'مرتفعة جداً';
  if (vsMarket > 20) return 'مرتفعة';
  if (vsMarket > 0) return 'متوسطة';
  if (vsMarket > -20) return 'أقل من المتوسط';
  return 'أسعار منخفضة';
}

function CompareRow({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <View style={styles.compareRow}>
      <Text style={styles.compareB}>{b}</Text>
      <Text style={styles.compareLabel}>{label}</Text>
      <Text style={styles.compareA}>{a}</Text>
    </View>
  );
}

export default function DistrictsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const [activeTab, setActiveTab] = useState<'compare' | 'heat'>('compare');
  const [city, setCity] = useState('الرياض');
  const [distA, setDistA] = useState('');
  const [distB, setDistB] = useState('');

  const { data: districts = [], isLoading, refetch } = useQuery<DistrictData[]>({
    queryKey: ['districts-map', city],
    queryFn: async () => {
      const params = new URLSearchParams({ city });
      const res = await apiFetch<any>(endpoints.analyticsDistricts + `?${params}`);
      return Array.isArray(res) ? res : (res?.districts ?? []);
    },
    staleTime: 1000 * 60 * 5,
  });

  const avgPsm = useMemo(() => {
    if (!districts.length) return 0;
    return districts.reduce((s: number, d: any) => s + (d.avgPricePerSqm ?? 0), 0) / districts.length;
  }, [districts]);

  const districtNames = useMemo(() => districts.map((d: any) => d.district).filter(Boolean), [districts]);
  const dataA = districts.find((d: any) => d.district === distA);
  const dataB = districts.find((d: any) => d.district === distB);

  return (
    <View style={[styles.screen, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>تحليل الأحياء</Text>
        <View style={styles.backBtn} />
      </View>

      {/* City filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cityBar} contentContainerStyle={styles.cityBarContent}>
        {['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر'].map(c => (
          <Pressable key={c} style={[styles.cityChip, city === c && styles.cityChipActive]} onPress={() => { setCity(c); setDistA(''); setDistB(''); }}>
            <Text style={[styles.cityChipText, city === c && styles.cityChipTextActive]}>{c}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {[{ key: 'compare', label: 'مقارنة حيّين', icon: 'bar-chart-2' }, { key: 'heat', label: 'خريطة الأسعار', icon: 'map' }].map(t => (
          <Pressable key={t.key} style={[styles.tab, activeTab === t.key && styles.tabActive]} onPress={() => setActiveTab(t.key as any)}>
            <Feather name={t.icon as any} size={16} color={activeTab === t.key ? Colors.teal : Colors.textMuted} />
            <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad + 20, gap: 16, paddingHorizontal: 16, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.teal} />}
      >
        {/* Compare Tab */}
        {activeTab === 'compare' && (
          <>
            {/* District selectors */}
            <View style={styles.selectorRow}>
              <View style={[styles.selectorBox, { borderColor: Colors.teal }]}>
                <Text style={styles.selectorLabel}>الحي الثاني</Text>
                <ScrollView style={styles.selectorScroll} nestedScrollEnabled>
                  {districtNames.map((d: string) => (
                    <Pressable key={d} style={[styles.selectorItem, distB === d && styles.selectorItemActive]} onPress={() => d !== distA && setDistB(d)}>
                      <Text style={[styles.selectorItemText, distB === d && styles.selectorItemTextActive]}>{d}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.vsBox}>
                <Text style={styles.vsText}>VS</Text>
              </View>

              <View style={[styles.selectorBox, { borderColor: '#7C3AED' }]}>
                <Text style={[styles.selectorLabel, { color: '#7C3AED' }]}>الحي الأول</Text>
                <ScrollView style={styles.selectorScroll} nestedScrollEnabled>
                  {districtNames.map((d: string) => (
                    <Pressable key={d} style={[styles.selectorItem, distA === d && { backgroundColor: '#EDE9FE', borderColor: '#7C3AED' }]} onPress={() => d !== distB && setDistA(d)}>
                      <Text style={[styles.selectorItemText, distA === d && { color: '#7C3AED', fontWeight: '700' }]}>{d}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Comparison result */}
            {distA && distB && dataA && dataB ? (
              <View style={styles.compareCard}>
                <View style={styles.compareHeader}>
                  <View style={[styles.compareHeaderBox, { backgroundColor: '#F5F3FF', borderColor: '#7C3AED' }]}>
                    <Text style={[styles.compareHeaderText, { color: '#7C3AED' }]}>{distA}</Text>
                  </View>
                  <Text style={styles.compareVs}>مقارنة</Text>
                  <View style={[styles.compareHeaderBox, { backgroundColor: '#F0F9FF', borderColor: Colors.teal }]}>
                    <Text style={[styles.compareHeaderText, { color: Colors.teal }]}>{distB}</Text>
                  </View>
                </View>
                <CompareRow label="متوسط السعر" a={formatPrice(dataA.avgPrice)} b={formatPrice(dataB.avgPrice)} />
                <CompareRow label="سعر المتر" a={`${formatPrice(dataA.avgPricePerSqm)}/م²`} b={`${formatPrice(dataB.avgPricePerSqm)}/م²`} />
                <CompareRow label="عدد الإعلانات" a={`${dataA.count} إعلان`} b={`${dataB.count} إعلان`} />
                {dataA.vsMarketPsm !== undefined && dataB.vsMarketPsm !== undefined && (
                  <CompareRow
                    label="مقارنة بالسوق"
                    a={`${dataA.vsMarketPsm > 0 ? '+' : ''}${dataA.vsMarketPsm?.toFixed(0)}%`}
                    b={`${dataB.vsMarketPsm > 0 ? '+' : ''}${dataB.vsMarketPsm?.toFixed(0)}%`}
                  />
                )}
              </View>
            ) : (
              <View style={styles.infoBox}>
                <Feather name="info" size={20} color={Colors.textMuted} />
                <Text style={styles.infoText}>اختر حيّين من القائمة للمقارنة</Text>
              </View>
            )}
          </>
        )}

        {/* Heat Map Tab */}
        {activeTab === 'heat' && (
          <>
            {/* Legend */}
            <View style={styles.legend}>
              <Text style={styles.legendTitle}>مستوى الأسعار مقارنة بمتوسط السوق:</Text>
              <View style={styles.legendRow}>
                {[
                  { color: '#22C55E', label: 'منخفضة' },
                  { color: '#A3E635', label: 'أقل من المتوسط' },
                  { color: '#EAB308', label: 'متوسطة' },
                  { color: '#F97316', label: 'مرتفعة' },
                  { color: '#EF4444', label: 'مرتفعة جداً' },
                ].map(l => (
                  <View key={l.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                    <Text style={styles.legendLabel}>{l.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* District cards */}
            {isLoading && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>جارٍ التحميل...</Text>
              </View>
            )}
            {districts.map((d: any) => {
              const heat = getHeatColor(d.vsMarketPsm);
              return (
                <Pressable key={d.district} style={styles.districtCard} onPress={() => { setDistA(d.district); setActiveTab('compare'); }}>
                  <View style={[styles.districtHeat, { backgroundColor: `${heat}20`, borderColor: heat }]}>
                    <Text style={[styles.districtHeatText, { color: heat }]}>{getHeatLabel(d.vsMarketPsm)}</Text>
                  </View>
                  <View style={styles.districtInfo}>
                    <Text style={styles.districtName}>{d.district}</Text>
                    <Text style={styles.districtMeta}>{d.count} إعلان · {formatPrice(d.avgPrice)}</Text>
                    <Text style={styles.districtPsm}>{formatPrice(d.avgPricePerSqm)}/م²</Text>
                  </View>
                  {d.vsMarketPsm !== undefined && (
                    <Text style={[styles.districtVs, { color: heat }]}>
                      {d.vsMarketPsm > 0 ? '+' : ''}{d.vsMarketPsm?.toFixed(0)}%
                    </Text>
                  )}
                </Pressable>
              );
            })}

            {districts.length === 0 && !isLoading && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>لا توجد بيانات لهذه المدينة</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.navy, flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 16, paddingTop: 12, gap: 12,
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: Colors.white, textAlign: 'center' },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  cityBar: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, maxHeight: 52 },
  cityBarContent: { paddingHorizontal: 12, gap: 6, paddingVertical: 8, flexDirection: 'row-reverse' },
  cityChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  cityChipActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  cityChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSub },
  cityChipTextActive: { color: Colors.white },
  tabBar: { flexDirection: 'row-reverse', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.teal },
  tabLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabLabelActive: { color: Colors.teal },
  selectorRow: { flexDirection: 'row-reverse', gap: 8, alignItems: 'flex-start' },
  selectorBox: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, borderWidth: 2, overflow: 'hidden' },
  selectorLabel: { fontSize: 12, fontWeight: '700', color: Colors.teal, padding: 10, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  selectorScroll: { maxHeight: 200 },
  selectorItem: { paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, borderWidth: 0 },
  selectorItemActive: { backgroundColor: `${Colors.teal}15`, borderColor: Colors.teal },
  selectorItemText: { fontSize: 12, color: Colors.text, textAlign: 'right' },
  selectorItemTextActive: { color: Colors.teal, fontWeight: '700' },
  vsBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  vsText: { fontSize: 10, fontWeight: '800', color: Colors.white },
  compareCard: { backgroundColor: Colors.card, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  compareHeader: { flexDirection: 'row-reverse', alignItems: 'center', padding: 14, gap: 8 },
  compareHeaderBox: { flex: 1, borderRadius: 10, padding: 8, alignItems: 'center', borderWidth: 1 },
  compareHeaderText: { fontSize: 13, fontWeight: '700' },
  compareVs: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  compareRow: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  compareA: { flex: 1, fontSize: 13, fontWeight: '600', color: '#7C3AED', textAlign: 'right' },
  compareLabel: { flex: 1, fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
  compareB: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.teal, textAlign: 'left' },
  infoBox: { backgroundColor: Colors.card, borderRadius: 14, padding: 20, alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  legend: { backgroundColor: Colors.card, borderRadius: 14, padding: 12, gap: 8 },
  legendTitle: { fontSize: 12, fontWeight: '600', color: Colors.textSub, textAlign: 'right' },
  legendRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  legendItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 10, color: Colors.textMuted },
  districtCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  districtHeat: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  districtHeatText: { fontSize: 10, fontWeight: '700' },
  districtInfo: { flex: 1, gap: 2 },
  districtName: { fontSize: 14, fontWeight: '700', color: Colors.text, textAlign: 'right' },
  districtMeta: { fontSize: 11, color: Colors.textMuted, textAlign: 'right' },
  districtPsm: { fontSize: 11, color: Colors.teal, fontWeight: '600', textAlign: 'right' },
  districtVs: { fontSize: 14, fontWeight: '800' },
});
