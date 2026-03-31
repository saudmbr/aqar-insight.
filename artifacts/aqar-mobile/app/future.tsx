import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

const PROJECTS = [
  { id: 1, name: 'مشروع نيوم', region: 'تبوك', type: 'مدينة ذكية', status: 'قيد التطوير', year: '2030', desc: 'مشروع عملاق يضم مدينة ذكية متكاملة على ساحل البحر الأحمر في منطقة تبوك.' },
  { id: 2, name: 'مشروع القدية', region: 'الرياض', type: 'ترفيه وسياحة', status: 'قيد الإنشاء', year: '2026', desc: 'مدينة الترفيه والثقافة والرياضة في الرياض — وجهة عالمية على مساحة 334 كيلومتراً.' },
  { id: 3, name: 'مشروع البحر الأحمر', region: 'تبوك', type: 'سياحة فاخرة', status: 'جزئياً مفتوح', year: '2025', desc: 'وجهة سياحية فاخرة تضم أكثر من 90 جزيرة على ساحل البحر الأحمر بمعايير بيئية عالية.' },
  { id: 4, name: 'مشروع أمالا', region: 'تبوك', type: 'سياحة ثقافية', status: 'قيد التطوير', year: '2027', desc: 'وجهة سياحية ثقافية على جبال السروات — تجمع بين الطبيعة والفن والإرث السعودي.' },
  { id: 5, name: 'روشن الرياض', region: 'الرياض', type: 'سكن متكامل', status: 'قيد الإنشاء', year: '2026', desc: 'أحد أكبر مشاريع الإسكان في المملكة يستوعب 130,000 وحدة سكنية متكاملة.' },
  { id: 6, name: 'مشروع درعية', region: 'الرياض', type: 'تراث وسياحة', status: 'مرحلة أولى مفتوحة', year: '2025', desc: 'تطوير مدينة الدرعية التاريخية إلى وجهة ثقافية عالمية تحكي قصة الحضارة السعودية.' },
];

const STATUS_COLOR: Record<string, string> = {
  'قيد التطوير': Colors.gold,
  'قيد الإنشاء': Colors.teal,
  'جزئياً مفتوح': Colors.success,
  'مرحلة أولى مفتوحة': Colors.success,
};

export default function FutureScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.screen, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={Colors.white} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>المشاريع المستقبلية</Text>
          <Text style={styles.headerSub}>رؤية 2030 والمشاريع الكبرى</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad + 20, gap: 14, paddingHorizontal: 16, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroEmoji}>🚀</Text>
          <Text style={styles.heroTitle}>مشاريع رؤية 2030</Text>
          <Text style={styles.heroText}>
            تتصدر المملكة العربية السعودية مشهد التطوير العقاري العالمي بمشاريع عملاقة تعيد رسم خارطة العيش والسياحة والترفيه في المنطقة.
          </Text>
        </View>

        {/* Projects */}
        {PROJECTS.map(p => (
          <View key={p.id} style={styles.projectCard}>
            <View style={styles.projectHeader}>
              <View style={[styles.typeBadge, { backgroundColor: `${Colors.navy}10` }]}>
                <Text style={styles.typeText}>{p.type}</Text>
              </View>
              <Text style={styles.projectName}>{p.name}</Text>
            </View>

            <Text style={styles.projectDesc}>{p.desc}</Text>

            <View style={styles.projectFooter}>
              <View style={styles.projectMeta}>
                <View style={styles.metaItem}>
                  <Feather name="calendar" size={12} color={Colors.textMuted} />
                  <Text style={styles.metaText}>افتتاح {p.year}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Feather name="map-pin" size={12} color={Colors.textMuted} />
                  <Text style={styles.metaText}>{p.region}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLOR[p.status] ?? Colors.gold}15`, borderColor: STATUS_COLOR[p.status] ?? Colors.gold }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR[p.status] ?? Colors.gold }]}>{p.status}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Suggest CTA */}
        <View style={styles.suggestCard}>
          <Feather name="plus-circle" size={28} color={Colors.teal} />
          <Text style={styles.suggestTitle}>اقترح مشروعاً</Text>
          <Text style={styles.suggestText}>هل تعلم عن مشروع عقاري قادم لم يُذكر هنا؟ تواصل معنا لإضافته.</Text>
          <Pressable style={styles.suggestBtn} onPress={() => router.push('/contact')}>
            <Text style={styles.suggestBtnText}>تواصل معنا</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.navy, flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 16, paddingTop: 12, gap: 12,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  heroBanner: {
    backgroundColor: Colors.navy, borderRadius: 20, padding: 20, alignItems: 'center', gap: 10,
    shadowColor: Colors.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  heroEmoji: { fontSize: 36 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: Colors.white },
  heroText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 20 },
  projectCard: {
    backgroundColor: Colors.card, borderRadius: 18, padding: 16, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  projectHeader: { gap: 6 },
  typeBadge: { alignSelf: 'flex-end', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  typeText: { fontSize: 11, fontWeight: '600', color: Colors.navy },
  projectName: { fontSize: 18, fontWeight: '800', color: Colors.navy, textAlign: 'right' },
  projectDesc: { fontSize: 13, color: Colors.textSub, textAlign: 'right', lineHeight: 20 },
  projectFooter: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  projectMeta: { gap: 4 },
  metaItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: Colors.textMuted },
  statusBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '700' },
  suggestCard: {
    backgroundColor: Colors.card, borderRadius: 18, padding: 20, alignItems: 'center', gap: 10,
    borderWidth: 2, borderColor: Colors.teal, borderStyle: 'dashed',
  },
  suggestTitle: { fontSize: 16, fontWeight: '700', color: Colors.teal },
  suggestText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
  suggestBtn: { backgroundColor: Colors.teal, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 24 },
  suggestBtnText: { color: Colors.white, fontWeight: '700' },
});
