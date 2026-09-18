import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useAppDispatch } from '../../store';
import { loadStoredToken } from '../../store/slices/authSlice';
import colors from '../../theme/colors';

export const SplashScreen: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadStoredToken());
  }, [dispatch]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>Shubh <Text style={styles.logoAccent}>Ausar</Text></Text>
        <Text style={styles.subtitle}>शुभ अवसर • Celebrate Every Occasion</Text>
      </View>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading celebrations...</Text>
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
  logoText: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
  },
  logoAccent: {
    color: colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
    fontWeight: '500',
    letterSpacing: 0.5,
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

export default SplashScreen;
