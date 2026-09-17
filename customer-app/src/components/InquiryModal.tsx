import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import colors from '../theme/colors';
import { bookingService } from '../api/booking.service';

interface InquiryModalProps {
  visible: boolean;
  onClose: () => void;
  vendorId: string;
  vendorName: string;
  serviceId?: string;
  serviceName?: string;
  onSuccess?: (inquiry: any) => void;
}

const COMMON_OCCASIONS = ['Birthday', 'Wedding', 'Engagement', 'Anniversary', 'Puja', 'Party'];

export const InquiryModal: React.FC<InquiryModalProps> = ({
  visible,
  onClose,
  vendorId,
  vendorName,
  serviceId,
  serviceName,
  onSuccess,
}) => {
  const [occasion, setOccasion] = useState<string>('Birthday');
  const [eventDate, setEventDate] = useState<string>('20 Sep 2026');
  const [guestCount, setGuestCount] = useState<string>('50');
  const [location, setLocation] = useState<string>('Model Town, Panipat');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!occasion.trim()) {
      Alert.alert('Occasion Required', 'Please choose or enter the occasion for your celebration.');
      return;
    }
    if (!eventDate.trim()) {
      Alert.alert('Date Required', 'Please enter the celebration date (e.g. 20 Sep 2026).');
      return;
    }

    try {
      setLoading(true);
      const res = await bookingService.createInquiry({
        vendorId,
        serviceId,
        occasion: occasion.trim(),
        eventDate: eventDate.trim(),
        guestCount: parseInt(guestCount, 10) || 50,
        location: location.trim() || 'Panipat',
        notes: notes.trim() || `Inquiry for ${serviceName || 'Celebration Service'}`,
      });

      Alert.alert(
        'Inquiry Sent Successfully! 🎉',
        `Your request for ${occasion} on ${eventDate} has been sent directly to "${vendorName}". They will review availability and respond shortly.`,
        [
          {
            text: 'View My Requests',
            onPress: () => {
              onClose();
              if (onSuccess) onSuccess(res);
            },
          },
          {
            text: 'OK',
            onPress: () => {
              onClose();
              if (onSuccess) onSuccess(res);
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Request Failed', err.response?.data?.message || err.message || 'Could not send inquiry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <Text style={styles.categoryBadge}>DIRECT INQUIRY</Text>
              </View>
              <Text style={styles.title} numberOfLines={1}>
                {vendorName}
              </Text>
              {serviceName ? (
                <Text style={styles.subtitle} numberOfLines={1}>
                  Service: {serviceName}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Occasion Selector */}
            <Text style={styles.inputLabel}>OCCASION / EVENT TYPE</Text>
            <View style={styles.occasionRow}>
              {COMMON_OCCASIONS.map((occ) => (
                <TouchableOpacity
                  key={occ}
                  style={[styles.occChip, occasion === occ && styles.occChipActive]}
                  onPress={() => setOccasion(occ)}
                >
                  <Text style={[styles.occChipText, occasion === occ && styles.occChipTextActive]}>
                    {occ === 'Birthday' && '🎂 '}
                    {occ === 'Wedding' && '💍 '}
                    {occ === 'Engagement' && '✨ '}
                    {occ === 'Anniversary' && '💐 '}
                    {occ === 'Puja' && '🕉️ '}
                    {occ === 'Party' && '🎉 '}
                    {occ}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Event Date Input */}
            <Text style={styles.inputLabel}>CELEBRATION DATE</Text>
            <TextInput
              style={styles.textInput}
              value={eventDate}
              onChangeText={setEventDate}
              placeholder="e.g. 20 Sep 2026 or DD-MM-YYYY"
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.quickDateRow}>
              <TouchableOpacity
                style={styles.quickDateBtn}
                onPress={() => setEventDate('20 Sep 2026')}
              >
                <Text style={styles.quickDateText}>20 Sep 2026</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickDateBtn}
                onPress={() => setEventDate('Next Weekend')}
              >
                <Text style={styles.quickDateText}>Next Weekend</Text>
              </TouchableOpacity>
            </View>

            {/* How many people / Guest Count */}
            <View style={styles.rowTwoCols}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>GUESTS / PEOPLE</Text>
                <TextInput
                  style={styles.textInput}
                  value={guestCount}
                  onChangeText={setGuestCount}
                  keyboardType="numeric"
                  placeholder="e.g. 50"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={{ flex: 1.5, marginLeft: 8 }}>
                <Text style={styles.inputLabel}>CITY / AREA</Text>
                <TextInput
                  style={styles.textInput}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g. Panipat"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Special Notes */}
            <Text style={styles.inputLabel}>SPECIAL REQUIREMENTS / NOTES (OPTIONAL)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Need live halwai counter, pure veg, morning poori sabzi & evening sweets..."
              placeholderTextColor="#9CA3AF"
              multiline={true}
              numberOfLines={3}
            />

            {/* Guarantee Note */}
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>
                🛡️ <Text style={{ fontWeight: '700' }}>No Obligation:</Text> Submitting an inquiry allows the provider to check their calendar and confirm service rates with you.
              </Text>
            </View>
          </ScrollView>

          {/* Bottom Action */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.85}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Send Inquiry to Provider 🚀</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  badgeRow: {
    marginBottom: 4,
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C2410C',
    backgroundColor: '#FFF7ED',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
  },
  subtitle: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeBtnText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '700',
  },
  body: {
    padding: 20,
    paddingBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 10,
  },
  occasionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  occChip: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  occChipActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F97316',
  },
  occChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  occChipTextActive: {
    color: '#EA580C',
    fontWeight: '800',
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top',
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  quickDateBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  quickDateText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700',
  },
  rowTwoCols: {
    flexDirection: 'row',
  },
  noteBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 14,
  },
  noteText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
