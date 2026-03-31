import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
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
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');

/* ──────────── helpers ──────────── */
function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'صباح الخير';
  if (h < 17) return 'مساء النور';
  return 'مساء الخير';
}

function getMarketInsight(score?: number): { text: string; subText: string; color: string; icon: string } {
  if (!score) return { text: 'يتم تحليل السوق...', subText: 'البيانات قيد المعالجة', color: Colors.textMuted, icon: 'activity' };
  if (score >= 80) return { text: 'السوق نشط جداً', subText: 'الطلب في ذروته — فرص استثمارية ممتازة', color: '#10B981', icon: 'trending-up' };
  if (score >= 65) return { text: 'السوق قوي', subText: 'نشاط مرتفع في معظم الأحياء', color: Colors.teal, icon: 'trending-up' };
  if (score >= 50) return { text: 'السوق متوازن', subText: 'فرص جيدة للمشترين والمستثمرين', color: Colors.gold, icon: 'minus' };
  return { text: 'السوق هادئ', subText: 'وقت مثالي للتفاوض وشراء بأسعار مناسبة', color: '#f59e0b', icon: 'trending-down' };
}

const PROPERTY_CATEGORIES = [
  { icon: 'home', label: 'شقة', key: 'شقة' },
  { icon: 'home', label: 'فيلا', key: 'فيلا' },
  { icon: 'square', label: 'أرض', key: 'أرض' },
  { icon: 'briefcase', label: 'تجاري', key: 'عقار تجاري' },
  { icon: 'monitor', label: 'مكتب', key: 'مكتب' },
  { icon: 'package', label: 'مستودع', key: 'مستودع' },
  { icon: 'layers', label: 'دوبلكس', key: 'دوبلكس' },
  { icon: 'server', label: 'عمارة', key: 'عمارة' },
];

