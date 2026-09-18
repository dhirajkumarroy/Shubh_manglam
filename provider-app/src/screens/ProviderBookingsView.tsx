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

const TABS = [
  { label: 'Upcoming', filter: 'UPCOMING' },
  { label: 'In Progress', filter: 'IN_PROGRESS' },
  { label: 'Completed', filter: 'COMPLETED' },
  { label: 'Cancelled', filter: 'CANCELLED' },
  { label: 'All', filter: 'ALL' },
];

export const ProviderBookingsView: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Upcoming');

  const fetchBookings = useCallback(async () => {
    try {
      const res = await ProviderApiService.getVendorBookings();
      setBookings(res.bookings);
    } catch (err: any) {
      console.warn('Error fetching bookings:', err.message);
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
    const msg = `Hello ${clientName}, regarding our celebration service booking on Shubh Ausar.`;
    try {
      await Linking.openURL(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`);
    } catch {
      Alert.alert('Error', 'Cannot open WhatsApp');
    }
  };

  const handleStatusUpdate = (bookingId: string, newStatus: string, actionLabel: string) => {
    Alert.alert(
      `Confirm ${actionLabel}`,
      `Are you sure you want to mark this booking as "${newStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await ProviderApiService.updateBookingStatus(bookingId, newStatus);
              Alert.alert('Success', `Booking updated to ${newStatus}.`);
              fetchBookings();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to update status.');
            }
          },
        },
      ]
    );
  };

  const getFilteredBookings = () => {
    if (activeTab === 'Upcoming') {
      return bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING');
    }
    if (activeTab === 'In Progress') {
      return bookings.filter((b) => b.status === 'IN_PROGRESS');
    }
    if (activeTab === 'Completed') {
      return bookings.filter((b) => b.status === 'COMPLETED');
    }
    if (activeTab === 'Cancelled') {
      return bookings.filter((b) => b.status === 'CANCELLED' || b.status === 'REJECTED');
    }
    return bookings;
  };

  const renderBookingCard = ({ item }: { item: any }) => {
    const isConfirmed = item.status === 'CONFIRMED';
    const isInProgress = item.status === 'IN_PROGRESS';
    const isCompleted = item.status === 'COMPLETED';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{item.customer?.name || 'Customer'}</Text>
            <Text style={styles.bookingNumber}>Booking #{item.bookingNumber}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              isConfirmed && styles.statusConfirmed,
              isInProgress && styles.statusInProgress,
              isCompleted && styles.statusCompleted,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isConfirmed && styles.statusConfirmedText,
                isInProgress && styles.statusInProgressText,
                isCompleted && styles.statusCompletedText,
              ]}
            >
              ● {item.status}
            </Text>
          </View>
        </View>

        {/* Event Info */}
        {item.event && (
          <View style={styles.eventBox}>
            <Text style={styles.eventTitle}>🎉 {item.event.title}</Text>
            <Text style={styles.eventDate}>
              📅{' '}
              {new Date(item.event.eventDate).toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              {item.event.city ? ` • 📍 ${item.event.city}` : ''}
            </Text>
          </View>
        )}

        {/* Snapshotted Items */}
        {item.items && item.items.length > 0 && (
          <View style={styles.itemsBox}>
            <Text style={styles.itemsHeader}>Locked Agreement Items ({item.items.length}):</Text>
            {item.items.map((it: any, idx: number) => (
              <View key={it.id || idx} style={styles.itemRow}>
                <Text style={styles.itemName}>• {it.name} (x{it.quantity})</Text>
                <Text style={styles.itemPrice}>₹{Number(it.totalPrice).toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Financial Row */}
        <View style={styles.financialRow}>
          <View>
            <Text style={styles.financialLabel}>Total Agreed Value</Text>
            <Text style={styles.financialValue}>₹{Number(item.total).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.paymentBadge}>
            <Text style={styles.paymentLabel}>Payment</Text>
            <Text style={styles.paymentValue}>PENDING</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Actions Row */}
        <View style={styles.cardFooter}>
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

          {isConfirmed && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleStatusUpdate(item.id, 'IN_PROGRESS', 'Start Service')}
            >
              <Text style={styles.actionBtnText}>Start Service →</Text>
            </TouchableOpacity>
          )}

          {isInProgress && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.completeBtn]}
              onPress={() => handleStatusUpdate(item.id, 'COMPLETED', 'Complete Service')}
            >
              <Text style={styles.actionBtnText}>✓ Mark Completed</Text>
            </TouchableOpacity>
          )}

          {isCompleted && (
            <View style={styles.completedTag}>
              <Text style={styles.completedTagText}>🎉 Celebration Complete</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const filtered = getFilteredBookings();

  return (
    <View style={styles.container}>
      {/* Tab Filter Chips */}
      <View style={styles.tabContainer}>
        {TABS.map((tab) => {
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

      {/* Bookings List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading confirmed bookings...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>🤝</Text>
          <Text style={styles.emptyTitle}>No Bookings in {activeTab}</Text>
          <Text style={styles.emptySubtitle}>
            When customers accept your formal quotes, the confirmed bookings and locked price agreements appear here.
          </Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: colors.background,
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
  bookingNumber: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
    marginVertical: 6,
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
  itemsBox: {
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 10,
    marginVertical: 6,
  },
  itemsHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  itemName: {
    fontSize: 13,
    color: colors.text,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  financialLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  financialValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  paymentBadge: {
    alignItems: 'flex-end',
    backgroundColor: colors.backgroundWarm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paymentLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  paymentValue: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accentGold,
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
  actionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  completeBtn: {
    backgroundColor: colors.success,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  completedTag: {
    backgroundColor: colors.accentGoldBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  completedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentGold,
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

export default ProviderBookingsView;
