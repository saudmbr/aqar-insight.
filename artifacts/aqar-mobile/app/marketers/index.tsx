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
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Marketer, apiFetch, endpoints, parseStringList, resolveMediaUrl } from '@/constants/api';

export default function MarketersScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  const { data: marketers, isLoading } = useQuery<Marketer[]>({
    queryKey: ['marketers-list'],
    queryFn: () => apiFetch<Marketer[]>(endpoints.marketers),
    staleTime: 1000 * 60 * 5,
  });

  const filtered = useMemo(() => {
    if (!marketers) return [];
    return marketers.filter((m) => {
      const q = search.toLowerCase();
      const matchSearch = !q || (m.fullName ?? '').toLowerCase().includes(q) ||
        (m.officeName ?? '').toLowerCase().includes(q) ||
        (m.city ?? '').toLowerCase().includes(q);
      const matchRegion = !selectedRegion || (m.city ?? '').includes(selectedRegion);
      return matchSearch && matchRegion;
    });
  }, [marketers, search, selectedRegion]);

  const SPECIALTIES = ['سكني', 'تجاري', 'استثماري', 'صناعي', 'أراضي'];

  return (
    <View style={[styles.screen, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>المسوّقون العقاريون</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن مسوّق أو مكتب..."
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

      {/* City filter pills */}
      <View>
        <FlatList
          horizontal
          data={['', 'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'تبوك', 'أبها']}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelectedRegion(item)}
              style={[styles.pill, selectedRegion === item && styles.pillActive]}
            >
              <Text style={[styles.pillText, selectedRegion === item && styles.pillTextActive]}>
                {item || 'الكل'}
              </Text>
            </Pressable>
          )}
          keyExtractor={(item) => item || 'all'}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
          inverted
        />
      </View>

      {/* Count */}
      <Text style={styles.countText}>{filtered.length} مسوّق</Text>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.teal} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Feather name="users" size={40} color={Colors.textMuted} />
          <Text style={styles.emptyText}>لا يوجد مسوّقون</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(m) => String(m.id)}
          renderItem={({ item: m }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push({ pathname: '/marketers/[id]', params: { id: String(m.id) } })}
            >
              <View style={styles.cardLeft}>
                {m.photo ? (
                  <Image source={{ uri: resolveMediaUrl(m.photo)! }} style={styles.photo} />
                ) : (
                  <View style={[styles.photo, styles.photoPlaceholder]}>
                    <Text style={styles.photoInitial}>{(m.officeName ?? m.fullName ?? 'م')[0]}</Text>
                  </View>
                )}
                {m.verified && (
                  <View style={styles.verifiedBadge}>
                    <Feather name="check" size={9} color={Colors.white} />
                  </View>
                )}
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  {m.verified && (
                    <View style={styles.verifiedTag}>
                      <Text style={styles.verifiedTagText}>موثّق</Text>
                    </View>
                  )}
                  <Text style={styles.officeName} numberOfLines={1}>
                    {m.officeName ?? m.fullName ?? '—'}
                  </Text>
                </View>
                {m.fullName && m.officeName && (
                  <Text style={styles.fullName} numberOfLines={1}>{m.fullName}</Text>
                )}
                <View style={styles.metaRow}>
                  {m.city && (
                    <View style={styles.metaItem}>
                      <Feather name="map-pin" size={10} color={Colors.textMuted} />
                      <Text style={styles.metaText}>{m.city}</Text>
                    </View>
                  )}
                  {m.yearsExperience != null && m.yearsExperience > 0 && (
                    <View style={styles.metaItem}>
                      <Feather name="award" size={10} color={Colors.textMuted} />
                      <Text style={styles.metaText}>{m.yearsExperience} سنوات</Text>
                    </View>
                  )}
                  {m.activeListingsCount != null && m.activeListingsCount > 0 && (
                    <View style={styles.metaItem}>
                      <Feather name="home" size={10} color={Colors.teal} />
                      <Text style={[styles.metaText, { color: Colors.teal }]}>{m.activeListingsCount} عقار</Text>
                    </View>
                  )}
                </View>
                {parseStringList(m.specialties).length > 0 && (
                  <View style={styles.tagsRow}>
                    {parseStringList(m.specialties).slice(0, 3).map((s, i) => (
                      <View key={i} style={styles.tag}>
                        <Text style={styles.tagText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <Feather name="chevron-left" size={18} color={Colors.textMuted} style={{ alignSelf: 'center' }} />
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
  pillsRow: { paddingHorizontal: 16, paddingBottom: 8, gap: 8, flexDirection: 'row-reverse' },
  pill: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  pillActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  pillText: { fontSize: 12, fontWeight: '600', color: Colors.text },
  pillTextActive: { color: Colors.white },
  countText: { fontSize: 12, color: Colors.textMuted, paddingHorizontal: 20, paddingBottom: 10, textAlign: 'right' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 15, color: Colors.textMuted },
  card: {
    backgroundColor: Colors.card, borderRadius: 18, padding: 14, marginBottom: 10,
    flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardLeft: { position: 'relative' },
  photo: { width: 56, height: 56, borderRadius: 28 },
  photoPlaceholder: { backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center' },
  photoInitial: { fontSize: 20, fontWeight: '800', color: Colors.white },
  verifiedBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  cardBody: { flex: 1, gap: 4 },
  cardTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  officeName: { fontSize: 15, fontWeight: '800', color: Colors.text, flex: 1, textAlign: 'right' },
  fullName: { fontSize: 12, color: Colors.textSub, textAlign: 'right' },
  verifiedTag: {
    backgroundColor: 'rgba(15,123,160,0.12)', borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  verifiedTagText: { fontSize: 10, fontWeight: '700', color: Colors.teal },
  metaRow: { flexDirection: 'row-reverse', gap: 10, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 10, color: Colors.textMuted },
  tagsRow: { flexDirection: 'row-reverse', gap: 6, flexWrap: 'wrap', marginTop: 2 },
  tag: {
    backgroundColor: Colors.skeleton, borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  tagText: { fontSize: 10, color: Colors.textSub, fontWeight: '600' },
});
