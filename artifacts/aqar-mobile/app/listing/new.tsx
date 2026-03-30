import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { apiFetch, endpoints, SAUDI_REGIONS, PROPERTY_TYPES } from '@/constants/api';

const LISTING_TYPES = [
  { value: 'sale', label: 'للبيع' },
  { value: 'rent', label: 'للإيجار' },
  { value: 'installment', label: 'تقسيط' },
  { value: 'investment', label: 'استثمار' },
];

const LISTING_PURPOSES = [
  { value: 'residential', label: 'سكني' },
  { value: 'commercial', label: 'تجاري' },
  { value: 'industrial', label: 'صناعي' },
  { value: 'agricultural', label: 'زراعي' },
  { value: 'investment', label: 'استثماري' },
];

const FURNISHING = [
  { value: 'furnished', label: 'مؤثّث' },
  { value: 'unfurnished', label: 'غير مؤثّث' },
  { value: 'semi', label: 'نصف مؤثّث' },
];

const AMENITIES = [
  { key: 'parking', label: 'موقف سيارات' },
  { key: 'elevator', label: 'مصعد' },
  { key: 'garden', label: 'حديقة' },
  { key: 'pool', label: 'مسبح' },
  { key: 'maidRoom', label: 'غرفة عاملة' },
  { key: 'driverRoom', label: 'غرفة سائق' },
  { key: 'ac', label: 'تكييف مركزي' },
  { key: 'smartHome', label: 'منزل ذكي' },
  { key: 'securitySystem', label: 'نظام أمني' },
  { key: 'balcony', label: 'شرفة' },
  { key: 'basement', label: 'قبو' },
  { key: 'mortgageEligibility', label: 'مؤهّل للتمويل' },
];

const NEARBY = [
  { key: 'nearbyMosque', label: 'مسجد' },
  { key: 'nearbySchool', label: 'مدرسة' },
  { key: 'nearbyHospital', label: 'مستشفى' },
  { key: 'nearbyMall', label: 'مركز تسوق' },
  { key: 'nearbyPark', label: 'حديقة عامة' },
  { key: 'nearbyTransport', label: 'مواصلات' },
];

interface FormState {
  title: string;
  description: string;
  propertyType: string;
  listingType: string;
  listingPurpose: string;
  region: string;
  city: string;
  district: string;
  price: string;
  areaSqm: string;
  bedrooms: string;
  bathrooms: string;
  livingRooms: string;
  floors: string;
  propertyAge: string;
  furnishingStatus: string;
  negotiable: boolean;
  amenities: Record<string, boolean>;
  nearby: Record<string, boolean>;
}

const INITIAL_STATE: FormState = {
  title: '', description: '', propertyType: '', listingType: 'sale',
  listingPurpose: 'residential', region: '', city: '', district: '',
  price: '', areaSqm: '', bedrooms: '', bathrooms: '',
  livingRooms: '', floors: '', propertyAge: '', furnishingStatus: 'unfurnished',
  negotiable: false,
  amenities: Object.fromEntries(AMENITIES.map((a) => [a.key, false])),
  nearby: Object.fromEntries(NEARBY.map((n) => [n.key, false])),
};

