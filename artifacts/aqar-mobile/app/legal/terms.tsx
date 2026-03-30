import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

const SECTIONS = [
  {
    icon: 'check-circle', color: Colors.teal,
    title: 'قبول الشروط',
    body: 'باستخدامك لمنصة عقار إنسايت فإنك تقرّ بقراءة هذه الشروط وفهمها والموافقة على الالتزام بها. إذا كنت لا توافق على أي من هذه الشروط، يرجى التوقف عن استخدام المنصة.',
  },
  {
    icon: 'info', color: '#8b5cf6',
    title: 'تعريف المنصة',
    body: 'عقار إنسايت منصة متخصصة في تحليل بيانات السوق العقاري السعودي ونشر الإعلانات العقارية. المنصة ليست طرفاً في أي صفقة عقارية وليست مسؤولة عن أي تعاملات تجارية بين المستخدمين.',
  },
  {
    icon: 'user-check', color: '#10b981',
    title: 'إنشاء الحساب',
    body: 'يشترط لإنشاء حساب: أن يكون عمرك 18 عاماً أو أكثر، وتقديم بيانات صحيحة ودقيقة، والحفاظ على سرية معلومات حسابك وكلمة المرور.',
  },
  {
    icon: 'file-text', color: Colors.gold,
    title: 'الإعلانات والمحتوى',
    body: 'المستخدم مسؤول بالكامل عن دقة محتوى إعلاناته العقارية. يُمنع نشر معلومات مضللة أو مزورة. تحتفظ المنصة بحق مراجعة أو حذف أو تعديل أي محتوى مخالف دون إشعار مسبق.',
  },
  {
    icon: 'slash', color: Colors.danger,
    title: 'الأفعال المحظورة',
    body: 'يحظر استخدام المنصة لأغراض احتيالية أو مضللة. ويحظر جمع البيانات آلياً (Scraping) أو استخدام أدوات آلية للتفاعل مع المنصة. ويحظر كذلك إرسال بريد عشوائي أو التسويق غير المرغوب فيه.',
  },
  {
    icon: 'credit-card', color: '#06b6d4',
    title: 'الخدمات المدفوعة',
    body: 'بعض خدمات المنصة تتطلب رسوماً محددة. الأسعار المعلنة شاملة لضريبة القيمة المضافة. لا يُعاد المال في حالة إلغاء الاشتراك خلال مدة الخدمة إلا في حالات استثنائية.',
  },
  {
    icon: 'shield-off', color: Colors.textSub,
    title: 'حدود المسؤولية',
    body: 'لا تتحمل المنصة المسؤولية عن أي خسائر مالية أو نزاعات تنشأ بين المستخدمين أو نتيجة لقرارات استثمارية بناءً على المعلومات المعروضة. البيانات معروضة للاستشارة فقط.',
  },
  {
    icon: 'lock', color: Colors.navy,
    title: 'الملكية الفكرية',
    body: 'جميع المحتويات على المنصة من شعارات وتصاميم وبيانات وكود برمجي هي ملكية حصرية لعقار إنسايت. لا يجوز نسخ أو توزيع أي محتوى دون إذن كتابي مسبق.',
  },
  {
    icon: 'flag', color: '#f59e0b',
    title: 'القانون المطبّق',
    body: 'تخضع هذه الشروط لأحكام نظام التجارة الإلكترونية السعودي ولوائحه التنفيذية. يختص القضاء السعودي بالفصل في أي نزاع ينشأ عن استخدام المنصة.',
  },
];

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.screen, { paddingBottom: botPad }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-right" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>الشروط والأحكام</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.introBanner}>
          <Feather name="file-text" size={28} color={Colors.teal} />
          <Text style={styles.introTitle}>شروط الاستخدام</Text>
          <Text style={styles.introDate}>آخر تحديث: يناير 2025</Text>
          <Text style={styles.introBody}>
            يُرجى قراءة هذه الشروط بعناية قبل استخدام منصة عقار إنسايت. استخدامك للمنصة يعني موافقتك الكاملة على جميع البنود الواردة أدناه.
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
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Feather name="shield" size={16} color={Colors.textMuted} />
          <Text style={styles.footerText}>عقار إنسايت — جميع الحقوق محفوظة © 2025</Text>
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
  introDate: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  introBody: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 20, marginTop: 4 },
  sectionCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  sectionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.navy, flex: 1, textAlign: 'right' },
  sectionBody: { fontSize: 13, color: Colors.textSub, lineHeight: 22, textAlign: 'right' },
  footer: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  footerText: { fontSize: 11, color: Colors.textMuted },
});
