import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store';
import { loginUser, googleLogin, clearError } from '../../store/slices/authSlice';
import { AuthStackParamList } from '../../navigation/types';
import colors from '../../theme/colors';
import spacing from '../../theme/spacing';
import typography from '../../theme/typography';
import GoogleSignInModal, { GoogleAccount } from '../../components/GoogleSignInModal';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'Login'>>();
  const { loading, error } = useAppSelector((state) => state.auth);
  
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: route.params?.email || '',
      password: '',
    },
  });

  useEffect(() => {
    if (route.params?.email) {
      setValue('email', route.params.email, { shouldValidate: true });
    }
  }, [route.params?.email, setValue]);

  const handleFillDemo = () => {
    setValue('email', 'customer@gmail.com', { shouldValidate: true });
    setValue('password', 'Password@123', { shouldValidate: true });
    dispatch(clearError());
    setDemoLoaded(true);
    setTimeout(() => setDemoLoaded(false), 2500);
  };

  const onSubmit = (data: LoginFormData) => {
    dispatch(clearError());
    dispatch(loginUser(data));
  };

  const handleGoogleAccountSelect = (account: GoogleAccount) => {
    dispatch(clearError());
    dispatch(
      googleLogin({
        idToken: `google_${account.email.toLowerCase().trim()}`,
        email: account.email.toLowerCase().trim(),
        name: account.name.trim(),
      })
    )
      .unwrap()
      .then(() => {
        setGoogleModalVisible(false);
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
        {/* Top Celebration Brand Emblem */}
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
          <Text style={styles.brandTagline}>Celebrate Every Occasion • Customer Portal</Text>
        </View>

        {/* Card Container */}
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
                dispatch(clearError());
                navigation.navigate('Register');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.segmentedTextInactive}>Create Account</Text>
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
                name={demoLoaded ? "checkmark-circle" : "flash"} 
                size={16} 
                color={demoLoaded ? "#15803D" : "#D97706"} 
              />
            </View>
            <View style={styles.demoTextContainer}>
              <Text style={styles.demoTitle}>
                {demoLoaded ? "Credentials Loaded!" : "Auto-fill Demo Customer"}
              </Text>
              <Text style={styles.demoSubtitle}>customer@gmail.com • Password@123</Text>
            </View>
            <Ionicons name="arrow-forward" size={14} color={demoLoaded ? "#15803D" : "#D97706"} />
          </TouchableOpacity>

          {/* Error Banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={colors.error} style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                  <Feather name="mail" size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter your email (e.g. customer@gmail.com)"
                    placeholderTextColor={colors.textLight}
                    style={styles.input}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {value ? (
                    <TouchableOpacity onPress={() => onChange('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="close-circle" size={16} color={colors.textLight} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}
            />
            {errors.email && <Text style={styles.fieldErrorText}>{errors.email.message}</Text>}
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.passwordLabelRow}>
              <Text style={styles.inputLabel}>Password</Text>
            </View>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                  <Feather name="lock" size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textLight}
                    style={styles.input}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={18} 
                      color={colors.textMuted} 
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && <Text style={styles.fieldErrorText}>{errors.password.message}</Text>}
          </View>

          {/* Remember Me & Help Row */}
          <View style={styles.rememberRow}>
            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                {rememberMe && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>Keep me signed in</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => {
                const currentEmail = watch('email');
                navigation.navigate('ForgotPassword', { email: currentEmail });
              }}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Submit Sign In Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <View style={styles.buttonLoadingRow}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.submitButtonText}>Signing In...</Text>
              </View>
            ) : (
              <View style={styles.buttonLoadingRow}>
                <Text style={styles.submitButtonText}>Sign In to Account</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={() => {
              dispatch(clearError());
              setGoogleModalVisible(true);
            }}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View style={styles.googleIconCircle}>
              <Ionicons name="logo-google" size={16} color="#DB4437" />
            </View>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Security & Guarantee Footer */}
        <View style={styles.trustFooter}>
          <View style={styles.trustItem}>
            <MaterialCommunityIcons name="shield-check" size={16} color="#16A34A" />
            <Text style={styles.trustText}>Verified Ceremony Vendors</Text>
          </View>
          <View style={styles.trustDot} />
          <View style={styles.trustItem}>
            <MaterialCommunityIcons name="lock-check" size={16} color="#881337" />
            <Text style={styles.trustText}>100% Escrow Protection</Text>
          </View>
        </View>
      </ScrollView>

      {/* Dynamic Google Sign-In Sheet */}
      <GoogleSignInModal
        visible={googleModalVisible}
        onClose={() => setGoogleModalVisible(false)}
        onSuccess={handleGoogleAccountSelect}
        loading={loading}
        error={error}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBadgeContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#881337',
    borderWidth: 2,
    borderColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#881337',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  logoInitials: {
    color: '#FBBF24',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sparkleBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#4C0519',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1C1917',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E65100',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: '#E7E0D8',
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5EFE6',
    borderRadius: 12,
    padding: 3,
    marginBottom: spacing.lg,
  },
  segmentedTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentedTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: spacing.lg,
  },
  demoPillSuccess: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  demoIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 10,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#44403C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#D6D3D1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1C1917',
    fontWeight: '500',
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  fieldErrorText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 2,
  },
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: spacing.lg,
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
    borderColor: '#A8A29E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  checkboxActive: {
    backgroundColor: '#881337',
    borderColor: '#881337',
  },
  checkboxLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#57534E',
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E65100',
  },
  submitButton: {
    backgroundColor: '#881337',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#881337',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  buttonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E7E0D8',
  },
  dividerText: {
    paddingHorizontal: spacing.sm,
    fontSize: 10,
    fontWeight: '800',
    color: '#A8A29E',
    letterSpacing: 0.5,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D6D3D1',
    borderRadius: 14,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  googleIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  trustFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    flexWrap: 'wrap',
    gap: 8,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trustText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78716C',
  },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D6D3D1',
  },
});

export default LoginScreen;
