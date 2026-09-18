import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import CircularProgress from './CircularProgress';
import { ProfileCompleteness } from '../types';

interface ProfileCompletionCardProps {
  completeness?: ProfileCompleteness | null;
  status?: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  onNavigateToComplete?: () => void;
  onSubmitForReview?: () => Promise<void> | void;
  isSubmitting?: boolean;
}

export const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({
  completeness,
  status,
  onNavigateToComplete,
  onSubmitForReview,
  isSubmitting = false,
}) => {
  const percentage = completeness?.completionPercentage ?? 50;
  const isComplete = percentage >= 100;
  const canSubmit = (status === 'PENDING' || status === 'REJECTED') && isComplete;

  return (
    <View style={styles.card}>
      {/* 1. Left: Circular Progress Ring */}
      <View style={styles.progressWrap}>
        <CircularProgress percentage={percentage} size={54} strokeWidth={4.5} />
      </View>

      {/* 2. Middle: Content Description */}
      <View style={styles.textCol}>
        <Text style={styles.titleText}>
          {isComplete ? 'Profile Complete' : 'Complete Your Profile'}
        </Text>
        <Text style={styles.descText} numberOfLines={2}>
          {isComplete
            ? 'Your business profile and documentation are 100% verified.'
            : 'Add remaining details and documents to get 100% verification and build trust.'}
        </Text>
      </View>

      {/* 3. Right: Action Button */}
      {onSubmitForReview ? (
        <TouchableOpacity
          style={[styles.actionBtn, !canSubmit && styles.actionBtnDisabled]}
          activeOpacity={0.8}
          onPress={onSubmitForReview}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.actionBtnText}>
              {status === 'REJECTED' ? 'Resubmit →' : 'Submit Review →'}
            </Text>
          )}
        </TouchableOpacity>
      ) : onNavigateToComplete ? (
        <TouchableOpacity
          style={[styles.actionBtn, isComplete && styles.actionBtnComplete]}
          activeOpacity={0.8}
          onPress={onNavigateToComplete}
        >
          <Text style={[styles.actionBtnText, isComplete && styles.actionBtnTextComplete]}>
            {isComplete ? 'View Profile →' : 'Complete Now →'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFDF9',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },
  progressWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  titleText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 2,
  },
  descText: {
    fontSize: 11,
    color: '#78716C',
    lineHeight: 15,
  },
  actionBtn: {
    backgroundColor: '#E65100', // Saffron orange
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  actionBtnComplete: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  actionBtnTextComplete: {
    color: '#065F46',
  },
});

export default ProfileCompletionCard;
