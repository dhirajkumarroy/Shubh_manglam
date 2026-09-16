import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  TouchableOpacity,
} from 'react-native';
import colors from '../theme/colors';
import spacing from '../theme/spacing';
import typography from '../theme/typography';

interface AppInputProps extends TextInputProps {
  label: string;
  error?: string;
  editable?: boolean;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  editable = true,
  secureTextEntry,
  style,
  ...props
}) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            !editable && styles.disabledInput,
            error && styles.errorInput,
            secureTextEntry && styles.inputWithToggle,
            style,
          ]}
          editable={editable}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isSecure}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsSecure(!isSecure)}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleText}>
              {isSecure ? 'Show' : 'Hide'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  label: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.borderLight,
    borderWidth: 1,
    borderRadius: spacing.borderRadiusLg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: typography.sizes.lg,
    color: colors.text,
    width: '100%',
  },
  inputWithToggle: {
    paddingRight: 60,
  },
  disabledInput: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    color: colors.textMuted,
  },
  errorInput: {
    borderColor: colors.error,
  },
  toggleButton: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    marginTop: spacing.xxs,
  },
});

export default AppInput;
