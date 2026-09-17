import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import colors from '../../theme/colors';
import CatalogService, { Category, ServiceItem } from '../../api/catalog.service';

export const HomeScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { user, loading: authLoading } = useAppSelector((state) => state.auth);

  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = useCallback(async (categoryId?: string | null) => {
    try {
      setCatalogLoading(true);
      const [catList, svcData] = await Promise.all([
        CatalogService.getCategories(),
        CatalogService.getServices({
          categoryId: categoryId || undefined,
        }),
      ]);
      setCategories(catList || []);
      setServices(svcData.services || []);
    } catch (err) {
      console.error('Error fetching catalog in HomeScreen:', err);
    } finally {
      setCatalogLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(selectedCategoryId);
  }, [loadData, selectedCategoryId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(selectedCategoryId);
  };

  const handleSelectCategory = (catId: string | null) => {
    setSelectedCategoryId(catId);
  };

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const formatPrice = (svc: ServiceItem) => {
    if (svc.pricingType === 'CUSTOM_QUOTE') {
      return `₹${svc.minPrice?.toLocaleString() || 0} - ₹${svc.maxPrice?.toLocaleString() || 0}`;
    }
    const unitMap: Record<string, string> = {
      FIXED: '',
      PER_PERSON: '/ person',
      PER_UNIT: '/ item',
      PER_DAY: '/ day',
      PER_HOUR: '/ hr',
    };
    return `₹${svc.basePrice?.toLocaleString() || 0} ${unitMap[svc.pricingType] || ''}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Top Hero Banner */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.name}>{user?.name || 'Celebration Host'}</Text>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>CUSTOMER</Text>
            </View>
          </View>
          <Text style={styles.subtext}>
            Discover verified local vendors for your wedding, birthday, puja & family celebrations.
          </Text>

          {/* Account Status Pill */}
          <View style={styles.accountInfoPill}>
            <Text style={styles.accountInfoDot}>🟢</Text>
            <Text style={styles.accountInfoText}>
              {user?.email} • Verified Account
            </Text>
          </View>
        </View>

        {/* Dynamic Category Filter Bar (100% Database Driven) */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Browse Celebration Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategoryId === null && styles.categoryChipActive,
              ]}
              onPress={() => handleSelectCategory(null)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategoryId === null && styles.categoryChipTextActive,
                ]}
              >
                ✨ All Services
              </Text>
            </TouchableOpacity>

            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategoryId === cat.id && styles.categoryChipActive,
                ]}
                onPress={() => handleSelectCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategoryId === cat.id && styles.categoryChipTextActive,
                  ]}
                >
                  {cat.icon ? `${cat.icon} ` : '🎪 '}{cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Dynamic Marketplace Services Grid */}
        <View style={styles.servicesSection}>
          <View style={styles.servicesHeader}>
            <Text style={styles.sectionTitle}>Available Celebration Services</Text>
            <Text style={styles.countText}>{services.length} options</Text>
          </View>

          {catalogLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Fetching available services...</Text>
            </View>
          ) : services.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🎪</Text>
              <Text style={styles.emptyTitle}>No Services In This Category Yet</Text>
              <Text style={styles.emptyText}>
                Select another celebration category or pull down to refresh available vendor listings.
              </Text>
            </View>
          ) : (
            <View style={styles.serviceGrid}>
              {services.map((svc) => (
                <View key={svc.id} style={styles.serviceCard}>
                  {svc.primaryImage ? (
                    <Image
                      source={{ uri: svc.primaryImage }}
                      style={styles.serviceCover}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.serviceCoverPlaceholder}>
                      <Text style={styles.placeholderIcon}>
                        {svc.category?.icon || '🌸'}
                      </Text>
                    </View>
                  )}

                  <View style={styles.serviceCardBody}>
                    <View style={styles.catBadge}>
                      <Text style={styles.catBadgeText}>
                        {svc.category?.name || 'General'}
                      </Text>
                    </View>

                    <Text style={styles.serviceName} numberOfLines={1}>
                      {svc.name}
                    </Text>

                    {svc.vendor && (
                      <Text style={styles.vendorName} numberOfLines={1}>
                        🏢 {svc.vendor.businessName} • {svc.vendor.city}
                      </Text>
                    )}

                    <View style={styles.servicePricingRow}>
                      <Text style={styles.servicePrice}>{formatPrice(svc)}</Text>
                      <View style={styles.typeTag}>
                        <Text style={styles.typeTagText}>
                          {svc.pricingType.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Account Quick Settings */}
        <View style={styles.quickSettingsSection}>
          <TouchableOpacity
            style={styles.profileNavButton}
            onPress={() => navigation.navigate('ProfileTab')}
          >
            <Text style={styles.profileNavIcon}>👤</Text>
            <View style={styles.profileNavTextWrap}>
              <Text style={styles.profileNavTitle}>Account & Profile</Text>
              <Text style={styles.profileNavSub}>Manage profile details, security & settings</Text>
            </View>
            <Text style={styles.profileNavArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Logout Action */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={authLoading}
          >
            {authLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.logoutButtonText}>Log Out Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  roleBadgeText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  subtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 6,
    lineHeight: 18,
    fontWeight: '400',
  },
  accountInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 14,
  },
  accountInfoDot: {
    fontSize: 8,
    marginRight: 6,
  },
  accountInfoText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  categorySection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  categoryList: {
    gap: 8,
    paddingRight: 20,
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  servicesSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  servicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  countText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 13,
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  serviceGrid: {
    gap: 14,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  serviceCover: {
    width: '100%',
    height: 140,
    backgroundColor: '#E5E7EB',
  },
  serviceCoverPlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 36,
  },
  serviceCardBody: {
    padding: 14,
  },
  catBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  vendorName: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 10,
  },
  servicePricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
  },
  typeTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  quickSettingsSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  profileNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  profileNavIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  profileNavTextWrap: {
    flex: 1,
  },
  profileNavTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  profileNavSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  profileNavArrow: {
    fontSize: 20,
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default HomeScreen;
