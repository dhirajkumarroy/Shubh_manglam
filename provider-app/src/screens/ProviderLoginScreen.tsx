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

interface ProviderLoginScreenProps {
  onSuccess: (data: ProviderAuthData) => void;
  onNavigateToRegister: () => void;
}

export const ProviderLoginScreen: React.FC<ProviderLoginScreenProps> = ({
  onSuccess,
  onNavigateToRegister,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const handleFillDemo = () => {
    setEmail('vendor@example.com');
    setPassword('Password@123');
    setError(null);
    setDemoLoaded(true);
    setTimeout(() => setDemoLoaded(false), 2500);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your business email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await ProviderApiService.login({
        email: email.trim().toLowerCase(),
        password,
      });
      onSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
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
        businessName: account.businessName?.trim(),
      });
      setGoogleModalVisible(false);
      onSuccess(data);
    } catch (err: any) {
      setGoogleError(err.message || 'Unable to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Partner Password Recovery',
      'Please contact Partner Support at support@shubhausar.com or call +91 98765 43210 to reset your registered business account password.',
      [{ text: 'OK' }]
    );
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
            <Text style={styles.brandTagline}>Celebrate Every Occasion • Partner Portal</Text>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>शुभ अवसर • Partner Network</Text>
            </View>
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            {/* Segmented Tab Switcher */}
            <View style={styles.segmentedContainer}>
              <TouchableOpacity
                style={[styles.segmentedTab, styles.segmentedTabActive]}
                activeOpacity={0.8}
              >
                <Text style={styles.segmentedTextActive}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.segmentedTab}
                onPress={() => {
                  setError(null);
                  onNavigateToRegister();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.segmentedTextInactive}>Register Business</Text>
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
                  {demoLoaded ? 'Credentials Loaded!' : 'Auto-fill Demo Partner'}
                </Text>
                <Text style={styles.demoSubtitle}>vendor@example.com • Password@123</Text>
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

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Email</Text>
              <View style={[styles.inputWrapper, !!error && !email && styles.inputError]}>
                <Feather name="mail" size={18} color="#78716C" style={styles.inputIcon} />
                <TextInput
                  placeholder="Enter business email (e.g. vendor@example.com)"
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
                {email ? (
                  <TouchableOpacity
                    onPress={() => setEmail('')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={16} color="#A8A29E" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.inputLabel}>Password</Text>
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputWrapper, !!error && !password && styles.inputError]}>
                <Feather name="lock" size={18} color="#78716C" style={styles.inputIcon} />
                <TextInput
                  placeholder="Enter your account password"
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

            {/* Remember Me */}
            <View style={styles.rememberRow}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxLabel}>Keep me signed in</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.loadingText}>Signing in...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.primaryButtonText}>Sign In to Partner Portal</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR SIGN IN WITH</Text>
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
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          {/* Partner Benefits Card */}
          <View style={styles.benefitsCard}>
            <View style={styles.benefitsHeader}>
              <Ionicons name="shield-checkmark" size={18} color="#D97706" />
              <Text style={styles.benefitsTitle}>Shubh Ausar Partner Benefits</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={14} color="#15803D" style={{ marginRight: 6 }} />
              <Text style={styles.benefitText}>Direct bookings & high-intent celebration inquiries</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={14} color="#15803D" style={{ marginRight: 6 }} />
              <Text style={styles.benefitText}>Verified Partner Account ID (SA-P-XXXXXX) for customer trust</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={14} color="#15803D" style={{ marginRight: 6 }} />
              <Text style={styles.benefitText}>Rich showcase gallery with photos, videos & reviews</Text>
            </View>
          </View>

          {/* Footer Note */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>New celebration service provider?</Text>
            <TouchableOpacity onPress={onNavigateToRegister}>
              <Text style={styles.footerLink}>Register Your Business Now</Text>
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
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 6,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forgotPasswordText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#881337',
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
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  checkboxChecked: {
    backgroundColor: '#881337',
    borderColor: '#881337',
  },
  checkboxLabel: {
    fontSize: 12,
    color: '#57534E',
    fontWeight: '600',
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
  benefitsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7E0D8',
    marginBottom: 20,
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  benefitsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1C1917',
    marginLeft: 6,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  benefitText: {
    fontSize: 11,
    color: '#57534E',
    fontWeight: '500',
    flex: 1,
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

export default ProviderLoginScreen;
