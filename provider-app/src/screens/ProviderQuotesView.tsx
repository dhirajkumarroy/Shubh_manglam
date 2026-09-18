import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import colors from '../theme/colors';
import { ProviderApiService } from '../services/api';
import CreateQuoteModal from '../components/CreateQuoteModal';

const FILTERS = [
  { label: 'All' },
  { label: 'New Requests', value: 'REQUESTED' },
  { label: 'Negotiations', value: 'REVISION_REQUESTED' },
  { label: 'Sent', value: 'SENT' },
  { label: 'Accepted', value: 'ACCEPTED' },
];

export const ProviderQuotesView: React.FC = () => {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | undefined>(undefined);

  // Quote builder modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [activeQuote, setActiveQuote] = useState<any | null>(null);
  const [isRevision, setIsRevision] = useState(false);

  const fetchQuotes = useCallback(async () => {
    try {
      const res = await ProviderApiService.getVendorQuotes(
        selectedFilter ? { status: selectedFilter } : undefined
      );
      setQuotes(res.quotes);
    } catch (err: any) {
      console.warn('Error fetching quotes:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    setLoading(true);
    fetchQuotes();
  }, [fetchQuotes]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuotes();
  };

  const handleCall = async (phone: string) => {
    if (!phone) return;
    try {
      await Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`);
    } catch {
      Alert.alert('Error', 'Cannot open dialer');
    }
  };

  const handleWhatsApp = async (phone: string, clientName: string) => {
    if (!phone) return;
    const digits = phone.replace(/\D/g, '');
    const cleanNumber = digits.length === 10 ? `91${digits}` : digits;
    const msg = `Hello ${clientName}, regarding your quote on Shubh Ausar.`;
    try {
      await Linking.openURL(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`);
    } catch {
      Alert.alert('Error', 'Cannot open WhatsApp');
    }
  };

  const openCreateQuote = (quote: any) => {
    setActiveQuote(quote);
    setIsRevision(false);
    setModalVisible(true);
  };

  const openReviseQuote = (quote: any) => {
    setActiveQuote(quote);
    setIsRevision(true);
    setModalVisible(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return { label: 'New Request', bg: '#DBEAFE', text: '#1E40AF' };
      case 'REVISION_REQUESTED':
        return { label: 'Revision Needed', bg: '#F3E8FF', text: '#6B21A8' };
      case 'SENT':
        return { label: 'Quote Sent', bg: '#FEF3C7', text: '#92400E' };
      case 'REVISED':
        return { label: 'Revised Sent', bg: '#E0E7FF', text: '#3730A3' };
      case 'ACCEPTED':
        return { label: 'Accepted & Booked', bg: '#DCFCE7', text: '#15803D' };
      default:
        return { label: status, bg: '#F3F4F6', text: '#374151' };
    }
  };

  const renderQuoteCard = ({ item }: { item: any }) => {
    const badge = getStatusBadge(item.status);
    const isNewRequest = item.status === 'REQUESTED';
    const isRevisionRequested = item.status === 'REVISION_REQUESTED';
    const isAccepted = item.status === 'ACCEPTED';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{item.customer?.name || 'Customer'}</Text>
            <Text style={styles.quoteNumber}>Quote #{item.quoteNumber}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        {/* Event Details */}
        {item.event && (
          <View style={styles.eventBox}>
            <Text style={styles.eventTitle}>🎉 {item.event.title}</Text>
            <Text style={styles.eventSub}>
              📅{' '}
              {new Date(item.event.eventDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              {item.event.guestCount ? ` • ${item.event.guestCount} Guests` : ''}
            </Text>
          </View>
        )}

        {/* Customer Notes */}
        {item.customerNotes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Customer Requirements:</Text>
            <Text style={styles.notesText}>{item.customerNotes}</Text>
          </View>
        )}

        {/* Revision Requested Message */}
        {isRevisionRequested && (
          <View style={styles.revisionAlertBox}>
            <Text style={styles.revisionAlertTitle}>⚡ Customer Requested Revision:</Text>
            <Text style={styles.revisionAlertText}>
              "{item.revisionNotes || 'Please adjust services or pricing.'}"
            </Text>
          </View>
        )}

        {/* Financial Info if Quote was issued */}
        {!isNewRequest && (
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>Quoted Amount ({item.currentVersion ? `v${item.currentVersion}` : 'v1'})</Text>
              <Text style={styles.priceValue}>₹{Number(item.total).toLocaleString('en-IN')}</Text>
            </View>
            {Number(item.discount) > 0 && (
              <Text style={styles.discountText}>Incl. ₹{Number(item.discount).toLocaleString('en-IN')} discount</Text>
            )}
          </View>
        )}

        <View style={styles.divider} />

        {/* Footer Actions */}
        <View style={styles.cardFooter}>
          {/* Quick Contact */}
          <View style={styles.contactRow}>
            {item.customer?.phone && (
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => handleCall(item.customer.phone)}
              >
                <Text style={styles.contactBtnText}>📞 Call</Text>
              </TouchableOpacity>
            )}
            {item.customer?.phone && (
              <TouchableOpacity
                style={[styles.contactBtn, styles.waBtn]}
                onPress={() => handleWhatsApp(item.customer.phone, item.customer?.name || 'Customer')}
              >
                <Text style={styles.waBtnText}>💬 WhatsApp</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Primary Transaction Action */}
          {isNewRequest && (
            <TouchableOpacity style={styles.primaryActionBtn} onPress={() => openCreateQuote(item)}>
              <Text style={styles.primaryActionBtnText}>+ Create Quote</Text>
            </TouchableOpacity>
          )}

          {isRevisionRequested && (
            <TouchableOpacity
              style={[styles.primaryActionBtn, styles.reviseBtn]}
              onPress={() => openReviseQuote(item)}
            >
              <Text style={styles.primaryActionBtnText}>🔄 Revise Quote</Text>
            </TouchableOpacity>
          )}

          {isAccepted && item.booking && (
            <View style={styles.acceptedPill}>
              <Text style={styles.acceptedPillText}>✓ Booking #{item.booking.bookingNumber}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filtersWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item.label}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item }) => {
            const isSelected = selectedFilter === item.value;
            return (
              <TouchableOpacity
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedFilter(item.value)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching quotes & inquiries...</Text>
        </View>
      ) : quotes.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📜</Text>
          <Text style={styles.emptyTitle}>No Quotes in this view</Text>
          <Text style={styles.emptySubtitle}>
            When customers request proposals for celebrations, they will appear here for you to itemize and send.
          </Text>
        </View>
      ) : (
        <FlatList
          data={quotes}
          keyExtractor={(item) => item.id}
          renderItem={renderQuoteCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* Quote Builder Modal */}
      {activeQuote && (
        <CreateQuoteModal
          visible={modalVisible}
          quoteId={activeQuote.id}
          isRevision={isRevision}
          customerName={activeQuote.customer?.name}
          eventTitle={activeQuote.event?.title}
          initialNotes={activeQuote.notes}
          initialItems={activeQuote.items}
          initialDiscount={Number(activeQuote.discount || 0)}
          initialTax={Number(activeQuote.tax || 0)}
          onClose={() => {
            setModalVisible(false);
            setActiveQuote(null);
          }}
          onSuccess={fetchQuotes}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  filtersWrapper: {
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  filtersList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  quoteNumber: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  eventBox: {
    backgroundColor: colors.backgroundWarm,
    padding: 10,
    borderRadius: 10,
    marginVertical: 6,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  eventSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  notesBox: {
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 10,
    marginVertical: 6,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  notesText: {
    fontSize: 13,
    color: colors.text,
    marginTop: 2,
  },
  revisionAlertBox: {
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#D8B4FE',
    padding: 10,
    borderRadius: 10,
    marginVertical: 6,
  },
  revisionAlertTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B21A8',
  },
  revisionAlertText: {
    fontSize: 13,
    color: '#581C87',
    fontStyle: 'italic',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 6,
  },
  priceLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 8,
  },
  contactBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.backgroundWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  waBtn: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  waBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
  primaryActionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  reviseBtn: {
    backgroundColor: colors.secondary,
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  acceptedPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  acceptedPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: 50,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});

export default ProviderQuotesView;
