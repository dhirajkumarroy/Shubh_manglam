import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import colors from '../../theme/colors';

interface BookingConfirmationModalProps {
  visible: boolean;
  vendorName: string;
  totalAmount: number;
  eventDate?: string;
  quoteNumber: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  visible,
  vendorName,
  totalAmount,
  eventDate,
  quoteNumber,
  onClose,
  onConfirm,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to accept quote.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.iconWrapper}>
            <Text style={styles.icon}>🤝</Text>
          </View>

          <Text style={styles.title}>Confirm & Book</Text>
          <Text style={styles.subtitle}>Accept Quote #{quoteNumber}</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Vendor</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {vendorName}
              </Text>
            </View>

            {eventDate && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Event Date</Text>
                <Text style={styles.summaryValue}>
                  {new Date(eventDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Agreed Total</Text>
              <Text style={styles.totalValue}>₹{totalAmount.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <View style={styles.termsBox}>
            <Text style={styles.termsText}>
              By accepting this quote, your booking will be confirmed with {vendorName}. The agreed prices will be securely locked in your historical booking record.
            </Text>
            <View style={styles.paymentStatusBadge}>
              <Text style={styles.paymentStatusText}>Payment Status: PENDING</Text>
            </View>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.cancelText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.confirmText}>Accept & Book</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 10,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accentGoldBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
    marginBottom: 16,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: colors.backgroundWarm,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  termsBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  termsText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    textAlign: 'center',
  },
  paymentStatusBadge: {
    marginTop: 8,
    alignSelf: 'center',
    backgroundColor: colors.accentGoldBg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  paymentStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentGold,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginBottom: 12,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.backgroundWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});

export default BookingConfirmationModal;
