import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import colors from '../../theme/colors';
import { bookingService, CustomerInquiryItem } from '../../api/booking.service';
import { openDialer, openWhatsApp } from '../../utils/contact';

export const CustomerInquiriesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [inquiries, setInquiries] = useState<CustomerInquiryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchInquiries = useCallback(async () => {
    try {
      const list = await bookingService.getCustomerInquiries();
      setInquiries(list);
    } catch (err: any) {
      console.warn('Failed to load customer inquiries:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInquiries();
  };

  const handleCancel = (inquiryId: string) => {
    Alert.alert(
      'Cancel Inquiry',
      'Are you sure you want to cancel this celebration inquiry?',
      [
        { text: 'Keep Inquiry', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingService.cancelInquiry(inquiryId);
              Alert.alert('Inquiry Cancelled', 'Your request has been cancelled.');
              fetchInquiries();
            } catch (err: any) {
              Alert.alert('Cancel Failed', err.response?.data?.message || 'Unable to cancel.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Celebration Inquiries</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Text style={styles.refreshBtnText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>🎪 Direct Partner Requests</Text>
          <Text style={styles.bannerSub}>
            Track real-time responses from local service providers for your upcoming functions.
          </Text>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.centerText}>Loading your inquiries...</Text>
          </View>
        ) : inquiries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Inquiries Yet</Text>
            <Text style={styles.emptySub}>
              Browse Halwai, Decorators, Beauticians, or DJs and tap "Send Inquiry" to connect with vendors.
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => navigation.navigate('CategoryDiscoveryScreen')}
            >
              <Text style={styles.browseBtnText}>Explore Services →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          inquiries.map((inquiry) => {
            const isPending = inquiry.status === 'PENDING';
            const isAccepted = inquiry.status === 'CONFIRMED';
            const isRejected = inquiry.status === 'REJECTED';
            const isCancelled = inquiry.status === 'CANCELLED';

            const vendorName = inquiry.vendor?.businessName || 'Service Provider';
            const phone = inquiry.vendor?.phone || '';
            const occasion = inquiry.inquiryDetails?.occasion || 'Celebration';
            const eventDate = inquiry.inquiryDetails?.eventDate || 'Date Not Specified';
            const guestCount = inquiry.inquiryDetails?.guestCount || 50;
            const location = inquiry.inquiryDetails?.location || 'Panipat';
            const serviceName =
              inquiry.inquiryDetails?.serviceName ||
              inquiry.items?.[0]?.name ||
              'Celebration Event Service';

            return (
              <View
                key={inquiry.id}
                style={[
                  styles.card,
                  isAccepted && styles.cardAccepted,
                  isRejected && styles.cardRejected,
                ]}
              >
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vendorName}>{vendorName}</Text>
                    <Text style={styles.locationText}>📍 {location}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      isAccepted && styles.statusPillAccepted,
                      isRejected && styles.statusPillRejected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isAccepted && styles.statusPillTextAccepted,
                        isRejected && styles.statusPillTextRejected,
                      ]}
                    >
                      {isPending && '⏳ PENDING RESPONSE'}
                      {isAccepted && '✅ ACCEPTED'}
                      {isRejected && '❌ DECLINED'}
                      {isCancelled && '⚪ CANCELLED'}
                    </Text>
                  </View>
                </View>

                {/* Occasion & Timing */}
                <View style={styles.occasionRow}>
                  <View style={styles.occasionBadge}>
                    <Text style={styles.occasionBadgeText}>🎉 {occasion}</Text>
                  </View>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateBadgeText}>📅 {eventDate}</Text>
                  </View>
                  <View style={styles.guestBadge}>
                    <Text style={styles.guestBadgeText}>👥 {guestCount} Guests</Text>
                  </View>
                </View>

                {/* Service requested */}
                <View style={styles.serviceBox}>
                  <Text style={styles.serviceLabel}>SERVICE REQUESTED:</Text>
                  <Text style={styles.serviceName}>{serviceName}</Text>
                  <Text style={styles.refNum}>Ref: {inquiry.bookingNumber}</Text>
                </View>

                {/* Notes if present */}
                {inquiry.inquiryDetails?.notes ? (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText}>"{inquiry.inquiryDetails.notes}"</Text>
                  </View>
                ) : null}

                {/* Vendor Reply Note */}
                {inquiry.vendorNote ? (
                  <View
                    style={[
                      styles.vendorReplyBox,
                      isAccepted ? styles.vendorReplyBoxAccepted : styles.vendorReplyBoxRejected,
                    ]}
                  >
                    <Text style={styles.vendorReplyTitle}>
                      {isAccepted ? '✓ Provider Confirmation Message:' : 'Provider Note:'}
                    </Text>
                    <Text style={styles.vendorReplyText}>{inquiry.vendorNote}</Text>
                  </View>
                ) : null}

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.callBtn}
                    activeOpacity={0.8}
                    onPress={() => openDialer(phone)}
                  >
                    <Text style={styles.callBtnText}>📞 Call Provider</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.whatsAppBtn}
                    activeOpacity={0.8}
                    onPress={() =>
                      openWhatsApp(
                        phone,
                        `Hello ${vendorName}, following up on my inquiry for ${occasion} on ${eventDate} via Shubh Mangalam.`
                      )
                    }
                  >
                    <Text style={styles.whatsAppBtnText}>💬 WhatsApp</Text>
                  </TouchableOpacity>

                  {isPending && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      activeOpacity={0.8}
                      onPress={() => handleCancel(inquiry.id)}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 24,
    color: '#1F2937',
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  refreshBtn: {
    padding: 6,
  },
  refreshBtnText: {
    fontSize: 18,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  banner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#9A3412',
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
  },
  centerBox: {
    padding: 40,
    alignItems: 'center',
  },
  centerText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  browseBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  browseBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardAccepted: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  cardRejected: {
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusPillAccepted: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  statusPillRejected: {
    backgroundColor: '#FFE4E6',
    borderColor: '#FDA4AF',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  statusPillTextAccepted: {
    color: '#15803D',
  },
  statusPillTextRejected: {
    color: '#BE123C',
  },
  occasionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  occasionBadge: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  occasionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
  },
  dateBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  guestBadge: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  guestBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7E22CE',
  },
  serviceBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  serviceLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    marginBottom: 2,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  refNum: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  notesBox: {
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  notesText: {
    fontSize: 12,
    color: '#78350F',
    fontStyle: 'italic',
  },
  vendorReplyBox: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  vendorReplyBoxAccepted: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  vendorReplyBoxRejected: {
    backgroundColor: '#FFE4E6',
    borderColor: '#FDA4AF',
  },
  vendorReplyTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 2,
  },
  vendorReplyText: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  callBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  whatsAppBtn: {
    flex: 1,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  whatsAppBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
});

export default CustomerInquiriesScreen;
