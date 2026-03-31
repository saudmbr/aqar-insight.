import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { apiFetch, endpoints, formatPrice } from '@/constants/api';

const REQUEST_TYPE_LABELS: Record<string, string> = {
  property: '🏡 طلب عقار',
  service: '🔧 طلب خدمة',
  marketer: '👤 طلب مسوّق',
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  open: { label: 'مفتوح', color: Colors.success },
  processing: { label: 'قيد المعالجة', color: Colors.gold },
  closed: { label: 'مغلق', color: Colors.textMuted },
};

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoValue}>{value}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoIcon}>
        <Feather name={icon as any} size={14} color={Colors.teal} />
      </View>
    </View>
  );
}

export default function RequestDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const { data: request, isLoading, error } = useQuery<any>({
    queryKey: ['request', id],
    queryFn: () => apiFetch<any>(endpoints.request(Number(id))),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: topPad }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}><Feather name="arrow-right" size={22} color={Colors.white} /></Pressable>
          <Text style={styles.headerTitle}>تفاصيل الطلب</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}><Text style={styles.centerText}>جارٍ التحميل...</Text></View>
      </View>
    );
  }

  if (error || !request) {
    return (
      <View style={[styles.screen, { paddingTop: topPad }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}><Feather name="arrow-right" size={22} color={Colors.white} /></Pressable>
          <Text style={styles.headerTitle}>تفاصيل الطلب</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}><Text style={styles.centerText}>لم يتم العثور على الطلب</Text></View>
      </View>
    );
  }

  const status = STATUS_META[request.status] ?? STATUS_META.open;

  const openWhatsapp = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    const url = `https://wa.me/${clean.startsWith('966') ? clean : `966${clean.replace(/^0/, '')}`}`;
    Linking.openURL(url);
  };

  const openPhone = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <View style={[styles.screen, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>تفاصيل الطلب</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad + 100, gap: 14, paddingHorizontal: 16, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Card */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardHeader}>
            <View style={[styles.statusBadge, { backgroundColor: `${status.color}15`, borderColor: status.color }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
            <Text style={styles.requestType}>{REQUEST_TYPE_LABELS[request.requestType] ?? request.requestType}</Text>
          </View>
          <Text style={styles.requestTitle}>{request.title}</Text>
          {request.details && <Text style={styles.requestDetails}>{request.details}</Text>}
        </View>

        {/* Location & Budget */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>تفاصيل الطلب</Text>
          {request.region && <InfoRow icon="map" label="المنطقة" value={request.region} />}
          {request.city && <InfoRow icon="map-pin" label="المدينة" value={request.city} />}
          {request.district && <InfoRow icon="home" label="الحي" value={request.district} />}
          {request.category && <InfoRow icon="tag" label="الفئة" value={request.category} />}
          {(request.budgetMin || request.budgetMax) && (
            <InfoRow
              icon="dollar-sign"
              label="الميزانية"
              value={`${request.budgetMin ? formatPrice(request.budgetMin) : '—'} — ${request.budgetMax ? formatPrice(request.budgetMax) : '—'}`}
            />
          )}
          <InfoRow icon="calendar" label="تاريخ النشر" value={new Date(request.createdAt).toLocaleDateString('ar-SA')} />
          {request.marketerName && <InfoRow icon="user" label="المعلن" value={request.marketerName} />}
        </View>

        {/* Contact */}
        {(request.contactInfo || request.contactMethod) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>معلومات التواصل</Text>
            {request.contactMethod && <InfoRow icon="message-circle" label="طريقة التواصل" value={
              request.contactMethod === 'whatsapp' ? 'واتساب' :
              request.contactMethod === 'phone' ? 'هاتف' :
              request.contactMethod === 'email' ? 'بريد إلكتروني' : request.contactMethod
            } />}
            {request.contactInfo && <InfoRow icon="phone" label="التواصل" value={request.contactInfo} />}
          </View>
        )}
      </ScrollView>

      {/* Sticky Contact Actions */}
      {request.contactInfo && (
        <View style={[styles.contactBar, { paddingBottom: botPad + 8 }]}>
          {(request.contactMethod === 'whatsapp' || !request.contactMethod) && (
            <Pressable style={[styles.contactBtn, styles.whatsappBtn]} onPress={() => openWhatsapp(request.contactInfo)}>
              <Feather name="message-circle" size={18} color={Colors.white} />
              <Text style={styles.contactBtnText}>واتساب</Text>
            </Pressable>
          )}
          <Pressable style={[styles.contactBtn, styles.phoneBtn]} onPress={() => openPhone(request.contactInfo)}>
            <Feather name="phone" size={18} color={Colors.white} />
            <Text style={styles.contactBtnText}>اتصال</Text>
          </Pressable>
        </View>
      )}
    </View>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerText: { fontSize: 16, color: Colors.textMuted },
  mainCard: { backgroundColor: Colors.card, borderRadius: 18, padding: 16, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  mainCardHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, justifyContent: 'space-between' },
  statusBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '700' },
  requestType: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  requestTitle: { fontSize: 18, fontWeight: '800', color: Colors.navy, textAlign: 'right' },
  requestDetails: { fontSize: 14, color: Colors.textSub, textAlign: 'right', lineHeight: 22 },
  card: { backgroundColor: Colors.card, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, textAlign: 'right', padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, gap: 10 },
  infoIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: `${Colors.teal}10`, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { flex: 1, fontSize: 12, color: Colors.textMuted, textAlign: 'right' },
  infoValue: { fontSize: 13, fontWeight: '600', color: Colors.text, textAlign: 'left', maxWidth: '55%' },
  contactBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border, padding: 12, flexDirection: 'row-reverse', gap: 10 },
  contactBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6 },
  whatsappBtn: { backgroundColor: '#25D366' },
  phoneBtn: { backgroundColor: Colors.teal },
  contactBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});
