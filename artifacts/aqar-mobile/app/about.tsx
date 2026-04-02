import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
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
import { AppLogo } from '@/components/AppLogo';
import { Colors } from '@/constants/colors';
import { API_BASE } from '@/constants/api';

const FEATURES = [
  { icon: 'bar-chart-2', color: Colors.teal, title: 'تحليلات ذكية', body: 'بيانات حية لمتوسطات الأسعار والمناطق والأنواع' },
  { icon: 'map-pin', color: '#8b5cf6', title: 'خرائط تفاعلية', body: 'اكتشف العقارات جغرافياً بدقة متناهية' },
  { icon: 'users', color: '#10b981', title: 'شبكة مسوّقين معتمدة', body: 'أكثر من 200 مسوّق عقاري موثّق' },
  { icon: 'shield', color: Colors.gold, title: 'بيانات محقّقة', body: 'كل عقار يمر بمراجعة دقيقة قبل النشر' },
  { icon: 'trending-up', color: '#ef4444', title: 'مؤشر السوق الحي', body: 'تابع حركة السوق لحظياً مع التقارير الأسبوعية' },
  { icon: 'award', color: Colors.navy, title: 'موثوقية عالية', body: 'منصة سعودية 100% متوافقة مع أنظمة السوق العقاري' },
];

const TEAM_STATS = [
  { num: '200+', label: 'مسوّق معتمد' },
  { num: '5000+', label: 'عقار نشط' },
  { num: '13', label: 'منطقة مغطّاة' },
  { num: '98%', label: 'رضا العملاء' },
];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const [userRating, setUserRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const handleRate = async (star: number) => {
    setUserRating(star);
    try {
      await fetch(`${API_BASE}/api/platform-rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rating: star }),
      });
    } catch {}
    setRatingSubmitted(true);
    Alert.alert('شكراً!', 'تقييمك يساعدنا في تحسين المنصة');
  };

  return (
    <View style={[styles.screen, { paddingBottom: botPad }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-right" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>عن المنصة</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <AppLogo size={88} />
          <Text style={styles.appName}>عقار إنسايت</Text>
          <Text style={styles.appTagline}>منصة العقارات السعودية الذكية</Text>
          <View style={styles.missionBox}>
            <Text style={styles.missionText}>
              بيانات حقيقية لقرارات حقيقية. نجمع أدق البيانات العقارية السعودية في منصة واحدة لمساعدتك على اتخاذ أفضل القرارات العقارية بثقة واحترافية.
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {TEAM_STATS.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statNum}>{s.num}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ما يميّزنا</Text>
          <View style={styles.featuresGrid}>
            {FEATURES.map((f) => (
              <View key={f.title} style={styles.featureCard}>
                <View style={[styles.featureIcon, { backgroundColor: `${f.color}18` }]}>
                  <Feather name={f.icon as any} size={20} color={f.color} />
                </View>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureBody}>{f.body}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Rating */}
        <View style={styles.section}>
          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>كيف تقيّم تجربتك؟</Text>
            <Text style={styles.ratingSubtitle}>رأيك يساعدنا على التحسين المستمر</Text>
            {ratingSubmitted ? (
              <View style={styles.ratingDone}>
                <Feather name="check-circle" size={24} color="#10b981" />
                <Text style={styles.ratingDoneText}>شكراً على تقييمك!</Text>
              </View>
            ) : (
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable key={star} onPress={() => handleRate(star)} hitSlop={8}>
                    <Feather
                      name={star <= userRating ? 'star' : 'star'}
                      size={32}
                      color={star <= userRating ? Colors.gold : Colors.border}
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <View style={styles.contactCard}>
            <Feather name="mail" size={20} color={Colors.teal} />
            <View style={styles.contactText}>
              <Text style={styles.contactTitle}>تواصل معنا</Text>
              <Text style={styles.contactBody}>info@aqar-insight.sa</Text>
            </View>
          </View>
        </View>

        <Text style={styles.version}>عقار إنسايت v2.0 — جميع الحقوق محفوظة © 2025</Text>
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
  hero: { backgroundColor: Colors.navy, alignItems: 'center', paddingHorizontal: 20, paddingBottom: 32, paddingTop: 24, gap: 10 },
  appName: { fontSize: 26, fontWeight: '800', color: Colors.white },
  appTagline: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  missionBox: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', marginTop: 6,
  },
  missionText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22 },
  statsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', paddingHorizontal: 12, paddingVertical: 16, gap: 10 },
  statCard: {
    flex: 1, minWidth: '40%', backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statNum: { fontSize: 24, fontWeight: '900', color: Colors.navy },
  statLabel: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
  section: { paddingHorizontal: 16, marginTop: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.navy, textAlign: 'right', marginBottom: 12 },
  featuresGrid: { gap: 10 },
  featureCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  featureIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  featureTitle: { fontSize: 14, fontWeight: '700', color: Colors.navy, textAlign: 'right', flex: 1 },
  featureBody: { fontSize: 12, color: Colors.textSub, textAlign: 'right', flex: 1, lineHeight: 18, marginTop: 2 },
  ratingCard: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 20, alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  ratingTitle: { fontSize: 16, fontWeight: '800', color: Colors.navy },
  ratingSubtitle: { fontSize: 12, color: Colors.textMuted, marginBottom: 6 },
  stars: { flexDirection: 'row-reverse', gap: 10 },
  ratingDone: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  ratingDoneText: { fontSize: 15, fontWeight: '700', color: '#10b981' },
  contactCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  contactText: { flex: 1, gap: 2 },
  contactTitle: { fontSize: 14, fontWeight: '700', color: Colors.navy, textAlign: 'right' },
  contactBody: { fontSize: 13, color: Colors.textSub, textAlign: 'right' },
  version: { textAlign: 'center', fontSize: 11, color: Colors.textMuted, marginTop: 16, paddingBottom: 8 },
});
