import { Feather } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { apiFetch, endpoints } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [error, setError] = useState('');

  const { mutate: saveProfile, isPending } = useMutation({
    mutationFn: async () => {
      if (!fullName.trim()) throw new Error('الاسم الكامل مطلوب');
      if (!username.trim() || username.trim().length < 3) throw new Error('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
      if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) throw new Error('البريد الإلكتروني غير صحيح');
      return apiFetch<Record<string, any>>(endpoints.profile, {
        method: 'PUT',
        body: JSON.stringify({
          fullName: fullName.trim(),
          username: username.trim(),
          email: email.trim(),
        }),
      });
    },
    onSuccess: (data) => {
      if (user) {
        updateUser({
          ...user,
          fullName: data.fullName ?? fullName.trim(),
          username: data.username ?? username.trim(),
          email: data.email ?? email.trim(),
        });
      }
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      Alert.alert('تم الحفظ', 'تم تحديث بياناتك بنجاح');
      router.back();
    },
    onError: (e: Error) => {
      setError(e.message && !e.message.startsWith('HTTP') ? e.message : 'حدث خطأ، حاول مرة أخرى');
    },
  });

  if (!user) {
    router.replace('/auth/login');
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable style={styles.saveBtn} onPress={() => saveProfile()} disabled={isPending}>
          {isPending ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>حفظ</Text>
          )}
        </Pressable>
        <Text style={styles.headerTitle}>تعديل الملف الشخصي</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user.fullName ?? user.username)[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.avatarHint}>الحرف الأول من اسمك</Text>
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={14} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Fields */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>البيانات الشخصية</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>الاسم الكامل</Text>
            <View style={styles.inputWrap}>
              <Feather name="user" size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={(v) => { setFullName(v); setError(''); }}
                placeholder="محمد أحمد"
                placeholderTextColor={Colors.textMuted}
                textAlign="right"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>اسم المستخدم</Text>
            <View style={styles.inputWrap}>
              <Feather name="at-sign" size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={(v) => { setUsername(v); setError(''); }}
                placeholder="username"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                textAlign="right"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>البريد الإلكتروني</Text>
            <View style={styles.inputWrap}>
              <Feather name="mail" size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(v) => { setEmail(v); setError(''); }}
                placeholder="example@email.com"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                textAlign="right"
              />
            </View>
          </View>
        </View>

        <Pressable
          style={styles.changePassBtn}
          onPress={() => router.push('/change-password' as any)}
        >
          <Text style={styles.changePassText}>تغيير كلمة المرور</Text>
          <Feather name="lock" size={16} color={Colors.teal} />
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  saveBtn: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 12, minWidth: 64, alignItems: 'center',
  },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  body: { padding: 16, gap: 16 },
  avatarSection: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.teal,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: Colors.white },
  avatarHint: { fontSize: 12, color: Colors.textMuted },
  errorBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  errorText: { fontSize: 13, color: Colors.danger, textAlign: 'right', flex: 1 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20, padding: 18,
    gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, textAlign: 'right' },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSub, textAlign: 'right' },
  inputWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14, paddingHorizontal: 14,
    height: 50, gap: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  input: { flex: 1, fontSize: 14, color: Colors.text },
  changePassBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.teal + '40',
  },
  changePassText: { fontSize: 14, color: Colors.teal, fontWeight: '600' },
});
