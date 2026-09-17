import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import colors from '../../theme/colors';
import {
  useEventDetails,
  useRecommendedCategories,
  useMarketplaceCategories,
  useCreateRequirement,
} from '../../hooks/useEventPlanning';

export const EventRequirementsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const eventId = route.params?.eventId;

  const { data: event } = useEventDetails(eventId);
  const { data: recommendedCategories = [] } = useRecommendedCategories(event?.eventTypeId);
  const { data: allCategories = [] } = useMarketplaceCategories();

  // Combine recommended and all categories, prioritizing recommended
  const categories = recommendedCategories.length > 0 ? recommendedCategories : allCategories;

  const createRequirementMutation = useCreateRequirement();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [budgetMax, setBudgetMax] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = async () => {
    if (!selectedCategoryId) {
      Alert.alert('Selection Required', 'Please select a celebration category.');
      return;
    }

    try {
      await createRequirementMutation.mutateAsync({
        eventId,
        payload: {
          categoryId: selectedCategoryId,
          quantity,
          budgetMax: budgetMax ? parseFloat(budgetMax) : undefined,
          notes: notes.trim() || undefined,
        },
      });

      Alert.alert('Requirement Added', 'The service requirement has been added to your celebration.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add requirement');
    }
  };

  const isSubmitting = createRequirementMutation.isPending;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>Add Service Need</Text>
          <Text style={styles.subTitle}>{event?.title || 'Celebration'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Category Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Service Category *</Text>
          <Text style={styles.sectionDesc}>
            Choose what service you need for this event. These are dynamically loaded from verified catalog categories.
          </Text>

          <View style={styles.categoryGrid}>
            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryCard, isSelected && styles.categoryCardActive]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedCategoryId(cat.id)}
                >
                  <Text style={styles.catIcon}>{cat.icon || '🎪'}</Text>
                  <Text style={[styles.catName, isSelected && styles.catNameActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Quantity & Budget */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirement Details</Text>

          {/* Quantity Counter */}
          <View style={styles.counterRow}>
            <View>
              <Text style={styles.label}>Quantity / Units Needed</Text>
              <Text style={styles.subLabel}>e.g. 1 photographer, 2 makeup sessions</Text>
            </View>
            <View style={styles.counterControls}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Text style={styles.counterBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.counterValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setQuantity((q) => q + 1)}
              >
                <Text style={styles.counterBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Budget */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Budget Cap (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 35000"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={budgetMax}
              onChangeText={setBudgetMax}
            />
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes & Preferences</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="e.g. Need candid photos, traditional Rajasthani mehndi, or North Indian buffet..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Add Requirement to Event</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backBtnText: {
    fontSize: 24,
    color: '#1F2937',
    fontWeight: 'bold',
    marginTop: -3,
  },
  headerTitleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  subTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 14,
    lineHeight: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    borderRadius: 12,
  },
  categoryCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  catIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  catNameActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
  },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  counterBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  counterValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    paddingHorizontal: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  subLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});

export default EventRequirementsScreen;
