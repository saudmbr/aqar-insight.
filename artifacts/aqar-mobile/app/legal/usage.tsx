import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

const ACCEPTABLE = [
  'البحث عن العقارات والتحقق من الأسعار',
  'نشر إعلانات عقارية صادقة وحقيقية',
  'التواصل المهني مع المسوّقين ومزودي الخدمات',
  'تقديم طلبات شراء أو إيجار عقارية حقيقية',
  'مراجعة التحليلات واتخاذ القرارات الاستثمارية',
];

const PROHIBITED_CATEGORIES = [
  {
    icon: 'alert-triangle', color: Colors.danger,
    title: 'المحتوى الكاذب والمضلل',
    items: ['أسعار غير حقيقية أو مبالغ فيها', 'صور لعقارات غير موجودة أو لا تمثل الواقع', 'بيانات مكان أو مساحة مزوّرة', 'ادعاء ملكية عقار دون حق قانوني'],
  },
  {
    icon: 'x-circle', color: '#f59e0b',
    title: 'المحتوى المسيء والمخالف',
    items: ['الإساءة للمستخدمين أو الموظفين', 'المحتوى المخالف للآداب العامة', 'العبارات العنصرية أو التمييزية', 'الإعلانات ذات الطابع السياسي'],
  },
  {
    icon: 'shield-off', color: '#8b5cf6',
    title: 'الأنشطة الاحتيالية',
    items: ['إنشاء حسابات وهمية متعددة', 'انتحال شخصية مسوّق آخر', 'إرسال رسائل تصيّد احتيالي', 'محاولة اختراق حسابات أخرى'],
  },
];

const ENFORCEMENT = [
  { level: '١', label: 'تحذير رسمي', color: Colors.gold, desc: 'إشعار تحذيري مع تصحيح المحتوى المخالف' },
  { level: '٢', label: 'إيقاف مؤقت', color: '#f59e0b', desc: 'تعليق الحساب من 7 إلى 30 يوماً حسب الخطورة' },
  { level: '٣', label: 'حذف المحتوى', color: '#ef4444', desc: 'إزالة المحتوى المخالف دون تعويض' },
  { level: '٤', label: 'حظر نهائي', color: Colors.danger, desc: 'إلغاء الحساب بشكل دائم وحظر العودة' },
];

export default function UsageScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.screen, { paddingBottom: botPad }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-right" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>سياسة الاستخدام</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.introBanner}>
          <Feather name="book-open" size={28} color={Colors.teal} />
          <Text style={styles.introTitle}>قواعد الاستخدام</Text>
          <Text style={styles.introDate}>آخر تحديث: يناير 2025</Text>
          <Text style={styles.introBody}>
            من أجل توفير بيئة آمنة وموثوقة لجميع المستخدمين، وضعنا هذه السياسة لتحديد السلوك المقبول وغير المقبول على المنصة.
          </Text>
        </View>

        {/* Acceptable use */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
              <Feather name="check-circle" size={18} color="#10b981" />
            </View>
            <Text style={styles.sectionTitle}>الاستخدام المقبول</Text>
          </View>
          {ACCEPTABLE.map((item, i) => (
            <View key={i} style={styles.acceptRow}>
              <Feather name="check" size={14} color="#10b981" />
              <Text style={styles.acceptText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Prohibited */}
        {PROHIBITED_CATEGORIES.map((cat, i) => (
          <View key={i} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: `${cat.color}18` }]}>
                <Feather name={cat.icon as any} size={18} color={cat.color} />
              </View>
              <Text style={styles.sectionTitle}>{cat.title}</Text>
            </View>
            {cat.items.map((item, j) => (
              <View key={j} style={styles.bulletRow}>
                <Text style={[styles.bullet, { color: cat.color }]}>✕</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Enforcement */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: 'rgba(11,22,40,0.1)' }]}>
              <Feather name="alert-octagon" size={18} color={Colors.navy} />
            </View>
            <Text style={styles.sectionTitle}>آلية التطبيق والعقوبات</Text>
          </View>
          {ENFORCEMENT.map((e) => (
            <View key={e.level} style={styles.enforcementRow}>
              <View style={[styles.levelBadge, { backgroundColor: `${e.color}20`, borderColor: `${e.color}50` }]}>
                <Text style={[styles.levelNum, { color: e.color }]}>م{e.level}</Text>
              </View>
              <View style={styles.enforcementText}>
                <Text style={styles.enforcementLabel}>{e.label}</Text>
                <Text style={styles.enforcementDesc}>{e.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.reportBox}>
          <Feather name="flag" size={16} color={Colors.teal} />
          <Text style={styles.reportText}>
            لإبلاغ عن محتوى مخالف: report@aqar-insight.sa
          </Text>
        </View>

        <View style={styles.footer}>
          <Feather name="shield" size={14} color={Colors.textMuted} />
          <Text style={styles.footerText}>عقار إنسايت — آخر تحديث يناير 2025</Text>
        </View>
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
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  introBanner: {
    backgroundColor: Colors.navy, borderRadius: 20, padding: 20, alignItems: 'center', gap: 8,
  },
  introTitle: { fontSize: 20, fontWeight: '800', color: Colors.white },
  introDate: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  introBody: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 20, marginTop: 4 },
  sectionCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  sectionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.navy, flex: 1, textAlign: 'right' },
  acceptRow: { flexDirection: 'row-reverse', gap: 10, alignItems: 'flex-start' },
  acceptText: { fontSize: 13, color: Colors.textSub, flex: 1, textAlign: 'right', lineHeight: 20 },
  bulletRow: { flexDirection: 'row-reverse', gap: 8, alignItems: 'flex-start' },
  bullet: { fontSize: 13, marginTop: 2 },
  bulletText: { fontSize: 13, color: Colors.textSub, lineHeight: 20, flex: 1, textAlign: 'right' },
  enforcementRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 12 },
  levelBadge: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  levelNum: { fontSize: 13, fontWeight: '900' },
  enforcementText: { flex: 1, gap: 2 },
  enforcementLabel: { fontSize: 14, fontWeight: '700', color: Colors.navy, textAlign: 'right' },
  enforcementDesc: { fontSize: 12, color: Colors.textSub, textAlign: 'right', lineHeight: 18 },
  reportBox: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(15,123,160,0.08)', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: 'rgba(15,123,160,0.2)',
  },
  reportText: { fontSize: 13, color: Colors.teal, fontWeight: '600', flex: 1, textAlign: 'right' },
  footer: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  footerText: { fontSize: 11, color: Colors.textMuted },
});
