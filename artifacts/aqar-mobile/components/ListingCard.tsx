import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Listing, formatPrice, listingTypeLabel } from '@/constants/api';
import { useFavorites } from '@/context/FavoritesContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const FEATURED_WIDTH = width - 40;

interface Props {
  listing: Listing;
  onPress: () => void;
  variant?: 'grid' | 'horizontal' | 'featured';
}

function ListingCardComponent({ listing, onPress, variant = 'grid' }: Props) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(listing.id);
  const imageUrl = Array.isArray(listing.images) ? listing.images[0] : undefined;
  const typeColor = listing.listingType === 'rent' ? Colors.gold : Colors.teal;
  const typeLabel = listingTypeLabel[listing.listingType] || listing.listingType;

  /* ─── FEATURED CARD (wide horizontal carousel) ─── */
  if (variant === 'featured') {
    return (
      <Pressable
        style={({ pressed }) => [feat.card, pressed && feat.pressed]}
        onPress={onPress}
      >
        <View style={feat.imgWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={feat.img} resizeMode="cover" />
          ) : (
            <View style={[feat.img, feat.placeholder]}>
              <Feather name="home" size={44} color="rgba(255,255,255,0.3)" />
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
          <Pressable style={feat.favBtn} onPress={() => toggleFavorite(listing)} hitSlop={10}>
            <Feather
              name={fav ? 'heart' : 'heart'}
              size={15}
              color={fav ? Colors.danger : Colors.white}
            />
          </Pressable>
          <View style={feat.priceOverlay}>
            <Text style={feat.priceVal}>{formatPrice(listing.price)}</Text>
            <Text style={feat.priceSar}> ريال</Text>
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
                <Feather name="home" size={9} color={Colors.teal} />
                <Text style={feat.chipText}>{listing.propertyType}</Text>
              </View>
            ) : null}
            {listing.bedrooms != null ? (
              <View style={feat.chip}>
                <Feather name="moon" size={9} color={Colors.teal} />
                <Text style={feat.chipText}>{listing.bedrooms} غرف</Text>
              </View>
            ) : null}
            {listing.areaSqm != null ? (
              <View style={feat.chip}>
                <Feather name="maximize-2" size={9} color={Colors.teal} />
                <Text style={feat.chipText}>{listing.areaSqm} م²</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  }

  /* ─── HORIZONTAL CARD (list view) ─── */
  if (variant === 'horizontal') {
    return (
      <Pressable
        style={({ pressed }) => [horiz.card, pressed && horiz.pressed]}
        onPress={onPress}
      >
        <View style={horiz.imgWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={horiz.img} resizeMode="cover" />
          ) : (
            <View style={[horiz.img, horiz.placeholder]}>
              <Feather name="home" size={24} color={Colors.teal} />
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
            <Text style={horiz.price}>
              {formatPrice(listing.price)}{' '}
              <Text style={horiz.sar}>ر.س</Text>
            </Text>
            <View style={horiz.chips}>
              {listing.bedrooms != null && (
                <View style={horiz.chip}>
                  <Feather name="moon" size={9} color={Colors.teal} />
                  <Text style={horiz.chipText}>{listing.bedrooms}</Text>
                </View>
              )}
              {listing.areaSqm != null && (
                <View style={horiz.chip}>
                  <Feather name="maximize-2" size={9} color={Colors.teal} />
                  <Text style={horiz.chipText}>{listing.areaSqm}م²</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  /* ─── GRID CARD (default) ─── */
  return (
    <Pressable
      style={({ pressed }) => [grid.card, pressed && grid.pressed]}
      onPress={onPress}
    >
      <View style={grid.imgWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={grid.img} resizeMode="cover" />
        ) : (
          <View style={[grid.img, grid.placeholder]}>
            <Feather name="home" size={32} color="rgba(255,255,255,0.3)" />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(11,22,40,0.82)']}
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
          <Text style={grid.price}>{formatPrice(listing.price)}</Text>
          <Text style={grid.sar}> ر.س</Text>
        </View>
      </View>
      <View style={grid.content}>
        <Text style={grid.propType}>{listing.propertyType}</Text>
        <Text style={grid.title} numberOfLines={2}>{listing.title}</Text>
        <View style={grid.locRow}>
          <Feather name="map-pin" size={10} color={Colors.textMuted} />
          <Text style={grid.loc} numberOfLines={1}>
            {[listing.district, listing.city].filter(Boolean).join('، ')}
          </Text>
        </View>
        <View style={grid.details}>
          {listing.bedrooms != null && (
            <View style={grid.detail}>
              <Feather name="moon" size={9} color={Colors.teal} />
              <Text style={grid.detailText}>{listing.bedrooms}</Text>
            </View>
          )}
          {listing.areaSqm != null && (
            <View style={grid.detail}>
              <Feather name="maximize-2" size={9} color={Colors.teal} />
              <Text style={grid.detailText}>{listing.areaSqm}م²</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export const ListingCard = memo(ListingCardComponent);

/* ═══════════════════════ FEATURED STYLES ═══════════════════════ */
const feat = StyleSheet.create({
  card: {
    width: FEATURED_WIDTH,
    backgroundColor: Colors.card,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    marginRight: 14,
  },
  pressed: { opacity: 0.93, transform: [{ scale: 0.985 }] },
  imgWrap: { position: 'relative' },
  img: { width: '100%', height: 200 },
  placeholder: { backgroundColor: Colors.navyMid, alignItems: 'center', justifyContent: 'center' },
  gradient: { ...StyleSheet.absoluteFillObject, top: 60 },
  typeBadge: {
    position: 'absolute', top: 12, right: 12,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
  },
  typeBadgeText: { color: Colors.white, fontSize: 11, fontWeight: '800' },
  favBtn: {
    position: 'absolute', top: 12, left: 12,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  priceOverlay: {
    position: 'absolute', bottom: 12, right: 14,
    flexDirection: 'row-reverse', alignItems: 'baseline',
  },
  priceVal: { fontSize: 22, fontWeight: '900', color: Colors.white },
  priceSar: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginRight: 3 },
  content: { padding: 14 },
  title: { fontSize: 15, fontWeight: '800', color: Colors.text, textAlign: 'right', marginBottom: 5 },
  locRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginBottom: 10 },
  loc: { fontSize: 12, color: Colors.textMuted, flex: 1, textAlign: 'right' },
  chipsRow: { flexDirection: 'row-reverse', gap: 6, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(15,123,160,0.08)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  chipText: { fontSize: 11, color: Colors.teal, fontWeight: '600' },
});

/* ═══════════════════════ HORIZONTAL STYLES ═══════════════════════ */
const horiz = StyleSheet.create({
  card: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.card,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 10,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
  imgWrap: { position: 'relative', width: 120 },
  img: { width: 120, height: 120 },
  placeholder: { backgroundColor: Colors.navyMid, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 8, right: 8, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { color: Colors.white, fontSize: 10, fontWeight: '800' },
  content: { flex: 1, padding: 12, justifyContent: 'space-between' },
  propType: { fontSize: 10, color: Colors.teal, fontWeight: '700', textAlign: 'right' },
  title: { fontSize: 13, fontWeight: '700', color: Colors.text, textAlign: 'right', marginTop: 2 },
  locRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3, marginTop: 4 },
  loc: { fontSize: 11, color: Colors.textMuted, flex: 1, textAlign: 'right' },
  footer: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  price: { fontSize: 14, fontWeight: '900', color: Colors.navy },
  sar: { fontSize: 10, fontWeight: '500', color: Colors.textMuted },
  chips: { flexDirection: 'row-reverse', gap: 6 },
  chip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 2, backgroundColor: Colors.background, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 7 },
  chipText: { fontSize: 10, color: Colors.textSub, fontWeight: '600' },
});

/* ═══════════════════════ GRID STYLES ═══════════════════════ */
const grid = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.card,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 4,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.975 }] },
  imgWrap: { position: 'relative' },
  img: { width: '100%', height: 155 },
  placeholder: { backgroundColor: Colors.navyMid, alignItems: 'center', justifyContent: 'center' },
  gradient: { ...StyleSheet.absoluteFillObject, top: 60 },
  typeBadge: {
    position: 'absolute', top: 10, right: 10,
    borderRadius: 9, paddingHorizontal: 8, paddingVertical: 3,
  },
  typeBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '800' },
  favBtn: {
    position: 'absolute', top: 10, left: 10,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  priceRow: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row-reverse', alignItems: 'baseline',
  },
  price: { fontSize: 15, fontWeight: '900', color: Colors.white },
  sar: { fontSize: 10, color: 'rgba(255,255,255,0.75)' },
  content: { padding: 10 },
  propType: { fontSize: 10, color: Colors.teal, fontWeight: '700', textAlign: 'right', marginBottom: 2 },
  title: { fontSize: 12, fontWeight: '700', color: Colors.text, textAlign: 'right', marginBottom: 5, lineHeight: 17 },
  locRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3, marginBottom: 7 },
  loc: { fontSize: 10, color: Colors.textMuted, flex: 1, textAlign: 'right' },
  details: { flexDirection: 'row-reverse', gap: 6 },
  detail: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3, backgroundColor: Colors.background, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 7 },
  detailText: { fontSize: 10, color: Colors.textSub, fontWeight: '600' },
});
