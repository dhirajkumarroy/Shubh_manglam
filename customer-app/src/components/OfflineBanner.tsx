import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import colors from '../theme/colors';
import spacing from '../theme/spacing';
import typography from '../theme/typography';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // Consider user offline if isConnected is false
      setIsOffline(state.isConnected === false);
    });

    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>⚠️ You're offline. Using cached local details.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.error,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    width: '100%',
    ...Platform.select({
      ios: {
        paddingTop: spacing.xxl, // Handle iOS notch offset
      },
    }),
  },
  text: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
});

export default OfflineBanner;
