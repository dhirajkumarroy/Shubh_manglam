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
} from 'react-native';
import colors from '../theme/colors';
import { ProviderApiService } from '../services/api';
import { CatalogServiceItem } from '../types';

interface PackageFormScreenProps {
  packageId?: string;
  onBack: () => void;
  onSuccess: () => void;
}

export const PackageFormScreen: React.FC<PackageFormScreenProps> = ({
  packageId,
  onBack,
  onSuccess,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [availableServices, setAvailableServices] = useState<CatalogServiceItem[]>([]);

  // Form State
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const svcRes = await ProviderApiService.getVendorServices({ isActive: true });
        setAvailableServices(svcRes.services || []);

        if (packageId) {
          const pkg = await ProviderApiService.getVendorPackage(packageId);
          setName(pkg.name);
          setDescription(pkg.description || '');
          setPrice(String(pkg.price));
          if (pkg.originalPrice) setOriginalPrice(String(pkg.originalPrice));

          const selectedMap: Record<string, number> = {};
          (pkg.services || []).forEach((ps: any) => {
            selectedMap[ps.serviceId] = ps.quantity;
          });
          setSelectedServices(selectedMap);
        }
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to load package data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [packageId]);

  const toggleService = (svcId: string) => {
    setSelectedServices((prev) => {
      const next = { ...prev };
      if (next[svcId]) {
        delete next[svcId];
      } else {
        next[svcId] = 1;
      }
      return next;
    });
  };

  const updateQuantity = (svcId: string, delta: number) => {
    setSelectedServices((prev) => {
      const current = prev[svcId] || 1;
      const nextQty = Math.max(1, current + delta);
      return { ...prev, [svcId]: nextQty };
    });
  };

  // Calculate live discount percentage
  const numPrice = parseFloat(price) || 0;
  const numOrig = parseFloat(originalPrice) || 0;
  const calculatedDiscount =
    numOrig > numPrice && numOrig > 0
      ? Math.round(((numOrig - numPrice) / numOrig) * 100)
      : null;

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a package name.');
      return;
    }
    if (!numPrice || numPrice <= 0) {
      Alert.alert('Validation Error', 'Package price must be greater than 0.');
      return;
    }

    const servicesList = Object.entries(selectedServices).map(([serviceId, quantity]) => ({
      serviceId,
      quantity,
    }));

    if (servicesList.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one service to include in this package.');
      return;
    }

    const payload: any = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: numPrice,
      originalPrice: numOrig > 0 ? numOrig : undefined,
      services: servicesList,
    };

    try {
      setSaving(true);
      if (packageId) {
        await ProviderApiService.updatePackage(packageId, payload);
        Alert.alert('Success', 'Package updated successfully.');
      } else {
        await ProviderApiService.createPackage(payload);
        Alert.alert('Success', 'Package created successfully.');
      }
      onSuccess();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save package.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading package details...</Text>
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
          {packageId ? 'Edit Package' : 'New Package'}
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
        {/* Package Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Package Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Complete Wedding Stage & Mandap Combo"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Pricing & Discount */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.flex1]}>
            <Text style={styles.label}>Offer Price (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 75000"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          </View>
          <View style={[styles.inputGroup, styles.flex1]}>
            <Text style={styles.label}>Original Price (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 95000"
              keyboardType="numeric"
              value={originalPrice}
              onChangeText={setOriginalPrice}
            />
          </View>
        </View>

        {calculatedDiscount !== null ? (
          <View style={styles.discountBanner}>
            <Text style={styles.discountBannerText}>
              🏷 Customers save {calculatedDiscount}% with this package bundle!
            </Text>
          </View>
        ) : null}

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Package Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Highlight everything included in this bundle..."
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Included Services Selector */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bundle Services * (Select from your services)</Text>
          <Text style={styles.subLabel}>
            Cross-vendor bundling is blocked. Only your own active services can be included.
          </Text>

          {availableServices.length === 0 ? (
            <View style={styles.noServicesBox}>
              <Text style={styles.noServicesText}>
                You have no active services yet. Please create services first before bundling them into a package.
              </Text>
            </View>
          ) : (
            <View style={styles.servicesList}>
              {availableServices.map((svc) => {
                const isSelected = Boolean(selectedServices[svc.id]);
                const qty = selectedServices[svc.id] || 1;

                return (
                  <View
                    key={svc.id}
                    style={[
                      styles.serviceItemCard,
                      isSelected && styles.serviceItemCardSelected,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.serviceItemInfo}
                      onPress={() => toggleService(svc.id)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected,
                        ]}
                      >
                        {isSelected && <Text style={styles.checkMark}>✓</Text>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.serviceItemName}>{svc.name}</Text>
                        <Text style={styles.serviceItemCategory}>
                          {svc.category?.name} • ₹{svc.basePrice?.toLocaleString() || 'Custom'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {isSelected && (
                      <View style={styles.qtyRow}>
                        <Text style={styles.qtyLabel}>Qty:</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQuantity(svc.id, -1)}
                        >
                          <Text style={styles.qtyBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{qty}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQuantity(svc.id, 1)}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
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
  subLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  discountBanner: {
    backgroundColor: '#DEF7EC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#31C48D',
  },
  discountBannerText: {
    color: '#03543F',
    fontWeight: '600',
    fontSize: 13,
  },
  noServicesBox: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 8,
  },
  noServicesText: {
    color: '#92400E',
    fontSize: 13,
    lineHeight: 18,
  },
  servicesList: {
    gap: 8,
  },
  serviceItemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  serviceItemCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFF7ED',
  },
  serviceItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  serviceItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  serviceItemCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  qtyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  qtyBtn: {
    backgroundColor: '#E5E7EB',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    lineHeight: 18,
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 20,
    textAlign: 'center',
  },
});

export default PackageFormScreen;
