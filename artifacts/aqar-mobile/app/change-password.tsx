import { Feather } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoading } = useAuth();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user && !isLoading) {
      router.replace('/auth/login');
    }
  }, [user, isLoading]);

  const { mutate: changePassword, isPending } = useMutation({
    mutationFn: async () => {
      if (!currentPassword.trim()) throw new Error('كلمة المرور الحالية مطلوبة');
      if (newPassword.trim().length < 8) throw new Error('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
      if (newPassword !== confirmPassword) throw new Error('كلمتا المرور الجديدتان غير متطابقتين');
      if (currentPassword === newPassword) throw new Error('اختر كلمة مرور جديدة مختلفة عن الحالية');

      return apiFetch<{ message?: string }>(endpoints.password, {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
    },
    onSuccess: () => {
      Alert.alert('تم التحديث', 'تم تغيير كلمة المرور بنجاح');
      router.back();
    },
    onError: (e: Error) => {
      setError(e.message && !e.message.startsWith('HTTP') ? e.message : 'تعذر تغيير كلمة المرور، حاول مرة أخرى');
    },
  });

  if (!user) return null;

  const renderPasswordField = ({
    label,
    value,
    onChangeText,
    show,
    setShow,
    placeholder,
  }: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    show: boolean;
    setShow: (value: boolean) => void;
    placeholder: string;
  }) => (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <Pressable onPress={() => setShow(!show)} hitSlop={8}>
          <Feather name={show ? 'eye-off' : 'eye'} size={16} color={Colors.textMuted} />
        </Pressable>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(next) => {
            onChangeText(next);
            if (error) setError('');
          }}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={!show}
          textAlign="right"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Feather name="lock" size={16} color={Colors.textMuted} />
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable style={styles.saveBtn} onPress={() => changePassword()} disabled={isPending}>
          {isPending ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.saveBtnText}>حفظ</Text>}
        </Pressable>
        <Text style={styles.headerTitle}>تغيير كلمة المرور</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Feather name="shield" size={22} color={Colors.teal} />
          </View>
          <Text style={styles.heroTitle}>أمّن حسابك</Text>
          <Text style={styles.heroSub}>
            استخدم كلمة مرور قوية ومختلفة عن كلمات المرور التي تستعملها في التطبيقات الأخرى.
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={14} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          {renderPasswordField({
            label: 'كلمة المرور الحالية',
            value: currentPassword,
            onChangeText: setCurrentPassword,
            show: showCurrent,
            setShow: setShowCurrent,
            placeholder: 'أدخل كلمة المرور الحالية',
          })}
          {renderPasswordField({
            label: 'كلمة المرور الجديدة',
            value: newPassword,
            onChangeText: setNewPassword,
            show: showNew,
            setShow: setShowNew,
            placeholder: '8 أحرف على الأقل',
          })}
          {renderPasswordField({
            label: 'تأكيد كلمة المرور الجديدة',
            value: confirmPassword,
            onChangeText: setConfirmPassword,
            show: showConfirm,
            setShow: setShowConfirm,
            placeholder: 'أعد كتابة كلمة المرور الجديدة',
          })}
        </View>
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
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  saveBtn: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 64,
    alignItems: 'center',
  },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  body: { padding: 16, gap: 16 },
  heroCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,123,160,0.12)',
  },
  heroTitle: { fontSize: 18, fontWeight: '800', color: Colors.navy },
  heroSub: { fontSize: 13, color: Colors.textSub, lineHeight: 20, textAlign: 'center' },
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
  card: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 18,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSub, textAlign: 'right' },
  inputWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: { flex: 1, fontSize: 14, color: Colors.text },
});
