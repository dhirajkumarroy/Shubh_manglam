import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import colors from '../../theme/colors';
import { bookingService, CustomerBooking } from '../../api/booking.service';
import { AppIcon } from '../../components/AppIcon';
import { StatusBadge } from '../../components/StatusBadge';

const BOOKING_TABS = [
  { label: 'Upcoming', filter: 'UPCOMING' },
  { label: 'All', filter: 'ALL' },
  { label: 'Completed', filter: 'COMPLETED' },
  { label: 'Cancelled', filter: 'CANCELLED' },
];

export const MyBookingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('Upcoming');

  const fetchBookings = useCallback(async () => {
    try {
      const res = await bookingService.getCustomerBookings();
      setBookings(res.bookings);
    } catch (err: any) {
      console.warn('Failed to load bookings:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const getFilteredBookings = () => {
    if (activeTab === 'Completed') {
      return bookings.filter((b) => b.status === 'COMPLETED');
    }
    if (activeTab === 'Cancelled') {
      return bookings.filter((b) => b.status === 'CANCELLED' || b.status === 'REJECTED');
    }
    if (activeTab === 'Upcoming') {
      return bookings.filter(
        (b) => b.status === 'CONFIRMED' || b.status === 'PENDING' || b.status === 'IN_PROGRESS'
      );
    }
    return bookings;
  };

  const renderBookingCard = ({ item }: { item: CustomerBooking }) => {
    const isConfirmed = item.status === 'CONFIRMED';
    const isInProgress = item.status === 'IN_PROGRESS';
    const isCompleted = item.status === 'COMPLETED';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('BookingDetailsScreen', { bookingId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.vendorName} numberOfLines={1}>
              {item.vendor?.businessName || 'Celebration Vendor'}
            </Text>
            <Text style={styles.bookingNumber}>Booking #{item.bookingNumber}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        {item.event && (
          <View style={styles.eventBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppIcon name="sparkles" size={13} color="#881337" />
              <Text style={[styles.eventTitle, { marginLeft: 4 }]} numberOfLines={1}>
                {item.event.title}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
              <AppIcon name="calendar-outline" size={12} color="#D97706" />
              <Text style={[styles.eventDate, { marginLeft: 4 }]}>
                {new Date(item.event.eventDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                {item.event.city ? ` • ${item.event.city}` : ''}
              </Text>
            </View>
          </View>
        )}

        {item.items && item.items.length > 0 && (
          <View style={styles.servicesBox}>
            <Text style={styles.servicesCountText}>
              {item.items.length} Service{item.items.length > 1 ? 's' : ''} Booked:
            </Text>
            <Text style={styles.servicesListText} numberOfLines={2}>
              {item.items.map((i) => i.name).join(', ')}
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalLabel}>Total Agreed Amount</Text>
            <Text style={styles.totalValue}>₹{Number(item.total).toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.paymentBadge}>
            <Text style={styles.paymentLabel}>Payment</Text>
            <Text style={styles.paymentValue}>PENDING</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const filtered = getFilteredBookings();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings (बुकिंग्स)</Text>
        <Text style={styles.subtitle}>Confirmed celebration services and historical agreements</Text>
      </View>

      {/* Tab Filter Chips */}
      <View style={styles.tabContainer}>
        {BOOKING_TABS.map((tab) => {
          const isActive = activeTab === tab.label;
          return (
            <TouchableOpacity
              key={tab.label}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.label)}
            >
              <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching your bookings...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AppIcon name="calendar-outline" size={48} color="#D97706" />
          <Text style={styles.emptyTitle}>No Bookings in {activeTab}</Text>
          <Text style={styles.emptySubtitle}>
            When you accept a quote from a vendor, your confirmed booking will appear here with locked item prices.
          </Text>
          <TouchableOpacity
            style={styles.browseQuotesBtn}
            onPress={() => navigation.navigate('QuotesListScreen')}
          >
            <Text style={styles.browseQuotesBtnText}>View My Quotes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderBookingCard}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 3,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButtonActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  bookingNumber: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.backgroundWarm,
  },
  statusConfirmed: {
    backgroundColor: '#DCFCE7',
  },
  statusInProgress: {
    backgroundColor: '#DBEAFE',
  },
  statusCompleted: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  statusConfirmedText: {
    color: '#15803D',
  },
  statusInProgressText: {
    color: '#1E40AF',
  },
  statusCompletedText: {
    color: '#92400E',
  },
  eventBox: {
    backgroundColor: colors.backgroundWarm,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  eventDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  servicesBox: {
    marginBottom: 10,
  },
  servicesCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  servicesListText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  paymentBadge: {
    alignItems: 'flex-end',
    backgroundColor: colors.backgroundWarm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paymentLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  paymentValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.accentGold,
  },
  centerContainer: {
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  browseQuotesBtn: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseQuotesBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default MyBookingsScreen;
