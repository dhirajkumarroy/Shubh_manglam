import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import { ProviderApiService } from '../services/api';
import { CatalogServiceItem, CatalogPackageItem } from '../types';

interface CatalogDashboardScreenProps {
  onBack?: () => void;
  onAddService: () => void;
  onEditService: (id: string) => void;
  onManageImages: (serviceId: string, serviceName: string) => void;
  onAddPackage: () => void;
  onEditPackage: (id: string) => void;
  initialTab?: 'SERVICES' | 'PACKAGES';
  hideHeader?: boolean;
}

export const CatalogDashboardScreen: React.FC<CatalogDashboardScreenProps> = ({
  onBack,
  onAddService,
  onEditService,
  onManageImages,
  onAddPackage,
  onEditPackage,
  initialTab = 'SERVICES',
  hideHeader = false,
}) => {
  const [activeTab, setActiveTab] = useState<'SERVICES' | 'PACKAGES'>(initialTab);
  const [services, setServices] = useState<CatalogServiceItem[]>([]);
  const [packages, setPackages] = useState<CatalogPackageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const [svcRes, pkgRes] = await Promise.all([
        ProviderApiService.getVendorServices(),
        ProviderApiService.getVendorPackages(),
      ]);
      setServices(svcRes.services || []);
      setPackages(pkgRes.packages || []);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleDeleteService = (id: string, name: string) => {
    Alert.alert(
      'Deactivate Service',
      `Are you sure you want to deactivate "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await ProviderApiService.deleteService(id);
              fetchCatalog();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to deactivate service.');
            }
          },
        },
      ]
    );
  };

  const handleDeletePackage = (id: string, name: string) => {
    Alert.alert(
      'Deactivate Package',
      `Are you sure you want to deactivate "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await ProviderApiService.deletePackage(id);
              fetchCatalog();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to deactivate package.');
            }
          },
        },
      ]
    );
  };

  const renderServiceCard = ({ item }: { item: CatalogServiceItem }) => {
    const formattedPrice =
      item.pricingType === 'CUSTOM_QUOTE'
        ? `₹${item.minPrice?.toLocaleString() || 0} - ₹${item.maxPrice?.toLocaleString() || 0}`
        : `₹${item.basePrice?.toLocaleString() || 0}`;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <View style={styles.badgeRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {item.category?.name || 'General'}
                  {item.subcategory ? ` • ${item.subcategory.name}` : ''}
                </Text>
              </View>
              {item.eventType && (
                <View style={styles.eventBadge}>
                  <Text style={styles.eventBadgeText}>
                    🎉 {item.eventType.name}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.cardTitle}>{item.name}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              item.isActive ? styles.statusActive : styles.statusInactive,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                item.isActive ? styles.statusTextActive : styles.statusTextInactive,
              ]}
            >
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.pricingRow}>
          <Text style={styles.priceText}>{formattedPrice}</Text>
          <Text style={styles.pricingTypeTag}>
            {item.pricingType.replace('_', ' ')}
          </Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionBtnSmall}
            onPress={() => onManageImages(item.id, item.name)}
          >
            <Text style={styles.actionBtnSmallText}>📷 Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtnSmall}
            onPress={() => onEditService(item.id)}
          >
            <Text style={styles.actionBtnSmallText}>✏ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtnSmall, styles.deleteBtn]}
            onPress={() => handleDeleteService(item.id, item.name)}
          >
            <Text style={styles.deleteBtnText}>🗑 Deactivate</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPackageCard = ({ item }: { item: CatalogPackageItem }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.servicesCount}>
              📦 Bundles {item.services?.length || 0} services
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              item.isActive ? styles.statusActive : styles.statusInactive,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                item.isActive ? styles.statusTextActive : styles.statusTextInactive,
              ]}
            >
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.pricingRow}>
          <View style={styles.priceCol}>
            <Text style={styles.priceText}>₹{item.price?.toLocaleString()}</Text>
            {item.originalPrice ? (
              <Text style={styles.originalPriceText}>
                ₹{item.originalPrice.toLocaleString()}
              </Text>
            ) : null}
          </View>
          {item.discountPercent ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>
                {item.discountPercent}% OFF
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionBtnSmall}
            onPress={() => onEditPackage(item.id)}
          >
            <Text style={styles.actionBtnSmallText}>✏ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtnSmall, styles.deleteBtn]}
            onPress={() => handleDeletePackage(item.id, item.name)}
          >
            <Text style={styles.deleteBtnText}>🗑 Deactivate</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, hideHeader && { backgroundColor: 'transparent' }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      {!hideHeader && (
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Catalog Management</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={activeTab === 'SERVICES' ? onAddService : onAddPackage}
          >
            <Text style={styles.addBtnText}>
              {activeTab === 'SERVICES' ? '+ Service' : '+ Package'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tabs */}
      <View style={[styles.tabBar, hideHeader && { marginTop: 12 }]}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'SERVICES' && styles.tabItemActive]}
          onPress={() => setActiveTab('SERVICES')}
        >
          <Text
            style={[
              styles.tabItemText,
              activeTab === 'SERVICES' && styles.tabItemTextActive,
            ]}
          >
            Services ({services.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'PACKAGES' && styles.tabItemActive]}
          onPress={() => setActiveTab('PACKAGES')}
        >
          <Text
            style={[
              styles.tabItemText,
              activeTab === 'PACKAGES' && styles.tabItemTextActive,
            ]}
          >
            Packages ({packages.length})
          </Text>
        </TouchableOpacity>

        {hideHeader && (
          <TouchableOpacity
            style={[styles.addBtn, { paddingVertical: 8, paddingHorizontal: 12, marginLeft: 8 }]}
            onPress={activeTab === 'SERVICES' ? onAddService : onAddPackage}
          >
            <Text style={styles.addBtnText}>
              {activeTab === 'SERVICES' ? '+ Service' : '+ Package'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading catalog items...</Text>
        </View>
      ) : activeTab === 'SERVICES' ? (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          renderItem={renderServiceCard}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎪</Text>
              <Text style={styles.emptyTitle}>No Services Added Yet</Text>
              <Text style={styles.emptySubtitle}>
                Add your celebration services with dynamic pricing to attract bookings.
              </Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={onAddService}>
                <Text style={styles.emptyAddBtnText}>+ Add First Service</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <FlatList
          data={packages}
          keyExtractor={(item) => item.id}
          renderItem={renderPackageCard}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>No Packages Created</Text>
              <Text style={styles.emptySubtitle}>
                Bundle your services together with discounted pricing for wedding combos.
              </Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={onAddPackage}>
                <Text style={styles.emptyAddBtnText}>+ Create First Package</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
    color: colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.primary,
  },
  tabItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabItemTextActive: {
    color: colors.primary,
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
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardInfo: {
    flex: 1,
    marginRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  eventBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  eventBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  servicesCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#DEF7EC',
  },
  statusInactive: {
    backgroundColor: '#FDE8E8',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#03543F',
  },
  statusTextInactive: {
    color: '#9B1C1C',
  },
  cardDesc: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 10,
    lineHeight: 18,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 10,
  },
  priceCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  originalPriceText: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  pricingTypeTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  discountBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#065F46',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  actionBtnSmall: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionBtnSmallText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B91C1C',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyAddBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default CatalogDashboardScreen;
