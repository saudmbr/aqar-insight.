import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState, useRef } from 'react';
import {
  Dimensions,
  FlatList,
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
  fetchListings,
  apiFetch,
  endpoints,
  formatPrice,
  PROPERTY_TYPES,
} from '@/constants/api';
import { AppLogo } from '@/components/AppLogo';
import { ListingCard } from '@/components/ListingCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { useAuth } from '@/context/AuthContext';

const { width: W } = Dimensions.get('window');
const FEAT_CARD_W = W * 0.72;

const DEAL_TYPES = [
  { key: '', label: 'الكل' },
  { key: 'sale', label: 'للبيع' },
  { key: 'rent', label: 'للإيجار' },
];

const QUICK_CATS = [
  { icon: '🏠', label: 'شقق', key: 'شقة' },
  { icon: '🏡', label: 'فلل', key: 'فيلا' },
  { icon: '🏢', label: 'تجاري', key: 'عقار تجاري' },
  { icon: '🏗️', label: 'أراضي', key: 'أرض' },
  { icon: '🏬', label: 'مكاتب', key: 'مكتب' },
  { icon: '🏘️', label: 'دوبلكس', key: 'دوبلكس' },
  { icon: '🏛️', label: 'عمارات', key: 'عمارة' },
  { icon: '🏭', label: 'مستودع', key: 'مستودع' },
];

