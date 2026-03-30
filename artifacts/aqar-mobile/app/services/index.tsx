import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { ServiceProvider, apiFetch, endpoints } from '@/constants/api';

const CATEGORIES = [
  { key: '', label: 'الكل', icon: 'grid' },
  { key: 'بناء وإنشاء', label: 'بناء', icon: 'tool' },
  { key: 'تصميم داخلي', label: 'ديكور', icon: 'layers' },
  { key: 'صيانة', label: 'صيانة', icon: 'settings' },
  { key: 'إدارة عقارات', label: 'إدارة', icon: 'briefcase' },
  { key: 'تنسيق حدائق', label: 'حدائق', icon: 'feather' },
  { key: 'كهرباء', label: 'كهرباء', icon: 'zap' },
  { key: 'سباكة', label: 'سباكة', icon: 'droplet' },
  { key: 'نظافة', label: 'نظافة', icon: 'wind' },
];

export default function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const { data: services, isLoading } = useQuery<ServiceProvider[]>({
    queryKey: ['services-list'],
    queryFn: () => apiFetch<ServiceProvider[]>(endpoints.services),
    staleTime: 1000 * 60 * 5,
  });

  const filtered = useMemo(() => {
    if (!services) return [];
    return services.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.businessName.toLowerCase().includes(q) ||
        (s.description ?? '').toLowerCase().includes(q) || (s.category ?? '').toLowerCase().includes(q);
      const matchCat = !selectedCat || (s.category ?? '').includes(selectedCat);
      const matchCity = !selectedCity || (s.city ?? '').includes(selectedCity);
      return matchSearch && matchCat && matchCity;
    });
  }, [services, search, selectedCat, selectedCity]);

  return (
    <View style={[styles.screen, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>مزودو الخدمات</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن خدمة أو شركة..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Feather name="x" size={14} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catRow}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.key}
            onPress={() => setSelectedCat(cat.key)}
            style={[styles.catPill, selectedCat === cat.key && styles.catPillActive]}
          >
            <Feather name={cat.icon as any} size={13} color={selectedCat === cat.key ? Colors.white : Colors.textSub} />
            <Text style={[styles.catText, selectedCat === cat.key && styles.catTextActive]}>
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.countText}>{filtered.length} مزود خدمة</Text>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.teal} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Feather name="briefcase" size={40} color={Colors.textMuted} />
          <Text style={styles.emptyText}>لا توجد خدمات مسجّلة</Text>
          <Text style={styles.emptySubText}>كن أول من يضيف خدمته على المنصة</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => String(s.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={({ item: s }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push({ pathname: '/services/[id]', params: { id: String(s.id) } })}
            >
              {/* Cover */}
              {(Array.isArray(s.portfolioImages) && s.portfolioImages[0]) || s.coverImage ? (
                <Image
                  source={{ uri: (Array.isArray(s.portfolioImages) ? s.portfolioImages[0] : null) ?? s.coverImage! }}
                  style={styles.cardImage}
                />
              ) : (
                <View style={styles.cardImagePlaceholder}>
                  <Feather name="briefcase" size={28} color="rgba(255,255,255,0.4)" />
                </View>
              )}

              {/* Category badge */}
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText} numberOfLines={1}>{s.category}</Text>
              </View>

              {s.verified && (
                <View style={styles.verifiedBadge}>
                  <Feather name="check" size={9} color={Colors.white} />
                </View>
              )}

              <View style={styles.cardBody}>
                <Text style={styles.businessName} numberOfLines={2}>{s.businessName}</Text>
                {s.city && (
                  <View style={styles.cityRow}>
                    <Feather name="map-pin" size={10} color={Colors.textMuted} />
                    <Text style={styles.cityText}>{s.city}</Text>
                  </View>
                )}
                {s.ratingAvg != null && s.ratingAvg > 0 && (
                  <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Feather
                        key={star}
                        name="star"
                        size={10}
                        color={star <= Math.round(s.ratingAvg!) ? Colors.gold : Colors.border}
                      />
                    ))}
                    <Text style={styles.ratingText}>({s.ratingCount ?? 0})</Text>
                  </View>
                )}
                {s.startingPrice != null && s.startingPrice > 0 && (
                  <Text style={styles.priceText}>يبدأ من {s.startingPrice.toLocaleString()} ر</Text>
                )}
              </View>
            </Pressable>
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.navy, paddingHorizontal: 16, paddingBottom: 16,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
  searchWrap: { padding: 16, paddingBottom: 8 },
  searchBar: {
    backgroundColor: Colors.card, borderRadius: 14, paddingHorizontal: 14,
    paddingVertical: 10, flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, padding: 0 },
  catRow: { paddingHorizontal: 16, paddingBottom: 10, gap: 8, flexDirection: 'row-reverse' },
  catPill: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  catPillActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  catText: { fontSize: 12, fontWeight: '600', color: Colors.textSub },
  catTextActive: { color: Colors.white },
  countText: { fontSize: 12, color: Colors.textMuted, paddingHorizontal: 20, paddingBottom: 10, textAlign: 'right' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 15, color: Colors.textMuted },
  emptySubText: { fontSize: 12, color: Colors.textMuted },
  row: { gap: 12, marginBottom: 12 },
  card: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
    position: 'relative',
  },
  cardImage: { width: '100%', height: 100, resizeMode: 'cover' },
  cardImagePlaceholder: {
    width: '100%', height: 100,
    backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center',
  },
  catBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(11,22,40,0.75)',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  catBadgeText: { fontSize: 9, color: Colors.white, fontWeight: '700' },
  verifiedBadge: {
    position: 'absolute', top: 8, left: 8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { padding: 10, gap: 4 },
  businessName: { fontSize: 13, fontWeight: '700', color: Colors.text, textAlign: 'right' },
  cityRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3 },
  cityText: { fontSize: 10, color: Colors.textMuted },
  ratingRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 9, color: Colors.textMuted, marginRight: 2 },
  priceText: { fontSize: 11, color: Colors.teal, fontWeight: '700', textAlign: 'right' },
});
