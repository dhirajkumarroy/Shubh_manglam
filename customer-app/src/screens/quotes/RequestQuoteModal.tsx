import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import colors from '../../theme/colors';
import { quoteService } from '../../api/quote.service';
import { EventService, EventItem } from '../../api/event.service';

interface RequestQuoteModalProps {
  visible: boolean;
  vendorId: string;
  vendorName: string;
  preselectedServiceId?: string;
  preselectedServiceName?: string;
  onClose: () => void;
  onSuccess: (quoteId: string) => void;
}

export const RequestQuoteModal: React.FC<RequestQuoteModalProps> = ({
  visible,
  vendorId,
  vendorName,
  preselectedServiceId,
  preselectedServiceName,
  onClose,
  onSuccess,
}) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);
  const [customerNotes, setCustomerNotes] = useState('');
  const [guestCount, setGuestCount] = useState('100');
  const [requestedDate, setRequestedDate] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      loadEvents();
    }
  }, [visible]);

  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const list = await EventService.getEvents();
      setEvents(list);
      if (list.length > 0) {
        setSelectedEventId(list[0].id);
      }
    } catch (e) {
      console.warn('Could not load events:', e);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const payload: any = {
        vendorId,
        customerNotes: customerNotes.trim() || undefined,
        eventId: selectedEventId || undefined,
        guestCount: guestCount ? parseInt(guestCount, 10) : undefined,
        requestedDate: requestedDate.trim() || undefined,
      };

      if (preselectedServiceId) {
        payload.requestedServiceIds = [preselectedServiceId];
      }

      const quote = await quoteService.requestQuote(payload);
      Alert.alert(
        'Quote Request Sent!',
        `Your request #${quote.quoteNumber} has been sent to ${vendorName}. They will prepare and send an itemized proposal.`
      );
      onClose();
      onSuccess(quote.id);
    } catch (err: any) {
      Alert.alert('Request Failed', err.response?.data?.message || 'Failed to submit quote request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>Request Formal Quote</Text>
          <Text style={styles.subtitle}>from {vendorName}</Text>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {preselectedServiceName && (
              <View style={styles.serviceChip}>
                <Text style={styles.serviceChipLabel}>Selected Service:</Text>
                <Text style={styles.serviceChipText}>✨ {preselectedServiceName}</Text>
              </View>
            )}

            {/* Select Event */}
            <Text style={styles.fieldLabel}>For Event / Occasion</Text>
            {loadingEvents ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : events.length > 0 ? (
              <View style={styles.eventsRow}>
                {events.map((ev) => {
                  const isSel = selectedEventId === ev.id;
                  return (
                    <TouchableOpacity
                      key={ev.id}
                      style={[styles.eventPill, isSel && styles.eventPillActive]}
                      onPress={() => setSelectedEventId(ev.id)}
                    >
                      <Text style={[styles.eventPillText, isSel && styles.eventPillTextActive]}>
                        {ev.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.noEventsText}>No saved events. You can enter details below.</Text>
            )}

            {/* Guest Count */}
            <Text style={styles.fieldLabel}>Estimated Guests</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 200"
              placeholderTextColor={colors.textLight}
              keyboardType="number-pad"
              value={guestCount}
              onChangeText={setGuestCount}
            />

            {/* Notes */}
            <Text style={styles.fieldLabel}>Specific Requirements or Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. Need royal theme setup, entrance floral arch, stage lighting with sound system."
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={4}
              value={customerNotes}
              onChangeText={setCustomerNotes}
              maxLength={1000}
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>Submit Request</Text>
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
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  body: {
    marginBottom: 16,
  },
  serviceChip: {
    backgroundColor: colors.backgroundWarm,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceChipLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  serviceChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    marginTop: 10,
  },
  eventsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  eventPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eventPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  eventPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  eventPillTextActive: {
    color: colors.white,
  },
  noEventsText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.backgroundWarm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});

export default RequestQuoteModal;
