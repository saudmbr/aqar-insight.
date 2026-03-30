import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

const SECTIONS = [
  {
    icon: 'database', color: Colors.teal,
    title: 'البيانات التي نجمعها',
    subsections: [
      { label: 'البيانات التي تقدّمها', items: ['الاسم الكامل والبريد الإلكتروني', 'رقم الجوال ومعلومات الاتصال', 'محتوى الإعلانات والصور العقارية', 'تفضيلات البحث والتصفية'] },
      { label: 'البيانات التلقائية', items: ['عنوان IP وبيانات الجهاز', 'ملفات الارتباط (Cookies)', 'أنماط الاستخدام وسجل التصفح', 'الموقع الجغرافي التقريبي'] },
    ],
  },
  {
    icon: 'target', color: '#8b5cf6',
    title: 'كيف نستخدم بياناتك',
    items: [
      'تشغيل الخدمات وتوفير تجربة مخصصة',
      'تحليل أنماط السوق العقاري وإعداد التقارير',
      'التواصل معك بشأن حسابك أو الخدمات',
      'الكشف عن الاحتيال وحماية أمن المنصة',
      'الامتثال للمتطلبات القانونية',
    ],
  },
  {
    icon: 'share-2', color: Colors.gold,
    title: 'مشاركة البيانات',
    body: 'لا نبيع بياناتك الشخصية لأي طرف ثالث. قد نشارك بياناتك فقط مع: مزودي الخدمات التقنية المرتبطين بتشغيل المنصة، أو السلطات الحكومية عند وجود التزام قانوني يستوجب ذلك.',
  },
  {
    icon: 'lock', color: '#10b981',
    title: 'أمان البيانات',
    items: [
      'تشفير TLS 1.3 لجميع الاتصالات',
      'جدران حماية متعددة الطبقات',
      'اختبارات اختراق دورية',
      'صلاحيات وصول محدودة للموظفين',
    ],
  },
  {
    icon: 'user', color: Colors.navy,
    title: 'حقوقك',
    items: [
      'حق الوصول إلى بياناتك الشخصية',
      'حق التصحيح للبيانات غير الدقيقة',
      'حق الحذف النهائي للحساب والبيانات',
      'حق نقل البيانات بصيغة منظّمة',
      'حق الاعتراض على معالجة البيانات',
    ],
  },
  {
    icon: 'clock', color: '#ef4444',
    title: 'مدة الاحتفاظ بالبيانات',
    body: 'نحتفظ ببياناتك طالما حسابك نشط. عند إلغاء الحساب، يتم حذف البيانات الشخصية خلال 30 يوماً، مع الاحتفاظ ببعض السجلات المحاسبية للمدة التي يقتضيها النظام.',
  },
];

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.screen, { paddingBottom: botPad }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-right" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>سياسة الخصوصية</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.introBanner}>
          <Feather name="shield" size={28} color={Colors.teal} />
          <Text style={styles.introTitle}>حماية خصوصيتك</Text>
          <Text style={styles.introDate}>متوافقة مع نظام حماية البيانات الشخصية السعودي (م/19)</Text>
          <Text style={styles.introBody}>
            نلتزم بحماية خصوصيتك والحفاظ على بياناتك الشخصية بأعلى معايير الأمان المتوافقة مع الأنظمة السعودية.
          </Text>
        </View>

        {SECTIONS.map((s, i) => (
          <View key={i} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: `${s.color}18` }]}>
                <Feather name={s.icon as any} size={18} color={s.color} />
              </View>
              <Text style={styles.sectionTitle}>{s.title}</Text>
            </View>
            {s.body && <Text style={styles.sectionBody}>{s.body}</Text>}
            {s.items && s.items.map((item, j) => (
              <View key={j} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
            {s.subsections && s.subsections.map((sub, j) => (
              <View key={j} style={styles.subsection}>
                <Text style={styles.subsectionLabel}>{sub.label}</Text>
                {sub.items.map((item, k) => (
                  <View key={k} style={styles.bulletRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ))}

        <View style={styles.contactCard}>
          <Feather name="mail" size={18} color={Colors.teal} />
          <Text style={styles.contactText}>للاستفسار عن خصوصيتك: privacy@aqar-insight.sa</Text>
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
    backgroundColor: Colors.navy, borderRadius: 20, padding: 20,
    alignItems: 'center', gap: 8,
  },
  introTitle: { fontSize: 20, fontWeight: '800', color: Colors.white },
  introDate: { fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  introBody: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 20, marginTop: 4 },
  sectionCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  sectionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.navy, flex: 1, textAlign: 'right' },
  sectionBody: { fontSize: 13, color: Colors.textSub, lineHeight: 22, textAlign: 'right' },
  bulletRow: { flexDirection: 'row-reverse', gap: 8, alignItems: 'flex-start' },
  bullet: { fontSize: 14, color: Colors.teal, marginTop: 2 },
  bulletText: { fontSize: 13, color: Colors.textSub, lineHeight: 20, flex: 1, textAlign: 'right' },
  subsection: { gap: 6, paddingTop: 4 },
  subsectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.navy, textAlign: 'right', marginBottom: 2 },
  contactCard: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(15,123,160,0.08)', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: 'rgba(15,123,160,0.2)',
  },
  contactText: { fontSize: 13, color: Colors.teal, fontWeight: '600', flex: 1, textAlign: 'right' },
  footer: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  footerText: { fontSize: 11, color: Colors.textMuted },
});
