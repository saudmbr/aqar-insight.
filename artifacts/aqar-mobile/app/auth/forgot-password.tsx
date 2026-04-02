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
import { AppLogo } from '@/components/AppLogo';
import { Colors } from '@/constants/colors';
import { API_BASE } from '@/constants/api';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) { setError('يرجى إدخال البريد الإلكتروني'); return; }
    if (!/\S+@\S+\.\S+/.test(email.trim())) { setError('البريد الإلكتروني غير صحيح'); return; }
    setLoading(true);
    setError('');
    try {
      await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email.trim() }),
      });
      setSent(true);
    } catch {
      setError('حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topPad + 20 }]} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Feather name="x" size={22} color="rgba(255,255,255,0.7)" />
        </Pressable>

        <View style={styles.logoArea}>
          <AppLogo size={76} />
          <Text style={styles.title}>{sent ? 'تم الإرسال!' : 'نسيت كلمة المرور؟'}</Text>
          <Text style={styles.subtitle}>
            {sent
              ? 'تحقق من بريدك الإلكتروني للحصول على رابط الاسترداد'
              : 'أدخل بريدك الإلكتروني وسنرسل لك رابط الاسترداد'}
          </Text>
        </View>

        <View style={styles.form}>
          {sent ? (
            <>
              <View style={styles.successBox}>
                <Feather name="mail" size={18} color="#10b981" />
                <Text style={styles.successText}>
                  إذا كان البريد مسجلاً لدينا، ستصل رسالة الاسترداد خلال دقائق. تحقق من مجلد البريد العشوائي إن لم تجده.
                </Text>
              </View>
              <Pressable style={styles.resendBtn} onPress={() => { setSent(false); setEmail(''); }}>
                <Text style={styles.resendBtnText}>إعادة الإرسال</Text>
              </Pressable>
            </>
          ) : (
            <>
              {error ? (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" size={14} color={Colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>البريد الإلكتروني</Text>
                <View style={styles.inputWrap}>
                  <Feather name="mail" size={16} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="example@email.com"
                    placeholderTextColor={Colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textAlign="right"
                  />
                </View>
              </View>

              <Pressable
                style={[styles.sendBtn, loading && styles.btnDisabled]}
                onPress={handleSend}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.sendBtnText}>إرسال رابط الاسترداد</Text>
                )}
              </Pressable>
            </>
          )}

          <Pressable style={styles.loginLink} onPress={() => router.replace('/auth/login')}>
            <Text style={styles.loginLinkText}>
              <Text style={styles.loginLinkHighlight}>العودة لتسجيل الدخول</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.navy },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },
  closeBtn: {
    alignSelf: 'flex-end', width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  logoArea: { alignItems: 'center', marginBottom: 28, gap: 10 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.white },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 20 },
  form: { backgroundColor: Colors.white, borderRadius: 24, padding: 24, gap: 14 },
  errorBox: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 10,
    padding: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  errorText: { fontSize: 13, color: Colors.danger, textAlign: 'right', flex: 1 },
  successBox: {
    flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)',
  },
  successText: { fontSize: 13, color: '#065f46', textAlign: 'right', flex: 1, lineHeight: 20 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSub, textAlign: 'right' },
  inputWrap: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: 14,
    paddingHorizontal: 14, height: 50, gap: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  input: { flex: 1, fontSize: 14, color: Colors.text },
  sendBtn: {
    backgroundColor: Colors.teal, borderRadius: 16,
    paddingVertical: 16, alignItems: 'center', marginTop: 4,
  },
  btnDisabled: { opacity: 0.7 },
  sendBtnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  resendBtn: {
    borderWidth: 1.5, borderColor: Colors.teal, borderRadius: 16,
    paddingVertical: 14, alignItems: 'center',
  },
  resendBtnText: { color: Colors.teal, fontWeight: '700', fontSize: 15 },
  loginLink: { alignItems: 'center' },
  loginLinkText: { fontSize: 13, color: Colors.textSub },
  loginLinkHighlight: { color: Colors.teal, fontWeight: '700' },
});
