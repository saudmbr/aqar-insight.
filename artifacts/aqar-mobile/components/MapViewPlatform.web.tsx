import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Text, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Listing, formatPrice } from '@/constants/api';

const { width, height } = Dimensions.get('window');

interface Props {
  listings: Listing[];
  onMarkerPress?: (listing: Listing) => void;
}

function injectLeafletCSS() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('leaflet-css')) return;
  const link = document.createElement('link');
  link.id = 'leaflet-css';
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
  const style = document.createElement('style');
  style.textContent = `
    .leaflet-container { width: 100%; height: 100%; background: #1a2744; }
    .property-marker { display:flex; align-items:center; justify-content:center; }
    .price-badge {
      background: #0B1628;
      border: 2px solid #0F7BA0;
      border-radius: 20px;
      padding: 4px 10px;
      color: white;
      font-size: 12px;
      font-family: Arial, sans-serif;
      font-weight: bold;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      cursor: pointer;
      transition: all 0.2s;
    }
    .price-badge:hover { background: #0F7BA0; transform: scale(1.05); }
    .price-badge.featured { border-color: #C9A84C; background: #1a1400; }
    .price-badge.selected { background: #0F7BA0; border-color: #fff; transform: scale(1.1); }
    .leaflet-popup-content-wrapper {
      background: #0B1628;
      border: 1px solid #0F7BA0;
      border-radius: 12px;
      padding: 0;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6);
    }
    .leaflet-popup-content { margin: 0; }
    .leaflet-popup-tip { background: #0B1628; }
    .leaflet-popup-close-button { color: rgba(255,255,255,0.6) !important; top:6px!important; right:8px!important; font-size:18px!important; }
    .leaflet-tile-pane { filter: brightness(0.9) saturate(0.8); }
  `;
  document.head.appendChild(style);
}

export function MapViewPlatform({ listings, onMarkerPress }: Props) {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    injectLeafletCSS();

    let L: any;
    let map: any;

    const init = async () => {
      try {
        L = (await import('leaflet')).default;

        if (!mapContainerRef.current || mapRef.current) return;

        map = L.map(mapContainerRef.current, {
          center: [24.7136, 46.6753],
          zoom: 6,
          zoomControl: true,
          attributionControl: false,
        });

        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        setIsReady(true);
      } catch (e) {
        console.warn('Map init error:', e);
      }
    };

    init();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isReady || !mapRef.current) return;

    const initMarkers = async () => {
      const L = (await import('leaflet')).default;
      const map = mapRef.current;

      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      const withCoords = listings.filter(l => l.latitude && l.longitude);

      withCoords.forEach(listing => {
        const priceText = formatPrice(listing.price);
        const isFeatured = listing.featured;

        const icon = L.divIcon({
          className: 'property-marker',
          html: `<div class="price-badge ${isFeatured ? 'featured' : ''}" data-id="${listing.id}">${priceText}</div>`,
          iconAnchor: [30, 15],
        });

        const marker = L.marker([listing.latitude!, listing.longitude!], { icon });

        const popupHTML = `
          <div style="min-width:220px; padding:12px; direction:rtl;">
            <div style="font-size:11px; color:#0F7BA0; margin-bottom:4px; font-family:Arial;">
              ${listing.propertyType ?? ''} • ${listing.listingType === 'sale' ? 'للبيع' : 'للإيجار'}
            </div>
            <div style="font-size:13px; font-weight:bold; color:white; margin-bottom:6px; font-family:Arial; line-height:1.4;">
              ${listing.title}
            </div>
            <div style="font-size:16px; color:#C9A84C; font-weight:bold; margin-bottom:6px; font-family:Arial;">
              ${priceText}
            </div>
            <div style="font-size:11px; color:rgba(255,255,255,0.6); margin-bottom:10px; font-family:Arial;">
              📍 ${listing.district ?? listing.city ?? ''}
            </div>
            <div style="display:flex; gap:12px; margin-bottom:10px;">
              ${listing.bedrooms ? `<span style="font-size:11px; color:rgba(255,255,255,0.7); font-family:Arial;">🛏 ${listing.bedrooms} غرف</span>` : ''}
              ${listing.areaSqm ? `<span style="font-size:11px; color:rgba(255,255,255,0.7); font-family:Arial;">📐 ${listing.areaSqm} م²</span>` : ''}
            </div>
            <button
              onclick="window.__mapListingClick(${listing.id})"
              style="width:100%; background:#0F7BA0; color:white; border:none; border-radius:8px; padding:8px; font-family:Arial; font-size:12px; cursor:pointer; font-weight:bold;"
            >عرض التفاصيل ◄</button>
          </div>
        `;

        marker.bindPopup(popupHTML, { maxWidth: 260 });
        marker.on('click', () => setSelectedListing(listing));
        marker.addTo(map);
        markersRef.current.push(marker);
      });

      if (typeof window !== 'undefined') {
        (window as any).__mapListingClick = (id: number) => {
          router.push(`/listing/${id}`);
        };
      }

      if (withCoords.length > 0) {
        const bounds = L.latLngBounds(withCoords.map(l => [l.latitude!, l.longitude!]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }
    };

    initMarkers();
  }, [isReady, listings]);

  return (
    <View style={styles.container}>
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%', borderRadius: 0 }}
      />
      {!isReady && (
        <View style={styles.loading}>
          <Feather name="map" size={32} color={Colors.teal} />
          <Text style={styles.loadingText}>جارٍ تحميل الخريطة...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a2744' },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1628', gap: 12 },
  loadingText: { color: Colors.textMuted, fontSize: 14, fontFamily: 'System', marginTop: 12 },
});
