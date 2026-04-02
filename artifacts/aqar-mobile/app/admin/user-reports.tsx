import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserReport, apiFetch, endpoints } from '@/constants/api';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';

const STATUS_FILTERS = [
  { key: 'pending', label: 'قيد المراجعة' },
  { key: 'reviewed', label: 'مراجعة' },
  { key: 'dismissed', label: 'مرفوضة' },
  { key: '', label: 'الكل' },
];

export default function AdminUserReportsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [filter, setFilter] = useState('pending');
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});

  const { data, isLoading } = useQuery<UserReport[]>({
    queryKey: ['admin-user-reports-mobile', filter],
    queryFn: () => apiFetch<UserReport[]>(filter ? `${endpoints.userReports}?status=${filter}` : endpoints.userReports),
    enabled: user?.role === 'admin',
  });

  const { mutate: updateReport, variables } = useMutation({
    mutationFn: async ({
      id,
      status,
      adminNote,
    }: {
      id: number;
      status: string;
      adminNote?: string;
    }) =>
      apiFetch<UserReport>(`${endpoints.userReports}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, adminNote }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-reports-mobile'] });
    },
  });

  if (user?.role !== 'admin') {
    return (
      <View style={styles.guardScreen}>
        <Feather name="shield-off" size={40} color={Colors.textMuted} />
        <Text style={styles.guardTitle}>هذه الشاشة للمشرف فقط</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={20} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>بلاغات المستخدمين</Text>
        <Feather name="flag" size={18} color={Colors.gold} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {STATUS_FILTERS.map((item) => {
            const active = item.key === filter;
            return (
              <Pressable
                key={item.key || 'all'}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(item.key)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.teal} />
          </View>
        ) : data?.length ? (
          data.map((item) => {
            const pending = variables?.id === item.id;
            return (
              <View key={item.id} style={styles.card}>
                <Text style={styles.cardTitle}>{item.targetTitle || `بلاغ على ${item.targetType}`}</Text>
                <Text style={styles.cardMeta}>
                  {item.targetType} #{item.targetId} • {new Date(item.createdAt).toLocaleDateString('ar-SA')}
                </Text>
                <View style={styles.reasonBox}>
                  <Text style={styles.reasonTitle}>السبب</Text>
                  <Text style={styles.reasonBody}>{item.reason}</Text>
                  {item.details ? <Text style={styles.reasonDetails}>{item.details}</Text> : null}
                </View>

                <TextInput
                  style={styles.noteInput}
                  multiline
                  placeholder="ملاحظة الإدارة"
                  placeholderTextColor={Colors.textMuted}
                  textAlign="right"
                  value={noteDrafts[item.id] ?? item.adminNote ?? ''}
                  onChangeText={(value) => setNoteDrafts((prev) => ({ ...prev, [item.id]: value }))}
                />

                <View style={styles.actionsRow}>
                  <Pressable
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() =>
                      updateReport({
                        id: item.id,
                        status: 'dismissed',
                        adminNote: noteDrafts[item.id] ?? item.adminNote ?? '',
                      })
                    }
                  >
                    {pending ? <ActivityIndicator size="small" color={Colors.danger} /> : <Text style={styles.rejectText}>رفض</Text>}
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, styles.reviewBtn]}
                    onPress={() =>
                      updateReport({
                        id: item.id,
                        status: 'reviewed',
                        adminNote: noteDrafts[item.id] ?? item.adminNote ?? '',
                      })
                    }
                  >
                    {pending ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.reviewText}>تمت المراجعة</Text>}
                  </Pressable>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyWrap}>
            <Feather name="check-circle" size={42} color={Colors.success} />
            <Text style={styles.emptyTitle}>لا توجد بلاغات بهذه الحالة</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  guardScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  guardTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  header: {
    backgroundColor: Colors.navy,
    paddingHorizontal: 16,
    paddingBottom: 18,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
  body: { padding: 16, gap: 14 },
  filterRow: { gap: 10, paddingBottom: 8 },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  filterChipText: { color: Colors.textSub, fontSize: 12, fontWeight: '700' },
  filterChipTextActive: { color: Colors.white },
  loadingWrap: { paddingTop: 48 },
  card: { backgroundColor: Colors.white, borderRadius: 22, padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, textAlign: 'right', marginBottom: 4 },
  cardMeta: { fontSize: 12, color: Colors.textMuted, textAlign: 'right', marginBottom: 12 },
  reasonBox: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  reasonTitle: { fontSize: 12, fontWeight: '800', color: Colors.danger, textAlign: 'right', marginBottom: 4 },
  reasonBody: { fontSize: 13, fontWeight: '700', color: Colors.text, textAlign: 'right', marginBottom: 4 },
  reasonDetails: { fontSize: 12, color: Colors.textSub, textAlign: 'right', lineHeight: 18 },
  noteInput: {
    minHeight: 92,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: Colors.text,
    marginBottom: 12,
  },
  actionsRow: { flexDirection: 'row-reverse', gap: 10 },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  reviewBtn: { backgroundColor: Colors.teal },
  rejectBtn: { backgroundColor: 'rgba(239,68,68,0.08)' },
  reviewText: { color: Colors.white, fontWeight: '800' },
  rejectText: { color: Colors.danger, fontWeight: '800' },
  emptyWrap: { alignItems: 'center', paddingTop: 70, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
});
