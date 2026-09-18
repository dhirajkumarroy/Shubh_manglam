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
import { openDialer, openWhatsApp } from '../../utils/contact';
import { InquiryModal } from '../../components/InquiryModal';
import RequestQuoteModal from '../quotes/RequestQuoteModal';
import { AppIcon } from '../../components/AppIcon';

export const VendorDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const vendorId = route.params?.vendorId;
  const latitude = route.params?.latitude;
  const longitude = route.params?.longitude;
  const eventId = route.params?.eventId;

  const [activeTab, setActiveTab] = useState<'services' | 'packages' | 'reviews' | 'about'>('services');
  const [inquiryModalVisible, setInquiryModalVisible] = useState<boolean>(false);
  const [quoteModalVisible, setQuoteModalVisible] = useState<boolean>(false);

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
          <AppIcon name="chevron-back" size={22} color="#1F2937" />
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
              <AppIcon name="business-outline" size={44} color="#881337" />
            </View>
          )}

          <View style={styles.heroBody}>
            <View style={styles.topInfoRow}>
              <View style={styles.nameBlock}>
                <Text style={styles.businessName}>{vendor.businessName}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <AppIcon name="location-outline" size={13} color="#D97706" />
                  <Text style={[styles.locationText, { marginLeft: 4 }]}>
                    {vendor.city}, {vendor.state}
                    {vendor.distanceKm !== null ? ` • ${vendor.distanceKm} km away` : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.ratingBadge}>
                <AppIcon name="star" size={13} color="#F59E0B" />
                <Text style={[styles.ratingText, { marginLeft: 3 }]}>
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
                    {c.name}
                  </Text>
                </View>
              ))}
            </View>

            {/* Quick Hero Contact Row */}
            <View style={styles.heroContactRow}>
              <TouchableOpacity
                style={styles.heroCallBtn}
                activeOpacity={0.8}
                onPress={() => openDialer(vendor.phone)}
              >
                <AppIcon name="call" size={13} color="#881337" />
                <Text style={[styles.heroCallBtnText, { marginLeft: 6 }]}>{vendor.phone}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.heroWhatsAppBtn}
                activeOpacity={0.8}
                onPress={() =>
                  openWhatsApp(
                    vendor.phone,
                    `Hello ${vendor.businessName}, I found your profile on Shubh Ausar and would like to inquire about your celebration services.`
                  )
                }
              >
                <AppIcon name="logo-whatsapp" size={13} color="#16A34A" />
                <Text style={[styles.heroWhatsAppBtnText, { marginLeft: 6 }]}>WhatsApp Chat</Text>
              </TouchableOpacity>
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
                <AppIcon name="star-outline" size={36} color="#D97706" />
                <Text style={styles.emptyTabTitle}>No Reviews Yet</Text>
                <Text style={styles.emptyTabSub}>Be the first to book and review this provider.</Text>
              </View>
            ) : (
              <View style={styles.reviewsList}>
                {vendor.reviews.map((r) => (
                  <View key={r.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewerName}>{r.customerName || 'Verified User'}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {Array.from({ length: Math.min(5, Math.max(1, r.rating || 5)) }).map((_, i) => (
                          <AppIcon key={i} name="star" size={13} color="#F59E0B" />
                        ))}
                      </View>
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
                {vendor.description || 'Verified celebration service provider on Shubh Ausar.'}
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
                <TouchableOpacity onPress={() => openDialer(vendor.phone)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.aboutVal, { color: '#881337', fontWeight: '700', marginRight: 4 }]}>
                    {vendor.phone}
                  </Text>
                  <AppIcon name="call" size={13} color="#881337" />
                </TouchableOpacity>
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

      {/* Sticky Bottom Contact & Inquiry Bar */}
      <View style={styles.bottomContactBar}>
        <TouchableOpacity
          style={[styles.stickyInquiryBtn, { backgroundColor: '#881337', flex: 1.4 }]}
          activeOpacity={0.85}
          onPress={() => setQuoteModalVisible(true)}
        >
          <AppIcon name="document-text-outline" size={16} color="#FFFFFF" />
          <Text style={[styles.stickyInquiryBtnText, { color: '#FFFFFF', marginLeft: 6 }]}>Request Quote</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.stickyInquiryBtn, { flex: 1, backgroundColor: '#FAF8F5', borderWidth: 1, borderColor: '#F3E8E2' }]}
          activeOpacity={0.85}
          onPress={() => setInquiryModalVisible(true)}
        >
          <Text style={[styles.stickyInquiryBtnText, { color: '#1F2937' }]}>Inquire</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.stickyCallBtn}
          activeOpacity={0.8}
          onPress={() => openDialer(vendor.phone)}
        >
          <AppIcon name="call-outline" size={18} color="#881337" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.stickyWhatsAppBtn}
          activeOpacity={0.8}
          onPress={() =>
            openWhatsApp(
              vendor.phone,
              `Hello ${vendor.businessName}, I found your profile on Shubh Ausar and would like to inquire about your celebration services.`
            )
          }
        >
          <AppIcon name="logo-whatsapp" size={18} color="#16A34A" />
        </TouchableOpacity>
      </View>

      {/* Formal Quote Modal */}
      <RequestQuoteModal
        visible={quoteModalVisible}
        onClose={() => setQuoteModalVisible(false)}
        vendorId={vendor.id}
        vendorName={vendor.businessName}
        onSuccess={(qId) => navigation.navigate('QuoteDetailsScreen', { quoteId: qId })}
      />

      {/* Inquiry Modal */}
      <InquiryModal
        visible={inquiryModalVisible}
        onClose={() => setInquiryModalVisible(false)}
        vendorId={vendor.id}
        vendorName={vendor.businessName}
        onSuccess={() => navigation.navigate('CustomerInquiriesScreen')}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
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
    paddingBottom: 90,
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
  heroContactRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  heroCallBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  heroCallBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  heroWhatsAppBtn: {
    flex: 1,
    backgroundColor: '#DCFCE7',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  heroWhatsAppBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  bottomContactBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  stickyInquiryBtn: {
    flex: 1.3,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  stickyInquiryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stickyCallBtn: {
    flex: 0.8,
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  stickyCallBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  stickyWhatsAppBtn: {
    flex: 1.2,
    flexDirection: 'row',
    backgroundColor: '#25D366',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  stickyWhatsAppBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default VendorDetailsScreen;