const MAIN_ACTIONS = [
  { icon: 'bar-chart-2', label: 'تحليلات السوق', sub: 'رؤى وبيانات', path: '/analytics', color: Colors.teal, bg: 'rgba(15,123,160,0.12)' },
  { icon: 'layers', label: 'مقارنة الأحياء', sub: 'خريطة حرارية', path: '/districts', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { icon: 'users', label: 'المسوّقون', sub: 'وكلاء معتمدون', path: '/marketers', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { icon: 'inbox', label: 'طلبات العملاء', sub: 'ابحث وتواصل', path: '/requests', color: Colors.gold, bg: 'rgba(201,168,76,0.12)' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  /* ── Data Queries ── */
  const { data: featData, isLoading: featLoading, refetch, isRefetching } = useQuery<ListingsResponse>({
    queryKey: ['home-featured'],
    queryFn: () => fetchListings(new URLSearchParams({ limit: '6', page: '1', listingType: 'sale' })),
  });

  const { data: recentData, isLoading: recentLoading } = useQuery<ListingsResponse>({
    queryKey: ['home-recent'],
    queryFn: () => fetchListings(new URLSearchParams({ limit: '4', page: '1' })),
  });

  const { data: analytics } = useQuery<AnalyticsInsights>({
    queryKey: ['analytics-home'],
    queryFn: () => apiFetch<AnalyticsInsights>(endpoints.analyticsInsights),
    staleTime: 1000 * 60 * 10,
  });

  const { data: services } = useQuery<ServiceProvider[]>({
    queryKey: ['home-services'],
    queryFn: () => apiFetch<any>(`${endpoints.services}?limit=4&page=1`).then((r: any) => r.data ?? r ?? []),
    staleTime: 1000 * 60 * 10,
  });

  const { data: recentRequests } = useQuery<CustomerRequest[]>({
    queryKey: ['home-requests'],
    queryFn: () => apiFetch<any>(endpoints.requests + '?limit=3&status=open').then((r: any) => r.data ?? r ?? []),
    staleTime: 1000 * 60 * 5,
  });

  const featuredListings = featData?.listings ?? [];
  const recentListings = recentData?.listings ?? [];
  const kpis = analytics?.kpis;
  const marketScore = analytics?.marketScore?.score;
  const insight = getMarketInsight(marketScore);

  const handleSearch = () => {
    if (search.trim()) {
      router.push({ pathname: '/(tabs)/listings', params: { q: search } });
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: botPad + 30 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.teal} />}
    >
      {/* ═══ HEADER ═══ */}
      <LinearGradient
        colors={[Colors.navyDark, Colors.navy, '#0D2040']}
        style={[styles.header, { paddingTop: topPad + 14 }]}
      >
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.hBtn}>
            <Feather name="user" size={19} color={Colors.white} />
          </Pressable>
          <View style={styles.brandWrap}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandTitle}>عقار إنسايت</Text>
          </View>
          <Pressable onPress={() => router.push('/notifications')} style={styles.hBtn}>
            <Feather name="bell" size={19} color={Colors.white} />
          </Pressable>
        </View>

        {/* Greeting */}
        <View style={styles.greetWrap}>
          <Text style={styles.greetText}>
            {getGreeting()}{user?.fullName ? `، ${user.fullName.split(' ')[0]}` : ' بك'}
          </Text>
          <Text style={styles.greetSub}>ابحث عن عقارك المثالي اليوم</Text>
        </View>

        {/* Search bar */}
        <Pressable style={styles.searchBar} onPress={() => router.push('/(tabs)/listings')}>
          <Feather name="search" size={17} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث: حي، مدينة، نوع عقار..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            textAlign="right"
          />
        </Pressable>

        {/* Sale / Rent pills */}
        <View style={styles.pillsRow}>
          {[{ k: '', l: 'الكل' }, { k: 'sale', l: 'للبيع' }, { k: 'rent', l: 'للإيجار' }].map(({ k, l }) => (
            <Pressable
              key={l}
              style={styles.pill}
              onPress={() => router.push({ pathname: '/(tabs)/listings', params: k ? { listingType: k } : {} })}
            >
              <Text style={styles.pillText}>{l}</Text>
            </Pressable>
          ))}
        </View>
      </LinearGradient>

      {/* ═══ MARKET PULSE CARD ═══ */}
      {kpis && (
        <Pressable style={styles.pulseCard} onPress={() => router.push('/analytics')}>
          <LinearGradient
            colors={[Colors.navyMid, '#0D2040']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.pulseGradient}
          >
            <View style={styles.pulseRight}>
              <View style={styles.pulseIconWrap}>
                <Feather name={insight.icon as any} size={20} color={insight.color} />
              </View>
              <View style={styles.pulseTexts}>
                <Text style={[styles.pulseMainText, { color: insight.color }]}>{insight.text}</Text>
                <Text style={styles.pulseSubText}>{insight.subText}</Text>
              </View>
            </View>
            <View style={styles.pulseStats}>
              <View style={styles.pulseStat}>
                <Text style={styles.pulseStatVal}>{kpis.totalListings}</Text>
                <Text style={styles.pulseStatLbl}>عقار</Text>
              </View>
              <View style={styles.pulseDivider} />
              <View style={styles.pulseStat}>
                <Text style={styles.pulseStatVal}>{formatPrice(kpis.avgPrice)}</Text>
                <Text style={styles.pulseStatLbl}>متوسط ر.س</Text>
              </View>
              <View style={styles.pulseDivider} />
              <View style={styles.pulseStat}>
                <Text style={styles.pulseStatVal}>{kpis.newLast7Days}</Text>
                <Text style={styles.pulseStatLbl}>جديد</Text>
              </View>
            </View>
            <View style={styles.pulseLink}>
              <Text style={styles.pulseLinkText}>عرض التحليل الكامل</Text>
              <Feather name="arrow-left" size={12} color={Colors.teal} />
            </View>
          </LinearGradient>
        </Pressable>
      )}

      {/* ═══ MAIN ACTIONS (2×2 GRID) ═══ */}
      <View style={styles.section}>
        <View style={styles.actionsGrid}>
          {MAIN_ACTIONS.map((a) => (
            <Pressable
              key={a.label}
              style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
              onPress={() => router.push(a.path as any)}
            >
              <View style={[styles.actionIconBg, { backgroundColor: a.bg }]}>
                <Feather name={a.icon as any} size={22} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
              <Text style={styles.actionSub}>{a.sub}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ═══ PROPERTY TYPE CATEGORIES ═══ */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>تصفح حسب النوع</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
        {PROPERTY_CATEGORIES.map((cat) => (
          <Pressable
            key={cat.key}
            style={({ pressed }) => [styles.catCard, pressed && styles.pressed]}
            onPress={() => router.push({ pathname: '/(tabs)/listings', params: { propertyType: cat.key } })}
          >
            <View style={styles.catIconWrap}>
              <Feather name={cat.icon as any} size={18} color={Colors.teal} />
            </View>
            <Text style={styles.catLabel}>{cat.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ═══ FEATURED LISTINGS CAROUSEL ═══ */}
      <View style={styles.sectionHeaderRow}>
        <Pressable onPress={() => router.push({ pathname: '/(tabs)/listings', params: { listingType: 'sale' } })}>
          <Text style={styles.seeAll}>عرض الكل</Text>
        </Pressable>
        <Text style={styles.sectionTitle}>عقارات للبيع</Text>
      </View>
      {featLoading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featScroll}>
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} variant="featured" />)}
        </ScrollView>
      ) : featuredListings.length === 0 ? (
        <View style={styles.emptyInline}>
          <Feather name="home" size={28} color={Colors.textMuted} />
          <Text style={styles.emptyInlineText}>لا توجد عقارات حالياً</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featScroll}>
          {featuredListings.map((item) => (
            <ListingCard
              key={item.id}
              listing={item}
              variant="featured"
              onPress={() => router.push({ pathname: '/listing/[id]', params: { id: String(item.id) } })}
            />
          ))}
        </ScrollView>
      )}

      {/* ═══ SMART INSIGHT BANNER ═══ */}
      {analytics?.smartInsights && analytics.smartInsights.length > 0 && (
        <Pressable style={styles.insightBanner} onPress={() => router.push('/analytics')}>
          <View style={styles.insightLeft}>
            <Feather name="cpu" size={16} color={Colors.teal} />
          </View>
          <Text style={styles.insightText} numberOfLines={2}>
            {analytics.smartInsights[0]}
          </Text>
          <Feather name="arrow-left" size={14} color={Colors.teal} />
        </Pressable>
      )}

      {/* ═══ RECENT LISTINGS GRID ═══ */}
      <View style={styles.sectionHeaderRow}>
        <Pressable onPress={() => router.push('/(tabs)/listings')}>
          <Text style={styles.seeAll}>عرض الكل</Text>
        </Pressable>
        <Text style={styles.sectionTitle}>أحدث العقارات</Text>
      </View>
      {recentLoading ? (
        <View style={styles.gridWrap}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </View>
      ) : recentListings.length === 0 ? null : (
        <View style={styles.gridWrap}>
          {recentListings.map((item) => (
            <ListingCard
              key={item.id}
              listing={item}
              onPress={() => router.push({ pathname: '/listing/[id]', params: { id: String(item.id) } })}
            />
          ))}
        </View>
      )}

      {/* ═══ MORE QUICK LINKS ═══ */}
      <View style={styles.linksRow}>
        {[
          { icon: 'map', label: 'الخريطة', path: '/(tabs)/map', color: Colors.navy },
          { icon: 'grid', label: 'كل العقارات', path: '/(tabs)/listings', color: Colors.teal },
          { icon: 'compass', label: 'استكشف', path: '/(tabs)/discover', color: '#8b5cf6' },
          { icon: 'heart', label: 'المفضلة', path: '/(tabs)/favorites', color: '#e11d48' },
        ].map((l) => (
          <Pressable
            key={l.label}
            style={({ pressed }) => [styles.linkBtn, pressed && styles.pressed]}
            onPress={() => router.push(l.path as any)}
          >
            <View style={[styles.linkIcon, { backgroundColor: `${l.color}15` }]}>
              <Feather name={l.icon as any} size={18} color={l.color} />
            </View>
            <Text style={styles.linkLabel}>{l.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* ═══ SERVICES PREVIEW ═══ */}
      {services && services.length > 0 && (
        <>
          <View style={styles.sectionHeaderRow}>
            <Pressable onPress={() => router.push('/services')}>
              <Text style={styles.seeAll}>عرض الكل</Text>
            </Pressable>
            <Text style={styles.sectionTitle}>مزودو الخدمات</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servScroll}>
            {services.slice(0, 4).map((s) => (
              <Pressable
                key={s.id}
                style={({ pressed }) => [styles.servCard, pressed && styles.pressed]}
                onPress={() => router.push({ pathname: '/services/[id]', params: { id: String(s.id) } })}
              >
                <View style={styles.servIcon}>
                  <Feather name="briefcase" size={20} color={Colors.gold} />
                </View>
                <Text style={styles.servName} numberOfLines={2}>{s.businessName}</Text>
                <Text style={styles.servCity}>{s.city}</Text>
                {s.ratingAvg ? (
                  <View style={styles.servRating}>
                    <Feather name="star" size={10} color={Colors.gold} />
                    <Text style={styles.servRatingText}>{s.ratingAvg.toFixed(1)}</Text>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      {/* ═══ CUSTOMER REQUESTS ═══ */}
      {recentRequests && recentRequests.length > 0 && (
        <>
          <View style={styles.sectionHeaderRow}>
            <Pressable onPress={() => router.push('/requests')}>
              <Text style={styles.seeAll}>عرض الكل</Text>
            </Pressable>
            <Text style={styles.sectionTitle}>طلبات العملاء</Text>
          </View>
          <View style={styles.reqWrap}>
            {recentRequests.slice(0, 3).map((r) => (
              <Pressable
                key={r.id}
                style={({ pressed }) => [styles.reqCard, pressed && styles.pressed]}
                onPress={() => router.push({ pathname: '/requests/[id]', params: { id: String(r.id) } })}
              >
                <View style={styles.reqDot} />
                <View style={styles.reqInfo}>
                  <Text style={styles.reqTitle} numberOfLines={1}>{r.title}</Text>
                  <Text style={styles.reqMeta}>{r.city ?? '—'} · {new Date(r.createdAt).toLocaleDateString('ar-SA')}</Text>
                </View>
                <Feather name="chevron-left" size={14} color={Colors.textMuted} />
              </Pressable>
            ))}
          </View>
        </>
      )}

      {/* ═══ CTA BANNERS ═══ */}
      <View style={styles.ctaRow}>
        <Pressable style={styles.ctaAdd} onPress={() => router.push('/requests/new')}>
          <LinearGradient colors={[Colors.teal, Colors.tealDim]} style={styles.ctaGrad}>
            <Feather name="plus-circle" size={22} color={Colors.white} />
            <Text style={styles.ctaTitle}>أضف طلبك</Text>
            <Text style={styles.ctaSub}>تواصل مع مسوّقين</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },

  /* Header */
  header: { paddingHorizontal: 20, paddingBottom: 28 },
  headerTop: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  hBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  brandWrap: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  brandLogo: { width: 32, height: 32 },
  brandTitle: { fontSize: 18, fontWeight: '900', color: Colors.white, letterSpacing: -0.3 },
  greetWrap: { marginBottom: 16, alignItems: 'flex-end' },
  greetText: { fontSize: 22, fontWeight: '800', color: Colors.white, textAlign: 'right' },
  greetSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'right', marginTop: 3 },
  searchBar: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16, paddingHorizontal: 14, height: 50,
    marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  searchInput: { flex: 1, color: Colors.white, fontSize: 14 },
  pillsRow: { flexDirection: 'row-reverse', gap: 8 },
  pill: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  pillText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },

  /* Market Pulse Card */
  pulseCard: { marginHorizontal: 16, marginTop: 16, marginBottom: 6, borderRadius: 22, overflow: 'hidden', shadowColor: Colors.navy, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 8 },
  pulseGradient: { padding: 18 },
  pulseRight: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 16 },
  pulseIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  pulseTexts: { flex: 1, alignItems: 'flex-end' },
  pulseMainText: { fontSize: 18, fontWeight: '900', textAlign: 'right' },
  pulseSubText: { fontSize: 12, color: 'rgba(255,255,255,0.55)', textAlign: 'right', marginTop: 3 },
  pulseStats: { flexDirection: 'row-reverse', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 14, marginBottom: 12 },
  pulseStat: { alignItems: 'center', gap: 3 },
  pulseStatVal: { fontSize: 18, fontWeight: '900', color: Colors.white },
  pulseStatLbl: { fontSize: 10, color: 'rgba(255,255,255,0.45)' },
  pulseDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  pulseLink: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  pulseLinkText: { fontSize: 12, color: Colors.teal, fontWeight: '700' },

  /* Main actions */
  section: { paddingHorizontal: 16, marginBottom: 4, marginTop: 16 },
  actionsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: (width - 42) / 2,
    backgroundColor: Colors.card, borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  actionIconBg: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10, alignSelf: 'flex-end' },
  actionLabel: { fontSize: 14, fontWeight: '800', color: Colors.text, textAlign: 'right' },
  actionSub: { fontSize: 11, color: Colors.textMuted, textAlign: 'right', marginTop: 3 },

  /* Section headers */
  sectionHeaderRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginTop: 22, marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  seeAll: { fontSize: 13, color: Colors.teal, fontWeight: '600' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },

  /* Property categories */
  catScroll: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  catCard: {
    alignItems: 'center', gap: 7,
    backgroundColor: Colors.card, borderRadius: 16, padding: 14, width: 80,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  catIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(15,123,160,0.1)', alignItems: 'center', justifyContent: 'center' },
  catLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSub, textAlign: 'center' },

  /* Featured carousel */
  featScroll: { paddingHorizontal: 20, paddingBottom: 4 },

  /* Insight banner */
  insightBanner: {
    marginHorizontal: 16, marginTop: 16, marginBottom: 4,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    borderRightWidth: 3, borderRightColor: Colors.teal,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  insightLeft: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(15,123,160,0.1)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  insightText: { flex: 1, fontSize: 13, color: Colors.textSub, textAlign: 'right', lineHeight: 20 },

  /* Recent grid */
  gridWrap: { paddingHorizontal: 16, flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12 },
  emptyInline: { alignItems: 'center', paddingVertical: 30, gap: 10 },
  emptyInlineText: { fontSize: 13, color: Colors.textMuted },

  /* More links row */
  linksRow: { flexDirection: 'row-reverse', paddingHorizontal: 16, gap: 8, marginTop: 20, justifyContent: 'space-between' },
  linkBtn: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: Colors.card, borderRadius: 14, paddingVertical: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2 },
  linkIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { fontSize: 10, fontWeight: '700', color: Colors.textSub, textAlign: 'center' },

  /* Services */
  servScroll: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  servCard: {
    width: 120, backgroundColor: Colors.card, borderRadius: 16, padding: 14,
    alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  servIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: 'rgba(201,168,76,0.1)', alignItems: 'center', justifyContent: 'center' },
  servName: { fontSize: 11, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  servCity: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  servRating: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3 },
  servRatingText: { fontSize: 11, color: Colors.gold, fontWeight: '700' },

  /* Customer requests */
  reqWrap: { paddingHorizontal: 16, gap: 8 },
  reqCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  reqDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.success, flexShrink: 0 },
  reqInfo: { flex: 1 },
  reqTitle: { fontSize: 13, fontWeight: '700', color: Colors.text, textAlign: 'right' },
  reqMeta: { fontSize: 11, color: Colors.textMuted, textAlign: 'right', marginTop: 3 },

  /* CTA Banners */
  ctaRow: { flexDirection: 'row-reverse', paddingHorizontal: 16, gap: 10, marginTop: 24 },
  ctaAdd: { flex: 1, borderRadius: 18, overflow: 'hidden', shadowColor: Colors.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6 },
  ctaGrad: { padding: 20, alignItems: 'center', gap: 6 },
  ctaTitle: { fontSize: 15, fontWeight: '900', color: Colors.white, textAlign: 'center' },
  ctaSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
});
