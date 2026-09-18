import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/types';
import apiClient from '../../api/client';

type ForgotPasswordNavProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
type ForgotPasswordRouteProp = RouteProp<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordNavProp>();
  const route = useRoute<ForgotPasswordRouteProp>();

  // Steps: 1 = Enter Email, 2 = Check Mailbox / Link Sent
  const [step, setStep] = useState<1 | 2>(1);

  // Email state
  const [email, setEmail] = useState(route.params?.email || '');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  // Resend countdown timer
  const [countdown, setCountdown] = useState(60);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (timerActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, countdown]);

  // Request Reset Link
  const handleRequestLink = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your registered customer email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email format.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await apiClient.post('/auth/password/forgot', { email: trimmedEmail });
      const data = response.data?.data || response.data;
      if (data?.resetUrl) {
        setResetUrl(data.resetUrl);
      }
      setSuccessMessage('Password reset link has been dispatched to your mailbox.');
      setStep(2);
      setCountdown(60);
      setTimerActive(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to send password reset email.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Resend Reset Link
  const handleResendLink = async () => {
    if (timerActive) return;
    setResending(true);
    setErrorMessage(null);

    try {
      const response = await apiClient.post('/auth/password/forgot', {
        email: email.trim().toLowerCase(),
      });
      const data = response.data?.data || response.data;
      if (data?.resetUrl) {
        setResetUrl(data.resetUrl);
      }
      setSuccessMessage('A fresh password reset link has been sent to your email.');
      setCountdown(60);
      setTimerActive(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to resend reset email.';
      setErrorMessage(msg);
    } finally {
      setResending(false);
    }
  };

  // Open User's Default Email Client
  const handleOpenEmailApp = async () => {
    const mailtoUrl = `mailto:${email}`;
    const canOpen = await Linking.canOpenURL(mailtoUrl);
    if (canOpen) {
      await Linking.openURL(mailtoUrl);
    } else {
      Alert.alert(
        'Check Your Mailbox',
        `Please open your email application and look for an email from Shubh Ausar sent to ${email}.`
      );
    }
  };

  // Open Direct Reset Link (Simulator / Dev Mode)
  const handleOpenResetWebPage = async () => {
    if (resetUrl) {
      await Linking.openURL(resetUrl);
    } else {
      Alert.alert(
        'Check Your Inbox',
        `Click the secure reset link inside the email sent to ${email}.`
      );
    }
  };

  // 1-Tap Fill Customer Demo Account
  const handleFillDemoCustomer = () => {
    setEmail('customer@gmail.com');
    setErrorMessage(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (step === 2) setStep(1);
              else navigation.navigate('Login', { email });
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color="#881337" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Customer Security</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Brand Hero */}
        <View style={styles.brandHero}>
          <View style={styles.logoBadgeContainer}>
            <View style={styles.logoBadge}>
              <Ionicons
                name={step === 2 ? 'mail-open' : 'key'}
                size={32}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.sparkleBadge}>
              <Ionicons name="sparkles" size={13} color="#FBBF24" />
            </View>
          </View>
          <Text style={styles.brandTitle}>
            {step === 1 ? 'Forgot Password?' : 'Check Your Inbox'}
          </Text>
          <Text style={styles.brandTagline}>
            {step === 1
              ? 'Enter your customer email and we will send you a secure link to reset your password.'
              : `We have sent a secure password reset link to ${email}`}
          </Text>
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.alertBannerError}>
              <Ionicons name="alert-circle" size={18} color="#991B1B" />
              <Text style={styles.alertTextError}>{errorMessage}</Text>
            </View>
          )}

          {/* Success Banner */}
          {successMessage && step === 1 && (
            <View style={styles.alertBannerSuccess}>
              <Ionicons name="checkmark-circle" size={18} color="#065F46" />
              <Text style={styles.alertTextSuccess}>{successMessage}</Text>
            </View>
          )}

          {/* STEP 1: Enter Customer Email */}
          {step === 1 && (
            <View>
              <Text style={styles.sectionHeading}>Password Recovery</Text>
              <Text style={styles.sectionDescription}>
                Enter the email address tied to your Shubh Ausar customer profile.
              </Text>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Customer Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputField}
                    placeholder="e.g. customer@example.com"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                  {email.length > 0 && (
                    <TouchableOpacity onPress={() => setEmail('')}>
                      <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* 1-Tap Customer Demo Pill (Customer App Only) */}
              <View style={styles.demoSection}>
                <Text style={styles.demoSectionLabel}>1-Tap Demo Testing:</Text>
                <TouchableOpacity
                  style={styles.demoPill}
                  onPress={handleFillDemoCustomer}
                  activeOpacity={0.8}
                >
                  <Ionicons name="person" size={13} color="#881337" />
                  <Text style={styles.demoPillText}>Fill Customer Demo (customer@gmail.com)</Text>
                </TouchableOpacity>
              </View>

              {/* Send Reset Link CTA */}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleRequestLink}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <View style={styles.buttonContentRow}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.primaryButtonText}>Sending Reset Link...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContentRow}>
                    <Text style={styles.primaryButtonText}>Send Password Reset Link</Text>
                    <Ionicons name="send" size={16} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Link Dispatched / Check Inbox View */}
          {step === 2 && (
            <View style={styles.inboxWrapper}>
              <View style={styles.inboxIconCircle}>
                <Ionicons name="mail" size={40} color="#881337" />
              </View>

              <Text style={styles.inboxHeading}>Reset Link Sent!</Text>

              <Text style={styles.inboxBody}>
                We've dispatched a secure password reset link to:
              </Text>

              <View style={styles.emailBadge}>
                <Ionicons name="mail" size={14} color="#881337" />
                <Text style={styles.emailBadgeText} numberOfLines={1}>
                  {email}
                </Text>
              </View>

              <Text style={styles.inboxInstructions}>
                Please check your mailbox and tap the button inside to change your password on the
                secure reset page.
              </Text>

              {/* Action: Open Email App */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleOpenEmailApp}
                activeOpacity={0.85}
              >
                <View style={styles.buttonContentRow}>
                  <Ionicons name="mail-open-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Open Email App</Text>
                </View>
              </TouchableOpacity>

              {/* Action: Direct Preview Link in Browser (Convenient for Dev & Testing) */}
              {resetUrl && (
                <TouchableOpacity
                  style={styles.browserPreviewButton}
                  onPress={handleOpenResetWebPage}
                  activeOpacity={0.8}
                >
                  <View style={styles.buttonContentRow}>
                    <Ionicons name="globe-outline" size={16} color="#B45309" />
                    <Text style={styles.browserPreviewText}>Open Reset Page in Browser</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Resend Link Row */}
              <View style={styles.resendRow}>
                <Text style={styles.resendPrompt}>Didn't receive the email?</Text>
                {timerActive ? (
                  <Text style={styles.timerText}>Resend in {countdown}s</Text>
                ) : (
                  <TouchableOpacity
                    onPress={handleResendLink}
                    disabled={resending}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.resendLinkText}>
                      {resending ? 'Sending...' : 'Resend Link'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Return to Sign In Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Remember your password? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login', { email })}>
              <Text style={styles.footerLink}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Assurance */}
        <View style={styles.securityBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#6B7280" />
          <Text style={styles.securityBadgeText}>
            Links expire in 1 hour • Protected by Shubh Ausar Security
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#881337',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#881337',
    letterSpacing: 0.5,
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadgeContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#881337',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#881337',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  sparkleBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FEF3C7',
    padding: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E1B4B',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  brandTagline: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#881337',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3E8E2',
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1B4B',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
    marginBottom: 20,
  },
  alertBannerError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  alertTextError: {
    flex: 1,
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '500',
  },
  alertBannerSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  alertTextSuccess: {
    flex: 1,
    fontSize: 13,
    color: '#065F46',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  demoSection: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  demoSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  demoPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#881337',
  },
  primaryButton: {
    backgroundColor: '#881337',
    borderRadius: 14,
    height: 52,
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
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  inboxWrapper: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  inboxIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FDF2F4',
    borderWidth: 3,
    borderColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  inboxHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E1B4B',
    marginBottom: 6,
  },
  inboxBody: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F4',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 14,
    gap: 6,
  },
  emailBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#881337',
  },
  inboxInstructions: {
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
    paddingHorizontal: 10,
  },
  browserPreviewButton: {
    marginTop: 10,
    width: '100%',
    height: 46,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browserPreviewText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    gap: 6,
  },
  resendPrompt: {
    fontSize: 12,
    color: '#6B7280',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  resendLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E65100',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  footerText: {
    fontSize: 13,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#881337',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  securityBadgeText: {
    fontSize: 11,
    color: '#6B7280',
  },
});
