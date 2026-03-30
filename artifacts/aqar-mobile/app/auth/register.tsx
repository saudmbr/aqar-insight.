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

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleRegister = async () => {
    if (!fullName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      setError('يرجى ملء جميع الحقول');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register({ fullName: fullName.trim(), username: username.trim(), email: email.trim(), password });
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message?.includes('409') ? 'اسم المستخدم أو البريد مستخدم بالفعل' : 'حدث خطأ، حاول مرة أخرى');
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

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {[
            { label: 'الاسم الكامل', value: fullName, setter: setFullName, placeholder: 'محمد عبدالله', icon: 'user' },
            { label: 'اسم المستخدم', value: username, setter: setUsername, placeholder: 'username', icon: 'at-sign', lower: true },
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

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>كلمة المرور</Text>
            <View style={styles.inputWrap}>
              <Pressable onPress={() => setShowPass(!showPass)} hitSlop={8}>
                <Feather name={showPass ? 'eye-off' : 'eye'} size={16} color={Colors.textMuted} />
              </Pressable>
              <TextInput
                style={styles.input}
                placeholder="6 أحرف على الأقل"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                textAlign="right"
              />
            </View>
          </View>

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
    marginBottom: 24,
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
