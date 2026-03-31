import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

const MODULES = [
  {
    id: 1,
    title: 'تنبيهات ذكية',
    desc: 'إشعارات فورية عند تغير أسعار العقار في أحيائك المفضلة أو عند توفر فرص ممتازة.',
    icon: 'bell',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.12)',
    tag: 'قريباً',
    tagColor: '#3b82f6',
  },
  {
    id: 2,
    title: 'تقدير القيمة العادلة',
    desc: 'نموذج ذكاء اصطناعي لتقييم السعر العادل للعقار بناءً على متغيرات السوق وبيانات المنصة.',
    icon: 'trending-up',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.12)',
    tag: 'تطوير',
    tagColor: '#8b5cf6',
  },
  {
    id: 3,
    title: 'المساعد الذكي العقاري',
    desc: 'تحدث مع مساعد AI لطرح أسئلة عن السوق واستخراج تقارير تحليلية باللغة الطبيعية.',
    icon: 'message-circle',
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.12)',
    tag: 'تطوير',
    tagColor: '#ec4899',
  },
  {
    id: 4,
    title: 'الخريطة الحرارية',
    desc: 'توزيع بصري لأسعار العقارات والعوائد الإيجارية على الخريطة التفاعلية لاكتشاف الفرص.',
    icon: 'map',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    tag: 'قريباً',
    tagColor: '#10b981',
  },
  {
    id: 5,
    title: 'نقاط الاستثمار',
    desc: 'تصنيف تلقائي للمناطق والعقارات لتحديد أفضل العوائد الاستثمارية ومخاطرها.',
    icon: 'star',
    color: Colors.gold,
    bg: 'rgba(201,168,76,0.12)',
    tag: 'مخطط',
    tagColor: Colors.gold,
  },
];

const ROADMAP = [
  { q: 'Q2 2025', label: 'إطلاق المنصة الأساسية', done: true },
  { q: 'Q3 2025', label: 'التحليلات والخريطة التفاعلية', done: true },
  { q: 'Q4 2025', label: 'التنبيهات الذكية والتقييم', done: false },
  { q: 'Q1 2026', label: 'المساعد الذكي العقاري', done: false },
  { q: 'Q2 2026', label: 'الخريطة الحرارية ونقاط الاستثمار', done: false },
];

