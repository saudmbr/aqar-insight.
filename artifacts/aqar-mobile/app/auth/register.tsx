import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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

const ACCOUNT_TYPES = [
  {
    value: 'user',
    label: 'باحث عن عقار',
    desc: 'أبحث عن عقار للشراء أو الإيجار',
    icon: 'search',
    color: Colors.teal,
  },
  {
    value: 'real_estate_marketer',
    label: 'مسوّق عقاري',
    desc: 'أعمل في التسويق العقاري وأرغب في نشر عقارات',
    icon: 'briefcase',
    color: '#8b5cf6',
  },
  {
    value: 'service_provider',
    label: 'مزود خدمات',
    desc: 'أقدم خدمات عقارية (صيانة، تصميم، مقاولات...)',
    icon: 'tool',
    color: '#10b981',
  },
];

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [step, setStep] = useState<'type' | 'details'>('type');
  const [accountType, setAccountType] = useState('user');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleRegister = async () => {
    if (!fullName.trim()) { setError('الاسم الكامل مطلوب'); return; }
    if (fullName.trim().length < 3) { setError('الاسم يجب أن يكون 3 أحرف على الأقل'); return; }
    if (!username.trim()) { setError('اسم المستخدم مطلوب'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) { setError('اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط'); return; }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) { setError('البريد الإلكتروني غير صحيح'); return; }
    if (password.length < 8) { setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return; }
    if (password !== confirmPassword) { setError('كلمتا المرور غير متطابقتان'); return; }
    setLoading(true);
    setError('');
    try {
      await register({
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        userType: accountType,
      });
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message && !e.message.startsWith('HTTP') ? e.message : 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topPad + 20 }]} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Feather name="x" size={22} color="rgba(255,255,255,0.7)" />
        </Pressable>

        <View style={styles.logoArea}>
          <View style={styles.logoIcon}>
            <Feather name="home" size={32} color={Colors.teal} />
          </View>
          <Text style={styles.appName}>إنشاء حساب جديد</Text>
          <Text style={styles.tagline}>انضم إلى عقار إنسايت مجاناً</Text>
        </View>

        {step === 'type' ? (
          <View style={styles.form}>
            <Text style={styles.stepTitle}>ما نوع حسابك؟</Text>
            <Text style={styles.stepSubtitle}>اختر نوع الحساب المناسب لك</Text>

            <View style={{ gap: 10, marginTop: 4 }}>
              {ACCOUNT_TYPES.map((type) => (
                <Pressable
                  key={type.value}
                  style={[styles.typeCard, accountType === type.value && styles.typeCardActive]}
                  onPress={() => setAccountType(type.value)}
                >
                  <View style={[styles.typeIcon, { backgroundColor: `${type.color}15`, borderColor: `${type.color}30` }]}>
                    <Feather name={type.icon as any} size={20} color={type.color} />
                  </View>
                  <View style={styles.typeText}>
                    <Text style={[styles.typeLabel, accountType === type.value && { color: Colors.navy }]}>{type.label}</Text>
                    <Text style={styles.typeDesc}>{type.desc}</Text>
                  </View>
                  <View style={[styles.radio, accountType === type.value && styles.radioActive]}>
                    {accountType === type.value && <View style={styles.radioDot} />}
                  </View>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.nextBtn} onPress={() => setStep('details')}>
              <Text style={styles.nextBtnText}>التالي</Text>
              <Feather name="arrow-left" size={18} color={Colors.white} />
            </Pressable>

            <Pressable style={styles.loginLink} onPress={() => router.replace('/auth/login')}>
              <Text style={styles.loginLinkText}>
                لديك حساب؟ <Text style={styles.loginLinkHighlight}>سجّل دخولك</Text>
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            {/* Step indicator */}
            <Pressable style={styles.backStep} onPress={() => setStep('type')}>
              <Feather name="arrow-right" size={16} color={Colors.textSub} />
              <Text style={styles.backStepText}>تغيير نوع الحساب</Text>
            </Pressable>

            <View style={styles.selectedTypeBadge}>
              {(() => {
                const t = ACCOUNT_TYPES.find((x) => x.value === accountType)!;
                return (
                  <>
                    <Feather name={t.icon as any} size={14} color={t.color} />
                    <Text style={[styles.selectedTypeText, { color: t.color }]}>{t.label}</Text>
                  </>
                );
              })()}
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={14} color={Colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {[
              { label: 'الاسم الكامل', value: fullName, setter: setFullName, placeholder: 'محمد عبدالله', icon: 'user' },
              { label: 'اسم المستخدم', value: username, setter: setUsername, placeholder: 'username_123', icon: 'at-sign', lower: true },
              { label: 'البريد الإلكتروني', value: email, setter: setEmail, placeholder: 'example@email.com', icon: 'mail', lower: true },
            ].map((f) => (
              <View key={f.label} style={styles.field}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <View style={styles.inputWrap}>
                  <Feather name={f.icon as any} size={16} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder={f.placeholder}
                    placeholderTextColor={Colors.textMuted}
                    value={f.value}
                    onChangeText={f.setter}
                    autoCapitalize={f.lower ? 'none' : 'words'}
                    autoCorrect={false}
                    textAlign="right"
                  />
                </View>
              </View>
            ))}

            {[
              { label: 'كلمة المرور', value: password, setter: setPassword, show: showPass, setShow: setShowPass, placeholder: '8 أحرف على الأقل' },
              { label: 'تأكيد كلمة المرور', value: confirmPassword, setter: setConfirmPassword, show: showConfirm, setShow: setShowConfirm, placeholder: 'أعد كتابة كلمة المرور' },
            ].map((f) => (
              <View key={f.label} style={styles.field}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <View style={styles.inputWrap}>
                  <Pressable onPress={() => f.setShow(!f.show)} hitSlop={8}>
                    <Feather name={f.show ? 'eye-off' : 'eye'} size={16} color={Colors.textMuted} />
                  </Pressable>
                  <TextInput
                    style={styles.input}
                    placeholder={f.placeholder}
                    placeholderTextColor={Colors.textMuted}
                    value={f.value}
                    onChangeText={f.setter}
                    secureTextEntry={!f.show}
                    textAlign="right"
                  />
                </View>
              </View>
            ))}

            <Pressable
              style={[styles.registerBtn, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.registerBtnText}>إنشاء الحساب</Text>
              )}
            </Pressable>

            <Pressable style={styles.loginLink} onPress={() => router.replace('/auth/login')}>
              <Text style={styles.loginLinkText}>
                لديك حساب؟ <Text style={styles.loginLinkHighlight}>سجّل دخولك</Text>
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.navy },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },
  closeBtn: {
    alignSelf: 'flex-end', width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  logoArea: { alignItems: 'center', marginBottom: 28, gap: 6 },
  logoIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: 'rgba(15,123,160,0.2)',
    borderWidth: 1, borderColor: 'rgba(15,123,160,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  appName: { fontSize: 22, fontWeight: '800', color: Colors.white },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },
  form: { backgroundColor: Colors.white, borderRadius: 24, padding: 24, gap: 14 },
  stepTitle: { fontSize: 18, fontWeight: '800', color: Colors.navy, textAlign: 'right' },
  stepSubtitle: { fontSize: 13, color: Colors.textMuted, textAlign: 'right' },
  typeCard: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    borderWidth: 2, borderColor: Colors.border, borderRadius: 16,
    padding: 14, backgroundColor: Colors.background,
  },
  typeCardActive: { borderColor: Colors.navy, backgroundColor: 'rgba(11,22,40,0.04)' },
  typeIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  typeText: { flex: 1 },
  typeLabel: { fontSize: 14, fontWeight: '700', color: Colors.textSub, textAlign: 'right' },
  typeDesc: { fontSize: 11, color: Colors.textMuted, textAlign: 'right', marginTop: 2, lineHeight: 16 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.navy },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.navy },
  nextBtn: {
    backgroundColor: Colors.teal, borderRadius: 16,
    paddingVertical: 16, flexDirection: 'row-reverse',
    alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
  },
  nextBtnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  backStep: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  backStepText: { fontSize: 13, color: Colors.textSub, fontWeight: '600' },
  selectedTypeBadge: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    backgroundColor: Colors.background, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-end',
  },
  selectedTypeText: { fontSize: 13, fontWeight: '700' },
  errorBox: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 10,
    padding: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  errorText: { fontSize: 13, color: Colors.danger, textAlign: 'right', flex: 1 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSub, textAlign: 'right' },
  inputWrap: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: 14,
    paddingHorizontal: 14, height: 50, gap: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  input: { flex: 1, fontSize: 14, color: Colors.text },
  registerBtn: {
    backgroundColor: Colors.teal, borderRadius: 16,
    paddingVertical: 16, alignItems: 'center', marginTop: 4,
  },
  btnDisabled: { opacity: 0.7 },
  registerBtnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  loginLink: { alignItems: 'center' },
  loginLinkText: { fontSize: 13, color: Colors.textSub, textAlign: 'center' },
  loginLinkHighlight: { color: Colors.teal, fontWeight: '700' },
});
