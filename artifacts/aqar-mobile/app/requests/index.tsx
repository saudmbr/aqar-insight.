import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { CustomerRequest, apiFetch, endpoints, formatPrice, REQUEST_TYPE_LABELS } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

const TYPE_TABS = [
  { key: '', label: 'الكل' },
  { key: 'property', label: 'عقار' },
  { key: 'service', label: 'خدمة' },
  { key: 'marketer', label: 'مسوّق' },
];

export default function RequestsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const { data: requests, isLoading } = useQuery<CustomerRequest[]>({
    queryKey: ['requests-list'],
    queryFn: () => apiFetch<CustomerRequest[]>(endpoints.requests),
    staleTime: 1000 * 60 * 3,
  });

  const filtered = useMemo(() => {
    if (!requests) return [];
    return requests.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch = !q || r.title.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q);
      const matchType = !selectedType || r.requestType === selectedType;
      return matchSearch && matchType;
    });
  }, [requests, search, selectedType]);

  const callPhone = (phone?: string) => phone && Linking.openURL(`tel:${phone}`);
  const openWhatsApp = (wa?: string) => wa && Linking.openURL(`https://wa.me/${wa.replace(/\D/g, '')}`);

  const typeColor: Record<string, string> = {
    property: Colors.teal,
    service: Colors.gold,
    marketer: '#10b981',
  };
  const typeBg: Record<string, string> = {
    property: 'rgba(15,123,160,0.12)',
    service: 'rgba(201,168,76,0.12)',
    marketer: 'rgba(16,185,129,0.12)',
  };

  return (
    <View style={[styles.screen, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>طلبات العملاء</Text>
        <Pressable
          onPress={() => user ? router.push('/requests/new') : router.push('/auth/login')}
          style={styles.addBtn}
        >
          <Feather name="plus" size={20} color={Colors.white} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث في الطلبات..."
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

      {/* Type tabs */}
      <View style={styles.tabsRow}>
        {TYPE_TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setSelectedType(t.key)}
            style={[styles.typeTab, selectedType === t.key && styles.typeTabActive]}
          >
            <Text style={[styles.typeTabText, selectedType === t.key && styles.typeTabTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.countText}>{filtered.length} طلب</Text>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.teal} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Feather name="inbox" size={44} color={Colors.textMuted} />
          <Text style={styles.emptyText}>لا توجد طلبات حالياً</Text>
          <Text style={styles.emptySubText}>كن أول من يضيف طلبه</Text>
          <Pressable
            style={styles.addReqBtn}
            onPress={() => user ? router.push('/requests/new') : router.push('/auth/login')}
          >
            <Feather name="plus" size={16} color={Colors.white} />
            <Text style={styles.addReqBtnText}>أضف طلبك الآن</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => String(r.id)}
          renderItem={({ item: r }) => (
            <View style={styles.card}>
              {/* Top row */}
              <View style={styles.cardTop}>
                <View style={[styles.statusBadge, r.status === 'open' && styles.statusOpen]}>
                  <View style={[styles.statusDot, r.status === 'open' && styles.statusDotOpen]} />
                  <Text style={styles.statusText}>{r.status === 'open' ? 'مفتوح' : 'مغلق'}</Text>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: typeBg[r.requestType] ?? Colors.skeleton }]}>
                  <Text style={[styles.typeText, { color: typeColor[r.requestType] ?? Colors.textSub }]}>
                    {REQUEST_TYPE_LABELS[r.requestType] ?? r.requestType}
                  </Text>
                </View>
              </View>

              {/* Title */}
              <Text style={styles.requestTitle}>{r.title}</Text>

              {/* Description */}
              {r.description && (
                <Text style={styles.requestDesc} numberOfLines={2}>{r.description}</Text>
              )}

              {/* Meta */}
              <View style={styles.metaRow}>
                {r.city && (
                  <View style={styles.metaItem}>
                    <Feather name="map-pin" size={11} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{r.city}</Text>
                  </View>
                )}
                {r.posterName && (
                  <View style={styles.metaItem}>
                    <Feather name="user" size={11} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{r.posterName}</Text>
                  </View>
                )}
              </View>

              {/* Budget */}
              {(r.budgetMin || r.budgetMax) && (
                <View style={styles.budgetRow}>
                  <Feather name="dollar-sign" size={12} color={Colors.teal} />
                  <Text style={styles.budgetText}>
                    {r.budgetMin ? formatPrice(r.budgetMin) : '?'} – {r.budgetMax ? formatPrice(r.budgetMax) : '?'} ريال
                  </Text>
                </View>
              )}

              {/* Actions */}
              {(r.contactPhone || r.contactWhatsapp) && (
                <View style={styles.actionsRow}>
                  {r.contactWhatsapp && (
                    <Pressable
                      style={[styles.actionBtn, styles.waBtn]}
                      onPress={() => openWhatsApp(r.contactWhatsapp)}
                    >
                      <Feather name="message-circle" size={13} color={Colors.white} />
                      <Text style={styles.actionBtnText}>واتساب</Text>
                    </Pressable>
                  )}
                  {r.contactPhone && (
                    <Pressable
                      style={[styles.actionBtn, styles.callBtn]}
                      onPress={() => callPhone(r.contactPhone)}
                    >
                      <Feather name="phone" size={13} color={Colors.white} />
                      <Text style={styles.actionBtnText}>اتصال</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: botPad + 30 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      {!isLoading && filtered.length > 0 && (
        <Pressable
          style={[styles.fab, { bottom: botPad + 20 }]}
          onPress={() => user ? router.push('/requests/new') : router.push('/auth/login')}
        >
          <Feather name="plus" size={22} color={Colors.white} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.navy, paddingHorizontal: 16, paddingBottom: 16,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.white, flex: 1 },
  addBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  searchWrap: { padding: 16, paddingBottom: 8 },
  searchBar: {
    backgroundColor: Colors.card, borderRadius: 14, paddingHorizontal: 14,
    paddingVertical: 10, flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, padding: 0 },
  tabsRow: {
    flexDirection: 'row-reverse', paddingHorizontal: 16, paddingBottom: 8, gap: 8,
  },
  typeTab: {
    flex: 1, paddingVertical: 7, borderRadius: 12,
    backgroundColor: Colors.card, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  typeTabActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  typeTabText: { fontSize: 12, fontWeight: '600', color: Colors.textSub },
  typeTabTextActive: { color: Colors.white },
  countText: { fontSize: 12, color: Colors.textMuted, paddingHorizontal: 20, paddingBottom: 6, textAlign: 'right' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 },
  emptyText: { fontSize: 16, color: Colors.textMuted, fontWeight: '700' },
  emptySubText: { fontSize: 12, color: Colors.textMuted },
  addReqBtn: {
    marginTop: 8, backgroundColor: Colors.teal, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 12,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
  },
  addReqBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  card: {
    backgroundColor: Colors.card, borderRadius: 18, padding: 14, marginBottom: 12,
    gap: 8, borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
    backgroundColor: Colors.skeleton,
  },
  statusOpen: { backgroundColor: 'rgba(16,185,129,0.1)' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textMuted },
  statusDotOpen: { backgroundColor: '#10b981' },
  statusText: { fontSize: 11, fontWeight: '700', color: Colors.textSub },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  typeText: { fontSize: 11, fontWeight: '700' },
  requestTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, textAlign: 'right' },
  requestDesc: { fontSize: 13, color: Colors.textSub, textAlign: 'right', lineHeight: 19 },
  metaRow: { flexDirection: 'row-reverse', gap: 14 },
  metaItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: Colors.textMuted },
  budgetRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  budgetText: { fontSize: 13, color: Colors.teal, fontWeight: '700' },
  actionsRow: { flexDirection: 'row-reverse', gap: 8, marginTop: 4 },
  actionBtn: {
    flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 9, borderRadius: 12,
  },
  waBtn: { backgroundColor: '#25D366' },
  callBtn: { backgroundColor: Colors.teal },
  actionBtnText: { color: Colors.white, fontWeight: '700', fontSize: 12 },
  fab: {
    position: 'absolute', right: 20,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.teal,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.teal, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
});
