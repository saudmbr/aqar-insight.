import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminUser, apiFetch, endpoints } from '@/constants/api';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';

const ROLE_OPTIONS = [
  { key: 'user', label: 'مستخدم' },
  { key: 'real_estate_marketer', label: 'مسوّق عقاري' },
  { key: 'service_provider', label: 'مزود خدمة' },
  { key: 'admin', label: 'مدير' },
];

const ROLE_COLORS: Record<string, string> = {
  admin: Colors.danger,
  user: Colors.textSub,
  real_estate_marketer: '#7C3AED',
  service_provider: Colors.gold,
};

export default function AdminUsersScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data, isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin-users-mobile'],
    queryFn: () => apiFetch<AdminUser[]>(endpoints.adminUsers),
    enabled: user?.role === 'admin',
  });

  const { mutate: updateRole, variables: roleVariables } = useMutation({
    mutationFn: async ({ id, role }: { id: number; role: string }) =>
      apiFetch(endpoints.adminUserRole(id), {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-mobile'] });
    },
  });

  const { mutate: deleteUser, variables: deleteVariables } = useMutation({
    mutationFn: async (id: number) =>
      apiFetch(`${endpoints.adminUsers}/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-mobile'] });
    },
  });

  if (user?.role !== 'admin') {
    return (
      <View style={styles.guardScreen}>
        <Feather name="shield-off" size={40} color={Colors.textMuted} />
        <Text style={styles.guardTitle}>الوصول غير متاح</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={20} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>إدارة المستخدمين</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{data?.length ?? 0}</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.teal} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listWrap} showsVerticalScrollIndicator={false}>
          {(data ?? []).map((item) => {
            const roleColor = ROLE_COLORS[item.role] ?? Colors.teal;
            const deleting = deleteVariables === item.id;

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.roleBadge, { backgroundColor: `${roleColor}18` }]}>
                    <Text style={[styles.roleBadgeText, { color: roleColor }]}>
                      {ROLE_OPTIONS.find((role) => role.key === item.role)?.label ?? item.role}
                    </Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{item.fullName || item.username}</Text>
                    <Text style={styles.cardSub}>@{item.username}</Text>
                    <Text style={styles.cardSub}>{item.email || 'بدون بريد إلكتروني'}</Text>
                  </View>
                </View>

                <View style={styles.rolesRow}>
                  {ROLE_OPTIONS.map((role) => {
                    const active = item.role === role.key;
                    const pending = roleVariables?.id === item.id && roleVariables?.role === role.key;
                    return (
                      <Pressable
                        key={role.key}
                        onPress={() => updateRole({ id: item.id, role: role.key })}
                        style={[styles.roleChip, active && styles.roleChipActive]}
                      >
                        {pending ? (
                          <ActivityIndicator size="small" color={active ? Colors.white : Colors.teal} />
                        ) : (
                          <Text style={[styles.roleChipText, active && styles.roleChipTextActive]}>
                            {role.label}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable
                  style={styles.deleteBtn}
                  onPress={() =>
                    Alert.alert('حذف المستخدم', 'هل أنت متأكد من حذف هذا المستخدم نهائيًا؟', [
                      { text: 'إلغاء', style: 'cancel' },
                      { text: 'حذف', style: 'destructive', onPress: () => deleteUser(item.id) },
                    ])
                  }
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color={Colors.danger} />
                  ) : (
                    <>
                      <Feather name="trash-2" size={15} color={Colors.danger} />
                      <Text style={styles.deleteText}>حذف المستخدم</Text>
                    </>
                  )}
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      )}
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
  countBadge: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  countBadgeText: { color: Colors.gold, fontWeight: '800' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listWrap: { padding: 16, gap: 14 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 16,
  },
  cardTop: { flexDirection: 'row-reverse', gap: 12, marginBottom: 14 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '800', color: Colors.text, textAlign: 'right', marginBottom: 4 },
  cardSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'right', marginBottom: 2 },
  roleBadge: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '800' },
  rolesRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleChipActive: {
    backgroundColor: Colors.teal,
    borderColor: Colors.teal,
  },
  roleChipText: { fontSize: 12, color: Colors.textSub, fontWeight: '700' },
  roleChipTextActive: { color: Colors.white },
  deleteBtn: {
    marginTop: 16,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  deleteText: { color: Colors.danger, fontWeight: '700' },
});
