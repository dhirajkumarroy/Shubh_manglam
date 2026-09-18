import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import colors from '../../theme/colors';
import {
  useMarketplaceVendors,
  useMarketplaceCategories,
} from '../../hooks/useEventPlanning';
import { openDialer, openWhatsApp } from '../../utils/contact';
import { AppIcon } from '../../components/AppIcon';

export const VendorDiscoveryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const initialCategoryId = route.params?.categoryId;
  const initialCategoryName = route.params?.categoryName;
  const initialSubcategoryId = route.params?.subcategoryId;
  const initialSubcategoryName = route.params?.subcategoryName;
  const city = route.params?.city;
  const latitude = route.params?.latitude;
  const longitude = route.params?.longitude;
  const eventTypeId = route.params?.eventTypeId;
  const eventId = route.params?.eventId;

  const [search, setSearch] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string | undefined>(initialCategoryId);
  const [selectedSubcatId, setSelectedSubcatId] = useState<string | undefined>(initialSubcategoryId);
  const [sort, setSort] = useState<'nearest' | 'rating' | 'newest'>('nearest');

  const [activeCity, setActiveCity] = useState<string | undefined>(city);
  const [activeLatitude, setActiveLatitude] = useState<number | undefined>(latitude);
  const [activeLongitude, setActiveLongitude] = useState<number | undefined>(longitude);
  const [detectingGps, setDetectingGps] = useState(false);

  const handleDetectGps = async () => {
    try {
      setDetectingGps(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Please allow location permission to discover celebration providers near you.'
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude;
      const lon = loc.coords.longitude;
      setActiveLatitude(lat);
      setActiveLongitude(lon);
      setSort('nearest');

      const reverse = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      const detectedCity = reverse[0]?.city || reverse[0]?.district || 'Near You';
      setActiveCity(detectedCity);
    } catch (err) {
      console.error('GPS detection error:', err);
      Alert.alert('GPS Error', 'Failed to detect current location.');
    } finally {
      setDetectingGps(false);
    }
  };

  const { data: categories = [] } = useMarketplaceCategories();
  const currentCategory = categories.find((c) => c.id === selectedCatId);

  const {
    data: vendorData,
    isLoading,
    isRefetching,
    refetch,
  } = useMarketplaceVendors({
    categoryId: selectedCatId,
    subcategoryId: selectedSubcatId,
    eventType: eventTypeId,
    city: activeCity,
    latitude: activeLatitude,
    longitude: activeLongitude,
    search: search.trim() || undefined,
    sort,
  });

  const vendors = vendorData?.vendors || [];

  const handleOpenVendor = (vendor: any) => {
    navigation.navigate('VendorDetailsScreen', {
      vendorId: vendor.id,
      vendorName: vendor.businessName,
      latitude: activeLatitude,
      longitude: activeLongitude,
      eventId,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <AppIcon name="chevron-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>Verified Providers</Text>
          <Text style={styles.subTitle}>
            {activeCity ? `Near ${activeCity}` : 'Marketplace Providers'}
            {initialCategoryName ? ` • ${initialCategoryName}` : ''}
          </Text>
        </View>
      </View>

      {/* Search & Location Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <AppIcon name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            style={[styles.searchInput, { marginLeft: 8 }]}
            placeholder="Search provider by name, city, service..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <AppIcon name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick GPS Location Bar */}
        <View style={styles.locationBar}>
          <TouchableOpacity
            style={[styles.gpsBtn, activeLatitude ? styles.gpsBtnActive : null]}
            activeOpacity={0.8}
            onPress={handleDetectGps}
            disabled={detectingGps}
          >
            {detectingGps ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <AppIcon name="navigate-outline" size={14} color={activeLatitude ? '#FFFFFF' : '#881337'} />
            )}
            <Text style={[styles.gpsBtnText, activeLatitude ? styles.gpsBtnTextActive : null, { marginLeft: 6 }]}>
              {detectingGps
                ? 'Detecting Location...'
                : activeCity
                ? `Near ${activeCity} (GPS Active)`
                : 'Detect Nearby Providers (GPS)'}
            </Text>
          </TouchableOpacity>

          {activeLatitude && (
            <TouchableOpacity
              style={styles.clearGpsBtn}
              onPress={() => {
                setActiveLatitude(undefined);
                setActiveLongitude(undefined);
                setActiveCity(undefined);
              }}
            >
              <Text style={styles.clearGpsText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sort Chips */}
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          {[
            { key: 'nearest', label: 'Nearest' },
            { key: 'rating', label: 'Top Rated' },
            { key: 'newest', label: 'Newest' },
          ].map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.sortChip, sort === s.key && styles.sortChipActive]}
              onPress={() => setSort(s.key as any)}
            >
              <Text style={[styles.sortChipText, sort === s.key && styles.sortChipTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dynamic Category Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catChipsScroll}>
          <TouchableOpacity
            style={[styles.catChip, selectedCatId === undefined && styles.catChipActive]}
            onPress={() => {
              setSelectedCatId(undefined);
              setSelectedSubcatId(undefined);
            }}
          >
            <Text style={[styles.catChipText, selectedCatId === undefined && styles.catChipTextActive]}>
              All Categories
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catChip, selectedCatId === cat.id && styles.catChipActive]}
              onPress={() => {
                if (selectedCatId === cat.id) {
                  setSelectedCatId(undefined);
                  setSelectedSubcatId(undefined);
                } else {
                  setSelectedCatId(cat.id);
                  setSelectedSubcatId(undefined);
                }
              }}
            >
              <Text style={[styles.catChipText, selectedCatId === cat.id && styles.catChipTextActive]}>
                {cat.icon ? `${cat.icon} ` : ''}
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Dynamic Subcategory Chips if active category has subcategories */}
        {currentCategory?.subcategories && currentCategory.subcategories.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subcatChipsScroll}>
            <TouchableOpacity
              style={[styles.subcatChip, selectedSubcatId === undefined && styles.subcatChipActive]}
              onPress={() => setSelectedSubcatId(undefined)}
            >
              <Text style={[styles.subcatChipText, selectedSubcatId === undefined && styles.subcatChipTextActive]}>
                All {currentCategory.name}
              </Text>
            </TouchableOpacity>
            {currentCategory.subcategories.map((sub: any) => (
              <TouchableOpacity
                key={sub.id}
                style={[styles.subcatChip, selectedSubcatId === sub.id && styles.subcatChipActive]}
                onPress={() => setSelectedSubcatId(selectedSubcatId === sub.id ? undefined : sub.id)}
              >
                <Text style={[styles.subcatChipText, selectedSubcatId === sub.id && styles.subcatChipTextActive]}>
                  {sub.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Vendors List */}
      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centerText}>Finding local providers...</Text>
        </View>
      ) : vendors.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyIcon}>🏢</Text>
          <Text style={styles.emptyTitle}>No Providers Found</Text>
          <Text style={styles.emptySub}>
            Try clearing filters, selecting another category, or broadening your search location.
          </Text>
          <TouchableOpacity style={styles.resetBtn} onPress={() => { setSelectedCatId(undefined); setSelectedSubcatId(undefined); setSearch(''); }}>
            <Text style={styles.resetBtnText}>Clear All Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
        >
          <View style={styles.countBanner}>
            <Text style={styles.countBannerText}>
              Found {vendors.length} verified celebration provider{vendors.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.vendorGrid}>
            {vendors.map((vendor) => (
              <TouchableOpacity
                key={vendor.id}
                style={styles.vendorCard}
                activeOpacity={0.8}
                onPress={() => handleOpenVendor(vendor)}
              >
                {/* Cover / Placeholder */}
                {vendor.coverImage ? (
                  <Image source={{ uri: vendor.coverImage }} style={styles.coverImage} resizeMode="cover" />
                ) : (
                  <View style={styles.coverPlaceholder}>
                    <AppIcon name="business-outline" size={28} color="#881337" />
                  </View>
                )}

                <View style={styles.cardBody}>
                  <View style={styles.titleRow}>
                    <Text style={styles.businessName} numberOfLines={1}>
                      {vendor.businessName}
                    </Text>
                    <View style={styles.ratingBadge}>
                      <AppIcon name="star" size={11} color="#F59E0B" />
                      <Text style={[styles.ratingText, { marginLeft: 3 }]}>
                        {vendor.ratingAverage ? Number(vendor.ratingAverage).toFixed(1) : 'New'}
                      </Text>
                    </View>
                  </View>

                  {vendor.partnerAccountId && (
                    <View style={styles.partnerIdTagWrap}>
                      <Text style={styles.partnerIdTagText}>ID: {vendor.partnerAccountId}</Text>
                    </View>
                  )}

                  <View style={styles.locationRow}>
                    <AppIcon name="location-outline" size={12} color="#D97706" />
                    <Text style={[styles.locationText, { marginLeft: 4 }]}>
                      {vendor.city}, {vendor.state}
                    </Text>
                    {vendor.distanceKm !== null && (
                      <View style={styles.distanceBadge}>
                        <Text style={styles.distanceBadgeText}>{vendor.distanceKm} km away</Text>
                      </View>
                    )}
                  </View>

                  {vendor.description && (
                    <Text style={styles.vendorDesc} numberOfLines={2}>
                      {vendor.description}
                    </Text>
                  )}

                  {/* Category Pills */}
                  <View style={styles.categoriesRow}>
                    {vendor.categories.slice(0, 3).map((c) => (
                      <View key={c.id} style={styles.categoryPill}>
                        <Text style={styles.categoryPillText}>
                          {c.name}
                        </Text>
                      </View>
                    ))}
                    {vendor.categories.length > 3 && (
                      <View style={styles.categoryPillMore}>
                        <Text style={styles.categoryPillMoreText}>+{vendor.categories.length - 3}</Text>
                      </View>
                    )}
                  </View>

                  {/* Vendor Direct Contact Actions */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={[styles.cardCallBtn, { flexDirection: 'row', alignItems: 'center' }]}
                      activeOpacity={0.8}
                      onPress={(e) => {
                        e.stopPropagation();
                        openDialer(vendor.phone);
                      }}
                    >
                      <AppIcon name="call" size={12} color="#881337" />
                      <Text style={[styles.cardCallBtnText, { marginLeft: 4 }]}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.cardWhatsAppBtn, { flexDirection: 'row', alignItems: 'center' }]}
                      activeOpacity={0.8}
                      onPress={(e) => {
                        e.stopPropagation();
                        openWhatsApp(
                          vendor.phone,
                          `Hello ${vendor.businessName}, I found your profile on Shubh Ausar and would like to inquire about your celebration services.`
                        );
                      }}
                    >
                      <AppIcon name="logo-whatsapp" size={12} color="#16A34A" />
                      <Text style={[styles.cardWhatsAppBtnText, { marginLeft: 4 }]}>WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
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
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 10,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
  },
  clearIcon: {
    fontSize: 14,
    color: '#9CA3AF',
    padding: 4,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sortLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  sortChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  sortChipActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  sortChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  sortChipTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  catChipsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  catChip: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },
  subcatChipsScroll: {
    gap: 6,
    paddingVertical: 4,
    marginTop: 4,
  },
  subcatChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subcatChipActive: {
    backgroundColor: '#374151',
    borderColor: '#374151',
  },
  subcatChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  subcatChipTextActive: {
    color: '#FFFFFF',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  centerText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  emptySub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  resetBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  countBanner: {
    marginBottom: 12,
  },
  countBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  vendorGrid: {
    gap: 16,
  },
  vendorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  coverImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#E5E7EB',
  },
  coverPlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholderIcon: {
    fontSize: 36,
  },
  cardBody: {
    padding: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingStar: {
    fontSize: 12,
    color: '#D97706',
    marginRight: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  distanceBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  distanceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  vendorDesc: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
    marginBottom: 10,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  categoryPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  categoryPillMore: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryPillMoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  gpsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  gpsBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  gpsBtnIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  gpsBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  gpsBtnTextActive: {
    color: '#065F46',
    fontWeight: '700',
  },
  clearGpsBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  clearGpsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cardCallBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardCallBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  cardWhatsAppBtn: {
    flex: 1,
    backgroundColor: '#DCFCE7',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  cardWhatsAppBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  partnerIdTagWrap: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  partnerIdTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C2410C',
    letterSpacing: 0.5,
  },
});

export default VendorDiscoveryScreen;
