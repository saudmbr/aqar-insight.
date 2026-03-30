import { Feather } from '@expo/vector-icons';
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

const ROLE_LABELS: Record<string, string> = {
  admin: 'مدير',
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
}

function MenuItem({ icon, label, onPress, danger, badge }: MenuItemProps) {
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
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Feather name={icon as any} size={18} color={danger ? Colors.danger : Colors.teal} />
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, isLoading } = useAuth();
  const { favorites } = useFavorites();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد أنك تريد تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        {user ? (
          <>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user.fullName ?? user.username)[0].toUpperCase()}
              </Text>
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
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{favorites.length}</Text>
          <Text style={styles.statLabel}>مفضلة</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{user ? '✓' : '—'}</Text>
          <Text style={styles.statLabel}>الحساب</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>SA</Text>
          <Text style={styles.statLabel}>المنطقة</Text>
        </View>
      </View>

      {/* Auth Buttons if not logged in */}
      {!user && !isLoading && (
        <View style={styles.authBtns}>
          <Pressable
            style={styles.loginBtn}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
          </Pressable>
          <Pressable
            style={styles.registerBtn}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.registerBtnText}>إنشاء حساب جديد</Text>
          </Pressable>
        </View>
      )}

      {/* Menu */}
      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>التطبيق</Text>
        <View style={styles.menuGroup}>
          <MenuItem icon="home" label="العقارات" onPress={() => router.push('/(tabs)/listings')} />
          <MenuItem icon="heart" label="المفضلة" badge={favorites.length > 0 ? String(favorites.length) : undefined} onPress={() => router.push('/(tabs)/favorites')} />
          <MenuItem icon="map" label="الخريطة العقارية" onPress={() => router.push('/(tabs)/map')} />
        </View>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>المعلومات</Text>
        <View style={styles.menuGroup}>
          <MenuItem icon="info" label="عن التطبيق" onPress={() => {}} />
          <MenuItem icon="shield" label="سياسة الخصوصية" onPress={() => {}} />
          <MenuItem icon="file-text" label="الشروط والأحكام" onPress={() => {}} />
        </View>
      </View>

      {user && (
        <View style={styles.menuSection}>
          <View style={styles.menuGroup}>
            <MenuItem icon="log-out" label="تسجيل الخروج" onPress={handleLogout} danger />
          </View>
        </View>
      )}

      <Text style={styles.version}>عقار إنسايت v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 8,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.teal,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarGuest: { backgroundColor: 'rgba(255,255,255,0.12)' },
  avatarText: { fontSize: 32, fontWeight: '800', color: Colors.white },
  userName: { fontSize: 20, fontWeight: '800', color: Colors.white },
  guestSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  roleBadge: {
    backgroundColor: 'rgba(15,123,160,0.5)',
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.teal,
  },
  roleText: { fontSize: 12, color: Colors.tealLight, fontWeight: '600' },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  statsRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 16, paddingVertical: 16, gap: 10,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.card,
    borderRadius: 16, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statNum: { fontSize: 22, fontWeight: '800', color: Colors.navy },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  authBtns: { paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  loginBtn: {
    backgroundColor: Colors.teal, borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
  },
  loginBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  registerBtn: {
    borderWidth: 2, borderColor: Colors.teal,
    borderRadius: 16, paddingVertical: 14, alignItems: 'center',
  },
  registerBtnText: { color: Colors.teal, fontWeight: '700', fontSize: 15 },
  menuSection: { paddingHorizontal: 16, marginTop: 12 },
  menuSectionTitle: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', textAlign: 'right', marginBottom: 6 },
  menuGroup: {
    backgroundColor: Colors.card, borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  menuItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    gap: 12,
  },
  menuItemPressed: { backgroundColor: Colors.background },
  menuMiddle: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  menuLabel: { fontSize: 14, fontWeight: '600', color: Colors.text, textAlign: 'right' },
  menuDanger: { color: Colors.danger },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(15,123,160,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  menuIconDanger: { backgroundColor: 'rgba(239,68,68,0.1)' },
  badge: {
    backgroundColor: Colors.teal,
    borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2,
  },
  badgeText: { fontSize: 10, color: Colors.white, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 24 },
});
