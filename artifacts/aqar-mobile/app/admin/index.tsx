import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React from 'react';
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
import { Colors } from '@/constants/colors';
import { AdminReportsResponse, apiFetch, endpoints } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

const ADMIN_CARDS = [
  { icon: 'users', title: 'إدارة المستخدمين', subtitle: 'تغيير الأدوار ومراجعة الحسابات', route: '/admin/users', color: Colors.teal },
  { icon: 'bar-chart-2', title: 'تقارير المنصة', subtitle: 'مؤشرات السوق والنشاط العام', route: '/admin/reports', color: Colors.navy },
  { icon: 'flag', title: 'بلاغات المستخدمين', subtitle: 'مراجعة البلاغات واتخاذ الإجراء', route: '/admin/user-reports', color: Colors.danger },
];

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function AdminHomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data, isLoading } = useQuery<AdminReportsResponse>({
    queryKey: ['admin-mobile-home'],
    queryFn: () => apiFetch<AdminReportsResponse>(`${endpoints.adminReports}?period=month`),
    enabled: user?.role === 'admin',
    staleTime: 1000 * 60,
  });

  if (user?.role !== 'admin') {
    return (
      <View style={styles.guardScreen}>
        <Feather name="shield-off" size={40} color={Colors.textMuted} />
        <Text style={styles.guardTitle}>هذه الصفحة للمشرف فقط</Text>
        <Text style={styles.guardSub}>سجّل الدخول بحساب إداري للوصول إلى أدوات الإدارة.</Text>
        <Pressable style={styles.guardBtn} onPress={() => router.back()}>
          <Text style={styles.guardBtnText}>العودة</Text>
        </Pressable>
      </View>
    );
  }

  const overview = data?.overview;
  const criticalAlerts = data?.alerts.filter((item) => item.severity === 'high') ?? [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 26 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={20} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>لوحة الإدارة</Text>
        <View style={styles.headerBadge}>
          <Feather name="shield" size={14} color={Colors.gold} />
          <Text style={styles.headerBadgeText}>Admin</Text>
        </View>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>إدارة المنصة من الجوال</Text>
        <Text style={styles.heroSub}>
          راقب المؤشرات السريعة، وادخل مباشرة إلى المستخدمين والتقارير والبلاغات.
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.teal} />
        </View>
      ) : (
        <>
          <View style={styles.statsGrid}>
            <StatCard label="المستخدمون" value={overview?.totalUsers ?? 0} color={Colors.navy} />
            <StatCard label="الإعلانات" value={overview?.totalListings ?? 0} color={Colors.teal} />
            <StatCard label="الطلبات" value={overview?.totalRequests ?? 0} color={Colors.gold} />
            <StatCard label="الخدمات" value={overview?.totalServices ?? 0} color={Colors.success} />
          </View>

          <View style={styles.cardsWrap}>
            {ADMIN_CARDS.map((card) => (
              <Pressable key={card.route} style={styles.actionCard} onPress={() => router.push(card.route as any)}>
                <View style={[styles.actionIcon, { backgroundColor: `${card.color}18` }]}>
                  <Feather name={card.icon as any} size={18} color={card.color} />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionTitle}>{card.title}</Text>
                  <Text style={styles.actionSub}>{card.subtitle}</Text>
                </View>
                <Feather name="chevron-left" size={18} color={Colors.textMuted} />
              </Pressable>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>تنبيهات مهمة</Text>
            {criticalAlerts.length === 0 ? (
              <View style={styles.alertCard}>
                <Feather name="check-circle" size={18} color={Colors.success} />
                <Text style={styles.alertText}>لا توجد تنبيهات حرجة حاليًا.</Text>
              </View>
            ) : (
              criticalAlerts.map((alert, index) => (
                <View key={`${alert.type}-${index}`} style={styles.alertCardDanger}>
                  <Feather name="alert-triangle" size={18} color={Colors.danger} />
                  <Text style={styles.alertTextDanger}>{alert.message}</Text>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  guardScreen: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  guardTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  guardSub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  guardBtn: {
    marginTop: 8,
    backgroundColor: Colors.navy,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  guardBtnText: { color: Colors.white, fontWeight: '700' },
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
  headerBadge: {
    flexDirection: 'row-reverse',
    gap: 6,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerBadgeText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  heroCard: {
    margin: 16,
    marginBottom: 10,
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 18,
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: Colors.navy, textAlign: 'right', marginBottom: 6 },
  heroSub: { fontSize: 13, color: Colors.textSub, lineHeight: 20, textAlign: 'right' },
  loadingWrap: { paddingTop: 48 },
  statsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 10,
  },
  statCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    alignItems: 'flex-end',
  },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  cardsWrap: { paddingHorizontal: 16, paddingTop: 18, gap: 12 },
  actionCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, textAlign: 'right', marginBottom: 4 },
  actionSub: { fontSize: 12, color: Colors.textSub, textAlign: 'right', lineHeight: 18 },
  section: { paddingHorizontal: 16, marginTop: 22 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, textAlign: 'right', marginBottom: 10 },
  alertCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  alertCardDanger: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  alertText: { flex: 1, fontSize: 13, color: Colors.text, textAlign: 'right' },
  alertTextDanger: { flex: 1, fontSize: 13, color: Colors.danger, textAlign: 'right', lineHeight: 20 },
});
