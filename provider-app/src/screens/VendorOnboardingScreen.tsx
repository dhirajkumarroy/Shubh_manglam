import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import { ProviderApiService } from '../services/api';
import { FullVendorProfile, ServiceCategory } from '../types';
import CategorySelector from '../components/CategorySelector';
import DocumentUploader from '../components/DocumentUploader';
import ProfileCompletionCard from '../components/ProfileCompletionCard';
import VendorStatusBanner from '../components/VendorStatusBanner';

interface VendorOnboardingScreenProps {
  onFinish?: () => void;
  onLogout?: () => void;
}

export const VendorOnboardingScreen: React.FC<VendorOnboardingScreenProps> = ({
  onFinish,
  onLogout,
}) => {
  const [profile, setProfile] = useState<FullVendorProfile | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [savingCategories, setSavingCategories] = useState<boolean>(false);
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  // Form Fields State
  const [businessName, setBusinessName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [addressLine1, setAddressLine1] = useState<string>('');
  const [addressLine2, setAddressLine2] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [operatingRadiusKm, setOperatingRadiusKm] = useState<string>('25');

  const loadData = async () => {
    try {
      setLoading(true);
      const [vendorData, catData] = await Promise.all([
        ProviderApiService.getVendorProfile(),
        ProviderApiService.getCategories(),
      ]);

      setProfile(vendorData);
      setCategories(catData || []);

      // Pre-fill form fields
      setBusinessName(vendorData.businessName || '');
      setDescription(vendorData.description || '');
      setPhone(vendorData.phone || '');
      setEmail(vendorData.email || '');
      setAddressLine1(vendorData.addressLine1 || '');
      setAddressLine2(vendorData.addressLine2 || '');
      setCity(vendorData.city || '');
      setState(vendorData.state || '');
      setPincode(vendorData.pincode || '');
      setLatitude(vendorData.latitude ? String(vendorData.latitude) : '');
      setLongitude(vendorData.longitude ? String(vendorData.longitude) : '');
      setOperatingRadiusKm(
        vendorData.operatingRadiusKm ? String(vendorData.operatingRadiusKm) : '25'
      );

      const existingCatIds = (vendorData.categories || []).map((c: any) => c.categoryId);
      setSelectedCategoryIds(existingCatIds);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const payload = {
        businessName: businessName.trim(),
        description: description.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        operatingRadiusKm: operatingRadiusKm ? parseFloat(operatingRadiusKm) : 25,
      };

      const updated = await ProviderApiService.updateVendorProfile(payload);
      setProfile(updated);
      Alert.alert('Success', 'Vendor profile details saved successfully.');
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleToggleCategory = async (catId: string) => {
    const updatedIds = selectedCategoryIds.includes(catId)
      ? selectedCategoryIds.filter((id) => id !== catId)
      : [...selectedCategoryIds, catId];

    setSelectedCategoryIds(updatedIds);

    if (updatedIds.length > 0) {
      try {
        setSavingCategories(true);
        const updated = await ProviderApiService.updateVendorCategories(updatedIds);
        setProfile(updated);
      } catch (err: any) {
        Alert.alert('Category Update Failed', err.message || 'Could not sync categories');
      } finally {
        setSavingCategories(false);
      }
    }
  };

  const handleAddDocument = async (doc: { documentType: string; documentUrl: string }) => {
    await ProviderApiService.addVendorDocument(doc);
    const refreshed = await ProviderApiService.getVendorProfile();
    setProfile(refreshed);
  };

  const handleDeleteDocument = async (documentId: string) => {
    await ProviderApiService.deleteVendorDocument(documentId);
    const refreshed = await ProviderApiService.getVendorProfile();
    setProfile(refreshed);
  };

  const handleSubmitForReview = async () => {
    try {
      setSubmittingReview(true);
      const updated = await ProviderApiService.submitForReview();
      setProfile(updated);
      Alert.alert(
        'Submitted!',
        'Your profile has been submitted for review. The Shubh Ausar admin team will verify your details.',
        [{ text: 'OK', onPress: onFinish }]
      );
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Could not submit for review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleUseDemoLocation = () => {
    setLatitude('29.3909');
    setLongitude('76.9635');
    if (!city) setCity('Panipat');
    if (!state) setState('Haryana');
    if (!pincode) setPincode('132103');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading vendor profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.topTitle}>Vendor Profile Setup</Text>
            <Text style={styles.topSubTitle}>Complete your profile for partner approval</Text>
          </View>
          {onLogout && (
            <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
              <Text style={styles.logoutBtnText}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Dynamic Status Banner */}
        {profile && <VendorStatusBanner status={profile.status} />}

        {/* Readiness Tracker */}
        {profile?.completeness && (
          <ProfileCompletionCard
            completeness={profile.completeness}
            status={profile.status}
            onSubmitForReview={handleSubmitForReview}
            isSubmitting={submittingReview}
          />
        )}

        {/* Section 1: Business Profile */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. Business Information</Text>

          <Text style={styles.fieldLabel}>Business / Enterprise Name *</Text>
          <TextInput
            style={styles.input}
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="e.g. Royal Wedding & Events"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={styles.fieldLabel}>Business Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Tell customers about your experience, staff, packages, and celebration specialties..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={3}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Business Phone *</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+91..."
                placeholderTextColor={colors.placeholder}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Business Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="contact@business.com"
                placeholderTextColor={colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* Section 2: Address & Location */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>2. Location & Operating Area</Text>
            <TouchableOpacity onPress={handleUseDemoLocation} style={styles.gpsBtn}>
              <Text style={styles.gpsBtnText}>📍 Auto-Fill GPS</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>Address Line 1 (Shop / Office) *</Text>
          <TextInput
            style={styles.input}
            value={addressLine1}
            onChangeText={setAddressLine1}
            placeholder="Shop No., Market, Street name"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={styles.fieldLabel}>Address Line 2 (Optional)</Text>
          <TextInput
            style={styles.input}
            value={addressLine2}
            onChangeText={setAddressLine2}
            placeholder="Landmark or locality"
            placeholderTextColor={colors.placeholder}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>City *</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="e.g. Panipat"
                placeholderTextColor={colors.placeholder}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>State *</Text>
              <TextInput
                style={styles.input}
                value={state}
                onChangeText={setState}
                placeholder="e.g. Haryana"
                placeholderTextColor={colors.placeholder}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Pincode (6 digits) *</Text>
              <TextInput
                style={styles.input}
                value={pincode}
                onChangeText={setPincode}
                placeholder="132103"
                placeholderTextColor={colors.placeholder}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Radius (km)</Text>
              <TextInput
                style={styles.input}
                value={operatingRadiusKm}
                onChangeText={setOperatingRadiusKm}
                placeholder="25"
                placeholderTextColor={colors.placeholder}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Latitude *</Text>
              <TextInput
                style={styles.input}
                value={latitude}
                onChangeText={setLatitude}
                placeholder="29.3909"
                placeholderTextColor={colors.placeholder}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Longitude *</Text>
              <TextInput
                style={styles.input}
                value={longitude}
                onChangeText={setLongitude}
                placeholder="76.9635"
                placeholderTextColor={colors.placeholder}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveProfileBtn, savingProfile && styles.btnDisabled]}
            onPress={handleSaveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.saveProfileBtnText}>Save Business & Location</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Section 3: Dynamic Category Selection */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>3. Celebration Categories</Text>
          <CategorySelector
            categories={categories}
            selectedCategoryIds={selectedCategoryIds}
            onToggleCategory={handleToggleCategory}
            isLoading={savingCategories}
          />
        </View>

        {/* Section 4: Document Verification */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>4. Verification Documents</Text>
          <DocumentUploader
            documents={profile?.documents || []}
            onAddDocument={handleAddDocument}
            onDeleteDocument={handleDeleteDocument}
          />
        </View>

        {/* Done / Return to Dashboard */}
        {onFinish && (
          <TouchableOpacity style={styles.finishBtn} onPress={onFinish}>
            <Text style={styles.finishBtnText}>Go to Provider Dashboard →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textMuted,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  topTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  topSubTitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  gpsBtn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gpsBtnText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    marginTop: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  saveProfileBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  saveProfileBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  finishBtn: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginTop: 8,
  },
  finishBtnText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

export default VendorOnboardingScreen;
