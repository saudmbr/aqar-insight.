import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { apiFetch, endpoints, resolveMediaUrl } from '@/constants/api';
import { ensureMediaLibraryPermission, uploadImageAssets } from '@/constants/mediaUpload';

const LISTING_TYPES = [
  { value: 'sale', label: 'للبيع' },
  { value: 'rent', label: 'للإيجار' },
  { value: 'monthly_rent', label: 'إيجار شهري' },
  { value: 'investment', label: 'استثمار' },
];

const LISTING_PURPOSES = [
  { value: 'سكني', label: 'سكني' },
  { value: 'تجاري', label: 'تجاري' },
  { value: 'صناعي', label: 'صناعي' },
  { value: 'زراعي', label: 'زراعي' },
  { value: 'استثماري', label: 'استثماري' },
];

const FURNISHING = [
  { value: 'مفروش', label: 'مفروش' },
  { value: 'غير مفروش', label: 'غير مفروش' },
  { value: 'نصف مفروش', label: 'نصف مفروش' },
];

const PROPERTY_TYPE_ROWS = [
  { value: 'شقة', label: 'شقة', icon: '🏢' },
  { value: 'فيلا', label: 'فيلا', icon: '🏡' },
  { value: 'دوبلكس', label: 'دوبلكس', icon: '🏘️' },
  { value: 'أرض', label: 'أرض', icon: '🗺️' },
  { value: 'مكتب', label: 'مكتب', icon: '🏛️' },
  { value: 'محل تجاري', label: 'محل', icon: '🏬' },
  { value: 'مستودع', label: 'مستودع', icon: '🏭' },
  { value: 'عمارة سكنية', label: 'عمارة', icon: '🏗️' },
  { value: 'استوديو', label: 'استوديو', icon: '🛋️' },
  { value: 'مزرعة', label: 'مزرعة', icon: '🌾' },
];

const AMENITIES = [
  { key: 'parking', label: 'موقف سيارات', icon: 'truck' },
  { key: 'elevator', label: 'مصعد', icon: 'arrow-up' },
  { key: 'garden', label: 'حديقة', icon: 'feather' },
  { key: 'pool', label: 'مسبح', icon: 'droplet' },
  { key: 'maidRoom', label: 'غرفة عاملة', icon: 'home' },
  { key: 'driverRoom', label: 'غرفة سائق', icon: 'user' },
  { key: 'airConditioning', label: 'تكييف مركزي', icon: 'wind' },
  { key: 'smartHome', label: 'منزل ذكي', icon: 'cpu' },
  { key: 'securitySystem', label: 'نظام أمني', icon: 'shield' },
  { key: 'balcony', label: 'شرفة', icon: 'grid' },
  { key: 'storageRoom', label: 'مستودع', icon: 'archive' },
  { key: 'internet', label: 'إنترنت', icon: 'wifi' },
];

const NEARBY = [
  { key: 'nearbyMosques', label: 'مسجد', icon: 'map-pin' },
  { key: 'nearbySchools', label: 'مدرسة', icon: 'book' },
  { key: 'nearbyHospitals', label: 'مستشفى', icon: 'activity' },
  { key: 'nearbyMalls', label: 'مركز تسوق', icon: 'shopping-bag' },
  { key: 'nearbyParks', label: 'حديقة عامة', icon: 'sun' },
  { key: 'nearbyTransport', label: 'مواصلات', icon: 'navigation' },
];

const STEPS = [
  { num: 1, title: 'نوع العقار', icon: 'home' },
  { num: 2, title: 'الموقع', icon: 'map-pin' },
  { num: 3, title: 'التفاصيل', icon: 'info' },
  { num: 4, title: 'المزايا', icon: 'star' },
  { num: 5, title: 'الوصف', icon: 'edit-3' },
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
  floors: string;
  furnishingStatus: string;
  negotiable: boolean;
  amenities: Record<string, boolean>;
  nearby: Record<string, boolean>;
}

