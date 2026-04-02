import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Listing, apiFetch, endpoints, formatPrice, resolveMediaList } from '@/constants/api';

const STATUS_TABS = [
  { key: '', label: 'الكل' },
  { key: 'active', label: 'نشط' },
  { key: 'sold', label: 'مباع' },
  { key: 'rented', label: 'مؤجر' },
  { key: 'archived', label: 'مؤرشف' },
];

const STATUS_COLORS: Record<string, string> = {
  active: '#10b981',
  sold: Colors.teal,
  rented: Colors.gold,
  archived: Colors.textMuted,
  pending: '#f59e0b',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'نشط',
  sold: 'مباع',
  rented: 'مؤجر',
  archived: 'مؤرشف',
  pending: 'قيد المراجعة',
};

export default function MyListingsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('');

  const { data: listings, isLoading, refetch } = useQuery<Listing[]>({
    queryKey: ['my-listings'],
    queryFn: () => apiFetch<Listing[]>(endpoints.myListings),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiFetch(`${endpoints.listing(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-listings'] }),
  });

  const deleteListing = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`${endpoints.listing(id)}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-listings'] }),
  });

  const confirmDelete = (id: number, title: string) => {
    Alert.alert('حذف العقار', `هل أنت متأكد من حذف "${title}"؟ لا يمكن التراجع عن هذا الإجراء.`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => deleteListing.mutate(id) },
    ]);
  };

  const filtered = listings?.filter((l) => !activeTab || l.status === activeTab) ?? [];

  const stats = {
    total: listings?.length ?? 0,
    active: listings?.filter((l) => l.status === 'active').length ?? 0,
    sold: listings?.filter((l) => l.status === 'sold').length ?? 0,
    rented: listings?.filter((l) => l.status === 'rented').length ?? 0,
  };

  return (
    <View style={[styles.screen, { paddingBottom: botPad }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-right" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>عقاراتي</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push('/listing/new')}
          hitSlop={8}
        >
          <Feather name="plus" size={20} color={Colors.white} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.teal} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'الكل', num: stats.total, color: Colors.navy },
            { label: 'نشط', num: stats.active, color: '#10b981' },
            { label: 'مباع', num: stats.sold, color: Colors.teal },
            { label: 'مؤجر', num: stats.rented, color: Colors.gold },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={[styles.statNum, { color: s.color }]}>{s.num}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
          {STATUS_TABS.map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Add listing CTA */}
        <Pressable style={styles.addListingBanner} onPress={() => router.push('/listing/new')}>
          <View style={styles.addListingLeft}>
            <Feather name="plus-circle" size={20} color={Colors.teal} />
            <Text style={styles.addListingText}>إضافة عقار جديد</Text>
          </View>
          <Feather name="chevron-left" size={18} color={Colors.teal} />
        </Pressable>

        {/* Listings */}
        {isLoading ? (
          <View style={styles.loadingWrap}>
            {[1, 2, 3].map((i) => <View key={i} style={styles.skeleton} />)}
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="home" size={52} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>لا توجد عقارات</Text>
            <Text style={styles.emptyBody}>
              {activeTab ? 'لا توجد عقارات بهذه الحالة' : 'لم تقم بنشر أي عقار بعد'}
            </Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push('/listing/new')}>
              <Text style={styles.emptyBtnText}>نشر أول عقار</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {filtered.map((listing) => {
              const listingImages = resolveMediaList(listing.images);
              const coverImage = listingImages[0] ?? null;

              return (
              <View key={listing.id} style={styles.listingRow}>
                {/* Image */}
                <Pressable
                  style={styles.listingImg}
                  onPress={() => router.push(`/listing/${listing.id}`)}
                >
                  {coverImage ? (
                    <Image source={{ uri: coverImage }} style={styles.imgFull} contentFit="cover" />
                  ) : (
                    <View style={styles.imgPlaceholder}>
                      <Feather name="home" size={22} color={Colors.textMuted} />
                    </View>
                  )}
                  {listing.status && (
                    <View style={[styles.statusChip, { backgroundColor: STATUS_COLORS[listing.status] ?? Colors.textMuted }]}>
                      <Text style={styles.statusChipText}>{STATUS_LABELS[listing.status] ?? listing.status}</Text>
                    </View>
                  )}
                </Pressable>

                {/* Info */}
                <View style={styles.listingInfo}>
                  <Text style={styles.listingTitle} numberOfLines={1}>{listing.title}</Text>
                  <Text style={styles.listingPrice}>ر.س {formatPrice(listing.price)}</Text>
                  <View style={styles.listingMeta}>
                    {listing.city && (
                      <View style={styles.metaChip}>
                        <Feather name="map-pin" size={10} color={Colors.textMuted} />
                        <Text style={styles.metaChipText}>{listing.city}</Text>
                      </View>
                    )}
                    {listing.areaSqm && (
                      <View style={styles.metaChip}>
                        <Text style={styles.metaChipText}>{listing.areaSqm} م²</Text>
                      </View>
                    )}
                    {listing.bedrooms != null && (
                      <View style={styles.metaChip}>
                        <Feather name="moon" size={10} color={Colors.textMuted} />
                        <Text style={styles.metaChipText}>{listing.bedrooms}</Text>
                      </View>
                    )}
                  </View>

                  {/* Actions */}
                  <View style={styles.listingActions}>
                    {listing.status !== 'active' && (
                      <Pressable
                        style={[styles.actionBtn, { backgroundColor: 'rgba(16,185,129,0.1)' }]}
                        onPress={() => updateStatus.mutate({ id: listing.id, status: 'active' })}
                      >
                        <Text style={[styles.actionBtnText, { color: '#10b981' }]}>تفعيل</Text>
                      </Pressable>
                    )}
                    {listing.status === 'active' && (
                      <>
                        <Pressable
                          style={[styles.actionBtn, { backgroundColor: 'rgba(15,123,160,0.1)' }]}
                          onPress={() => updateStatus.mutate({ id: listing.id, status: 'sold' })}
                        >
                          <Text style={[styles.actionBtnText, { color: Colors.teal }]}>مباع</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.actionBtn, { backgroundColor: 'rgba(201,168,76,0.1)' }]}
                          onPress={() => updateStatus.mutate({ id: listing.id, status: 'rented' })}
                        >
                          <Text style={[styles.actionBtnText, { color: Colors.gold }]}>مؤجر</Text>
                        </Pressable>
                      </>
                    )}
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.08)' }]}
                      onPress={() => confirmDelete(listing.id, listing.title)}
                    >
                      <Feather name="trash-2" size={13} color={Colors.danger} />
                    </Pressable>
                  </View>
                </View>
              </View>
            )})}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.navy, paddingHorizontal: 20, paddingBottom: 18,
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
  addBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row-reverse', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, gap: 10 },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 12,
    alignItems: 'center', gap: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statNum: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 10, color: Colors.textMuted },
  tabsScroll: { marginHorizontal: 0 },
  tabs: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: 'row-reverse' },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSub },
  tabTextActive: { color: Colors.white },
  addListingBanner: {
    marginHorizontal: 16, marginBottom: 10, backgroundColor: 'rgba(15,123,160,0.07)',
    borderRadius: 14, padding: 14, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: 'rgba(15,123,160,0.2)', borderStyle: 'dashed',
  },
  addListingLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  addListingText: { fontSize: 14, fontWeight: '700', color: Colors.teal },
  loadingWrap: { paddingHorizontal: 16, gap: 10 },
  skeleton: { height: 100, backgroundColor: Colors.border, borderRadius: 16 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyBody: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  emptyBtn: {
    backgroundColor: Colors.teal, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 4,
  },
  emptyBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  listWrap: { paddingHorizontal: 16, gap: 12 },
  listingRow: {
    backgroundColor: Colors.card, borderRadius: 18,
    flexDirection: 'row-reverse', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  listingImg: { width: 110, height: 130, position: 'relative' },
  imgFull: { width: '100%', height: '100%' },
  imgPlaceholder: { width: '100%', height: '100%', backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  statusChip: {
    position: 'absolute', bottom: 8, right: 8,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  statusChipText: { fontSize: 10, color: Colors.white, fontWeight: '700' },
  listingInfo: { flex: 1, padding: 12, gap: 6, justifyContent: 'space-between' },
  listingTitle: { fontSize: 13, fontWeight: '700', color: Colors.navy, textAlign: 'right' },
  listingPrice: { fontSize: 15, fontWeight: '800', color: Colors.teal, textAlign: 'right' },
  listingMeta: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  metaChip: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 3,
    backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
  },
  metaChipText: { fontSize: 10, color: Colors.textMuted },
  listingActions: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  actionBtn: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
  },
  actionBtnText: { fontSize: 11, fontWeight: '700' },
});
