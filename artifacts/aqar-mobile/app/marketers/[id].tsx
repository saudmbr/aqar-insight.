import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Marketer, Listing, apiFetch, endpoints, parseStringList, resolveMediaUrl } from '@/constants/api';
import { ListingCard } from '@/components/ListingCard';

const { width } = Dimensions.get('window');

export default function MarketerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const { data: marketer, isLoading } = useQuery<Marketer>({
    queryKey: ['marketer', id],
    queryFn: () => apiFetch<Marketer>(endpoints.marketer(Number(id))),
    enabled: !!id,
  });

  const { data: listings } = useQuery<Listing[]>({
    queryKey: ['marketer-listings', id],
    queryFn: () => apiFetch<Listing[]>(endpoints.marketerListings(Number(id))),
    enabled: !!id,
  });

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const callPhone = (phone?: string) => phone && Linking.openURL(`tel:${phone}`);
  const openWhatsApp = (wa?: string) => wa && Linking.openURL(`https://wa.me/${wa.replace(/\D/g, '')}`);

  if (isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: topPad }]}>
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-right" size={22} color={Colors.white} />
          </Pressable>
          <Text style={styles.navTitle}>ملف المسوّق</Text>
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.teal} size="large" />
        </View>
      </View>
    );
  }

  if (!marketer) return null;

  return (
    <ScrollView style={[styles.screen, { paddingTop: topPad }]} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: botPad + 20 }}>
      {/* Nav */}
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.navTitle}>ملف المسوّق</Text>
      </View>

      {/* Cover */}
      {resolveMediaUrl(marketer.coverImage) ? (
        <Image source={{ uri: resolveMediaUrl(marketer.coverImage)! }} style={styles.cover} />
      ) : (
        <View style={styles.coverPlaceholder} />
      )}

      {/* Profile Card */}
      <View style={styles.profileCard}>
        {resolveMediaUrl(marketer.photo) ? (
          <Image source={{ uri: resolveMediaUrl(marketer.photo)! }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>
              {(marketer.officeName ?? marketer.fullName ?? 'م')[0]}
            </Text>
          </View>
        )}

        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            {marketer.verified && (
              <View style={styles.verifiedBadge}>
                <Feather name="check-circle" size={14} color={Colors.teal} />
                <Text style={styles.verifiedText}>موثّق</Text>
              </View>
            )}
            <Text style={styles.officeName}>{marketer.officeName ?? marketer.fullName ?? '—'}</Text>
          </View>
          {marketer.fullName && marketer.officeName && (
            <Text style={styles.fullName}>{marketer.fullName}</Text>
          )}
          <View style={styles.statsRow}>
            {marketer.city && (
              <View style={styles.statItem}>
                <Feather name="map-pin" size={11} color={Colors.textMuted} />
                <Text style={styles.statText}>{marketer.city}</Text>
              </View>
            )}
            {marketer.yearsExperience != null && marketer.yearsExperience > 0 && (
              <View style={styles.statItem}>
                <Feather name="award" size={11} color={Colors.textMuted} />
                <Text style={styles.statText}>{marketer.yearsExperience} سنوات خبرة</Text>
              </View>
            )}
            {marketer.activeListingsCount != null && (
              <View style={styles.statItem}>
                <Feather name="home" size={11} color={Colors.teal} />
                <Text style={[styles.statText, { color: Colors.teal }]}>{marketer.activeListingsCount} عقار نشط</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Bio */}
      {marketer.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>نبذة</Text>
          <Text style={styles.bioText}>{marketer.bio}</Text>
        </View>
      )}

      {/* Specialties */}
      {parseStringList(marketer.specialties).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>التخصصات</Text>
          <View style={styles.tagsRow}>
            {parseStringList(marketer.specialties).map((s, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Served Areas */}
      {parseStringList(marketer.servedAreas).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المناطق المخدومة</Text>
          <View style={styles.tagsRow}>
            {parseStringList(marketer.servedAreas).map((a, i) => (
              <View key={i} style={[styles.tag, styles.areaTag]}>
                <Feather name="map-pin" size={10} color={Colors.teal} />
                <Text style={[styles.tagText, { color: Colors.teal }]}>{a}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Contact Buttons */}
      <View style={styles.ctaRow}>
        {marketer.whatsapp && (
          <Pressable style={[styles.ctaBtn, styles.whatsappBtn]} onPress={() => openWhatsApp(marketer.whatsapp)}>
            <Feather name="message-circle" size={18} color={Colors.white} />
            <Text style={styles.ctaBtnText}>واتساب</Text>
          </Pressable>
        )}
        {marketer.phone && (
          <Pressable style={[styles.ctaBtn, styles.callBtn]} onPress={() => callPhone(marketer.phone)}>
            <Feather name="phone" size={18} color={Colors.white} />
            <Text style={styles.ctaBtnText}>اتصال</Text>
          </Pressable>
        )}
      </View>

      {/* Listings */}
      {listings && listings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>عقارات المسوّق ({listings.length})</Text>
          <FlatList
            data={listings}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <ListingCard listing={item} onPress={() => router.push({ pathname: '/listing/[id]', params: { id: String(item.id) } })} />}
            numColumns={2}
            columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
            scrollEnabled={false}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  navBar: {
    backgroundColor: Colors.navy, paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    paddingTop: 12,
  },
  backBtn: { padding: 6 },
  navTitle: { fontSize: 17, fontWeight: '800', color: Colors.white },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cover: { width: '100%', height: 160, resizeMode: 'cover' },
  coverPlaceholder: { width: '100%', height: 120, backgroundColor: Colors.navy },
  profileCard: {
    margin: 16, backgroundColor: Colors.card, borderRadius: 20, padding: 16,
    flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    marginTop: -30,
  },
  avatar: { width: 68, height: 68, borderRadius: 34, borderWidth: 3, borderColor: Colors.white },
  avatarPlaceholder: {
    backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 28, fontWeight: '900', color: Colors.white },
  profileInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  officeName: { fontSize: 17, fontWeight: '900', color: Colors.text },
  fullName: { fontSize: 13, color: Colors.textSub, textAlign: 'right' },
  verifiedBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3 },
  verifiedText: { fontSize: 11, fontWeight: '700', color: Colors.teal },
  statsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  statItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3 },
  statText: { fontSize: 11, color: Colors.textMuted },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, textAlign: 'right', marginBottom: 10 },
  bioText: { fontSize: 14, color: Colors.textSub, textAlign: 'right', lineHeight: 22 },
  tagsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: Colors.skeleton, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  areaTag: { backgroundColor: 'rgba(15,123,160,0.1)', flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  tagText: { fontSize: 12, fontWeight: '600', color: Colors.textSub },
  ctaRow: { flexDirection: 'row-reverse', gap: 12, paddingHorizontal: 16, marginBottom: 20 },
  ctaBtn: {
    flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 16,
  },
  whatsappBtn: { backgroundColor: '#25D366' },
  callBtn: { backgroundColor: Colors.teal },
  ctaBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});
