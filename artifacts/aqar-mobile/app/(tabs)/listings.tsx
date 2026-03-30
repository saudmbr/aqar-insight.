import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { ListingsResponse, fetchListings } from '@/constants/api';
import { ListingCard } from '@/components/ListingCard';
import { SkeletonCard } from '@/components/SkeletonCard';

const TYPES = [
  { key: '', label: 'الكل' },
  { key: 'sale', label: 'للبيع' },
  { key: 'rent', label: 'للإيجار' },
];

const PROP_TYPES = [
  { key: '', label: 'كل الأنواع' },
  { key: 'apartment', label: 'شقة' },
  { key: 'villa', label: 'فيلا' },
  { key: 'land', label: 'أرض' },
  { key: 'commercial', label: 'تجاري' },
];

export default function ListingsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string }>();
  const [search, setSearch] = useState(params.q ?? '');
  const [listingType, setListingType] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [page, setPage] = useState(1);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data, isLoading, isFetching } = useQuery<ListingsResponse>({
    queryKey: ['listings', listingType, propertyType, search, page],
    queryFn: () => {
      const p = new URLSearchParams({ limit: '20', page: String(page) });
      if (listingType) p.set('listingType', listingType);
      if (propertyType) p.set('propertyType', propertyType);
      if (search) p.set('search', search);
      return fetchListings(p);
    },
  });

  const listings = data?.listings ?? [];

  return (
    <View style={[styles.screen]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.headerTitle}>العقارات</Text>
        <View style={styles.searchWrap}>
          <Feather name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن عقار..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            textAlign="right"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Feather name="x" size={16} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
        {/* Type Filter */}
        <View style={styles.filterRow}>
          {TYPES.map((t) => (
            <Pressable
              key={t.key}
              style={[styles.chip, listingType === t.key && styles.chipActive]}
              onPress={() => setListingType(t.key)}
            >
              <Text style={[styles.chipText, listingType === t.key && styles.chipTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {/* Property Type Filter */}
        <View style={styles.filterRow}>
          {PROP_TYPES.map((t) => (
            <Pressable
              key={t.key}
              style={[styles.chip, propertyType === t.key && styles.chipActive]}
              onPress={() => setPropertyType(t.key)}
            >
              <Text style={[styles.chipText, propertyType === t.key && styles.chipTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {data && (
          <Text style={styles.count}>{data.total} عقار</Text>
        )}
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.gridWrap}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={listings.length > 0}
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onPress={() => router.push({ pathname: '/listing/[id]', params: { id: String(item.id) } })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="home" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>لا توجد عقارات</Text>
              <Text style={styles.emptyText}>جرّب تغيير الفلتر أو البحث</Text>
            </View>
          }
          onEndReached={() => {
            if (data && page < data.totalPages) setPage((p) => p + 1);
          }}
          onEndReachedThreshold={0.4}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, textAlign: 'right', marginBottom: 12 },
  searchWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    gap: 8,
  },
  searchIcon: { marginLeft: 4 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  filterRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.textSub },
  chipTextActive: { color: Colors.white },
  count: { fontSize: 12, color: Colors.textMuted, textAlign: 'right' },
  gridWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12, padding: 16 },
  listContent: { padding: 16, gap: 12 },
  row: { flexDirection: 'row-reverse', gap: 12 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 13, color: Colors.textMuted },
});
