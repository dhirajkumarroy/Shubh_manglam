import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import colors from '../theme/colors';

export const ProviderSplashScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('ProviderHome');
    }, 1500);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.badge}>PARTNER & PROVIDER APP</Text>
        <Text style={styles.logoText}>
          Shubh <Text style={styles.logoAccent}>Ausar</Text>
        </Text>
        <Text style={styles.subtitle}>शुभ अवसर • Grow your celebration business</Text>
      </View>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Initializing partner console...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 1.5,
    marginBottom: 8,
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  logoAccent: {
    color: colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

export default ProviderSplashScreen;
