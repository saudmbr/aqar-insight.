import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState, useMemo } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { ListingsResponse, fetchListings, formatPrice, Listing, PROPERTY_TYPES } from '@/constants/api';
import { MapViewPlatform } from '@/components/MapViewPlatform';

const { height: SCREEN_H } = Dimensions.get('window');

const CITIES = [
  { label: 'الكل', value: '' },
  { label: 'الرياض', value: 'الرياض' },
  { label: 'جدة', value: 'جدة' },
  { label: 'مكة المكرمة', value: 'مكة المكرمة' },
  { label: 'المدينة المنورة', value: 'المدينة المنورة' },
  { label: 'الدمام', value: 'الدمام' },
  { label: 'تبوك', value: 'تبوك' },
];

const LISTING_TYPES = [
  { label: 'الكل', value: '' },
  { label: 'للبيع', value: 'sale' },
  { label: 'للإيجار', value: 'rent' },
];

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [city, setCity] = useState('');
  const [listingType, setListingType] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const { data, isLoading } = useQuery<ListingsResponse>({
    queryKey: ['map-listings-v2', city, listingType, propertyType],
    queryFn: () => {
      const p = new URLSearchParams({ limit: '100' });
      if (city) p.set('city', city);
      if (listingType) p.set('listingType', listingType);
      if (propertyType) p.set('propertyType', propertyType);
      return fetchListings(p);
    },
    staleTime: 1000 * 60 * 3,
  });

  const listings = data?.listings ?? [];
  const mappableListing = listings.filter(l => l.latitude && l.longitude);
  const activeFilters = [city, listingType, propertyType].filter(Boolean).length;

  return (
    <View style={styles.screen}>
      {/* ═══ HEADER ═══ */}
      <LinearGradient
        colors={[Colors.navyDark, Colors.navy]}
        style={[styles.header, { paddingTop: topPad + 10 }]}
      >
        <View style={styles.headerRow}>
          <Pressable style={styles.filterIconBtn} onPress={() => setShowFilterModal(true)}>
            <Feather name="sliders" size={18} color={Colors.white} />
            {activeFilters > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilters}</Text>
              </View>
            )}
          </Pressable>

          <View style={styles.titleWrap}>
            <Text style={styles.headerTitle}>الخريطة التفاعلية</Text>
            <Text style={styles.headerSub}>
              {isLoading ? 'جارٍ التحميل...' : `${mappableListing.length} عقار على الخريطة`}
            </Text>
          </View>

          <Pressable style={styles.filterIconBtn} onPress={() => router.back()}>
            <Feather name="x" size={18} color={Colors.white} />
          </Pressable>
        </View>

        {/* City chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.cityScroll}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10 }}
        >
          {CITIES.map(c => (
            <Pressable
              key={c.value}
              style={[styles.cityChip, city === c.value && styles.cityChipActive]}
              onPress={() => setCity(c.value)}
            >
              <Text style={[styles.cityChipText, city === c.value && styles.cityChipTextActive]}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Type pills */}
        <View style={styles.pillsRow}>
          {LISTING_TYPES.map(t => (
            <Pressable
              key={t.value}
              style={[styles.typePill, listingType === t.value && styles.typePillActive]}
              onPress={() => setListingType(t.value)}
            >
              <Text style={[styles.typePillText, listingType === t.value && styles.typePillTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </LinearGradient>

      {/* ═══ MAP ═══ */}
      <View style={styles.mapWrap}>
        {isLoading ? (
          <View style={styles.mapLoading}>
            <Feather name="map" size={36} color={Colors.teal} />
            <Text style={styles.mapLoadingText}>جارٍ تحميل الخريطة والعقارات...</Text>
          </View>
        ) : (
          <MapViewPlatform
            listings={listings}
            onMarkerPress={listing => setSelectedListing(listing)}
          />
        )}
      </View>

      {/* ═══ STATS BAR ═══ */}
      <View style={[styles.statsBar, { paddingBottom: botPad + 8 }]}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{listings.length}</Text>
          <Text style={styles.statLabel}>إجمالي العقارات</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{listings.filter(l => l.listingType === 'sale').length}</Text>
          <Text style={styles.statLabel}>للبيع</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{listings.filter(l => l.listingType === 'rent').length}</Text>
          <Text style={styles.statLabel}>للإيجار</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{mappableListing.length}</Text>
          <Text style={styles.statLabel}>على الخريطة</Text>
        </View>
      </View>

      {/* ═══ SELECTED LISTING CARD ═══ */}
      {selectedListing && (
        <Pressable
          style={styles.selectedCard}
          onPress={() => router.push(`/listing/${selectedListing.id}`)}
        >
          <View style={styles.selectedCardInner}>
            <View style={styles.selectedCardInfo}>
              <View style={styles.selectedBadgesRow}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>
                    {selectedListing.listingType === 'sale' ? 'للبيع' : 'للإيجار'}
                  </Text>
                </View>
                <Text style={styles.selectedPropType}>{selectedListing.propertyType}</Text>
              </View>
              <Text style={styles.selectedTitle} numberOfLines={1}>{selectedListing.title}</Text>
              <Text style={styles.selectedLocation} numberOfLines={1}>
                📍 {selectedListing.district ?? selectedListing.city ?? ''}
              </Text>
            </View>
            <View style={styles.selectedCardRight}>
              <Text style={styles.selectedPrice}>{formatPrice(selectedListing.price)}</Text>
              <Pressable style={styles.viewBtn} onPress={() => router.push(`/listing/${selectedListing.id}`)}>
                <Text style={styles.viewBtnText}>عرض</Text>
                <Feather name="chevron-left" size={12} color="#fff" />
              </Pressable>
              <Pressable style={styles.closeCardBtn} onPress={() => setSelectedListing(null)}>
                <Feather name="x" size={14} color={Colors.textMuted} />
              </Pressable>
            </View>
          </View>
        </Pressable>
      )}

      {/* ═══ FILTER MODAL ═══ */}
      <Modal visible={showFilterModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilterModal(false)} />
        <View style={styles.filterSheet}>
          <View style={styles.filterHandle} />
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>فلترة الخريطة</Text>
            <Pressable onPress={() => { setCity(''); setListingType(''); setPropertyType(''); }}>
              <Text style={styles.filterReset}>إعادة تعيين</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* City filter */}
            <Text style={styles.filterSectionLabel}>المدينة</Text>
            <View style={styles.filterGrid}>
              {CITIES.map(c => (
                <Pressable
                  key={c.value}
                  style={[styles.filterChip, city === c.value && styles.filterChipActive]}
                  onPress={() => setCity(c.value)}
                >
                  <Text style={[styles.filterChipText, city === c.value && styles.filterChipTextActive]}>
                    {c.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Listing type */}
            <Text style={styles.filterSectionLabel}>نوع الصفقة</Text>
            <View style={styles.filterRow}>
              {LISTING_TYPES.map(t => (
                <Pressable
                  key={t.value}
                  style={[styles.filterChip, listingType === t.value && styles.filterChipActive]}
                  onPress={() => setListingType(t.value)}
                >
                  <Text style={[styles.filterChipText, listingType === t.value && styles.filterChipTextActive]}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Property type */}
            <Text style={styles.filterSectionLabel}>نوع العقار</Text>
            <View style={styles.filterGrid}>
              {(['', ...PROPERTY_TYPES] as string[]).map(pt => (
                <Pressable
                  key={pt}
                  style={[styles.filterChip, propertyType === pt && styles.filterChipActive]}
                  onPress={() => setPropertyType(pt)}
                >
                  <Text style={[styles.filterChipText, propertyType === pt && styles.filterChipTextActive]}>
                    {pt === '' ? 'الكل' : pt}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Pressable style={styles.applyBtn} onPress={() => setShowFilterModal(false)}>
            <Text style={styles.applyBtnText}>تطبيق الفلاتر ({activeFilters} محدد)</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.navy },
  header: { paddingBottom: 0 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.teal,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  titleWrap: { flex: 1, alignItems: 'center' },
  headerTitle: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  cityScroll: { marginTop: 4 },
  cityChip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cityChipActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  cityChipText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  cityChipTextActive: { color: '#fff', fontWeight: 'bold' },
  pillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typePill: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  typePillActive: { backgroundColor: 'rgba(15,123,160,0.3)', borderColor: Colors.teal },
  typePillText: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  typePillTextActive: { color: Colors.teal, fontWeight: 'bold' },
  mapWrap: { flex: 1 },
  mapLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1628', gap: 12 },
  mapLoadingText: { color: Colors.textMuted, fontSize: 14, marginTop: 8 },
  statsBar: {
    backgroundColor: Colors.navyDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: Colors.teal, fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.08)' },
  selectedCard: {
    position: 'absolute',
    bottom: 90,
    left: 12,
    right: 12,
    backgroundColor: Colors.navyDark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.teal,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  selectedCardInner: { flexDirection: 'row', padding: 14, alignItems: 'center' },
  selectedCardInfo: { flex: 1, marginRight: 12 },
  selectedBadgesRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  typeBadge: { backgroundColor: Colors.teal, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginRight: 6 },
  typeBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  selectedPropType: { color: Colors.textMuted, fontSize: 11 },
  selectedTitle: { color: Colors.white, fontSize: 13, fontWeight: '600', marginBottom: 3 },
  selectedLocation: { color: Colors.textMuted, fontSize: 11 },
  selectedCardRight: { alignItems: 'flex-end', gap: 6 },
  selectedPrice: { color: Colors.gold, fontSize: 14, fontWeight: 'bold' },
  viewBtn: {
    backgroundColor: Colors.teal,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  closeCardBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  filterSheet: {
    backgroundColor: Colors.navy,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_H * 0.75,
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  filterHandle: { width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  filterTitle: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
  filterReset: { color: Colors.teal, fontSize: 14 },
  filterSectionLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 10, marginTop: 14 },
  filterGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap' },
  filterChip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterChipActive: { backgroundColor: 'rgba(15,123,160,0.2)', borderColor: Colors.teal },
  filterChipText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  filterChipTextActive: { color: Colors.teal, fontWeight: 'bold' },
  applyBtn: {
    backgroundColor: Colors.teal,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  applyBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});
