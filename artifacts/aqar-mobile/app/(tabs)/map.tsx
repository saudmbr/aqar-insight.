import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { ListingsResponse, fetchListings, formatPrice, Listing } from '@/constants/api';

const REGIONS = [
  { label: 'الرياض', city: 'الرياض', lat: 24.7136, lng: 46.6753, color: '#0B1628' },
  { label: 'جدة', city: 'جدة', lat: 21.4858, lng: 39.1925, color: '#0F2847' },
  { label: 'مكة', city: 'مكة المكرمة', lat: 21.3891, lng: 39.8579, color: '#1A3A5C' },
  { label: 'المدينة', city: 'المدينة المنورة', lat: 24.5247, lng: 39.5692, color: '#163352' },
  { label: 'الدمام', city: 'الدمام', lat: 26.4207, lng: 50.0888, color: '#0D2338' },
  { label: 'تبوك', city: 'تبوك', lat: 28.3998, lng: 36.5716, color: '#122940' },
];

function openInMaps(lat: number, lng: number, label: string) {
  const url = Platform.OS === 'ios'
    ? `maps:?q=${encodeURIComponent(label)}&ll=${lat},${lng}`
    : `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})`;
  Linking.openURL(url).catch(() => {
    Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
  });
}

function openListingInMaps(listing: Listing) {
  if (listing.latitude && listing.longitude) {
    openInMaps(listing.latitude, listing.longitude, listing.title);
  }
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);

  const { data, isLoading } = useQuery<ListingsResponse>({
    queryKey: ['map-listings', selectedRegion.city],
    queryFn: () =>
      fetchListings(new URLSearchParams({ limit: '30', city: selectedRegion.city })),
  });

  const listings = data?.listings ?? [];
  const withCoords = listings.filter(l => l.latitude && l.longitude);
  const saleCount = listings.filter(l => l.listingType === 'sale').length;
  const rentCount = listings.filter(l => l.listingType === 'rent').length;

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[Colors.navyDark, Colors.navy]}
        style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 8 : insets.top + 12 }]}
      >
        <Text style={styles.headerTitle}>الخريطة العقارية</Text>
        <Text style={styles.headerSub}>استكشف العقارات في مختلف المدن</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.regionsRow}
        >
          {REGIONS.map((r) => (
            <Pressable
              key={r.label}
              style={[styles.regionChip, selectedRegion.label === r.label && styles.regionChipActive]}
              onPress={() => setSelectedRegion(r)}
            >
              <Text style={[styles.regionText, selectedRegion.label === r.label && styles.regionTextActive]}>
                {r.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.mapCard}
          onPress={() => openInMaps(selectedRegion.lat, selectedRegion.lng, selectedRegion.city)}
          android_ripple={{ color: 'rgba(15,123,160,0.15)' }}
        >
          <LinearGradient
            colors={[selectedRegion.color, Colors.teal + 'DD']}
            style={styles.mapCardGradient}
          >
            <View style={styles.mapPinRow}>
              <View style={styles.mapPinOuter}>
                <View style={styles.mapPinInner}>
                  <Feather name="map-pin" size={28} color={Colors.white} />
                </View>
              </View>
            </View>
            <Text style={styles.mapCityName}>{selectedRegion.city}</Text>
            <Text style={styles.mapCoords}>
              {selectedRegion.lat.toFixed(4)}°N  {selectedRegion.lng.toFixed(4)}°E
            </Text>
            <View style={styles.mapStats}>
              <View style={styles.mapStatBadge}>
                <Text style={styles.mapStatText}>{listings.length} عقار</Text>
              </View>
              <View style={[styles.mapStatBadge, { backgroundColor: 'rgba(201,168,76,0.3)' }]}>
                <Text style={[styles.mapStatText, { color: Colors.gold }]}>{saleCount} للبيع</Text>
              </View>
              <View style={[styles.mapStatBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Text style={styles.mapStatText}>{rentCount} للإيجار</Text>
              </View>
            </View>
            <View style={styles.openMapsBtn}>
              <Feather name="external-link" size={14} color={Colors.white} />
              <Text style={styles.openMapsBtnText}>افتح في تطبيق الخرائط</Text>
            </View>
          </LinearGradient>
        </Pressable>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <Text style={styles.loadingText}>جارٍ تحميل العقارات...</Text>
          </View>
        ) : listings.length === 0 ? (
          <View style={styles.emptyBox}>
            <Feather name="inbox" size={40} color={Colors.border} />
            <Text style={styles.emptyText}>لا يوجد عقارات في {selectedRegion.city} حالياً</Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>عقارات في {selectedRegion.city}</Text>
              <Text style={styles.sectionCount}>{listings.length} عقار</Text>
            </View>

            {listings.map((item) => (
              <Pressable
                key={item.id}
                style={styles.listingRow}
                onPress={() => router.push({ pathname: '/listing/[id]', params: { id: String(item.id) } })}
                android_ripple={{ color: 'rgba(11,22,40,0.06)' }}
              >
                <View style={styles.listingRowLeft}>
                  <Pressable
                    style={styles.pinBtn}
                    onPress={(e) => { e.stopPropagation(); openListingInMaps(item); }}
                    hitSlop={8}
                  >
                    <Feather
                      name="map-pin"
                      size={16}
                      color={item.latitude ? Colors.teal : Colors.border}
                    />
                  </Pressable>
                </View>

                <View style={styles.listingRowBody}>
                  <View style={styles.listingRowTop}>
                    <View style={[styles.typeTag, item.listingType === 'rent' && styles.typeTagRent]}>
                      <Text style={styles.typeTagText}>
                        {item.listingType === 'rent' ? 'إيجار' : 'بيع'}
                      </Text>
                    </View>
                    <Text style={styles.listingPrice}>{formatPrice(item.price)} ريال</Text>
                  </View>
                  <Text style={styles.listingTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={styles.listingMeta}>
                    <Feather name="home" size={12} color={Colors.textMuted} />
                    <Text style={styles.listingMetaText}>{item.propertyType}</Text>
                    {item.district ? (
                      <>
                        <Text style={styles.listingMetaDot}>·</Text>
                        <Feather name="map-pin" size={12} color={Colors.textMuted} />
                        <Text style={styles.listingMetaText}>{item.district}</Text>
                      </>
                    ) : null}
                    {item.areaSqm ? (
                      <>
                        <Text style={styles.listingMetaDot}>·</Text>
                        <Text style={styles.listingMetaText}>{item.areaSqm} م²</Text>
                      </>
                    ) : null}
                  </View>
                </View>

                <Feather name="chevron-left" size={16} color={Colors.border} style={styles.rowArrow} />
              </Pressable>
            ))}

            {withCoords.length > 0 && (
              <Pressable
                style={styles.openAllBtn}
                onPress={() => openInMaps(selectedRegion.lat, selectedRegion.lng, selectedRegion.city)}
              >
                <LinearGradient colors={[Colors.navy, Colors.teal]} style={styles.openAllGradient}>
                  <Feather name="map" size={18} color={Colors.white} />
                  <Text style={styles.openAllText}>
                    عرض {withCoords.length} عقار على الخريطة
                  </Text>
                </LinearGradient>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'right',
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'right',
    marginBottom: 14,
  },
  regionsRow: {
    gap: 8,
    flexDirection: 'row-reverse',
    paddingVertical: 2,
  },
  regionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  regionChipActive: {
    backgroundColor: Colors.teal,
    borderColor: Colors.teal,
  },
  regionText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  regionTextActive: { color: Colors.white },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  mapCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  mapCardGradient: {
    padding: 24,
    alignItems: 'center',
    gap: 10,
    minHeight: 220,
    justifyContent: 'center',
  },
  mapPinRow: { marginBottom: 4 },
  mapPinOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPinInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapCityName: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.white,
    textAlign: 'center',
  },
  mapCoords: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  mapStats: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  mapStatBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(15,123,160,0.3)',
  },
  mapStatText: { fontSize: 12, color: Colors.white, fontWeight: '600' },
  openMapsBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 4,
  },
  openMapsBtnText: { fontSize: 13, color: Colors.white, fontWeight: '600' },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: { fontSize: 14, color: Colors.textMuted },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  sectionCount: {
    fontSize: 12,
    color: Colors.textMuted,
    backgroundColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  listingRow: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  listingRowLeft: { width: 32, alignItems: 'center' },
  pinBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingRowBody: { flex: 1, gap: 4 },
  listingRowTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeTag: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeTagRent: { backgroundColor: Colors.gold },
  typeTagText: { fontSize: 10, color: Colors.white, fontWeight: '700' },
  listingPrice: { fontSize: 15, fontWeight: '800', color: Colors.navy },
  listingTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'right',
  },
  listingMeta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  listingMetaText: { fontSize: 11, color: Colors.textMuted },
  listingMetaDot: { fontSize: 11, color: Colors.border },
  rowArrow: { marginLeft: 4 },
  openAllBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  openAllGradient: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  openAllText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
});
