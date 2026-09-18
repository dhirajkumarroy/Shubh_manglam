import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import AppIcon from './AppIcon';

interface VerificationCardProps {
  status?: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  isVerified?: boolean;
  onPressDetails?: () => void;
}

export const VerificationCard: React.FC<VerificationCardProps> = ({
  status = 'PENDING',
  isVerified = false,
  onPressDetails,
}) => {
  const isApproved = status === 'APPROVED' || isVerified;

  if (isApproved) {
    return (
      <View style={[styles.card, styles.cardApproved]}>
        {/* Left: Shield Checkmark Badge */}
        <View style={styles.badgeApproved}>
          <AppIcon type="ionicons" name="shield-checkmark" size={24} color="#FFFFFF" />
        </View>

        {/* Center: Title & Description */}
        <View style={styles.contentCol}>
          <Text style={styles.titleApproved}>Verified Partner</Text>
          <Text style={styles.descApproved}>
            Your business is live and ready to receive leads and bookings.
          </Text>
        </View>

        {/* Right: Pill Button */}
        {onPressDetails && (
          <TouchableOpacity
            style={styles.actionBtnApproved}
            activeOpacity={0.8}
            onPress={onPressDetails}
          >
            <Text style={styles.actionTextApproved}>View Details →</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Pending Review
  if (status === 'UNDER_REVIEW') {
    return (
      <View style={[styles.card, styles.cardReview]}>
        <View style={styles.badgeReview}>
          <AppIcon type="ionicons" name="time-outline" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.contentCol}>
          <Text style={styles.titleReview}>Under Administrative Review</Text>
          <Text style={styles.descReview}>
            Our team is reviewing your profile and documents. You will be notified once live.
          </Text>
        </View>
        {onPressDetails && (
          <TouchableOpacity
            style={styles.actionBtnReview}
            activeOpacity={0.8}
            onPress={onPressDetails}
          >
            <Text style={styles.actionTextReview}>Check Status →</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Application Rejected / Issues
  if (status === 'REJECTED') {
    return (
      <View style={[styles.card, styles.cardRejected]}>
        <View style={styles.badgeRejected}>
          <AppIcon type="ionicons" name="alert-circle" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.contentCol}>
          <Text style={styles.titleRejected}>Verification Action Required</Text>
          <Text style={styles.descRejected}>
            Your registration could not be approved. Please review missing details.
          </Text>
        </View>
        {onPressDetails && (
          <TouchableOpacity
            style={styles.actionBtnRejected}
            activeOpacity={0.8}
            onPress={onPressDetails}
          >
            <Text style={styles.actionTextRejected}>Fix & Resubmit →</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Default: Pending Verification
  return (
    <View style={[styles.card, styles.cardPending]}>
      <View style={styles.badgePending}>
        <AppIcon type="ionicons" name="hourglass-outline" size={24} color="#FFFFFF" />
      </View>
      <View style={styles.contentCol}>
        <Text style={styles.titlePending}>Pending Verification</Text>
        <Text style={styles.descPending}>
          Upload documents and complete profile to get your business verified.
        </Text>
      </View>
      {onPressDetails && (
        <TouchableOpacity
          style={styles.actionBtnPending}
          activeOpacity={0.8}
          onPress={onPressDetails}
        >
          <Text style={styles.actionTextPending}>Complete Now →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },
  contentCol: {
    flex: 1,
  },

  // Approved Green
  cardApproved: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    shadowColor: '#10B981',
  },
  badgeApproved: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleApproved: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 2,
  },
  descApproved: {
    fontSize: 11,
    color: '#047857',
    lineHeight: 15,
  },
  actionBtnApproved: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionTextApproved: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },

  // Review Blue
  cardReview: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    shadowColor: '#2563EB',
  },
  badgeReview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleReview: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 2,
  },
  descReview: {
    fontSize: 11,
    color: '#1D4ED8',
    lineHeight: 15,
  },
  actionBtnReview: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionTextReview: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },

  // Pending Amber
  cardPending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    shadowColor: '#D97706',
  },
  badgePending: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titlePending: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 2,
  },
  descPending: {
    fontSize: 11,
    color: '#B45309',
    lineHeight: 15,
  },
  actionBtnPending: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionTextPending: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },

  // Rejected Red
  cardRejected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    shadowColor: '#DC2626',
  },
  badgeRejected: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRejected: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 2,
  },
  descRejected: {
    fontSize: 11,
    color: '#B91C1C',
    lineHeight: 15,
  },
  actionBtnRejected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionTextRejected: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
});

export default VerificationCard;
