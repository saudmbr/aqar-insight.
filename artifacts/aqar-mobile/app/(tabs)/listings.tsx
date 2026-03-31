import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { ListingCard, CARD_WIDTH } from '@/components/ListingCard';
import { SkeletonCard } from '@/components/SkeletonCard';

const TYPES = [
  { key: '', label: 'الكل' },
  { key: 'sale', label: 'للبيع' },
  { key: 'rent', label: 'للإيجار' },
];

export default function ListingsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string; propertyType?: string; listingType?: string }>();
  const [search, setSearch] = useState(params.q ?? '');
  const [listingType, setListingType] = useState(params.listingType ?? '');
  const [propertyType, setPropertyType] = useState(params.propertyType ?? '');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    if (params.propertyType) setPropertyType(params.propertyType);
    if (params.listingType) setListingType(params.listingType);
  }, [params.propertyType, params.listingType]);

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
    <View style={s.screen}>
      {/* ══ HEADER ══ */}
      <LinearGradient colors={[Colors.navyDark, Colors.navy]} style={[s.header, { paddingTop: topPad + 14 }]}>
        {/* Title row */}
        <View style={s.headerTop}>
          <Pressable
            style={[s.filterBtn, activeFiltersCount > 0 && s.filterBtnActive]}
            onPress={() => setShowFilters(true)}
          >
            {activeFiltersCount > 0 && (
              <View style={s.filterDot}>
                <Text style={s.filterDotText}>{activeFiltersCount}</Text>
              </View>
            )}
            <Feather name="sliders" size={18} color={activeFiltersCount > 0 ? Colors.teal : 'rgba(255,255,255,0.8)'} />
          </Pressable>
          <Text style={s.headerTitle}>العقارات</Text>
        </View>

        {/* Search */}
        <View style={s.searchRow}>
          <Feather name="search" size={15} color="rgba(255,255,255,0.45)" />
          <TextInput
            style={s.searchInput}
            placeholder="ابحث عن عقار، حي، مدينة..."
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={search}
            onChangeText={(v) => { setSearch(v); setPage(1); }}
            textAlign="right"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Feather name="x" size={15} color="rgba(255,255,255,0.6)" />
            </Pressable>
          )}
        </View>

        {/* Type chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.typeRow}>
          {TYPES.map((t) => (
            <Pressable
              key={t.key}
              style={[s.typeChip, listingType === t.key && s.typeChipActive]}
              onPress={() => { setListingType(t.key); setPage(1); }}
            >
              <Text style={[s.typeChipText, listingType === t.key && s.typeChipTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Active filter tags */}
        {(propertyType || region || city) && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.activeTags}>
            {propertyType && (
              <Pressable style={s.activeTag} onPress={() => setPropertyType('')}>
                <Text style={s.activeTagText}>{propertyType}</Text>
                <Feather name="x" size={10} color="#fff" style={{ marginRight: 3 }} />
              </Pressable>
            )}
            {region && (
              <Pressable style={s.activeTag} onPress={() => setRegion('')}>
                <Text style={s.activeTagText}>{region}</Text>
                <Feather name="x" size={10} color="#fff" style={{ marginRight: 3 }} />
              </Pressable>
            )}
            {city && (
              <Pressable style={s.activeTag} onPress={() => setCity('')}>
                <Text style={s.activeTagText}>{city}</Text>
                <Feather name="x" size={10} color="#fff" style={{ marginRight: 3 }} />
              </Pressable>
            )}
            <Pressable style={s.clearTag} onPress={clearFilters}>
              <Text style={s.clearTagText}>مسح الكل</Text>
            </Pressable>
          </ScrollView>
        )}

        {data && (
          <Text style={s.countText}>{data.total} عقار{isFetching ? ' ...' : ''}</Text>
        )}
      </LinearGradient>

      {/* ══ LIST ══ */}
      {isLoading ? (
        <View style={s.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={s.row}
          contentContainerStyle={[s.listContent, { paddingBottom: botPad + 24 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={s.cardWrap}>
              <ListingCard
                listing={item}
                onPress={() => router.push({ pathname: '/listing/[id]', params: { id: String(item.id) } })}
              />
            </View>
          )}
          ItemSeparatorComponent={() => <View style={s.itemSep} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Feather name="home" size={36} color={Colors.teal} />
              </View>
              <Text style={s.emptyTitle}>لا توجد عقارات</Text>
              <Text style={s.emptyText}>جرّب تغيير الفلتر أو مصطلح البحث</Text>
              {activeFiltersCount > 0 && (
                <Pressable style={s.clearBtn} onPress={clearFilters}>
                  <Text style={s.clearBtnText}>مسح الفلاتر</Text>
                </Pressable>
              )}
            </View>
          }
          onEndReached={() => {
            if (data && page < Math.ceil(data.total / 20)) setPage((p) => p + 1);
          }}
          onEndReachedThreshold={0.5}
        />
      )}

      {/* ══ FILTERS MODAL ══ */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <Pressable style={s.overlay} onPress={() => setShowFilters(false)}>
          <Pressable style={[s.sheet, { paddingBottom: botPad + 20 }]} onPress={() => {}}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}>
              <Pressable onPress={clearFilters}>
                <Text style={s.sheetClear}>مسح الكل</Text>
              </Pressable>
              <Text style={s.sheetTitle}>تصفية النتائج</Text>
              <Pressable onPress={() => setShowFilters(false)}>
                <Feather name="x" size={22} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.filterLabel}>نوع العقار</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pillRow}>
                {[{ key: '', label: 'الكل' }, ...PROPERTY_TYPES.map((k) => ({ key: k, label: k }))].map((t) => (
                  <Pressable
                    key={t.key}
                    style={[s.pill, propertyType === t.key && s.pillActive]}
                    onPress={() => setPropertyType(t.key)}
                  >
                    <Text style={[s.pillText, propertyType === t.key && s.pillTextActive]}>{t.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={s.filterLabel}>المنطقة</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pillRow}>
                {[{ key: '', label: 'كل المناطق' }, ...SAUDI_REGIONS.map((r) => ({ key: r, label: r }))].map((r) => (
                  <Pressable
                    key={r.key}
                    style={[s.pill, region === r.key && s.pillActive]}
                    onPress={() => { setRegion(r.key); setCity(''); }}
                  >
                    <Text style={[s.pillText, region === r.key && s.pillTextActive]}>{r.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={s.filterLabel}>المدينة</Text>
              <View style={s.cityRow}>
                <Feather name="map-pin" size={14} color={Colors.textMuted} />
                <TextInput
                  style={s.cityInput}
                  placeholder="اكتب اسم المدينة..."
                  placeholderTextColor={Colors.textMuted}
                  value={city}
                  onChangeText={setCity}
                  textAlign="right"
                />
                {city.length > 0 && (
                  <Pressable onPress={() => setCity('')} hitSlop={8}>
                    <Feather name="x" size={14} color={Colors.textMuted} />
                  </Pressable>
                )}
              </View>

              <Text style={s.filterLabel}>نوع الإعلان</Text>
              <View style={s.typeToggle}>
                {TYPES.map((t) => (
                  <Pressable
                    key={t.key}
                    style={[s.typeToggleBtn, listingType === t.key && s.typeToggleBtnActive]}
                    onPress={() => setListingType(t.key)}
                  >
                    <Text style={[s.typeToggleText, listingType === t.key && s.typeToggleTextActive]}>
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Pressable
              style={s.applyBtn}
              onPress={() => { setPage(1); setShowFilters(false); }}
            >
              <Text style={s.applyBtnText}>تطبيق الفلاتر</Text>
              {activeFiltersCount > 0 && (
                <View style={s.applyBadge}>
                  <Text style={s.applyBadgeText}>{activeFiltersCount}</Text>
                </View>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const HORIZ_PAD = 16;
const COL_GAP = 12;

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },

  /* Header */
  header: { paddingHorizontal: HORIZ_PAD, paddingBottom: 12 },
  headerTop: {
    flexDirection: 'row-reverse', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  filterBtn: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  filterBtnActive: { backgroundColor: 'rgba(15,123,160,0.25)' },
  filterDot: {
    position: 'absolute', top: -4, right: -4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.teal,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1,
  },
  filterDotText: { fontSize: 10, fontWeight: '800', color: '#fff' },

  searchRow: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14,
    paddingHorizontal: 12, height: 46, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#fff', marginRight: 8 },

  typeRow: { paddingBottom: 4 },
  typeChip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.08)', marginLeft: 8,
  },
  typeChipActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  typeChipText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  typeChipTextActive: { color: '#fff' },

  activeTags: { paddingTop: 8, paddingBottom: 2 },
  activeTag: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: Colors.teal, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, marginLeft: 6,
  },
  activeTagText: { fontSize: 11, fontWeight: '700', color: '#fff', marginLeft: 4 },
  clearTag: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)', marginLeft: 6,
  },
  clearTagText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },

  countText: { fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'right', marginTop: 8 },

  /* Skeleton grid */
  skeletonGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    padding: HORIZ_PAD,
  },

  /* FlatList */
  listContent: { paddingHorizontal: HORIZ_PAD, paddingTop: 14 },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  cardWrap: { width: CARD_WIDTH },
  itemSep: { height: COL_GAP },

  /* Empty */
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 26,
    backgroundColor: 'rgba(15,123,160,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  emptyText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginBottom: 16 },
  clearBtn: {
    backgroundColor: Colors.teal, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14,
  },
  clearBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  /* Modal */
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12, maxHeight: '88%',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row-reverse', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  sheetClear: { fontSize: 13, color: Colors.teal, fontWeight: '600' },

  filterLabel: {
    fontSize: 13, fontWeight: '700', color: Colors.text,
    textAlign: 'right', marginBottom: 10, marginTop: 16,
  },
  pillRow: { paddingBottom: 4 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1.5, borderColor: Colors.border, marginLeft: 8,
  },
  pillActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  pillText: { fontSize: 13, fontWeight: '600', color: Colors.textSub },
  pillTextActive: { color: '#fff' },

  cityRow: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: 14,
    paddingHorizontal: 14, height: 46,
    borderWidth: 1, borderColor: Colors.border,
  },
  cityInput: { flex: 1, fontSize: 14, color: Colors.text, marginRight: 8 },

  typeToggle: { flexDirection: 'row-reverse' },
  typeToggleBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 14,
    backgroundColor: Colors.background, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border, marginLeft: 8,
  },
  typeToggleBtnActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  typeToggleText: { fontSize: 13, fontWeight: '600', color: Colors.textSub },
  typeToggleTextActive: { color: '#fff' },

  applyBtn: {
    marginTop: 20, backgroundColor: Colors.teal, borderRadius: 16,
    paddingVertical: 16, flexDirection: 'row-reverse',
    alignItems: 'center', justifyContent: 'center',
  },
  applyBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  applyBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  applyBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
});
