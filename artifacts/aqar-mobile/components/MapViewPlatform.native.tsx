import React, { useRef, useState, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Animated } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Listing, formatPrice } from '@/constants/api';

interface Props {
  listings: Listing[];
  onMarkerPress?: (listing: Listing) => void;
}

const SAUDI_REGION: Region = {
  latitude: 24.7136,
  longitude: 46.6753,
  latitudeDelta: 10,
  longitudeDelta: 10,
};

export function MapViewPlatform({ listings, onMarkerPress }: Props) {
  const mapRef = useRef<MapView>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const withCoords = listings.filter(l => l.latitude && l.longitude);

  const fitAllMarkers = useCallback(() => {
    if (!mapRef.current || withCoords.length === 0) return;
    mapRef.current.fitToCoordinates(
      withCoords.map(l => ({ latitude: l.latitude!, longitude: l.longitude! })),
      { edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, animated: true }
    );
  }, [withCoords]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={SAUDI_REGION}
        onMapReady={fitAllMarkers}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        toolbarEnabled={false}
        mapType="standard"
      >
        {withCoords.map(listing => {
          const isSelected = selectedId === listing.id;
          return (
            <Marker
              key={listing.id}
              coordinate={{ latitude: listing.latitude!, longitude: listing.longitude! }}
              onPress={() => {
                setSelectedId(listing.id);
                onMarkerPress?.(listing);
              }}
              zIndex={isSelected ? 999 : 1}
            >
              <View style={[
                styles.priceBadge,
                listing.featured && styles.featuredBadge,
                isSelected && styles.selectedBadge,
              ]}>
                <Text style={styles.priceText}>{formatPrice(listing.price)}</Text>
              </View>
              <Callout onPress={() => router.push(`/listing/${listing.id}`)} tooltip>
                <View style={styles.callout}>
                  <Text style={styles.calloutType}>
                    {listing.propertyType} • {listing.listingType === 'sale' ? 'للبيع' : 'للإيجار'}
                  </Text>
                  <Text style={styles.calloutTitle} numberOfLines={2}>{listing.title}</Text>
                  <Text style={styles.calloutPrice}>{formatPrice(listing.price)}</Text>
                  <View style={styles.calloutMeta}>
                    {listing.bedrooms ? (
                      <Text style={styles.calloutMetaText}>🛏 {listing.bedrooms}</Text>
                    ) : null}
                    {listing.areaSqm ? (
                      <Text style={styles.calloutMetaText}>📐 {listing.areaSqm}م²</Text>
                    ) : null}
                    {listing.district ? (
                      <Text style={styles.calloutMetaText}>📍 {listing.district}</Text>
                    ) : null}
                  </View>
                  <View style={styles.calloutBtn}>
                    <Text style={styles.calloutBtnText}>عرض التفاصيل</Text>
                    <Feather name="chevron-left" size={14} color="#fff" />
                  </View>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <Pressable style={styles.fitBtn} onPress={fitAllMarkers}>
        <Feather name="maximize-2" size={16} color={Colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a2744' },
  priceBadge: {
    backgroundColor: '#0B1628',
    borderWidth: 2,
    borderColor: '#0F7BA0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  featuredBadge: { borderColor: '#C9A84C', backgroundColor: '#1a1400' },
  selectedBadge: { backgroundColor: '#0F7BA0', borderColor: '#fff', transform: [{ scale: 1.1 }] },
  priceText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  callout: {
    backgroundColor: '#0B1628',
    borderRadius: 12,
    padding: 14,
    minWidth: 220,
    maxWidth: 260,
    borderWidth: 1,
    borderColor: '#0F7BA0',
  },
  calloutType: { fontSize: 11, color: '#0F7BA0', marginBottom: 4 },
  calloutTitle: { fontSize: 13, fontWeight: 'bold', color: '#fff', marginBottom: 6, lineHeight: 18 },
  calloutPrice: { fontSize: 16, fontWeight: 'bold', color: '#C9A84C', marginBottom: 8 },
  calloutMeta: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10, gap: 8 },
  calloutMetaText: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  calloutBtn: {
    backgroundColor: '#0F7BA0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  calloutBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  fitBtn: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    backgroundColor: 'rgba(11,22,40,0.85)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#0F7BA0',
  },
});
