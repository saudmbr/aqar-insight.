import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { ListingCard } from '@/components/ListingCard';
import { useFavorites } from '@/context/FavoritesContext';

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { favorites } = useFavorites();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.navyDark, Colors.navy]}
        style={[styles.header, { paddingTop: topPad + 16 }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerCount}>{favorites.length}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>المفضلة</Text>
            <Text style={styles.headerSub}>العقارات المحفوظة</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Empty State */}
      {favorites.length === 0 ? (
        <View style={styles.empty}>
          {/* Illustration */}
          <View style={styles.emptyIllustration}>
            <View style={styles.emptyCircleOuter}>
              <View style={styles.emptyCircleInner}>
                <Feather name="heart" size={42} color={Colors.teal} />
              </View>
            </View>
            {/* Decorative dots */}
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>

          <Text style={styles.emptyTitle}>قائمة المفضلة فارغة</Text>
          <Text style={styles.emptyBody}>
            تصفح العقارات واضغط على{' '}
            <Text style={{ color: Colors.danger, fontWeight: '700' }}>♥</Text>
            {' '}لإضافتها هنا
          </Text>

          <Pressable
            style={({ pressed }) => [styles.emptyBtn, pressed && styles.pressed]}
            onPress={() => router.push('/(tabs)/listings')}
          >
            <LinearGradient
              colors={[Colors.teal, Colors.tealDim]}
              style={styles.emptyBtnGrad}
            >
              <Feather name="grid" size={16} color={Colors.white} />
              <Text style={styles.emptyBtnText}>تصفح العقارات</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={styles.secondaryBtn}
            onPress={() => router.push('/(tabs)/discover')}
          >
            <Text style={styles.secondaryBtnText}>اكتشف عقارات جديدة</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.listContent, { paddingBottom: botPad + 20 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>{favorites.length} عقار محفوظ</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onPress={() => router.push({ pathname: '/listing/[id]', params: { id: String(item.id) } })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },

  header: { paddingHorizontal: 20, paddingBottom: 22 },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14 },
  headerBadge: {
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCount: { fontSize: 20, fontWeight: '900', color: Colors.white },
  headerText: { flex: 1, alignItems: 'flex-end' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  /* Empty state */
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 14 },
  emptyIllustration: { position: 'relative', width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emptyCircleOuter: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(15,123,160,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyCircleInner: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(15,123,160,0.1)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  dot: { position: 'absolute', borderRadius: 100, backgroundColor: Colors.teal },
  dot1: { width: 10, height: 10, opacity: 0.3, top: 15, right: 20 },
  dot2: { width: 6, height: 6, opacity: 0.2, bottom: 22, left: 18 },
  dot3: { width: 14, height: 14, opacity: 0.15, top: 30, left: 10, backgroundColor: Colors.gold },

  emptyTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  emptyBody: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },

  emptyBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', shadowColor: Colors.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  emptyBtnGrad: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, paddingHorizontal: 28 },
  emptyBtnText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },

  secondaryBtn: { paddingVertical: 10 },
  secondaryBtnText: { fontSize: 14, color: Colors.teal, fontWeight: '600', textAlign: 'center' },

  /* List */
  listContent: { padding: 16, gap: 12 },
  listHeader: { marginBottom: 4 },
  listHeaderText: { fontSize: 13, color: Colors.textMuted, textAlign: 'right', fontWeight: '600' },
  row: { flexDirection: 'row-reverse', gap: 12, marginBottom: 0 },
});
