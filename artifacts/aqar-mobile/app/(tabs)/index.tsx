import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
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
import { ListingsResponse, fetchListings, formatPrice, listingTypeLabel } from '@/constants/api';
import { ListingCard } from '@/components/ListingCard';
import { SkeletonCard } from '@/components/SkeletonCard';

const { width } = Dimensions.get('window');

const FEATURED_TYPES = ['all', 'sale', 'rent'] as const;
const FEATURED_LABELS: Record<string, string> = { all: 'الكل', sale: 'للبيع', rent: 'للإيجار' };

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [activeType, setActiveType] = useState<string>('all');
  const [search, setSearch] = useState('');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data, isLoading, refetch, isRefetching } = useQuery<ListingsResponse>({
    queryKey: ['home-listings', activeType],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '10', page: '1' });
      if (activeType !== 'all') params.set('listingType', activeType);
      return fetchListings(params);
    },
  });

  const listings = data?.listings ?? [];
  const featured = listings.slice(0, 6);

  const handleSearch = () => {
    if (search.trim()) {
      router.push({ pathname: '/(tabs)/listings', params: { q: search } });
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 20 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.teal} />}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.headerAvatar}>
            <Feather name="user" size={20} color={Colors.white} />
          </Pressable>
          <View style={styles.headerBrand}>
            <Text style={styles.headerSub}>أهلاً بك في</Text>
            <Text style={styles.headerTitle}>عقار إنسايت</Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/favorites')} style={styles.headerFav}>
            <Feather name="heart" size={20} color={Colors.white} />
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Pressable style={styles.searchBtn} onPress={handleSearch}>
            <Feather name="search" size={18} color={Colors.white} />
          </Pressable>
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن عقار، حي، مدينة..."
            placeholderTextColor="rgba(255,255,255,0.55)"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            textAlign="right"
          />
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          {FEATURED_TYPES.map((t) => (
            <Pressable
              key={t}
              style={[styles.filterBtn, activeType === t && styles.filterBtnActive]}
              onPress={() => setActiveType(t)}
            >
              <Text style={[styles.filterBtnText, activeType === t && styles.filterBtnTextActive]}>
                {FEATURED_LABELS[t]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data?.total ?? '—'}</Text>
          <Text style={styles.statLabel}>عقار متاح</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{listings.filter((l) => l.listingType === 'sale').length}</Text>
          <Text style={styles.statLabel}>للبيع</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{listings.filter((l) => l.listingType === 'rent').length}</Text>
          <Text style={styles.statLabel}>للإيجار</Text>
        </View>
      </View>

      {/* Featured Listings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Pressable onPress={() => router.push('/(tabs)/listings')}>
            <Text style={styles.seeAll}>عرض الكل</Text>
          </Pressable>
          <Text style={styles.sectionTitle}>العقارات المميزة</Text>
        </View>

        {isLoading ? (
          <View style={styles.grid}>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </View>
        ) : featured.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="home" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>لا توجد عقارات حالياً</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {featured.map((item) => (
              <ListingCard
                key={item.id}
                listing={item}
                onPress={() => router.push({ pathname: '/listing/[id]', params: { id: String(item.id) } })}
              />
            ))}
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Pressable
          style={styles.quickBtn}
          onPress={() => router.push('/(tabs)/map')}
        >
          <View style={styles.quickIcon}>
            <Feather name="map" size={22} color={Colors.teal} />
          </View>
          <Text style={styles.quickLabel}>الخريطة</Text>
        </Pressable>
        <Pressable
          style={styles.quickBtn}
          onPress={() => router.push('/(tabs)/listings')}
        >
          <View style={styles.quickIcon}>
            <Feather name="list" size={22} color={Colors.teal} />
          </View>
          <Text style={styles.quickLabel}>تصفح العقارات</Text>
        </Pressable>
        <Pressable
          style={styles.quickBtn}
          onPress={() => router.push('/(tabs)/favorites')}
        >
          <View style={styles.quickIcon}>
            <Feather name="heart" size={22} color={Colors.teal} />
          </View>
          <Text style={styles.quickLabel}>المفضلة</Text>
        </Pressable>
      </View>
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
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerFav: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerBrand: { alignItems: 'center' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.white, textAlign: 'center' },
  searchWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  searchInput: { flex: 1, color: Colors.white, fontSize: 14, marginRight: 10 },
  searchBtn: { padding: 4 },
  filterRow: { flexDirection: 'row-reverse', gap: 8 },
  filterBtn: {
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  filterBtnActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  filterBtnTextActive: { color: Colors.white },
  statsRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.card,
    borderRadius: 14, padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.navy },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  seeAll: { fontSize: 13, color: Colors.teal, fontWeight: '600' },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  quickActions: {
    flexDirection: 'row-reverse', paddingHorizontal: 16, gap: 10, marginBottom: 20,
  },
  quickBtn: { flex: 1, alignItems: 'center', gap: 8 },
  quickIcon: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  quickLabel: { fontSize: 11, color: Colors.textSub, fontWeight: '600', textAlign: 'center' },
});
