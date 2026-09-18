import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import colors from '../../theme/colors';

interface RequestRevisionModalProps {
  visible: boolean;
  quoteNumber: string;
  onClose: () => void;
  onSubmit: (notes: string) => Promise<void>;
}

export const RequestRevisionModal: React.FC<RequestRevisionModalProps> = ({
  visible,
  quoteNumber,
  onClose,
  onSubmit,
}) => {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!notes || notes.trim().length < 5) {
      setError('Please provide at least 5 characters explaining what you want revised.');
      return;
    }
    if (notes.length > 1500) {
      setError('Notes cannot exceed 1500 characters.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(notes.trim());
      setNotes('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to request revision.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
          >
            <View style={styles.dialog}>
              <View style={styles.header}>
                <Text style={styles.title}>Request a Revision</Text>
                <Text style={styles.subtitle}>Quote #{quoteNumber}</Text>
              </View>

              <Text style={styles.instruction}>
                What would you like the vendor to modify? (e.g. Include additional items, adjust quantities, or review pricing)
              </Text>

              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={4}
                placeholder="e.g. Can you please add entrance floral decoration and keep the total within ₹45,000?"
                placeholderTextColor={colors.textLight}
                value={notes}
                onChangeText={(val) => {
                  setNotes(val);
                  if (error) setError(null);
                }}
                maxLength={1500}
              />

              <View style={styles.characterCount}>
                <Text style={styles.charText}>{notes.length} / 1500</Text>
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                  disabled={submitting}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.submitButton]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.submitText}>Send Request</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
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
  container: {
    width: '100%',
    maxWidth: 420,
  },
  dialog: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  instruction: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: colors.text,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  charText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  button: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.backgroundWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});

export default RequestRevisionModal;
