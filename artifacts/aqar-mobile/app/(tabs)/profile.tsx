import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { Listing, apiFetch, endpoints } from '@/constants/api';

const ROLE_LABELS: Record<string, string> = {
  admin: 'مدير النظام',
  user: 'مستخدم',
  real_estate_marketer: 'مسوّق عقاري',
  service_provider: 'مزود خدمات',
};

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
  badge?: string;
  color?: string;
}

function MenuItem({ icon, label, onPress, danger, badge, color }: MenuItemProps) {
  const iconColor = danger ? Colors.danger : (color ?? Colors.teal);
  const bgColor = danger ? 'rgba(239,68,68,0.1)' : `${iconColor}18`;
  return (
    <Pressable
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
      onPress={onPress}
    >
      <Feather name="chevron-left" size={18} color={Colors.textMuted} />
      <View style={styles.menuMiddle}>
        <Text style={[styles.menuLabel, danger && styles.menuDanger]}>{label}</Text>
        {badge && <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>}
      </View>
      <View style={[styles.menuIcon, { backgroundColor: bgColor }]}>
        <Feather name={icon as any} size={17} color={iconColor} />
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, isLoading } = useAuth();
  const { favorites } = useFavorites();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const { data: myListings } = useQuery<Listing[]>({
    queryKey: ['my-listings'],
    queryFn: () => apiFetch<Listing[]>(endpoints.myListings),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد أنك تريد تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: botPad + 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        {user ? (
          <>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user.fullName ?? user.username)[0].toUpperCase()}</Text>
            </View>
            <Text style={styles.userName}>{user.fullName ?? user.username}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{ROLE_LABELS[user.role] ?? user.role}</Text>
            </View>
            {user.email && <Text style={styles.email}>{user.email}</Text>}
          </>
        ) : (
          <>
            <View style={[styles.avatar, styles.avatarGuest]}>
              <Feather name="user" size={36} color={Colors.teal} />
            </View>
            <Text style={styles.userName}>مرحباً بك</Text>
            <Text style={styles.guestSub}>سجّل دخولك للاستمتاع بكل المميزات</Text>
          </>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Pressable style={styles.statCard} onPress={() => router.push('/(tabs)/favorites')}>
          <Feather name="heart" size={16} color={Colors.danger} />
          <Text style={styles.statNum}>{favorites.length}</Text>
          <Text style={styles.statLabel}>مفضلة</Text>
        </Pressable>
        <Pressable style={styles.statCard} onPress={() => user && router.push('/requests')}>
          <Feather name="inbox" size={16} color={Colors.gold} />
          <Text style={styles.statNum}>{user ? '∞' : '—'}</Text>
          <Text style={styles.statLabel}>الطلبات</Text>
        </Pressable>
        <Pressable style={styles.statCard} onPress={() => router.push('/analytics')}>
          <Feather name="bar-chart-2" size={16} color={Colors.teal} />
          <Text style={styles.statNum}>{myListings?.length ?? '—'}</Text>
          <Text style={styles.statLabel}>{user ? 'عقاراتي' : 'تحليلات'}</Text>
        </Pressable>
      </View>

      {/* Auth Buttons */}
      {!user && !isLoading && (
        <View style={styles.authBtns}>
          <Pressable style={styles.loginBtn} onPress={() => router.push('/auth/login')}>
            <Feather name="log-in" size={18} color={Colors.white} />
            <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
          </Pressable>
          <Pressable style={styles.registerBtn} onPress={() => router.push('/auth/register')}>
            <Text style={styles.registerBtnText}>إنشاء حساب جديد</Text>
          </Pressable>
        </View>
      )}

      {/* My Account (logged in) */}
      {user && (
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>حسابي</Text>
          <View style={styles.menuGroup}>
            <MenuItem icon="home" label="عقاراتي" badge={myListings?.length ? String(myListings.length) : undefined} onPress={() => {}} color={Colors.teal} />
            <MenuItem icon="inbox" label="طلباتي" onPress={() => router.push('/requests')} color={Colors.gold} />
            <MenuItem icon="heart" label="المفضلة" badge={favorites.length > 0 ? String(favorites.length) : undefined} onPress={() => router.push('/(tabs)/favorites')} color="#e11d48" />
            <MenuItem icon="user" label="تعديل الملف الشخصي" onPress={() => {}} color="#8b5cf6" />
          </View>
        </View>
      )}

      {/* Explore */}
      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>استكشف المنصة</Text>
        <View style={styles.menuGroup}>
          <MenuItem icon="grid" label="العقارات" onPress={() => router.push('/(tabs)/listings')} color={Colors.teal} />
          <MenuItem icon="compass" label="اكتشف" onPress={() => router.push('/(tabs)/discover')} color="#8b5cf6" />
          <MenuItem icon="users" label="المسوّقون العقاريون" onPress={() => router.push('/marketers')} color="#10b981" />
          <MenuItem icon="briefcase" label="مزودو الخدمات" onPress={() => router.push('/services')} color={Colors.gold} />
          <MenuItem icon="inbox" label="طلبات العملاء" onPress={() => router.push('/requests')} color="#f59e0b" />
          <MenuItem icon="bar-chart-2" label="تحليلات السوق" onPress={() => router.push('/analytics')} color="#ef4444" />
          <MenuItem icon="map" label="الخريطة العقارية" onPress={() => router.push('/(tabs)/map')} color={Colors.navy} />
        </View>
      </View>

      {/* Legal & Info */}
      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>معلومات</Text>
        <View style={styles.menuGroup}>
          <MenuItem icon="info" label="عن المنصة" onPress={() => {}} color={Colors.teal} />
          <MenuItem icon="shield" label="سياسة الخصوصية" onPress={() => {}} color="#6366f1" />
          <MenuItem icon="file-text" label="الشروط والأحكام" onPress={() => {}} color={Colors.textSub} />
          <MenuItem icon="phone" label="تواصل معنا" onPress={() => {}} color="#10b981" />
        </View>
      </View>

      {user && (
        <View style={styles.menuSection}>
          <View style={styles.menuGroup}>
            <MenuItem icon="log-out" label="تسجيل الخروج" onPress={handleLogout} danger />
          </View>
        </View>
      )}

      <Text style={styles.version}>عقار إنسايت v2.0 — منصة العقارات السعودية</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.navy, paddingHorizontal: 20, paddingBottom: 32,
    alignItems: 'center', gap: 8,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarGuest: { backgroundColor: 'rgba(255,255,255,0.1)' },
  avatarText: { fontSize: 32, fontWeight: '800', color: Colors.white },
  userName: { fontSize: 20, fontWeight: '800', color: Colors.white },
  guestSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  roleBadge: {
    backgroundColor: 'rgba(15,123,160,0.4)', paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.teal,
  },
  roleText: { fontSize: 12, color: Colors.tealLight, fontWeight: '600' },
  email: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  statsRow: { flexDirection: 'row-reverse', paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 14,
    alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statNum: { fontSize: 20, fontWeight: '800', color: Colors.navy },
  statLabel: { fontSize: 10, color: Colors.textMuted },
  authBtns: { paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  loginBtn: {
    backgroundColor: Colors.teal, borderRadius: 16, paddingVertical: 16,
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  loginBtnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  registerBtn: {
    borderWidth: 2, borderColor: Colors.teal, borderRadius: 16,
    paddingVertical: 14, alignItems: 'center',
  },
  registerBtnText: { color: Colors.teal, fontWeight: '700', fontSize: 15 },
  menuSection: { paddingHorizontal: 16, marginTop: 14 },
  menuSectionTitle: { fontSize: 11, color: Colors.textMuted, fontWeight: '700', textAlign: 'right', marginBottom: 6, textTransform: 'uppercase' },
  menuGroup: {
    backgroundColor: Colors.card, borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  menuItem: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight, gap: 12,
  },
  menuItemPressed: { backgroundColor: Colors.background },
  menuMiddle: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  menuLabel: { fontSize: 14, fontWeight: '600', color: Colors.text, textAlign: 'right' },
  menuDanger: { color: Colors.danger },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badge: { backgroundColor: Colors.teal, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 10, color: Colors.white, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 11, color: Colors.textMuted, marginTop: 24, paddingBottom: 8 },
});
