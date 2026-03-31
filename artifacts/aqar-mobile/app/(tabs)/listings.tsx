import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
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
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { ListingsResponse, fetchListings, SAUDI_REGIONS, PROPERTY_TYPES } from '@/constants/api';
import { ListingCard, CARD_WIDTH } from '@/components/ListingCard';
import { SkeletonCard } from '@/components/SkeletonCard';

const { height: SCREEN_H } = Dimensions.get('window');

const DEAL_TYPES = [
  { key: '', label: 'الكل' },
  { key: 'sale', label: 'للبيع' },
  { key: 'rent', label: 'للإيجار' },
];

const SORT_OPTIONS = [
  { key: 'newest', label: 'الأحدث' },
  { key: 'price_asc', label: 'السعر: الأقل أولاً' },
  { key: 'price_desc', label: 'السعر: الأعلى أولاً' },
  { key: 'area_desc', label: 'المساحة: الأكبر أولاً' },
];

const BEDROOM_OPTIONS = ['أي', '1', '2', '3', '4', '5+'];
const BATHROOM_OPTIONS = ['أي', '1', '2', '3', '4+'];

const FEATURES = [
  { key: 'pool', label: '🏊 مسبح' },
  { key: 'elevator', label: '🛗 مصعد' },
  { key: 'parking', label: '🚗 موقف سيارات' },
  { key: 'garden', label: '🌿 حديقة' },
  { key: 'security', label: '🔒 أمن وحراسة' },
  { key: 'gym', label: '💪 نادي رياضي' },
];

interface FilterState {
  listingType: string;
  propertyType: string;
  region: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  minArea: string;
  maxArea: string;
  bedrooms: string;
  bathrooms: string;
  sort: string;
}

const DEFAULT_FILTERS: FilterState = {
  listingType: '',
  propertyType: '',
  region: '',
  city: '',
  minPrice: '',
  maxPrice: '',
  minArea: '',
  maxArea: '',
  bedrooms: '',
  bathrooms: '',
  sort: 'newest',
};

