import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { apiFetch, endpoints } from '@/constants/api';

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleReset = async () => {
    if (!password || password.length < 8) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (password !== confirm) {
      Alert.alert('خطأ', 'كلمتا المرور غير متطابقتين');
      return;
    }
    if (!token) {
      Alert.alert('خطأ', 'رابط إعادة التعيين غير صالح');
      return;
    }
    setLoading(true);
    try {
      await apiFetch(endpoints.resetPassword, {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
    } catch (e: any) {
      Alert.alert('خطأ', e.message ?? 'فشل إعادة تعيين كلمة المرور. قد يكون الرابط منتهي الصلاحية.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.screen, { paddingTop: topPad }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={20} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>إعادة تعيين كلمة المرور</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.content}>
        {done ? (
          <View style={styles.successBox}>
            <View style={styles.successIcon}>
              <Feather name="check-circle" size={48} color={Colors.success} />
            </View>
            <Text style={styles.successTitle}>تم تغيير كلمة المرور بنجاح!</Text>
            <Text style={styles.successText}>يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة</Text>
            <Pressable style={styles.loginBtn} onPress={() => router.replace('/auth/login')}>
              <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.iconWrap}>
              <Feather name="lock" size={36} color={Colors.teal} />
            </View>
            <Text style={styles.title}>كلمة مرور جديدة</Text>
            <Text style={styles.sub}>أدخل كلمة مرورك الجديدة — يجب أن تكون 8 أحرف على الأقل</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>كلمة المرور الجديدة</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل كلمة مرور قوية..."
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textAlign="right"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>تأكيد كلمة المرور</Text>
              <TextInput
                style={styles.input}
                placeholder="أعد إدخال كلمة المرور..."
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                textAlign="right"
                autoCapitalize="none"
              />
            </View>

            <Pressable style={[styles.btn, loading && styles.btnDisabled]} onPress={handleReset} disabled={loading}>
              {loading ? (
                <Text style={styles.btnText}>جارٍ التغيير...</Text>
              ) : (
                <>
                  <Feather name="check" size={18} color={Colors.white} />
                  <Text style={styles.btnText}>تعيين كلمة المرور</Text>
                </>
              )}
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.navy, flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 16, paddingTop: 12, gap: 12,
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: Colors.white, textAlign: 'center' },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, padding: 24, gap: 16, alignItems: 'center' },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: `${Colors.teal}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.navy, textAlign: 'center' },
  sub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  inputGroup: { width: '100%', gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, textAlign: 'right' },
  input: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: Colors.text,
  },
  btn: {
    backgroundColor: Colors.teal, borderRadius: 16, paddingVertical: 16, width: '100%',
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  successBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  successIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: `${Colors.success}15`, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 20, fontWeight: '800', color: Colors.navy, textAlign: 'center' },
  successText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  loginBtn: { backgroundColor: Colors.teal, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  loginBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});
