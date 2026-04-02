import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
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
import { ServiceProvider, apiFetch, endpoints, parseMediaList, parseStringList, resolveMediaUrl } from '@/constants/api';

export default function ServiceProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const { data: service, isLoading } = useQuery<ServiceProvider>({
    queryKey: ['service', id],
    queryFn: () => apiFetch<ServiceProvider>(endpoints.service(Number(id))),
    enabled: !!id,
  });

  const callPhone = (phone?: string | null) => phone && Linking.openURL(`tel:${phone}`);
  const openWhatsapp = (phone?: string | null) => {
    if (!phone) return;
    const normalized = phone.replace(/\D/g, '');
    return Linking.openURL(`https://wa.me/${normalized}`);
  };
  const openWebsite = (url?: string) => url && Linking.openURL(url.startsWith('http') ? url : `https://${url}`);

  if (isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: topPad }]}>
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-right" size={22} color={Colors.white} />
          </Pressable>
          <Text style={styles.navTitle}>ملف مزود الخدمة</Text>
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.teal} size="large" />
        </View>
      </View>
    );
  }

  if (!service) return null;

  const portfolio = parseMediaList(service.portfolioImages)
    .map((img) => resolveMediaUrl(img))
    .filter((img): img is string => Boolean(img));
  const coverImage = resolveMediaUrl(service.coverImage) ?? portfolio[0] ?? null;
  const profileImage = resolveMediaUrl(service.profileImage);
  const coveredAreas = parseStringList(service.coveredAreas);

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: topPad }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: botPad + 20 }}
    >
      {/* Nav */}
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.navTitle}>ملف مزود الخدمة</Text>
      </View>

      {/* Cover */}
      {coverImage ? (
        <Image source={{ uri: coverImage }} style={styles.cover} />
      ) : portfolio[0] ? (
        <Image source={{ uri: portfolio[0] }} style={styles.cover} />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Feather name="briefcase" size={48} color="rgba(255,255,255,0.3)" />
        </View>
      )}

      {/* Profile Card */}
      <View style={styles.profileCard}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Feather name="briefcase" size={28} color={Colors.white} />
          </View>
        )}
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            {service.verified && (
              <View style={styles.verifiedBadge}>
                <Feather name="check-circle" size={13} color={Colors.teal} />
                <Text style={styles.verifiedText}>موثّق</Text>
              </View>
            )}
            <Text style={styles.businessName}>{service.businessName}</Text>
          </View>
          <View style={styles.catBadge}>
            <Text style={styles.catBadgeText}>{service.category}</Text>
          </View>
          <View style={styles.statsRow}>
            {service.city && (
              <View style={styles.statItem}>
                <Feather name="map-pin" size={11} color={Colors.textMuted} />
                <Text style={styles.statText}>{service.city}</Text>
              </View>
            )}
            {service.ratingAvg != null && service.ratingAvg > 0 && (
              <View style={styles.statItem}>
                <Feather name="star" size={11} color={Colors.gold} />
                <Text style={styles.statText}>{service.ratingAvg.toFixed(1)} ({service.ratingCount ?? 0} تقييم)</Text>
              </View>
            )}
          </View>
          {service.startingPrice != null && service.startingPrice > 0 && (
            <Text style={styles.priceText}>يبدأ من {service.startingPrice.toLocaleString()} ريال</Text>
          )}
        </View>
      </View>

      {/* Description */}
      {service.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>عن الشركة</Text>
          <Text style={styles.descText}>{service.description}</Text>
        </View>
      )}

      {(service.region || service.district || coveredAreas.length > 0 || service.workingHours) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>تفاصيل الخدمة</Text>
          <View style={styles.detailsWrap}>
            {service.region ? (
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>المنطقة</Text>
                <Text style={styles.detailValue}>{service.region}</Text>
              </View>
            ) : null}
            {service.district ? (
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>الحي</Text>
                <Text style={styles.detailValue}>{service.district}</Text>
              </View>
            ) : null}
            {service.workingHours ? (
              <View style={styles.detailWideCard}>
                <Text style={styles.detailLabel}>أوقات العمل</Text>
                <Text style={styles.detailValue}>{service.workingHours}</Text>
              </View>
            ) : null}
            {coveredAreas.length > 0 ? (
              <View style={styles.detailWideCard}>
                <Text style={styles.detailLabel}>المناطق المغطاة</Text>
                <Text style={styles.detailValue}>{coveredAreas.join('، ')}</Text>
              </View>
            ) : null}
          </View>
        </View>
      )}

      {/* Portfolio */}
      {portfolio.length > 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معرض الأعمال ({portfolio.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.portfolioScroll}>
            {portfolio.map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.portfolioImg} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Contact Buttons */}
      <View style={styles.ctaRow}>
        {service.websiteUrl && (
          <Pressable style={[styles.ctaBtn, styles.webBtn]} onPress={() => openWebsite(service.websiteUrl)}>
            <Feather name="globe" size={18} color={Colors.white} />
            <Text style={styles.ctaBtnText}>الموقع</Text>
          </Pressable>
        )}
        {service.whatsapp && (
          <Pressable style={[styles.ctaBtn, styles.whatsappBtn]} onPress={() => openWhatsapp(service.whatsapp)}>
            <Feather name="message-circle" size={18} color={Colors.white} />
            <Text style={styles.ctaBtnText}>واتساب</Text>
          </Pressable>
        )}
        <Pressable style={[styles.ctaBtn, styles.callBtn]} onPress={() => callPhone(service.contactPhone)}>
          <Feather name="phone" size={18} color={Colors.white} />
          <Text style={styles.ctaBtnText}>تواصل</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  navBar: {
    backgroundColor: Colors.navy, paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingTop: 12,
  },
  backBtn: { padding: 6 },
  navTitle: { fontSize: 17, fontWeight: '800', color: Colors.white },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cover: { width: '100%', height: 180, resizeMode: 'cover' },
  coverPlaceholder: {
    width: '100%', height: 140, backgroundColor: Colors.navy,
    alignItems: 'center', justifyContent: 'center',
  },
  profileCard: {
    margin: 16, backgroundColor: Colors.card, borderRadius: 20, padding: 16,
    flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    marginTop: -30,
  },
  avatar: { width: 68, height: 68, borderRadius: 18, borderWidth: 3, borderColor: Colors.white },
  avatarPlaceholder: { backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center' },
  profileInfo: { flex: 1, gap: 5 },
  nameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  businessName: { fontSize: 17, fontWeight: '900', color: Colors.text },
  verifiedBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3 },
  verifiedText: { fontSize: 11, fontWeight: '700', color: Colors.teal },
  catBadge: {
    alignSelf: 'flex-end', backgroundColor: 'rgba(15,123,160,0.1)',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10,
  },
  catBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.teal },
  statsRow: { flexDirection: 'row-reverse', gap: 12, flexWrap: 'wrap' },
  statItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3 },
  statText: { fontSize: 11, color: Colors.textMuted },
  priceText: { fontSize: 13, color: Colors.teal, fontWeight: '700', textAlign: 'right' },
  section: { paddingHorizontal: 16, marginBottom: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, textAlign: 'right', marginBottom: 10 },
  descText: { fontSize: 14, color: Colors.textSub, textAlign: 'right', lineHeight: 22 },
  detailsWrap: { gap: 10 },
  detailCard: { backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border },
  detailWideCard: { backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border },
  detailLabel: { fontSize: 11, color: Colors.textMuted, textAlign: 'right', marginBottom: 4 },
  detailValue: { fontSize: 13, color: Colors.text, textAlign: 'right', fontWeight: '600' },
  portfolioScroll: { gap: 10, flexDirection: 'row-reverse' },
  portfolioImg: { width: 140, height: 100, borderRadius: 12 },
  ctaRow: { flexDirection: 'row-reverse', gap: 12, paddingHorizontal: 16, marginBottom: 20 },
  ctaBtn: {
    flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 16,
  },
  callBtn: { backgroundColor: Colors.teal },
  webBtn: { backgroundColor: Colors.navy },
  whatsappBtn: { backgroundColor: '#25D366' },
  ctaBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});
