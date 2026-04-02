import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { useAuth } from '@/context/AuthContext';
import { apiFetch, endpoints, parseMediaList, resolveMediaUrl } from '@/constants/api';
import { ensureMediaLibraryPermission, uploadImageAssets } from '@/constants/mediaUpload';
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
  const [profileImage, setProfileImage] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [uploadingField, setUploadingField] = useState<'profileImage' | 'coverImage' | 'portfolioImages' | null>(null);

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
      setProfileImage(profile.profileImage ?? '');
      setCoverImage(profile.coverImage ?? '');
      setPortfolioImages(parseMediaList(profile.portfolioImages));
    }
  }, [profile]);

  const uploadServiceImages = async (
    field: 'profileImage' | 'coverImage' | 'portfolioImages',
    options?: { multiple?: boolean; limit?: number; aspect?: [number, number] },
  ) => {
    const currentCount = field === 'portfolioImages' ? portfolioImages.length : 0;
    const maxItems = options?.limit ?? 1;
    const remainingSlots = maxItems - currentCount;

    if (remainingSlots <= 0) {
      Alert.alert('الحد الأقصى', 'تم الوصول إلى الحد الأقصى للصور في هذا القسم');
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        await ensureMediaLibraryPermission();
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: !options?.multiple,
        allowsMultipleSelection: options?.multiple ?? false,
        aspect: options?.aspect,
        quality: 0.85,
        selectionLimit: remainingSlots,
      });

      if (result.canceled || !result.assets?.length) return;

      setUploadingField(field);
      const uploadedPaths = await uploadImageAssets(result.assets.slice(0, remainingSlots));

      if (field === 'profileImage') {
        setProfileImage(uploadedPaths[0] ?? '');
      } else if (field === 'coverImage') {
        setCoverImage(uploadedPaths[0] ?? '');
      } else {
        setPortfolioImages((prev) => [...prev, ...uploadedPaths].slice(0, maxItems));
      }
    } catch (e: any) {
      Alert.alert('خطأ', e?.message ?? 'فشل اختيار الصور أو رفعها');
    } finally {
      setUploadingField(null);
    }
  };

  const removePortfolioImage = (index: number) => {
    setPortfolioImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

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
          profileImage: profileImage || null,
          coverImage: coverImage || null,
          portfolioImages: portfolioImages.length ? portfolioImages.join('\n') : null,
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

                <Pressable style={[styles.saveBtn, (saving || uploadingField) && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving || uploadingField !== null}>
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
            <Text style={styles.portfolioText}>أضف الصور الرئيسية وأعمالك السابقة من الجوال مباشرة ليظهر ملفك بشكل احترافي.</Text>
            <Text style={styles.portfolioNote}>الأنواع المدعومة: JPG و PNG و WebP بحد أقصى 5 ميغابايت لكل صورة.</Text>
          </View>

          <View style={styles.mediaSectionCard}>
            <View style={styles.mediaSectionHeader}>
              <Text style={styles.mediaSectionTitle}>الصورة الشخصية</Text>
              <Pressable
                style={[styles.mediaActionBtn, uploadingField === 'profileImage' && styles.mediaActionBtnDisabled]}
                onPress={() => void uploadServiceImages('profileImage', { aspect: [1, 1] })}
                disabled={uploadingField !== null}
              >
                {uploadingField === 'profileImage' ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Feather name="upload" size={14} color={Colors.white} />
                    <Text style={styles.mediaActionText}>{profileImage ? 'تغيير' : 'رفع'}</Text>
                  </>
                )}
              </Pressable>
            </View>
            {resolveMediaUrl(profileImage) ? (
              <Image source={{ uri: resolveMediaUrl(profileImage)! }} style={styles.profileMediaPreview} />
            ) : (
              <View style={[styles.profileMediaPreview, styles.mediaPlaceholder]}>
                <Feather name="user" size={28} color={Colors.textMuted} />
              </View>
            )}
          </View>

          <View style={styles.mediaSectionCard}>
            <View style={styles.mediaSectionHeader}>
              <Text style={styles.mediaSectionTitle}>صورة الغلاف</Text>
              <Pressable
                style={[styles.mediaActionBtn, uploadingField === 'coverImage' && styles.mediaActionBtnDisabled]}
                onPress={() => void uploadServiceImages('coverImage', { aspect: [16, 9] })}
                disabled={uploadingField !== null}
              >
                {uploadingField === 'coverImage' ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Feather name="upload" size={14} color={Colors.white} />
                    <Text style={styles.mediaActionText}>{coverImage ? 'تغيير' : 'رفع'}</Text>
                  </>
                )}
              </Pressable>
            </View>
            {resolveMediaUrl(coverImage) ? (
              <Image source={{ uri: resolveMediaUrl(coverImage)! }} style={styles.coverMediaPreview} />
            ) : (
              <View style={[styles.coverMediaPreview, styles.mediaPlaceholder]}>
                <Feather name="image" size={30} color={Colors.textMuted} />
              </View>
            )}
          </View>

          <View style={styles.mediaSectionCard}>
            <View style={styles.mediaSectionHeader}>
              <Text style={styles.mediaSectionTitle}>صور المشاريع</Text>
              <Pressable
                style={[styles.mediaActionBtn, uploadingField === 'portfolioImages' && styles.mediaActionBtnDisabled]}
                onPress={() => void uploadServiceImages('portfolioImages', { multiple: true, limit: 8 })}
                disabled={uploadingField !== null}
              >
                {uploadingField === 'portfolioImages' ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Feather name="plus" size={14} color={Colors.white} />
                    <Text style={styles.mediaActionText}>إضافة</Text>
                  </>
                )}
              </Pressable>
            </View>
            <Text style={styles.mediaCounter}>{portfolioImages.length} / 8 صور</Text>

            {portfolioImages.length > 0 ? (
              <View style={styles.portfolioGrid}>
                {portfolioImages.map((img: string, i: number) => {
                  const imageUri = resolveMediaUrl(img);

                  return (
                    <View key={`${img}-${i}`} style={styles.portfolioTile}>
                      {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.portfolioImage} />
                      ) : (
                        <View style={[styles.portfolioImage, styles.mediaPlaceholder]}>
                          <Feather name="image" size={24} color={Colors.textMuted} />
                        </View>
                      )}
                      <Pressable style={styles.portfolioRemoveBtn} onPress={() => removePortfolioImage(i)}>
                        <Feather name="x" size={12} color={Colors.white} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyPortfolioState}>
                <Feather name="briefcase" size={28} color={Colors.textMuted} />
                <Text style={styles.emptyPortfolioText}>أضف أمثلة من أعمالك ليشاهدها العملاء داخل التطبيق.</Text>
              </View>
            )}
          </View>

          <Pressable style={[styles.saveBtn, (saving || uploadingField) && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving || uploadingField !== null}>
            <Feather name="save" size={18} color={Colors.white} />
            <Text style={styles.saveBtnText}>{saving ? 'جارٍ الحفظ...' : 'حفظ الصور والتغييرات'}</Text>
          </Pressable>
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
  mediaSectionCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 14, gap: 12, borderWidth: 1, borderColor: Colors.border },
  mediaSectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  mediaSectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, textAlign: 'right', flex: 1 },
  mediaActionBtn: {
    backgroundColor: Colors.teal,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 82,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mediaActionBtnDisabled: { opacity: 0.6 },
  mediaActionText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  profileMediaPreview: { width: 92, height: 92, borderRadius: 46, alignSelf: 'center' },
  coverMediaPreview: { width: '100%', height: 150, borderRadius: 14 },
  mediaPlaceholder: { backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  mediaCounter: { fontSize: 12, color: Colors.textMuted, textAlign: 'right' },
  portfolioGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  portfolioTile: { width: '47%', aspectRatio: 1, borderRadius: 14, overflow: 'hidden', position: 'relative', backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  portfolioImage: { width: '100%', height: '100%' },
  portfolioRemoveBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPortfolioState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 22, gap: 10, backgroundColor: Colors.background, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  emptyPortfolioText: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
