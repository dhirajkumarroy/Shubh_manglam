import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, TextInput, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useCreateRequest } from '../../hooks/useRequests';
import requestService from '../../api/request.service';
import colors from '../../theme/colors';
import { HomeStackParamList } from '../../navigation/types';

interface RouteParams {
  purpose?: string;
}

export const CreateRequestScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const params = (route.params || {}) as RouteParams;

  const [step, setStep] = useState(1);
  const [purpose, setPurpose] = useState(params.purpose || 'PERSONAL_TRAVEL');
  
  // Pickup Location
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLat, setPickupLat] = useState(0);
  const [pickupLng, setPickupLng] = useState(0);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  // Drop Location
  const [dropAddress, setDropAddress] = useState('');
  const [dropLat, setDropLat] = useState(0);
  const [dropLng, setDropLng] = useState(0);

  // Timing & details
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState(new Date(Date.now() + 30 * 60 * 1000)); // default +30 mins

  // Estimates
  const [loadingEstimates, setLoadingEstimates] = useState(false);
  const [estimatesData, setEstimatesData] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const createRequestMutation = useCreateRequest();

  // Update purpose if route param changes
  useEffect(() => {
    if (params.purpose) {
      setPurpose(params.purpose);
    }
  }, [params.purpose]);

  // Request location permission and get current coordinates
  const handleUseCurrentLocation = async () => {
    setFetchingLocation(true);
    try {
      // 1. Request foreground permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'GPS location permissions are required to capture your current location. Please enable location permissions in your device settings.'
        );
        return;
      }

      // 2. Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert('GPS Disabled', 'Please turn on location services (GPS) on your device settings and try again.');
        return;
      }

      // 3. Get current location coordinates
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      setPickupLat(latitude);
      setPickupLng(longitude);

      // 4. Reverse geocode coordinates to fill pickup address automatically
      try {
        const reverseGeocoded = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverseGeocoded && reverseGeocoded.length > 0) {
          const address = reverseGeocoded[0];
          const formatted = [
            address.name,
            address.street,
            address.district,
            address.city,
            address.region,
            address.postalCode,
          ]
            .filter(Boolean)
            .join(', ');
          setPickupAddress(formatted || `GPS Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        } else {
          setPickupAddress(`GPS Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
      } catch (err) {
        setPickupAddress(`GPS Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      }
    } catch (error: any) {
      Alert.alert('Location Error', error.message || 'Unable to retrieve your current location. Please check your GPS settings.');
    } finally {
      setFetchingLocation(false);
    }
  };

  // Fetch estimates when moving to step 4
  const fetchEstimates = async () => {
    if (!pickupLat || !pickupLng) {
      Alert.alert('Pickup Location Required', 'Please tap "Use Current Location" or capture pickup coordinates.');
      return;
    }

    if (!dropAddress.trim()) {
      Alert.alert('Drop Address Required', 'Please type a drop location/destination address.');
      return;
    }

    setLoadingEstimates(true);

    let resolvedDropLat = dropLat;
    let resolvedDropLng = dropLng;

    // Try resolving drop coordinates using forward geocoding
    try {
      const geocoded = await Location.geocodeAsync(dropAddress.trim());
      if (geocoded && geocoded.length > 0) {
        resolvedDropLat = geocoded[0].latitude;
        resolvedDropLng = geocoded[0].longitude;
        setDropLat(resolvedDropLat);
        setDropLng(resolvedDropLng);
      } else {
        // Fallback coordinates ~5km away from pickup to generate estimate
        resolvedDropLat = pickupLat + 0.045;
        resolvedDropLng = pickupLng + 0.045;
        setDropLat(resolvedDropLat);
        setDropLng(resolvedDropLng);
      }
    } catch (err) {
      // Fallback coordinates
      resolvedDropLat = pickupLat + 0.045;
      resolvedDropLng = pickupLng + 0.045;
      setDropLat(resolvedDropLat);
      setDropLng(resolvedDropLng);
    }

    try {
      const data = await requestService.getEstimates({
        pickupLat,
        pickupLng,
        dropLat: resolvedDropLat,
        dropLng: resolvedDropLng,
      });
      setEstimatesData(data);
      if (data.estimates && data.estimates.length > 0) {
        // Pre-select first category
        setSelectedCategory(data.estimates[0].category);
      }
      setStep(4);
    } catch (error: any) {
      Alert.alert('Fare Suggestion Failed', error.message || 'Unable to fetch estimate rules.');
    } finally {
      setLoadingEstimates(false);
    }
  };

  const handleCreateRequest = () => {
    if (!selectedCategory) {
      Alert.alert('Selection Required', 'Please choose a vehicle category.');
      return;
    }

    createRequestMutation.mutate(
      {
        purpose,
        description,
        pickupAddress,
        pickupLatitude: pickupLat,
        pickupLongitude: pickupLng,
        dropAddress,
        dropLatitude: dropLat,
        dropLongitude: dropLng,
        requiredVehicleCategory: selectedCategory,
        scheduledAt: scheduledAt.toISOString(),
      },
      {
        onSuccess: (data) => {
          Alert.alert('Request Submitted', 'Your transportation need has been shared with nearby owners.', [
            {
              text: 'Track Status',
              onPress: () => navigation.navigate('RequestDetails', { requestId: data.id }),
            },
          ]);
        },
        onError: (err: any) => {
          Alert.alert('Submission Failed', err.message || 'Server error.');
        },
      }
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 1: // Location Inputs
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Set Route Coordinates</Text>
            <Text style={styles.stepDesc}>Capture your starting GPS coordinates and enter a destination.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pickup Location</Text>
              
              <TouchableOpacity
                style={[styles.gpsButton, fetchingLocation && styles.gpsButtonLoading]}
                onPress={handleUseCurrentLocation}
                disabled={fetchingLocation}
              >
                {fetchingLocation ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.loadingText}>Fetching GPS Coordinates...</Text>
                  </View>
                ) : (
                  <Text style={styles.gpsButtonText}>📍 Use Current Location</Text>
                )}
              </TouchableOpacity>

              {pickupAddress.length > 0 && (
                <View style={styles.addressContainer}>
                  <Text style={styles.addressLabel}>Pickup Address (Detected):</Text>
                  <Text style={styles.addressText}>{pickupAddress}</Text>
                </View>
              )}

              {pickupLat !== 0 && pickupLng !== 0 && (
                <View style={styles.successLocationBadge}>
                  <Text style={styles.successLocationText}>✓ Location Captured Successfully</Text>
                  <Text style={styles.coordinatesDebugText}>
                    Lat: {pickupLat.toFixed(6)} | Lng: {pickupLng.toFixed(6)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Drop Destination Address</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter drop destination manually..."
                placeholderTextColor={colors.textMuted}
                value={dropAddress}
                onChangeText={(text) => {
                  setDropAddress(text);
                  // Reset coordinates when editing to trigger re-geocoding
                  setDropLat(0);
                  setDropLng(0);
                }}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!pickupLat || !dropAddress) && styles.disabledButton,
              ]}
              disabled={!pickupLat || !dropAddress}
              onPress={() => setStep(2)}
            >
              <Text style={styles.primaryButtonText}>Next: Date & Details →</Text>
            </TouchableOpacity>
          </View>
        );

      case 2: // Date, details, and details description
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Schedule & Description</Text>
            <Text style={styles.stepDesc}>Describe what you need to transport.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Required Cargo / Need Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Examples:\n- Need transport for 5 bags of potatoes\n- Need luxury car for a wedding ceremony\n- Shifting dining table and 4 chairs"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pickup Scheduled For</Text>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity style={styles.dateTimeButton}>
                  <Text style={styles.dateTimeButtonText}>
                    🕒 Immediately (Within 30 mins)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(1)}>
                <Text style={styles.secondaryButtonText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1 }, !description && styles.disabledButton]}
                disabled={!description}
                onPress={fetchEstimates}
              >
                {loadingEstimates ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Next: Suggest Fares →</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );

      case 4: // System suggestions
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Category Recommendations</Text>
            <Text style={styles.stepDesc}>Calculated route distance: {estimatesData?.distanceKm} km</Text>

            <ScrollView style={styles.estimatesList} showsVerticalScrollIndicator={false}>
              {estimatesData?.estimates?.map((est: any) => (
                <TouchableOpacity
                  key={est.category}
                  style={[
                    styles.estimateCard,
                    selectedCategory === est.category && styles.selectedEstimateCard,
                  ]}
                  onPress={() => setSelectedCategory(est.category)}
                >
                  <View style={styles.estHeader}>
                    <Text style={styles.estCategory}>{est.category}</Text>
                    <Text style={styles.estFare}>₹{est.estimatedFare}</Text>
                  </View>
                  <Text style={styles.estDetail}>
                    Base Fare: ₹{est.baseFare} • Rate: ₹{est.ratePerKm}/km
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(2)}>
                <Text style={styles.secondaryButtonText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1 }]}
                onPress={() => setStep(5)}
              >
                <Text style={styles.primaryButtonText}>Review Request →</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 5: // Review & Submit
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Confirm Marketplace Request</Text>
            <Text style={styles.stepDesc}>Your request will be dispatched to online owners.</Text>

            <View style={styles.reviewCard}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Purpose</Text>
                <Text style={styles.reviewValue}>{purpose.replace('_', ' ')}</Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Pickup Address</Text>
                <Text style={styles.reviewValue}>{pickupAddress}</Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Drop Address</Text>
                <Text style={styles.reviewValue}>{dropAddress}</Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Description</Text>
                <Text style={styles.reviewValue}>{description}</Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Selected Category</Text>
                <Text style={styles.reviewValueHighlight}>{selectedCategory}</Text>
              </View>

              <View style={[styles.reviewRow, styles.noBorder]}>
                <Text style={styles.reviewLabel}>Estimated Fare</Text>
                <Text style={styles.reviewFare}>₹{estimatesData?.estimates?.find((e: any) => e.category === selectedCategory)?.estimatedFare}</Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(4)}>
                <Text style={styles.secondaryButtonText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1 }]}
                onPress={handleCreateRequest}
                disabled={createRequestMutation.isPending}
              >
                {createRequestMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Submit Requirement Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Transport Request</Text>
        <View style={styles.progressRow}>
          <Text style={styles.stepCount}>Step {step === 4 ? 3 : step === 5 ? 4 : step} of 4</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(step === 4 ? 3 : step === 5 ? 4 : step) * 25}%` },
              ]}
            />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {renderStepContent()}
      </ScrollView>
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
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  stepCount: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginRight: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  stepContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 12,
    elevation: 2,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  stepDesc: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  gpsButton: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  gpsButtonLoading: {
    borderColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  gpsButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  addressContainer: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  addressText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
    lineHeight: 18,
  },
  successLocationBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderColor: '#22c55e',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  successLocationText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '700',
  },
  coordinatesDebugText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  dateTimeRow: {
    flexDirection: 'row',
  },
  dateTimeButton: {
    flex: 1,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dateTimeButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  disabledButton: {
    backgroundColor: colors.border,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  estimatesList: {
    maxHeight: 240,
    marginBottom: 20,
  },
  estimateCard: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  selectedEstimateCard: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
  },
  estHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estCategory: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  estFare: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  estDetail: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  reviewCard: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  reviewLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  reviewValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '700',
    maxWidth: '60%',
    textAlign: 'right',
  },
  reviewValueHighlight: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '800',
  },
  reviewFare: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '800',
  },
});

export default CreateRequestScreen;
