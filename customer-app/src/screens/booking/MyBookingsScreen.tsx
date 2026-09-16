import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMyRequests } from '../../hooks/useRequests';
import { BookingStackParamList } from '../../navigation/types';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import colors from '../../theme/colors';

export const MyBookingsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<BookingStackParamList>>();
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST'>('UPCOMING');

  const { data, isLoading, isError, error, refetch, isFetching } = useMyRequests();

  const requests = data?.requests || [];

  const filteredRequests = requests.filter((r: any) => {
    const isUpcoming = r.status === 'PENDING' || r.status === 'OWNER_ASSIGNED' || r.status === 'ACCEPTED';
    return activeTab === 'UPCOMING' ? isUpcoming : !isUpcoming;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return styles.statusConfirmed;
      case 'OWNER_ASSIGNED':
        return styles.statusAssigned;
      case 'PENDING':
        return styles.statusPending;
      case 'CANCELLED':
      case 'REJECTED':
        return styles.statusCancelled;
      default:
        return styles.statusDefault;
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.vehicleTitle}>
          {item.purpose.replace('_', ' ')} Need
        </Text>
        <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
          <Text style={[styles.statusText, { color: getStatusStyle(item.status).borderColor }]}>
            {item.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

      <View style={styles.detailsRow}>
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>Pickup Address</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {item.pickupAddress}
          </Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>Scheduled Date</Text>
          <Text style={styles.detailValue}>
            {new Date(item.scheduledAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>Est. Payout</Text>
          <Text style={styles.detailValue}>₹{item.estimatedFare}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.payButton}
        onPress={() =>
          navigation.navigate('RequestDetails', {
            requestId: item.id,
          })
        }
      >
        <Text style={styles.payButtonText}>
          {item.status === 'OWNER_ASSIGNED' ? 'Pay Now / Confirm Ride' : 'Track Details'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Requests</Text>
        <Text style={styles.subtitle}>Track your transport requirement postings</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'UPCOMING' && styles.tabActive]}
          onPress={() => setActiveTab('UPCOMING')}
        >
          <Text style={[styles.tabText, activeTab === 'UPCOMING' && styles.tabTextActive]}>
            Active
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'PAST' && styles.tabActive]}
          onPress={() => setActiveTab('PAST')}
        >
          <Text style={[styles.tabText, activeTab === 'PAST' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={(item) => String(item)}
          renderItem={() => <SkeletonLoader />}
          contentContainerStyle={styles.listContainer}
        />
      ) : isError ? (
        <ErrorState onRetry={refetch} message={error?.message} />
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No requests found"
              message="You haven't posted any requirements under this category."
              icon="📦"
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
    paddingHorizontal: 24,
    paddingTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    backgroundColor: colors.border,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusConfirmed: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: '#22c55e',
  },
  statusAssigned: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3b82f6',
  },
  statusPending: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderColor: '#eab308',
  },
  statusCancelled: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
  },
  statusDefault: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderColor: '#64748b',
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 14,
    lineHeight: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  detail: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  payButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default MyBookingsScreen;
