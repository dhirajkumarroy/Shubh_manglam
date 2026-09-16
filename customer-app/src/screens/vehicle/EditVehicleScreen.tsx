import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useVehicle } from '../../hooks/useVehicles';
import { useUpdateVehicle } from '../../hooks/useOwner';
import { HomeStackParamList } from '../../navigation/types';
import colors from '../../theme/colors';

type EditVehicleScreenRouteProp = RouteProp<HomeStackParamList, 'EditVehicle'>;

const CATEGORIES = ['BIKE', 'AUTO', 'CAR', 'SUV', 'PICKUP', 'MINI_TRUCK', 'TRACTOR', 'BUS', 'LUXURY_CAR'] as const;

export const EditVehicleScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<EditVehicleScreenRouteProp>();
  const { vehicleId } = route.params;

  // Fetch the vehicle details to edit
  const { data: vehicle, isLoading: vehicleLoading, isError } = useVehicle(vehicleId);
  const updateVehicleMutation = useUpdateVehicle();

  // Form states
  const [brand, setBrand] = useState('');
  const [title, setTitle] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [fuelType, setFuelType] = useState<'PETROL' | 'DIESEL' | 'CNG' | 'ELECTRIC' | 'HYBRID'>('PETROL');
  const [transmission, setTransmission] = useState<'MANUAL' | 'AUTOMATIC'>('AUTOMATIC');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('CAR');
  const [operatingLatitude, setOperatingLatitude] = useState('');
  const [operatingLongitude, setOperatingLongitude] = useState('');
  const [operatingRadius, setOperatingRadius] = useState('');
  const [description, setDescription] = useState('');

  // Prepopulate form when vehicle data is loaded
  useEffect(() => {
    if (vehicle) {
      setBrand(vehicle.brand);
      setTitle(vehicle.title);
      setModel(vehicle.model);
      setYear(String(vehicle.year));
      setVehicleNumber(vehicle.vehicleNumber);
      setFuelType(vehicle.fuelType);
      setTransmission(vehicle.transmission);
      setCategory(vehicle.category);
      setOperatingLatitude(String(vehicle.operatingLatitude || ''));
      setOperatingLongitude(String(vehicle.operatingLongitude || ''));
      setOperatingRadius(String(vehicle.operatingRadius || '15'));
      setDescription(vehicle.description);
    }
  }, [vehicle]);

  const handleSubmit = () => {
    // Validations
    if (!brand.trim() || !title.trim() || !model.trim() || !vehicleNumber.trim() || !description.trim()) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }

    const yearNum = parseInt(year);
    const latNum = parseFloat(operatingLatitude);
    const lonNum = parseFloat(operatingLongitude);
    const radNum = parseFloat(operatingRadius);

    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 2) {
      Alert.alert('Validation Error', 'Please enter a valid year.');
      return;
    }

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      Alert.alert('Validation Error', 'Please enter a valid operating latitude (-90 to 90).');
      return;
    }

    if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
      Alert.alert('Validation Error', 'Please enter a valid operating longitude (-180 to 180).');
      return;
    }

    if (isNaN(radNum) || radNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid operating radius in kilometers.');
      return;
    }

    updateVehicleMutation.mutate(
      {
        id: vehicleId,
        payload: {
          brand: brand.trim(),
          title: title.trim(),
          model: model.trim(),
          year: yearNum,
          vehicleNumber: vehicleNumber.trim().toUpperCase(),
          fuelType,
          transmission,
          category,
          operatingLatitude: latNum,
          operatingLongitude: lonNum,
          operatingRadius: radNum,
          description: description.trim(),
        },
      },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Listing updated successfully!', [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              },
            },
          ]);
        },
        onError: (err: any) => {
          Alert.alert('Update Failed', err.message || 'Could not update vehicle.');
        },
      }
    );
  };

  const isPending = updateVehicleMutation.isPending;

  if (vehicleLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Fetching listing records...</Text>
      </SafeAreaView>
    );
  }

  if (isError || !vehicle) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading listing details.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
            <Text style={styles.backLinkText}>← Listings</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Listing</Text>
          <Text style={styles.subtitle}>Update parameters for {vehicle.brand} {vehicle.title}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Brand</Text>
          <TextInput
            style={styles.input}
            value={brand}
            onChangeText={setBrand}
            placeholder="Enter brand"
            placeholderTextColor="#64748b"
          />

          <Text style={styles.label}>Title / Name</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter name"
            placeholderTextColor="#64748b"
          />

          <Text style={styles.label}>Model Version</Text>
          <TextInput
            style={styles.input}
            value={model}
            onChangeText={setModel}
            placeholder="Enter model details"
            placeholderTextColor="#64748b"
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Year</Text>
              <TextInput
                style={styles.input}
                value={year}
                onChangeText={setYear}
                placeholder="2023"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Operating Radius (km)</Text>
              <TextInput
                style={styles.input}
                value={operatingRadius}
                onChangeText={setOperatingRadius}
                placeholder="15"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.label}>Vehicle Plate Number (Unique)</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={vehicleNumber}
            editable={false}
          />

          {/* Category Selector */}
          <Text style={styles.label}>Vehicle Category</Text>
          <View style={styles.selectorGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.selectBox, category === cat && styles.selectBoxActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.selectBoxText, category === cat && styles.selectBoxTextActive]}>
                  {cat.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Type selectors */}
          <Text style={styles.label}>Fuel Type</Text>
          <View style={styles.selectorGrid}>
            {(['PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'HYBRID'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.selectBox, fuelType === type && styles.selectBoxActive]}
                onPress={() => setFuelType(type)}
              >
                <Text style={[styles.selectBoxText, fuelType === type && styles.selectBoxTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Transmission</Text>
          <View style={styles.selectorGrid}>
            {(['AUTOMATIC', 'MANUAL'] as const).map((trans) => (
              <TouchableOpacity
                key={trans}
                style={[styles.selectBox, transmission === trans && styles.selectBoxActive]}
                onPress={() => setTransmission(trans)}
              >
                <Text style={[styles.selectBoxText, transmission === trans && styles.selectBoxTextActive]}>
                  {trans}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Operating Latitude</Text>
              <TextInput
                style={styles.input}
                value={operatingLatitude}
                onChangeText={setOperatingLatitude}
                placeholder="28.6139"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Operating Longitude</Text>
              <TextInput
                style={styles.input}
                value={operatingLongitude}
                onChangeText={setOperatingLongitude}
                placeholder="77.2090"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.label}>Listing Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe vehicle capability or health..."
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={[styles.submitBtn, isPending && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 16,
    marginBottom: 24,
  },
  backLink: {
    marginBottom: 12,
  },
  backLinkText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  form: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.borderLight,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    marginBottom: 10,
  },
  disabledInput: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    color: colors.textMuted,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    width: '48%',
  },
  selectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  selectBox: {
    backgroundColor: colors.card,
    borderColor: colors.borderLight,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  selectBoxActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderColor: colors.primary,
  },
  selectBoxText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  selectBoxTextActive: {
    color: colors.primary,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 15,
  },
  submitBtnDisabled: {
    backgroundColor: colors.primaryDark,
  },
  submitBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '700',
  },
  backLinkTextActive: {
    color: colors.primary,
  },
});

export default EditVehicleScreen;
