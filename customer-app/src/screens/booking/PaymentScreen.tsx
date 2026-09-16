import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Alert, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { BookingStackParamList } from '../../navigation/types';
import { useRequest } from '../../hooks/useRequests';
import { useCreateOrder, useVerifyPayment, useMyPayments, usePayWithCOD } from '../../hooks/usePayments';
import { useAppSelector } from '../../store';
import Config from '../../config';
import RazorpayCheckout from 'react-native-razorpay';
import colors from '../../theme/colors';

type PaymentScreenRouteProp = RouteProp<BookingStackParamList, 'PaymentScreen'>;

export const PaymentScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<PaymentScreenRouteProp>();
  const { requestId } = route.params;

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Redux auth user (for pre-filling checkout details)
  const user = useAppSelector((state) => state.auth.user);

  // Fetch current transport request details
  const {
    data: request,
    isLoading: requestLoading,
    isError: requestError,
    error: requestErr,
    refetch: refetchRequest,
  } = useRequest(requestId);

  // Fetch payments to resolve exact status
  const {
    data: myPaymentsData,
    isLoading: paymentsLoading,
    refetch: refetchPayments,
  } = useMyPayments({ limit: 100 });

  const createOrderMutation = useCreateOrder();
  const verifyPaymentMutation = useVerifyPayment();
  const payWithCODMutation = usePayWithCOD();

  const handlePayWithCOD = () => {
    if (!request) return;

    Alert.alert(
      'Confirm Cash on Delivery',
      'Are you sure you want to confirm this transport request using Cash on Delivery? You will pay the owner in cash upon delivery completion.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm COD',
          onPress: () => {
            payWithCODMutation.mutate(requestId, {
              onSuccess: () => {
                refetchRequest();
                refetchPayments();
                Alert.alert(
                  'Ride Confirmed',
                  'Your transport request has been confirmed via Cash on Delivery.',
                  [
                    {
                      text: 'View My Requests',
                      onPress: () => {
                        navigation.navigate('BookingTab', { screen: 'MyBookings' });
                      },
                    },
                  ]
                );
              },
              onError: (error: any) => {
                Alert.alert('COD Failed', error.message || 'Could not complete COD request.');
              },
            });
          },
        },
      ]
    );
  };

  // Find the specific payment for this request, if it exists
  const activePayment = myPaymentsData?.payments?.find(
    (p: any) => p.requestId === requestId
  );

  // Resolve current active status
  const getStatusDisplay = () => {
    if (request?.status === 'ACCEPTED' || request?.status === 'COMPLETED') {
      return {
        label: 'SUCCESS',
        color: colors.success,
        description: 'Payment verified and request confirmed.',
      };
    }
    if (request?.status === 'CANCELLED') {
      return {
        label: 'CANCELLED',
        color: colors.error,
        description: 'Request has been cancelled.',
      };
    }
    if (request?.status === 'REJECTED') {
      return {
        label: 'REJECTED',
        color: colors.error,
        description: 'Request was rejected or has expired.',
      };
    }

    if (activePayment) {
      switch (activePayment.status) {
        case 'SUCCESS':
          return {
            label: 'SUCCESS',
            color: colors.success,
            description: 'Payment verified and booking confirmed.',
          };
        case 'FAILED':
          return {
            label: 'FAILED',
            color: colors.error,
            description: 'Previous transaction failed. Please retry.',
          };
        case 'REFUNDED':
          return {
            label: 'REFUNDED',
            color: colors.textMuted,
            description: 'Payment was refunded.',
          };
        case 'PENDING':
        default:
          return {
            label: 'PENDING',
            color: colors.primary,
            description: 'Awaiting checkout authorization.',
          };
      }
    }

    return {
      label: 'PENDING',
      color: colors.primary,
      description: 'Awaiting checkout authorization.',
    };
  };

  const statusInfo = getStatusDisplay();

  // Launch checkout
  const handlePayNow = async () => {
    if (!request) return;

    setCheckoutLoading(true);

    try {
      // 1. Create order on backend
      const orderData = await createOrderMutation.mutateAsync(requestId);
      const { razorpayOrder } = orderData;

      // 2. Prepare checkout options
      const options = {
        description: `Transport requirement payment ref: ${request.id.slice(0, 8)}`,
        image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=120&auto=format&fit=crop',
        currency: razorpayOrder.currency || 'INR',
        key: Config.RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount, // in paise
        name: 'Shubh Mangalam Marketplace',
        order_id: razorpayOrder.id,
        prefill: {
          email: user?.email || '',
          contact: user?.phone || '',
          name: user?.name || '',
        },
        theme: {
          color: colors.primary,
        },
      };

      // 3. Open Razorpay checkout screen
      try {
        if (!RazorpayCheckout || typeof RazorpayCheckout.open !== 'function') {
          throw new Error('Razorpay SDK native module not loaded.');
        }

        const data = await RazorpayCheckout.open(options);

        // 4. Send verification payload to backend on checkout success
        await verifyPaymentMutation.mutateAsync({
          razorpayOrderId: data.razorpay_order_id,
          razorpayPaymentId: data.razorpay_payment_id,
          razorpaySignature: data.razorpay_signature,
        });

        refetchRequest();
        refetchPayments();
        setCheckoutLoading(false);

        Alert.alert(
          'Payment Successful',
          'Your signature has been verified and request is now CONFIRMED.',
          [
            {
              text: 'View Requests',
              onPress: () => {
                navigation.navigate('BookingTab', { screen: 'MyBookings' });
              },
            },
          ]
        );
      } catch (sdkError: any) {
        setCheckoutLoading(false);

        if (sdkError.message?.includes('native module') || !RazorpayCheckout) {
          Alert.alert(
            'SDK Not Available',
            'Razorpay native module is not linked in this environment. Simulate a successful payment?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Simulate Verification',
                onPress: () => handleSimulatedPaymentSuccess(razorpayOrder.id),
              },
            ]
          );
        } else {
          Alert.alert(
            'Payment Cancelled',
            sdkError.description || 'The transaction was cancelled by the user.',
            [{ text: 'Dismiss' }]
          );
        }
      }
    } catch (orderError: any) {
      setCheckoutLoading(false);
      Alert.alert(
        'Order Creation Failed',
        orderError.message || 'Could not register order with the server.'
      );
    }
  };

  const handleSimulatedPaymentSuccess = async (razorpayOrderId: string) => {
    setCheckoutLoading(true);
    try {
      await verifyPaymentMutation.mutateAsync({
        razorpayOrderId: razorpayOrderId,
        razorpayPaymentId: `pay_mock_${Math.random().toString(36).substring(7)}`,
        razorpaySignature: 'mock_signature_from_expo_go_simulation',
      });

      refetchRequest();
      refetchPayments();
      setCheckoutLoading(false);

      Alert.alert(
        'Signature Verification Sent',
        'Verification request has been submitted successfully.',
        [
          {
            text: 'Okay',
            onPress: () => {
              navigation.navigate('BookingTab', { screen: 'MyBookings' });
            },
          },
        ]
      );
    } catch (error: any) {
      setCheckoutLoading(false);
      Alert.alert(
        'Verification Response',
        error.message || 'Backend rejected simulation.'
      );
    }
  };

  if (requestLoading || paymentsLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Fetching checkout records...</Text>
      </SafeAreaView>
    );
  }

  if (requestError || !request) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>Checkout Load Failed</Text>
        <Text style={styles.errorSub}>{requestErr?.message || 'Could not retrieve request details.'}</Text>
      </SafeAreaView>
    );
  }

  const { assignedVehicle: vehicle } = request;

  // Price calculations
  const totalPayable = request.estimatedFare;
  const taxAmount = Number((totalPayable * 0.18).toFixed(2));
  const baseCharges = Number((totalPayable - taxAmount).toFixed(2));

  const isActionPending =
    checkoutLoading ||
    createOrderMutation.isPending ||
    verifyPaymentMutation.isPending ||
    payWithCODMutation.isPending;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Secure Checkout</Text>
          <Text style={styles.subtitle}>Complete checkout using Razorpay or COD</Text>
        </View>

        {/* Status indicator bar */}
        <View style={styles.statusBox}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Checkout Status</Text>
            <View style={[styles.statusBadge, { borderColor: statusInfo.color }]}>
              <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>
          <Text style={styles.statusDescription}>{statusInfo.description}</Text>
        </View>

        {/* Vehicle Information */}
        {vehicle && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Assigned Vehicle Info</Text>
            <View style={styles.vehicleRow}>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleBrand}>{vehicle.brand}</Text>
                <Text style={styles.vehicleTitle}>{vehicle.title} • {vehicle.model}</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{vehicle.category}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Request Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Scheduled Time</Text>
              <Text style={styles.summaryVal}>
                {new Date(request.scheduledAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Purpose</Text>
              <Text style={styles.summaryVal}>{request.purpose.replace('_', ' ')}</Text>
            </View>
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.pricingCard}>
          <Text style={styles.pricingTitle}>Payment Summary</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceDesc}>Marketplace Base Charges</Text>
            <Text style={styles.priceVal}>₹{baseCharges}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceDesc}>Taxes & Fees (18% GST)</Text>
            <Text style={styles.priceVal}>₹{taxAmount}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalDesc}>Total Payable</Text>
            <Text style={styles.totalVal}>₹{totalPayable}</Text>
          </View>

          <View style={styles.secureContainer}>
            <Text style={styles.secureText}>🔒 256-bit Encrypted SSL Gateway</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer / Actions */}
      <View style={styles.footer}>
        {statusInfo.label === 'SUCCESS' ? (
          <TouchableOpacity
            style={styles.successBtn}
            onPress={() => navigation.navigate('BookingTab', { screen: 'MyBookings' })}
          >
            <Text style={styles.footerBtnText}>Go to My Requests</Text>
          </TouchableOpacity>
        ) : statusInfo.label === 'CANCELLED' || statusInfo.label === 'REJECTED' ? (
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.secondaryBtnText}>Return to Details</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionBtnCol}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handlePayNow}
              disabled={isActionPending}
            >
              {isActionPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.footerBtnText}>Pay Online (₹{totalPayable})</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={handlePayWithCOD}
              disabled={isActionPending}
            >
              <Text style={styles.outlineBtnText}>Pay Cash on Delivery (COD)</Text>
            </TouchableOpacity>
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
  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 160,
  },
  header: {
    paddingTop: 16,
    marginBottom: 20,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  backBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  statusBox: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  statusBadge: {
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusDescription: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleBrand: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  vehicleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  categoryText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCol: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryVal: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '700',
    marginTop: 2,
  },
  pricingCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  pricingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceDesc: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  priceVal: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  totalDesc: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  totalVal: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  secureContainer: {
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  secureText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 13,
  },
  errorText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '700',
  },
  errorSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
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
  successBtn: {
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryBtn: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  footerBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  outlineBtn: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  outlineBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnCol: {
    flexDirection: 'column',
  },
});

export default PaymentScreen;
