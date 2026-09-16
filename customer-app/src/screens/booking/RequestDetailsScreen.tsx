import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRequest, useCancelRequest } from '../../hooks/useRequests';
import colors from '../../theme/colors';
import { BookingStackParamList } from '../../navigation/types';

type RequestDetailsRouteProp = RouteProp<BookingStackParamList, 'RequestDetails'>;

export const RequestDetailsScreen: React.FC = () => {
  const route = useRoute<RequestDetailsRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<BookingStackParamList>>();
  const { requestId } = route.params;

  const { data: request, isLoading, isError, error, refetch } = useRequest(requestId);
  const cancelRequestMutation = useCancelRequest();

  const handleCancelRequest = () => {
    Alert.alert(
      'Cancel Transport Request',
      'Are you sure you want to cancel this request? Nearby owners will stop receiving notifications.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            cancelRequestMutation.mutate(requestId, {
              onSuccess: () => {
                Alert.alert('Request Cancelled', 'Your request has been successfully cancelled.');
                refetch();
              },
              onError: (err: any) => {
                Alert.alert('Failed to Cancel', err.message || 'Server error.');
              },
            });
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Fetching request details...</Text>
      </SafeAreaView>
    );
  }

  if (isError || !request) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load request details</Text>
        <Text style={styles.errorSub}>{error?.message || 'Request not found.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'PENDING':
        return styles.statusPending;
      case 'OWNER_ASSIGNED':
        return styles.statusAssigned;
      case 'ACCEPTED':
        return styles.statusAccepted;
      case 'COMPLETED':
        return styles.statusCompleted;
      case 'CANCELLED':
      case 'REJECTED':
        return styles.statusCancelled;
      default:
        return styles.statusDefault;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Searching for nearby transport owners... Please wait.';
      case 'OWNER_ASSIGNED':
        return 'An owner has accepted your request! Confirm payment to secure your ride.';
      case 'ACCEPTED':
        return 'Ride Confirmed & Paid! The driver will meet you at the pickup point.';
      case 'COMPLETED':
        return 'This transport requirement has been successfully completed.';
      case 'CANCELLED':
        return 'You cancelled this requirement request.';
      case 'REJECTED':
        return 'This request expired or was rejected by matched owners.';
      default:
        return 'Status unknown.';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Requirement Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Box */}
        <View style={styles.statusBox}>
          <View style={styles.statusHeaderRow}>
            <Text style={styles.statusLabel}>Request Status</Text>
            <View style={[styles.statusBadge, getStatusBadgeStyle(request.status)]}>
              <Text style={[styles.statusBadgeText, { color: getStatusBadgeStyle(request.status).borderColor }]}>
                {request.status.replace('_', ' ')}
              </Text>
            </View>
          </View>
          <Text style={styles.statusMsg}>{getStatusMessage(request.status)}</Text>
          {request.status === 'PENDING' && (
            <ActivityIndicator style={{ marginTop: 12, alignSelf: 'flex-start' }} size="small" color={colors.primary} />
          )}
        </View>

        {/* Route Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Route & Purpose</Text>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Purpose</Text>
            <Text style={styles.detailVal}>{request.purpose.replace('_', ' ')}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Pickup Location</Text>
            <Text style={styles.detailVal}>📍 {request.pickupAddress}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Drop Location</Text>
            <Text style={styles.detailVal}>🏁 {request.dropAddress}</Text>
          </View>

          {request.distanceKm > 0 && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Estimated Distance</Text>
              <Text style={styles.detailVal}>{request.distanceKm.toFixed(1)} km</Text>
            </View>
          )}

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Scheduled Time</Text>
            <Text style={styles.detailVal}>
              📅 {new Date(request.scheduledAt).toLocaleDateString()} at{' '}
              {new Date(request.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {/* Description Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Requirement Description</Text>
          <Text style={styles.descriptionText}>{request.description}</Text>
        </View>

        {/* Assigned Owner Info Card */}
        {request.status !== 'PENDING' && request.assignedOwner && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Assigned Owner & Vehicle</Text>
            
            <View style={styles.driverRow}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>👤</Text>
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{request.assignedOwner.name}</Text>
                <Text style={styles.driverPhone}>📞 {request.assignedOwner.phone}</Text>
              </View>
            </View>

            {request.assignedVehicle && (
              <View style={styles.vehicleDetails}>
                <Text style={styles.vehicleTitle}>
                  🚗 {request.assignedVehicle.brand} {request.assignedVehicle.model} ({request.assignedVehicle.year})
                </Text>
                <Text style={styles.vehiclePlate}>Number Plate: {request.assignedVehicle.vehicleNumber}</Text>
                <Text style={styles.vehicleFuel}>
                  Fuel: {request.assignedVehicle.fuelType} • Transmission: {request.assignedVehicle.transmission}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Fare Estimate Card */}
        <View style={styles.card}>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Total Fare Estimate</Text>
            <Text style={styles.fareValue}>₹{request.estimatedFare}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Footers */}
      <View style={styles.footer}>
        {request.status === 'PENDING' && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancelRequest}
            disabled={cancelRequestMutation.isPending}
          >
            {cancelRequestMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.cancelBtnText}>Cancel Requirement Request</Text>
            )}
          </TouchableOpacity>
        )}

        {request.status === 'OWNER_ASSIGNED' && (
          <View style={styles.paymentButtonRow}>
            <TouchableOpacity
              style={styles.payBtn}
              onPress={() =>
                navigation.navigate('PaymentScreen', {
                  requestId: request.id,
                  amount: request.estimatedFare,
                })
              }
            >
              <Text style={styles.payBtnText}>Confirm / Pay (₹{request.estimatedFare})</Text>
            </TouchableOpacity>
          </View>
        )}

        {request.status === 'ACCEPTED' && (
          <View style={styles.confirmedBox}>
            <Text style={styles.confirmedText}>✓ Ride Confirmed & Active</Text>
          </View>
        )}
      </View>
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
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 16,
  },
  backBtnText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 120,
  },
  statusBox: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusPending: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderColor: '#eab308',
  },
  statusAssigned: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3b82f6',
  },
  statusAccepted: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: '#22c55e',
  },
  statusCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
  },
  statusCancelled: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
  },
  statusDefault: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderColor: '#64748b',
  },
  statusMsg: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 8,
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailVal: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  descriptionText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  driverInfo: {
    marginLeft: 12,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  driverPhone: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  vehicleDetails: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vehicleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  vehiclePlate: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  vehicleFuel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  fareValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 13,
  },
  errorText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.error,
  },
  errorSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  retryBtn: {
    marginTop: 14,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 20,
  },
  cancelBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  paymentButtonRow: {
    flexDirection: 'column',
  },
  payBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  payBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmedBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: '#22c55e',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmedText: {
    color: '#22c55e',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default RequestDetailsScreen;
