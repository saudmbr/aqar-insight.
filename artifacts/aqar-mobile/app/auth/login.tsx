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
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('يرجى ملء جميع الحقول');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(username.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message && !e.message.startsWith('HTTP') ? e.message : 'حدث خطأ في الاتصال، حاول مرة أخرى');
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
        {/* Close Button */}
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Feather name="x" size={22} color="rgba(255,255,255,0.7)" />
        </Pressable>

        {/* Logo */}
        <View style={styles.logoArea}>
          <AppLogo size={88} />
          <Text style={styles.appName}>عقار إنسايت</Text>
          <Text style={styles.tagline}>منصة ذكية للعقار السعودي</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>تسجيل الدخول</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>اسم المستخدم أو البريد</Text>
            <View style={styles.inputWrap}>
              <Feather name="user" size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="admin أو البريد الإلكتروني"
                placeholderTextColor={Colors.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                textAlign="right"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>كلمة المرور</Text>
            <View style={styles.inputWrap}>
              <Pressable onPress={() => setShowPass(!showPass)} hitSlop={8}>
                <Feather name={showPass ? 'eye-off' : 'eye'} size={16} color={Colors.textMuted} />
              </Pressable>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                textAlign="right"
              />
            </View>
          </View>

          <Pressable
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.loginBtnText}>دخول إلى حسابي</Text>
            )}
          </Pressable>

          <Pressable style={styles.forgotLink} onPress={() => router.push('/auth/forgot-password')}>
            <Text style={styles.forgotLinkText}>نسيت كلمة المرور؟</Text>
          </Pressable>

          <Pressable style={styles.registerLink} onPress={() => router.replace('/auth/register')}>
            <Text style={styles.registerLinkText}>
              ليس لديك حساب؟ <Text style={styles.registerLinkHighlight}>أنشئ حساباً مجاناً</Text>
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
    alignSelf: 'flex-end',
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 32,
  },
  logoArea: { alignItems: 'center', marginBottom: 40, gap: 8 },
  appName: { fontSize: 26, fontWeight: '900', color: Colors.white, textAlign: 'center' },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },
  form: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    gap: 16,
  },
  formTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, textAlign: 'right', marginBottom: 4 },
  errorBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  errorText: { fontSize: 13, color: Colors.danger, textAlign: 'right', flex: 1 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSub, textAlign: 'right' },
  inputWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: { flex: 1, fontSize: 14, color: Colors.text },
  loginBtn: {
    backgroundColor: Colors.teal,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  forgotLink: { alignItems: 'flex-start' },
  forgotLinkText: { fontSize: 13, color: Colors.teal, fontWeight: '600' },
  registerLink: { alignItems: 'center', marginTop: 4 },
  registerLinkText: { fontSize: 13, color: Colors.textSub, textAlign: 'center' },
  registerLinkHighlight: { color: Colors.teal, fontWeight: '700' },
});
