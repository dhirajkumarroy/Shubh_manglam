import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import colors from '../../theme/colors';
import { useServiceDetails } from '../../hooks/useEventPlanning';

export const ServiceDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const serviceId = route.params?.serviceId;
  const eventId = route.params?.eventId;

  const { data: service, isLoading, error } = useServiceDetails(serviceId);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centerText}>Loading service details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !service) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyTitle}>Service Not Found</Text>
          <Text style={styles.emptySub}>This service is no longer available in the catalog.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderPricing = () => {
    if (service.pricingType === 'CUSTOM_QUOTE') {
      return (
        <View style={styles.quotePricingBox}>
          <Text style={styles.quoteTitle}>Request Custom Quote</Text>
          <Text style={styles.quoteSub}>
            Pricing tailored to your guest count, venue size & custom preferences.
          </Text>
        </View>
      );
    }

    const unitMap: Record<string, string> = {
      FIXED: 'Flat Fixed Rate',
      PER_PERSON: 'per guest / plate',
      PER_UNIT: 'per item / setup',
      PER_DAY: 'per 24-hour day',
      PER_HOUR: 'per hour',
    };

    return (
      <View style={styles.standardPricingBox}>
        <Text style={styles.mainPrice}>₹{service.basePrice?.toLocaleString()}</Text>
        <Text style={styles.priceUnit}>{unitMap[service.pricingType] || service.pricingType}</Text>
      </View>
    );
  };

  const handleAction = () => {
    Alert.alert(
      'Service Inquired',
      `You selected "${service.name}" by ${service.vendor?.businessName}. Full quotation negotiations and online booking checkout will activate in Phase 7.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {service.name}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Images Gallery */}
        {service.images && service.images.length > 0 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.imageGallery}>
            {service.images.map((img: any) => (
              <Image key={img.id} source={{ uri: img.url }} style={styles.galleryImage} resizeMode="cover" />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.coverPlaceholder}>
            <Text style={styles.coverIcon}>{service.category?.icon || '🌸'}</Text>
          </View>
        )}

        <View style={styles.body}>
          {/* Category Pill */}
          <View style={styles.catPill}>
            <Text style={styles.catPillText}>
              {service.category?.icon ? `${service.category.icon} ` : ''}
              {service.category?.name || 'Celebration Service'}
            </Text>
          </View>

          {/* Service Title */}
          <Text style={styles.serviceTitle}>{service.name}</Text>

          {/* Pricing Block */}
          <View style={styles.pricingSection}>{renderPricing()}</View>

          {/* Service Meta Specs */}
          <View style={styles.specsGrid}>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>PRICING MODEL</Text>
              <Text style={styles.specVal}>{service.pricingType.replace('_', ' ')}</Text>
            </View>
            {service.durationMinutes && (
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>DURATION</Text>
                <Text style={styles.specVal}>{service.durationMinutes} mins</Text>
              </View>
            )}
            {service.minQuantity && (
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>MIN QUANTITY</Text>
                <Text style={styles.specVal}>{service.minQuantity} units</Text>
              </View>
            )}
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>AVAILABILITY</Text>
              <Text style={[styles.specVal, { color: '#059669' }]}>
                {service.isAvailable ? '✓ Available for Booking' : 'Temporarily Unavailable'}
              </Text>
            </View>
          </View>

          {/* Description */}
          {service.description && (
            <View style={styles.descBox}>
              <Text style={styles.descTitle}>Service Description</Text>
              <Text style={styles.descText}>{service.description}</Text>
            </View>
          )}

          {/* Vendor Card */}
          {service.vendor && (
            <View style={styles.vendorCard}>
              <Text style={styles.vendorCardHeading}>OFFERED BY</Text>
              <View style={styles.vendorCardBody}>
                <View style={styles.vendorInfo}>
                  <Text style={styles.vendorName}>{service.vendor.businessName}</Text>
                  <Text style={styles.vendorLocation}>
                    📍 {service.vendor.city}, {service.vendor.state}
                  </Text>
                  <View style={styles.vendorRatingRow}>
                    <Text style={styles.ratingStar}>★</Text>
                    <Text style={styles.ratingNum}>
                      {service.vendor.ratingAverage ? Number(service.vendor.ratingAverage).toFixed(1) : 'New'}
                    </Text>
                    <Text style={styles.ratingCount}>({service.vendor.ratingCount} reviews)</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.viewVendorBtn}
                  onPress={() =>
                    navigation.navigate('VendorDetailsScreen', {
                      vendorId: service.vendor!.id,
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
          <Text style={styles.bottomLabel}>Service Rate</Text>
          <Text style={styles.bottomPrice}>
            {service.pricingType === 'CUSTOM_QUOTE'
              ? 'Quote Required'
              : `₹${service.basePrice?.toLocaleString() || 0}`}
          </Text>
        </View>

        <TouchableOpacity style={styles.actionBtn} onPress={handleAction}>
          <Text style={styles.actionBtnText}>
            {service.pricingType === 'CUSTOM_QUOTE' ? 'Request Custom Quote' : 'Continue / Inquire'}
          </Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageGallery: {
    width: '100%',
    height: 240,
    backgroundColor: '#E5E7EB',
  },
  galleryImage: {
    width: 390,
    height: 240,
  },
  coverPlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverIcon: {
    fontSize: 54,
  },
  body: {
    padding: 20,
  },
  catPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  serviceTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 28,
  },
  pricingSection: {
    marginVertical: 14,
  },
  standardPricingBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  mainPrice: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.primary,
    marginRight: 8,
  },
  priceUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  quotePricingBox: {
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  quoteTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  quoteSub: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
    lineHeight: 16,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  specItem: {
    width: '50%',
    paddingVertical: 6,
  },
  specLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  specVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
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
    marginBottom: 8,
  },
  descText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
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
    paddingHorizontal: 20,
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

export default ServiceDetailsScreen;
