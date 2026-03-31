import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
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
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { Listing, CustomerRequest, apiFetch, endpoints, formatPrice } from '@/constants/api';
import { ListingCard } from '@/components/ListingCard';
import { SkeletonCard } from '@/components/SkeletonCard';

type Tab = 'overview' | 'listings' | 'favorites' | 'requests';

const STATUS_LABELS: Record<string, string> = {
  active: 'نشط',
  sold: 'مباع',
  rented: 'مؤجّر',
  cancelled: 'مؤرشف',
};

const STATUS_COLORS: Record<string, string> = {
  active: Colors.success,
  sold: Colors.teal,
  rented: '#8b5cf6',
  cancelled: '#f59e0b',
};

function StatCard({ icon, label, value, color, onPress }: { icon: string; label: string; value: string; color: string; onPress?: () => void }) {
  return (
    <Pressable style={[styles.statCard, { borderTopColor: color }]} onPress={onPress}>
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const { data: myListings = [], isLoading: listingsLoading, refetch } = useQuery<Listing[]>({
    queryKey: ['my-listings'],
    queryFn: () => apiFetch<Listing[]>(endpoints.myListings),
    enabled: !!user,
  });

  const { data: myRequests = [], isLoading: reqLoading } = useQuery<CustomerRequest[]>({
    queryKey: ['my-requests'],
    queryFn: () => apiFetch<CustomerRequest[]>(endpoints.myRequests),
    enabled: !!user,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiFetch(endpoints.listingStatus(id), { method: 'PUT', body: JSON.stringify({ status }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-listings'] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(endpoints.listing(id), { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-listings'] }); },
  });

  const totalViews = myListings.reduce((s, l: any) => s + (l.views ?? 0), 0);
  const activeCount = myListings.filter((l: any) => l.status === 'active').length;

  const handleDelete = (id: number, title: string) => {
    Alert.alert('حذف الإعلان', `هل تريد حذف "${title}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  const handleStatusChange = (id: number, status: string) => {
    statusMutation.mutate({ id, status });
  };

  const TABS: { key: Tab; label: string; icon: string; count?: number }[] = [
    { key: 'overview', label: 'نظرة عامة', icon: 'grid' },
    { key: 'listings', label: 'إعلاناتي', icon: 'home', count: myListings.length },
    { key: 'favorites', label: 'المفضلة', icon: 'heart', count: favorites.length },
    { key: 'requests', label: 'طلباتي', icon: 'inbox', count: myRequests.length },
  ];

  if (!user) {
    return (
      <View style={styles.center}>
        <Feather name="lock" size={48} color={Colors.textMuted} />
        <Text style={styles.centerTitle}>تسجيل الدخول مطلوب</Text>
        <Pressable style={styles.loginBtn} onPress={() => router.push('/auth/login')}>
          <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={Colors.white} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>لوحة التحكم</Text>
          <Text style={styles.headerSub}>{user.fullName ?? user.username}</Text>
        </View>
        <Pressable onPress={() => router.push('/listing/new')} style={styles.addBtn}>
          <Feather name="plus" size={22} color={Colors.white} />
        </Pressable>
      </View>

      {/* Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {TABS.map(t => (
          <Pressable key={t.key} style={[styles.tab, activeTab === t.key && styles.tabActive]} onPress={() => setActiveTab(t.key)}>
            <Feather name={t.icon as any} size={15} color={activeTab === t.key ? Colors.white : Colors.textMuted} />
            <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>{t.label}</Text>
            {t.count !== undefined && t.count > 0 && (
              <View style={[styles.tabBadge, activeTab === t.key && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === t.key && styles.tabBadgeTextActive]}>{t.count}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <ScrollView
          contentContainerStyle={{ paddingBottom: botPad + 20, paddingHorizontal: 16, paddingTop: 16, gap: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={listingsLoading} onRefresh={refetch} tintColor={Colors.teal} />}
        >
          <View style={styles.statsGrid}>
            <StatCard icon="home" label="إجمالي الإعلانات" value={String(myListings.length)} color={Colors.teal} onPress={() => setActiveTab('listings')} />
            <StatCard icon="eye" label="إجمالي المشاهدات" value={totalViews.toLocaleString()} color={Colors.gold} />
            <StatCard icon="check-circle" label="الإعلانات النشطة" value={String(activeCount)} color={Colors.success} />
            <StatCard icon="heart" label="المفضلة" value={String(favorites.length)} color={Colors.danger} onPress={() => setActiveTab('favorites')} />
          </View>

          {/* Recent listings */}
          {myListings.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Pressable onPress={() => setActiveTab('listings')}><Text style={styles.seeAll}>عرض الكل</Text></Pressable>
                <Text style={styles.sectionTitle}>آخر إعلاناتي</Text>
              </View>
              {myListings.slice(0, 3).map((l: any) => (
                <Pressable key={l.id} style={styles.listingRow} onPress={() => router.push({ pathname: '/listing/[id]', params: { id: String(l.id) } })}>
                  <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[l.status ?? 'active'] ?? Colors.teal }]} />
                  <View style={styles.listingRowInfo}>
                    <Text style={styles.listingRowTitle} numberOfLines={1}>{l.title}</Text>
                    <Text style={styles.listingRowSub}>{STATUS_LABELS[l.status ?? 'active']} · {formatPrice(l.price)}</Text>
                  </View>
                  <Feather name="chevron-left" size={16} color={Colors.textMuted} />
                </Pressable>
              ))}
            </View>
          )}

          {myListings.length === 0 && !listingsLoading && (
            <View style={styles.emptySection}>
              <Feather name="home" size={40} color={Colors.textMuted} />
              <Text style={styles.emptySectionTitle}>لا توجد إعلانات بعد</Text>
              <Pressable style={styles.emptyBtn} onPress={() => router.push('/listing/new')}>
                <Feather name="plus" size={16} color={Colors.white} />
                <Text style={styles.emptyBtnText}>نشر إعلان جديد</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}

      {/* My Listings Tab */}
      {activeTab === 'listings' && (
        <ScrollView contentContainerStyle={{ paddingBottom: botPad + 20, gap: 12, paddingHorizontal: 16, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
          <View style={styles.listingsHeader}>
            <Text style={styles.listingsCount}>{myListings.length} إعلان</Text>
            <Pressable style={styles.addListingBtn} onPress={() => router.push('/listing/new')}>
              <Feather name="plus" size={16} color={Colors.white} />
              <Text style={styles.addListingBtnText}>إعلان جديد</Text>
            </Pressable>
          </View>

          {listingsLoading && [1,2,3].map(i => <SkeletonCard key={i} />)}

          {myListings.map((l: any) => (
            <View key={l.id} style={styles.listingCard}>
              <Pressable style={styles.listingCardMain} onPress={() => router.push({ pathname: '/listing/[id]', params: { id: String(l.id) } })}>
                <View style={styles.listingCardInfo}>
                  <View style={styles.listingCardTop}>
                    <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[l.status ?? 'active']}20`, borderColor: STATUS_COLORS[l.status ?? 'active'] }]}>
                      <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[l.status ?? 'active'] }]}>{STATUS_LABELS[l.status ?? 'active']}</Text>
                    </View>
                    <Text style={styles.listingCardTitle} numberOfLines={2}>{l.title}</Text>
                  </View>
                  <Text style={styles.listingCardPrice}>{formatPrice(l.price)}</Text>
                  <Text style={styles.listingCardMeta}>{l.city} {l.district ? `· ${l.district}` : ''} {l.views !== undefined ? `· ${l.views} مشاهدة` : ''}</Text>
                </View>
              </Pressable>

              {/* Actions */}
              <View style={styles.listingActions}>
                <Pressable style={styles.actionBtn} onPress={() => router.push({ pathname: '/listing/[id]', params: { id: String(l.id), edit: '1' } })}>
                  <Feather name="edit-2" size={15} color={Colors.teal} />
                  <Text style={[styles.actionBtnText, { color: Colors.teal }]}>تعديل</Text>
                </Pressable>

                {l.status !== 'sold' && (
                  <Pressable style={styles.actionBtn} onPress={() => handleStatusChange(l.id, 'sold')}>
                    <Feather name="check" size={15} color="#3b82f6" />
                    <Text style={[styles.actionBtnText, { color: '#3b82f6' }]}>مباع</Text>
                  </Pressable>
                )}
                {l.status !== 'rented' && l.listingType === 'rent' && (
                  <Pressable style={styles.actionBtn} onPress={() => handleStatusChange(l.id, 'rented')}>
                    <Feather name="check" size={15} color="#8b5cf6" />
                    <Text style={[styles.actionBtnText, { color: '#8b5cf6' }]}>مؤجّر</Text>
                  </Pressable>
                )}
                {l.status !== 'cancelled' && (
                  <Pressable style={styles.actionBtn} onPress={() => handleStatusChange(l.id, 'cancelled')}>
                    <Feather name="archive" size={15} color="#f59e0b" />
                    <Text style={[styles.actionBtnText, { color: '#f59e0b' }]}>أرشفة</Text>
                  </Pressable>
                )}
                {l.status !== 'active' && (
                  <Pressable style={styles.actionBtn} onPress={() => handleStatusChange(l.id, 'active')}>
                    <Feather name="arrow-up" size={15} color={Colors.success} />
                    <Text style={[styles.actionBtnText, { color: Colors.success }]}>تفعيل</Text>
                  </Pressable>
                )}
                <Pressable style={styles.actionBtn} onPress={() => handleDelete(l.id, l.title)}>
                  <Feather name="trash-2" size={15} color={Colors.danger} />
                  <Text style={[styles.actionBtnText, { color: Colors.danger }]}>حذف</Text>
                </Pressable>
              </View>
            </View>
          ))}

          {myListings.length === 0 && !listingsLoading && (
            <View style={styles.emptySection}>
              <Feather name="home" size={40} color={Colors.textMuted} />
              <Text style={styles.emptySectionTitle}>لا توجد إعلانات</Text>
              <Pressable style={styles.emptyBtn} onPress={() => router.push('/listing/new')}>
                <Feather name="plus" size={16} color={Colors.white} />
                <Text style={styles.emptyBtnText}>نشر إعلان جديد</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}

      {/* Favorites Tab */}
      {activeTab === 'favorites' && (
        <FlatList
          data={favorites}
          keyExtractor={item => String(item.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: botPad + 20, gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <ListingCard listing={item} onPress={() => router.push({ pathname: '/listing/[id]', params: { id: String(item.id) } })} />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptySection}>
              <Feather name="heart" size={40} color={Colors.textMuted} />
              <Text style={styles.emptySectionTitle}>لا توجد مفضلات</Text>
              <Pressable style={styles.emptyBtn} onPress={() => router.push('/(tabs)/listings')}>
                <Text style={styles.emptyBtnText}>تصفح العقارات</Text>
              </Pressable>
            </View>
          }
        />
      )}

      {/* My Requests Tab */}
      {activeTab === 'requests' && (
        <ScrollView contentContainerStyle={{ paddingBottom: botPad + 20, gap: 12, paddingHorizontal: 16, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
          <View style={styles.listingsHeader}>
            <Text style={styles.listingsCount}>{myRequests.length} طلب</Text>
            <Pressable style={styles.addListingBtn} onPress={() => router.push('/requests/new')}>
              <Feather name="plus" size={16} color={Colors.white} />
              <Text style={styles.addListingBtnText}>طلب جديد</Text>
            </Pressable>
          </View>

          {reqLoading && [1,2].map(i => <SkeletonCard key={i} />)}

          {myRequests.map((r: any) => (
            <Pressable key={r.id} style={styles.requestCard} onPress={() => router.push({ pathname: '/requests/[id]', params: { id: String(r.id) } })}>
              <View style={styles.requestCardHeader}>
                <Text style={styles.requestCardTitle} numberOfLines={2}>{r.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: r.status === 'open' ? `${Colors.success}20` : `${Colors.textMuted}15`, borderColor: r.status === 'open' ? Colors.success : Colors.textMuted }]}>
                  <Text style={[styles.statusBadgeText, { color: r.status === 'open' ? Colors.success : Colors.textMuted }]}>{r.status === 'open' ? 'مفتوح' : 'مغلق'}</Text>
                </View>
              </View>
              {r.city && <Text style={styles.requestCardMeta}>{r.city} {r.budgetMin ? `· ${formatPrice(r.budgetMin)}` : ''}</Text>}
              <Text style={styles.requestCardDate}>{new Date(r.createdAt).toLocaleDateString('ar-SA')}</Text>
            </Pressable>
          ))}

          {myRequests.length === 0 && !reqLoading && (
            <View style={styles.emptySection}>
              <Feather name="inbox" size={40} color={Colors.textMuted} />
              <Text style={styles.emptySectionTitle}>لا توجد طلبات</Text>
              <Pressable style={styles.emptyBtn} onPress={() => router.push('/requests/new')}>
                <Feather name="plus" size={16} color={Colors.white} />
                <Text style={styles.emptyBtnText}>إضافة طلب</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  centerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  loginBtn: { backgroundColor: Colors.teal, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  loginBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  header: {
    backgroundColor: Colors.navy, flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 16, paddingTop: 12, gap: 12,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center' },
  tabBar: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, maxHeight: 56 },
  tabBarContent: { paddingHorizontal: 12, gap: 6, paddingVertical: 8, flexDirection: 'row-reverse' },
  tab: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tabActive: { backgroundColor: Colors.teal },
  tabLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  tabLabelActive: { color: Colors.white },
  tabBadge: { backgroundColor: Colors.border, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 18, alignItems: 'center' },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.textMuted },
  tabBadgeTextActive: { color: Colors.white },
  statsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12 },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.card, borderRadius: 16, padding: 14,
    alignItems: 'center', gap: 6, borderTopWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.navy },
  statLabel: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
  section: { backgroundColor: Colors.card, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  seeAll: { fontSize: 12, color: Colors.teal, fontWeight: '600' },
  listingRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  listingRowInfo: { flex: 1 },
  listingRowTitle: { fontSize: 13, fontWeight: '600', color: Colors.text, textAlign: 'right' },
  listingRowSub: { fontSize: 11, color: Colors.textMuted, textAlign: 'right', marginTop: 2 },
  emptySection: { backgroundColor: Colors.card, borderRadius: 16, padding: 32, alignItems: 'center', gap: 12 },
  emptySectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textSub },
  emptyBtn: { backgroundColor: Colors.teal, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  emptyBtnText: { color: Colors.white, fontWeight: '700' },
  listingsHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  listingsCount: { fontSize: 14, fontWeight: '600', color: Colors.textSub },
  addListingBtn: { backgroundColor: Colors.teal, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  addListingBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  listingCard: { backgroundColor: Colors.card, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  listingCardMain: { padding: 14 },
  listingCardInfo: { gap: 4 },
  listingCardTop: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 8, justifyContent: 'space-between' },
  listingCardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.text, textAlign: 'right' },
  listingCardPrice: { fontSize: 16, fontWeight: '800', color: Colors.teal, textAlign: 'right' },
  listingCardMeta: { fontSize: 12, color: Colors.textMuted, textAlign: 'right' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  listingActions: { flexDirection: 'row-reverse', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingHorizontal: 8, paddingVertical: 6, gap: 4, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.background },
  actionBtnText: { fontSize: 11, fontWeight: '600' },
  requestCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 14, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  requestCardHeader: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 8, justifyContent: 'space-between' },
  requestCardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.text, textAlign: 'right' },
  requestCardMeta: { fontSize: 12, color: Colors.textMuted, textAlign: 'right' },
  requestCardDate: { fontSize: 11, color: Colors.textMuted, textAlign: 'right' },
});
