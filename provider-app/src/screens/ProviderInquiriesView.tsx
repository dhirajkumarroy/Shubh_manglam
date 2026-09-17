import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import colors from '../theme/colors';
import { ProviderApiService } from '../services/api';

interface InquiryItem {
  id: string;
  bookingNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
  customer?: {
    name: string;
    phone: string;
    email: string;
  };
  inquiryDetails?: {
    occasion?: string;
    eventDate?: string;
    guestCount?: number;
    location?: string;
    notes?: string;
    serviceName?: string;
  };
  items?: Array<{
    name: string;
    totalPrice?: number;
  }>;
  vendorNote?: string;
  createdAt: string;
}

export const ProviderInquiriesView: React.FC = () => {
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchInquiries = useCallback(async () => {
    try {
      const data = await ProviderApiService.getVendorInquiries();
      setInquiries(data || []);
    } catch (err: any) {
      console.warn('Error fetching provider inquiries:', err.message);
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

  const handleCall = async (phone: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'Customer phone number is not available.');
      return;
    }
    const url = `tel:${phone.replace(/\s+/g, '')}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Call Error', `Cannot dial ${phone}.`);
    }
  };

  const handleWhatsApp = async (phone: string, customerName: string, serviceName: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'Customer phone number is not available.');
      return;
    }
    const digits = phone.replace(/\D/g, '');
    const cleanNumber = digits.length === 10 ? `91${digits}` : digits;
    const msg = `Hello ${customerName}, thanks for your celebration inquiry regarding "${serviceName}" on Shubh Mangalam. We are pleased to assist you. What are your specific requirements?`;
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('WhatsApp Error', 'Could not open WhatsApp.');
    }
  };

  const handleAccept = async (inquiry: InquiryItem) => {
    try {
      setActionInProgress(inquiry.id);
      await ProviderApiService.respondToInquiry(
        inquiry.id,
        'ACCEPT',
        'We have accepted your inquiry and reserved your requested date.'
      );
      Alert.alert(
        'Inquiry Accepted! 🎉',
        `You have confirmed ${inquiry.customer?.name || 'Customer'}'s request for ${inquiry.inquiryDetails?.occasion || 'the celebration'}. You can now call or message them to finalize the arrangements.`
      );
      // Update local state
      setInquiries((prev) =>
        prev.map((item) =>
          item.id === inquiry.id
            ? { ...item, status: 'CONFIRMED', vendorNote: 'Inquiry Accepted' }
            : item
        )
      );
    } catch (err: any) {
      Alert.alert('Accept Failed', err.message || 'Unable to accept inquiry.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (inquiry: InquiryItem) => {
    Alert.alert(
      'Decline Inquiry',
      `Are you sure you want to decline this request from ${inquiry.customer?.name || 'the customer'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionInProgress(inquiry.id);
              await ProviderApiService.respondToInquiry(
                inquiry.id,
                'REJECT',
                'We are regretfully unavailable on this requested date.'
              );
              Alert.alert('Inquiry Declined', 'The customer has been informed.');
              setInquiries((prev) =>
                prev.map((item) =>
                  item.id === inquiry.id
                    ? { ...item, status: 'REJECTED', vendorNote: 'Declined' }
                    : item
                )
              );
            } catch (err: any) {
              Alert.alert('Decline Failed', err.message || 'Unable to decline inquiry.');
            } finally {
              setActionInProgress(null);
            }
          },
        },
      ]
    );
  };

  const pendingCount = inquiries.filter((i) => i.status === 'PENDING').length;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* Header Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerTop}>
          <Text style={styles.bannerTitle}>📋 Celebration Inquiries</Text>
          <View style={[styles.activeLeadsBadge, pendingCount === 0 && styles.allClearBadge]}>
            <Text style={styles.activeLeadsBadgeText}>
              {pendingCount > 0 ? `${pendingCount} Pending Leads` : 'All Caught Up ✓'}
            </Text>
          </View>
        </View>
        <Text style={styles.bannerSub}>
          Customers in your operating area who requested service quotes or direct partner contact.
        </Text>
      </View>

      {/* Loading State */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading incoming requests...</Text>
        </View>
      ) : inquiries.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📬</Text>
          <Text style={styles.emptyTitle}>No Inquiries Yet</Text>
          <Text style={styles.emptySub}>
            New customer requests for your celebration services will appear here with direct contact details.
          </Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Text style={styles.refreshBtnText}>🔄 Refresh Leads</Text>
          </TouchableOpacity>
        </View>
      ) : (
        inquiries.map((inquiry) => {
          const isPending = inquiry.status === 'PENDING';
          const isAccepted = inquiry.status === 'CONFIRMED';
          const isRejected = inquiry.status === 'REJECTED';
          const isProcessing = actionInProgress === inquiry.id;

          const customerName = inquiry.customer?.name || 'Celebration Customer';
          const phone = inquiry.customer?.phone || '';
          const occasion = inquiry.inquiryDetails?.occasion || 'Celebration';
          const eventDate = inquiry.inquiryDetails?.eventDate || 'Date Not Specified';
          const guestCount = inquiry.inquiryDetails?.guestCount || 50;
          const location = inquiry.inquiryDetails?.location || 'Panipat';
          const serviceName =
            inquiry.inquiryDetails?.serviceName ||
            inquiry.items?.[0]?.name ||
            'Celebration Event Service';
          const customerMessage = inquiry.inquiryDetails?.notes;

          return (
            <View
              key={inquiry.id}
              style={[
                styles.leadCard,
                isAccepted && styles.leadCardAccepted,
                isRejected && styles.leadCardRejected,
              ]}
            >
              {/* Card Top Header */}
              <View style={styles.cardHeader}>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{customerName}</Text>
                  <Text style={styles.cityText}>📍 {location}</Text>
                </View>

                {/* Status Pill */}
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
                    {isPending && '⏳ PENDING'}
                    {isAccepted && '✅ ACCEPTED'}
                    {isRejected && '❌ DECLINED'}
                    {inquiry.status === 'CANCELLED' && '⚪ CANCELLED'}
                  </Text>
                </View>
              </View>

              {/* Occasion & Timing Highlight Bar */}
              <View style={styles.occasionBar}>
                <View style={styles.occasionBadge}>
                  <Text style={styles.occasionBadgeText}>🎉 {occasion}</Text>
                </View>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateBadgeText}>📅 {eventDate}</Text>
                </View>
                <View style={styles.guestBadge}>
                  <Text style={styles.guestBadgeText}>👥 {guestCount} People</Text>
                </View>
              </View>

              {/* Requested Service & Event Details */}
              <View style={styles.detailsBox}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>REQUESTED:</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>
                    {serviceName}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>REF NUMBER:</Text>
                  <Text style={styles.detailRef}>{inquiry.bookingNumber}</Text>
                </View>
              </View>

              {/* Note from customer */}
              {customerMessage ? (
                <View style={styles.messageBox}>
                  <Text style={styles.messageLabel}>Customer Request Note:</Text>
                  <Text style={styles.messageText}>"{customerMessage}"</Text>
                </View>
              ) : null}

              {/* Vendor Note if resolved */}
              {inquiry.vendorNote ? (
                <View style={styles.vendorNoteBox}>
                  <Text style={styles.vendorNoteLabel}>Your Response:</Text>
                  <Text style={styles.vendorNoteText}>{inquiry.vendorNote}</Text>
                </View>
              ) : null}

              {/* PRIMARY ACCEPT / REJECT BUTTONS (For Pending Requests) */}
              {isPending && (
                <View style={styles.decisionRow}>
                  {isProcessing ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ flex: 1, padding: 12 }} />
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.acceptBtn}
                        activeOpacity={0.85}
                        onPress={() => handleAccept(inquiry)}
                      >
                        <Text style={styles.acceptBtnText}>✅ Accept Request</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.rejectBtn}
                        activeOpacity={0.85}
                        onPress={() => handleReject(inquiry)}
                      >
                        <Text style={styles.rejectBtnText}>❌ Decline</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}

              {/* Direct Communication Buttons */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.callBtn}
                  activeOpacity={0.8}
                  onPress={() => handleCall(phone)}
                >
                  <Text style={styles.callBtnText}>📞 Call Customer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.whatsAppBtn}
                  activeOpacity={0.8}
                  onPress={() => handleWhatsApp(phone, customerName, serviceName)}
                >
                  <Text style={styles.whatsAppBtnText}>💬 WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      {/* Pro-Tip Box */}
      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>💡 Quick Response Tip</Text>
        <Text style={styles.tipText}>
          Service partners who accept and reply within 15 minutes have a 4x higher confirmation rate for party & wedding celebrations.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#FDFBF7',
  },
  banner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3E8E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  bannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#881337',
  },
  activeLeadsBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  allClearBadge: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  activeLeadsBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  bannerSub: {
    fontSize: 12,
    color: '#78716C',
    lineHeight: 17,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#78716C',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7E0D8',
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#78716C',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  refreshBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  refreshBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  leadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#F3E8E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  leadCardAccepted: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  leadCardRejected: {
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2',
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1917',
  },
  cityText: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '500',
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
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
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  statusPillTextAccepted: {
    color: '#15803D',
  },
  statusPillTextRejected: {
    color: '#BE123C',
  },
  occasionBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
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
  detailsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    width: 85,
  },
  detailValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'right',
  },
  detailRef: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  messageBox: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  messageLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 12,
    color: '#78350F',
    fontStyle: 'italic',
    lineHeight: 17,
  },
  vendorNoteBox: {
    backgroundColor: '#F3F4F6',
    borderLeftWidth: 3,
    borderLeftColor: '#4B5563',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  vendorNoteLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#374151',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  vendorNoteText: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '500',
  },
  decisionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: '#16A34A',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F43F5E',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: {
    color: '#E11D48',
    fontSize: 13,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  callBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsAppBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  tipBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    marginTop: 8,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 17,
  },
});
