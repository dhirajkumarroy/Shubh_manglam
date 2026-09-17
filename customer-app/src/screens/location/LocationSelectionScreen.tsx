import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import colors from '../../theme/colors';
import {
  useCustomerAddresses,
  useCreateAddress,
  useDeleteAddress,
} from '../../hooks/useEventPlanning';

export const LocationSelectionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const onSelectLocation = route.params?.onSelectLocation;

  const { data: addresses = [], isLoading } = useCustomerAddresses();
  const createAddressMutation = useCreateAddress();
  const deleteAddressMutation = useDeleteAddress();

  const [detectingGps, setDetectingGps] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New Address form
  const [label, setLabel] = useState('Home');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);

  const handleDetectGps = async () => {
    try {
      setDetectingGps(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Please allow location permission to detect your current position.'
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude;
      const lon = loc.coords.longitude;

      const reverse = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      const detectedCity = reverse[0]?.city || reverse[0]?.district || reverse[0]?.subregion || 'Detected Location';
      const detectedPincode = reverse[0]?.postalCode || '';

      const detectedLocation = {
        label: 'Current Location',
        addressLine1: [reverse[0]?.name, reverse[0]?.street, reverse[0]?.subregion]
          .filter(Boolean)
          .join(', ') || 'Current Device Position',
        city: detectedCity,
        pincode: detectedPincode,
        latitude: lat,
        longitude: lon,
      };

      if (onSelectLocation) {
        onSelectLocation(detectedLocation);
        navigation.goBack();
      } else {
        Alert.alert(
          'GPS Location Detected',
          `City: ${detectedCity}\nPincode: ${detectedPincode}\nLat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`
        );
      }
    } catch (err) {
      console.error('GPS detection error:', err);
      Alert.alert('GPS Error', 'Failed to detect current location.');
    } finally {
      setDetectingGps(false);
    }
  };

  const handleSelectAddress = (addr: any) => {
    if (onSelectLocation) {
      onSelectLocation(addr);
      navigation.goBack();
    }
  };

  const handleCreateAddress = async () => {
    if (!addressLine1.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      Alert.alert('Missing Fields', 'Please complete address line, city, state, and 6-digit pincode.');
      return;
    }
    if (!/^\d{6}$/.test(pincode.trim())) {
      Alert.alert('Invalid Pincode', 'Pincode must be a 6-digit Indian PIN code.');
      return;
    }

    try {
      const created = await createAddressMutation.mutateAsync({
        label: label.trim() || 'Venue',
        addressLine1: addressLine1.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        isDefault,
        latitude,
        longitude,
      });

      setShowAddForm(false);
      setAddressLine1('');
      setCity('');
      setState('');
      setPincode('');

      if (onSelectLocation) {
        onSelectLocation(created);
        navigation.goBack();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save address');
    }
  };

  const handleDeleteAddress = (id: string) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteAddressMutation.mutate(id),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>Celebration Location</Text>
          <Text style={styles.subTitle}>Select or add venue address</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* GPS Button */}
        <TouchableOpacity
          style={styles.gpsHero}
          activeOpacity={0.8}
          onPress={handleDetectGps}
          disabled={detectingGps}
        >
          <Text style={styles.gpsIcon}>📍</Text>
          <View style={styles.gpsTextWrap}>
            <Text style={styles.gpsTitle}>Use Current GPS Location</Text>
            <Text style={styles.gpsSubtitle}>
              Automatically find vendors nearby based on device coordinates
            </Text>
          </View>
          {detectingGps && <ActivityIndicator color="#FFFFFF" style={{ marginLeft: 8 }} />}
        </TouchableOpacity>

        {/* Saved Addresses */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Addresses</Text>
          <TouchableOpacity onPress={() => setShowAddForm(!showAddForm)}>
            <Text style={styles.toggleFormText}>{showAddForm ? 'Cancel' : '+ Add New'}</Text>
          </TouchableOpacity>
        </View>

        {/* Add Address Form */}
        {showAddForm && (
          <View style={styles.addFormBox}>
            <Text style={styles.formTitle}>New Saved Address</Text>

            <View style={styles.labelChips}>
              {['Home', 'Office', 'Celebration Venue', 'Parents'].map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[styles.labelChip, label === l && styles.labelChipActive]}
                  onPress={() => setLabel(l)}
                >
                  <Text style={[styles.labelChipText, label === l && styles.labelChipTextActive]}>
                    {l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Address Line 1 (Street, Colony, House No) *"
              placeholderTextColor="#9CA3AF"
              value={addressLine1}
              onChangeText={setAddressLine1}
            />

            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="City *"
                placeholderTextColor="#9CA3AF"
                value={city}
                onChangeText={setCity}
              />
              <TextInput
                style={[styles.input, { flex: 1, marginLeft: 8 }]}
                placeholder="State *"
                placeholderTextColor="#9CA3AF"
                value={state}
                onChangeText={setState}
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Pincode (6-digit) *"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              maxLength={6}
              value={pincode}
              onChangeText={setPincode}
            />

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleCreateAddress}
              disabled={createAddressMutation.isPending}
            >
              {createAddressMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Save Address</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
        ) : addresses.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🏠</Text>
            <Text style={styles.emptyText}>No saved addresses yet. Tap above to add one.</Text>
          </View>
        ) : (
          <View style={styles.addressList}>
            {addresses.map((addr) => (
              <TouchableOpacity
                key={addr.id}
                style={styles.addressCard}
                activeOpacity={0.7}
                onPress={() => handleSelectAddress(addr)}
              >
                <View style={styles.addressCardTop}>
                  <View style={styles.addressLabelWrap}>
                    <Text style={styles.addressLabel}>{addr.label || 'Saved Location'}</Text>
                    {addr.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteAddrBtn}
                    onPress={() => handleDeleteAddress(addr.id)}
                  >
                    <Text style={styles.deleteAddrIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.addressLine}>{addr.addressLine1}</Text>
                <Text style={styles.addressSubLine}>
                  {addr.city}, {addr.state} — {addr.pincode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    marginRight: 12,
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
  gpsHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  gpsIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  gpsTextWrap: {
    flex: 1,
  },
  gpsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  gpsSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  toggleFormText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  addFormBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  labelChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  labelChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  labelChipActive: {
    backgroundColor: colors.primary,
  },
  labelChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  labelChipTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  addressList: {
    gap: 10,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addressLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  defaultBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  deleteAddrBtn: {
    padding: 4,
  },
  deleteAddrIcon: {
    fontSize: 14,
  },
  addressLine: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  addressSubLine: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default LocationSelectionScreen;
