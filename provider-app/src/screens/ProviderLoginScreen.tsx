import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import colors from '../theme/colors';
import { ProviderApiService, ProviderAuthData } from '../services/api';

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
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const data = await ProviderApiService.login({
        email: email.trim().toLowerCase(),
        password,
      });
      onSuccess(data);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Unable to log in.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const data = await ProviderApiService.googleLogin({
        idToken: `google_provider_${Date.now()}`,
        email: 'provider@gmail.com',
        name: 'Royal Events Partner',
        businessName: 'Royal Events & Decorations',
      });
      onSuccess(data);
    } catch (err: any) {
      Alert.alert('Google Sign-in Failed', err.message || 'Unable to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.badge}>Partner Portal</Text>
          <Text style={styles.title}>Shubh Mangalam</Text>
          <Text style={styles.subtitle}>Sign in to manage your bookings and leads</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Business Email</Text>
          <TextInput
            style={styles.input}
            placeholder="vendor@example.com"
            placeholderTextColor="#A8A29E"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#A8A29E"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <Text style={styles.googleIcon}>🌐</Text>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New event service provider? </Text>
            <TouchableOpacity onPress={onNavigateToRegister}>
              <Text style={styles.footerLink}>Register Business</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
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
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
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
    marginTop: 12,
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
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonText: {
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
    color: colors.secondary,
  },
});

export default ProviderLoginScreen;
