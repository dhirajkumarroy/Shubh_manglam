import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../../store';
import { loginUser, googleLogin, clearError } from '../../store/slices/authSlice';
import { AuthStackParamList } from '../../navigation/types';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import colors from '../../theme/colors';
import spacing from '../../theme/spacing';
import typography from '../../theme/typography';

import GoogleSignInModal, { GoogleAccount } from '../../components/GoogleSignInModal';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address format'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [googleModalVisible, setGoogleModalVisible] = React.useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

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
      .catch(() => {
        // Handled via Redux state error displayed inside modal
      });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Log in to access your celebration & event services</Text>
        </View>

        <View style={styles.formContainer}>
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

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

          {/* Password Input */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Password"
                placeholder="Enter your password"
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
            title="Log In"
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

          {/* Google Sign In Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={() => {
              dispatch(clearError());
              setGoogleModalVisible(true);
            }}
            disabled={loading}
          >
            <Text style={styles.googleIcon}>🌐</Text>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Registration Redirect */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <AppButton
              title="Create an Account"
              variant="outline"
              onPress={() => {
                dispatch(clearError());
                navigation.navigate('Register');
              }}
              style={styles.registerButton}
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
    paddingVertical: spacing.xxxl,
  },
  headerContainer: {
    marginBottom: spacing.xxl,
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
  submitButton: {
    marginTop: spacing.md,
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
  registerButton: {
    width: '100%',
    paddingVertical: 10,
  },
});

export default LoginScreen;
