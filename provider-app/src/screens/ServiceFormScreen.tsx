import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import colors from '../theme/colors';
import { ProviderApiService } from '../services/api';
import { ServiceCategory } from '../types';

interface ServiceFormScreenProps {
  serviceId?: string;
  onBack: () => void;
  onSuccess: () => void;
}

const PRICING_TYPES = [
  { label: 'Fixed Price (One-time lump sum)', value: 'FIXED' },
  { label: 'Per Person / Plate', value: 'PER_PERSON' },
  { label: 'Per Unit / Item', value: 'PER_UNIT' },
  { label: 'Per Day', value: 'PER_DAY' },
  { label: 'Per Hour', value: 'PER_HOUR' },
  { label: 'Custom Quote (Range)', value: 'CUSTOM_QUOTE' },
];

export const ServiceFormScreen: React.FC<ServiceFormScreenProps> = ({
  serviceId,
  onBack,
  onSuccess,
}) => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Form State
  const [categoryId, setCategoryId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [pricingType, setPricingType] = useState<string>('FIXED');
  const [basePrice, setBasePrice] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minQuantity, setMinQuantity] = useState<string>('');
  const [maxQuantity, setMaxQuantity] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<string>('');
  const [isAvailable, setIsAvailable] = useState<boolean>(true);

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const catList = await ProviderApiService.getCategories();
        setCategories(catList || []);
        if (catList?.length > 0 && !categoryId) {
          setCategoryId(catList[0].id);
        }

        if (serviceId) {
          const service = await ProviderApiService.getVendorService(serviceId);
          setName(service.name);
          setDescription(service.description || '');
          setCategoryId(service.categoryId);
          setPricingType(service.pricingType);
          if (service.basePrice !== null && service.basePrice !== undefined) {
            setBasePrice(String(service.basePrice));
          }
          if (service.minPrice !== null && service.minPrice !== undefined) {
            setMinPrice(String(service.minPrice));
          }
          if (service.maxPrice !== null && service.maxPrice !== undefined) {
            setMaxPrice(String(service.maxPrice));
          }
          if (service.minQuantity !== null && service.minQuantity !== undefined) {
            setMinQuantity(String(service.minQuantity));
          }
          if (service.maxQuantity !== null && service.maxQuantity !== undefined) {
            setMaxQuantity(String(service.maxQuantity));
          }
          if (service.durationMinutes !== null && service.durationMinutes !== undefined) {
            setDurationMinutes(String(service.durationMinutes));
          }
          setIsAvailable(service.isAvailable);
        }
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to initialize form.');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [serviceId]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a service name.');
      return;
    }
    if (!categoryId) {
      Alert.alert('Validation Error', 'Please select a platform category.');
      return;
    }

    const payload: any = {
      name: name.trim(),
      categoryId,
      description: description.trim() || undefined,
      pricingType,
      isAvailable,
      durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : undefined,
    };

    if (pricingType === 'CUSTOM_QUOTE') {
      const min = minPrice ? parseFloat(minPrice) : undefined;
      const max = maxPrice ? parseFloat(maxPrice) : undefined;
      if (min === undefined || max === undefined) {
        Alert.alert('Validation Error', 'Both Minimum Price and Maximum Price are required for Custom Quote.');
        return;
      }
      if (min > max) {
        Alert.alert('Validation Error', 'Minimum price cannot be greater than Maximum price.');
        return;
      }
      payload.minPrice = min;
      payload.maxPrice = max;
    } else {
      const base = basePrice ? parseFloat(basePrice) : undefined;
      if (!base || base <= 0) {
        Alert.alert('Validation Error', 'Base price is required and must be greater than 0.');
        return;
      }
      payload.basePrice = base;
    }

    if (pricingType === 'PER_PERSON' || pricingType === 'PER_UNIT') {
      if (minQuantity) payload.minQuantity = parseInt(minQuantity, 10);
      if (maxQuantity) payload.maxQuantity = parseInt(maxQuantity, 10);
    }

    try {
      setSaving(true);
      if (serviceId) {
        await ProviderApiService.updateService(serviceId, payload);
        Alert.alert('Success', 'Service updated successfully.');
      } else {
        await ProviderApiService.createService(payload);
        Alert.alert('Success', 'Service created successfully.');
      }
      onSuccess();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save service.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading service details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {serviceId ? 'Edit Service' : 'New Service'}
        </Text>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Service Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Service Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Royal Shahi Buffet Catering"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Dynamic Category Selector */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Platform Category * (Database-driven)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryPill,
                  categoryId === cat.id && styles.categoryPillActive,
                ]}
                onPress={() => setCategoryId(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    categoryId === cat.id && styles.categoryPillTextActive,
                  ]}
                >
                  {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Pricing Type Selector */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pricing Model *</Text>
          <View style={styles.pricingTypeGrid}>
            {PRICING_TYPES.map((pt) => (
              <TouchableOpacity
                key={pt.value}
                style={[
                  styles.pricingTypeBtn,
                  pricingType === pt.value && styles.pricingTypeBtnActive,
                ]}
                onPress={() => setPricingType(pt.value)}
              >
                <Text
                  style={[
                    styles.pricingTypeText,
                    pricingType === pt.value && styles.pricingTypeTextActive,
                  ]}
                >
                  {pt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dynamic Price Inputs */}
        {pricingType === 'CUSTOM_QUOTE' ? (
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Min Price (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 50000"
                keyboardType="numeric"
                value={minPrice}
                onChangeText={setMinPrice}
              />
            </View>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Max Price (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 150000"
                keyboardType="numeric"
                value={maxPrice}
                onChangeText={setMaxPrice}
              />
            </View>
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Base Price (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 15000"
              keyboardType="numeric"
              value={basePrice}
              onChangeText={setBasePrice}
            />
          </View>
        )}

        {/* Quantity Bounds (for PER_PERSON or PER_UNIT) */}
        {(pricingType === 'PER_PERSON' || pricingType === 'PER_UNIT') && (
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Min Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 100"
                keyboardType="numeric"
                value={minQuantity}
                onChangeText={setMinQuantity}
              />
            </View>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Max Quantity (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1000"
                keyboardType="numeric"
                value={maxQuantity}
                onChangeText={setMaxQuantity}
              />
            </View>
          </View>
        )}

        {/* Duration */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Typical Duration (Minutes, Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 240 for 4 hours"
            keyboardType="numeric"
            value={durationMinutes}
            onChangeText={setDurationMinutes}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description & Inclusions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Detailed description of what is included in this service..."
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Available Toggle */}
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Available for Booking</Text>
            <Text style={styles.switchSub}>Turn off if temporarily unavailable</Text>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={setIsAvailable}
            trackColor={{ false: '#D1D5DB', true: colors.primary }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backBtnText: {
    fontSize: 16,
    color: '#6B7280',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
  },
  inputGroup: {
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  categoryPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  pricingTypeGrid: {
    gap: 8,
  },
  pricingTypeBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  pricingTypeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: '#FEF2F2',
  },
  pricingTypeText: {
    fontSize: 13,
    color: '#4B5563',
  },
  pricingTypeTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  switchSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default ServiceFormScreen;
