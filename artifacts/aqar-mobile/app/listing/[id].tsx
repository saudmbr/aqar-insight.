import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Listing, apiFetch, endpoints, formatPrice, listingTypeLabel } from '@/constants/api';
import { useFavorites } from '@/context/FavoritesContext';

const { width } = Dimensions.get('window');

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [imgIndex, setImgIndex] = useState(0);

  const { data: listing, isLoading, error } = useQuery<Listing>({
    queryKey: ['listing', id],
    queryFn: () => apiFetch<Listing>(endpoints.listing(Number(id))),
    enabled: !!id,
  });

  const fav = listing ? isFavorite(listing.id) : false;

  const handleCall = () => {
    if (listing?.marketerPhone) {
      Linking.openURL(`tel:${listing.marketerPhone}`);
    } else {
      Alert.alert('تواصل', 'رقم التواصل غير متاح لهذا العقار');
    }
  };

  const handleWhatsApp = () => {
    if (listing?.marketerPhone) {
      const phone = listing.marketerPhone.replace(/\D/g, '');
      Linking.openURL(`https://wa.me/${phone}`);
    } else {
      Alert.alert('واتساب', 'رقم التواصل غير متاح');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingHeader} />
        <View style={styles.loadingContent}>
          {[1, 2, 3].map((i) => <View key={i} style={styles.loadingLine} />)}
        </View>
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View style={styles.errorScreen}>
        <Feather name="alert-circle" size={48} color={Colors.danger} />
        <Text style={styles.errorText}>تعذّر تحميل العقار</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>العودة</Text>
        </Pressable>
      </View>
    );
  }

  const images = listing.images ?? [];
  const currentImage = images[imgIndex];

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          {currentImage ? (
            <Image source={{ uri: currentImage }} style={styles.heroImage} contentFit="cover" />
          ) : (
            <View style={[styles.heroImage, styles.imagePlaceholder]}>
              <Feather name="home" size={56} color={Colors.teal} />
            </View>
          )}

          {/* Nav Bar */}
          <View style={[styles.navBar, { top: (Platform.OS === 'web' ? 67 : insets.top) + 8 }]}>
            <Pressable
              style={styles.navBtn}
              onPress={() => {
                toggleFavorite(listing);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Feather name="heart" size={20} color={fav ? Colors.danger : Colors.white} />
            </Pressable>
            <Pressable style={styles.navBtn} onPress={() => router.back()}>
              <Feather name="arrow-right" size={20} color={Colors.white} />
            </Pressable>
          </View>

          {/* Image Thumbnails */}
          {images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbRow}
              contentContainerStyle={styles.thumbContent}
            >
              {images.map((img, i) => (
                <Pressable key={i} onPress={() => setImgIndex(i)}>
                  <Image
                    source={{ uri: img }}
                    style={[styles.thumb, i === imgIndex && styles.thumbActive]}
                    contentFit="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* Type Badge */}
          <View style={[styles.typeBadge, listing.listingType === 'rent' && styles.typeBadgeRent]}>
            <Text style={styles.typeBadgeText}>{listingTypeLabel[listing.listingType]}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title & Price */}
          <View style={styles.titleRow}>
            <View style={styles.propTypeBadge}>
              <Text style={styles.propTypeText}>{listing.propertyType}</Text>
            </View>
          </View>
          <Text style={styles.title}>{listing.title}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.sar}>ريال</Text>
            <Text style={styles.price}>{listing.price.toLocaleString('ar-SA')}</Text>
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={14} color={Colors.teal} />
            <Text style={styles.location}>
              {[listing.district, listing.city, listing.region].filter(Boolean).join(' ، ')}
            </Text>
          </View>

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            {listing.bedrooms != null && (
              <View style={styles.detailBox}>
                <Feather name="moon" size={18} color={Colors.teal} />
                <Text style={styles.detailNum}>{listing.bedrooms}</Text>
                <Text style={styles.detailLabel}>غرف</Text>
              </View>
            )}
            {listing.bathrooms != null && (
              <View style={styles.detailBox}>
                <Feather name="droplet" size={18} color={Colors.teal} />
                <Text style={styles.detailNum}>{listing.bathrooms}</Text>
                <Text style={styles.detailLabel}>دورات</Text>
              </View>
            )}
            {listing.areaSqm != null && (
              <View style={styles.detailBox}>
                <Feather name="maximize-2" size={18} color={Colors.teal} />
                <Text style={styles.detailNum}>{listing.areaSqm}</Text>
                <Text style={styles.detailLabel}>م²</Text>
              </View>
            )}
          </View>

          {/* Description */}
          {listing.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>الوصف</Text>
              <Text style={styles.description}>{listing.description}</Text>
            </View>
          )}

          {/* Seller / Marketer */}
          {(listing.sellerName || listing.marketerName) && (
            <View style={styles.marketerCard}>
              <View style={styles.marketerAvatar}>
                <Feather name="user" size={22} color={Colors.teal} />
              </View>
              <View style={styles.marketerInfo}>
                <Text style={styles.marketerLabel}>المسوّق العقاري</Text>
                <Text style={styles.marketerNameStyle}>{listing.sellerName ?? listing.marketerName}</Text>
              </View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 10 }]}>
        <Pressable style={styles.whatsappBtn} onPress={handleWhatsApp}>
          <Feather name="message-circle" size={20} color={Colors.white} />
          <Text style={styles.ctaBtnText}>واتساب</Text>
        </Pressable>
        <Pressable style={styles.callBtn} onPress={handleCall}>
          <Feather name="phone" size={20} color={Colors.white} />
          <Text style={styles.ctaBtnText}>اتصال</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  loadingScreen: { flex: 1, backgroundColor: Colors.background },
  loadingHeader: { height: 320, backgroundColor: Colors.skeleton },
  loadingContent: { padding: 20, gap: 12 },
  loadingLine: { height: 14, borderRadius: 7, backgroundColor: Colors.skeleton },
  errorScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { fontSize: 16, color: Colors.text, fontWeight: '600' },
  backBtn: { backgroundColor: Colors.teal, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  backBtnText: { color: Colors.white, fontWeight: '700' },
  imageContainer: { position: 'relative' },
  heroImage: { width, height: 320 },
  imagePlaceholder: { backgroundColor: Colors.navyMid, alignItems: 'center', justifyContent: 'center' },
  navBar: {
    position: 'absolute',
    left: 0, right: 0,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  navBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  thumbRow: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  thumbContent: { paddingHorizontal: 12, gap: 8, paddingBottom: 10, flexDirection: 'row-reverse' },
  thumb: { width: 56, height: 56, borderRadius: 10 },
  thumbActive: { borderWidth: 2.5, borderColor: Colors.teal },
  typeBadge: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: Colors.teal,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10,
  },
  typeBadgeRent: { backgroundColor: Colors.gold },
  typeBadgeText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  content: { padding: 20 },
  titleRow: { flexDirection: 'row-reverse', marginBottom: 6 },
  propTypeBadge: {
    backgroundColor: 'rgba(15,123,160,0.12)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  propTypeText: { fontSize: 12, color: Colors.teal, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text, textAlign: 'right', marginBottom: 12 },
  priceRow: { flexDirection: 'row-reverse', alignItems: 'baseline', gap: 4, marginBottom: 10 },
  price: { fontSize: 28, fontWeight: '900', color: Colors.navy },
  sar: { fontSize: 14, color: Colors.textSub, fontWeight: '600' },
  locationRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 20 },
  location: { fontSize: 14, color: Colors.textSub, textAlign: 'right', flex: 1 },
  detailsGrid: {
    flexDirection: 'row-reverse', gap: 10, marginBottom: 20,
  },
  detailBox: {
    flex: 1, backgroundColor: Colors.card,
    borderRadius: 16, padding: 14, alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  detailNum: { fontSize: 18, fontWeight: '800', color: Colors.navy },
  detailLabel: { fontSize: 11, color: Colors.textMuted },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, textAlign: 'right', marginBottom: 8 },
  description: { fontSize: 14, color: Colors.textSub, lineHeight: 22, textAlign: 'right' },
  marketerCard: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.card,
    borderRadius: 16, padding: 14,
    alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  marketerAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(15,123,160,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  marketerInfo: { flex: 1 },
  marketerLabel: { fontSize: 11, color: Colors.textMuted, textAlign: 'right' },
  marketerNameStyle: { fontSize: 15, fontWeight: '700', color: Colors.text, textAlign: 'right' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row-reverse',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.border,
    gap: 10,
  },
  callBtn: {
    flex: 1, backgroundColor: Colors.teal,
    borderRadius: 16, paddingVertical: 14,
    flexDirection: 'row-reverse', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  whatsappBtn: {
    flex: 1, backgroundColor: '#25D366',
    borderRadius: 16, paddingVertical: 14,
    flexDirection: 'row-reverse', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  ctaBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});
