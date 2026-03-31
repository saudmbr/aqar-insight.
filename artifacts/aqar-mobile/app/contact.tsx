import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

const CHANNELS = [
  {
    icon: 'mail' as const,
    label: 'البريد الإلكتروني',
    value: 'support@aqarinsight.com',
    color: Colors.teal,
    onPress: () => Linking.openURL('mailto:support@aqarinsight.com'),
  },
  {
    icon: 'message-circle' as const,
    label: 'واتساب',
    value: '+966 50 000 0000',
    color: '#25D366',
    onPress: () => Linking.openURL('https://wa.me/966500000000'),
  },
  {
    icon: 'twitter' as const,
    label: 'تويتر / X',
    value: '@AqarInsight',
    color: '#1DA1F2',
    onPress: () => Linking.openURL('https://twitter.com/AqarInsight'),
  },
];

export default function ContactScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!name.trim() || !subject.trim() || !message.trim()) {
      Alert.alert('تنبيه', 'يرجى ملء جميع الحقول');
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSending(false);
    setName(''); setSubject(''); setMessage('');
    Alert.alert('تم الإرسال', 'تم استلام رسالتك وسنتواصل معك خلال 24 ساعة');
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={{ width: 38 }} />
        <Text style={styles.headerTitle}>تواصل معنا</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Feather name="headphones" size={32} color={Colors.teal} />
          </View>
          <Text style={styles.heroTitle}>فريق الدعم جاهز لمساعدتك</Text>
          <Text style={styles.heroSub}>نرد على جميع الاستفسارات خلال 24 ساعة</Text>
        </View>

        {/* Channels */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>قنوات التواصل المباشر</Text>
          {CHANNELS.map((ch) => (
            <Pressable
              key={ch.label}
              style={({ pressed }) => [styles.channelRow, pressed && styles.pressed]}
              onPress={ch.onPress}
            >
              <Feather name="external-link" size={16} color={Colors.textMuted} />
              <View style={styles.channelInfo}>
                <Text style={styles.channelValue}>{ch.value}</Text>
                <Text style={styles.channelLabel}>{ch.label}</Text>
              </View>
              <View style={[styles.channelIcon, { backgroundColor: ch.color + '18' }]}>
                <Feather name={ch.icon} size={18} color={ch.color} />
              </View>
            </Pressable>
          ))}
        </View>

        {/* Contact Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>أرسل رسالة</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>الاسم</Text>
            <View style={styles.inputWrap}>
              <Feather name="user" size={15} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="اسمك الكامل"
                placeholderTextColor={Colors.textMuted}
                textAlign="right"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>الموضوع</Text>
            <View style={styles.inputWrap}>
              <Feather name="edit-3" size={15} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder="موضوع رسالتك"
                placeholderTextColor={Colors.textMuted}
                textAlign="right"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>الرسالة</Text>
            <TextInput
              style={styles.textarea}
              value={message}
              onChangeText={setMessage}
              placeholder="اكتب رسالتك هنا..."
              placeholderTextColor={Colors.textMuted}
              textAlign="right"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          <Pressable
            style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Feather name="send" size={16} color={Colors.white} />
                <Text style={styles.sendBtnText}>إرسال الرسالة</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Working Hours */}
        <View style={styles.hoursCard}>
          <Feather name="clock" size={18} color={Colors.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.hoursTitle}>ساعات العمل</Text>
            <Text style={styles.hoursText}>الأحد – الخميس: 9 ص – 6 م</Text>
            <Text style={styles.hoursText}>الجمعة – السبت: 10 ص – 4 م</Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
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
  body: { padding: 16, gap: 16 },
  hero: {
    alignItems: 'center', gap: 8,
    paddingVertical: 24,
  },
  heroIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(15,123,160,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  heroSub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20, padding: 18, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, textAlign: 'right' },
  channelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  pressed: { opacity: 0.7 },
  channelIcon: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  channelInfo: { flex: 1 },
  channelLabel: { fontSize: 12, color: Colors.textMuted, textAlign: 'right' },
  channelValue: { fontSize: 14, fontWeight: '600', color: Colors.text, textAlign: 'right' },
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
  textarea: {
    backgroundColor: Colors.background,
    borderRadius: 14, padding: 14,
    fontSize: 14, color: Colors.text,
    minHeight: 110, borderWidth: 1, borderColor: Colors.border,
  },
  sendBtn: {
    backgroundColor: Colors.teal,
    borderRadius: 16, paddingVertical: 15,
    flexDirection: 'row-reverse',
    alignItems: 'center', justifyContent: 'center',
    gap: 8,
  },
  sendBtnDisabled: { opacity: 0.7 },
  sendBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  hoursCard: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.white,
    borderRadius: 16, padding: 16, gap: 12,
    alignItems: 'flex-start',
    borderWidth: 1, borderColor: Colors.gold + '30',
  },
  hoursTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, textAlign: 'right', marginBottom: 4 },
  hoursText: { fontSize: 13, color: Colors.textMuted, textAlign: 'right', lineHeight: 20 },
});
