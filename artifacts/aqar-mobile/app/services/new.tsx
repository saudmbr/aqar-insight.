import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
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
import { apiFetch, endpoints, parseStringList } from '@/constants/api';

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

const CITIES = ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الطائف', 'أبها', 'تبوك'];

export default function NewServiceScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

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
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!businessName.trim()) { Alert.alert('خطأ', 'اسم النشاط التجاري مطلوب'); return; }
    if (!category) { Alert.alert('خطأ', 'الفئة مطلوبة'); return; }
    if (!city) { Alert.alert('خطأ', 'المدينة مطلوبة'); return; }
    if (!contactPhone.trim()) { Alert.alert('خطأ', 'رقم الهاتف مطلوب'); return; }

    setSubmitting(true);
    try {
      await apiFetch(endpoints.services, {
        method: 'POST',
        body: JSON.stringify({
          businessName,
          category,
          city,
          region,
          district,
          coveredAreas: parseStringList(coveredAreas),
          description,
          startingPrice: startingPrice ? Number(startingPrice) : null,
          contactPhone,
          whatsapp,
          workingHours,
          websiteUrl,
        }),
      });
      Alert.alert('✅ تم بنجاح', 'تم تسجيل خدمتك بنجاح وستظهر قريباً في الدليل', [
        { text: 'حسناً', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('خطأ', e.message ?? 'فشل نشر الخدمة');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <View style={[styles.screen, { paddingTop: topPad }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}><Feather name="arrow-right" size={22} color={Colors.white} /></Pressable>
          <Text style={styles.headerTitle}>إضافة خدمة</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}>
          <Feather name="lock" size={48} color={Colors.textMuted} />
          <Text style={styles.centerText}>يجب تسجيل الدخول أولاً</Text>
          <Pressable style={styles.loginBtn} onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
          </Pressable>
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
        <Text style={styles.headerTitle}>تسجيل خدمة جديدة</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Business Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>معلومات النشاط</Text>

            <View style={styles.field}>
              <Text style={styles.label}>اسم النشاط التجاري *</Text>
              <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} placeholder="شركة / مكتب / فرد..." textAlign="right" />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>فئة الخدمة *</Text>
              <View style={styles.chipsWrap}>
                {CATEGORIES.map(c => (
                  <Pressable key={c.value} style={[styles.chip, category === c.value && styles.chipActive]} onPress={() => setCategory(c.value)}>
                    <Text style={[styles.chipText, category === c.value && styles.chipTextActive]}>{c.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>وصف الخدمة</Text>
              <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="صف خدماتك بالتفصيل..." textAlign="right" multiline numberOfLines={4} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>السعر الابتدائي (ريال)</Text>
              <TextInput style={styles.input} value={startingPrice} onChangeText={setStartingPrice} placeholder="500" keyboardType="numeric" textAlign="right" />
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الموقع</Text>

            <View style={styles.field}>
              <Text style={styles.label}>المدينة *</Text>
              <View style={styles.chipsWrap}>
                {CITIES.map(c => (
                  <Pressable key={c} style={[styles.chip, city === c && styles.chipActive]} onPress={() => setCity(c)}>
                    <Text style={[styles.chipText, city === c && styles.chipTextActive]}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>الحي</Text>
              <TextInput style={styles.input} value={district} onChangeText={setDistrict} placeholder="حي الياسمين..." textAlign="right" />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>المناطق المغطاة</Text>
              <TextInput style={styles.input} value={coveredAreas} onChangeText={setCoveredAreas} placeholder="الرياض، الخرج، الدمام... (افصل بفاصلة)" textAlign="right" />
            </View>
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>بيانات التواصل</Text>

            <View style={styles.field}>
              <Text style={styles.label}>رقم الهاتف *</Text>
              <TextInput style={styles.input} value={contactPhone} onChangeText={setContactPhone} placeholder="05xxxxxxxx" keyboardType="phone-pad" textAlign="right" />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>رقم الواتساب</Text>
              <TextInput style={styles.input} value={whatsapp} onChangeText={setWhatsapp} placeholder="05xxxxxxxx" keyboardType="phone-pad" textAlign="right" />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>أوقات العمل</Text>
              <TextInput style={styles.input} value={workingHours} onChangeText={setWorkingHours} placeholder="السبت - الخميس 8ص - 6م" textAlign="right" />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>الموقع الإلكتروني</Text>
              <TextInput style={styles.input} value={websiteUrl} onChangeText={setWebsiteUrl} placeholder="https://..." keyboardType="url" textAlign="right" autoCapitalize="none" />
            </View>
          </View>

          <Pressable style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
            <Feather name="send" size={18} color={Colors.white} />
            <Text style={styles.submitBtnText}>{submitting ? 'جارٍ النشر...' : 'نشر الخدمة'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.navy, flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, paddingTop: 12, gap: 12 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: Colors.white, textAlign: 'center' },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  centerText: { fontSize: 16, color: Colors.textMuted, textAlign: 'center' },
  loginBtn: { backgroundColor: Colors.teal, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  loginBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 14 },
  section: { backgroundColor: Colors.card, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, textAlign: 'right' },
  field: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, gap: 8 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSub, textAlign: 'right' },
  input: { backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 10 },
  chipsWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.textSub },
  chipTextActive: { color: Colors.white },
  submitBtn: { backgroundColor: Colors.teal, borderRadius: 16, paddingVertical: 16, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
});
