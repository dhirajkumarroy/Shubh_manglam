import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import colors from '../theme/colors';
import spacing from '../theme/spacing';

export const AppCard: React.FC<ViewProps> = ({ children, style, ...props }) => {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusXl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
});

export default AppCard;
