import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { ListingsResponse, fetchListings, formatPrice } from '@/constants/api';

const { height } = Dimensions.get('window');

const REGIONS = [
  { label: 'الرياض', lat: 24.7136, lng: 46.6753 },
  { label: 'جدة', lat: 21.4858, lng: 39.1925 },
  { label: 'مكة', lat: 21.3891, lng: 39.8579 },
  { label: 'المدينة', lat: 24.5247, lng: 39.5692 },
  { label: 'الدمام', lat: 26.4207, lng: 50.0888 },
];

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);

  const { data } = useQuery<ListingsResponse>({
    queryKey: ['map-listings', selectedRegion.label],
    queryFn: () =>
      fetchListings(new URLSearchParams({ limit: '50', city: selectedRegion.label })),
  });

  const listings = data?.listings ?? [];

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.title}>الخريطة العقارية</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.regionScroll}>
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
      </View>

      {/* Map Placeholder — react-native-maps will be added in next update */}
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapBg}>
          <Feather name="map" size={64} color={Colors.teal} />
          <Text style={styles.mapTitle}>خريطة {selectedRegion.label}</Text>
          <Text style={styles.mapSub}>{listings.length} عقار في المنطقة</Text>
          <View style={styles.coordsBox}>
            <Text style={styles.coordsText}>
              {selectedRegion.lat.toFixed(4)}°N, {selectedRegion.lng.toFixed(4)}°E
            </Text>
          </View>
        </View>
      </View>

      {/* Listings in this region */}
      {listings.length > 0 && (
        <View style={[styles.listingsPanel, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 10 }]}>
          <Text style={styles.panelTitle}>عقارات في {selectedRegion.label}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {listings.slice(0, 8).map((item) => (
              <Pressable
                key={item.id}
                style={styles.miniCard}
                onPress={() => router.push({ pathname: '/listing/[id]', params: { id: String(item.id) } })}
              >
                <View style={styles.miniType}>
                  <Text style={styles.miniTypeText}>{item.propertyType}</Text>
                </View>
                <Text style={styles.miniTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.miniPrice}>{formatPrice(item.price)} ريال</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
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
  title: { fontSize: 20, fontWeight: '800', color: Colors.text, textAlign: 'right', marginBottom: 10 },
  regionScroll: { gap: 8, flexDirection: 'row-reverse' },
  regionChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  regionChipActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  regionText: { fontSize: 13, fontWeight: '600', color: Colors.textSub },
  regionTextActive: { color: Colors.white },
  mapPlaceholder: { flex: 1, margin: 16, borderRadius: 20, overflow: 'hidden' },
  mapBg: {
    flex: 1,
    backgroundColor: Colors.navyMid,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  mapTitle: { fontSize: 22, fontWeight: '800', color: Colors.white, textAlign: 'center' },
  mapSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  coordsBox: {
    backgroundColor: 'rgba(15,123,160,0.3)',
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.teal,
  },
  coordsText: { fontSize: 12, color: Colors.tealLight, fontFamily: 'monospace' },
  listingsPanel: {
    backgroundColor: Colors.white,
    paddingTop: 12, paddingHorizontal: 16,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  panelTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, textAlign: 'right', marginBottom: 10 },
  hScroll: { gap: 10, flexDirection: 'row-reverse', paddingBottom: 4 },
  miniCard: {
    width: 140, backgroundColor: Colors.background,
    borderRadius: 14, padding: 12,
    gap: 6,
  },
  miniType: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.teal,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 8,
  },
  miniTypeText: { fontSize: 10, color: Colors.white, fontWeight: '700' },
  miniTitle: { fontSize: 12, fontWeight: '700', color: Colors.text, textAlign: 'right' },
  miniPrice: { fontSize: 12, fontWeight: '800', color: Colors.navy, textAlign: 'right' },
});
