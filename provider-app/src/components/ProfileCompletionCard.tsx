import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import colors from '../theme/colors';
import { ProfileCompleteness } from '../types';

interface ProfileCompletionCardProps {
  completeness: ProfileCompleteness;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  onSubmitForReview: () => Promise<void>;
  isSubmitting?: boolean;
}

export const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({
  completeness,
  status,
  onSubmitForReview,
  isSubmitting = false,
}) => {
  const { profileCompleted, completionPercentage, missingFields } = completeness;
  const canSubmit = (status === 'PENDING' || status === 'REJECTED') && profileCompleted;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Profile Readiness</Text>
        <Text style={styles.percentText}>{completionPercentage}% Complete</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${completionPercentage}%` }]} />
      </View>

      {/* Missing Requirements List */}
      {missingFields.length > 0 ? (
        <View style={styles.missingContainer}>
          <Text style={styles.missingTitle}>Required before review submission:</Text>
          {missingFields.map((field) => (
            <Text key={field} style={styles.missingItem}>
              • {field}
            </Text>
          ))}
        </View>
      ) : (
        <View style={styles.readyContainer}>
          <Text style={styles.readyText}>
            🎉 All required business details and documents are complete!
          </Text>
        </View>
      )}

      {/* Action Button */}
      {status === 'PENDING' || status === 'REJECTED' ? (
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.buttonDisabled]}
          onPress={onSubmitForReview}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.submitButtonText}>
              {status === 'REJECTED' ? 'Resubmit for Admin Review' : 'Submit for Admin Review'}
            </Text>
          )}
        </TouchableOpacity>
      ) : status === 'UNDER_REVIEW' ? (
        <View style={styles.inReviewBanner}>
          <Text style={styles.inReviewText}>
            ⏳ Your application is currently under administrative review.
          </Text>
        </View>
      ) : status === 'APPROVED' ? (
        <View style={styles.approvedBanner}>
          <Text style={styles.approvedText}>
            ✅ Verified & Approved. Your profile is active on the marketplace.
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  percentText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  missingContainer: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  missingTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  missingItem: {
    fontSize: 11,
    color: '#B45309',
    marginLeft: 4,
    lineHeight: 16,
  },
  readyContainer: {
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  readyText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 13,
  },
  inReviewBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  inReviewText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
  },
  approvedBanner: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  approvedText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '700',
  },
});

export default ProfileCompletionCard;
