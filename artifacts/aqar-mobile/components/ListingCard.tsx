import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import React, { memo } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Listing, formatPrice, listingTypeLabel } from '@/constants/api';
import { useFavorites } from '@/context/FavoritesContext';

const { width } = Dimensions.get('window');
export const CARD_WIDTH = (width - 44) / 2;
export const FEATURED_WIDTH = width - 40;

interface Props {
  listing: Listing;
  onPress: () => void;
  variant?: 'grid' | 'horizontal' | 'featured';
}

function parseImages(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string') {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p.filter(Boolean) : []; }
    catch { return raw.startsWith('http') ? [raw] : []; }
  }
  return [];
}

function ListingCardComponent({ listing, onPress, variant = 'grid' }: Props) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(listing.id);
  const imgs = parseImages(listing.images);
  const imageUri = imgs[0] || null;
  const typeColor = listing.listingType === 'rent' ? Colors.gold : Colors.teal;
  const typeLabel = listingTypeLabel[listing.listingType] || listing.listingType;

  /* ─── FEATURED ─── */
  if (variant === 'featured') {
    return (
      <Pressable style={feat.card} onPress={onPress}>
        <View style={feat.imgWrap}>
          {imageUri ? (
            <Image source={imageUri} style={feat.img} contentFit="cover" transition={300} />
          ) : (
            <View style={[feat.img, feat.placeholder]}>
              <Feather name="home" size={40} color="rgba(255,255,255,0.3)" />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(11,22,40,0.92)']}
            locations={[0.35, 1]}
            style={feat.gradient}
          />
          <View style={[feat.typeBadge, { backgroundColor: typeColor }]}>
            <Text style={feat.typeBadgeText}>{typeLabel}</Text>
          </View>
          <View style={feat.priceOverlay}>
            <Text style={feat.priceVal}>{formatPrice(listing.price)} ريال</Text>
          </View>
        </View>
        <View style={feat.content}>
          <Text style={feat.title} numberOfLines={1}>{listing.title}</Text>
          <View style={feat.locRow}>
            <Feather name="map-pin" size={11} color={Colors.textMuted} />
            <Text style={feat.loc} numberOfLines={1}>
              {[listing.district, listing.city].filter(Boolean).join('، ')}
            </Text>
          </View>
          <View style={feat.chipsRow}>
            {listing.propertyType ? (
              <View style={feat.chip}>
                <Text style={feat.chipText}>{listing.propertyType}</Text>
              </View>
            ) : null}
            {listing.bedrooms != null ? (
              <View style={feat.chip}>
                <Feather name="moon" size={9} color={Colors.teal} />
                <Text style={feat.chipText}> {listing.bedrooms} غرف</Text>
              </View>
            ) : null}
            {listing.areaSqm != null ? (
              <View style={feat.chip}>
                <Text style={feat.chipText}>{listing.areaSqm} م²</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  }

  /* ─── HORIZONTAL ─── */
  if (variant === 'horizontal') {
    return (
      <Pressable style={horiz.card} onPress={onPress}>
        <View style={horiz.imgWrap}>
          {imageUri ? (
            <Image source={imageUri} style={horiz.img} contentFit="cover" transition={200} />
          ) : (
            <View style={[horiz.img, horiz.placeholder]}>
              <Feather name="home" size={22} color={Colors.teal} />
            </View>
          )}
          <View style={[horiz.badge, { backgroundColor: typeColor }]}>
            <Text style={horiz.badgeText}>{typeLabel}</Text>
          </View>
        </View>
        <View style={horiz.content}>
          <Text style={horiz.propType}>{listing.propertyType}</Text>
          <Text style={horiz.title} numberOfLines={2}>{listing.title}</Text>
          <View style={horiz.locRow}>
            <Feather name="map-pin" size={10} color={Colors.textMuted} />
            <Text style={horiz.loc} numberOfLines={1}>
              {[listing.district, listing.city].filter(Boolean).join('، ')}
            </Text>
          </View>
          <View style={horiz.footer}>
            <Text style={horiz.price}>{formatPrice(listing.price)} <Text style={horiz.sar}>ر.س</Text></Text>
            <View style={horiz.chips}>
              {listing.bedrooms != null && (
                <View style={horiz.chip}>
                  <Text style={horiz.chipText}>{listing.bedrooms} غرف</Text>
                </View>
              )}
              {listing.areaSqm != null && (
                <View style={horiz.chip}>
                  <Text style={horiz.chipText}>{listing.areaSqm}م²</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  /* ─── GRID (default) ─── */
  return (
    <Pressable style={grid.card} onPress={onPress}>
      <View style={grid.imgWrap}>
        {imageUri ? (
          <Image source={imageUri} style={grid.img} contentFit="cover" transition={200} />
        ) : (
          <View style={[grid.img, grid.placeholder]}>
            <Feather name="home" size={28} color="rgba(255,255,255,0.3)" />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(11,22,40,0.85)']}
          locations={[0.4, 1]}
          style={grid.gradient}
        />
        <View style={[grid.typeBadge, { backgroundColor: typeColor }]}>
          <Text style={grid.typeBadgeText}>{typeLabel}</Text>
        </View>
        <Pressable style={grid.favBtn} onPress={() => toggleFavorite(listing)} hitSlop={10}>
          <Feather name="heart" size={13} color={fav ? Colors.danger : 'rgba(255,255,255,0.9)'} />
        </Pressable>
        <View style={grid.priceRow}>
          <Text style={grid.price}>{formatPrice(listing.price)} <Text style={grid.sar}>ر.س</Text></Text>
        </View>
      </View>
      <View style={grid.content}>
        <Text style={grid.propType}>{listing.propertyType}</Text>
        <Text style={grid.title} numberOfLines={2}>{listing.title}</Text>
        <View style={grid.locRow}>
          <Feather name="map-pin" size={10} color={Colors.textMuted} />
          <Text style={grid.loc} numberOfLines={1}>
            {listing.district || listing.city || '—'}
          </Text>
        </View>
        {(listing.bedrooms != null || listing.bathrooms != null || listing.areaSqm != null) && (
          <View style={grid.details}>
            {listing.bedrooms != null && (
              <View style={grid.detailChip}>
                <Feather name="moon" size={9} color={Colors.teal} />
                <Text style={grid.detailText}> {listing.bedrooms}</Text>
              </View>
            )}
            {listing.bathrooms != null && (
              <View style={grid.detailChip}>
                <Feather name="droplet" size={9} color={Colors.textMuted} />
                <Text style={grid.detailText}> {listing.bathrooms}</Text>
              </View>
            )}
            {listing.areaSqm != null && (
              <View style={grid.detailChip}>
                <Text style={grid.detailText}>{listing.areaSqm}م²</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

export const ListingCard = memo(ListingCardComponent);

/* ══ FEATURED ══ */
const feat = StyleSheet.create({
  card: {
    width: FEATURED_WIDTH,
    backgroundColor: Colors.card,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    marginRight: 14,
  },
  imgWrap: { position: 'relative' },
  img: { width: '100%', height: 195 },
  placeholder: { backgroundColor: Colors.navyMid, alignItems: 'center', justifyContent: 'center' },
  gradient: { ...StyleSheet.absoluteFillObject, top: 60 },
  typeBadge: {
    position: 'absolute', top: 12, right: 12,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
  },
  typeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  priceOverlay: {
    position: 'absolute', bottom: 12, right: 12,
  },
  priceVal: { fontSize: 18, fontWeight: '900', color: '#fff' },
  content: { padding: 14 },
  title: { fontSize: 14, fontWeight: '800', color: Colors.text, textAlign: 'right', marginBottom: 6 },
  locRow: {
    flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 10,
  },
  loc: { fontSize: 12, color: Colors.textMuted, flex: 1, textAlign: 'right', marginRight: 4 },
  chipsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: 'rgba(15,123,160,0.08)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    marginLeft: 6, marginBottom: 4,
  },
  chipText: { fontSize: 11, color: Colors.teal, fontWeight: '600' },
});

/* ══ HORIZONTAL ══ */
const horiz = StyleSheet.create({
  card: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    marginBottom: 10,
  },
  imgWrap: { position: 'relative', width: 115 },
  img: { width: 115, height: 115 },
  placeholder: { backgroundColor: Colors.navyMid, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: 8, right: 8,
    borderRadius: 7, paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  content: { flex: 1, padding: 12 },
  propType: { fontSize: 10, color: Colors.teal, fontWeight: '700', textAlign: 'right' },
  title: { fontSize: 13, fontWeight: '700', color: Colors.text, textAlign: 'right', marginTop: 3, marginBottom: 4 },
  locRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 6 },
  loc: { fontSize: 11, color: Colors.textMuted, flex: 1, textAlign: 'right', marginRight: 3 },
  footer: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 14, fontWeight: '900', color: Colors.navy },
  sar: { fontSize: 10, fontWeight: '500', color: Colors.textMuted },
  chips: { flexDirection: 'row-reverse' },
  chip: {
    backgroundColor: Colors.background,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6,
    marginLeft: 4,
  },
  chipText: { fontSize: 10, color: Colors.textSub, fontWeight: '600' },
});

/* ══ GRID ══ */
const grid = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.card,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
  },
  imgWrap: { position: 'relative' },
  img: { width: CARD_WIDTH, height: 150 },
  placeholder: {
    width: CARD_WIDTH, height: 150,
    backgroundColor: Colors.navyMid, alignItems: 'center', justifyContent: 'center',
  },
  gradient: { ...StyleSheet.absoluteFillObject, top: 60 },
  typeBadge: {
    position: 'absolute', top: 9, right: 9,
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
  },
  typeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  favBtn: {
    position: 'absolute', top: 9, left: 9,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  priceRow: {
    position: 'absolute', bottom: 8, right: 8,
  },
  price: { fontSize: 13, fontWeight: '900', color: '#fff' },
  sar: { fontSize: 9, color: 'rgba(255,255,255,0.75)' },
  content: { padding: 10 },
  propType: { fontSize: 9, color: Colors.teal, fontWeight: '700', textAlign: 'right', marginBottom: 2 },
  title: { fontSize: 12, fontWeight: '700', color: Colors.text, textAlign: 'right', marginBottom: 5, lineHeight: 17 },
  locRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 6 },
  loc: { fontSize: 10, color: Colors.textMuted, flex: 1, textAlign: 'right', marginRight: 3 },
  details: { flexDirection: 'row-reverse', flexWrap: 'wrap' },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6,
    marginLeft: 4, marginBottom: 2,
  },
  detailText: { fontSize: 10, color: Colors.textSub, fontWeight: '600' },
});