const QUICK_ACTIONS = [
  { icon: 'bar-chart-2', label: 'التحليلات', path: '/analytics', color: Colors.teal, bg: 'rgba(15,123,160,0.15)' },
  { icon: 'layers', label: 'الأحياء', path: '/districts', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { icon: 'users', label: 'المسوّقون', path: '/marketers', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { icon: 'file-text', label: 'الطلبات', path: '/requests', color: Colors.gold, bg: 'rgba(201,168,76,0.12)' },
  { icon: 'database', label: 'السجلات', path: '/records', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { icon: 'zap', label: 'المستقبل', path: '/future', color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
];

const RIYADH_HERO_IMAGES = [
  {
    id: 'kafd',
    title: 'واجهة الرياض العقارية',
    subtitle: 'مشاهد مختارة من أفق الرياض وأحيائها الحديثة',
    stat: 'الرياض',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Riyadh%20North%20Skyline%20.jpg',
  },
  {
    id: 'skyline',
    title: 'اكتشف فرص الرياض',
    subtitle: 'فلل وشقق وأراضٍ في شمال الرياض ووسطها وشرقها',
    stat: 'أحياء مميزة',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Riyadh%20from%20kingdom%20tower.jpg',
  },
  {
    id: 'boulevard',
    title: 'نبض السوق في العاصمة',
    subtitle: 'تنقّل بين العروض الأقرب لأسلوب حياتك في مدينة الرياض',
    stat: 'عروض يومية',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/The%20Boulevard%20Riyadh%20-%202021.jpg',
  },
];

const WHY_CARDS = [
  { id: 1, icon: 'shield', color: '#10b981', bg: 'rgba(16,185,129,0.12)', title: 'بيانات موثّقة', desc: 'إعلانات مراجعة ومعلومات شفافة عن كل عقار' },
  { id: 2, icon: 'map-pin', color: Colors.teal, bg: 'rgba(15,123,160,0.12)', title: 'خريطة تفاعلية', desc: 'تصفح العقارات على خريطة حية مع تفاصيل دقيقة' },
  { id: 3, icon: 'bar-chart-2', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', title: 'تحليلات السوق', desc: 'مؤشرات وتقارير اقتصادية لاتخاذ قرارات أفضل' },
  { id: 4, icon: 'users', color: Colors.gold, bg: 'rgba(201,168,76,0.12)', title: 'مسوّقون معتمدون', desc: 'تواصل مباشر مع أفضل المسوّقين العقاريين في المملكة' },
];

function getMarketLabel(score?: number): { text: string; color: string; icon: string } {
  if (!score) return { text: 'تحليل السوق', color: Colors.textMuted, icon: 'activity' };
  if (score >= 80) return { text: 'السوق نشط جداً', color: '#10B981', icon: 'trending-up' };
  if (score >= 65) return { text: 'السوق قوي', color: Colors.teal, icon: 'trending-up' };
  if (score >= 50) return { text: 'السوق متوازن', color: Colors.gold, icon: 'minus' };
  return { text: 'السوق هادئ', color: '#f59e0b', icon: 'trending-down' };
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [search, setSearch] = useState('');
  const [dealType, setDealType] = useState('');
  const [propType, setPropType] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);

  /* ── Data ── */
  const { data: featData, isLoading: featLoading, refetch, isRefetching } = useQuery<ListingsResponse>({
    queryKey: ['home-featured-v2'],
    queryFn: () => fetchListings(new URLSearchParams({ limit: '8', page: '1', featured: 'true' })),
  });

  const { data: recentData, isLoading: recentLoading } = useQuery<ListingsResponse>({
    queryKey: ['home-recent-v2'],
    queryFn: () => fetchListings(new URLSearchParams({ limit: '4', page: '1', sort: 'newest' })),
  });

  const { data: analytics } = useQuery<AnalyticsInsights>({
    queryKey: ['analytics-home-v2'],
    queryFn: () => apiFetch<AnalyticsInsights>(endpoints.analyticsInsights),
    staleTime: 1000 * 60 * 10,
  });

  const featuredListings = featData?.listings ?? recentData?.listings ?? [];
  const recentListings = recentData?.listings?.slice(0, 4) ?? [];
  const kpis = analytics?.kpis;
  const marketScore = analytics?.marketScore?.score;
  const insight = getMarketLabel(marketScore);
  const activeHero = RIYADH_HERO_IMAGES[heroIndex] ?? RIYADH_HERO_IMAGES[0];

  const handleSearch = () => {
    const params: Record<string, string> = {};
    if (search.trim()) params.q = search.trim();
    if (dealType) params.listingType = dealType;
    if (propType) params.propertyType = propType;
    router.push({ pathname: '/(tabs)/listings', params });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: botPad + 30 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.teal} />}
    >
      {/* ════════════════ HERO SECTION ════════════════ */}
      <View style={styles.heroWrap}>
        {/* Background image */}
        <Image
          source={{ uri: activeHero.image }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        {/* Dark overlay gradient */}
        <LinearGradient
          colors={['rgba(6,13,28,0.25)', 'rgba(6,13,28,0.55)', 'rgba(6,13,28,0.95)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Top bar */}
        <View style={[styles.heroTopBar, { paddingTop: topPad + 10 }]}>
          <Pressable style={styles.hBtn} onPress={() => router.push('/notifications')}>
            <Feather name="bell" size={20} color={Colors.white} />
          </Pressable>
          <View style={styles.brandRow}>
            <Text style={styles.brandTitle}>عقار إنسايت</Text>
            <AppLogo size={34} style={styles.brandLogoBox} imageStyle={styles.brandLogoImage} />
          </View>
          <Pressable style={styles.hBtn} onPress={() => router.push('/(tabs)/profile')}>
            <Feather name="user" size={20} color={Colors.white} />
          </Pressable>
        </View>

        {/* Hero Text */}
        <View style={styles.heroContent}>
          <Text style={styles.heroSuper}>منصة العقارات الذكية في السعودية</Text>
          <Text style={styles.heroTitle}>اعثر على عقارك{'\n'}المثالي</Text>
          <Text style={styles.heroSub}>
            تصفح آلاف الإعلانات العقارية الموثّقة في كل مناطق المملكة
          </Text>
        </View>

        {/* ── SEARCH PANEL ── */}
        <View style={styles.heroOverlayBlock}>
          <View style={styles.heroPill}>
            <Feather name="map-pin" size={12} color={Colors.white} />
            <Text style={styles.heroPillText}>{activeHero.stat}</Text>
          </View>
          <Text style={styles.heroOverlaySuper}>سوق عقاري حي من قلب الرياض</Text>
          <Text style={styles.heroOverlayTitle}>{activeHero.title}</Text>
          <Text style={styles.heroOverlaySub}>{activeHero.subtitle}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.heroThumbsRow}
          style={styles.heroThumbsScroll}
        >
          {RIYADH_HERO_IMAGES.map((item, index) => (
            <Pressable
              key={item.id}
              style={[styles.heroThumbCard, heroIndex === index && styles.heroThumbCardActive]}
              onPress={() => setHeroIndex(index)}
            >
              <Image source={{ uri: item.image }} style={styles.heroThumbImage} contentFit="cover" />
              <LinearGradient colors={['transparent', 'rgba(11,22,40,0.92)']} style={styles.heroThumbOverlay} />
              <Text style={styles.heroThumbTitle} numberOfLines={1}>{item.title}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.searchPanel}>
          {/* Deal type tabs */}
          <View style={styles.dealTabs}>
            {DEAL_TYPES.map(dt => (
              <Pressable
                key={dt.key}
                style={[styles.dealTab, dealType === dt.key && styles.dealTabActive]}
                onPress={() => setDealType(dt.key)}
              >
                <Text style={[styles.dealTabText, dealType === dt.key && styles.dealTabTextActive]}>
                  {dt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Search input */}
          <View style={styles.searchRow}>
            <Feather name="search" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="ابحث بالحي، المدينة، أو نوع العقار..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              textAlign="right"
            />
          </View>

          {/* Property type chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.propScroll} contentContainerStyle={{ paddingHorizontal: 4 }}>
            {(['', ...PROPERTY_TYPES.slice(0, 6)]).map(pt => (
              <Pressable
                key={pt}
                style={[styles.propChip, propType === pt && styles.propChipActive]}
                onPress={() => setPropType(pt)}
              >
                <Text style={[styles.propChipText, propType === pt && styles.propChipTextActive]}>{pt || 'كل الأنواع'}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Search button */}
          <Pressable style={styles.searchBtn} onPress={handleSearch}>
            <Feather name="search" size={16} color="#fff" />
            <Text style={styles.searchBtnText}>بحث عن العقارات</Text>
          </Pressable>
        </View>
      </View>

      {/* ════════════════ QUICK STATS BAND ════════════════ */}
      <LinearGradient colors={[Colors.navyDark, Colors.navy]} style={styles.statsBand}>
        <Pressable style={styles.statBandItem} onPress={() => router.push('/analytics')}>
          <Text style={styles.statBandValue}>{kpis?.totalListings ?? '-'}</Text>
          <Text style={styles.statBandLabel}>عقار</Text>
        </Pressable>
        <View style={styles.statBandDiv} />
        <Pressable style={styles.statBandItem} onPress={() => router.push('/analytics')}>
          <Text style={styles.statBandValue}>{kpis?.avgPrice ? formatPrice(kpis.avgPrice) : '-'}</Text>
          <Text style={styles.statBandLabel}>متوسط السعر</Text>
        </Pressable>
        <View style={styles.statBandDiv} />
        <Pressable style={styles.statBandItem} onPress={() => router.push('/analytics')}>
          <View style={styles.marketBadge}>
            <Feather name={insight.icon as any} size={12} color={insight.color} />
            <Text style={[styles.marketBadgeText, { color: insight.color }]}>{insight.text}</Text>
          </View>
          <Text style={styles.statBandLabel}>حالة السوق</Text>
        </Pressable>
      </LinearGradient>

      {/* ════════════════ FEATURED LISTINGS ════════════════ */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Pressable onPress={() => router.push('/(tabs)/listings')} style={styles.seeAllBtn}>
            <Text style={styles.seeAllText}>عرض الكل</Text>
            <Feather name="chevron-left" size={14} color={Colors.teal} />
          </Pressable>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>عقارات مميزة</Text>
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>⭐ مميز</Text>
            </View>
          </View>
        </View>

        {featLoading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
            {[1, 2, 3].map(i => <View key={i} style={{ width: FEAT_CARD_W }}><SkeletonCard /></View>)}
          </ScrollView>
        ) : (
          <FlatList
            horizontal
            data={featuredListings.slice(0, 8)}
            keyExtractor={item => `feat-${item.id}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            renderItem={({ item }) => (
              <View style={{ width: FEAT_CARD_W }}>
                <ListingCard
                  listing={item}
                  onPress={() => router.push(`/listing/${item.id}`)}
                />
              </View>
            )}
          />
        )}
      </View>

      {/* ════════════════ QUICK CATEGORIES ════════════════ */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View />
          <Text style={styles.sectionTitle}>تصفح حسب النوع</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {QUICK_CATS.map(cat => (
            <Pressable
              key={cat.key}
              style={styles.catCard}
              onPress={() => router.push({ pathname: '/(tabs)/listings', params: { propertyType: cat.key } })}
            >
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text style={styles.catLabel}>{cat.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ════════════════ MARKET INSIGHTS ════════════════ */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Pressable onPress={() => router.push('/analytics')} style={styles.seeAllBtn}>
            <Text style={styles.seeAllText}>تفاصيل</Text>
            <Feather name="chevron-left" size={14} color={Colors.teal} />
          </Pressable>
          <Text style={styles.sectionTitle}>مؤشرات السوق</Text>
        </View>

        <Pressable style={styles.insightCard} onPress={() => router.push('/analytics')}>
          <LinearGradient colors={[Colors.navyDark, '#0D2040']} style={styles.insightGrad}>
            <View style={styles.insightTop}>
              <View>
                <Text style={styles.insightScore}>{marketScore ?? 70}</Text>
                <Text style={styles.insightScoreLabel}>مؤشر السوق</Text>
              </View>
              <View style={styles.insightPulse}>
                <Feather name={insight.icon as any} size={24} color={insight.color} />
                <Text style={[styles.insightStatus, { color: insight.color }]}>{insight.text}</Text>
              </View>
            </View>
            <View style={styles.insightStatsRow}>
              <View style={styles.insightStat}>
                <Text style={styles.insightStatVal}>{kpis?.totalListings ?? 14}</Text>
                <Text style={styles.insightStatLabel}>عقار متاح</Text>
              </View>
              <View style={styles.insightStatDiv} />
              <View style={styles.insightStat}>
                <Text style={styles.insightStatVal}>{kpis?.saleCount ?? '-'}</Text>
                <Text style={styles.insightStatLabel}>للبيع</Text>
              </View>
              <View style={styles.insightStatDiv} />
              <View style={styles.insightStat}>
                <Text style={styles.insightStatVal}>{kpis?.rentCount ?? '-'}</Text>
                <Text style={styles.insightStatLabel}>للإيجار</Text>
              </View>
              <View style={styles.insightStatDiv} />
              <View style={styles.insightStat}>
                <Text style={styles.insightStatVal}>{kpis?.newLast30Days ?? '-'}</Text>
                <Text style={styles.insightStatLabel}>هذا الشهر</Text>
              </View>
            </View>
            <View style={styles.insightCTA}>
              <Feather name="bar-chart-2" size={12} color={Colors.teal} />
              <Text style={styles.insightCTAText}>عرض التحليل الكامل</Text>
              <Feather name="chevron-left" size={12} color={Colors.teal} />
            </View>
          </LinearGradient>
        </Pressable>
      </View>

      {/* ════════════════ RECENT LISTINGS ════════════════ */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Pressable onPress={() => router.push('/(tabs)/listings')} style={styles.seeAllBtn}>
            <Text style={styles.seeAllText}>عرض الكل</Text>
            <Feather name="chevron-left" size={14} color={Colors.teal} />
          </Pressable>
          <Text style={styles.sectionTitle}>أحدث العقارات</Text>
        </View>

        {recentLoading ? (
          <View style={styles.recentGrid}>
            {[1, 2].map(i => <View key={i} style={styles.recentCardWrap}><SkeletonCard /></View>)}
          </View>
        ) : (
          <View style={styles.recentGrid}>
            {recentListings.map(item => (
              <View key={item.id} style={styles.recentCardWrap}>
                <ListingCard
                  listing={item}
                  onPress={() => router.push(`/listing/${item.id}`)}
                />
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ════════════════ QUICK ACTIONS ════════════════ */}
      <View style={[styles.section, { marginBottom: 4 }]}>
        <Text style={[styles.sectionTitle, { paddingHorizontal: 16, marginBottom: 12 }]}>استكشف المنصة</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map(a => (
            <Pressable
              key={a.path}
              style={[styles.actionCard, { backgroundColor: a.bg }]}
              onPress={() => router.push(a.path as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${a.color}22` }]}>
                <Feather name={a.icon as any} size={22} color={a.color} />
              </View>
              <Text style={[styles.actionLabel, { color: a.color }]}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ════════════════ لماذا نحن ════════════════ */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View />
          <Text style={styles.sectionTitle}>لماذا عقار إنسايت؟</Text>
        </View>
        <View style={styles.whyGrid}>
          {WHY_CARDS.map(card => (
            <View key={card.id} style={styles.whyCard}>
              <View style={[styles.whyIconWrap, { backgroundColor: card.bg }]}>
                <Feather name={card.icon as any} size={20} color={card.color} />
              </View>
              <Text style={styles.whyTitle}>{card.title}</Text>
              <Text style={styles.whyDesc}>{card.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ════════════════ ADD LISTING CTA ════════════════ */}
      <View style={styles.ctaSection}>
        <LinearGradient
          colors={[Colors.teal, '#0a5a78']}
          style={styles.ctaCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.ctaLeft}>
            <Text style={styles.ctaTitle}>هل لديك عقار للبيع أو الإيجار؟</Text>
            <Text style={styles.ctaSub}>أضف إعلانك الآن وتواصل مع آلاف المشترين</Text>
          </View>
          <Pressable
            style={styles.ctaBtn}
            onPress={() => router.push('/my-listings')}
          >
            <Feather name="plus" size={18} color={Colors.teal} />
            <Text style={styles.ctaBtnText}>أضف إعلانك</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </ScrollView>
  );
}

const CARD_W = (W - 48) / 2;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },

  /* ── HERO ── */
  heroWrap: { width: '100%', minHeight: 520 },
  heroTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  hBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandTitle: { color: Colors.white, fontSize: 17, fontWeight: 'bold' },
  brandLogoBox: {
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  brandLogoImage: {
    width: 22,
    height: 22,
  },
  heroContent: { position: 'absolute', opacity: 0, width: 1, height: 1, overflow: 'hidden' },
  heroSuper: { color: 'transparent', fontSize: 1, fontWeight: '600', marginBottom: 1, lineHeight: 1, letterSpacing: 0 },
  heroTitle: { color: 'transparent', fontSize: 1, fontWeight: 'bold', lineHeight: 1, marginBottom: 1 },
  heroSub: { color: 'transparent', fontSize: 1, lineHeight: 1 },
  heroOverlayBlock: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 14 },
  heroPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  heroPillText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  heroOverlaySuper: { color: Colors.teal, fontSize: 13, fontWeight: '700', marginBottom: 8, letterSpacing: 0.4 },
  heroOverlayTitle: { color: Colors.white, fontSize: 31, fontWeight: 'bold', lineHeight: 40, marginBottom: 10 },
  heroOverlaySub: { color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 22, maxWidth: '88%' },
  heroThumbsScroll: { marginBottom: 18 },
  heroThumbsRow: { paddingHorizontal: 16, gap: 10 },
  heroThumbCard: {
    width: 132,
    height: 84,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroThumbCardActive: { borderColor: Colors.gold, transform: [{ scale: 1.02 }] },
  heroThumbImage: { width: '100%', height: '100%' },
  heroThumbOverlay: { ...StyleSheet.absoluteFillObject },
  heroThumbTitle: {
    position: 'absolute',
    right: 10,
    left: 10,
    bottom: 10,
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },

  /* ── SEARCH PANEL ── */
  searchPanel: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  dealTabs: { flexDirection: 'row', backgroundColor: '#f0f2f5', borderRadius: 10, padding: 3, marginBottom: 12 },
  dealTab: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 8 },
  dealTabActive: { backgroundColor: Colors.navy },
  dealTabText: { color: Colors.textMuted, fontSize: 13, fontWeight: '500' },
  dealTabTextActive: { color: '#fff', fontWeight: 'bold' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f6fa',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14, marginRight: 8 },
  propScroll: { marginBottom: 12 },
  propChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  propChipActive: { backgroundColor: 'rgba(15,123,160,0.1)', borderColor: Colors.teal },
  propChipText: { color: Colors.textMuted, fontSize: 12 },
  propChipTextActive: { color: Colors.teal, fontWeight: 'bold' },
  searchBtn: {
    backgroundColor: Colors.navy,
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  searchBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

  /* ── STATS BAND ── */
  statsBand: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statBandItem: { flex: 1, alignItems: 'center' },
  statBandValue: { color: Colors.gold, fontSize: 17, fontWeight: 'bold' },
  statBandLabel: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  statBandDiv: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.08)' },
  marketBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  marketBadgeText: { fontSize: 12, fontWeight: 'bold' },

  /* ── SECTIONS ── */
  section: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: Colors.text, fontSize: 17, fontWeight: 'bold' },
  featuredBadge: { backgroundColor: 'rgba(201,168,76,0.12)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.gold },
  featuredBadgeText: { color: Colors.gold, fontSize: 11, fontWeight: 'bold' },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { color: Colors.teal, fontSize: 13 },

  /* ── CATEGORIES ── */
  catCard: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 70,
  },
  catIcon: { fontSize: 24, marginBottom: 6 },
  catLabel: { color: Colors.text, fontSize: 12, fontWeight: '600' },

  /* ── MARKET INSIGHT ── */
  insightCard: { marginHorizontal: 16, borderRadius: 18, overflow: 'hidden' },
  insightGrad: { padding: 18 },
  insightTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  insightScore: { color: Colors.gold, fontSize: 42, fontWeight: 'bold' },
  insightScoreLabel: { color: Colors.textMuted, fontSize: 12, marginTop: -4 },
  insightPulse: { alignItems: 'flex-end', gap: 6 },
  insightStatus: { fontSize: 14, fontWeight: 'bold' },
  insightStatsRow: { flexDirection: 'row', marginBottom: 16 },
  insightStat: { flex: 1, alignItems: 'center' },
  insightStatVal: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
  insightStatLabel: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  insightStatDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  insightCTA: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-end' },
  insightCTAText: { color: Colors.teal, fontSize: 13 },

  /* ── RECENT ── */
  recentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  recentCardWrap: { width: CARD_W, marginBottom: 12 },

  /* ── QUICK ACTIONS ── */
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (W - 48) / 2,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  actionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 13, fontWeight: 'bold' },

  /* ── WHY US ── */
  whyGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, justifyContent: 'space-between' },
  whyCard: {
    width: (W - 48) / 2,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  whyIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  whyTitle: { fontSize: 13, fontWeight: 'bold', color: Colors.text, textAlign: 'center', marginBottom: 4 },
  whyDesc: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', lineHeight: 16 },

  /* ── CTA ── */
  ctaSection: { marginHorizontal: 16, marginTop: 24 },
  ctaCard: {
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaLeft: { flex: 1, marginLeft: 12 },
  ctaTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  ctaSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 18 },
  ctaBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  ctaBtnText: { color: Colors.teal, fontSize: 13, fontWeight: 'bold' },
});