export default function ListingsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string; propertyType?: string; listingType?: string }>();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [search, setSearch] = useState(params.q ?? '');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    listingType: params.listingType ?? '',
    propertyType: params.propertyType ?? '',
  });
  const [draftFilters, setDraftFilters] = useState<FilterState>(filters);

  useEffect(() => {
    if (params.propertyType || params.listingType) {
      setFilters(f => ({ ...f, propertyType: params.propertyType ?? f.propertyType, listingType: params.listingType ?? f.listingType }));
    }
  }, [params.propertyType, params.listingType]);

  const activeFiltersCount = [
    filters.listingType,
    filters.propertyType,
    filters.region,
    filters.city,
    filters.minPrice,
    filters.maxPrice,
    filters.minArea,
    filters.maxArea,
    filters.bedrooms,
    filters.bathrooms,
  ].filter(Boolean).length;

  const buildParams = useCallback((f: FilterState, q: string, p: number) => {
    const params = new URLSearchParams({ limit: '20', page: String(p) });
    if (f.listingType) params.set('listingType', f.listingType);
    if (f.propertyType) params.set('propertyType', f.propertyType);
    if (q) params.set('search', q);
    if (f.region) params.set('region', f.region);
    if (f.city) params.set('city', f.city);
    if (f.minPrice) params.set('minPrice', f.minPrice);
    if (f.maxPrice) params.set('maxPrice', f.maxPrice);
    if (f.minArea) params.set('minArea', f.minArea);
    if (f.maxArea) params.set('maxArea', f.maxArea);
    if (f.bedrooms && f.bedrooms !== 'أي') {
      params.set('bedrooms', f.bedrooms.replace('+', ''));
    }
    if (f.bathrooms && f.bathrooms !== 'أي') {
      params.set('bathrooms', f.bathrooms.replace('+', ''));
    }
    if (f.sort && f.sort !== 'newest') params.set('sort', f.sort);
    return params;
  }, []);

  const { data, isLoading, isFetching } = useQuery<ListingsResponse>({
    queryKey: ['listings-v2', filters, search, page],
    queryFn: () => fetchListings(buildParams(filters, search, page)),
  });

  const listings = data?.listings ?? [];
  const total = data?.total ?? 0;
  const hasMore = listings.length < total;

  const applyFilters = () => {
    setFilters(draftFilters);
    setPage(1);
    setShowFilters(false);
  };

  const clearAllFilters = () => {
    const cleared = { ...DEFAULT_FILTERS };
    setFilters(cleared);
    setDraftFilters(cleared);
    setSearch('');
    setPage(1);
  };

  const currentSortLabel = SORT_OPTIONS.find(s => s.key === filters.sort)?.label ?? 'الأحدث';

  return (
    <View style={s.screen}>
      {/* ═══ HEADER ═══ */}
      <LinearGradient colors={[Colors.navyDark, Colors.navy]} style={[s.header, { paddingTop: topPad + 14 }]}>
        <View style={s.headerTop}>
          <Pressable
            style={[s.filterBtn, activeFiltersCount > 0 && s.filterBtnActive]}
            onPress={() => { setDraftFilters(filters); setShowFilters(true); }}
          >
            <Feather name="sliders" size={16} color={activeFiltersCount > 0 ? Colors.teal : Colors.white} />
            <Text style={[s.filterBtnText, activeFiltersCount > 0 && { color: Colors.teal }]}>
              {activeFiltersCount > 0 ? `فلاتر (${activeFiltersCount})` : 'فلاتر'}
            </Text>
          </Pressable>

          <Text style={s.headerTitle}>العقارات</Text>

          <Pressable
            style={s.sortBtn}
            onPress={() => {
              const next = SORT_OPTIONS[(SORT_OPTIONS.findIndex(s => s.key === filters.sort) + 1) % SORT_OPTIONS.length];
              setFilters(f => ({ ...f, sort: next.key }));
              setPage(1);
            }}
          >
            <Feather name="bar-chart-2" size={14} color={Colors.teal} />
            <Text style={s.sortBtnText} numberOfLines={1}>{currentSortLabel}</Text>
          </Pressable>
        </View>

        {/* Search bar */}
        <View style={s.searchWrap}>
          <Feather name="search" size={16} color="rgba(255,255,255,0.4)" style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            placeholder="ابحث عن عقار، حي، مدينة..."
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={search}
            onChangeText={t => { setSearch(t); setPage(1); }}
            returnKeyType="search"
            textAlign="right"
          />
          {search ? (
            <Pressable onPress={() => { setSearch(''); setPage(1); }} style={s.clearSearch}>
              <Feather name="x" size={14} color="rgba(255,255,255,0.5)" />
            </Pressable>
          ) : null}
        </View>

        {/* Deal type pills */}
        <View style={s.pillsRow}>
          {DEAL_TYPES.map(t => (
            <Pressable
              key={t.key}
              style={[s.pill, filters.listingType === t.key && s.pillActive]}
              onPress={() => { setFilters(f => ({ ...f, listingType: t.key })); setPage(1); }}
            >
              <Text style={[s.pillText, filters.listingType === t.key && s.pillTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
          {activeFiltersCount > 0 && (
            <Pressable style={s.clearFiltersBtn} onPress={clearAllFilters}>
              <Text style={s.clearFiltersBtnText}>مسح الكل</Text>
            </Pressable>
          )}
        </View>
      </LinearGradient>

      {/* Results count */}
      <View style={s.resultsMeta}>
        <Text style={s.resultsCount}>{total} عقار</Text>
        {activeFiltersCount > 0 && (
          <Text style={s.resultsFiltered}> (مفلتر)</Text>
        )}
      </View>

      {/* ═══ LISTINGS GRID ═══ */}
      {isLoading ? (
        <View style={s.skeletonGrid}>
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <FlatList
          key="listings-2col"
          data={listings}
          numColumns={2}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: botPad + 30 }}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
          renderItem={({ item }) => (
            <View style={{ width: CARD_WIDTH }}>
              <ListingCard listing={item} onPress={() => router.push(`/listing/${item.id}`)} />
            </View>
          )}
          ItemSeparatorComponent={() => null}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Feather name="search" size={36} color={Colors.textMuted} />
              <Text style={s.emptyTitle}>لا توجد نتائج</Text>
              <Text style={s.emptySubtitle}>جرب تعديل الفلاتر أو مصطلح البحث</Text>
              <Pressable style={s.emptyBtn} onPress={clearAllFilters}>
                <Text style={s.emptyBtnText}>مسح كل الفلاتر</Text>
              </Pressable>
            </View>
          }
          ListFooterComponent={
            hasMore ? (
              <Pressable
                style={s.loadMoreBtn}
                onPress={() => setPage(p => p + 1)}
                disabled={isFetching}
              >
                <Text style={s.loadMoreText}>{isFetching ? 'جارٍ التحميل...' : 'عرض المزيد'}</Text>
                {!isFetching && <Feather name="chevron-down" size={16} color={Colors.teal} />}
              </Pressable>
            ) : null
          }
        />
      )}

      {/* ═══ ADVANCED FILTER MODAL ═══ */}
      <Modal visible={showFilters} transparent animationType="slide">
        <Pressable style={s.overlay} onPress={() => setShowFilters(false)} />
        <View style={s.filterSheet}>
          <View style={s.sheetHandle} />
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>الفلاتر المتقدمة</Text>
            <Pressable onPress={() => setDraftFilters(DEFAULT_FILTERS)}>
              <Text style={s.resetText}>إعادة تعيين</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {/* ── SORT ── */}
            <Text style={s.sectionLabel}>الترتيب</Text>
            <View style={s.chipRow}>
              {SORT_OPTIONS.map(so => (
                <Pressable
                  key={so.key}
                  style={[s.chip, draftFilters.sort === so.key && s.chipActive]}
                  onPress={() => setDraftFilters(f => ({ ...f, sort: so.key }))}
                >
                  <Text style={[s.chipText, draftFilters.sort === so.key && s.chipTextActive]}>{so.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* ── DEAL TYPE ── */}
            <Text style={s.sectionLabel}>نوع الصفقة</Text>
            <View style={s.chipRow}>
              {DEAL_TYPES.map(t => (
                <Pressable
                  key={t.key}
                  style={[s.chip, draftFilters.listingType === t.key && s.chipActive]}
                  onPress={() => setDraftFilters(f => ({ ...f, listingType: t.key }))}
                >
                  <Text style={[s.chipText, draftFilters.listingType === t.key && s.chipTextActive]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* ── PROPERTY TYPE ── */}
            <Text style={s.sectionLabel}>نوع العقار</Text>
            <View style={s.chipRow}>
              {(['', ...PROPERTY_TYPES]).map(pt => (
                <Pressable
                  key={pt}
                  style={[s.chip, draftFilters.propertyType === pt && s.chipActive]}
                  onPress={() => setDraftFilters(f => ({ ...f, propertyType: pt }))}
                >
                  <Text style={[s.chipText, draftFilters.propertyType === pt && s.chipTextActive]}>{pt || 'الكل'}</Text>
                </Pressable>
              ))}
            </View>

            {/* ── PRICE RANGE ── */}
            <Text style={s.sectionLabel}>نطاق السعر (ريال سعودي)</Text>
            <View style={s.rangeRow}>
              <TextInput
                style={s.rangeInput}
                placeholder="الحد الأدنى"
                placeholderTextColor={Colors.textMuted}
                value={draftFilters.minPrice}
                onChangeText={v => setDraftFilters(f => ({ ...f, minPrice: v }))}
                keyboardType="numeric"
                textAlign="right"
              />
              <Text style={s.rangeSep}>—</Text>
              <TextInput
                style={s.rangeInput}
                placeholder="الحد الأقصى"
                placeholderTextColor={Colors.textMuted}
                value={draftFilters.maxPrice}
                onChangeText={v => setDraftFilters(f => ({ ...f, maxPrice: v }))}
                keyboardType="numeric"
                textAlign="right"
              />
            </View>

            {/* ── AREA RANGE ── */}
            <Text style={s.sectionLabel}>المساحة (م²)</Text>
            <View style={s.rangeRow}>
              <TextInput
                style={s.rangeInput}
                placeholder="الحد الأدنى"
                placeholderTextColor={Colors.textMuted}
                value={draftFilters.minArea}
                onChangeText={v => setDraftFilters(f => ({ ...f, minArea: v }))}
                keyboardType="numeric"
                textAlign="right"
              />
              <Text style={s.rangeSep}>—</Text>
              <TextInput
                style={s.rangeInput}
                placeholder="الحد الأقصى"
                placeholderTextColor={Colors.textMuted}
                value={draftFilters.maxArea}
                onChangeText={v => setDraftFilters(f => ({ ...f, maxArea: v }))}
                keyboardType="numeric"
                textAlign="right"
              />
            </View>

            {/* ── BEDROOMS ── */}
            <Text style={s.sectionLabel}>عدد غرف النوم</Text>
            <View style={s.chipRow}>
              {BEDROOM_OPTIONS.map(b => (
                <Pressable
                  key={b}
                  style={[s.chip, s.chipSmall, (draftFilters.bedrooms === b || (!draftFilters.bedrooms && b === 'أي')) && s.chipActive]}
                  onPress={() => setDraftFilters(f => ({ ...f, bedrooms: b === 'أي' ? '' : b }))}
                >
                  <Text style={[s.chipText, (draftFilters.bedrooms === b || (!draftFilters.bedrooms && b === 'أي')) && s.chipTextActive]}>{b}</Text>
                </Pressable>
              ))}
            </View>

            {/* ── BATHROOMS ── */}
            <Text style={s.sectionLabel}>عدد دورات المياه</Text>
            <View style={s.chipRow}>
              {BATHROOM_OPTIONS.map(b => (
                <Pressable
                  key={b}
                  style={[s.chip, s.chipSmall, (draftFilters.bathrooms === b || (!draftFilters.bathrooms && b === 'أي')) && s.chipActive]}
                  onPress={() => setDraftFilters(f => ({ ...f, bathrooms: b === 'أي' ? '' : b }))}
                >
                  <Text style={[s.chipText, (draftFilters.bathrooms === b || (!draftFilters.bathrooms && b === 'أي')) && s.chipTextActive]}>{b}</Text>
                </Pressable>
              ))}
            </View>

            {/* ── CITY ── */}
            <Text style={s.sectionLabel}>المدينة</Text>
            <View style={s.chipRow}>
              {[{ value: '', label: 'الكل' }, ...SAUDI_REGIONS.map(r => ({ value: r, label: r }))].slice(0, 8).map(c => (
                <Pressable
                  key={c.value}
                  style={[s.chip, draftFilters.city === c.value && s.chipActive]}
                  onPress={() => setDraftFilters(f => ({ ...f, city: c.value }))}
                >
                  <Text style={[s.chipText, draftFilters.city === c.value && s.chipTextActive]}>{c.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Apply button */}
          <Pressable style={s.applyBtn} onPress={applyFilters}>
            <Text style={s.applyBtnText}>تطبيق الفلاتر</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingBottom: 14 },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterBtnActive: { backgroundColor: 'rgba(15,123,160,0.15)', borderWidth: 1, borderColor: Colors.teal },
  filterBtnText: { color: Colors.white, fontSize: 12 },
  headerTitle: { flex: 1, color: Colors.white, fontSize: 17, fontWeight: 'bold', textAlign: 'center' },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15,123,160,0.12)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 110,
  },
  sortBtnText: { color: Colors.teal, fontSize: 11, flex: 1 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: { marginLeft: 8 },
  searchInput: { flex: 1, color: Colors.white, fontSize: 14, textAlign: 'right' },
  clearSearch: { padding: 4 },
  pillsRow: { flexDirection: 'row', paddingHorizontal: 16, alignItems: 'center' },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillActive: { backgroundColor: 'rgba(15,123,160,0.2)', borderColor: Colors.teal },
  pillText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  pillTextActive: { color: Colors.teal, fontWeight: 'bold' },
  clearFiltersBtn: { marginRight: 8, paddingHorizontal: 12, paddingVertical: 6 },
  clearFiltersBtnText: { color: '#ef4444', fontSize: 12 },
  resultsMeta: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8 },
  resultsCount: { color: Colors.textMuted, fontSize: 13 },
  resultsFiltered: { color: Colors.teal, fontSize: 13 },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 24 },
  emptyBtn: { backgroundColor: Colors.teal, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginHorizontal: 24,
    marginTop: 4,
    backgroundColor: 'rgba(15,123,160,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(15,123,160,0.2)',
  },
  loadMoreText: { color: Colors.teal, fontSize: 14, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  filterSheet: {
    backgroundColor: Colors.navy,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_H * 0.88,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  sheetHandle: { width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  sheetTitle: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
  resetText: { color: '#ef4444', fontSize: 14 },
  sectionLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 18, marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipSmall: { paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { backgroundColor: 'rgba(15,123,160,0.2)', borderColor: Colors.teal },
  chipText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  chipTextActive: { color: Colors.teal, fontWeight: 'bold' },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rangeInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: Colors.white,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: 'right',
  },
  rangeSep: { color: Colors.textMuted, fontSize: 16 },
  applyBtn: {
    backgroundColor: Colors.teal,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 16,
  },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
