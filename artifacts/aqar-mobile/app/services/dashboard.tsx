import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, endpoints } from '@/constants/api';
import { SkeletonCard } from '@/components/SkeletonCard';

type Tab = 'profile' | 'portfolio';

const CATEGORIES = [
  { value: 'construction', label: 'إنشاء وبناء' },
  { value: 'interior_design', label: 'تصميم داخلي' },
  { value: 'maintenance', label: 'صيانة' },
  { value: 'property_management', label: 'إدارة عقارات' },
  { value: 'landscaping', label: 'تنسيق حدائق' },
  { value: 'electrical', label: 'كهرباء' },
  { value: 'plumbing', label: 'سباكة' },
  { value: 'painting', label: 'دهانات' },
  { value: 'cleaning', label: 'تنظيف' },
  { value: 'security', label: 'أمن وحماية' },
];

export default function ServiceDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [saving, setSaving] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [coveredAreas, setCoveredAreas] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ['my-service-profile'],
    queryFn: () => apiFetch<any>(`${endpoints.services}/my/profile`),
    enabled: !!user && user.role === 'service_provider',
    retry: false,
  });

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.businessName ?? '');
      setCategory(profile.category ?? '');
      setCity(profile.city ?? '');
      setRegion(profile.region ?? '');
      setDistrict(profile.district ?? '');
      setCoveredAreas(Array.isArray(profile.coveredAreas) ? profile.coveredAreas.join('، ') : (profile.coveredAreas ?? ''));
      setDescription(profile.description ?? '');
      setStartingPrice(profile.startingPrice ? String(profile.startingPrice) : '');
      setContactPhone(profile.contactPhone ?? '');
      setWhatsapp(profile.whatsapp ?? '');
      setWorkingHours(profile.workingHours ?? '');
      setWebsiteUrl(profile.websiteUrl ?? '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!businessName.trim() || !category) {
      Alert.alert('خطأ', 'اسم النشاط والفئة مطلوبان');
      return;
    }
    setSaving(true);
    try {
      const serviceId = profile?.id;
      const method = serviceId ? 'PUT' : 'POST';
      const url = serviceId ? endpoints.service(serviceId) : endpoints.services;
      await apiFetch(url, {
        method,
        body: JSON.stringify({
          businessName,
          category,
          city,
          region,
          district,
          coveredAreas: coveredAreas.split('،').map(s => s.trim()).filter(Boolean),
          description,
          startingPrice: startingPrice ? Number(startingPrice) : null,
          contactPhone,
          whatsapp,
          workingHours,
          websiteUrl,
        }),
      });
      qc.invalidateQueries({ queryKey: ['my-service-profile'] });
      Alert.alert('✅ تم الحفظ', 'تم تحديث ملف الخدمة بنجاح');
    } catch (e: any) {
      Alert.alert('خطأ', e.message ?? 'فشل حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  const isActive = profile?.status === 'active';

  if (!user || user.role !== 'service_provider') {
    return (
      <View style={[styles.screen, { paddingTop: topPad }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}><Feather name="arrow-right" size={22} color={Colors.white} /></Pressable>
          <Text style={styles.headerTitle}>لوحة مزود الخدمة</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}>
          <Feather name="lock" size={48} color={Colors.textMuted} />
          <Text style={styles.centerText}>هذه الصفحة مخصصة لمزودي الخدمات فقط</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={Colors.white} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>لوحة مزود الخدمة</Text>
          <Text style={styles.headerSub}>{user.fullName ?? user.username}</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      {/* Status Warning */}
      {profile && !isActive && (
        <View style={styles.warningBanner}>
          <Feather name="alert-triangle" size={16} color={Colors.danger} />
          <Text style={styles.warningText}>هذا الحساب موقوف حالياً — تواصل مع الإدارة للتفعيل</Text>
        </View>
      )}

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {[{ key: 'profile', label: 'ملف الخدمة', icon: 'briefcase' }, { key: 'portfolio', label: 'معرض الأعمال', icon: 'image' }].map(t => (
          <Pressable key={t.key} style={[styles.tab, activeTab === t.key && styles.tabActive]} onPress={() => setActiveTab(t.key as Tab)}>
            <Feather name={t.icon as any} size={16} color={activeTab === t.key ? Colors.white : Colors.textMuted} />
            <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ paddingBottom: botPad + 20, gap: 14, paddingHorizontal: 16, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              [1,2,3].map(i => <SkeletonCard key={i} />)
            ) : (
              <>
                {/* Business Info */}
                <View style={styles.formCard}>
                  <Text style={styles.formCardTitle}>بيانات النشاط</Text>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>اسم النشاط التجاري *</Text>
                    <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} placeholder="شركة الخليج للصيانة..." textAlign="right" />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>الفئة *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
                        {CATEGORIES.map(c => (
                          <Pressable key={c.value} style={[styles.chip, category === c.value && styles.chipActive]} onPress={() => setCategory(c.value)}>
                            <Text style={[styles.chipText, category === c.value && styles.chipTextActive]}>{c.label}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>وصف الخدمة</Text>
                    <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="صف خدماتك بالتفصيل..." textAlign="right" multiline numberOfLines={4} />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>السعر الابتدائي (ريال)</Text>
                    <TextInput style={styles.input} value={startingPrice} onChangeText={setStartingPrice} placeholder="500" keyboardType="numeric" textAlign="right" />
                  </View>
                </View>

                {/* Location */}
                <View style={styles.formCard}>
                  <Text style={styles.formCardTitle}>الموقع</Text>
                  {[
                    { label: 'المدينة', value: city, set: setCity, placeholder: 'الرياض' },
                    { label: 'المنطقة', value: region, set: setRegion, placeholder: 'منطقة الرياض' },
                    { label: 'الحي', value: district, set: setDistrict, placeholder: 'حي الياسمين' },
                    { label: 'المناطق المغطاة (افصل بفاصلة)', value: coveredAreas, set: setCoveredAreas, placeholder: 'الرياض، الخرج...' },
                  ].map(f => (
                    <View key={f.label} style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>{f.label}</Text>
                      <TextInput style={styles.input} value={f.value} onChangeText={f.set} placeholder={f.placeholder} textAlign="right" />
                    </View>
                  ))}
                </View>

                {/* Contact */}
                <View style={styles.formCard}>
                  <Text style={styles.formCardTitle}>بيانات التواصل</Text>
                  {[
                    { label: 'رقم الهاتف', value: contactPhone, set: setContactPhone, placeholder: '05xxxxxxxx', kbType: 'phone-pad' as any },
                    { label: 'رقم الواتساب', value: whatsapp, set: setWhatsapp, placeholder: '05xxxxxxxx', kbType: 'phone-pad' as any },
                    { label: 'أوقات العمل', value: workingHours, set: setWorkingHours, placeholder: 'ش-خ 8ص-6م', kbType: 'default' as any },
                    { label: 'الموقع الإلكتروني', value: websiteUrl, set: setWebsiteUrl, placeholder: 'https://...', kbType: 'url' as any },
                  ].map(f => (
                    <View key={f.label} style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>{f.label}</Text>
                      <TextInput style={styles.input} value={f.value} onChangeText={f.set} placeholder={f.placeholder} textAlign="right" keyboardType={f.kbType} autoCapitalize="none" />
                    </View>
                  ))}
                </View>

                <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
                  <Feather name="save" size={18} color={Colors.white} />
                  <Text style={styles.saveBtnText}>{saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Portfolio Tab */}
      {activeTab === 'portfolio' && (
        <ScrollView contentContainerStyle={{ paddingBottom: botPad + 20, gap: 14, paddingHorizontal: 16, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
          <View style={styles.portfolioInfo}>
            <Feather name="image" size={40} color={Colors.textMuted} />
            <Text style={styles.portfolioTitle}>معرض الأعمال</Text>
            <Text style={styles.portfolioText}>أضف صور مشاريعك المنجزة لتعزيز مصداقيتك مع العملاء</Text>
            <Text style={styles.portfolioNote}>رفع الصور متاح من خلال موقع الويب حالياً</Text>
          </View>

          {profile?.portfolioImages && (
            <View style={styles.portfolioGrid}>
              {(Array.isArray(profile.portfolioImages) ? profile.portfolioImages : profile.portfolioImages.split('\n'))
                .filter(Boolean)
                .map((img: string, i: number) => (
                  <View key={i} style={styles.portfolioImgBox}>
                    <Feather name="image" size={24} color={Colors.textMuted} />
                    <Text style={styles.portfolioImgLabel} numberOfLines={1}>{img.split('/').pop()}</Text>
                  </View>
                ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.navy, flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, paddingTop: 12, gap: 12 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  warningBanner: { backgroundColor: `${Colors.danger}12`, borderBottomWidth: 1, borderBottomColor: `${Colors.danger}30`, padding: 12, flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  warningText: { flex: 1, fontSize: 12, color: Colors.danger, textAlign: 'right' },
  tabBar: { flexDirection: 'row-reverse', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, backgroundColor: Colors.background },
  tabActive: { backgroundColor: Colors.teal },
  tabLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabLabelActive: { color: Colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  centerText: { fontSize: 15, color: Colors.textMuted, textAlign: 'center' },
  formCard: { backgroundColor: Colors.card, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  formCardTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, textAlign: 'right' },
  inputGroup: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSub, textAlign: 'right' },
  input: { backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.textSub },
  chipTextActive: { color: Colors.white },
  saveBtn: { backgroundColor: Colors.teal, borderRadius: 16, paddingVertical: 16, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  portfolioInfo: { backgroundColor: Colors.card, borderRadius: 16, padding: 24, alignItems: 'center', gap: 10 },
  portfolioTitle: { fontSize: 16, fontWeight: '700', color: Colors.navy },
  portfolioText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
  portfolioNote: { fontSize: 12, color: Colors.teal, fontWeight: '600', textAlign: 'center' },
  portfolioGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  portfolioImgBox: { width: '47%', backgroundColor: Colors.card, borderRadius: 12, padding: 16, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.border },
  portfolioImgLabel: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
});