const INITIAL: FormState = {
  title: '', description: '', propertyType: '', listingType: 'sale',
  listingPurpose: 'سكني', region: '', city: '', district: '',
  price: '', areaSqm: '', bedrooms: '', bathrooms: '', floors: '',
  furnishingStatus: 'غير مفروش', negotiable: false,
  amenities: Object.fromEntries(AMENITIES.map(a => [a.key, false])),
  nearby: Object.fromEntries(NEARBY.map(n => [n.key, false])),
};

function DarkInput({ value, onChangeText, placeholder, numeric = false, multiline = false }: any) {
  return (
    <TextInput
      style={[s.input, multiline && s.inputMulti]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="rgba(255,255,255,0.25)"
      keyboardType={numeric ? 'numeric' : 'default'}
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      textAlign="right"
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  );
}

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text style={s.fieldLabel}>
      {text}
      {required && <Text style={{ color: '#ef4444' }}> *</Text>}
    </Text>
  );
}

function ChipRow({ options, value, onSelect, small }: {
  options: { value: string; label: string; icon?: string }[];
  value: string;
  onSelect: (v: string) => void;
  small?: boolean;
}) {
  return (
    <View style={s.chipsWrap}>
      {options.map(opt => (
        <Pressable
          key={opt.value}
          style={[s.chip, value === opt.value && s.chipActive, small && s.chipSm]}
          onPress={() => onSelect(opt.value)}
        >
          {opt.icon && <Text style={s.chipIcon}>{opt.icon}</Text>}
          <Text style={[s.chipText, value === opt.value && s.chipTextActive, small && s.chipTextSm]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function NumStepper({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const num = parseInt(value) || 0;
  return (
    <View style={s.stepperWrap}>
      <Text style={s.stepperLabel}>{label}</Text>
      <View style={s.stepper}>
        <Pressable
          style={s.stepperBtn}
          onPress={() => onChange(String(Math.max(0, num + 1)))}
        >
          <Feather name="plus" size={16} color={Colors.teal} />
        </Pressable>
        <Text style={s.stepperVal}>{num}</Text>
        <Pressable
          style={s.stepperBtn}
          onPress={() => onChange(String(Math.max(0, num - 1)))}
        >
          <Feather name="minus" size={16} color={Colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

function AmenityToggle({ label, icon, checked, onToggle }: { label: string; icon: string; checked: boolean; onToggle: () => void }) {
  return (
    <Pressable
      style={[s.amenity, checked && s.amenityActive]}
      onPress={onToggle}
    >
      <View style={[s.amenityIcon, checked && s.amenityIconActive]}>
        <Feather name={icon as any} size={14} color={checked ? Colors.white : Colors.textMuted} />
      </View>
      <Text style={[s.amenityText, checked && s.amenityTextActive]}>{label}</Text>
      {checked && (
        <View style={s.amenityCheck}>
          <Feather name="check" size={10} color={Colors.white} />
        </View>
      )}
    </Pressable>
  );
}

export default function NewListingScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [listingImages, setListingImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof FormState, value: any) => {
    setForm(p => ({ ...p, [key]: value }));
    setErrors(p => { const n = { ...p }; delete n[key]; return n; });
  };

  const toggleAmenity = (key: string) =>
    setForm(p => ({ ...p, amenities: { ...p.amenities, [key]: !p.amenities[key] } }));

  const toggleNearby = (key: string) =>
    setForm(p => ({ ...p, nearby: { ...p.nearby, [key]: !p.nearby[key] } }));

  const validateStep = (): boolean => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!form.propertyType) errs.propertyType = 'اختر نوع العقار';
      if (!form.listingType) errs.listingType = 'اختر نوع الإعلان';
    }
    if (step === 2) {
      if (!form.region) errs.region = 'اختر المنطقة';
      if (!form.city.trim()) errs.city = 'أدخل المدينة';
      if (!form.price || isNaN(Number(form.price))) errs.price = 'أدخل سعراً صحيحاً';
    }
    if (step === 5) {
      if (!form.title.trim()) errs.title = 'أدخل عنوان الإعلان';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (!validateStep()) return;
    if (step < 5) setStep(s => s + 1);
  };

  const goPrev = () => {
    if (step > 1) setStep(s => s - 1);
  };

  const removeListingImage = (index: number) => {
    setListingImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const pickListingImages = async () => {
    const remainingSlots = 10 - listingImages.length;
    if (remainingSlots <= 0) {
      Alert.alert('الحد الأقصى', 'يمكنك رفع 10 صور كحد أقصى لهذا الإعلان');
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        await ensureMediaLibraryPermission();
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.85,
        selectionLimit: remainingSlots,
      });

      if (result.canceled || !result.assets?.length) return;

      setUploadingImages(true);
      const uploadedPaths = await uploadImageAssets(result.assets.slice(0, remainingSlots));
      setListingImages((prev) => [...prev, ...uploadedPaths].slice(0, 10));
    } catch (e: any) {
      Alert.alert('خطأ', e?.message ?? 'فشل اختيار الصور أو رفعها');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (uploadingImages) {
      Alert.alert('انتظر قليلًا', 'لا يزال رفع الصور جاريًا، يرجى الانتظار حتى يكتمل');
      return;
    }
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
        floors: form.floors ? Number(form.floors) : undefined,
        furnishingStatus: form.furnishingStatus,
        negotiable: form.negotiable,
        images: listingImages.length ? listingImages.join('\n') : undefined,
        ...form.amenities,
        ...form.nearby,
      };
      await apiFetch(endpoints.listings, { method: 'POST', body: JSON.stringify(body) });
      Alert.alert('تم النشر! 🎉', 'تم نشر إعلانك بنجاح وسيظهر في القائمة قريباً', [
        { text: 'إعلاناتي', onPress: () => router.replace('/my-listings') },
        { text: 'حسناً', onPress: () => router.replace('/(tabs)/listings') },
      ]);
    } catch (e: any) {
      Alert.alert('خطأ', e.message?.includes('401') ? 'يجب تسجيل الدخول لنشر إعلان' : 'حدث خطأ، حاول مجدداً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.navyDark }}>
      {/* ── Top gradient header ── */}
      <LinearGradient
        colors={[Colors.navyDark, '#0D1E38']}
        style={[s.header, { paddingTop: topPad + 10 }]}
      >
        {/* Nav row */}
        <View style={s.headerRow}>
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-right" size={18} color={Colors.white} />
          </Pressable>
          <Text style={s.headerTitle}>إضافة عقار جديد</Text>
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <Feather name="x" size={18} color={Colors.textMuted} />
          </Pressable>
        </View>

        {/* Step indicator */}
        <View style={s.stepsRow}>
          {STEPS.map((st, idx) => {
            const done = step > st.num;
            const active = step === st.num;
            return (
              <React.Fragment key={st.num}>
                <View style={s.stepItem}>
                  <View style={[
                    s.stepCircle,
                    active && s.stepCircleActive,
                    done && s.stepCircleDone,
                  ]}>
                    {done ? (
                      <Feather name="check" size={12} color={Colors.white} />
                    ) : (
                      <Text style={[s.stepNum, active && s.stepNumActive]}>{st.num}</Text>
                    )}
                  </View>
                  <Text style={[s.stepLabel, (active || done) && s.stepLabelActive]}>
                    {st.title}
                  </Text>
                </View>
                {idx < STEPS.length - 1 && (
                  <View style={[s.stepLine, done && s.stepLineDone]} />
                )}
              </React.Fragment>
            );
          })}
        </View>
      </LinearGradient>

      {/* ── Form content ── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={{ padding: 18, paddingBottom: botPad + 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── STEP 1: نوع العقار ── */}
          {step === 1 && (
            <View>
              <Text style={s.stepSectionTitle}>اختر نوع العقار</Text>
              <View style={s.propTypeGrid}>
                {PROPERTY_TYPE_ROWS.map(pt => (
                  <Pressable
                    key={pt.value}
                    style={[s.propTypeCard, form.propertyType === pt.value && s.propTypeCardActive]}
                    onPress={() => set('propertyType', pt.value)}
                  >
                    <Text style={s.propTypeEmoji}>{pt.icon}</Text>
                    <Text style={[s.propTypeLabel, form.propertyType === pt.value && s.propTypeLabelActive]}>
                      {pt.label}
                    </Text>
                    {form.propertyType === pt.value && (
                      <View style={s.propTypeCheck}>
                        <Feather name="check" size={10} color={Colors.white} />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
              {errors.propertyType && <Text style={s.err}>{errors.propertyType}</Text>}

              <Text style={[s.stepSectionTitle, { marginTop: 24 }]}>نوع الصفقة</Text>
              <View style={s.dealRow}>
                {LISTING_TYPES.map(lt => (
                  <Pressable
                    key={lt.value}
                    style={[s.dealChip, form.listingType === lt.value && s.dealChipActive]}
                    onPress={() => set('listingType', lt.value)}
                  >
                    <Text style={[s.dealChipText, form.listingType === lt.value && s.dealChipTextActive]}>
                      {lt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[s.stepSectionTitle, { marginTop: 24 }]}>الغرض</Text>
              <ChipRow
                options={LISTING_PURPOSES}
                value={form.listingPurpose}
                onSelect={v => set('listingPurpose', v)}
                small
              />
            </View>
          )}

          {/* ── STEP 2: الموقع ── */}
          {step === 2 && (
            <View>
              <Text style={s.stepSectionTitle}>المنطقة الإدارية</Text>
              <ChipRow
                options={SAUDI_REGIONS.map(r => ({ value: r, label: r }))}
                value={form.region}
                onSelect={v => set('region', v)}
                small
              />
              {errors.region && <Text style={s.err}>{errors.region}</Text>}

              <Text style={[s.stepSectionTitle, { marginTop: 20 }]}>المدينة والحي</Text>
              <FieldLabel text="المدينة" required />
              <DarkInput value={form.city} onChangeText={(v: string) => set('city', v)} placeholder="مثال: الرياض" />
              {errors.city && <Text style={s.err}>{errors.city}</Text>}

              <View style={{ height: 12 }} />
              <FieldLabel text="الحي (اختياري)" />
              <DarkInput value={form.district} onChangeText={(v: string) => set('district', v)} placeholder="مثال: حي الياسمين" />

              <Text style={[s.stepSectionTitle, { marginTop: 20 }]}>السعر والمساحة</Text>
              <FieldLabel text="السعر (ريال سعودي)" required />
              <DarkInput value={form.price} onChangeText={(v: string) => set('price', v)} placeholder="1,250,000" numeric />
              {errors.price && <Text style={s.err}>{errors.price}</Text>}

              <View style={{ height: 12 }} />
              <FieldLabel text="المساحة الإجمالية (م²)" />
              <DarkInput value={form.areaSqm} onChangeText={(v: string) => set('areaSqm', v)} placeholder="320" numeric />

              <View style={s.negotiableRow}>
                <Pressable
                  style={[s.negotiableBtn, form.negotiable && s.negotiableBtnActive]}
                  onPress={() => set('negotiable', !form.negotiable)}
                >
                  {form.negotiable && <Feather name="check" size={12} color={Colors.white} />}
                </Pressable>
                <Text style={s.negotiableText}>السعر قابل للتفاوض</Text>
              </View>
            </View>
          )}

          {/* ── STEP 3: التفاصيل ── */}
          {step === 3 && (
            <View>
              <Text style={s.stepSectionTitle}>تفاصيل العقار</Text>

              <View style={s.steppersGrid}>
                <NumStepper value={form.bedrooms} onChange={v => set('bedrooms', v)} label="غرف النوم" />
                <NumStepper value={form.bathrooms} onChange={v => set('bathrooms', v)} label="دورات المياه" />
                <NumStepper value={form.floors} onChange={v => set('floors', v)} label="عدد الأدوار" />
              </View>

              <Text style={[s.stepSectionTitle, { marginTop: 22 }]}>حالة الأثاث</Text>
              <View style={s.dealRow}>
                {FURNISHING.map(f => (
                  <Pressable
                    key={f.value}
                    style={[s.dealChip, form.furnishingStatus === f.value && s.dealChipActive]}
                    onPress={() => set('furnishingStatus', f.value)}
                  >
                    <Text style={[s.dealChipText, form.furnishingStatus === f.value && s.dealChipTextActive]}>
                      {f.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* ── STEP 4: المزايا ── */}
          {step === 4 && (
            <View>
              <Text style={s.stepSectionTitle}>مزايا العقار</Text>
              <View style={s.amenitiesGrid}>
                {AMENITIES.map(am => (
                  <AmenityToggle
                    key={am.key}
                    label={am.label}
                    icon={am.icon}
                    checked={form.amenities[am.key]}
                    onToggle={() => toggleAmenity(am.key)}
                  />
                ))}
              </View>

              <Text style={[s.stepSectionTitle, { marginTop: 22 }]}>الخدمات القريبة</Text>
              <View style={s.amenitiesGrid}>
                {NEARBY.map(nb => (
                  <AmenityToggle
                    key={nb.key}
                    label={nb.label}
                    icon={nb.icon}
                    checked={form.nearby[nb.key]}
                    onToggle={() => toggleNearby(nb.key)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ── STEP 5: الوصف والمراجعة ── */}
          {step === 5 && (
            <View>
              <Text style={s.stepSectionTitle}>عنوان الإعلان</Text>
              <DarkInput
                value={form.title}
                onChangeText={(v: string) => set('title', v)}
                placeholder="مثال: فيلا فاخرة في حي النرجس بالرياض"
              />
              {errors.title && <Text style={s.err}>{errors.title}</Text>}

              <Text style={[s.stepSectionTitle, { marginTop: 20 }]}>وصف العقار</Text>
              <DarkInput
                value={form.description}
                onChangeText={(v: string) => set('description', v)}
                placeholder="أضف وصفاً تفصيلياً يبرز مزايا العقار ويجذب المشترين..."
                multiline
              />

              <Text style={[s.stepSectionTitle, { marginTop: 20 }]}>صور العقار</Text>
              <View style={s.mediaPanel}>
                <Pressable
                  style={[s.mediaUploadBtn, uploadingImages && s.mediaUploadBtnDisabled]}
                  onPress={() => void pickListingImages()}
                  disabled={uploadingImages}
                >
                  {uploadingImages ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Feather name="image" size={16} color={Colors.white} />
                      <Text style={s.mediaUploadBtnText}>
                        {listingImages.length > 0 ? 'إضافة صور أخرى' : 'اختيار صور العقار'}
                      </Text>
                    </>
                  )}
                </Pressable>
                <Text style={s.mediaHint}>
                  يمكنك رفع حتى 10 صور. الصورة الأولى ستظهر كصورة رئيسية للإعلان.
                </Text>
                <Text style={s.mediaCount}>{listingImages.length} / 10 صور</Text>

                {listingImages.length > 0 && (
                  <View style={s.mediaGrid}>
                    {listingImages.map((imagePath, index) => {
                      const imageUri = resolveMediaUrl(imagePath);

                      return (
                        <View key={`${imagePath}-${index}`} style={s.mediaThumbWrap}>
                          {imageUri ? (
                            <Image source={{ uri: imageUri }} style={s.mediaThumb} />
                          ) : (
                            <View style={[s.mediaThumb, s.mediaThumbPlaceholder]}>
                              <Feather name="image" size={22} color="rgba(255,255,255,0.5)" />
                            </View>
                          )}
                          {index === 0 && (
                            <View style={s.mediaPrimaryBadge}>
                              <Text style={s.mediaPrimaryBadgeText}>رئيسية</Text>
                            </View>
                          )}
                          <Pressable style={s.mediaRemoveBtn} onPress={() => removeListingImage(index)}>
                            <Feather name="x" size={14} color={Colors.white} />
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Summary card */}
              <View style={s.summaryCard}>
                <Text style={s.summaryTitle}>ملخص الإعلان</Text>
                <View style={s.summaryRow}>
                  <Text style={s.summaryVal}>{form.propertyType || '—'}</Text>
                  <Text style={s.summaryKey}>النوع</Text>
                </View>
                <View style={s.summaryRow}>
                  <Text style={s.summaryVal}>
                    {LISTING_TYPES.find(l => l.value === form.listingType)?.label || '—'}
                  </Text>
                  <Text style={s.summaryKey}>الصفقة</Text>
                </View>
                <View style={s.summaryRow}>
                  <Text style={s.summaryVal}>{[form.city, form.region].filter(Boolean).join('، ') || '—'}</Text>
                  <Text style={s.summaryKey}>الموقع</Text>
                </View>
                <View style={s.summaryRow}>
                  <Text style={[s.summaryVal, { color: Colors.gold }]}>
                    {form.price ? `${Number(form.price).toLocaleString('ar-SA')} ريال` : '—'}
                  </Text>
                  <Text style={s.summaryKey}>السعر</Text>
                </View>
                {form.bedrooms && (
                  <View style={s.summaryRow}>
                    <Text style={s.summaryVal}>{form.bedrooms} غرف + {form.bathrooms || '0'} حمام</Text>
                    <Text style={s.summaryKey}>التفاصيل</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Bottom navigation ── */}
      <View style={[s.bottomNav, { paddingBottom: botPad + 12 }]}>
        {step > 1 ? (
          <Pressable style={s.prevBtn} onPress={goPrev}>
            <Feather name="arrow-right" size={16} color={Colors.textMuted} />
            <Text style={s.prevBtnText}>السابق</Text>
          </Pressable>
        ) : (
          <View style={s.prevBtn} />
        )}

        <View style={s.bottomMeta}>
          <Text style={s.stepCounter}>{step} / {STEPS.length}</Text>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${(step / STEPS.length) * 100}%` }]} />
          </View>
        </View>

        {step < 5 ? (
          <Pressable style={s.nextBtn} onPress={goNext}>
            <Text style={s.nextBtnText}>التالي</Text>
            <Feather name="arrow-left" size={16} color={Colors.white} />
          </Pressable>
        ) : (
          <Pressable
            style={[s.nextBtn, s.submitBtn, (loading || uploadingImages) && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading || uploadingImages}
          >
            {loading || uploadingImages ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Text style={s.nextBtnText}>نشر الإعلان</Text>
                <Feather name="send" size={16} color={Colors.white} />
              </>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingBottom: 18 },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: Colors.white, fontSize: 17, fontWeight: '800' },

  /* Steps */
  stepsRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' },
  stepItem: { alignItems: 'center', width: 54 },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
  },
  stepCircleActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  stepCircleDone: { backgroundColor: '#10b981', borderColor: '#10b981' },
  stepNum: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '700' },
  stepNumActive: { color: Colors.white },
  stepLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  stepLabelActive: { color: 'rgba(255,255,255,0.7)' },
  stepLine: { flex: 1, height: 1.5, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 14 },
  stepLineDone: { backgroundColor: '#10b981' },

  scroll: { flex: 1 },

  stepSectionTitle: {
    color: Colors.white, fontSize: 15, fontWeight: '700', textAlign: 'right', marginBottom: 12,
  },

  /* Property type grid */
  propTypeGrid: {
    flexDirection: 'row-reverse', flexWrap: 'wrap',
  },
  propTypeCard: {
    width: '30%', aspectRatio: 1, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
    marginBottom: 10, marginLeft: '3.3%',
  },
  propTypeCardActive: {
    backgroundColor: 'rgba(15,123,160,0.2)',
    borderColor: Colors.teal,
  },
  propTypeEmoji: { fontSize: 26 },
  propTypeLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600' },
  propTypeLabelActive: { color: Colors.white },
  propTypeCheck: {
    position: 'absolute', top: 6, left: 6,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center',
  },

  /* Deal type */
  dealRow: { flexDirection: 'row-reverse', flexWrap: 'wrap' },
  dealChip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginLeft: 8, marginBottom: 8,
  },
  dealChipActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  dealChipText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
  dealChipTextActive: { color: Colors.white },

  /* Chips */
  chipsWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginLeft: 8, marginBottom: 8,
  },
  chipActive: { backgroundColor: 'rgba(15,123,160,0.25)', borderColor: Colors.teal },
  chipSm: { paddingHorizontal: 10, paddingVertical: 6 },
  chipIcon: { fontSize: 13, marginLeft: 4 },
  chipText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: Colors.white },
  chipTextSm: { fontSize: 12 },

  /* Input */
  input: {
    height: 52, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 16, color: Colors.white,
    fontSize: 15, marginBottom: 4,
  },
  inputMulti: {
    height: 120, paddingTop: 14,
  },

  fieldLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '600', marginBottom: 8, textAlign: 'right' },
  err: { color: '#ef4444', fontSize: 11, textAlign: 'right', marginTop: 4, marginBottom: 4 },

  /* Media */
  mediaPanel: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 18,
  },
  mediaUploadBtn: {
    backgroundColor: Colors.teal,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mediaUploadBtnDisabled: { opacity: 0.65 },
  mediaUploadBtnText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  mediaHint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'right',
    lineHeight: 18,
    marginTop: 10,
  },
  mediaCount: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 6,
  },
  mediaGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  mediaThumbWrap: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  mediaThumb: { width: '100%', height: '100%' },
  mediaThumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  mediaPrimaryBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.gold,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  mediaPrimaryBadgeText: { color: Colors.navyDark, fontSize: 10, fontWeight: '800' },
  mediaRemoveBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Negotiable */
  negotiableRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginTop: 14 },
  negotiableBtn: {
    width: 20, height: 20, borderRadius: 5,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center',
  },
  negotiableBtnActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  negotiableText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },

  /* Steppers */
  steppersGrid: { flexDirection: 'row-reverse', gap: 10 },
  stepperWrap: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  stepperLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', marginBottom: 10 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepperBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  stepperVal: { color: Colors.white, fontSize: 20, fontWeight: '800', minWidth: 24, textAlign: 'center' },

  /* Amenities */
  amenitiesGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap' },
  amenity: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    position: 'relative', marginLeft: 8, marginBottom: 8,
  },
  amenityActive: { backgroundColor: 'rgba(15,123,160,0.2)', borderColor: Colors.teal },
  amenityIcon: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  amenityIconActive: { backgroundColor: Colors.teal },
  amenityText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' },
  amenityTextActive: { color: Colors.white },
  amenityCheck: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.teal,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 2,
  },

  /* Summary */
  summaryCard: {
    marginTop: 20, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  summaryTitle: { color: Colors.teal, fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 12 },
  summaryRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  summaryKey: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  summaryVal: { color: Colors.white, fontSize: 13, fontWeight: '600' },

  /* Bottom nav */
  bottomNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 14,
    backgroundColor: '#0B1628',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  prevBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    minWidth: 90, justifyContent: 'center',
  },
  prevBtnText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  nextBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.teal, borderRadius: 14,
    paddingVertical: 14, justifyContent: 'center',
    shadowColor: Colors.teal, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
  },
  submitBtn: { backgroundColor: '#10b981' },
  nextBtnText: { color: Colors.white, fontSize: 15, fontWeight: '800' },
  bottomMeta: { alignItems: 'center', minWidth: 60 },
  stepCounter: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600', marginBottom: 6 },
  progressBar: { width: 60, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.teal, borderRadius: 2 },
});
