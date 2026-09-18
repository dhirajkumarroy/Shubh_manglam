import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import colors from '../../theme/colors';
import { usePackageDetails } from '../../hooks/useEventPlanning';
import RequestQuoteModal from '../quotes/RequestQuoteModal';
import { AppIcon } from '../../components/AppIcon';

export const PackageDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [quoteModalVisible, setQuoteModalVisible] = React.useState(false);
  const packageId = route.params?.packageId;
  const eventId = route.params?.eventId;

  const { data: pkg, isLoading, error } = usePackageDetails(packageId);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centerText}>Loading package details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !pkg) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyTitle}>Package Not Found</Text>
          <Text style={styles.emptySub}>This celebration package is no longer available.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleAction = () => {
    Alert.alert(
      'Package Inquired',
      `You selected "${pkg.name}" by ${pkg.vendor?.businessName}. Complete checkout & booking will be available in the upcoming booking phase.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <AppIcon name="chevron-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {pkg.name}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.banner}>
          <AppIcon name="gift-outline" size={32} color="#881337" />
          <View style={styles.bannerBadges}>
            <View style={styles.dealBadge}>
              <Text style={styles.dealBadgeText}>CELEBRATION BUNDLE</Text>
            </View>
            {pkg.discountPercent && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>{Number(pkg.discountPercent)}% DISCOUNT</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.body}>
          {/* Title */}
          <Text style={styles.pkgTitle}>{pkg.name}</Text>

          {/* Pricing Row */}
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>₹{Number(pkg.price).toLocaleString()}</Text>
            {pkg.originalPrice && (
              <Text style={styles.originalPrice}>₹{Number(pkg.originalPrice).toLocaleString()}</Text>
            )}
            {pkg.discountPercent && (
              <Text style={styles.savingsText}>Save {Number(pkg.discountPercent)}%</Text>
            )}
          </View>

          {/* Description */}
          {pkg.description && (
            <View style={styles.descBox}>
              <Text style={styles.descTitle}>About this Package</Text>
              <Text style={styles.descText}>{pkg.description}</Text>
            </View>
          )}

          {/* Included Services Checklist */}
          <View style={styles.servicesSection}>
            <Text style={styles.sectionHeading}>Included Services ({pkg.services.length})</Text>
            <Text style={styles.sectionSub}>All these services are bundled by this provider:</Text>

            <View style={styles.servicesList}>
              {pkg.services.map((ps) => (
                <View key={ps.id} style={styles.serviceItemRow}>
                  <View style={styles.serviceItemIconBox}>
                    <Text style={styles.serviceItemIcon}>{ps.service.category?.icon || '🎪'}</Text>
                  </View>
                  <View style={styles.serviceItemBody}>
                    <Text style={styles.serviceItemName}>{ps.service.name}</Text>
                    <Text style={styles.serviceItemCategory}>
                      {ps.service.category?.name || 'Service'}
                    </Text>
                  </View>
                  <View style={styles.qtyBadge}>
                    <Text style={styles.qtyBadgeText}>Qty: {ps.quantity}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Vendor Card */}
          {pkg.vendor && (
            <View style={styles.vendorCard}>
              <Text style={styles.vendorCardHeading}>OFFERED BY</Text>
              <View style={styles.vendorCardBody}>
                <View style={styles.vendorInfo}>
                  <Text style={styles.vendorName}>{pkg.vendor.businessName}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <AppIcon name="location-outline" size={12} color="#D97706" />
                    <Text style={[styles.vendorLocation, { marginLeft: 4 }]}>
                      {pkg.vendor.city}, {pkg.vendor.state}
                    </Text>
                  </View>
                  <View style={styles.vendorRatingRow}>
                    <AppIcon name="star" size={12} color="#F59E0B" />
                    <Text style={[styles.ratingNum, { marginLeft: 3 }]}>
                      {pkg.vendor.ratingAverage ? Number(pkg.vendor.ratingAverage).toFixed(1) : 'New'}
                    </Text>
                    <Text style={styles.ratingCount}>({pkg.vendor.ratingCount} reviews)</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.viewVendorBtn}
                  onPress={() =>
                    navigation.navigate('VendorDetailsScreen', {
                      vendorId: pkg.vendor!.id,
                      eventId,
                    })
                  }
                >
                  <Text style={styles.viewVendorBtnText}>View Provider</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceWrap}>
          <Text style={styles.bottomLabel}>Package Total</Text>
          <Text style={styles.bottomPrice}>₹{Number(pkg.price).toLocaleString()}</Text>
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#881337', flexDirection: 'row', alignItems: 'center' }]}
          onPress={() => setQuoteModalVisible(true)}
        >
          <AppIcon name="document-text-outline" size={16} color="#FFFFFF" />
          <Text style={[styles.actionBtnText, { marginLeft: 6 }]}>Request Quote</Text>
        </TouchableOpacity>
      </View>

      {/* Formal Quote Modal */}
      {pkg.vendor && (
        <RequestQuoteModal
          visible={quoteModalVisible}
          onClose={() => setQuoteModalVisible(false)}
          vendorId={pkg.vendor.id}
          vendorName={pkg.vendor.businessName}
          onSuccess={(qId) => navigation.navigate('QuoteDetailsScreen', { quoteId: qId })}
        />
      )}
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
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  banner: {
    backgroundColor: '#FEF3C7',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bannerIcon: {
    fontSize: 54,
  },
  bannerBadges: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    gap: 8,
  },
  dealBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dealBadgeText: {
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
  body: {
    padding: 20,
  },
  pkgTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.primary,
    marginRight: 10,
  },
  originalPrice: {
    fontSize: 15,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  descBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  descTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  descText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
  },
  servicesSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  sectionSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 12,
  },
  servicesList: {
    gap: 10,
  },
  serviceItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
  },
  serviceItemIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  serviceItemIcon: {
    fontSize: 18,
  },
  serviceItemBody: {
    flex: 1,
  },
  serviceItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  serviceItemCategory: {
    fontSize: 11,
    color: '#6B7280',
  },
  qtyBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  qtyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  vendorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  vendorCardHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  vendorCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vendorInfo: {
    flex: 1,
    marginRight: 10,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  vendorLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  vendorRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingStar: {
    fontSize: 12,
    color: '#D97706',
    marginRight: 3,
  },
  ratingNum: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  ratingCount: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  viewVendorBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewVendorBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomPriceWrap: {
    flex: 1,
  },
  bottomLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  bottomPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});

export default PackageDetailsScreen;
