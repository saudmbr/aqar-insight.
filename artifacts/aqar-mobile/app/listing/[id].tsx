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
  Share,
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
import { ListingCard } from '@/components/ListingCard';

const { width } = Dimensions.get('window');

function DetailChip({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <View style={styles.detailBox}>
      <Feather name={icon as any} size={18} color={Colors.teal} />
      <Text style={styles.detailNum}>{value}</Text>
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
  );
}

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

  const { data: similar } = useQuery<Listing[]>({
    queryKey: ['similar', id],
    queryFn: () => apiFetch<Listing[]>(endpoints.listingSimilar(Number(id))),
    enabled: !!id && !!listing,
    staleTime: 1000 * 60 * 5,
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

  const handleShare = async () => {
    if (!listing) return;
    const msg = `${listing.title}\n${listing.price.toLocaleString('ar-SA')} ريال\n${[listing.district, listing.city].filter(Boolean).join('، ')}`;
    try {
      await Share.share({ message: msg, title: listing.title });
    } catch { /* ignore */ }
  };

  // ─── Loading skeleton ───
  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingHeader} />
        <View style={styles.loadingContent}>
          {[100, 60, 80, 40].map((w, i) => (
            <View key={i} style={[styles.loadingLine, { width: `${w}%` as any }]} />
          ))}
          <View style={styles.loadingGrid}>
            {[1, 2, 3].map((i) => <View key={i} style={styles.loadingBox} />)}
          </View>
        </View>
      </View>
    );
  }

  // ─── Error state ───
  if (error || !listing) {
    return (
      <View style={styles.errorScreen}>
        <View style={styles.errorIconWrap}>
          <Feather name="alert-circle" size={40} color={Colors.danger} />
        </View>
        <Text style={styles.errorTitle}>تعذّر تحميل العقار</Text>
        <Text style={styles.errorSub}>يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>العودة</Text>
        </Pressable>
      </View>
    );
  }

  const rawImgs = listing.images as any;
  const images: string[] = Array.isArray(rawImgs)
    ? rawImgs
    : typeof rawImgs === 'string'
      ? (() => { try { return JSON.parse(rawImgs); } catch { return []; } })()
      : [];
  const currentImage = images[imgIndex];
  const typeLabel = listingTypeLabel[listing.listingType] ?? listing.listingType;
  const isRent = listing.listingType === 'rent';

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>

        {/* ─── Hero Image ─── */}
        <View style={styles.imageContainer}>
          {currentImage ? (
            <Image source={{ uri: currentImage }} style={styles.heroImage} contentFit="cover" />
          ) : (
            <View style={[styles.heroImage, styles.imagePlaceholder]}>
              <Feather name="home" size={56} color={Colors.teal} />
              <Text style={styles.noImgText}>لا توجد صورة</Text>
            </View>
          )}

          {/* Top Nav Bar */}
          <View style={[styles.navBar, { top: (Platform.OS === 'web' ? 67 : insets.top) + 8 }]}>
            <View style={styles.navRight}>
              <Pressable
                style={styles.navBtn}
                onPress={() => {
                  toggleFavorite(listing);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <Feather name="heart" size={20} color={fav ? '#e11d48' : Colors.white} />
              </Pressable>
              <Pressable style={styles.navBtn} onPress={handleShare}>
                <Feather name="share-2" size={20} color={Colors.white} />
              </Pressable>
            </View>
            <Pressable style={styles.navBtn} onPress={() => router.back()}>
              <Feather name="arrow-right" size={20} color={Colors.white} />
            </Pressable>
          </View>

          {/* Image counter */}
          {images.length > 1 && (
            <View style={styles.imgCounter}>
              <Text style={styles.imgCounterText}>{imgIndex + 1}/{images.length}</Text>
            </View>
          )}

          {/* Thumbnail Row */}
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

          {/* Badges */}
          <View style={styles.badgesRow}>
            <View style={[styles.typeBadge, isRent && styles.typeBadgeRent]}>
              <Text style={styles.typeBadgeText}>{typeLabel}</Text>
            </View>
            {listing.featured && (
              <View style={styles.featuredBadge}>
                <Feather name="star" size={10} color={Colors.white} />
                <Text style={styles.featuredBadgeText}>مميّز</Text>
              </View>
            )}
            {listing.urgent && (
              <View style={styles.urgentBadge}>
                <Feather name="zap" size={10} color={Colors.white} />
                <Text style={styles.featuredBadgeText}>عاجل</Text>
              </View>
            )}
            {listing.verified && (
              <View style={styles.verifiedBadge}>
                <Feather name="check-circle" size={10} color={Colors.white} />
                <Text style={styles.featuredBadgeText}>موثّق</Text>
              </View>
            )}
          </View>
        </View>

        {/* ─── Content ─── */}
        <View style={styles.content}>

          {/* Property type pill + title */}
          <View style={styles.titleRow}>
            <View style={styles.propTypeBadge}>
              <Text style={styles.propTypeText}>{listing.propertyType}</Text>
            </View>
          </View>
          <Text style={styles.title}>{listing.title}</Text>

          {/* Price row */}
          <View style={styles.priceRow}>
            <Text style={styles.sar}>ريال{isRent ? '/شهر' : ''}</Text>
            <Text style={styles.price}>{listing.price.toLocaleString('ar-SA')}</Text>
          </View>
          {listing.pricePerSqm && listing.pricePerSqm > 0 && (
            <Text style={styles.pricePerSqm}>
              {formatPrice(listing.pricePerSqm)} ريال/م²
            </Text>
          )}

          {/* Location */}
          <Pressable
            style={styles.locationRow}
            onPress={() => {
              if (listing.latitude && listing.longitude) {
                router.push({ pathname: '/(tabs)/map', params: { lat: String(listing.latitude), lng: String(listing.longitude) } });
              }
            }}
          >
            <Feather name="map-pin" size={14} color={Colors.teal} />
            <Text style={styles.location}>
              {[listing.district, listing.city, listing.region].filter(Boolean).join(' ← ')}
            </Text>
            {listing.latitude && listing.longitude && (
              <Feather name="external-link" size={12} color={Colors.teal} />
            )}
          </Pressable>

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            {listing.bedrooms != null && (
              <DetailChip icon="moon" value={listing.bedrooms} label="غرفة" />
            )}
            {listing.bathrooms != null && (
              <DetailChip icon="droplet" value={listing.bathrooms} label="دورة" />
            )}
            {listing.areaSqm != null && (
              <DetailChip icon="maximize-2" value={listing.areaSqm} label="م²" />
            )}
            {listing.floors != null && (
              <DetailChip icon="layers" value={listing.floors} label="دور" />
            )}
          </View>

          {/* Description */}
          {listing.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>الوصف</Text>
              <Text style={styles.description}>{listing.description}</Text>
            </View>
          ) : null}

          {/* Location details */}
          {(listing.region || listing.city || listing.district || listing.markaz) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>الموقع</Text>
              <View style={styles.locationDetails}>
                {listing.region && (
                  <View style={styles.locationChip}>
                    <Text style={styles.locationChipLabel}>المنطقة</Text>
                    <Text style={styles.locationChipValue}>{listing.region}</Text>
                  </View>
                )}
                {listing.city && (
                  <View style={styles.locationChip}>
                    <Text style={styles.locationChipLabel}>المدينة</Text>
                    <Text style={styles.locationChipValue}>{listing.city}</Text>
                  </View>
                )}
                {listing.district && (
                  <View style={styles.locationChip}>
                    <Text style={styles.locationChipLabel}>الحي</Text>
                    <Text style={styles.locationChipValue}>{listing.district}</Text>
                  </View>
                )}
                {listing.markaz && (
                  <View style={styles.locationChip}>
                    <Text style={styles.locationChipLabel}>المركز</Text>
                    <Text style={styles.locationChipValue}>{listing.markaz}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Seller / Marketer Card */}
          {(listing.sellerName || listing.marketerName) && (
            <View style={styles.marketerCard}>
              <View style={styles.marketerLeft}>
                <Pressable style={styles.marketerCallBtn} onPress={handleCall}>
                  <Feather name="phone" size={16} color={Colors.white} />
                </Pressable>
                <Pressable style={styles.marketerWaBtn} onPress={handleWhatsApp}>
                  <Feather name="message-circle" size={16} color={Colors.white} />
                </Pressable>
              </View>
              <View style={styles.marketerInfo}>
                <Text style={styles.marketerLabel}>المسوّق العقاري</Text>
                <Text style={styles.marketerNameStyle}>
                  {listing.sellerName ?? listing.marketerName}
                </Text>
                {listing.marketerPhone && (
                  <Text style={styles.marketerPhone}>{listing.marketerPhone}</Text>
                )}
              </View>
              <View style={styles.marketerAvatar}>
                <Feather name="user" size={24} color={Colors.teal} />
              </View>
            </View>
          )}

          {/* Similar Listings */}
          {similar && similar.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>عقارات مشابهة</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.similarContent}
              >
                {similar.slice(0, 6).map((item) => (
                  <View key={item.id} style={styles.similarCard}>
                    <ListingCard
                      listing={item}
                      onPress={() => router.push({ pathname: '/listing/[id]', params: { id: String(item.id) } })}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* ─── Bottom CTA ─── */}
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

  // Loading
  loadingScreen: { flex: 1, backgroundColor: Colors.background },
  loadingHeader: { height: 320, backgroundColor: Colors.skeleton },
  loadingContent: { padding: 20, gap: 14 },
  loadingLine: { height: 14, borderRadius: 7, backgroundColor: Colors.skeleton },
  loadingGrid: { flexDirection: 'row-reverse', gap: 10, marginTop: 8 },
  loadingBox: { flex: 1, height: 80, borderRadius: 16, backgroundColor: Colors.skeleton },

  // Error
  errorScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  errorIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(239,68,68,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  errorTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  errorSub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  backBtn: { backgroundColor: Colors.teal, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14, marginTop: 4 },
  backBtnText: { color: Colors.white, fontWeight: '700' },

  // Image
  imageContainer: { position: 'relative' },
  heroImage: { width, height: 300 },
  imagePlaceholder: { backgroundColor: Colors.navyMid, alignItems: 'center', justifyContent: 'center', gap: 8 },
  noImgText: { fontSize: 13, color: Colors.teal, fontWeight: '600' },

  // Nav bar
  navBar: {
    position: 'absolute', left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 14, alignItems: 'center',
  },
  navRight: { flexDirection: 'row-reverse', gap: 8 },
  navBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  imgCounter: {
    position: 'absolute', bottom: 60, left: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  imgCounterText: { color: Colors.white, fontSize: 11, fontWeight: '600' },

  // Thumbnails
  thumbRow: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  thumbContent: { paddingHorizontal: 12, gap: 8, paddingBottom: 10, flexDirection: 'row-reverse' },
  thumb: { width: 52, height: 52, borderRadius: 10 },
  thumbActive: { borderWidth: 2.5, borderColor: Colors.teal },

  // Badges
  badgesRow: {
    position: 'absolute', top: 14, right: 14,
    flexDirection: 'row-reverse', gap: 6, flexWrap: 'wrap', maxWidth: '70%',
  },
  typeBadge: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  typeBadgeRent: { backgroundColor: Colors.gold },
  typeBadgeText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  featuredBadge: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.gold,
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, gap: 3, alignItems: 'center',
  },
  urgentBadge: {
    flexDirection: 'row-reverse',
    backgroundColor: '#ef4444',
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, gap: 3, alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row-reverse',
    backgroundColor: '#10b981',
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, gap: 3, alignItems: 'center',
  },
  featuredBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '700' },

  // Content
  content: { padding: 18 },
  titleRow: { flexDirection: 'row-reverse', marginBottom: 6 },
  propTypeBadge: {
    backgroundColor: 'rgba(15,123,160,0.1)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  propTypeText: { fontSize: 12, color: Colors.teal, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text, textAlign: 'right', marginBottom: 10, lineHeight: 28 },
  priceRow: { flexDirection: 'row-reverse', alignItems: 'baseline', gap: 4, marginBottom: 2 },
  price: { fontSize: 26, fontWeight: '900', color: Colors.navy },
  sar: { fontSize: 13, color: Colors.textSub, fontWeight: '600' },
  pricePerSqm: { fontSize: 12, color: Colors.textMuted, textAlign: 'right', marginBottom: 10 },
  locationRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    marginBottom: 18, flexWrap: 'wrap',
  },
  location: { fontSize: 13, color: Colors.textSub, textAlign: 'right', flex: 1 },

  // Details grid
  detailsGrid: { flexDirection: 'row-reverse', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  detailBox: {
    flex: 1, minWidth: 70,
    backgroundColor: Colors.card, borderRadius: 16, padding: 14,
    alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  detailNum: { fontSize: 18, fontWeight: '800', color: Colors.navy },
  detailLabel: { fontSize: 11, color: Colors.textMuted },

  // Sections
  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, textAlign: 'right', marginBottom: 10 },
  description: { fontSize: 14, color: Colors.textSub, lineHeight: 22, textAlign: 'right' },

  // Location details
  locationDetails: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  locationChip: {
    backgroundColor: Colors.card,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, gap: 2,
    alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  locationChipLabel: { fontSize: 10, color: Colors.textMuted },
  locationChipValue: { fontSize: 13, fontWeight: '700', color: Colors.text },

  // Marketer card
  marketerCard: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.white,
    borderRadius: 18, padding: 14,
    alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  marketerAvatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(15,123,160,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  marketerInfo: { flex: 1 },
  marketerLabel: { fontSize: 11, color: Colors.textMuted, textAlign: 'right', marginBottom: 2 },
  marketerNameStyle: { fontSize: 15, fontWeight: '700', color: Colors.text, textAlign: 'right' },
  marketerPhone: { fontSize: 12, color: Colors.textSub, textAlign: 'right', marginTop: 2 },
  marketerLeft: { flexDirection: 'row-reverse', gap: 8 },
  marketerCallBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.teal,
    alignItems: 'center', justifyContent: 'center',
  },
  marketerWaBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#25D366',
    alignItems: 'center', justifyContent: 'center',
  },

  // Similar listings
  similarContent: { gap: 10, paddingRight: 4, flexDirection: 'row-reverse' },
  similarCard: { width: 200 },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row-reverse',
    paddingHorizontal: 16, paddingTop: 12,
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
