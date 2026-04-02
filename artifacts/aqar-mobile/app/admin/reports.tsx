import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminReportsResponse, apiFetch, endpoints, formatPrice } from '@/constants/api';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';

const PERIODS = [
  { key: 'day', label: 'يوم' },
  { key: 'week', label: 'أسبوع' },
  { key: 'month', label: 'شهر' },
  { key: 'quarter', label: 'ربع سنة' },
  { key: 'year', label: 'سنة' },
];

function MiniMetric({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={[styles.metricValue, { color: accent }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export default function AdminReportsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [period, setPeriod] = useState('month');

  const { data, isLoading } = useQuery<AdminReportsResponse>({
    queryKey: ['admin-reports-mobile', period],
    queryFn: () => apiFetch<AdminReportsResponse>(`${endpoints.adminReports}?period=${period}`),
    enabled: user?.role === 'admin',
    staleTime: 1000 * 45,
  });

  const topCities = useMemo(() => data?.listings.byCity.slice(0, 5) ?? [], [data]);
  const topTypes = useMemo(() => data?.listings.byType.slice(0, 5) ?? [], [data]);

  if (user?.role !== 'admin') {
    return (
      <View style={styles.guardScreen}>
        <Feather name="shield-off" size={40} color={Colors.textMuted} />
        <Text style={styles.guardTitle}>هذه الشاشة للمشرف فقط</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={20} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>تقارير الإدارة</Text>
        <Feather name="bar-chart-2" size={18} color={Colors.gold} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodsRow}>
          {PERIODS.map((item) => {
            const active = item.key === period;
            return (
              <Pressable
                key={item.key}
                style={[styles.periodChip, active && styles.periodChipActive]}
                onPress={() => setPeriod(item.key)}
              >
                <Text style={[styles.periodChipText, active && styles.periodChipTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.teal} />
          </View>
        ) : (
          <>
            <View style={styles.metricGrid}>
              <MiniMetric label="مستخدمون جدد" value={data?.overview.newUsers ?? 0} accent={Colors.navy} />
              <MiniMetric label="إعلانات جديدة" value={data?.overview.newListings ?? 0} accent={Colors.teal} />
              <MiniMetric label="طلبات جديدة" value={data?.overview.newRequests ?? 0} accent={Colors.gold} />
              <MiniMetric label="خدمات جديدة" value={data?.overview.newServices ?? 0} accent={Colors.success} />
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>ملخص المنصة</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryValue}>{data?.overview.totalListings ?? 0}</Text>
                <Text style={styles.summaryLabel}>إجمالي الإعلانات</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryValue}>{data?.overview.activeListings ?? 0}</Text>
                <Text style={styles.summaryLabel}>إعلانات نشطة</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryValue}>{data?.overview.totalFavorites ?? 0}</Text>
                <Text style={styles.summaryLabel}>إجمالي المفضلات</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryValue}>{data?.operational.activeSessions ?? 0}</Text>
                <Text style={styles.summaryLabel}>جلسات نشطة</Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>إحصائيات الأسعار</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryValue}>{formatPrice(data?.listings.priceStats.avg_price ?? 0)}</Text>
                <Text style={styles.summaryLabel}>متوسط السعر</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryValue}>{formatPrice(data?.listings.priceStats.max_price ?? 0)}</Text>
                <Text style={styles.summaryLabel}>أعلى سعر</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryValue}>{formatPrice(data?.listings.priceStats.min_price ?? 0)}</Text>
                <Text style={styles.summaryLabel}>أقل سعر</Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>المدن الأكثر نشاطًا</Text>
              {topCities.map((item, index) => (
                <View key={`${item.city}-${index}`} style={styles.rankRow}>
                  <Text style={styles.rankValue}>{item.count}</Text>
                  <Text style={styles.rankLabel}>{item.city}</Text>
                </View>
              ))}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>أنواع العقارات الأبرز</Text>
              {topTypes.map((item, index) => (
                <View key={`${item.type}-${index}`} style={styles.rankRow}>
                  <Text style={styles.rankValue}>{item.count}</Text>
                  <Text style={styles.rankLabel}>{item.type}</Text>
                </View>
              ))}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>التنبيهات</Text>
              {data?.alerts.length ? (
                data.alerts.map((item, index) => (
                  <View
                    key={`${item.type}-${index}`}
                    style={[
                      styles.alertRow,
                      item.severity === 'high'
                        ? styles.alertRowHigh
                        : item.severity === 'medium'
                          ? styles.alertRowMedium
                          : styles.alertRowLow,
                    ]}
                  >
                    <Feather
                      name={item.severity === 'high' ? 'alert-triangle' : item.severity === 'medium' ? 'info' : 'check-circle'}
                      size={16}
                      color={item.severity === 'high' ? Colors.danger : item.severity === 'medium' ? Colors.gold : Colors.success}
                    />
                    <Text style={styles.alertBody}>{item.message}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>لا توجد تنبيهات حالية.</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  guardScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  guardTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  header: {
    backgroundColor: Colors.navy,
    paddingHorizontal: 16,
    paddingBottom: 18,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
  body: { padding: 16, gap: 14 },
  periodsRow: { gap: 10, paddingBottom: 8 },
  periodChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodChipActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  periodChipText: { color: Colors.textSub, fontSize: 12, fontWeight: '700' },
  periodChipTextActive: { color: Colors.white },
  loadingWrap: { paddingTop: 48 },
  metricGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  metricCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    alignItems: 'flex-end',
  },
  metricValue: { fontSize: 22, fontWeight: '800' },
  metricLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  sectionCard: { backgroundColor: Colors.white, borderRadius: 22, padding: 16, marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, textAlign: 'right', marginBottom: 12 },
  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  summaryValue: { fontSize: 14, fontWeight: '800', color: Colors.navy },
  summaryLabel: { fontSize: 13, color: Colors.textSub },
  rankRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  rankValue: { fontSize: 13, color: Colors.teal, fontWeight: '800' },
  rankLabel: { fontSize: 13, color: Colors.text, flex: 1, textAlign: 'right', marginLeft: 12 },
  alertRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  alertRowHigh: { backgroundColor: 'rgba(239,68,68,0.08)' },
  alertRowMedium: { backgroundColor: 'rgba(201,168,76,0.12)' },
  alertRowLow: { backgroundColor: 'rgba(16,185,129,0.08)' },
  alertBody: { flex: 1, fontSize: 13, lineHeight: 20, color: Colors.text, textAlign: 'right' },
  emptyText: { fontSize: 13, color: Colors.textMuted, textAlign: 'right' },
});
