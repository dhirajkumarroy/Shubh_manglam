import React, { useState } from 'react';
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
import { useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import colors from '../../theme/colors';
import {
  useEventTypes,
  useCustomerEvents,
  useMarketplaceVendors,
  useMarketplaceCategories,
  useMarketplaceServices,
  useMarketplacePackages,
} from '../../hooks/useEventPlanning';

export const HomeScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAppSelector((state) => state.auth);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // React Query hooks for 100% database-driven marketplace data
  const { data: eventTypes = [] } = useEventTypes();
  const { data: customerEvents = [] } = useCustomerEvents();
  const { data: categories = [] } = useMarketplaceCategories();
  const { data: vendorData } = useMarketplaceVendors({ limit: 6 });
  const { data: serviceData, isLoading: servicesLoading } = useMarketplaceServices({
    categoryId: selectedCategoryId || undefined,
    limit: 10,
  });
  const { data: packageData } = useMarketplacePackages({ limit: 4 });

  const vendors = vendorData?.vendors || [];
  const services = serviceData?.services || [];
  const packages = packageData?.packages || [];
  const activeEvent = customerEvents.length > 0 ? customerEvents[0] : null;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['event-types'] }),
      queryClient.invalidateQueries({ queryKey: ['customer-events'] }),
      queryClient.invalidateQueries({ queryKey: ['marketplace-categories'] }),
      queryClient.invalidateQueries({ queryKey: ['marketplace-vendors'] }),
      queryClient.invalidateQueries({ queryKey: ['marketplace-services'] }),
      queryClient.invalidateQueries({ queryKey: ['marketplace-packages'] }),
    ]);
    setRefreshing(false);
  };

  const formatPrice = (svc: any) => {
    if (svc.pricingType === 'CUSTOM_QUOTE') {
      return 'Request Custom Quote';
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
        {/* Top Header Banner */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.name}>{user?.name || 'Celebration Host'}</Text>
            </View>
            <TouchableOpacity
              style={styles.locationPill}
              onPress={() => navigation.navigate('LocationSelectionScreen')}
            >
              <Text style={styles.locationPillIcon}>📍</Text>
              <Text style={styles.locationPillText}>Select Venue</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtext}>
            Discover verified local decorators, caterers, DJs, photographers & party venues.
          </Text>
        </View>

        {/* 1. Plan Celebration Hero CTA */}
        <View style={styles.ctaHeroContainer}>
          <View style={styles.ctaHero}>
            <View style={styles.ctaHeroBody}>
              <Text style={styles.ctaHeroBadge}>PLAN YOUR CELEBRATION</Text>
              <Text style={styles.ctaHeroTitle}>Organizing a Wedding, Birthday or Puja?</Text>
              <Text style={styles.ctaHeroDesc}>
                Create an event, add your requirements & match with verified providers.
              </Text>
              <TouchableOpacity
                style={styles.ctaHeroBtn}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('EventTypesScreen')}
              >
                <Text style={styles.ctaHeroBtnText}>+ Plan Celebration Now</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.ctaHeroIllustration}>🎪</Text>
          </View>
        </View>

        {/* 2. Active Celebration Card (if exists) */}
        {activeEvent && (
          <View style={styles.activeEventSection}>
            <View style={styles.activeEventHeader}>
              <Text style={styles.sectionTitle}>Your Active Celebration</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('EventDetailsScreen', { eventId: activeEvent.id })}
              >
                <Text style={styles.seeAllText}>Manage Event →</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.activeEventCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('EventDetailsScreen', { eventId: activeEvent.id })}
            >
              <View style={styles.activeEventTop}>
                <View style={styles.activeEventTypePill}>
                  <Text style={styles.activeEventTypeIcon}>
                    {activeEvent.eventType?.icon || '🎉'}
                  </Text>
                  <Text style={styles.activeEventTypeName}>{activeEvent.eventType?.name}</Text>
                </View>
                <View style={styles.activeEventStatusBadge}>
                  <Text style={styles.activeEventStatusText}>{activeEvent.status}</Text>
                </View>
              </View>

              <Text style={styles.activeEventTitle}>{activeEvent.title}</Text>

              <View style={styles.activeEventMeta}>
                <Text style={styles.activeEventMetaText}>
                  📅 {new Date(activeEvent.eventDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
                <Text style={styles.activeEventMetaDot}>•</Text>
                <Text style={styles.activeEventMetaText}>📍 {activeEvent.city}</Text>
                {activeEvent.guestCount && (
                  <>
                    <Text style={styles.activeEventMetaDot}>•</Text>
                    <Text style={styles.activeEventMetaText}>👥 {activeEvent.guestCount} Guests</Text>
                  </>
                )}
              </View>

              <View style={styles.activeEventCtaRow}>
                <Text style={styles.activeEventCtaText}>
                  🔍 Find Vendors for this Event ({activeEvent._count?.requirements || 0} requirements)
                </Text>
                <Text style={styles.activeEventCtaArrow}>→</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* 3. Event Types Carousel ("What are you celebrating?") */}
        <View style={styles.eventTypesSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>What Are You Celebrating?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('EventTypesScreen')}>
              <Text style={styles.seeAllText}>See All →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventTypesList}>
            {eventTypes.map((et) => (
              <TouchableOpacity
                key={et.id}
                style={styles.eventTypeCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('CreateEventScreen', { selectedEventType: et })}
              >
                <View style={styles.eventTypeIconWrap}>
                  <Text style={styles.eventTypeEmoji}>{et.icon || '🎉'}</Text>
                </View>
                <Text style={styles.eventTypeCardTitle} numberOfLines={1}>
                  {et.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 4. Nearby Verified Providers */}
        {vendors.length > 0 && (
          <View style={styles.vendorsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Nearby Verified Providers</Text>
              <TouchableOpacity onPress={() => navigation.navigate('VendorDiscoveryScreen')}>
                <Text style={styles.seeAllText}>View All →</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vendorsScroll}>
              {vendors.map((vendor) => (
                <TouchableOpacity
                  key={vendor.id}
                  style={styles.vendorMiniCard}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('VendorDetailsScreen', { vendorId: vendor.id })}
                >
                  {vendor.coverImage ? (
                    <Image source={{ uri: vendor.coverImage }} style={styles.vendorMiniCover} resizeMode="cover" />
                  ) : (
                    <View style={styles.vendorMiniCoverPlaceholder}>
                      <Text style={styles.vendorMiniIcon}>🏢</Text>
                    </View>
                  )}

                  <View style={styles.vendorMiniBody}>
                    <View style={styles.vendorMiniTop}>
                      <Text style={styles.vendorMiniName} numberOfLines={1}>
                        {vendor.businessName}
                      </Text>
                      <View style={styles.vendorMiniRating}>
                        <Text style={styles.starText}>★</Text>
                        <Text style={styles.vendorMiniRatingNum}>
                          {vendor.ratingAverage ? Number(vendor.ratingAverage).toFixed(1) : 'New'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.vendorMiniCity}>📍 {vendor.city}</Text>

                    {vendor.distanceKm !== null && (
                      <View style={styles.vendorMiniDistance}>
                        <Text style={styles.vendorMiniDistanceText}>{vendor.distanceKm} km away</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 5. Celebration Categories Filter */}
        <View style={styles.categorySection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Browse Categories</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CategoryDiscoveryScreen')}>
              <Text style={styles.seeAllText}>All Categories →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
            <TouchableOpacity
              style={[styles.categoryChip, selectedCategoryId === null && styles.categoryChipActive]}
              onPress={() => setSelectedCategoryId(null)}
            >
              <Text style={[styles.categoryChipText, selectedCategoryId === null && styles.categoryChipTextActive]}>
                ✨ All Services
              </Text>
            </TouchableOpacity>

            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, selectedCategoryId === cat.id && styles.categoryChipActive]}
                onPress={() => setSelectedCategoryId(cat.id)}
              >
                <Text style={[styles.categoryChipText, selectedCategoryId === cat.id && styles.categoryChipTextActive]}>
                  {cat.icon ? `${cat.icon} ` : '🎪 '}{cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 6. Marketplace Services Grid */}
        <View style={styles.servicesSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Available Celebration Services</Text>
            <Text style={styles.countText}>{services.length} options</Text>
          </View>

          {servicesLoading ? (
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
                <TouchableOpacity
                  key={svc.id}
                  style={styles.serviceCard}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('ServiceDetailsScreen', { serviceId: svc.id })}
                >
                  {svc.primaryImage ? (
                    <Image source={{ uri: svc.primaryImage }} style={styles.serviceCover} resizeMode="cover" />
                  ) : (
                    <View style={styles.serviceCoverPlaceholder}>
                      <Text style={styles.placeholderIcon}>{svc.category?.icon || '🌸'}</Text>
                    </View>
                  )}

                  <View style={styles.serviceCardBody}>
                    <View style={styles.catBadge}>
                      <Text style={styles.catBadgeText}>{svc.category?.name || 'General'}</Text>
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
                        <Text style={styles.typeTagText}>{svc.pricingType.replace('_', ' ')}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 7. Celebration Packages Deals */}
        {packages.length > 0 && (
          <View style={styles.packagesSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Featured Celebration Packages</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.packagesScroll}>
              {packages.map((pkg) => (
                <TouchableOpacity
                  key={pkg.id}
                  style={styles.packageCard}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('PackageDetailsScreen', { packageId: pkg.id })}
                >
                  <View style={styles.packageTop}>
                    <View style={styles.pkgTag}>
                      <Text style={styles.pkgTagText}>PACKAGE</Text>
                    </View>
                    {pkg.discountPercent && (
                      <View style={styles.pkgDiscountTag}>
                        <Text style={styles.pkgDiscountTagText}>{Number(pkg.discountPercent)}% OFF</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.packageCardTitle} numberOfLines={1}>
                    {pkg.name}
                  </Text>
                  {pkg.vendor && (
                    <Text style={styles.packageVendorName}>by {pkg.vendor.businessName}</Text>
                  )}

                  <Text style={styles.packageIncludesText}>
                    Includes {pkg.services?.length || 0} celebration services
                  </Text>

                  <View style={styles.packageBottomRow}>
                    <Text style={styles.packageCardPrice}>₹{Number(pkg.price).toLocaleString()}</Text>
                    <Text style={styles.packageCardCta}>View →</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

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
            onPress={() => dispatch(logoutUser())}
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
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  locationPillIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  locationPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  subtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 6,
    lineHeight: 18,
    fontWeight: '400',
  },
  ctaHeroContainer: {
    marginTop: -16,
    paddingHorizontal: 20,
  },
  ctaHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaHeroBody: {
    flex: 1,
    marginRight: 10,
  },
  ctaHeroBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  ctaHeroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 22,
  },
  ctaHeroDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 16,
  },
  ctaHeroBtn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  ctaHeroBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  ctaHeroIllustration: {
    fontSize: 54,
  },
  activeEventSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  activeEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeEventCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  activeEventTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activeEventTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeEventTypeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  activeEventTypeName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  activeEventStatusBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeEventStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E40AF',
  },
  activeEventTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  activeEventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  activeEventMetaText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  activeEventMetaDot: {
    marginHorizontal: 6,
    fontSize: 10,
    color: '#93C5FD',
  },
  activeEventCtaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#DBEAFE',
  },
  activeEventCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  activeEventCtaArrow: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D4ED8',
  },
  eventTypesSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  eventTypesList: {
    gap: 12,
    paddingVertical: 2,
  },
  eventTypeCard: {
    width: 88,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  eventTypeIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventTypeEmoji: {
    fontSize: 22,
  },
  eventTypeCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  vendorsSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  vendorsScroll: {
    gap: 12,
    paddingVertical: 2,
  },
  vendorMiniCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  vendorMiniCover: {
    width: '100%',
    height: 90,
    backgroundColor: '#E5E7EB',
  },
  vendorMiniCoverPlaceholder: {
    width: '100%',
    height: 90,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorMiniIcon: {
    fontSize: 32,
  },
  vendorMiniBody: {
    padding: 10,
  },
  vendorMiniTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vendorMiniName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
    marginRight: 4,
  },
  vendorMiniRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starText: {
    fontSize: 11,
    color: '#D97706',
    marginRight: 2,
  },
  vendorMiniRatingNum: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  vendorMiniCity: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  vendorMiniDistance: {
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  vendorMiniDistanceText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  categorySection: {
    marginTop: 24,
    paddingHorizontal: 20,
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
  packagesSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  packagesScroll: {
    gap: 12,
    paddingVertical: 2,
  },
  packageCard: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  packageTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pkgTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pkgTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  pkgDiscountTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pkgDiscountTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  packageCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  packageVendorName: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  packageIncludesText: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 8,
  },
  packageBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  packageCardPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },
  packageCardCta: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
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
