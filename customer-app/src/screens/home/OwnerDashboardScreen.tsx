import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDashboardStats, useOwnerVehicles } from '../../hooks/useOwner';
import { useNearbyRequests, useOwnerRequests, useAcceptRequest, useRejectRequest, useCompleteTrip } from '../../hooks/useRequests';
import ownerService from '../../api/owner.service';
import colors from '../../theme/colors';

export const OwnerDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  // Fetch stats and host vehicles
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useDashboardStats();
  const { data: vehiclesData, refetch: refetchVehicles } = useOwnerVehicles({ limit: 100 });
  
  // Fetch nearby requests and assigned owner requests
  const { data: nearbyRequests, isLoading: nearbyLoading, refetch: refetchNearby } = useNearbyRequests();
  const { data: assignedRequestsData, isLoading: assignedLoading, refetch: refetchAssigned, isRefetching } = useOwnerRequests({ limit: 50 });

  const acceptMutation = useAcceptRequest();
  const rejectMutation = useRejectRequest();
  const completeMutation = useCompleteTrip();

  const vehicles = vehiclesData?.vehicles || [];
  const isOnline = vehicles.some((v: any) => v.isAvailable);

  const handleToggleOnlineStatus = async () => {
    if (vehicles.length === 0) {
      Alert.alert('No Vehicles', 'Please register a vehicle first before going online.');
      return;
    }

    const nextStatus = !isOnline;
    const actionText = nextStatus ? 'Go Online' : 'Go Offline';

    Alert.alert(
      `${actionText}?`,
      nextStatus
        ? 'You will start matching with nearby transport requirement requests.'
        : 'You will stop receiving new requirement alerts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              // Update availability for all vehicles
              await Promise.all(
                vehicles.map((v: any) =>
                  ownerService.updateVehicle(v.id, { isAvailable: nextStatus })
                )
              );
              refetchVehicles();
              refetchStats();
              refetchNearby();
              Alert.alert('Status Updated', `You are now ${nextStatus ? 'Online' : 'Offline'}.`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to toggle availability.');
            }
          },
        },
      ]
    );
  };

  const handleAcceptRequest = (requestId: string) => {
    Alert.alert(
      'Accept Transport Request',
      'Are you sure you want to accept this requirement? You will be assigned as the carrier.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            acceptMutation.mutate(requestId, {
              onSuccess: () => {
                Alert.alert('Request Accepted', 'Confirming with rider. Awaiting checkout payment confirmation.');
                handleRefresh();
              },
              onError: (err: any) => {
                Alert.alert('Failed to Accept', err.message || 'Another driver might have accepted first.');
              },
            });
          },
        },
      ]
    );
  };

  const handleRejectRequest = (requestId: string) => {
    rejectMutation.mutate(requestId, {
      onSuccess: () => {
        Alert.alert('Dismissed', 'The request has been removed from your live stack.');
        refetchNearby();
      },
    });
  };

  const handleCompleteTrip = (requestId: string) => {
    Alert.alert(
      'Complete Trip',
      'Are you sure you want to mark this trip as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            completeMutation.mutate(requestId, {
              onSuccess: () => {
                Alert.alert('Success', 'Trip has been completed. Earnings added to account.');
                handleRefresh();
              },
              onError: (err: any) => {
                Alert.alert('Error', err.message || 'Failed to complete trip.');
              },
            });
          },
        },
      ]
    );
  };

  const handleRefresh = async () => {
    await Promise.all([
      refetchStats(),
      refetchVehicles(),
      refetchNearby(),
      refetchAssigned(),
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return colors.success;
      case 'OWNER_ASSIGNED':
        return colors.primary;
      case 'PENDING':
        return colors.warning;
      case 'COMPLETED':
        return '#10b981';
      case 'CANCELLED':
      case 'REJECTED':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  const assignedRequests = assignedRequestsData?.requests || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Dashboard</Text>
          </TouchableOpacity>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Host Console</Text>
            {/* Status Switcher Button */}
            <TouchableOpacity
              style={[styles.statusToggle, isOnline ? styles.toggleOnline : styles.toggleOffline]}
              onPress={handleToggleOnlineStatus}
            >
              <Text style={[styles.statusToggleText, { color: isOnline ? '#22c55e' : colors.textMuted }]}>
                ● {isOnline ? 'Online' : 'Offline'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid */}
        {statsLoading ? (
          <View style={styles.statsLoadingBox}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.statsLoadingText}>Calculating stats...</Text>
          </View>
        ) : statsError ? (
          <View style={styles.statsLoadingBox}>
            <Text style={styles.statsErrorText}>Failed to load statistics.</Text>
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Revenue</Text>
              <Text style={styles.statValue}>₹{stats?.revenue}</Text>
              <Text style={styles.statSubText}>Confirmed payout</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>My Vehicles</Text>
              <Text style={styles.statValue}>{stats?.totalVehicles}</Text>
              <Text style={styles.statSubText}>{stats?.activeVehicles} Online</Text>
            </View>
          </View>
        )}

        {/* Vehicle Management Link */}
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('MyVehicles')}>
          <View>
            <Text style={styles.actionName}>Manage My Registered Vehicles</Text>
            <Text style={styles.actionDesc}>Verify vehicle category & coordinate radius settings</Text>
          </View>
          <Text style={styles.arrowIcon}>→</Text>
        </TouchableOpacity>

        {/* Live matching alerts */}
        <Text style={styles.sectionTitle}>Live Nearby Requirements ({nearbyRequests?.length || 0})</Text>
        {!isOnline ? (
          <View style={styles.offlineBox}>
            <Text style={styles.offlineText}>Go Online to start receiving matches</Text>
          </View>
        ) : nearbyLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
        ) : !nearbyRequests || nearbyRequests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>No matching requests in your radius right now.</Text>
          </View>
        ) : (
          <View>
            {nearbyRequests.map((req: any) => (
              <View key={req.id} style={styles.reqCard}>
                <View style={styles.reqHeader}>
                  <Text style={styles.reqPurpose}>🌾 {req.purpose.replace('_', ' ')}</Text>
                  <Text style={styles.reqPayout}>Payout: ₹{req.estimatedFare}</Text>
                </View>
                <Text style={styles.reqDesc}>{req.description}</Text>
                <Text style={styles.reqLoc}>📍 Pickup: {req.pickupAddress}</Text>
                <Text style={styles.reqLoc}>🏁 Drop: {req.dropAddress}</Text>
                {req.matchedVehicleTitle && (
                  <Text style={styles.reqVehicleMatch}>Matched vehicle: {req.matchedVehicleTitle}</Text>
                )}

                <View style={styles.reqActions}>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRejectRequest(req.id)}>
                    <Text style={styles.rejectBtnText}>Dismiss</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptRequest(req.id)}>
                    <Text style={styles.acceptBtnText}>Accept Ride</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Active Jobs */}
        <Text style={styles.sectionTitle}>My Active / Confirmed Jobs</Text>
        {assignedLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
        ) : assignedRequests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>No active or completed jobs listed.</Text>
          </View>
        ) : (
          <View>
            {assignedRequests.map((req: any) => (
              <View key={req.id} style={styles.jobCard}>
                <View style={styles.reqHeader}>
                  <Text style={styles.jobTitle}>{req.purpose.replace('_', ' ')}</Text>
                  <View style={[styles.statusBadge, { borderColor: getStatusColor(req.status) }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusColor(req.status) }]}>
                      {req.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                <Text style={styles.jobClient}>Client: {req.customer?.name} (📞 {req.customer?.phone})</Text>
                <Text style={styles.jobAddress}>📍 {req.pickupAddress} to {req.dropAddress}</Text>
                <Text style={styles.jobFare}>Payout: ₹{req.estimatedFare}</Text>

                {req.status === 'ACCEPTED' && (
                  <TouchableOpacity style={styles.completeBtn} onPress={() => handleCompleteTrip(req.id)}>
                    <Text style={styles.completeBtnText}>Mark as Completed</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 45,
  },
  header: {
    paddingTop: 16,
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  statusToggle: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.card,
  },
  toggleOnline: {
    borderColor: '#22c55e',
  },
  toggleOffline: {
    borderColor: colors.border,
  },
  statusToggleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    width: '48%',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginTop: 8,
  },
  statSubText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 6,
  },
  statsLoadingBox: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  statsLoadingText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  statsErrorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  actionName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  actionDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  arrowIcon: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '700',
  },
  offlineBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  offlineText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyCardText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  reqCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  reqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reqPurpose: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  reqPayout: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  reqDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10,
    lineHeight: 16,
  },
  reqLoc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  reqVehicleMatch: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 8,
  },
  reqActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
    gap: 10,
  },
  rejectBtn: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  rejectBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  acceptBtn: {
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  acceptBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  jobCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  jobClient: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontWeight: '600',
  },
  jobAddress: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  jobFare: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  completeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  completeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default OwnerDashboardScreen;