function SectionHeader({ title, icon, color = Colors.teal }: { title: string; icon: string; color?: string }) {
  return (
    <View style={sStyles.secHeader}>
      <View style={[sStyles.secIcon, { backgroundColor: `${color}18` }]}>
        <Feather name={icon as any} size={16} color={color} />
      </View>
      <Text style={sStyles.secTitle}>{title}</Text>
    </View>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <View style={sStyles.field}>
      <Text style={sStyles.fieldLabel}>
        {label}{required && <Text style={{ color: Colors.danger }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

function TextF({ value, onChangeText, placeholder, numeric = false, multiline = false }: any) {
  return (
    <TextInput
      style={[sStyles.input, multiline && sStyles.inputMulti]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textMuted}
      keyboardType={numeric ? 'numeric' : 'default'}
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      textAlign="right"
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  );
}

function ChipSelect({ options, value, onSelect }: { options: { value: string; label: string }[]; value: string; onSelect: (v: string) => void }) {
  return (
    <View style={sStyles.chips}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          style={[sStyles.chip, value === opt.value && sStyles.chipActive]}
          onPress={() => onSelect(opt.value)}
        >
          <Text style={[sStyles.chipText, value === opt.value && sStyles.chipTextActive]}>{opt.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function NewListingScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = (key: keyof FormState, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const toggleAmenity = (key: string) => {
    setForm((prev) => ({ ...prev, amenities: { ...prev.amenities, [key]: !prev.amenities[key] } }));
  };

  const toggleNearby = (key: string) => {
    setForm((prev) => ({ ...prev, nearby: { ...prev.nearby, [key]: !prev.nearby[key] } }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'العنوان مطلوب';
    if (!form.propertyType) errs.propertyType = 'نوع العقار مطلوب';
    if (!form.listingType) errs.listingType = 'نوع الإعلان مطلوب';
    if (!form.region) errs.region = 'المنطقة مطلوبة';
    if (!form.city.trim()) errs.city = 'المدينة مطلوبة';
    if (!form.price || isNaN(Number(form.price))) errs.price = 'السعر مطلوب';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        propertyType: form.propertyType,
        listingType: form.listingType,
        listingPurpose: form.listingPurpose,
        region: form.region,
        city: form.city.trim(),
        district: form.district.trim(),
        price: Number(form.price),
        areaSqm: form.areaSqm ? Number(form.areaSqm) : undefined,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        livingRooms: form.livingRooms ? Number(form.livingRooms) : undefined,
        floors: form.floors ? Number(form.floors) : undefined,
        propertyAge: form.propertyAge ? Number(form.propertyAge) : undefined,
        furnishingStatus: form.furnishingStatus,
        negotiable: form.negotiable,
        ...form.amenities,
        ...form.nearby,
      };
      await apiFetch(endpoints.listings, { method: 'POST', body: JSON.stringify(body) });
      Alert.alert('تم النشر!', 'تم نشر عقارك بنجاح وسيظهر في القائمة قريباً', [
        { text: 'عقاراتي', onPress: () => router.replace('/my-listings') },
        { text: 'العقارات', onPress: () => router.replace('/(tabs)/listings') },
      ]);
    } catch (e: any) {
      Alert.alert('خطأ', e.message?.includes('401') ? 'يجب تسجيل الدخول لنشر عقار' : 'حدث خطأ أثناء النشر، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="x" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>نشر عقار جديد</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Core Info */}
        <View style={styles.card}>
          <SectionHeader title="المعلومات الأساسية" icon="home" />

          <Field label="عنوان الإعلان" required>
            <TextF value={form.title} onChangeText={(v: string) => setField('title', v)} placeholder="مثال: فيلا فاخرة في حي الياسمين" />
            {errors.title && <Text style={styles.err}>{errors.title}</Text>}
          </Field>

          <Field label="نوع العقار" required>
            <ChipSelect
              options={PROPERTY_TYPES.map((t) => ({ value: t, label: t }))}
              value={form.propertyType}
              onSelect={(v) => setField('propertyType', v)}
            />
            {errors.propertyType && <Text style={styles.err}>{errors.propertyType}</Text>}
          </Field>

          <Field label="نوع الإعلان" required>
            <ChipSelect options={LISTING_TYPES} value={form.listingType} onSelect={(v) => setField('listingType', v)} />
          </Field>

          <Field label="الغرض من الإعلان">
            <ChipSelect options={LISTING_PURPOSES} value={form.listingPurpose} onSelect={(v) => setField('listingPurpose', v)} />
          </Field>

          <Field label="وصف العقار">
            <TextF value={form.description} onChangeText={(v: string) => setField('description', v)} placeholder="اكتب وصفاً تفصيلياً للعقار..." multiline />
          </Field>
        </View>

        {/* Location & Price */}
        <View style={styles.card}>
          <SectionHeader title="الموقع والسعر" icon="map-pin" color="#8b5cf6" />

          <Field label="المنطقة" required>
            <ChipSelect
              options={SAUDI_REGIONS.map((r) => ({ value: r, label: r }))}
              value={form.region}
              onSelect={(v) => setField('region', v)}
            />
            {errors.region && <Text style={styles.err}>{errors.region}</Text>}
          </Field>

          <View style={styles.row2}>
            <Field label="المدينة *">
              <TextF value={form.city} onChangeText={(v: string) => setField('city', v)} placeholder="الرياض" />
              {errors.city && <Text style={styles.err}>{errors.city}</Text>}
            </Field>
            <Field label="الحي">
              <TextF value={form.district} onChangeText={(v: string) => setField('district', v)} placeholder="الياسمين" />
            </Field>
          </View>

          <Field label="السعر (ريال سعودي)" required>
            <TextF value={form.price} onChangeText={(v: string) => setField('price', v)} placeholder="1500000" numeric />
            {errors.price && <Text style={styles.err}>{errors.price}</Text>}
          </Field>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>قابل للتفاوض</Text>
            <Switch
              value={form.negotiable}
              onValueChange={(v) => setField('negotiable', v)}
              trackColor={{ false: Colors.border, true: Colors.teal }}
              thumbColor={Colors.white}
            />
          </View>

          <Field label="المساحة (م²)">
            <TextF value={form.areaSqm} onChangeText={(v: string) => setField('areaSqm', v)} placeholder="300" numeric />
          </Field>
        </View>

        {/* Specifications */}
        <View style={styles.card}>
          <SectionHeader title="المواصفات" icon="list" color={Colors.gold} />

          <View style={styles.row4}>
            {[
              { label: 'غرف النوم', key: 'bedrooms' },
              { label: 'دورات المياه', key: 'bathrooms' },
              { label: 'غرف المعيشة', key: 'livingRooms' },
              { label: 'عدد الأدوار', key: 'floors' },
            ].map((f) => (
              <Field key={f.key} label={f.label}>
                <TextInput
                  style={sStyles.smallInput}
                  value={(form as any)[f.key]}
                  onChangeText={(v) => setField(f.key as keyof FormState, v)}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  textAlign="center"
                />
              </Field>
            ))}
          </View>

          <View style={styles.row2}>
            <Field label="عمر العقار (سنة)">
              <TextF value={form.propertyAge} onChangeText={(v: string) => setField('propertyAge', v)} placeholder="0" numeric />
            </Field>
            <Field label="التأثيث">
              <ChipSelect options={FURNISHING} value={form.furnishingStatus} onSelect={(v) => setField('furnishingStatus', v)} />
            </Field>
          </View>
        </View>

        {/* Amenities */}
        <View style={styles.card}>
          <SectionHeader title="المميزات والخدمات" icon="star" color="#10b981" />
          <View style={styles.checkGrid}>
            {AMENITIES.map((a) => (
              <Pressable key={a.key} style={[styles.checkItem, form.amenities[a.key] && styles.checkItemActive]} onPress={() => toggleAmenity(a.key)}>
                <Feather name={form.amenities[a.key] ? 'check-square' : 'square'} size={16} color={form.amenities[a.key] ? Colors.teal : Colors.textMuted} />
                <Text style={[styles.checkText, form.amenities[a.key] && styles.checkTextActive]}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Nearby */}
        <View style={styles.card}>
          <SectionHeader title="قريب من" icon="navigation" color="#f59e0b" />
          <View style={styles.checkGrid}>
            {NEARBY.map((n) => (
              <Pressable key={n.key} style={[styles.checkItem, form.nearby[n.key] && styles.checkItemActive]} onPress={() => toggleNearby(n.key)}>
                <Feather name={form.nearby[n.key] ? 'check-square' : 'square'} size={16} color={form.nearby[n.key] ? Colors.teal : Colors.textMuted} />
                <Text style={[styles.checkText, form.nearby[n.key] && styles.checkTextActive]}>{n.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Submit */}
        <Pressable
          style={[styles.submitBtn, loading && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Feather name="send" size={18} color={Colors.white} />
              <Text style={styles.submitText}>نشر الإعلان</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.disclaimer}>
          بالنشر، تؤكد أن جميع المعلومات صحيحة ودقيقة وتوافق على شروط الاستخدام.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.navy, paddingHorizontal: 20, paddingBottom: 18,
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  card: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 16, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  row2: { flexDirection: 'row-reverse', gap: 10 },
  row4: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  err: { fontSize: 12, color: Colors.danger, textAlign: 'right', marginTop: 2 },
  switchRow: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 4,
  },
  switchLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  checkGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  checkItem: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    backgroundColor: Colors.background, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  checkItemActive: { borderColor: Colors.teal, backgroundColor: 'rgba(15,123,160,0.06)' },
  checkText: { fontSize: 12, color: Colors.textSub },
  checkTextActive: { color: Colors.teal, fontWeight: '600' },
  submitBtn: {
    backgroundColor: Colors.teal, borderRadius: 18, paddingVertical: 18,
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: Colors.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: Colors.white, fontWeight: '800', fontSize: 17 },
  disclaimer: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
});

const sStyles = StyleSheet.create({
  secHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 4 },
  secIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  secTitle: { fontSize: 15, fontWeight: '800', color: Colors.navy },
  field: { gap: 6, flex: 1 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSub, textAlign: 'right' },
  input: {
    backgroundColor: Colors.background, borderRadius: 12,
    paddingHorizontal: 14, height: 48,
    borderWidth: 1.5, borderColor: Colors.border,
    fontSize: 14, color: Colors.text,
  },
  inputMulti: { height: 100, paddingTop: 12 },
  smallInput: {
    backgroundColor: Colors.background, borderRadius: 12,
    paddingHorizontal: 8, height: 44,
    borderWidth: 1.5, borderColor: Colors.border,
    fontSize: 15, color: Colors.text, fontWeight: '700',
    width: '100%',
  },
  chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSub },
  chipTextActive: { color: Colors.white },
});
