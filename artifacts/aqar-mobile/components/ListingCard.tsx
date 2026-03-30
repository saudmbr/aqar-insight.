import { Feather } from '@expo/vector-icons';
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

interface Props {
  listing: Listing;
  onPress: () => void;
  variant?: 'grid' | 'horizontal';
}

function ListingCardComponent({ listing, onPress, variant = 'grid' }: Props) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(listing.id);
  const imageUrl = Array.isArray(listing.images) ? listing.images[0] : undefined;
  const isHorizontal = variant === 'horizontal';

  if (isHorizontal) {
    return (
      <Pressable
        style={({ pressed }) => [styles.horizontal, pressed && styles.pressed]}
        onPress={onPress}
      >
        <View style={styles.hImageWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.hImage} resizeMode="cover" />
          ) : (
            <View style={[styles.hImage, styles.imagePlaceholder]}>
              <Feather name="home" size={28} color={Colors.teal} />
            </View>
          )}
          <View style={[styles.typeBadge, listing.listingType === 'rent' && styles.typeBadgeRent]}>
            <Text style={styles.typeBadgeText}>{listingTypeLabel[listing.listingType] || listing.listingType}</Text>
          </View>
        </View>
        <View style={styles.hContent}>
          <Text style={styles.hTitle} numberOfLines={2}>{listing.title}</Text>
          <View style={styles.row}>
            <Feather name="map-pin" size={12} color={Colors.textMuted} />
            <Text style={styles.location} numberOfLines={1}>
              {[listing.district, listing.city].filter(Boolean).join('، ')}
            </Text>
          </View>
          <View style={styles.hBottom}>
            <View>
              <Text style={styles.priceLabel}>السعر</Text>
              <Text style={styles.price}>
                {formatPrice(listing.price)}{' '}
                <Text style={styles.sar}>ريال</Text>
              </Text>
            </View>
            <View style={styles.hDetails}>
              {listing.bedrooms != null && (
                <View style={styles.detailPill}>
                  <Feather name="moon" size={10} color={Colors.teal} />
                  <Text style={styles.detailText}>{listing.bedrooms}</Text>
                </View>
              )}
              {listing.areaSqm != null && (
                <View style={styles.detailPill}>
                  <Feather name="square" size={10} color={Colors.teal} />
                  <Text style={styles.detailText}>{listing.areaSqm}م²</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Feather name="home" size={36} color={Colors.teal} />
          </View>
        )}
        <View style={[styles.typeBadge, listing.listingType === 'rent' && styles.typeBadgeRent]}>
          <Text style={styles.typeBadgeText}>{listingTypeLabel[listing.listingType] || listing.listingType}</Text>
        </View>
        <Pressable style={styles.favBtn} onPress={() => toggleFavorite(listing)} hitSlop={8}>
          <Feather name="heart" size={16} color={fav ? Colors.danger : Colors.white} fill={fav ? Colors.danger : 'none'} />
        </Pressable>
      </View>
      <View style={styles.content}>
        <Text style={styles.propType}>{listing.propertyType}</Text>
        <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>
        <View style={styles.row}>
          <Feather name="map-pin" size={11} color={Colors.textMuted} />
          <Text style={styles.location} numberOfLines={1}>
            {[listing.district, listing.city].filter(Boolean).join('، ')}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.bottom}>
          <Text style={styles.price}>
            {formatPrice(listing.price)} <Text style={styles.sar}>ريال</Text>
          </Text>
          <View style={styles.details}>
            {listing.bedrooms != null && (
              <View style={styles.detailItem}>
                <Feather name="moon" size={11} color={Colors.teal} />
                <Text style={styles.detailText}>{listing.bedrooms}</Text>
              </View>
            )}
            {listing.areaSqm != null && (
              <View style={styles.detailItem}>
                <Feather name="maximize-2" size={11} color={Colors.teal} />
                <Text style={styles.detailText}>{listing.areaSqm}م²</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export const ListingCard = memo(ListingCardComponent);

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.card,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 130 },
  imagePlaceholder: {
    backgroundColor: Colors.navyMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.teal,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  typeBadgeRent: { backgroundColor: Colors.gold },
  typeBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  favBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 10 },
  propType: { fontSize: 10, color: Colors.teal, fontWeight: '700', marginBottom: 3, textAlign: 'right' },
  title: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 4, textAlign: 'right' },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3, marginBottom: 6 },
  location: { fontSize: 11, color: Colors.textMuted, flex: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginBottom: 8 },
  bottom: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 13, fontWeight: '800', color: Colors.navy },
  sar: { fontSize: 10, fontWeight: '500', color: Colors.textSub },
  details: { flexDirection: 'row-reverse', gap: 6 },
  detailItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3 },
  detailText: { fontSize: 10, color: Colors.textSub, fontWeight: '600' },

  horizontal: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  hImageWrap: { position: 'relative', width: 110 },
  hImage: { width: 110, height: 110 },
  hContent: { flex: 1, padding: 12, justifyContent: 'space-between' },
  hTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, textAlign: 'right' },
  hBottom: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-end' },
  priceLabel: { fontSize: 10, color: Colors.textMuted, textAlign: 'right' },
  hDetails: { flexDirection: 'row-reverse', gap: 6 },
  detailPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.background,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
});
