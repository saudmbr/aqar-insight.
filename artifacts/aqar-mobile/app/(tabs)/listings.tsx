import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { ListingsResponse, fetchListings, SAUDI_REGIONS, PROPERTY_TYPES } from '@/constants/api';
import { ListingCard } from '@/components/ListingCard';
import { SkeletonCard } from '@/components/SkeletonCard';

const TYPES = [
  { key: '', label: 'الكل' },
  { key: 'sale', label: 'للبيع' },
  { key: 'rent', label: 'للإيجار' },
];

export default function ListingsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string; propertyType?: string }>();
  const [search, setSearch] = useState(params.q ?? '');
  const [listingType, setListingType] = useState('');
  const [propertyType, setPropertyType] = useState(params.propertyType ?? '');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    if (params.propertyType) setPropertyType(params.propertyType);
  }, [params.propertyType]);

  const activeFiltersCount = [listingType, propertyType, region, city].filter(Boolean).length;

  const { data, isLoading, isFetching } = useQuery<ListingsResponse>({
    queryKey: ['listings', listingType, propertyType, search, page, region, city],
    queryFn: () => {
      const p = new URLSearchParams({ limit: '20', page: String(page) });
      if (listingType) p.set('listingType', listingType);
      if (propertyType) p.set('propertyType', propertyType);
      if (search) p.set('search', search);
      if (region) p.set('region', region);
      if (city) p.set('city', city);
      return fetchListings(p);
    },
  });

  const listings = data?.listings ?? [];

  const clearFilters = () => {
    setListingType('');
    setPropertyType('');
    setRegion('');
    setCity('');
    setSearch('');
    setPage(1);
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerTop}>
          <Pressable
            style={[styles.filterIconBtn, activeFiltersCount > 0 && styles.filterIconBtnActive]}
            onPress={() => setShowFilters(true)}
          >
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
            <Feather name="sliders" size={18} color={activeFiltersCount > 0 ? Colors.white : Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>العقارات</Text>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Feather name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن عقار، حي، مدينة..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={(v) => { setSearch(v); setPage(1); }}
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {TYPES.map((t) => (
            <Pressable
              key={t.key}
              style={[styles.chip, listingType === t.key && styles.chipActive]}
              onPress={() => { setListingType(t.key); setPage(1); }}
            >
              <Text style={[styles.chipText, listingType === t.key && styles.chipTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Active filter chips */}
        {(propertyType || region || city) && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFilters}>
            {propertyType && (
              <Pressable style={styles.activeChip} onPress={() => setPropertyType('')}>
                <Text style={styles.activeChipText}>{propertyType}</Text>
                <Feather name="x" size={11} color={Colors.white} />
              </Pressable>
            )}
            {region && (
              <Pressable style={styles.activeChip} onPress={() => setRegion('')}>
                <Text style={styles.activeChipText}>{region}</Text>
                <Feather name="x" size={11} color={Colors.white} />
              </Pressable>
            )}
            {city && (
              <Pressable style={styles.activeChip} onPress={() => setCity('')}>
                <Text style={styles.activeChipText}>{city}</Text>
                <Feather name="x" size={11} color={Colors.white} />
              </Pressable>
            )}
            <Pressable style={styles.clearChip} onPress={clearFilters}>
              <Text style={styles.clearChipText}>مسح الكل</Text>
            </Pressable>
          </ScrollView>
        )}

        {data && (
          <Text style={styles.count}>{data.total} عقار {isFetching && '...'}</Text>
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
          contentContainerStyle={[styles.listContent, { paddingBottom: botPad + 20 }]}
          showsVerticalScrollIndicator={false}
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
              {activeFiltersCount > 0 && (
                <Pressable style={styles.clearBtn} onPress={clearFilters}>
                  <Text style={styles.clearBtnText}>مسح الفلاتر</Text>
                </Pressable>
              )}
            </View>
          }
          onEndReached={() => {
            if (data && page < data.totalPages) setPage((p) => p + 1);
          }}
          onEndReachedThreshold={0.4}
        />
      )}

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilters(false)}>
          <Pressable style={[styles.modalSheet, { paddingBottom: botPad + 20 }]} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Pressable onPress={clearFilters}>
                <Text style={styles.modalClear}>مسح الكل</Text>
              </Pressable>
              <Text style={styles.modalTitle}>تصفية النتائج</Text>
              <Pressable onPress={() => setShowFilters(false)}>
                <Feather name="x" size={22} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Property Type */}
              <Text style={styles.filterLabel}>نوع العقار</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillRow}>
                {[{ key: '', label: 'الكل' }, ...PROPERTY_TYPES.map((k) => ({ key: k, label: k }))].map((t) => (
                  <Pressable
                    key={t.key}
                    style={[styles.filterPill, propertyType === t.key && styles.filterPillActive]}
                    onPress={() => setPropertyType(t.key)}
                  >
                    <Text style={[styles.filterPillText, propertyType === t.key && styles.filterPillTextActive]}>
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Region */}
              <Text style={styles.filterLabel}>المنطقة</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillRow}>
                {[{ key: '', label: 'كل المناطق' }, ...SAUDI_REGIONS.map((r) => ({ key: r, label: r }))].map((r) => (
                  <Pressable
                    key={r.key}
                    style={[styles.filterPill, region === r.key && styles.filterPillActive]}
                    onPress={() => { setRegion(r.key); setCity(''); }}
                  >
                    <Text style={[styles.filterPillText, region === r.key && styles.filterPillTextActive]}>
                      {r.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* City */}
              <Text style={styles.filterLabel}>المدينة</Text>
              <View style={styles.cityInput}>
                <Feather name="map-pin" size={14} color={Colors.textMuted} />
                <TextInput
                  style={styles.cityInputField}
                  placeholder="اكتب اسم المدينة..."
                  placeholderTextColor={Colors.textMuted}
                  value={city}
                  onChangeText={setCity}
                  textAlign="right"
                />
                {city.length > 0 && (
                  <Pressable onPress={() => setCity('')}>
                    <Feather name="x" size={14} color={Colors.textMuted} />
                  </Pressable>
                )}
              </View>

              {/* Listing Type (in modal too) */}
              <Text style={styles.filterLabel}>نوع الإعلان</Text>
              <View style={styles.listingTypeRow}>
                {TYPES.map((t) => (
                  <Pressable
                    key={t.key}
                    style={[styles.typeBtn, listingType === t.key && styles.typeBtnActive]}
                    onPress={() => setListingType(t.key)}
                  >
                    <Text style={[styles.typeBtnText, listingType === t.key && styles.typeBtnTextActive]}>
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Apply */}
            <Pressable
              style={styles.applyBtn}
              onPress={() => { setPage(1); setShowFilters(false); }}
            >
              <Text style={styles.applyBtnText}>تطبيق الفلاتر</Text>
              {activeFiltersCount > 0 && (
                <View style={styles.applyBadge}>
                  <Text style={styles.applyBadgeText}>{activeFiltersCount}</Text>
                </View>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  headerTop: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  filterIconBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
    position: 'relative',
  },
  filterIconBtnActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  filterBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center',
  },
  filterBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.white },
  searchWrap: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: 14,
    paddingHorizontal: 12, height: 44, marginBottom: 10, gap: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, padding: 0 },
  filterRow: { gap: 8, flexDirection: 'row-reverse', marginBottom: 6 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  chipActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.textSub },
  chipTextActive: { color: Colors.white },
  activeFilters: { gap: 8, flexDirection: 'row-reverse', marginBottom: 6 },
  activeChip: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    backgroundColor: Colors.teal, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  activeChipText: { fontSize: 11, fontWeight: '700', color: Colors.white },
  clearChip: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    backgroundColor: Colors.skeleton,
  },
  clearChipText: { fontSize: 11, fontWeight: '600', color: Colors.textSub },
  count: { fontSize: 12, color: Colors.textMuted, textAlign: 'right' },
  gridWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12, padding: 16 },
  listContent: { padding: 16, gap: 12 },
  row: { flexDirection: 'row-reverse', gap: 12 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 13, color: Colors.textMuted },
  clearBtn: {
    marginTop: 8, backgroundColor: Colors.teal,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12,
  },
  clearBtnText: { color: Colors.white, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12, maxHeight: '85%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: 16,
  },
  modalHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  modalClear: { fontSize: 13, color: Colors.teal, fontWeight: '600' },
  filterLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, textAlign: 'right', marginBottom: 10, marginTop: 16 },
  filterPillRow: { gap: 8, flexDirection: 'row-reverse', paddingBottom: 4 },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border,
  },
  filterPillActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  filterPillText: { fontSize: 13, fontWeight: '600', color: Colors.textSub },
  filterPillTextActive: { color: Colors.white },
  cityInput: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: 14,
    paddingHorizontal: 14, height: 46, gap: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  cityInputField: { flex: 1, fontSize: 14, color: Colors.text, padding: 0 },
  listingTypeRow: { flexDirection: 'row-reverse', gap: 10 },
  typeBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 14,
    backgroundColor: Colors.background, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
  },
  typeBtnActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSub },
  typeBtnTextActive: { color: Colors.white },
  applyBtn: {
    marginTop: 20, backgroundColor: Colors.teal, borderRadius: 16,
    paddingVertical: 16, flexDirection: 'row-reverse',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  applyBtnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  applyBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  applyBadgeText: { fontSize: 11, fontWeight: '800', color: Colors.white },
});
