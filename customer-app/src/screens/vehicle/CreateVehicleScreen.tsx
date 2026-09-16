import React, { useState } from 'react';
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
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useCreateVehicle } from '../../hooks/useOwner';
import colors from '../../theme/colors';

export const CreateVehicleScreen: React.FC = () => {
  const navigation = useNavigation();
  const createVehicleMutation = useCreateVehicle();

  // Form states
  const [brand, setBrand] = useState('');
  const [title, setTitle] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('2023');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [pricePerDay, setPricePerDay] = useState('100');
  const [fuelType, setFuelType] = useState<'PETROL' | 'DIESEL' | 'CNG' | 'ELECTRIC' | 'HYBRID'>('PETROL');
  const [transmission, setTransmission] = useState<'MANUAL' | 'AUTOMATIC'>('AUTOMATIC');
  const [seatCapacity, setSeatCapacity] = useState('5');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('19.0760');
  const [longitude, setLongitude] = useState('72.8777');

  // Selected images URIs array
  const [images, setImages] = useState<string[]>([]);

  const pickImageFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Gallery access is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const selectedUris = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...selectedUris].slice(0, 10)); // Maximum 10 images
    }
  };

  const pickImageFromCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Camera access is required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages((prev) => [...prev, result.assets[0].uri].slice(0, 10));
    }
  };

  const handleSelectImage = () => {
    if (images.length >= 10) {
      Alert.alert('Limit Reached', 'You can upload up to 10 images for a listing.');
      return;
    }

    Alert.alert('Add Photo', 'Select image source:', [
      { text: 'Camera', onPress: pickImageFromCamera },
      { text: 'Gallery', onPress: pickImageFromGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = () => {
    // Validations
    if (!brand.trim() || !title.trim() || !model.trim() || !vehicleNumber.trim() || !city.trim() || !description.trim()) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }

    const yearNum = parseInt(year);
    const seatNum = parseInt(seatCapacity);
    const priceNum = parseFloat(pricePerDay);
    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);

    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 2) {
      Alert.alert('Validation Error', 'Please enter a valid year.');
      return;
    }
    if (isNaN(seatNum) || seatNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid seat capacity.');
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid rate per day.');
      return;
    }
    if (images.length === 0) {
      Alert.alert('Validation Error', 'Please upload at least one image of the vehicle.');
      return;
    }

    const formData = new FormData();
    formData.append('brand', brand.trim());
    formData.append('title', title.trim());
    formData.append('model', model.trim());
    formData.append('year', String(yearNum));
    formData.append('vehicleNumber', vehicleNumber.trim().toUpperCase());
    formData.append('fuelType', fuelType);
    formData.append('transmission', transmission);
    formData.append('seatCapacity', String(seatNum));
    formData.append('pricePerDay', String(priceNum));
    formData.append('city', city.trim());
    formData.append('latitude', String(isNaN(latNum) ? 19.0760 : latNum));
    formData.append('longitude', String(isNaN(lonNum) ? 72.8777 : lonNum));
    formData.append('description', description.trim());

    // Append files
    images.forEach((uri, idx) => {
      const filename = uri.split('/').pop() || `vehicle_${idx}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append('images', {
        uri,
        name: filename,
        type,
      } as any);
    });

    createVehicleMutation.mutate(formData, {
      onSuccess: () => {
        Alert.alert('Success', 'Vehicle listing successfully created!', [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]);
      },
      onError: (err: any) => {
        Alert.alert('Registration Failed', err.message || 'Could not register vehicle.');
      },
    });
  };

  const isPending = createVehicleMutation.isPending;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
            <Text style={styles.backLinkText}>← Listings</Text>
          </TouchableOpacity>
          <Text style={styles.title}>List Your Vehicle</Text>
          <Text style={styles.subtitle}>Provide vehicle parameters and images for renters</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Brand (e.g. Tesla, Honda)</Text>
          <TextInput
            style={styles.input}
            value={brand}
            onChangeText={setBrand}
            placeholder="Enter brand"
            placeholderTextColor="#64748b"
          />

          <Text style={styles.label}>Title / Name (e.g. Model S, Civic)</Text>
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
              <Text style={styles.label}>Seat Capacity</Text>
              <TextInput
                style={styles.input}
                value={seatCapacity}
                onChangeText={setSeatCapacity}
                placeholder="5"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.label}>Vehicle Plate Number (Unique)</Text>
          <TextInput
            style={styles.input}
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            placeholder="E.g. MH12AB1234"
            placeholderTextColor="#64748b"
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Daily Rental Rate (₹)</Text>
          <TextInput
            style={styles.input}
            value={pricePerDay}
            onChangeText={setPricePerDay}
            placeholder="100"
            placeholderTextColor="#64748b"
            keyboardType="numeric"
          />

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

          <Text style={styles.label}>City Location</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="Enter city"
            placeholderTextColor="#64748b"
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={styles.input}
                value={latitude}
                onChangeText={setLatitude}
                placeholder="19.0760"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={styles.input}
                value={longitude}
                onChangeText={setLongitude}
                placeholder="72.8777"
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
            placeholder="Describe vehicle health, details..."
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={4}
          />

          {/* Vehicle Images Selectors */}
          <Text style={styles.label}>Vehicle Images ({images.length}/10)</Text>
          <View style={styles.imageGrid}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.imageThumb} />
                <TouchableOpacity style={styles.removeBadge} onPress={() => removeImage(index)}>
                  <Text style={styles.removeBadgeText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 10 && (
              <TouchableOpacity style={styles.addImageBtn} onPress={handleSelectImage}>
                <Text style={styles.addImageText}>+</Text>
                <Text style={styles.addImageSub}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, isPending && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>Create Listing</Text>
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
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 20,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
    marginBottom: 12,
  },
  imageThumb: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  removeBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
  },
  addImageBtn: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  addImageText: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: '600',
  },
  addImageSub: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
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
});

export default CreateVehicleScreen;
