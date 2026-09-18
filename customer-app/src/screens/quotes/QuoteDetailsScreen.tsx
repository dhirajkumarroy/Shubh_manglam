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
import { quoteService, Quote, QuoteStatus } from '../../api/quote.service';
import RequestRevisionModal from './RequestRevisionModal';
import BookingConfirmationModal from './BookingConfirmationModal';
import { openDialer, openWhatsApp } from '../../utils/contact';
import { AppIcon } from '../../components/AppIcon';
import { StatusBadge } from '../../components/StatusBadge';

export const QuoteDetailsScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { quoteId } = route.params || {};

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Modals
  const [revisionModalVisible, setRevisionModalVisible] = useState(false);
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!quoteId) return;
    try {
      const data = await quoteService.getQuoteDetails(quoteId);
      setQuote(data);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load quote details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [quoteId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetails();
  };

  const handleRevisionSubmit = async (notes: string) => {
    await quoteService.requestRevision(quoteId, notes);
    Alert.alert('Revision Sent', 'The vendor has been notified with your requested changes.');
    fetchDetails();
  };

  const handleAcceptConfirm = async () => {
    const res = await quoteService.acceptQuote(quoteId);
    Alert.alert('Booking Confirmed!', 'Your booking has been created successfully with the vendor.');
    fetchDetails();
    if (res.booking?.id) {
      navigation.navigate('BookingDetailsScreen', { bookingId: res.booking.id });
    }
  };

  const handleReject = () => {
    Alert.alert(
      'Decline Quote',
      'Are you sure you want to decline this quote from the vendor?',
      [
        { text: 'Keep Quote', style: 'cancel' },
        {
          text: 'Yes, Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await quoteService.rejectQuote(quoteId);
              Alert.alert('Quote Declined', 'The vendor has been notified.');
              fetchDetails();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to decline quote.');
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
        <Text style={styles.loadingText}>Loading quote details...</Text>
      </SafeAreaView>
    );
  }

  if (!quote) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Quote Not Found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isActionable = quote.status === 'SENT' || quote.status === 'REVISED';
  const isAccepted = quote.status === 'ACCEPTED';
  const isRevisionRequested = quote.status === 'REVISION_REQUESTED';
  const hasExpired = quote.validUntil && new Date(quote.validUntil) < new Date();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Navigation Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.headerBackButton, { flexDirection: 'row', alignItems: 'center' }]}>
          <AppIcon name="arrow-back" size={18} color="#1F2937" />
          <Text style={[styles.headerBackText, { marginLeft: 4 }]}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          Quote #{quote.quoteNumber}
        </Text>
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
        {/* Status Banner */}
        <View style={styles.statusBanner}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Current Status:</Text>
            <StatusBadge status={quote.status} />
          </View>
          {quote.currentVersion > 1 && (
            <Text style={styles.versionBadge}>Version {quote.currentVersion}</Text>
          )}
        </View>

        {/* Accepted Notice */}
        {isAccepted && (
          <View style={styles.acceptedBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppIcon name="checkmark-circle" size={20} color="#15803D" />
              <Text style={[styles.acceptedBannerTitle, { marginLeft: 6 }]}>Quote Accepted & Confirmed!</Text>
            </View>
            <Text style={styles.acceptedBannerText}>
              A historical booking snapshot has been preserved. Payment Status is currently PENDING.
            </Text>
            {quote.booking && (
              <TouchableOpacity
                style={styles.viewBookingBtn}
                onPress={() => navigation.navigate('BookingDetailsScreen', { bookingId: quote.booking?.id })}
              >
                <Text style={styles.viewBookingBtnText}>View Confirmed Booking →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Revision Requested Notice */}
        {isRevisionRequested && (
          <View style={styles.revisionNoticeBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppIcon name="time-outline" size={18} color="#6B21A8" />
              <Text style={[styles.revisionNoticeTitle, { marginLeft: 6 }]}>Negotiation in Progress</Text>
            </View>
            <Text style={styles.revisionNoticeText}>
              You requested changes: "{quote.revisionNotes || 'Changes requested by user'}"
            </Text>
            <Text style={styles.revisionNoticeSub}>The vendor will send an updated proposal soon.</Text>
          </View>
        )}

        {/* Vendor Profile Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Vendor Information</Text>
          <View style={styles.vendorRow}>
            <View style={styles.vendorAvatar}>
              <Text style={styles.avatarText}>
                {quote.vendor?.businessName?.charAt(0)?.toUpperCase() || 'V'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vendorName}>{quote.vendor?.businessName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <AppIcon name="location-outline" size={13} color="#D97706" />
                <Text style={[styles.vendorCity, { marginLeft: 4 }]}>{quote.vendor?.city || 'Local Area'}</Text>
              </View>
            </View>
          </View>

          {/* Quick Contact Buttons */}
          <View style={styles.contactRow}>
            {quote.vendor?.phone && (
              <TouchableOpacity
                style={[styles.contactBtn, styles.callBtn, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
                onPress={() => openDialer(quote.vendor!.phone)}
              >
                <AppIcon name="call" size={13} color="#881337" />
                <Text style={[styles.contactBtnText, { marginLeft: 6 }]}>Call Vendor</Text>
              </TouchableOpacity>
            )}
            {quote.vendor?.phone && (
              <TouchableOpacity
                style={[styles.contactBtn, styles.waBtn, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
                onPress={() =>
                  openWhatsApp(
                    quote.vendor!.phone,
                    `Hello, regarding Quote #${quote.quoteNumber} for our event.`
                  )
                }
              >
                <AppIcon name="logo-whatsapp" size={13} color="#16A34A" />
                <Text style={[styles.waBtnText, { marginLeft: 6 }]}>WhatsApp</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Event Details Card */}
        {quote.event && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Event Details</Text>
            <Text style={styles.eventTitle}>{quote.event.title}</Text>
            <View style={styles.eventGrid}>
              <View style={styles.eventGridItem}>
                <Text style={styles.gridLabel}>Date</Text>
                <Text style={styles.gridValue}>
                  {new Date(quote.event.eventDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              {quote.event.guestCount && (
                <View style={styles.eventGridItem}>
                  <Text style={styles.gridLabel}>Guests</Text>
                  <Text style={styles.gridValue}>{quote.event.guestCount} Guests</Text>
                </View>
              )}
            </View>
            {quote.event.addressLine1 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <AppIcon name="location-outline" size={13} color="#D97706" />
                <Text style={[styles.eventLocation, { marginLeft: 4 }]}>
                  {quote.event.addressLine1}, {quote.event.city}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Line Items Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quoted Services & Items</Text>
          {quote.items && quote.items.length > 0 ? (
            quote.items.map((item, idx) => (
              <View key={item.id || idx} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                  {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
                  <Text style={styles.itemQtyPrice}>
                    Qty: {item.quantity} × ₹{Number(item.unitPrice).toLocaleString('en-IN')}
                  </Text>
                </View>
                <Text style={styles.itemTotalPrice}>
                  ₹{Number(item.totalPrice).toLocaleString('en-IN')}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyItemsText}>No specific line items attached.</Text>
          )}

          {quote.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Vendor Notes:</Text>
              <Text style={styles.notesText}>{quote.notes}</Text>
            </View>
          )}
        </View>

        {/* Financial Breakdown Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Subtotal</Text>
            <Text style={styles.breakdownValue}>₹{Number(quote.subtotal).toLocaleString('en-IN')}</Text>
          </View>

          {Number(quote.discount) > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.success }]}>Special Discount</Text>
              <Text style={[styles.breakdownValue, { color: colors.success }]}>
                -₹{Number(quote.discount).toLocaleString('en-IN')}
              </Text>
            </View>
          )}

          {Number(quote.tax) > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Taxes & GST</Text>
              <Text style={styles.breakdownValue}>+₹{Number(quote.tax).toLocaleString('en-IN')}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>₹{Number(quote.total).toLocaleString('en-IN')}</Text>
          </View>

          {quote.validUntil && (
            <View style={styles.validityRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {hasExpired ? (
                  <>
                    <AppIcon name="alert-circle-outline" size={13} color="#EF4444" />
                    <Text style={[styles.validityText, styles.expiredText, { marginLeft: 4 }]}>Quote Expired</Text>
                  </>
                ) : (
                  <Text style={styles.validityText}>
                    {`Valid until: ${new Date(quote.validUntil).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}`}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Version History Audit Log */}
        {quote.versions && quote.versions.length > 1 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Negotiation History</Text>
            {quote.versions.map((v) => (
              <View key={v.id} style={styles.versionRow}>
                <View style={styles.versionBadgeContainer}>
                  <Text style={styles.versionNumberText}>v{v.versionNumber}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.versionTotalText}>₹{Number(v.total).toLocaleString('en-IN')}</Text>
                  {v.revisionNotes && (
                    <Text style={styles.versionNotesText}>"{v.revisionNotes}"</Text>
                  )}
                  <Text style={styles.versionDate}>
                    {new Date(v.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Bar */}
      {isActionable && !hasExpired && (
        <View style={styles.floatingActionBar}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.declineBtn]}
            onPress={handleReject}
          >
            <Text style={styles.declineBtnText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.revisionBtn]}
            onPress={() => setRevisionModalVisible(true)}
          >
            <Text style={styles.revisionBtnText}>Request Revision</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={() => setAcceptModalVisible(true)}
          >
            <Text style={styles.acceptBtnText}>Accept Quote</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modals */}
      <RequestRevisionModal
        visible={revisionModalVisible}
        quoteNumber={quote.quoteNumber}
        onClose={() => setRevisionModalVisible(false)}
        onSubmit={handleRevisionSubmit}
      />

      <BookingConfirmationModal
        visible={acceptModalVisible}
        quoteNumber={quote.quoteNumber}
        vendorName={quote.vendor?.businessName || 'Vendor'}
        totalAmount={Number(quote.total)}
        eventDate={quote.event?.eventDate}
        onClose={() => setAcceptModalVisible(false)}
        onConfirm={handleAcceptConfirm}
      />
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
  headerBackButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  headerBackText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    fontFamily: 'monospace',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  statusTag: {
    backgroundColor: colors.backgroundWarm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  versionBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  acceptedBanner: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 14,
    padding: 16,
  },
  acceptedBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
  },
  acceptedBannerText: {
    fontSize: 13,
    color: '#166534',
    marginTop: 4,
    lineHeight: 18,
  },
  viewBookingBtn: {
    marginTop: 12,
    backgroundColor: '#15803D',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  viewBookingBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  revisionNoticeBanner: {
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#D8B4FE',
    borderRadius: 14,
    padding: 16,
  },
  revisionNoticeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#6B21A8',
  },
  revisionNoticeText: {
    fontSize: 13,
    color: '#581C87',
    marginTop: 4,
    fontStyle: 'italic',
  },
  revisionNoticeSub: {
    fontSize: 12,
    color: '#7E22CE',
    marginTop: 6,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
    letterSpacing: -0.2,
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
  },
  eventGrid: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 8,
  },
  eventGridItem: {
    backgroundColor: colors.backgroundWarm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  gridLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  eventLocation: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemDescription: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  itemNotes: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemQtyPrice: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  itemTotalPrice: {
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
  notesBox: {
    backgroundColor: colors.backgroundWarm,
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  notesText: {
    fontSize: 13,
    color: colors.text,
    marginTop: 4,
    lineHeight: 18,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  breakdownLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  validityRow: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  validityText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  expiredText: {
    color: colors.error,
    fontWeight: '700',
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  versionBadgeContainer: {
    backgroundColor: colors.backgroundWarm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  versionNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  versionTotalText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  versionNotesText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  versionDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  floatingActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 10,
  },
  actionBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    flex: 1,
    backgroundColor: colors.backgroundWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  declineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  revisionBtn: {
    flex: 1.4,
    backgroundColor: colors.secondary,
  },
  revisionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  acceptBtn: {
    flex: 1.6,
    backgroundColor: colors.primary,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
});

export default QuoteDetailsScreen;
