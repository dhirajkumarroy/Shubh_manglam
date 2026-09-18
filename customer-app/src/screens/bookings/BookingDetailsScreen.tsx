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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import colors from '../../theme/colors';
import { bookingService, CustomerBooking } from '../../api/booking.service';
import { openDialer, openWhatsApp } from '../../utils/contact';
import { AppIcon } from '../../components/AppIcon';
import { StatusBadge } from '../../components/StatusBadge';

export const BookingDetailsScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { bookingId } = route.params || {};

  const [booking, setBooking] = useState<CustomerBooking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchDetails = useCallback(async () => {
    if (!bookingId) return;
    try {
      const data = await bookingService.getBookingDetails(bookingId);
      setBooking(data);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load booking details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetails();
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this confirmed booking?',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingService.cancelBooking(bookingId, 'Cancelled by user from app');
              Alert.alert('Booking Cancelled', 'Your booking has been cancelled.');
              fetchDetails();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to cancel booking.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Booking Not Found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isConfirmed = booking.status === 'CONFIRMED';
  const isCancellable = booking.status === 'CONFIRMED' || booking.status === 'PENDING';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backNavBtn, { flexDirection: 'row', alignItems: 'center' }]}>
          <AppIcon name="arrow-back" size={18} color="#1F2937" />
          <Text style={[styles.backNavText, { marginLeft: 4 }]}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Booking #{booking.bookingNumber}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Status Confirmation Banner */}
        <View style={styles.statusBanner}>
          <View style={styles.statusHeaderRow}>
            <StatusBadge status={booking.status} />
            <View style={styles.paymentPill}>
              <Text style={styles.paymentPillText}>PAYMENT: PENDING</Text>
            </View>
          </View>
          <Text style={styles.statusSubtext}>
            Agreed services and financial snapshot are preserved permanently.
          </Text>
        </View>

        {/* Vendor Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Vendor Information</Text>
          <View style={styles.vendorRow}>
            <View style={styles.vendorAvatar}>
              <Text style={styles.avatarText}>
                {booking.vendor?.businessName?.charAt(0)?.toUpperCase() || 'V'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vendorName}>{booking.vendor?.businessName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <AppIcon name="location-outline" size={13} color="#D97706" />
                <Text style={[styles.vendorCity, { marginLeft: 4 }]}>{booking.vendor?.city || 'Local Area'}</Text>
              </View>
            </View>
          </View>

          {booking.vendor?.phone && (
            <View style={styles.contactRow}>
              <TouchableOpacity
                style={[styles.contactBtn, styles.callBtn, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
                onPress={() => openDialer(booking.vendor.phone)}
              >
                <AppIcon name="call" size={13} color="#881337" />
                <Text style={[styles.contactBtnText, { marginLeft: 6 }]}>Call Vendor</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contactBtn, styles.waBtn, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
                onPress={() =>
                  openWhatsApp(
                    booking.vendor.phone,
                    `Hello, regarding our confirmed booking #${booking.bookingNumber}.`
                  )
                }
              >
                <AppIcon name="logo-whatsapp" size={13} color="#16A34A" />
                <Text style={[styles.waBtnText, { marginLeft: 6 }]}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Event Details */}
        {booking.event && (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Event Details</Text>
            <Text style={styles.eventTitle}>{booking.event.title}</Text>
            <View style={styles.eventInfoRow}>
              <Text style={styles.eventInfoLabel}>Date:</Text>
              <Text style={styles.eventInfoValue}>
                {new Date(booking.event.eventDate).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
            {booking.event.guestCount && (
              <View style={styles.eventInfoRow}>
                <Text style={styles.eventInfoLabel}>Guest Count:</Text>
                <Text style={styles.eventInfoValue}>{booking.event.guestCount} Guests</Text>
              </View>
            )}
            {booking.event.addressLine1 && (
              <View style={styles.eventInfoRow}>
                <Text style={styles.eventInfoLabel}>Location:</Text>
                <Text style={styles.eventInfoValue}>
                  {booking.event.addressLine1}, {booking.event.city}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Historical Snapshot Items */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Snapshotted Services</Text>
          <Text style={styles.snapshotNotice}>
            🔒 Historical items locked at the time of quotation acceptance:
          </Text>

          {booking.items && booking.items.length > 0 ? (
            booking.items.map((item, index) => (
              <View key={item.id || index} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.notes && <Text style={styles.itemNote}>{item.notes}</Text>}
                  <Text style={styles.itemQtyPrice}>
                    Qty: {item.quantity} × ₹{Number(item.unitPrice).toLocaleString('en-IN')}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  ₹{Number(item.totalPrice).toLocaleString('en-IN')}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyItemsText}>No individual items found.</Text>
          )}
        </View>

        {/* Pricing Summary */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Financial Agreement</Text>

          <View style={styles.financialRow}>
            <Text style={styles.financialLabel}>Subtotal</Text>
            <Text style={styles.financialValue}>₹{Number(booking.subtotal).toLocaleString('en-IN')}</Text>
          </View>

          {Number(booking.discount) > 0 && (
            <View style={styles.financialRow}>
              <Text style={[styles.financialLabel, { color: colors.success }]}>Agreed Discount</Text>
              <Text style={[styles.financialValue, { color: colors.success }]}>
                -₹{Number(booking.discount).toLocaleString('en-IN')}
              </Text>
            </View>
          )}

          {Number(booking.tax) > 0 && (
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Tax & GST</Text>
              <Text style={styles.financialValue}>+₹{Number(booking.tax).toLocaleString('en-IN')}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Amount</Text>
            <Text style={styles.grandTotalValue}>₹{Number(booking.total).toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.paymentInfoBox}>
            <Text style={styles.paymentInfoTitle}>💳 Payment Status: PENDING</Text>
            <Text style={styles.paymentInfoText}>
              Payment gateway integration is planned for the next milestone. No immediate payment is required online.
            </Text>
          </View>
        </View>

        {/* Cancel Action */}
        {isCancellable && (
          <TouchableOpacity style={styles.cancelBookingBtn} onPress={handleCancel}>
            <Text style={styles.cancelBookingBtnText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.card,
  },
  backNavBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backNavText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    fontFamily: 'monospace',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  statusBanner: {
    backgroundColor: '#DCFCE7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  statusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
  },
  paymentPill: {
    backgroundColor: colors.accentGoldBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paymentPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accentGold,
  },
  statusSubtext: {
    fontSize: 12,
    color: '#166534',
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vendorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentGoldBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.accentGold,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  vendorCity: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  contactBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  callBtn: {
    backgroundColor: colors.backgroundWarm,
    borderColor: colors.border,
  },
  contactBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  waBtn: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  waBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  eventInfoRow: {
    flexDirection: 'row',
    marginVertical: 3,
  },
  eventInfoLabel: {
    width: 90,
    fontSize: 13,
    color: colors.textMuted,
  },
  eventInfoValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  snapshotNotice: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  itemNote: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemQtyPrice: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginLeft: 10,
  },
  emptyItemsText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  financialLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  financialValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  grandTotalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  paymentInfoBox: {
    backgroundColor: colors.backgroundWarm,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentInfoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.accentGold,
  },
  paymentInfoText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  cancelBookingBtn: {
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.card,
    marginTop: 10,
  },
  cancelBookingBtnText: {
    color: colors.error,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default BookingDetailsScreen;
