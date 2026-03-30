import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
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

interface Notification {
  id: string;
  type: 'listing' | 'request' | 'system' | 'price' | 'marketer';
  title: string;
  body: string;
  time: string;
  read: boolean;
  icon: string;
  iconColor: string;
  iconBg: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1', type: 'listing', read: false,
    title: 'عقار جديد في الرياض',
    body: 'تمت إضافة فيلا جديدة في حي الياسمين تطابق بحثك المحفوظ',
    time: 'منذ 10 دقائق',
    icon: 'home', iconColor: Colors.teal, iconBg: 'rgba(15,123,160,0.12)',
  },
  {
    id: '2', type: 'price', read: false,
    title: 'انخفاض في السعر',
    body: 'انخفض سعر شقة في جدة من 850,000 إلى 800,000 ريال',
    time: 'منذ ساعة',
    icon: 'trending-down', iconColor: '#10b981', iconBg: 'rgba(16,185,129,0.12)',
  },
  {
    id: '3', type: 'request', read: true,
    title: 'رد على طلبك',
    body: 'وصل رد جديد على طلب البحث عن شقة في المدينة المنورة',
    time: 'منذ 3 ساعات',
    icon: 'inbox', iconColor: Colors.gold, iconBg: 'rgba(201,168,76,0.12)',
  },
  {
    id: '4', type: 'marketer', read: true,
    title: 'مسوّق جديد تم التحقق منه',
    body: 'أحمد المطيري — مسوّق عقاري معتمد في الرياض',
    time: 'منذ أمس',
    icon: 'user-check', iconColor: '#8b5cf6', iconBg: 'rgba(139,92,246,0.12)',
  },
  {
    id: '5', type: 'system', read: true,
    title: 'تحديث المنصة',
    body: 'تم إضافة ميزة التحليلات الذكية وتحسين تجربة البحث',
    time: 'منذ يومين',
    icon: 'zap', iconColor: Colors.navy, iconBg: 'rgba(11,22,40,0.1)',
  },
];

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [refreshing, setRefreshing] = useState(false);

  const unread = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  return (
    <View style={[styles.screen, { paddingBottom: botPad }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-right" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>الإشعارات</Text>
        {unread > 0 ? (
          <Pressable onPress={markAllRead} hitSlop={8}>
            <Text style={styles.markAllText}>قراءة الكل</Text>
          </Pressable>
        ) : <View style={{ width: 60 }} />}
        {unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unread}</Text>
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.teal} />}
        contentContainerStyle={{ paddingVertical: 12, gap: 2 }}
      >
        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="bell-off" size={52} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>لا توجد إشعارات</Text>
            <Text style={styles.emptyBody}>ستظهر هنا كل التحديثات والتنبيهات المتعلقة بحسابك</Text>
          </View>
        ) : (
          notifications.map((notif) => (
            <Pressable
              key={notif.id}
              style={[styles.notifRow, !notif.read && styles.notifUnread]}
              onPress={() => markRead(notif.id)}
            >
              {!notif.read && <View style={styles.unreadDot} />}
              <View style={[styles.notifIcon, { backgroundColor: notif.iconBg }]}>
                <Feather name={notif.icon as any} size={20} color={notif.iconColor} />
              </View>
              <View style={styles.notifContent}>
                <Text style={[styles.notifTitle, !notif.read && styles.notifTitleBold]}>{notif.title}</Text>
                <Text style={styles.notifBody} numberOfLines={2}>{notif.body}</Text>
                <Text style={styles.notifTime}>{notif.time}</Text>
              </View>
            </Pressable>
          ))
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
  markAllText: { fontSize: 12, color: Colors.tealLight, fontWeight: '600' },
  unreadBadge: {
    position: 'absolute', top: 14, left: 56,
    backgroundColor: Colors.danger, borderRadius: 10,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  unreadBadgeText: { fontSize: 10, color: Colors.white, fontWeight: '700' },
  notifRow: {
    flexDirection: 'row-reverse', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.card, gap: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  notifUnread: { backgroundColor: 'rgba(15,123,160,0.04)' },
  unreadDot: {
    position: 'absolute', top: 18, left: 14,
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.teal,
  },
  notifIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  notifContent: { flex: 1, gap: 4 },
  notifTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, textAlign: 'right' },
  notifTitleBold: { fontWeight: '800', color: Colors.navy },
  notifBody: { fontSize: 12, color: Colors.textSub, textAlign: 'right', lineHeight: 18 },
  notifTime: { fontSize: 11, color: Colors.textMuted, textAlign: 'right' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyBody: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
