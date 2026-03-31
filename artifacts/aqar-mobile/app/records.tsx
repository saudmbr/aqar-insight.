import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { fetchListings, SAUDI_REGIONS, PROPERTY_TYPES, formatPrice } from '@/constants/api';

const STATUS_OPTIONS = [
  { key: '', label: 'الكل' },
  { key: 'active', label: 'نشط' },
  { key: 'sold', label: 'مباع' },
  { key: 'rented', label: 'مؤجر' },
  { key: 'archived', label: 'مؤرشف' },
];

const DEAL_OPTIONS = [
  { key: '', label: 'الكل' },
  { key: 'sale', label: 'للبيع' },
  { key: 'rent', label: 'للإيجار' },
];

function statusColor(s: string) {
  if (s === 'active') return '#10b981';
  if (s === 'sold') return '#ef4444';
  if (s === 'rented') return '#3b82f6';
  return Colors.textMuted;
}
function statusLabel(s: string) {
  const m: Record<string, string> = { active: 'نشط', sold: 'مباع', rented: 'مؤجر', archived: 'مؤرشف', pending: 'معلق' };
  return m[s] ?? s;
}

export default function RecordsPage() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 70 : insets.top;

  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [listingType, setListingType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(page) });
  if (city) params.set('city', city);
  if (propertyType) params.set('propertyType', propertyType);
  if (listingType) params.set('listingType', listingType);
  if (status) params.set('status', status);
  if (search.trim()) params.set('q', search.trim());

  const { data, isLoading } = useQuery({
    queryKey: ['records', city, propertyType, listingType, status, search, page],
    queryFn: () => fetchListings(params),
  });

  const rows = data?.listings ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <View style={s.screen}>
      {/* Header */}
      <LinearGradient colors={[Colors.navyDark, Colors.navy]} style={[s.header, { paddingTop: topPad + 8 }]}>
        <View style={s.headerRow}>
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-right" size={20} color={Colors.white} />
          </Pressable>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>سجل العقارات</Text>
            <Text style={s.headerSub}>{total} عقار مسجّل</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Search */}
        <View style={s.searchWrap}>
          <Feather name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="ابحث في السجلات..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={v => { setSearch(v); setPage(1); }}
            textAlign="right"
          />
          {search ? (
            <Pressable onPress={() => { setSearch(''); setPage(1); }}>
              <Feather name="x" size={14} color={Colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </LinearGradient>

      {/* Filters */}
      <View style={s.filtersWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {DEAL_OPTIONS.map(opt => (
            <Pressable
              key={opt.key}
              style={[s.filterChip, listingType === opt.key && s.filterChipActive]}
              onPress={() => { setListingType(opt.key); setPage(1); }}
            >
              <Text style={[s.filterChipText, listingType === opt.key && s.filterChipTextActive]}>{opt.label}</Text>
            </Pressable>
          ))}
          <View style={s.chipDivider} />
          {STATUS_OPTIONS.slice(0, 4).map(opt => (
            <Pressable
              key={opt.key}
              style={[s.filterChip, status === opt.key && s.filterChipActive]}
              onPress={() => { setStatus(opt.key); setPage(1); }}
            >
              <Text style={[s.filterChipText, status === opt.key && s.filterChipTextActive]}>{opt.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 4 }}>
          {[{ value: '', label: 'كل المدن' }, ...SAUDI_REGIONS.slice(0, 8).map(r => ({ value: r, label: r }))].map(c => (
            <Pressable
              key={c.value}
              style={[s.filterChip, s.filterChipSm, city === c.value && s.filterChipActive]}
              onPress={() => { setCity(c.value); setPage(1); }}
            >
              <Text style={[s.filterChipText, city === c.value && s.filterChipTextActive]}>{c.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 4 }}>
          {[{ value: '', label: 'كل الأنواع' }, ...PROPERTY_TYPES.slice(0, 6).map(p => ({ value: p, label: p }))].map(pt => (
            <Pressable
              key={pt.value}
              style={[s.filterChip, s.filterChipSm, propertyType === pt.value && s.filterChipActive]}
              onPress={() => { setPropertyType(pt.value); setPage(1); }}
            >
              <Text style={[s.filterChipText, propertyType === pt.value && s.filterChipTextActive]}>{pt.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Table */}
      {isLoading ? (
        <View style={s.loadingWrap}>
          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={s.rowSkeleton} />
          ))}
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20, paddingHorizontal: 16, paddingTop: 8 }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Feather name="database" size={36} color={Colors.textMuted} />
              <Text style={s.emptyTitle}>لا توجد سجلات</Text>
              <Text style={s.emptyDesc}>جرّب تعديل فلاتر البحث</Text>
            </View>
          }
          ListFooterComponent={
            <View style={s.pagination}>
              <Pressable
                style={[s.pageBtn, page >= totalPages && s.pageBtnDisabled]}
                onPress={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
              >
                <Feather name="chevron-left" size={16} color={page >= totalPages ? Colors.textMuted : Colors.teal} />
              </Pressable>
              <Text style={s.pageLabel}>{page} / {totalPages}</Text>
              <Pressable
                style={[s.pageBtn, page <= 1 && s.pageBtnDisabled]}
                onPress={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page <= 1}
              >
                <Feather name="chevron-right" size={16} color={page <= 1 ? Colors.textMuted : Colors.teal} />
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={s.row} onPress={() => router.push(`/listing/${item.id}`)}>
              <View style={s.rowRight}>
                <Text style={s.rowTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={s.rowMeta}>
                  {[item.propertyType, item.city, item.district].filter(Boolean).join(' · ')}
                </Text>
                <View style={s.rowBottom}>
                  <View style={[s.statusBadge, { backgroundColor: `${statusColor(item.status)}18` }]}>
                    <Text style={[s.statusText, { color: statusColor(item.status) }]}>{statusLabel(item.status)}</Text>
                  </View>
                  <Text style={s.rowType}>{{ sale: 'للبيع', rent: 'للإيجار', 'daily-rent': 'إيجار يومي' }[item.listingType] ?? item.listingType}</Text>
                </View>
              </View>
              <View style={s.rowLeft}>
                <Text style={s.rowPrice}>{formatPrice(item.price)}</Text>
                <Text style={s.rowPriceUnit}>ريال</Text>
                {item.areaSqm && <Text style={s.rowArea}>{item.areaSqm}م²</Text>}
                <Feather name="chevron-left" size={14} color={Colors.textMuted} style={{ marginTop: 6 }} />
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },

  header: { paddingHorizontal: 16, paddingBottom: 12 },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: Colors.white, fontSize: 17, fontWeight: 'bold' },
  headerSub: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  searchWrap: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 12, height: 40 },
  searchInput: { flex: 1, color: Colors.white, fontSize: 14, marginRight: 8 },

  filtersWrap: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingTop: 8 },
  filterChip: {
    backgroundColor: Colors.bg,
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipSm: { paddingHorizontal: 10, paddingVertical: 4 },
  filterChipActive: { backgroundColor: 'rgba(15,123,160,0.1)', borderColor: Colors.teal },
  filterChipText: { color: Colors.textMuted, fontSize: 13 },
  filterChipTextActive: { color: Colors.teal, fontWeight: '600' },
  chipDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },

  loadingWrap: { padding: 16 },
  rowSkeleton: { height: 76, backgroundColor: '#e2e8f0', borderRadius: 12, marginBottom: 8 },

  row: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  rowRight: { flex: 1 },
  rowLeft: { alignItems: 'flex-end', marginRight: 12 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, textAlign: 'right', marginBottom: 3 },
  rowMeta: { fontSize: 12, color: Colors.textMuted, textAlign: 'right', marginBottom: 6 },
  rowBottom: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  rowType: { fontSize: 12, color: Colors.textSub },
  rowPrice: { fontSize: 15, fontWeight: 'bold', color: Colors.navy },
  rowPriceUnit: { fontSize: 11, color: Colors.textMuted },
  rowArea: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  pagination: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 16 },
  pageBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(15,123,160,0.1)', alignItems: 'center', justifyContent: 'center' },
  pageBtnDisabled: { backgroundColor: Colors.bg, opacity: 0.5 },
  pageLabel: { color: Colors.textMuted, fontSize: 14 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { color: Colors.text, fontSize: 16, fontWeight: 'bold' },
  emptyDesc: { color: Colors.textMuted, fontSize: 14 },
});
