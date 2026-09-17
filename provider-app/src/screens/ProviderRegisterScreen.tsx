import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import colors from '../theme/colors';
import { ProviderApiService, ProviderAuthData } from '../services/api';

interface ProviderRegisterScreenProps {
  onSuccess: (data: ProviderAuthData) => void;
  onNavigateToLogin: () => void;
}

export const ProviderRegisterScreen: React.FC<ProviderRegisterScreenProps> = ({
  onSuccess,
  onNavigateToLogin,
}) => {
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !businessName || !email || !phone || !password) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
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
        'Registration Submitted',
        'Your business registration is complete. Your vendor profile is currently PENDING administrative approval.'
      );
      onSuccess(data);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Unable to register business.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
      const data = await ProviderApiService.googleLogin({
        idToken: `google_provider_${Date.now()}`,
        email: 'provider@gmail.com',
        name: name.trim() || 'Royal Events Partner',
        businessName: businessName.trim() || 'Royal Events & Celebrations',
      });

      Alert.alert(
        'Google Registration Completed',
        'Your provider account is ready. Your profile is active and pending administrative verification.'
      );
      onSuccess(data);
    } catch (err: any) {
      Alert.alert('Google Sign-in Failed', err.message || 'Unable to register via Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.badge}>Partner Onboarding</Text>
          <Text style={styles.title}>Join Shubh Mangalam</Text>
          <Text style={styles.subtitle}>List your decoration, catering, tent, DJ, or event service</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Business / Firm Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Royal Decoration & Sound"
            placeholderTextColor="#A8A29E"
            value={businessName}
            onChangeText={setBusinessName}
          />

          <Text style={styles.label}>Owner Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ramesh Sharma"
            placeholderTextColor="#A8A29E"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="vendor@example.com"
            placeholderTextColor="#A8A29E"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="+919876543210"
            placeholderTextColor="#A8A29E"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Operating City</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Panipat"
            placeholderTextColor="#A8A29E"
            value={city}
            onChangeText={setCity}
          />

          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={styles.input}
            placeholder="At least 8 chars, 1 upper, 1 number, 1 special"
            placeholderTextColor="#A8A29E"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Register as Partner</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleRegister}
            disabled={loading}
          >
            <Text style={styles.googleIcon}>🌐</Text>
            <Text style={styles.googleButtonText}>Register with Google</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already registered? </Text>
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
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
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  badge: {
    backgroundColor: colors.accentGoldBg,
    color: colors.accentGold,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.accentGold,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  form: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    fontSize: 14,
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
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
    backgroundColor: '#FFFFFF',
    borderColor: '#E7E0D8',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 14,
  },
  googleIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default ProviderRegisterScreen;
