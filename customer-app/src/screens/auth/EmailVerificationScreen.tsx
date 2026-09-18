import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/types';
import { useAppDispatch } from '../../store';
import { markEmailVerifiedSuccess } from '../../store/slices/authSlice';
import apiClient from '../../api/client';

type EmailVerificationNavProp = NativeStackNavigationProp<AuthStackParamList, 'VerifyEmail'>;
type EmailVerificationRouteProp = RouteProp<AuthStackParamList, 'VerifyEmail'>;

export default function EmailVerificationScreen() {
  const navigation = useNavigation<EmailVerificationNavProp>();
  const route = useRoute<EmailVerificationRouteProp>();
  const dispatch = useAppDispatch();

  const initialEmail = route.params?.email || '';
  const fromRegistration = route.params?.fromRegistration ?? false;

  // States
  const [email, setEmail] = useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editEmailInput, setEditEmailInput] = useState(initialEmail);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  // Resend countdown timer
  const [countdown, setCountdown] = useState(60);
  const [timerActive, setTimerActive] = useState(true);

  // OTP Input references
  const otpInputRefs = useRef<Array<TextInput | null>>([]);

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

  useEffect(() => {
    // Focus on first box on mount
    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 400);
  }, []);

  // Handle OTP digit entry
  const handleOtpChange = (value: string, index: number) => {
    const cleanVal = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];

    if (cleanVal.length > 1) {
      // Paste handling
      const digits = cleanVal.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || '';
      }
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = cleanVal;
    setOtp(newOtp);

    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Resend Verification Email
  const handleResendCode = async () => {
    if (timerActive) return;
    setResending(true);
    setErrorMessage(null);

    try {
      const response = await apiClient.post('/auth/email/resend-verification', {
        email: email.trim().toLowerCase(),
      });
      setSuccessMessage(response.data?.message || 'New 6-digit code has been dispatched to your email.');
      setCountdown(60);
      setTimerActive(true);
      setOtp(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to resend verification email.';
      setErrorMessage(msg);
    } finally {
      setResending(false);
    }
  };

  // Submit Verification OTP
  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await apiClient.post('/auth/email/verify', {
        email: email.trim().toLowerCase(),
        otp: otpCode,
      });

      dispatch(markEmailVerifiedSuccess());
      setIsVerified(true);
      setSuccessMessage(response.data?.message || 'Email verified successfully!');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid or expired verification code.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-Tap Dev OTP Fill
  const handleFillDevOtp = () => {
    setOtp(['1', '2', '3', '4', '5', '6']);
    setErrorMessage(null);
  };

  // Update Email handler if typo
  const handleSaveEmail = () => {
    const trimmed = editEmailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      Alert.alert('Invalid Email', 'Please enter a valid email format.');
      return;
    }
    setEmail(trimmed);
    setIsEditingEmail(false);
    setCountdown(60);
    setTimerActive(true);
    // Request code for new email
    apiClient
      .post('/auth/email/resend-verification', { email: trimmed })
      .then(() => {
        setSuccessMessage(`Code resent to ${trimmed}`);
      })
      .catch(() => {});
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
        {/* Top Header */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Login', { email })}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color="#881337" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Email Verification</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero Branding */}
        <View style={styles.brandHero}>
          <View style={styles.logoBadgeContainer}>
            <View style={styles.logoBadge}>
              <Ionicons
                name={isVerified ? 'checkmark-circle' : 'mail-unread'}
                size={34}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.sparkleBadge}>
              <Ionicons name="sparkles" size={13} color="#FBBF24" />
            </View>
          </View>

          <Text style={styles.brandTitle}>
            {isVerified ? 'Email Verified!' : 'Check Your Inbox'}
          </Text>

          {fromRegistration && !isVerified && (
            <View style={styles.registrationNoticePill}>
              <Ionicons name="gift-outline" size={13} color="#881337" />
              <Text style={styles.registrationNoticeText}>Account created! Step 2 of 2</Text>
            </View>
          )}

          <Text style={styles.brandTagline}>
            {isVerified
              ? 'Your email address is confirmed. Welcome to the Shubh Ausar celebration marketplace!'
              : 'We have sent a 6-digit confirmation code to verify your account.'}
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
          {successMessage && !isVerified && (
            <View style={styles.alertBannerSuccess}>
              <Ionicons name="checkmark-circle" size={18} color="#065F46" />
              <Text style={styles.alertTextSuccess}>{successMessage}</Text>
            </View>
          )}

          {!isVerified ? (
            <View>
              {/* Recipient Email Chip */}
              {!isEditingEmail ? (
                <View style={styles.emailChipRow}>
                  <Ionicons name="mail" size={16} color="#881337" />
                  <Text style={styles.emailChipText} numberOfLines={1}>
                    {email}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setEditEmailInput(email);
                      setIsEditingEmail(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emailChangeLink}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.editEmailBox}>
                  <Text style={styles.editEmailLabel}>Update Destination Email:</Text>
                  <View style={styles.editEmailRow}>
                    <TextInput
                      style={styles.editEmailInput}
                      value={editEmailInput}
                      onChangeText={setEditEmailInput}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.saveEmailBtn}
                      onPress={handleSaveEmail}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.saveEmailBtnText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* OTP Section Header */}
              <View style={styles.otpHeaderRow}>
                <Text style={styles.otpLabel}>Enter 6-Digit Code</Text>
                {/* 1-Tap Dev OTP Button */}
                <TouchableOpacity
                  style={styles.devOtpPill}
                  onPress={handleFillDevOtp}
                  activeOpacity={0.7}
                >
                  <Ionicons name="flash" size={11} color="#D97706" />
                  <Text style={styles.devOtpText}>Fill Dev OTP (123456)</Text>
                </TouchableOpacity>
              </View>

              {/* 6-Digit Boxes */}
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      otpInputRefs.current[index] = ref;
                    }}
                    style={[
                      styles.otpBox,
                      digit ? styles.otpBoxFilled : null,
                      otpInputRefs.current[index]?.isFocused() ? styles.otpBoxFocused : null,
                    ]}
                    value={digit}
                    onChangeText={(val) => handleOtpChange(val, index)}
                    onKeyPress={(e) => handleOtpKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    selectTextOnFocus
                  />
                ))}
              </View>

              {/* Resend Code Section */}
              <View style={styles.resendRow}>
                <Text style={styles.resendPrompt}>Didn't receive the code?</Text>
                {timerActive ? (
                  <Text style={styles.timerText}>Resend in {countdown}s</Text>
                ) : (
                  <TouchableOpacity
                    onPress={handleResendCode}
                    disabled={resending}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.resendLinkText}>
                      {resending ? 'Sending...' : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleVerify}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <View style={styles.buttonContentRow}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.primaryButtonText}>Verifying Code...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContentRow}>
                    <Text style={styles.primaryButtonText}>Verify & Activate Account</Text>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* Celebration Success State */
            <View style={styles.successWrapper}>
              <View style={styles.successIconCircle}>
                <Ionicons name="shield-checkmark" size={44} color="#059669" />
              </View>
              <Text style={styles.successHeading}>Verification Complete!</Text>
              <Text style={styles.successBody}>
                Your email <Text style={{ fontWeight: '700', color: '#1E1B4B' }}>{email}</Text> has
                been confirmed. Your Shubh Ausar customer account is ready for booking verified wedding
                and celebration services.
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('Login', { email })}
                activeOpacity={0.85}
              >
                <View style={styles.buttonContentRow}>
                  <Text style={styles.primaryButtonText}>Sign In to Account</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Footer Back to Sign In */}
          {!isVerified && (
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already verified? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login', { email })}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Security & Spam Tips */}
        {!isVerified && (
          <View style={styles.tipsCard}>
            <View style={styles.tipHeaderRow}>
              <Ionicons name="information-circle" size={16} color="#B45309" />
              <Text style={styles.tipTitle}>Quick Tips</Text>
            </View>
            <Text style={styles.tipText}>
              • Check your spam or promotions folder if the email isn't in your primary inbox.
            </Text>
            <Text style={styles.tipText}>
              • For automated testing or dev environments, use code{' '}
              <Text style={{ fontWeight: '700', color: '#B45309' }}>123456</Text>.
            </Text>
          </View>
        )}
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
  registrationNoticePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F4',
    borderWidth: 1,
    borderColor: '#FCE7F3',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 8,
    gap: 6,
  },
  registrationNoticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#881337',
  },
  brandTagline: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
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
  emailChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F4',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 18,
    gap: 8,
  },
  emailChipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#881337',
  },
  emailChangeLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E65100',
    textDecorationLine: 'underline',
  },
  editEmailBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
  },
  editEmailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  editEmailRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editEmailInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
  },
  saveEmailBtn: {
    backgroundColor: '#881337',
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveEmailBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  otpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  otpLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  devOtpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  devOtpText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpBox: {
    width: 46,
    height: 52,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    fontSize: 22,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  otpBoxFilled: {
    borderColor: '#881337',
    backgroundColor: '#FDF2F4',
  },
  otpBoxFocused: {
    borderColor: '#E65100',
    backgroundColor: '#FFFFFF',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
  successWrapper: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    borderWidth: 4,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#065F46',
    textAlign: 'center',
    marginBottom: 8,
  },
  successBody: {
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
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
  tipsCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 14,
    marginTop: 20,
  },
  tipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
    marginBottom: 4,
  },
});
