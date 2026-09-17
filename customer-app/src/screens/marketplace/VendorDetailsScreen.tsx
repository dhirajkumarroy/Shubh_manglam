import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import colors from '../../theme/colors';
import { useVendorDetails } from '../../hooks/useEventPlanning';

export const VendorDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const vendorId = route.params?.vendorId;
  const latitude = route.params?.latitude;
  const longitude = route.params?.longitude;
  const eventId = route.params?.eventId;

  const [activeTab, setActiveTab] = useState<'services' | 'packages' | 'reviews' | 'about'>('services');

  const { data: vendor, isLoading, refetch } = useVendorDetails(
    vendorId,
    latitude && longitude ? { latitude, longitude } : undefined
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centerText}>Loading provider details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!vendor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyTitle}>Provider Not Available</Text>
          <Text style={styles.emptySub}>This vendor is currently not active or under moderation.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Back to Discovery</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formatServicePrice = (svc: any) => {
    if (svc.pricingType === 'CUSTOM_QUOTE') {
      return 'Request Custom Quote';
    }
    const unitMap: Record<string, string> = {
      FIXED: 'fixed',
      PER_PERSON: '/ person',
      PER_UNIT: '/ unit',
      PER_DAY: '/ day',
      PER_HOUR: '/ hr',
    };
    return `₹${svc.basePrice?.toLocaleString() || 0} ${unitMap[svc.pricingType] || ''}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {vendor.businessName}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cover & Profile Header */}
        <View style={styles.profileHero}>
          {vendor.coverImage ? (
            <Image source={{ uri: vendor.coverImage }} style={styles.coverImg} resizeMode="cover" />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.coverIcon}>🎪</Text>
            </View>
          )}

          <View style={styles.heroBody}>
            <View style={styles.topInfoRow}>
              <View style={styles.nameBlock}>
                <Text style={styles.businessName}>{vendor.businessName}</Text>
                <Text style={styles.locationText}>
                  📍 {vendor.city}, {vendor.state}
                  {vendor.distanceKm !== null ? ` • ${vendor.distanceKm} km away` : ''}
                </Text>
              </View>

              <View style={styles.ratingBadge}>
                <Text style={styles.ratingStar}>★</Text>
                <Text style={styles.ratingText}>
                  {vendor.ratingAverage ? Number(vendor.ratingAverage).toFixed(1) : 'New'}
                </Text>
                <Text style={styles.reviewCountText}>({vendor.ratingCount})</Text>
              </View>
            </View>

            {vendor.description && (
              <Text style={styles.descriptionText}>{vendor.description}</Text>
            )}

            {/* Categories */}
            <View style={styles.categoryPillsWrap}>
              {vendor.categories.map((c) => (
                <View key={c.id} style={styles.catPill}>
                  <Text style={styles.catPillText}>
                    {c.icon ? `${c.icon} ` : ''}
                    {c.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          {[
            { key: 'services', label: `Services (${vendor.services.length})` },
            { key: 'packages', label: `Packages (${vendor.packages.length})` },
            { key: 'reviews', label: `Reviews (${vendor.reviews.length})` },
            { key: 'about', label: 'About' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Text style={[styles.tabBtnText, activeTab === tab.key && styles.tabBtnTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab 1: Services */}
        {activeTab === 'services' && (
          <View style={styles.tabContent}>
            {vendor.services.length === 0 ? (
              <View style={styles.emptyTabBox}>
                <Text style={styles.emptyTabIcon}>📦</Text>
                <Text style={styles.emptyTabTitle}>No Public Services Listed</Text>
                <Text style={styles.emptyTabSub}>This provider has not added active catalog services yet.</Text>
              </View>
            ) : (
              <View style={styles.itemsGrid}>
                {vendor.services.map((svc) => (
                  <TouchableOpacity
                    key={svc.id}
                    style={styles.itemCard}
                    activeOpacity={0.8}
                    onPress={() =>
                      navigation.navigate('ServiceDetailsScreen', {
                        serviceId: svc.id,
                        vendor,
                        eventId,
                      })
                    }
                  >
                    {svc.primaryImage ? (
                      <Image source={{ uri: svc.primaryImage }} style={styles.itemThumb} resizeMode="cover" />
                    ) : (
                      <View style={styles.itemThumbPlaceholder}>
                        <Text style={styles.placeholderIcon}>{svc.category?.icon || '🌸'}</Text>
                      </View>
                    )}

                    <View style={styles.itemCardBody}>
                      <View style={styles.catBadge}>
                        <Text style={styles.catBadgeText}>{svc.category?.name || 'Service'}</Text>
                      </View>
                      <Text style={styles.itemCardTitle} numberOfLines={1}>
                        {svc.name}
                      </Text>
                      {svc.description && (
                        <Text style={styles.itemCardDesc} numberOfLines={2}>
                          {svc.description}
                        </Text>
                      )}
                      <View style={styles.priceRow}>
                        <Text style={styles.priceText}>{formatServicePrice(svc)}</Text>
                        <Text style={styles.viewDetailsText}>View Details →</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Tab 2: Packages */}
        {activeTab === 'packages' && (
          <View style={styles.tabContent}>
            {vendor.packages.length === 0 ? (
              <View style={styles.emptyTabBox}>
                <Text style={styles.emptyTabIcon}>🎁</Text>
                <Text style={styles.emptyTabTitle}>No Packages Listed</Text>
                <Text style={styles.emptyTabSub}>This provider has not created service bundles yet.</Text>
              </View>
            ) : (
              <View style={styles.itemsGrid}>
                {vendor.packages.map((pkg) => (
                  <TouchableOpacity
                    key={pkg.id}
                    style={styles.pkgCard}
                    activeOpacity={0.8}
                    onPress={() =>
                      navigation.navigate('PackageDetailsScreen', {
                        packageId: pkg.id,
                        vendor,
                        eventId,
                      })
                    }
                  >
                    <View style={styles.pkgTop}>
                      <View style={styles.pkgBadge}>
                        <Text style={styles.pkgBadgeText}>PACKAGE DEAL</Text>
                      </View>
                      {pkg.discountPercent && (
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountBadgeText}>{Number(pkg.discountPercent)}% OFF</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.pkgTitle}>{pkg.name}</Text>
                    {pkg.description && (
                      <Text style={styles.pkgDesc} numberOfLines={2}>
                        {pkg.description}
                      </Text>
                    )}

                    <View style={styles.pkgServicesBox}>
                      <Text style={styles.pkgServicesTitle}>Includes {pkg.services.length} services:</Text>
                      {pkg.services.map((ps) => (
                        <Text key={ps.id} style={styles.pkgServiceItem}>
                          • {ps.service.name} ({ps.quantity}x)
                        </Text>
                      ))}
                    </View>

                    <View style={styles.pkgPriceRow}>
                      <View>
                        <Text style={styles.pkgPrice}>₹{Number(pkg.price).toLocaleString()}</Text>
                        {pkg.originalPrice && (
                          <Text style={styles.pkgOriginalPrice}>
                            ₹{Number(pkg.originalPrice).toLocaleString()}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.viewDetailsText}>View Package →</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Tab 3: Reviews */}
        {activeTab === 'reviews' && (
          <View style={styles.tabContent}>
            {vendor.reviews.length === 0 ? (
              <View style={styles.emptyTabBox}>
                <Text style={styles.emptyTabIcon}>⭐</Text>
                <Text style={styles.emptyTabTitle}>No Reviews Yet</Text>
                <Text style={styles.emptyTabSub}>Be the first customer to book and review this provider.</Text>
              </View>
            ) : (
              <View style={styles.reviewsList}>
                {vendor.reviews.map((r) => (
                  <View key={r.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewerName}>{r.customerName}</Text>
                      <Text style={styles.reviewStars}>{'⭐'.repeat(r.rating)}</Text>
                    </View>
                    {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
                    <Text style={styles.reviewDate}>
                      {new Date(r.createdAt).toLocaleDateString('en-IN')}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Tab 4: About */}
        {activeTab === 'about' && (
          <View style={styles.tabContent}>
            <View style={styles.aboutCard}>
              <Text style={styles.aboutTitle}>Business Information</Text>
              <Text style={styles.aboutDesc}>
                {vendor.description || 'Verified celebration service provider on Shubh Mangalam.'}
              </Text>

              <View style={styles.aboutDivider} />

              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Operating Area:</Text>
                <Text style={styles.aboutVal}>{vendor.operatingRadiusKm} km radius from {vendor.city}</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Location:</Text>
                <Text style={styles.aboutVal}>
                  {vendor.addressLine1 ? `${vendor.addressLine1}, ` : ''}
                  {vendor.city}, {vendor.state} — {vendor.pincode}
                </Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Contact Phone:</Text>
                <Text style={styles.aboutVal}>{vendor.phone}</Text>
              </View>
              {vendor.email && (
                <View style={styles.aboutRow}>
                  <Text style={styles.aboutLabel}>Email:</Text>
                  <Text style={styles.aboutVal}>{vendor.email}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  emptySub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHero: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  coverImg: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
  },
  coverPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverIcon: {
    fontSize: 48,
  },
  heroBody: {
    padding: 20,
  },
  topInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameBlock: {
    flex: 1,
    marginRight: 10,
  },
  businessName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  ratingStar: {
    fontSize: 14,
    color: '#D97706',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B45309',
  },
  reviewCountText: {
    fontSize: 11,
    color: '#92400E',
    marginLeft: 3,
  },
  descriptionText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
    marginBottom: 12,
  },
  categoryPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 14,
  },
  tabBtn: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabBtnTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  tabContent: {
    padding: 20,
  },
  emptyTabBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyTabIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTabTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  emptyTabSub: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  itemsGrid: {
    gap: 14,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  itemThumb: {
    width: 100,
    height: 110,
    backgroundColor: '#E5E7EB',
  },
  itemThumbPlaceholder: {
    width: 100,
    height: 110,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
  },
  itemCardBody: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  catBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  itemCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  itemCardDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 15,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
  },
  pkgCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pkgTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pkgBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pkgBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  discountBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  pkgTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  pkgDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 10,
  },
  pkgServicesBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  pkgServicesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  pkgServiceItem: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 4,
  },
  pkgPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  pkgPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  pkgOriginalPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  reviewStars: {
    fontSize: 12,
  },
  reviewComment: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
  },
  reviewDate: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 6,
  },
  aboutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  aboutDesc: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
  },
  aboutDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  aboutLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  aboutVal: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'right',
  },
});

export default VendorDetailsScreen;
