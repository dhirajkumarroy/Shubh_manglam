import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { ProviderApiService, ProviderAuthData } from '../services/api';
import GoogleSignInModal, { ProviderGoogleAccount } from '../components/GoogleSignInModal';

interface ProviderRegisterScreenProps {
  onSuccess: (data: ProviderAuthData) => void;
  onNavigateToLogin: () => void;
}

export const ProviderRegisterScreen: React.FC<ProviderRegisterScreenProps> = ({
  onSuccess,
  onNavigateToLogin,
}) => {
  const [businessName, setBusinessName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const handleFillDemo = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setBusinessName('Royal Celebration Decor & Caterers');
    setName('Ramesh Sharma');
    setEmail(`partner.${randomNum}@gmail.com`);
    setPhone(`98765${randomNum}`);
    setCity('Panipat, Haryana');
    setPassword('Password@123');
    setError(null);
    setDemoLoaded(true);
    setTimeout(() => setDemoLoaded(false), 2500);
  };

  const handleRegister = async () => {
    if (!businessName.trim()) {
      setError('Business / Firm Name is required.');
      return;
    }
    if (!name.trim()) {
      setError('Owner / Contact Person name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('A valid business email address is required.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setError('A valid 10-digit mobile number is required.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!agreedToTerms) {
      setError('Please accept the Partner Terms and Quality Policy.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await ProviderApiService.register({
        name: name.trim(),
        businessName: businessName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        city: city.trim() || undefined,
        password,
      });

      Alert.alert(
        'Partner Account Registered! 🎉',
        `Welcome to Shubh Ausar! Your Partner Account ID has been generated: ${data.vendor?.partnerAccountId || 'SA-P-Pending'}. Please submit your verification documents to start receiving customer bookings.`
      );
      onSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Unable to register business. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAccountSelect = async (account: ProviderGoogleAccount) => {
    setLoading(true);
    setGoogleError(null);
    try {
      const data = await ProviderApiService.googleLogin({
        idToken: `google_${account.email.toLowerCase().trim()}`,
        email: account.email.toLowerCase().trim(),
        name: account.name.trim(),
        businessName: account.businessName?.trim() || businessName.trim() || undefined,
      });

      setGoogleModalVisible(false);
      Alert.alert(
        'Google Registration Completed! 🎉',
        `Welcome to Shubh Ausar Partner Network! Your Partner Account ID: ${data.vendor?.partnerAccountId || 'SA-P-Pending'}.`
      );
      onSuccess(data);
    } catch (err: any) {
      setGoogleError(err.message || 'Unable to register with Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Hero */}
          <View style={styles.brandHero}>
            <View style={styles.logoBadgeContainer}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoInitials}>SA</Text>
              </View>
              <View style={styles.sparkleBadge}>
                <Ionicons name="sparkles" size={14} color="#FBBF24" />
              </View>
            </View>
            <Text style={styles.brandTitle}>Shubh Ausar</Text>
            <Text style={styles.brandTagline}>Grow Your Celebration Business • Partner Network</Text>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>शुभ अवसर • Business Onboarding</Text>
            </View>
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            {/* Segmented Tab Switcher */}
            <View style={styles.segmentedContainer}>
              <TouchableOpacity
                style={styles.segmentedTab}
                onPress={() => {
                  setError(null);
                  onNavigateToLogin();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.segmentedTextInactive}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentedTab, styles.segmentedTabActive]}
                activeOpacity={0.8}
              >
                <Text style={styles.segmentedTextActive}>Register Business</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Demo Credentials Pill */}
            <TouchableOpacity
              style={[styles.demoPill, demoLoaded && styles.demoPillSuccess]}
              onPress={handleFillDemo}
              activeOpacity={0.7}
            >
              <View style={styles.demoIconContainer}>
                <Ionicons
                  name={demoLoaded ? 'checkmark-circle' : 'flash'}
                  size={16}
                  color={demoLoaded ? '#15803D' : '#D97706'}
                />
              </View>
              <View style={styles.demoTextContainer}>
                <Text style={styles.demoTitle}>
                  {demoLoaded ? 'Demo Partner Data Loaded!' : 'Auto-fill Demo Partner Data'}
                </Text>
                <Text style={styles.demoSubtitle}>Royal Decor • Ramesh Sharma • Password@123</Text>
              </View>
              <Ionicons
                name="arrow-forward"
                size={14}
                color={demoLoaded ? '#15803D' : '#D97706'}
              />
            </TouchableOpacity>

            {/* Error Banner */}
            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Business Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business / Firm Name *</Text>
              <View style={[styles.inputWrapper, !!error && !businessName && styles.inputError]}>
                <Feather name="briefcase" size={18} color="#78716C" style={styles.inputIcon} />
                <TextInput
                  placeholder="e.g. Royal Sound & Decoration"
                  placeholderTextColor="#A8A29E"
                  style={styles.input}
                  value={businessName}
                  onChangeText={(val) => {
                    setBusinessName(val);
                    if (error) setError(null);
                  }}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Owner Full Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Owner / Manager Full Name *</Text>
              <View style={[styles.inputWrapper, !!error && !name && styles.inputError]}>
                <Feather name="user" size={18} color="#78716C" style={styles.inputIcon} />
                <TextInput
                  placeholder="e.g. Ramesh Sharma"
                  placeholderTextColor="#A8A29E"
                  style={styles.input}
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (error) setError(null);
                  }}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Business Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Email *</Text>
              <View style={[styles.inputWrapper, !!error && !email && styles.inputError]}>
                <Feather name="mail" size={18} color="#78716C" style={styles.inputIcon} />
                <TextInput
                  placeholder="vendor@example.com"
                  placeholderTextColor="#A8A29E"
                  style={styles.input}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (error) setError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Phone Number Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Primary Mobile / WhatsApp *</Text>
              <View style={[styles.inputWrapper, !!error && !phone && styles.inputError]}>
                <Feather name="phone" size={18} color="#78716C" style={styles.inputIcon} />
                <TextInput
                  placeholder="+91 98765 43210"
                  placeholderTextColor="#A8A29E"
                  style={styles.input}
                  value={phone}
                  onChangeText={(val) => {
                    setPhone(val);
                    if (error) setError(null);
                  }}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Operating City Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Operating City / Region</Text>
              <View style={styles.inputWrapper}>
                <Feather name="map-pin" size={18} color="#78716C" style={styles.inputIcon} />
                <TextInput
                  placeholder="e.g. Panipat, Chandigarh, Delhi NCR"
                  placeholderTextColor="#A8A29E"
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password *</Text>
              <View style={[styles.inputWrapper, !!error && !password && styles.inputError]}>
                <Feather name="lock" size={18} color="#78716C" style={styles.inputIcon} />
                <TextInput
                  placeholder="Min 6 characters"
                  placeholderTextColor="#A8A29E"
                  style={styles.input}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (error) setError(null);
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#78716C"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms & Conditions */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                {agreedToTerms && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
              </View>
              <Text style={styles.termsText}>
                I accept the Shubh Ausar{' '}
                <Text style={styles.termsHighlight}>Partner Terms of Service</Text>,{' '}
                <Text style={styles.termsHighlight}>Quality Standards</Text> & Verification Policy.
              </Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.loadingText}>Registering Business...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.primaryButtonText}>Register Partner Business</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR REGISTER WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-In Button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => {
                setGoogleError(null);
                setGoogleModalVisible(true);
              }}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={styles.googleIconBadge}>
                <MaterialCommunityIcons name="google" size={18} color="#EA4335" />
              </View>
              <Text style={styles.googleButtonText}>Register with Google</Text>
            </TouchableOpacity>
          </View>

          {/* Account ID Callout Banner */}
          <View style={styles.infoCallout}>
            <View style={styles.calloutHeader}>
              <Ionicons name="information-circle" size={20} color="#881337" />
              <Text style={styles.calloutTitle}>Instant Partner Account ID</Text>
            </View>
            <Text style={styles.calloutText}>
              Upon registration, you will receive a unique{' '}
              <Text style={{ fontWeight: '800', color: '#881337' }}>SA-P-XXXXXX</Text> Account ID.
              Customers can look you up directly using this ID across the Shubh Ausar marketplace.
            </Text>
          </View>

          {/* Footer Note */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Already registered your business?</Text>
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={styles.footerLink}>Sign In to Partner Portal</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <GoogleSignInModal
        visible={googleModalVisible}
        onClose={() => setGoogleModalVisible(false)}
        onSuccess={handleGoogleAccountSelect}
        loading={loading}
        error={googleError}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  logoBadgeContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#881337',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#881337',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FEF3C7',
  },
  logoInitials: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  sparkleBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#881337',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1C1917',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 13,
    fontWeight: '600',
    color: '#881337',
    marginTop: 2,
  },
  heroPill: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E7E0D8',
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E7E0D8',
  },
  segmentedTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentedTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentedTextActive: {
    fontSize: 13,
    fontWeight: '800',
    color: '#881337',
  },
  segmentedTextInactive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#78716C',
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  demoPillSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  demoIconContainer: {
    marginRight: 10,
  },
  demoTextContainer: {
    flex: 1,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  demoSubtitle: {
    fontSize: 10,
    color: '#B45309',
    marginTop: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 13,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7E0D8',
    paddingHorizontal: 12,
    height: 48,
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#1C1917',
    paddingVertical: 0,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 18,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#D6CECE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#881337',
    borderColor: '#881337',
  },
  termsText: {
    flex: 1,
    fontSize: 11,
    color: '#57534E',
    lineHeight: 16,
  },
  termsHighlight: {
    color: '#881337',
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#881337',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#881337',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E7E0D8',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A8A29E',
    marginHorizontal: 12,
    letterSpacing: 0.5,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7E0D8',
    paddingVertical: 12,
  },
  googleIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  googleButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1917',
  },
  infoCallout: {
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 20,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  calloutTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
    marginLeft: 6,
  },
  calloutText: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 16,
  },
  footerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 12,
    color: '#881337',
    fontWeight: '800',
  },
});

export default ProviderRegisterScreen;
