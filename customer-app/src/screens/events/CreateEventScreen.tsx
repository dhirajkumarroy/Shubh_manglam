import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import colors from '../../theme/colors';
import {
  useEventTypes,
  useRecommendedCategories,
  useCustomerAddresses,
  useCreateEvent,
  useCreateRequirement,
} from '../../hooks/useEventPlanning';
import { AppIcon } from '../../components/AppIcon';

export const CreateEventScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialEventType = route.params?.selectedEventType;

  const { data: eventTypes = [] } = useEventTypes();
  const [selectedEventTypeId, setSelectedEventTypeId] = useState<string>(
    initialEventType?.id || ''
  );

  // When event types load, set default if not already set
  useEffect(() => {
    if (!selectedEventTypeId && eventTypes.length > 0) {
      setSelectedEventTypeId(eventTypes[0].id);
    }
  }, [eventTypes, selectedEventTypeId]);

  const { data: recommendedCategories = [], isLoading: categoriesLoading } =
    useRecommendedCategories(selectedEventTypeId);
  const { data: savedAddresses = [] } = useCustomerAddresses();

  const createEventMutation = useCreateEvent();
  const createRequirementMutation = useCreateRequirement();

  // Form states
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('23:00');
  const [guestCount, setGuestCount] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [description, setDescription] = useState('');

  // Location states
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [detectingGps, setDetectingGps] = useState(false);

  // Requirements checklist state: map of categoryId -> boolean (selected)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Record<string, boolean>>({});

  const handleToggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleDetectGps = async () => {
    try {
      setDetectingGps(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please allow location access to automatically detect your celebration venue address.'
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude;
      const lon = loc.coords.longitude;
      setLatitude(lat);
      setLongitude(lon);

      const reverse = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (reverse.length > 0) {
        const item = reverse[0];
        setCity(item.city || item.district || item.subregion || '');
        setPincode(item.postalCode || '');
        const line = [item.name, item.street, item.subregion].filter(Boolean).join(', ');
        if (line) setAddressLine1(line);
      }
    } catch (err) {
      console.error('GPS error:', err);
      Alert.alert('Location Error', 'Unable to detect GPS location. Please enter your address manually.');
    } finally {
      setDetectingGps(false);
    }
  };

  const handleSelectSavedAddress = (addr: any) => {
    setAddressLine1(addr.addressLine1);
    setCity(addr.city);
    setPincode(addr.pincode);
    if (addr.latitude && addr.longitude) {
      setLatitude(Number(addr.latitude));
      setLongitude(Number(addr.longitude));
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Field', 'Please enter a title or name for your celebration.');
      return;
    }
    if (!selectedEventTypeId) {
      Alert.alert('Missing Field', 'Please select a celebration type.');
      return;
    }
    if (!eventDate.trim()) {
      Alert.alert('Missing Field', 'Please enter an event date (e.g. YYYY-MM-DD).');
      return;
    }
    if (!addressLine1.trim() || !city.trim() || !pincode.trim()) {
      Alert.alert('Missing Address', 'Please provide a venue address line, city, and 6-digit pincode.');
      return;
    }
    if (!/^\d{6}$/.test(pincode.trim())) {
      Alert.alert('Invalid Pincode', 'Pincode must be a 6-digit Indian PIN code.');
      return;
    }

    try {
      const createdEvent = await createEventMutation.mutateAsync({
        eventTypeId: selectedEventTypeId,
        title: title.trim(),
        description: description.trim() || undefined,
        eventDate: eventDate.trim(),
        startTime: startTime.trim() || undefined,
        endTime: endTime.trim() || undefined,
        guestCount: guestCount ? parseInt(guestCount, 10) : undefined,
        budgetMin: budgetMin ? parseFloat(budgetMin) : undefined,
        budgetMax: budgetMax ? parseFloat(budgetMax) : undefined,
        addressLine1: addressLine1.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        latitude,
        longitude,
      });

      // Add selected requirements
      const selectedReqCategories = Object.keys(selectedCategoryIds).filter(
        (id) => selectedCategoryIds[id]
      );

      if (selectedReqCategories.length > 0) {
        await Promise.all(
          selectedReqCategories.map((catId) =>
            createRequirementMutation.mutateAsync({
              eventId: createdEvent.id,
              payload: { categoryId: catId, quantity: 1 },
            })
          )
        );
      }

      Alert.alert('🎉 Celebration Created!', 'Your event has been planned. Now discover verified nearby vendors.', [
        {
          text: 'View Event',
          onPress: () => navigation.replace('EventDetailsScreen', { eventId: createdEvent.id }),
        },
      ]);
    } catch (err: any) {
      console.error('Error creating event:', err);
      Alert.alert('Creation Failed', err.response?.data?.message || 'Failed to create celebration.');
    }
  };

  const isSubmitting = createEventMutation.isPending || createRequirementMutation.isPending;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <AppIcon name="chevron-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>Plan New Celebration</Text>
          <Text style={styles.subTitle}>Set up your event & requirements</Text>
        </View>
      </View>

      {/* Stepper Progress Bar */}
      <View style={styles.stepperWrap}>
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, styles.stepCircleActive]}>
            <Text style={styles.stepCircleText}>1</Text>
          </View>
          <Text style={[styles.stepLabel, styles.stepLabelActive]}>Occasion</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, styles.stepCircleActive]}>
            <Text style={styles.stepCircleText}>2</Text>
          </View>
          <Text style={[styles.stepLabel, styles.stepLabelActive]}>Details</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, styles.stepCircleActive]}>
            <Text style={styles.stepCircleText}>3</Text>
          </View>
          <Text style={[styles.stepLabel, styles.stepLabelActive]}>Venue</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, styles.stepCircleActive]}>
            <Text style={styles.stepCircleText}>4</Text>
          </View>
          <Text style={[styles.stepLabel, styles.stepLabelActive]}>Services</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step 1: Select Event Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Celebration Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventTypeScroll}>
            {eventTypes.map((et) => (
              <TouchableOpacity
                key={et.id}
                style={[
                  styles.eventTypeChip,
                  selectedEventTypeId === et.id && styles.eventTypeChipActive,
                ]}
                onPress={() => setSelectedEventTypeId(et.id)}
              >
                <Text style={styles.eventTypeIcon}>{et.icon || '✨'}</Text>
                <Text
                  style={[
                    styles.eventTypeText,
                    selectedEventTypeId === et.id && styles.eventTypeTextActive,
                  ]}
                >
                  {et.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Step 2: Event Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Celebration Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Celebration Name / Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul & Priya Wedding, Aarav's 1st Birthday"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-12-25"
                placeholderTextColor="#9CA3AF"
                value={eventDate}
                onChangeText={setEventDate}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Guest Count</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 150"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={guestCount}
                onChangeText={setGuestCount}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Start Time (HH:MM)</Text>
              <TextInput
                style={styles.input}
                placeholder="18:00"
                placeholderTextColor="#9CA3AF"
                value={startTime}
                onChangeText={setStartTime}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>End Time (HH:MM)</Text>
              <TextInput
                style={styles.input}
                placeholder="23:00"
                placeholderTextColor="#9CA3AF"
                value={endTime}
                onChangeText={setEndTime}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Min Budget (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 50000"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={budgetMin}
                onChangeText={setBudgetMin}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Max Budget (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 200000"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={budgetMax}
                onChangeText={setBudgetMax}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes / Special Wishes</Text>
            <TextInput
              style={[styles.input, { height: 72, textAlignVertical: 'top' }]}
              placeholder="Any specific themes, colors, or catering preferences..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        {/* Step 3: Venue Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>3. Venue Location</Text>
            <TouchableOpacity
              style={styles.gpsButton}
              onPress={handleDetectGps}
              disabled={detectingGps}
            >
              {detectingGps ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AppIcon name="navigate-outline" size={13} color="#FFFFFF" />
                  <Text style={[styles.gpsButtonText, { marginLeft: 4 }]}>Auto-Detect GPS</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Saved Addresses quick-select */}
          {savedAddresses.length > 0 && (
            <View style={styles.savedAddressesBox}>
              <Text style={styles.subLabel}>Or select from saved locations:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                {savedAddresses.map((addr) => (
                  <TouchableOpacity
                    key={addr.id}
                    style={styles.savedAddrChip}
                    onPress={() => handleSelectSavedAddress(addr)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <AppIcon name="home-outline" size={12} color="#881337" />
                      <Text style={[styles.savedAddrChipText, { marginLeft: 4 }]}>
                        {addr.label || 'Saved'}: {addr.city} ({addr.pincode})
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Venue Address / Locality *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Grand Heritage Lawn, Sector 62"
              placeholderTextColor="#9CA3AF"
              value={addressLine1}
              onChangeText={setAddressLine1}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Mohali"
                placeholderTextColor="#9CA3AF"
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Pincode (6-digit) *</Text>
              <TextInput
                style={styles.input}
                placeholder="160062"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={6}
                value={pincode}
                onChangeText={setPincode}
              />
            </View>
          </View>
        </View>

        {/* Step 4: Recommended Category Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Services Needed</Text>
          <Text style={styles.sectionDesc}>
            Select the categories you need for this celebration. Verified vendors will be matched to these requirements.
          </Text>

          {categoriesLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
          ) : (
            <View style={styles.categoryGrid}>
              {recommendedCategories.map((cat) => {
                const isSelected = !!selectedCategoryIds[cat.id];
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryCheckCard, isSelected && styles.categoryCheckCardActive]}
                    activeOpacity={0.7}
                    onPress={() => handleToggleCategory(cat.id)}
                  >
                    <Text style={styles.catCheckIcon}>{cat.icon || '🎪'}</Text>
                    <Text style={[styles.catCheckName, isSelected && styles.catCheckNameActive]}>
                      {cat.name}
                    </Text>
                    <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Create Event & Discover Vendors →</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8E2',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#881337',
  },
  stepCircleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#881337',
    fontWeight: '700',
  },
  stepLine: {
    width: 28,
    height: 2,
    backgroundColor: '#E65100',
    marginHorizontal: 6,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  backBtnText: {
    fontSize: 24,
    color: '#1F2937',
    fontWeight: 'bold',
    marginTop: -3,
  },
  headerTitleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  subTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  sectionDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: -6,
    marginBottom: 14,
    lineHeight: 16,
  },
  eventTypeScroll: {
    gap: 8,
  },
  eventTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
  },
  eventTypeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  eventTypeIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  eventTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  eventTypeTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  subLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
  },
  gpsButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  gpsButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  savedAddressesBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  savedAddrChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  savedAddrChipText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600',
  },
  categoryGrid: {
    gap: 8,
  },
  categoryCheckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    borderRadius: 12,
  },
  categoryCheckCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  catCheckIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  catCheckName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  catCheckNameActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default CreateEventScreen;
