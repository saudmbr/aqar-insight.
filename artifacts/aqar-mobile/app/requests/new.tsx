import { Feather } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { apiFetch, endpoints, SAUDI_REGIONS } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

const REQUEST_TYPES = [
  { key: 'property', label: 'عقار', desc: 'أبحث عن شراء أو إيجار عقار', icon: 'home' },
  { key: 'service', label: 'خدمة', desc: 'أحتاج خدمة صيانة أو تصميم', icon: 'tool' },
  { key: 'marketer', label: 'مسوّق', desc: 'أبحث عن مسوّق عقاري', icon: 'user-check' },
];

export default function NewRequestScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const { user } = useAuth();

  const [form, setForm] = useState({
    title: '',
    description: '',
    requestType: 'property',
    region: '',
    city: '',
    budgetMin: '',
    budgetMax: '',
    contactPhone: '',
    contactWhatsapp: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      apiFetch<any>(endpoints.requests, {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
          budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
        }),
      }),
    onSuccess: () => {
      Alert.alert('تم بنجاح', 'تم إرسال طلبك بنجاح', [
        { text: 'موافق', onPress: () => router.back() },
      ]);
    },
    onError: (e: any) => {
      Alert.alert('خطأ', e.message ?? 'حدث خطأ، حاول مرة أخرى');
    },
  });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'العنوان مطلوب';
    if (!form.description.trim()) errs.description = 'الوصف مطلوب';
    if (!form.contactPhone.trim() && !form.contactWhatsapp.trim())
      errs.contact = 'معلومات التواصل مطلوبة';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!user) { router.push('/auth/login'); return; }
    if (!validate()) return;
    mutate();
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChangeText: (v: string) => setForm((f) => ({ ...f, [key]: v })),
  });

  return (
    <View style={[styles.screen, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>أضف طلبك</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Request Type */}
        <Text style={styles.label}>نوع الطلب *</Text>
        <View style={styles.typeRow}>
          {REQUEST_TYPES.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setForm((f) => ({ ...f, requestType: t.key }))}
              style={[styles.typeCard, form.requestType === t.key && styles.typeCardActive]}
            >
              <Feather name={t.icon as any} size={22} color={form.requestType === t.key ? Colors.white : Colors.textSub} />
              <Text style={[styles.typeCardLabel, form.requestType === t.key && styles.typeCardLabelActive]}>{t.label}</Text>
              <Text style={[styles.typeCardDesc, form.requestType === t.key && { color: 'rgba(255,255,255,0.7)' }]} numberOfLines={2}>{t.desc}</Text>
            </Pressable>
          ))}
        </View>

        {/* Title */}
        <Text style={styles.label}>عنوان الطلب *</Text>
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          placeholder="مثال: أبحث عن شقة في الرياض"
          placeholderTextColor={Colors.textMuted}
          textAlign="right"
          {...field('title')}
        />
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

        {/* Description */}
        <Text style={styles.label}>التفاصيل *</Text>
        <TextInput
          style={[styles.input, styles.textarea, errors.description && styles.inputError]}
          placeholder="اذكر تفاصيل طلبك..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={4}
          textAlign="right"
          textAlignVertical="top"
          {...field('description')}
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

        {/* Location */}
        <Text style={styles.label}>المدينة</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: الرياض"
          placeholderTextColor={Colors.textMuted}
          textAlign="right"
          {...field('city')}
        />

        {/* Budget */}
        <Text style={styles.label}>الميزانية (ريال)</Text>
        <View style={styles.budgetRow}>
          <View style={styles.budgetInput}>
            <Text style={styles.budgetLabel}>الحد الأقصى</Text>
            <TextInput
              style={styles.budgetField}
              placeholder="2,000,000"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              textAlign="right"
              {...field('budgetMax')}
            />
          </View>
          <View style={styles.budgetDash}>
            <Text style={styles.budgetDashText}>–</Text>
          </View>
          <View style={styles.budgetInput}>
            <Text style={styles.budgetLabel}>الحد الأدنى</Text>
            <TextInput
              style={styles.budgetField}
              placeholder="500,000"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              textAlign="right"
              {...field('budgetMin')}
            />
          </View>
        </View>

        {/* Contact */}
        <Text style={styles.label}>معلومات التواصل *</Text>
        {errors.contact && <Text style={styles.errorText}>{errors.contact}</Text>}
        <View style={styles.contactRow}>
          <View style={styles.contactInput}>
            <Feather name="phone" size={14} color={Colors.textMuted} style={styles.contactIcon} />
            <TextInput
              style={styles.contactField}
              placeholder="رقم الهاتف"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              textAlign="right"
              {...field('contactPhone')}
            />
          </View>
          <View style={styles.contactInput}>
            <Feather name="message-circle" size={14} color="#25D366" style={styles.contactIcon} />
            <TextInput
              style={styles.contactField}
              placeholder="واتساب"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              textAlign="right"
              {...field('contactWhatsapp')}
            />
          </View>
        </View>

        {/* Submit */}
        <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={isPending}>
          {isPending ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <>
              <Feather name="send" size={18} color={Colors.white} />
              <Text style={styles.submitBtnText}>إرسال الطلب</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.navy, paddingHorizontal: 16, paddingBottom: 16,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.text, textAlign: 'right', marginTop: 10, marginBottom: 6 },
  typeRow: { flexDirection: 'row-reverse', gap: 10, marginBottom: 6 },
  typeCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 12,
    alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: Colors.border,
  },
  typeCardActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  typeCardLabel: { fontSize: 13, fontWeight: '800', color: Colors.text },
  typeCardLabelActive: { color: Colors.white },
  typeCardDesc: { fontSize: 9, color: Colors.textMuted, textAlign: 'center', lineHeight: 13 },
  input: {
    backgroundColor: Colors.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border,
  },
  textarea: { height: 100, paddingTop: 12 },
  inputError: { borderColor: '#ef4444' },
  errorText: { fontSize: 11, color: '#ef4444', textAlign: 'right', marginTop: 2 },
  budgetRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  budgetInput: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  budgetLabel: { fontSize: 10, color: Colors.textMuted, textAlign: 'right', marginBottom: 2 },
  budgetField: { fontSize: 14, color: Colors.text, padding: 0 },
  budgetDash: { width: 20, alignItems: 'center' },
  budgetDashText: { fontSize: 18, color: Colors.textMuted },
  contactRow: { gap: 8 },
  contactInput: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.border, gap: 8,
  },
  contactIcon: {},
  contactField: { flex: 1, fontSize: 14, color: Colors.text, padding: 0 },
  submitBtn: {
    backgroundColor: Colors.teal, borderRadius: 16, paddingVertical: 16,
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 16,
  },
  submitBtnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
});
