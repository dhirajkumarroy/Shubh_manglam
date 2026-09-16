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
import { useNavigation } from '@react-navigation/native';
import { useChangePassword } from '../../hooks/useProfile';
import colors from '../../theme/colors';

export const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const changePasswordMutation = useChangePassword();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateInputs = (): boolean => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setValidationError('All password fields are required.');
      return false;
    }

    if (newPassword.length < 8) {
      setValidationError('New password must be at least 8 characters long.');
      return false;
    }

    // Password strength check: must contain at least one letter and one number
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      setValidationError('Password must contain both letters and numbers.');
      return false;
    }

    if (newPassword === oldPassword) {
      setValidationError('New password cannot be the same as the current password.');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setValidationError('New password and confirmation do not match.');
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleChangePassword = () => {
    if (!validateInputs()) return;

    changePasswordMutation.mutate(
      { oldPassword, newPassword },
      {
        onSuccess: (data) => {
          Alert.alert('Success', data.message || 'Password changed successfully.', [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              },
            },
          ]);
        },
        onError: (err: any) => {
          Alert.alert('Password Change Failed', err.message || 'Invalid current password.');
        },
      }
    );
  };

  const isPending = changePasswordMutation.isPending;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
            <Text style={styles.backLinkText}>← Profile</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Change Password</Text>
          <Text style={styles.subtitle}>Protect your account with a secure password</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {validationError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{validationError}</Text>
            </View>
          )}

          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            value={oldPassword}
            onChangeText={setOldPassword}
            placeholder="Enter current password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Min 8 chars, letters and numbers"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter new password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.submitBtn, isPending && styles.submitBtnDisabled]}
            onPress={handleChangePassword}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>Update Password</Text>
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
  errorBanner: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: colors.error,
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 8,
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
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
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

export default ChangePasswordScreen;
