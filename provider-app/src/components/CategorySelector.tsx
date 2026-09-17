import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import colors from '../theme/colors';
import { ServiceCategory } from '../types';

interface CategorySelectorProps {
  categories: ServiceCategory[];
  selectedCategoryIds: string[];
  onToggleCategory: (categoryId: string) => void;
  isLoading?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategoryIds,
  onToggleCategory,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color={colors.primary} size="small" />
        <Text style={styles.loadingText}>Fetching available services from catalog...</Text>
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>No active categories available currently.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Event Categories Provided</Text>
      <Text style={styles.helperText}>
        Choose all services your business offers. This determines customer booking matches.
      </Text>

      <View style={styles.grid}>
        {categories.map((cat) => {
          const isSelected = selectedCategoryIds.includes(cat.id);
          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.7}
              onPress={() => onToggleCategory(cat.id)}
              style={[styles.chip, isSelected && styles.chipSelected]}
            >
              <Text style={styles.icon}>{cat.icon || '🎪'}</Text>
              <Text style={[styles.name, isSelected && styles.nameSelected]}>
                {cat.name}
              </Text>
              {isSelected && <Text style={styles.checkmark}> ✓</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 12,
    lineHeight: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: colors.primary,
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  nameSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  checkmark: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyBox: {
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 10,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});

export default CategorySelector;