export default function FuturePage() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 70 : insets.top;

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={[Colors.navyDark, '#0F1C40', Colors.teal + '44']} style={[s.hero, { paddingTop: topPad + 10 }]}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-right" size={20} color={Colors.white} />
        </Pressable>
        <View style={s.heroBadge}>
          <Feather name="zap" size={13} color={Colors.gold} />
          <Text style={s.heroBadgeText}>خارطة الطريق</Text>
        </View>
        <Text style={s.heroTitle}>المشاريع المستقبلية</Text>
        <Text style={s.heroSub}>
          نعمل على تطوير أدوات ذكية إضافية تجعل قرارات العقار أسرع وأوضح وأكثر ثقة
        </Text>
        <View style={s.tagRow}>
          {['ربط البائعين بالمشترين', 'توثيق المسوّقين', 'تحليلات السوق'].map(t => (
            <View key={t} style={s.tag}>
              <Feather name="check-circle" size={11} color={Colors.teal} />
              <Text style={s.tagText}>{t}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Roadmap timeline */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>خارطة الطريق التنفيذية</Text>
        {ROADMAP.map((item, idx) => (
          <View key={idx} style={s.roadmapItem}>
            <View style={[s.roadmapDot, { backgroundColor: item.done ? '#10b981' : 'rgba(255,255,255,0.15)' }]}>
              {item.done && <Feather name="check" size={10} color="#fff" />}
            </View>
            {idx < ROADMAP.length - 1 && <View style={s.roadmapLine} />}
            <View style={s.roadmapContent}>
              <Text style={[s.roadmapQ, { color: item.done ? '#10b981' : Colors.gold }]}>{item.q}</Text>
              <Text style={[s.roadmapLabel, { color: item.done ? Colors.text : Colors.textSub }]}>{item.label}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Modules */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>الميزات القادمة</Text>
        {MODULES.map(mod => (
          <View key={mod.id} style={s.modCard}>
            <View style={s.modLeft}>
              <View style={[s.modIcon, { backgroundColor: mod.bg }]}>
                <Feather name={mod.icon as any} size={22} color={mod.color} />
              </View>
              <View style={[s.lockBadge, { backgroundColor: `${mod.tagColor}22`, borderColor: `${mod.tagColor}44` }]}>
                <Feather name="lock" size={10} color={mod.tagColor} />
              </View>
            </View>
            <View style={s.modContent}>
              <View style={s.modTitleRow}>
                <View style={[s.modTag, { backgroundColor: `${mod.tagColor}1A` }]}>
                  <Text style={[s.modTagText, { color: mod.tagColor }]}>{mod.tag}</Text>
                </View>
                <Text style={s.modTitle}>{mod.title}</Text>
              </View>
              <Text style={s.modDesc}>{mod.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Interest CTA */}
      <View style={s.ctaWrap}>
        <LinearGradient colors={[Colors.teal, '#0a5a78']} style={s.cta}>
          <Feather name="bell" size={24} color="#fff" />
          <Text style={s.ctaTitle}>أبلغني عند الإطلاق</Text>
          <Text style={s.ctaSub}>اشترك في قائمة الانتظار واحصل على وصول مبكر</Text>
          <Pressable style={s.ctaBtn} onPress={() => router.push('/contact')}>
            <Text style={s.ctaBtnText}>أبلغني الآن</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  heroBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, alignSelf: 'flex-end', backgroundColor: 'rgba(201,168,76,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12 },
  heroBadgeText: { color: Colors.gold, fontSize: 12, fontWeight: '600' },
  heroTitle: { color: Colors.white, fontSize: 28, fontWeight: 'bold', textAlign: 'right', marginBottom: 10 },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 22, textAlign: 'right', marginBottom: 16 },
  tagRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, backgroundColor: 'rgba(15,123,160,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },

  section: { paddingHorizontal: 16, paddingTop: 24 },
  sectionTitle: { color: Colors.navy, fontSize: 17, fontWeight: 'bold', textAlign: 'right', marginBottom: 16 },

  roadmapItem: { flexDirection: 'row-reverse', alignItems: 'flex-start', marginBottom: 4 },
  roadmapDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginLeft: 12, zIndex: 1, borderWidth: 2, borderColor: 'rgba(15,123,160,0.3)' },
  roadmapLine: { position: 'absolute', right: 10, top: 22, width: 2, height: 36, backgroundColor: 'rgba(15,123,160,0.15)' },
  roadmapContent: { flex: 1, paddingBottom: 20 },
  roadmapQ: { fontSize: 12, fontWeight: 'bold', textAlign: 'right', marginBottom: 2 },
  roadmapLabel: { fontSize: 14, textAlign: 'right' },

  modCard: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  modLeft: { alignItems: 'center', gap: 6, marginLeft: 14 },
  modIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  lockBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  modContent: { flex: 1 },
  modTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 6 },
  modTitle: { fontSize: 15, fontWeight: 'bold', color: Colors.text, textAlign: 'right' },
  modTag: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  modTagText: { fontSize: 11, fontWeight: '600' },
  modDesc: { fontSize: 13, color: Colors.textMuted, textAlign: 'right', lineHeight: 20 },

  ctaWrap: { margin: 16, marginTop: 24 },
  cta: { borderRadius: 18, padding: 24, alignItems: 'center', gap: 8 },
  ctaTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  ctaSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  ctaBtn: { marginTop: 8, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 },
  ctaBtnText: { color: Colors.teal, fontSize: 14, fontWeight: 'bold' },
});
