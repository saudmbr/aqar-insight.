import { Feather } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
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
import { Listing, Marketer, apiFetch, endpoints, formatPrice, parseStringList, resolveMediaUrl } from '@/constants/api';
import { ensureMediaLibraryPermission, uploadImageAsset } from '@/constants/mediaUpload';
import { SkeletonCard } from '@/components/SkeletonCard';

type Tab = 'profile' | 'listings';

const SPECIALTIES = ['سكني', 'تجاري', 'أراضي', 'فلل', 'شقق', 'مكاتب', 'مستودعات', 'استثمار', 'إيجار'];

export default function MarketerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [saving, setSaving] = useState(false);

  // Profile form
  const [officeName, setOfficeName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [servedAreas, setServedAreas] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [yearsExp, setYearsExp] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [photo, setPhoto] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [uploadingField, setUploadingField] = useState<'photo' | 'coverImage' | null>(null);

  const { data: profile, isLoading: profileLoading } = useQuery<Marketer & Record<string, any>>({
    queryKey: ['my-marketer-profile'],
    queryFn: () => apiFetch<Marketer & Record<string, any>>(endpoints.myMarketerProfile),
    enabled: !!user && user.role === 'real_estate_marketer',
    retry: false,
  });

  const { data: listings = [], isLoading: listingsLoading } = useQuery<Listing[]>({
    queryKey: ['my-listings'],
    queryFn: () => apiFetch<Listing[]>(endpoints.myListings),
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setOfficeName(profile.officeName ?? '');
      setBio(profile.bio ?? '');
      setCity(profile.city ?? '');
      setServedAreas(parseStringList(profile.servedAreas).join('، '));
      setSpecialties(parseStringList(profile.specialties));
      setYearsExp(profile.yearsExperience ? String(profile.yearsExperience) : '');
      setLicenseNumber(profile.licenseNumber ?? '');
      setPhone(profile.phone ?? '');
      setWhatsapp(profile.whatsapp ?? '');
      setEmail(profile.email ?? '');
      setWebsiteUrl(profile.websiteUrl ?? '');
      setTwitterUrl(profile.twitterUrl ?? '');
      setInstagramUrl(profile.instagramUrl ?? '');
      setPhoto(profile.photo ?? '');
      setCoverImage(profile.coverImage ?? '');
    }
  }, [profile]);

  const uploadPickedImage = async (asset: ImagePicker.ImagePickerAsset) => {
    const blobResponse = await fetch(asset.uri);
    const blob = await blobResponse.blob();
    const contentType = asset.mimeType ?? blob.type ?? 'image/jpeg';
    const fileName =
      asset.fileName ??
      `marketer-${Date.now()}.${contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'}`;

    const { uploadURL, objectPath } = await apiFetch<{ uploadURL: string; objectPath: string }>(
      endpoints.requestUploadUrl,
      {
        method: 'POST',
        body: JSON.stringify({
          name: fileName,
          size: asset.fileSize ?? blob.size ?? 0,
          contentType,
        }),
      }
    );

    const putRes = await fetch(uploadURL, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: blob,
    });

    if (!putRes.ok) {
      throw new Error('فشل رفع الصورة، حاول مرة أخرى');
    }

    return objectPath;
  };

  const pickImage = async (field: 'photo' | 'coverImage') => {
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('صلاحية مطلوبة', 'اسمح للتطبيق بالوصول إلى الصور لإضافة صورة الحساب');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: field === 'photo' ? [1, 1] : [16, 9],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.[0]) return;

      setUploadingField(field);
      const objectPath = await uploadPickedImage(result.assets[0]);
      if (field === 'photo') {
        setPhoto(objectPath);
      } else {
        setCoverImage(objectPath);
      }
    } catch (e: any) {
      Alert.alert('خطأ', e?.message ?? 'فشل اختيار الصورة أو رفعها');
    } finally {
      setUploadingField(null);
    }
  };

  const totalViews = listings.reduce((s, l: any) => s + (l.views ?? 0), 0);
  const activeCount = listings.filter((l: any) => l.status === 'active').length;

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch(endpoints.myMarketerProfile, {
        method: 'PUT',
        body: JSON.stringify({
          officeName,
          bio,
          city,
          servedAreas: JSON.stringify(parseStringList(servedAreas)),
          specialties: JSON.stringify(specialties),
          yearsExperience: yearsExp ? Number(yearsExp) : null,
          licenseNumber,
          phone,
          whatsapp,
          email,
          websiteUrl,
          twitterUrl,
          instagramUrl,
          photo: photo || null,
          coverImage: coverImage || null,
        }),
      });
      qc.invalidateQueries({ queryKey: ['my-marketer-profile'] });
      qc.invalidateQueries({ queryKey: ['marketers-list'] });
      Alert.alert('✅ تم الحفظ', 'تم تحديث ملف المسوّق بنجاح');
    } catch (e: any) {
      Alert.alert('خطأ', e.message ?? 'فشل حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'real_estate_marketer') {
    return (
      <View style={[styles.screen, { paddingTop: topPad }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}><Feather name="arrow-right" size={22} color={Colors.white} /></Pressable>
          <Text style={styles.headerTitle}>لوحة المسوّق</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}>
          <Feather name="lock" size={48} color={Colors.textMuted} />
          <Text style={styles.centerText}>هذه الصفحة مخصصة للمسوّقين العقاريين فقط</Text>
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
          <Text style={styles.headerTitle}>لوحة المسوّق العقاري</Text>
          <Text style={styles.headerSub}>{user.fullName ?? user.username}</Text>
        </View>
        <Pressable onPress={() => router.push('/listing/new')} style={styles.addBtn}>
          <Feather name="plus" size={22} color={Colors.white} />
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'الإعلانات', value: String(listings.length), color: Colors.teal },
          { label: 'نشط', value: String(activeCount), color: Colors.success },
          { label: 'مشاهدة', value: totalViews.toLocaleString(), color: Colors.gold },
        ].map((s, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {[{ key: 'profile', label: 'الملف الشخصي', icon: 'user' }, { key: 'listings', label: 'إعلاناتي', icon: 'home' }].map(t => (
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
            {profileLoading ? (
              [1,2,3].map(i => <SkeletonCard key={i} />)
            ) : (
              <>
                {/* Basic Info */}
                <View style={styles.formCard}>
                  <Text style={styles.formCardTitle}>المعلومات الأساسية</Text>
                  {[
                    { label: 'اسم المكتب العقاري', value: officeName, set: setOfficeName, placeholder: 'مكتب عقارات الخليج...' },
                    { label: 'رقم الترخيص', value: licenseNumber, set: setLicenseNumber, placeholder: 'رقم ترخيص الوساطة...' },
                    { label: 'سنوات الخبرة', value: yearsExp, set: setYearsExp, placeholder: '5', keyboardType: 'numeric' as any },
                  ].map(f => (
                    <View key={f.label} style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>{f.label}</Text>
                      <TextInput style={styles.input} value={f.value} onChangeText={f.set} placeholder={f.placeholder} textAlign="right" keyboardType={f.keyboardType} />
                    </View>
                  ))}

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>السيرة الذاتية</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={bio}
                      onChangeText={setBio}
                      placeholder="اكتب نبذة مختصرة عن نفسك وخبرتك..."
                      textAlign="right"
                      multiline
                      numberOfLines={4}
                    />
                  </View>
                </View>

                <View style={styles.formCard}>
                  <Text style={styles.formCardTitle}>الصور الشخصية</Text>

                  <View style={styles.mediaCard}>
                    <Text style={styles.mediaLabel}>الصورة الشخصية</Text>
                    <View style={styles.mediaPreviewWrap}>
                      {resolveMediaUrl(photo) ? (
                        <Image source={{ uri: resolveMediaUrl(photo)! }} style={styles.avatarPreview} />
                      ) : (
                        <View style={[styles.avatarPreview, styles.avatarPreviewPlaceholder]}>
                          <Feather name="user" size={28} color={Colors.textMuted} />
                        </View>
                      )}
                      <View style={styles.mediaActions}>
                        <Pressable
                          style={[styles.mediaBtn, uploadingField === 'photo' && styles.mediaBtnDisabled]}
                          onPress={() => void pickImage('photo')}
                          disabled={uploadingField !== null}
                        >
                          {uploadingField === 'photo' ? (
                            <ActivityIndicator size="small" color={Colors.white} />
                          ) : (
                            <>
                              <Feather name="image" size={16} color={Colors.white} />
                              <Text style={styles.mediaBtnText}>{photo ? 'تغيير الصورة' : 'إضافة صورة'}</Text>
                            </>
                          )}
                        </Pressable>
                        {photo ? (
                          <Pressable style={styles.mediaBtnSecondary} onPress={() => setPhoto('')}>
                            <Feather name="trash-2" size={14} color={Colors.danger} />
                            <Text style={styles.mediaBtnSecondaryText}>حذف</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  <View style={[styles.mediaCard, styles.mediaCardLast]}>
                    <Text style={styles.mediaLabel}>صورة الغلاف</Text>
                    {resolveMediaUrl(coverImage) ? (
                      <Image source={{ uri: resolveMediaUrl(coverImage)! }} style={styles.coverPreview} />
                    ) : (
                      <View style={[styles.coverPreview, styles.coverPreviewPlaceholder]}>
                        <Feather name="image" size={28} color={Colors.textMuted} />
                      </View>
                    )}
                    <View style={styles.mediaActions}>
                      <Pressable
                        style={[styles.mediaBtn, uploadingField === 'coverImage' && styles.mediaBtnDisabled]}
                        onPress={() => void pickImage('coverImage')}
                        disabled={uploadingField !== null}
                      >
                        {uploadingField === 'coverImage' ? (
                          <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                          <>
                            <Feather name="image" size={16} color={Colors.white} />
                            <Text style={styles.mediaBtnText}>{coverImage ? 'تغيير الغلاف' : 'إضافة غلاف'}</Text>
                          </>
                        )}
                      </Pressable>
                      {coverImage ? (
                        <Pressable style={styles.mediaBtnSecondary} onPress={() => setCoverImage('')}>
                          <Feather name="trash-2" size={14} color={Colors.danger} />
                          <Text style={styles.mediaBtnSecondaryText}>حذف</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                </View>

                {/* Location */}
                <View style={styles.formCard}>
                  <Text style={styles.formCardTitle}>الموقع</Text>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>المدينة الرئيسية</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
                        {['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الطائف'].map(c => (
                          <Pressable key={c} style={[styles.chip, city === c && styles.chipActive]} onPress={() => setCity(c)}>
                            <Text style={[styles.chipText, city === c && styles.chipTextActive]}>{c}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>المناطق المخدومة (افصل بفاصلة)</Text>
                    <TextInput style={styles.input} value={servedAreas} onChangeText={setServedAreas} placeholder="الرياض، جدة، الدمام..." textAlign="right" />
                  </View>
                </View>

                {/* Specialties */}
                <View style={styles.formCard}>
                  <Text style={styles.formCardTitle}>التخصصات</Text>
                  <View style={styles.chipsWrap}>
                    {SPECIALTIES.map(s => (
                      <Pressable key={s} style={[styles.chip, specialties.includes(s) && styles.chipActive]} onPress={() => setSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}>
                        <Text style={[styles.chipText, specialties.includes(s) && styles.chipTextActive]}>{s}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Contact */}
                <View style={styles.formCard}>
                  <Text style={styles.formCardTitle}>بيانات التواصل</Text>
                  {[
                    { label: 'رقم الهاتف', value: phone, set: setPhone, placeholder: '05xxxxxxxx', keyboardType: 'phone-pad' as any },
                    { label: 'رقم الواتساب', value: whatsapp, set: setWhatsapp, placeholder: '05xxxxxxxx', keyboardType: 'phone-pad' as any },
                    { label: 'البريد الإلكتروني', value: email, set: setEmail, placeholder: 'example@email.com', keyboardType: 'email-address' as any },
                    { label: 'الموقع الإلكتروني', value: websiteUrl, set: setWebsiteUrl, placeholder: 'https://...' },
                    { label: 'تويتر / X', value: twitterUrl, set: setTwitterUrl, placeholder: 'https://twitter.com/...' },
                    { label: 'إنستغرام', value: instagramUrl, set: setInstagramUrl, placeholder: 'https://instagram.com/...' },
                  ].map(f => (
                    <View key={f.label} style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>{f.label}</Text>
                      <TextInput style={styles.input} value={f.value} onChangeText={f.set} placeholder={f.placeholder} textAlign="right" keyboardType={f.keyboardType} autoCapitalize="none" />
                    </View>
                  ))}
                </View>

                <Pressable style={[styles.saveBtn, (saving || uploadingField) && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving || uploadingField !== null}>
                  <Feather name="save" size={18} color={Colors.white} />
                  <Text style={styles.saveBtnText}>{saving ? 'جارٍ الحفظ...' : uploadingField ? 'انتظر اكتمال رفع الصورة...' : 'حفظ التغييرات'}</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Listings Tab */}
      {activeTab === 'listings' && (
        <ScrollView contentContainerStyle={{ paddingBottom: botPad + 20, gap: 12, paddingHorizontal: 16, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
          <Pressable style={styles.newListingBtn} onPress={() => router.push('/listing/new')}>
            <Feather name="plus" size={16} color={Colors.white} />
            <Text style={styles.newListingBtnText}>نشر إعلان جديد</Text>
          </Pressable>

          {listingsLoading && [1,2,3].map(i => <SkeletonCard key={i} />)}

          {listings.map((l: any) => (
            <Pressable key={l.id} style={styles.listingRow} onPress={() => router.push({ pathname: '/listing/[id]', params: { id: String(l.id) } })}>
              <View style={styles.listingRowInfo}>
                <Text style={styles.listingRowTitle} numberOfLines={1}>{l.title}</Text>
                <Text style={styles.listingRowMeta}>{formatPrice(l.price)} · {l.city} {l.views !== undefined ? `· ${l.views} مشاهدة` : ''}</Text>
                <View style={[styles.statusDot, { backgroundColor: l.status === 'active' ? Colors.success : Colors.textMuted }]} />
              </View>
              <Feather name="chevron-left" size={16} color={Colors.textMuted} />
            </Pressable>
          ))}

          {listings.length === 0 && !listingsLoading && (
            <View style={styles.center}>
              <Feather name="home" size={40} color={Colors.textMuted} />
              <Text style={styles.centerText}>لا توجد إعلانات</Text>
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
  addBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row-reverse', backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 2 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, color: Colors.textMuted },
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
  mediaCard: { padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, gap: 12 },
  mediaCardLast: { borderBottomWidth: 0 },
  mediaLabel: { fontSize: 12, fontWeight: '700', color: Colors.text, textAlign: 'right' },
  mediaPreviewWrap: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14 },
  avatarPreview: { width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: Colors.border },
  avatarPreviewPlaceholder: { backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  coverPreview: { width: '100%', height: 140, borderRadius: 14, backgroundColor: Colors.background },
  coverPreviewPlaceholder: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  mediaActions: { flex: 1, gap: 8 },
  mediaBtn: {
    backgroundColor: Colors.teal,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mediaBtnDisabled: { opacity: 0.6 },
  mediaBtnText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  mediaBtnSecondary: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.18)',
  },
  mediaBtnSecondaryText: { color: Colors.danger, fontSize: 12, fontWeight: '700' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.textSub },
  chipTextActive: { color: Colors.white },
  chipsWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, padding: 14 },
  saveBtn: { backgroundColor: Colors.teal, borderRadius: 16, paddingVertical: 16, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  newListingBtn: { backgroundColor: Colors.teal, borderRadius: 14, paddingVertical: 14, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6 },
  newListingBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  listingRow: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  listingRowInfo: { flex: 1, gap: 4 },
  listingRowTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, textAlign: 'right' },
  listingRowMeta: { fontSize: 11, color: Colors.textMuted, textAlign: 'right' },
  statusDot: { width: 8, height: 8, borderRadius: 4, alignSelf: 'flex-end' },
});
