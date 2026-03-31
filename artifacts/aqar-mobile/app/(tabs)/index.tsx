import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import {
  ListingsResponse,
  AnalyticsInsights,
  ServiceProvider,
  CustomerRequest,
  fetchListings,
  apiFetch,
  endpoints,
  formatPrice,
} from '@/constants/api';
import { ListingCard } from '@/components/ListingCard';
import { SkeletonCard } from '@/components/SkeletonCard';

const QUICK_ACTIONS = [
  { icon: 'grid', label: 'العقارات', path: '/(tabs)/listings', color: Colors.teal },
  { icon: 'compass', label: 'اكتشف', path: '/(tabs)/discover', color: '#8b5cf6' },
  { icon: 'users', label: 'المسوّقون', path: '/marketers', color: '#10b981' },
  { icon: 'briefcase', label: 'الخدمات', path: '/services', color: Colors.gold },
  { icon: 'inbox', label: 'الطلبات', path: '/requests', color: '#f59e0b' },
  { icon: 'bar-chart-2', label: 'التحليلات', path: '/analytics', color: '#ef4444' },
  { icon: 'layers', label: 'الأحياء', path: '/districts', color: '#0ea5e9' },
  { icon: 'map', label: 'الخريطة', path: '/(tabs)/map', color: Colors.navy },
  { icon: 'heart', label: 'المفضلة', path: '/(tabs)/favorites', color: '#e11d48' },
  { icon: 'zap', label: 'رؤية 2030', path: '/future', color: '#f59e0b' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [activeType, setActiveType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const { data, isLoading, refetch, isRefetching } = useQuery<ListingsResponse>({
    queryKey: ['home-listings', activeType],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '6', page: '1' });
      if (activeType !== 'all') params.set('listingType', activeType);
      return fetchListings(params);
    },
  });

  const { data: analytics } = useQuery<AnalyticsInsights>({
    queryKey: ['analytics-home'],
    queryFn: () => apiFetch<AnalyticsInsights>(endpoints.analyticsInsights),
    staleTime: 1000 * 60 * 10,
  });

  const { data: services } = useQuery<ServiceProvider[]>({
    queryKey: ['home-services'],
    queryFn: () => apiFetch<ServiceProvider[]>(`${endpoints.services}?limit=3&page=1`).then((r: any) => r.data ?? r ?? []),
    staleTime: 1000 * 60 * 10,
  });

  const { data: recentRequests } = useQuery<CustomerRequest[]>({
    queryKey: ['home-requests'],
    queryFn: () => apiFetch<any>(endpoints.requests + '?limit=3&status=open').then((r: any) => r.data ?? r ?? []),
    staleTime: 1000 * 60 * 5,
  });

  const { data: platformRating } = useQuery<any>({
    queryKey: ['platform-rating'],
    queryFn: () => apiFetch<any>(endpoints.platformRating),
    staleTime: 1000 * 60 * 30,
  });

  const listings = data?.listings ?? [];
  const kpis = analytics?.kpis;
  const marketScore = analytics?.marketScore;

  const handleSearch = () => {
    if (search.trim()) {
      router.push({ pathname: '/(tabs)/listings', params: { q: search } });
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: botPad + 20 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.teal} />}
    >
      {/* ─── Hero Header ─── */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.headerIconBtn}>
            <Feather name="user" size={20} color={Colors.white} />
          </Pressable>
          <View style={styles.headerBrand}>
            <Text style={styles.headerSub}>منصة العقارات السعودية</Text>
            <Text style={styles.headerTitle}>عقار إنسايت</Text>
          </View>
          <Pressable onPress={() => router.push('/notifications')} style={styles.headerIconBtn}>
            <Feather name="bell" size={20} color={Colors.white} />
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Pressable style={styles.searchBtn} onPress={handleSearch}>
            <Feather name="search" size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث: حي، مدينة، نوع عقار..."
            placeholderTextColor="rgba(255,255,255,0.45)"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            textAlign="right"
          />
        </View>

        {/* Listing type pills */}
        <View style={styles.pillsRow}>
          {[{ k: 'all', l: 'الكل' }, { k: 'sale', l: 'للبيع' }, { k: 'rent', l: 'للإيجار' }].map(({ k, l }) => (
            <Pressable
              key={k}
              style={[styles.pill, activeType === k && styles.pillActive]}
              onPress={() => setActiveType(k)}
            >
              <Text style={[styles.pillText, activeType === k && styles.pillTextActive]}>{l}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ─── Market Score + KPIs ─── */}
      {kpis && (
        <View style={styles.statsRow}>
          {marketScore && (
            <Pressable style={styles.scoreCard} onPress={() => router.push('/analytics')}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNum}>{marketScore.score}</Text>
              </View>
              <View>
                <Text style={styles.scoreTitle}>مؤشر السوق</Text>
                <Text style={styles.scoreLabel}>{marketScore.label}</Text>
              </View>
            </Pressable>
          )}
          <View style={styles.kpiMini}>
            <View style={styles.kpiMiniItem}>
              <Text style={styles.kpiMiniValue}>{kpis.totalListings}</Text>
              <Text style={styles.kpiMiniLabel}>عقار</Text>
            </View>
            <View style={styles.kpiMiniDivider} />
            <View style={styles.kpiMiniItem}>
              <Text style={styles.kpiMiniValue}>{formatPrice(kpis.avgPrice)}</Text>
              <Text style={styles.kpiMiniLabel}>متوسط ر</Text>
            </View>
            <View style={styles.kpiMiniDivider} />
            <View style={styles.kpiMiniItem}>
              <Text style={styles.kpiMiniValue}>{kpis.newLast7Days}</Text>
              <Text style={styles.kpiMiniLabel}>جديد</Text>
            </View>
          </View>
        </View>
      )}

      {/* ─── Quick Actions ─── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>الخدمات</Text>
        </View>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((qa) => (
            <Pressable
              key={qa.label}
              style={styles.quickItem}
              onPress={() => router.push(qa.path as any)}
            >
              <View style={[styles.quickIcon, { backgroundColor: `${qa.color}18` }]}>
                <Feather name={qa.icon as any} size={20} color={qa.color} />
              </View>
              <Text style={styles.quickLabel}>{qa.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ─── Featured Listings ─── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Pressable onPress={() => router.push('/(tabs)/listings')}>
            <Text style={styles.seeAll}>عرض الكل</Text>
          </Pressable>
          <Text style={styles.sectionTitle}>أحدث العقارات</Text>
        </View>

        {isLoading ? (
          <View style={styles.grid}>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </View>
        ) : listings.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Feather name="home" size={36} color={Colors.textMuted} />
            <Text style={styles.emptyText}>لا توجد عقارات حالياً</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {listings.map((item) => (
              <ListingCard
                key={item.id}
                listing={item}
                onPress={() => router.push({ pathname: '/listing/[id]', params: { id: String(item.id) } })}
              />
            ))}
          </View>
        )}
      </View>

      {/* ─── Smart Insights Preview ─── */}
      {analytics?.smartInsights && analytics.smartInsights.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Pressable onPress={() => router.push('/analytics')}>
              <Text style={styles.seeAll}>التحليل الكامل</Text>
            </Pressable>
            <Text style={styles.sectionTitle}>تحليلات ذكية</Text>
          </View>
          <View style={styles.insightCard}>
            <View style={styles.insightIcon}>
              <Feather name="cpu" size={16} color={Colors.teal} />
            </View>
            <Text style={styles.insightText} numberOfLines={3}>
              {analytics.smartInsights[0]}
            </Text>
          </View>
        </View>
      )}

      {/* ─── Services Preview ─── */}
      {services && services.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Pressable onPress={() => router.push('/services')}>
              <Text style={styles.seeAll}>عرض الكل</Text>
            </Pressable>
            <Text style={styles.sectionTitle}>مزودو الخدمات</Text>
          </View>
          <View style={styles.servicesRow}>
            {services.slice(0, 3).map((s) => (
              <Pressable key={s.id} style={styles.serviceCard} onPress={() => router.push({ pathname: '/services/[id]', params: { id: String(s.id) } })}>
                <View style={styles.serviceIcon}>
                  <Feather name="briefcase" size={20} color={Colors.gold} />
                </View>
                <Text style={styles.serviceName} numberOfLines={2}>{s.businessName}</Text>
                <Text style={styles.serviceCity} numberOfLines={1}>{s.city}</Text>
                {s.ratingAvg ? <Text style={styles.serviceRating}>⭐ {s.ratingAvg.toFixed(1)}</Text> : null}
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* ─── Open Customer Requests ─── */}
      {recentRequests && recentRequests.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Pressable onPress={() => router.push('/requests')}>
              <Text style={styles.seeAll}>عرض الكل</Text>
            </Pressable>
            <Text style={styles.sectionTitle}>أحدث طلبات العملاء</Text>
          </View>
          {recentRequests.slice(0, 3).map((r) => (
            <Pressable key={r.id} style={styles.requestRow} onPress={() => router.push({ pathname: '/requests/[id]', params: { id: String(r.id) } })}>
              <View style={styles.requestDot} />
              <View style={styles.requestInfo}>
                <Text style={styles.requestTitle} numberOfLines={1}>{r.title}</Text>
                <Text style={styles.requestMeta}>{r.city ?? '—'} · {new Date(r.createdAt).toLocaleDateString('ar-SA')}</Text>
              </View>
              <Feather name="chevron-left" size={14} color={Colors.textMuted} />
            </Pressable>
          ))}
        </View>
      )}

      {/* ─── CTA Banner ─── */}
      <Pressable
        style={styles.ctaBanner}
        onPress={() => router.push('/requests/new')}
      >
        <View style={styles.ctaContent}>
          <Text style={styles.ctaTitle}>هل تبحث عن عقار؟</Text>
          <Text style={styles.ctaDesc}>أضف طلبك وتواصل مع المسوّقين مباشرة</Text>
        </View>
        <View style={styles.ctaBtn}>
          <Text style={styles.ctaBtnText}>أضف طلبك</Text>
          <Feather name="arrow-left" size={16} color={Colors.white} />
        </View>
      </Pressable>

      {/* ─── Future Projects Teaser ─── */}
      <Pressable style={styles.futureBanner} onPress={() => router.push('/future')}>
        <Text style={styles.futureBannerEmoji}>🚀</Text>
        <View style={styles.futureBannerContent}>
          <Text style={styles.futureBannerTitle}>مشاريع رؤية 2030</Text>
          <Text style={styles.futureBannerSub}>اكتشف نيوم، القدية، البحر الأحمر وغيرها</Text>
        </View>
        <Feather name="arrow-left" size={18} color={Colors.white} />
      </Pressable>

      {/* ─── Platform Rating ─── */}
      {platformRating && (
        <View style={styles.ratingBanner}>
          <View style={styles.ratingStars}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Feather key={i} name="star" size={16} color={i < Math.round(platformRating.avgRating ?? 4.8) ? Colors.gold : Colors.border} />
            ))}
          </View>
          <Text style={styles.ratingScore}>{platformRating.avgRating?.toFixed(1) ?? '4.8'}</Text>
          <Text style={styles.ratingCount}>{platformRating.totalRatings ?? platformRating.count ?? 0} تقييم</Text>
          <Text style={styles.ratingLabel}>تقييم المستخدمين لمنصة عقار إنسايت</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerBrand: { alignItems: 'center' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.white, textAlign: 'center' },
  searchWrap: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16, paddingHorizontal: 14, height: 48,
    marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', gap: 8,
  },
  searchInput: { flex: 1, color: Colors.white, fontSize: 14 },
  searchBtn: { padding: 2 },
  pillsRow: { flexDirection: 'row-reverse', gap: 8 },
  pill: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  pillActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  pillText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },
  pillTextActive: { color: Colors.white },
  statsRow: {
    flexDirection: 'row-reverse', paddingHorizontal: 16, paddingVertical: 12, gap: 10,
  },
  scoreCard: {
    backgroundColor: Colors.card, borderRadius: 18, padding: 12,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  scoreCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.teal,
  },
  scoreNum: { fontSize: 18, fontWeight: '900', color: Colors.white },
  scoreTitle: { fontSize: 11, color: Colors.textMuted, textAlign: 'right' },
  scoreLabel: { fontSize: 14, fontWeight: '800', color: Colors.teal, textAlign: 'right' },
  kpiMini: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 18, padding: 12,
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-around',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  kpiMiniItem: { alignItems: 'center', gap: 2 },
  kpiMiniValue: { fontSize: 16, fontWeight: '800', color: Colors.navy },
  kpiMiniLabel: { fontSize: 10, color: Colors.textMuted },
  kpiMiniDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  section: { paddingHorizontal: 16, marginBottom: 12 },
  sectionHeader: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  seeAll: { fontSize: 13, color: Colors.teal, fontWeight: '600' },
  quickGrid: {
    flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 0,
  },
  quickItem: {
    width: '25%', alignItems: 'center', paddingVertical: 12, gap: 6,
  },
  quickIcon: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  quickLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSub, textAlign: 'center' },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12 },
  emptyWrap: { alignItems: 'center', paddingVertical: 30, gap: 10 },
  emptyText: { fontSize: 13, color: Colors.textMuted },
  insightCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 14,
    flexDirection: 'row-reverse', gap: 10, alignItems: 'flex-start',
    borderRightWidth: 3, borderRightColor: Colors.teal,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  insightIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(15,123,160,0.1)', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  insightText: { flex: 1, fontSize: 13, color: Colors.textSub, textAlign: 'right', lineHeight: 20 },
  ctaBanner: {
    marginHorizontal: 16, marginBottom: 8, backgroundColor: Colors.navy,
    borderRadius: 20, padding: 18, flexDirection: 'row-reverse',
    alignItems: 'center', justifyContent: 'space-between',
    overflow: 'hidden',
  },
  ctaContent: { flex: 1 },
  ctaTitle: { fontSize: 16, fontWeight: '800', color: Colors.white, textAlign: 'right' },
  ctaDesc: { fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'right', marginTop: 4 },
  ctaBtn: {
    backgroundColor: Colors.teal, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
  },
  ctaBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  servicesRow: { flexDirection: 'row-reverse', gap: 10 },
  serviceCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 12, alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  serviceIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: `${Colors.gold}15`, alignItems: 'center', justifyContent: 'center' },
  serviceName: { fontSize: 11, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  serviceCity: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  serviceRating: { fontSize: 10, color: Colors.gold, fontWeight: '600' },
  requestRow: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 12, marginBottom: 6,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1,
  },
  requestDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success },
  requestInfo: { flex: 1 },
  requestTitle: { fontSize: 13, fontWeight: '600', color: Colors.text, textAlign: 'right' },
  requestMeta: { fontSize: 11, color: Colors.textMuted, textAlign: 'right', marginTop: 2 },
  futureBanner: {
    marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.gold,
    borderRadius: 18, padding: 16, flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
  },
  futureBannerEmoji: { fontSize: 28 },
  futureBannerContent: { flex: 1 },
  futureBannerTitle: { fontSize: 15, fontWeight: '800', color: Colors.navy },
  futureBannerSub: { fontSize: 11, color: Colors.navyMid, marginTop: 2 },
  ratingBanner: {
    marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.card, borderRadius: 16,
    padding: 14, alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  ratingStars: { flexDirection: 'row-reverse', gap: 4 },
  ratingScore: { fontSize: 28, fontWeight: '900', color: Colors.navy },
  ratingCount: { fontSize: 12, color: Colors.textMuted },
  ratingLabel: { fontSize: 11, color: Colors.textSub, textAlign: 'center' },
});
