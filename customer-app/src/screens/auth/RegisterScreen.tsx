import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../../store';
import { registerUser, googleLogin, clearError } from '../../store/slices/authSlice';
import { AuthStackParamList } from '../../navigation/types';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import colors from '../../theme/colors';
import spacing from '../../theme/spacing';
import typography from '../../theme/typography';

import GoogleSignInModal, { GoogleAccount } from '../../components/GoogleSignInModal';

const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .trim(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address format'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number cannot exceed 15 digits')
    .regex(/^\+?\d+$/, 'Phone number must contain only digits (optionally starting with +)'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
  role: z.literal('CUSTOMER'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [googleModalVisible, setGoogleModalVisible] = React.useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'CUSTOMER',
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    dispatch(clearError());
    dispatch(registerUser(data))
      .unwrap()
      .then(() => {
        Alert.alert(
          'Registration Successful!',
          'Welcome to Shubh Mangalam. Your profile has been created successfully.'
        );
      })
      .catch((err) => {
        Alert.alert('Registration Failed', err || 'Unable to register account.');
      });
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
      .catch(() => {
        // Handled in Redux error state
      });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Join Shubh Mangalam</Text>
          <Text style={styles.subtitle}>Create your profile for every celebration and service</Text>
        </View>

        <View style={styles.formContainer}>
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Name Input */}
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Full Name"
                placeholder="Enter your name"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.name?.message}
              />
            )}
          />

          {/* Email Input */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Email Address"
                placeholder="Enter your email"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email?.message}
              />
            )}
          />

          {/* Phone Input */}
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Phone Number"
                placeholder="e.g. +919900000001"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="phone-pad"
                error={errors.phone?.message}
              />
            )}
          />

          {/* Password Input */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Password"
                placeholder="Enter secure password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry
                autoCapitalize="none"
                error={errors.password?.message}
              />
            )}
          />

          {/* Submit Button */}
          <AppButton
            title="Create Account"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.submitButton}
          />

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign Up Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={() => {
              dispatch(clearError());
              setGoogleModalVisible(true);
            }}
            disabled={loading}
          >
            <Text style={styles.googleIcon}>🌐</Text>
            <Text style={styles.googleButtonText}>Sign up with Google</Text>
          </TouchableOpacity>

          {/* Login Redirect */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <AppButton
              title="Log In"
              variant="outline"
              onPress={() => {
                dispatch(clearError());
                navigation.navigate('Login');
              }}
              style={styles.loginButton}
            />
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
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  headerContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.extraBold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontWeight: typography.weights.medium,
  },
  formContainer: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusXxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorBanner: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.sm,
    borderRadius: spacing.borderRadiusMd,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  googleIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: typography.sizes.md,
    marginBottom: spacing.sm,
  },
  loginButton: {
    width: '100%',
    paddingVertical: 10,
  },
});

export default RegisterScreen;
