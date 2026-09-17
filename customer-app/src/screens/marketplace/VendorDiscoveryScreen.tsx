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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import colors from '../../theme/colors';
import {
  useMarketplaceVendors,
  useMarketplaceCategories,
} from '../../hooks/useEventPlanning';

export const VendorDiscoveryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const initialCategoryId = route.params?.categoryId;
  const initialCategoryName = route.params?.categoryName;
  const city = route.params?.city;
  const latitude = route.params?.latitude;
  const longitude = route.params?.longitude;
  const eventTypeId = route.params?.eventTypeId;
  const eventId = route.params?.eventId;

  const [search, setSearch] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string | undefined>(initialCategoryId);
  const [sort, setSort] = useState<'nearest' | 'rating' | 'newest'>('nearest');

  const { data: categories = [] } = useMarketplaceCategories();
  const {
    data: vendorData,
    isLoading,
    isRefetching,
    refetch,
  } = useMarketplaceVendors({
    categoryId: selectedCatId,
    eventType: eventTypeId,
    city,
    latitude,
    longitude,
    search: search.trim() || undefined,
    sort,
  });

  const vendors = vendorData?.vendors || [];

  const handleOpenVendor = (vendor: any) => {
    navigation.navigate('VendorDetailsScreen', {
      vendorId: vendor.id,
      vendorName: vendor.businessName,
      latitude,
      longitude,
      eventId,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>Verified Providers</Text>
          <Text style={styles.subTitle}>
            {city ? `Near ${city}` : 'Marketplace Providers'}
            {initialCategoryName ? ` • ${initialCategoryName}` : ''}
          </Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search provider by name, city, service..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sort Chips */}
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          {[
            { key: 'nearest', label: '📍 Nearest' },
            { key: 'rating', label: '⭐ Top Rated' },
            { key: 'newest', label: '✨ Newest' },
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
            onPress={() => setSelectedCatId(undefined)}
          >
            <Text style={[styles.catChipText, selectedCatId === undefined && styles.catChipTextActive]}>
              All Categories
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catChip, selectedCatId === cat.id && styles.catChipActive]}
              onPress={() => setSelectedCatId(selectedCatId === cat.id ? undefined : cat.id)}
            >
              <Text style={[styles.catChipText, selectedCatId === cat.id && styles.catChipTextActive]}>
                {cat.icon ? `${cat.icon} ` : ''}
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
          <TouchableOpacity style={styles.resetBtn} onPress={() => { setSelectedCatId(undefined); setSearch(''); }}>
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
                    <Text style={styles.coverPlaceholderIcon}>🌸</Text>
                  </View>
                )}

                <View style={styles.cardBody}>
                  <View style={styles.titleRow}>
                    <Text style={styles.businessName} numberOfLines={1}>
                      {vendor.businessName}
                    </Text>
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingStar}>★</Text>
                      <Text style={styles.ratingText}>
                        {vendor.ratingAverage ? Number(vendor.ratingAverage).toFixed(1) : 'New'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.locationRow}>
                    <Text style={styles.locationText}>
                      📍 {vendor.city}, {vendor.state}
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
                          {c.icon ? `${c.icon} ` : ''}
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
});

export default VendorDiscoveryScreen;
