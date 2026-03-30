import { Feather } from '@expo/vector-icons';
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
  const { favorites, isLoading } = useFavorites();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.title}>المفضلة</Text>
        <Text style={styles.sub}>{favorites.length} عقار محفوظ</Text>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Feather name="heart" size={40} color={Colors.teal} />
          </View>
          <Text style={styles.emptyTitle}>لا توجد مفضلات بعد</Text>
          <Text style={styles.emptyText}>أضف العقارات التي تعجبك إلى المفضلة وستظهر هنا</Text>
          <Pressable style={styles.emptyBtn} onPress={() => router.push('/(tabs)/listings')}>
            <Text style={styles.emptyBtnText}>تصفح العقارات</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 20 },
          ]}
          showsVerticalScrollIndicator={false}
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
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, textAlign: 'right' },
  sub: { fontSize: 13, color: Colors.textMuted, textAlign: 'right', marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  emptyIcon: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 16, marginTop: 8,
  },
  emptyBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  listContent: { padding: 16, gap: 12 },
  row: { flexDirection: 'row-reverse', gap: 12 },
});
