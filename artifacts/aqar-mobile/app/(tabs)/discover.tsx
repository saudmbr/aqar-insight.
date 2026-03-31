import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  Image,
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
  Marketer,
  ServiceProvider,
  CustomerRequest,
  apiFetch,
  endpoints,
  formatPrice,
  formatNumber,
  REQUEST_TYPE_LABELS,
} from '@/constants/api';

const { width } = Dimensions.get('window');

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const { data: analytics } = useQuery<AnalyticsInsights>({
    queryKey: ['analytics-insights'],
    queryFn: () => apiFetch<AnalyticsInsights>(endpoints.analyticsInsights),
    staleTime: 1000 * 60 * 5,
  });

  const { data: marketers } = useQuery<Marketer[]>({
    queryKey: ['marketers-list'],
    queryFn: () => apiFetch<Marketer[]>(endpoints.marketers),
    staleTime: 1000 * 60 * 5,
  });

  const { data: services } = useQuery<ServiceProvider[]>({
    queryKey: ['services-list'],
    queryFn: () => apiFetch<ServiceProvider[]>(endpoints.services),
    staleTime: 1000 * 60 * 5,
  });

  const { data: requests } = useQuery<CustomerRequest[]>({
    queryKey: ['requests-list'],
    queryFn: () => apiFetch<CustomerRequest[]>(endpoints.requests),
    staleTime: 1000 * 60 * 3,
  });

  const kpis = analytics?.kpis;
  const marketScore = analytics?.marketScore;
  const insights = analytics?.smartInsights ?? [];
  const topTypes = analytics?.byPropertyType?.slice(0, 3) ?? [];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: botPad + 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient colors={[Colors.navyDark, Colors.navy]} style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Feather name="compass" size={22} color={Colors.teal} style={{ alignSelf: 'flex-end' }} />
        <Text style={styles.headerTitle}>اكتشف السوق</Text>
        <Text style={styles.headerSub}>تحليلات ورؤى سوق العقار السعودي</Text>
      </LinearGradient>

      {/* ─── Market Score Card ─── */}
      {marketScore && (
        <View style={styles.scoreCard}>
          <View style={styles.scoreLeft}>
            <Text style={styles.scoreNum}>{marketScore.score}</Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <View style={styles.scoreRight}>
            <View style={[styles.scoreLabelBadge,
              marketScore.score >= 70 ? styles.scoreHigh : marketScore.score >= 40 ? styles.scoreMid : styles.scoreLow]}>
              <Text style={styles.scoreLabelText}>{marketScore.label}</Text>
            </View>
            <Text style={styles.scoreTitle}>مؤشر صحة السوق</Text>
            {marketScore.explanation && (
              <Text style={styles.scoreExplain} numberOfLines={2}>{marketScore.explanation}</Text>
            )}
          </View>
          <Pressable style={styles.scoreBtn} onPress={() => router.push('/analytics')}>
            <Feather name="bar-chart-2" size={16} color={Colors.teal} />
            <Text style={styles.scoreBtnText}>التحليل الكامل</Text>
          </Pressable>
        </View>
      )}

      {/* ─── KPI Strip ─── */}
      {kpis && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiScroll}
        >
          {[
            { label: 'إجمالي العقارات', value: formatNumber(kpis.totalListings), icon: 'home' },
            { label: 'متوسط السعر', value: `${formatPrice(kpis.avgPrice)} ر`, icon: 'dollar-sign' },
            { label: 'وسيط السعر', value: `${formatPrice(kpis.medianPrice)} ر`, icon: 'trending-up' },
            { label: 'جديد هذا الأسبوع', value: String(kpis.newLast7Days), icon: 'clock' },
            { label: 'للبيع', value: String(kpis.saleCount), icon: 'tag' },
            { label: 'للإيجار', value: String(kpis.rentCount), icon: 'key' },
            { label: 'معدل الدوران', value: `${kpis.turnoverRate}%`, icon: 'activity' },
          ].map((kpi, i) => (
            <View key={i} style={styles.kpiCard}>
              <Feather name={kpi.icon as any} size={16} color={Colors.teal} />
              <Text style={styles.kpiValue}>{kpi.value}</Text>
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ─── Top Property Types ─── */}
      {topTypes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>أكثر الأنواع إعلاناً</Text>
          <View style={styles.typesGrid}>
            {topTypes.map((t, i) => (
              <Pressable
                key={i}
                style={styles.typeCard}
                onPress={() => router.push({ pathname: '/(tabs)/listings', params: { propertyType: t.propertyType } })}
              >
                <Text style={styles.typeNum}>{t.count}</Text>
                <Text style={styles.typeName}>{t.propertyType}</Text>
                <Text style={styles.typePrice}>{formatPrice(t.avgPrice)} ر</Text>
                {t.percentage != null && (
                  <View style={styles.typeBar}>
                    <View style={[styles.typeBarFill, { width: `${Math.min(t.percentage, 100)}%` as any }]} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* ─── Smart Insights ─── */}
      {insights.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Pressable onPress={() => router.push('/analytics')}>
              <Text style={styles.seeAll}>الكل</Text>
            </Pressable>
            <Text style={styles.sectionTitle}>تحليلات ذكية</Text>
          </View>
          <View style={styles.insightsList}>
            {insights.slice(0, 3).map((insight, i) => (
              <View key={i} style={styles.insightRow}>
                <View style={styles.insightDot} />
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ─── Marketers ─── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Pressable onPress={() => router.push('/marketers')}>
            <Text style={styles.seeAll}>عرض الكل</Text>
          </Pressable>
          <Text style={styles.sectionTitle}>المسوّقون العقاريون</Text>
        </View>
        {!marketers || marketers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Feather name="users" size={28} color={Colors.textMuted} />
            <Text style={styles.emptyText}>لا يوجد مسوّقون مسجّلون</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {marketers.slice(0, 6).map((m) => (
              <Pressable
                key={m.id}
                style={styles.marketerCard}
                onPress={() => router.push({ pathname: '/marketers/[id]', params: { id: String(m.id) } })}
              >
                {m.photo ? (
                  <Image source={{ uri: m.photo }} style={styles.marketerPhoto} />
                ) : (
                  <View style={[styles.marketerPhoto, styles.marketerPhotoPlaceholder]}>
                    <Text style={styles.marketerInitial}>
                      {(m.fullName ?? m.officeName ?? 'م')[0]}
                    </Text>
                  </View>
                )}
                {m.verified && (
                  <View style={styles.verifiedBadge}>
                    <Feather name="check" size={10} color={Colors.white} />
                  </View>
                )}
                <Text style={styles.marketerName} numberOfLines={1}>
                  {m.officeName ?? m.fullName ?? '—'}
                </Text>
                <Text style={styles.marketerCity} numberOfLines={1}>{m.city ?? ''}</Text>
                {m.activeListingsCount != null && m.activeListingsCount > 0 && (
                  <Text style={styles.marketerCount}>{m.activeListingsCount} عقار</Text>
                )}
              </Pressable>
            ))}
            <Pressable style={styles.seeAllCard} onPress={() => router.push('/marketers')}>
              <Feather name="arrow-left" size={22} color={Colors.teal} />
              <Text style={styles.seeAllCardText}>الكل</Text>
            </Pressable>
          </ScrollView>
        )}
      </View>

      {/* ─── Service Providers ─── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Pressable onPress={() => router.push('/services')}>
            <Text style={styles.seeAll}>عرض الكل</Text>
          </Pressable>
          <Text style={styles.sectionTitle}>مزودو الخدمات</Text>
        </View>
        {!services || services.length === 0 ? (
          <View style={styles.emptyCard}>
            <Feather name="briefcase" size={28} color={Colors.textMuted} />
            <Text style={styles.emptyText}>لا توجد خدمات مسجّلة</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {services.slice(0, 6).map((s) => (
              <Pressable
                key={s.id}
                style={styles.serviceCard}
                onPress={() => router.push({ pathname: '/services/[id]', params: { id: String(s.id) } })}
              >
                <View style={styles.serviceIconWrap}>
                  <Feather name="briefcase" size={20} color={Colors.teal} />
                </View>
                <Text style={styles.serviceName} numberOfLines={2}>{s.businessName}</Text>
                <Text style={styles.serviceCategory} numberOfLines={1}>{s.category}</Text>
                {s.city && <Text style={styles.serviceCity} numberOfLines={1}>{s.city}</Text>}
                {s.ratingAvg != null && s.ratingAvg > 0 && (
                  <View style={styles.ratingRow}>
                    <Feather name="star" size={10} color={Colors.gold} />
                    <Text style={styles.ratingText}>{s.ratingAvg.toFixed(1)}</Text>
                  </View>
                )}
              </Pressable>
            ))}
            <Pressable style={styles.seeAllCard} onPress={() => router.push('/services')}>
              <Feather name="arrow-left" size={22} color={Colors.teal} />
              <Text style={styles.seeAllCardText}>الكل</Text>
            </Pressable>
          </ScrollView>
        )}
      </View>

      {/* ─── Customer Requests ─── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Pressable onPress={() => router.push('/requests')}>
            <Text style={styles.seeAll}>عرض الكل</Text>
          </Pressable>
          <Text style={styles.sectionTitle}>طلبات العملاء</Text>
        </View>
        {!requests || requests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Feather name="inbox" size={28} color={Colors.textMuted} />
            <Text style={styles.emptyText}>لا توجد طلبات حالياً</Text>
            <Pressable style={styles.postReqBtn} onPress={() => router.push('/requests/new')}>
              <Text style={styles.postReqBtnText}>أضف طلبك</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {requests.slice(0, 3).map((r) => (
              <Pressable
                key={r.id}
                style={styles.requestCard}
                onPress={() => router.push('/requests')}
              >
                <View style={styles.requestTop}>
                  <View style={[styles.reqTypeBadge,
                    r.requestType === 'property' ? styles.reqTypeProperty :
                    r.requestType === 'service' ? styles.reqTypeService : styles.reqTypeMarketer]}>
                    <Text style={styles.reqTypeText}>{REQUEST_TYPE_LABELS[r.requestType] ?? r.requestType}</Text>
                  </View>
                  <View style={[styles.reqStatusBadge, r.status === 'open' && styles.reqOpen]}>
                    <Text style={styles.reqStatusText}>{r.status === 'open' ? 'مفتوح' : 'مغلق'}</Text>
                  </View>
                </View>
                <Text style={styles.requestTitle} numberOfLines={2}>{r.title}</Text>
                {r.city && (
                  <View style={styles.reqLocation}>
                    <Feather name="map-pin" size={11} color={Colors.textMuted} />
                    <Text style={styles.reqLocationText}>{r.city}</Text>
                  </View>
                )}
                {(r.budgetMin || r.budgetMax) && (
                  <Text style={styles.reqBudget}>
                    الميزانية: {r.budgetMin ? formatPrice(r.budgetMin) : '—'} – {r.budgetMax ? formatPrice(r.budgetMax) : '—'} ريال
                  </Text>
                )}
              </Pressable>
            ))}
            <Pressable style={styles.addReqBtn} onPress={() => router.push('/requests/new')}>
              <Feather name="plus" size={16} color={Colors.white} />
              <Text style={styles.addReqBtnText}>أضف طلبك</Text>
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    alignItems: 'flex-end',
    gap: 4,
  },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'right' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: Colors.white, textAlign: 'right' },
  scoreCard: {
    margin: 16, backgroundColor: Colors.card, borderRadius: 20,
    padding: 16, flexDirection: 'row-reverse', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, gap: 12,
  },
  scoreLeft: {
    flexDirection: 'row-reverse', alignItems: 'baseline',
    backgroundColor: Colors.navy, borderRadius: 16,
    width: 80, height: 80, justifyContent: 'center', gap: 2,
  },
  scoreNum: { fontSize: 32, fontWeight: '900', color: Colors.white },
  scoreMax: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  scoreRight: { flex: 1, gap: 4 },
  scoreLabelBadge: { alignSelf: 'flex-end', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  scoreHigh: { backgroundColor: 'rgba(16,185,129,0.15)' },
  scoreMid: { backgroundColor: 'rgba(201,168,76,0.15)' },
  scoreLow: { backgroundColor: 'rgba(239,68,68,0.15)' },
  scoreLabelText: { fontSize: 12, fontWeight: '700', color: Colors.teal },
  scoreTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, textAlign: 'right' },
  scoreExplain: { fontSize: 11, color: Colors.textMuted, textAlign: 'right', lineHeight: 16 },
  scoreBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(15,123,160,0.1)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start',
  },
  scoreBtnText: { fontSize: 11, color: Colors.teal, fontWeight: '600' },
  kpiScroll: { paddingHorizontal: 16, paddingVertical: 8, gap: 10, flexDirection: 'row-reverse' },
  kpiCard: {
    width: 110, backgroundColor: Colors.card, borderRadius: 16, padding: 12,
    alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  kpiValue: { fontSize: 16, fontWeight: '800', color: Colors.navy },
  kpiLabel: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  seeAll: { fontSize: 12, color: Colors.teal, fontWeight: '600' },
  typesGrid: { flexDirection: 'row-reverse', gap: 10 },
  typeCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  typeNum: { fontSize: 20, fontWeight: '900', color: Colors.navy, textAlign: 'right' },
  typeName: { fontSize: 12, fontWeight: '700', color: Colors.text, textAlign: 'right', marginTop: 2 },
  typePrice: { fontSize: 10, color: Colors.teal, fontWeight: '600', textAlign: 'right', marginTop: 2 },
  typeBar: { height: 4, backgroundColor: Colors.skeleton, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  typeBarFill: { height: 4, backgroundColor: Colors.teal, borderRadius: 2 },
  insightsList: { gap: 8 },
  insightRow: {
    flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.card, borderRadius: 14, padding: 12,
    borderRightWidth: 3, borderRightColor: Colors.teal,
  },
  insightDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.teal, marginTop: 5 },
  insightText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 20, textAlign: 'right' },
  hScroll: { gap: 10, flexDirection: 'row-reverse', paddingBottom: 4 },
  marketerCard: {
    width: 120, backgroundColor: Colors.card, borderRadius: 18, padding: 12,
    alignItems: 'center', gap: 4, position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  marketerPhoto: { width: 56, height: 56, borderRadius: 28 },
  marketerPhotoPlaceholder: {
    backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center',
  },
  marketerInitial: { fontSize: 22, fontWeight: '800', color: Colors.white },
  verifiedBadge: {
    position: 'absolute', top: 44, right: 34,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  marketerName: { fontSize: 12, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  marketerCity: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  marketerCount: { fontSize: 10, color: Colors.teal, fontWeight: '600' },
  serviceCard: {
    width: 130, backgroundColor: Colors.card, borderRadius: 18, padding: 12,
    gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  serviceIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(15,123,160,0.1)',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  serviceName: { fontSize: 12, fontWeight: '700', color: Colors.text, textAlign: 'right' },
  serviceCategory: { fontSize: 10, color: Colors.teal, fontWeight: '600', textAlign: 'right' },
  serviceCity: { fontSize: 10, color: Colors.textMuted, textAlign: 'right' },
  ratingRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 10, fontWeight: '700', color: Colors.gold },
  seeAllCard: {
    width: 70, backgroundColor: Colors.background,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    gap: 4, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
    paddingVertical: 20,
  },
  seeAllCardText: { fontSize: 11, color: Colors.teal, fontWeight: '700' },
  emptyCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 24,
    alignItems: 'center', gap: 8,
  },
  emptyText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  postReqBtn: {
    marginTop: 8, backgroundColor: Colors.teal,
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12,
  },
  postReqBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  requestCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 14,
    marginBottom: 10, gap: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  requestTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  reqTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  reqTypeProperty: { backgroundColor: 'rgba(15,123,160,0.12)' },
  reqTypeService: { backgroundColor: 'rgba(201,168,76,0.12)' },
  reqTypeMarketer: { backgroundColor: 'rgba(16,185,129,0.12)' },
  reqTypeText: { fontSize: 11, fontWeight: '700', color: Colors.text },
  reqStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: Colors.skeleton },
  reqOpen: { backgroundColor: 'rgba(16,185,129,0.15)' },
  reqStatusText: { fontSize: 10, fontWeight: '700', color: Colors.textSub },
  requestTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, textAlign: 'right' },
  reqLocation: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  reqLocationText: { fontSize: 11, color: Colors.textMuted },
  reqBudget: { fontSize: 12, color: Colors.teal, fontWeight: '600', textAlign: 'right' },
  addReqBtn: {
    backgroundColor: Colors.teal, borderRadius: 14, paddingVertical: 12,
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 4,
  },
  addReqBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
});
