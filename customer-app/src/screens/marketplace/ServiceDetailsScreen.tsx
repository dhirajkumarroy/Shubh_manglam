import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import colors from '../../theme/colors';
import { useServiceDetails } from '../../hooks/useEventPlanning';
import { openDialer, openWhatsApp } from '../../utils/contact';
import { InquiryModal } from '../../components/InquiryModal';

export const ServiceDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [inquiryModalVisible, setInquiryModalVisible] = useState<boolean>(false);
  const serviceId = route.params?.serviceId;
  const eventId = route.params?.eventId;
  const latitude = route.params?.latitude;
  const longitude = route.params?.longitude;

  const { data: service, isLoading, error } = useServiceDetails(
    serviceId,
    latitude && longitude ? { latitude, longitude } : undefined
  );

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
    setInquiryModalVisible(true);
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
              <View style={styles.vendorCardHeaderRow}>
                <Text style={styles.vendorCardHeading}>OFFERED BY</Text>
                {service.distanceKm !== null && service.distanceKm !== undefined && (
                  <View style={styles.distanceBadge}>
                    <Text style={styles.distanceBadgeText}>📍 {service.distanceKm} km away</Text>
                  </View>
                )}
              </View>

              <View style={styles.vendorCardBody}>
                <View style={styles.vendorInfo}>
                  <Text style={styles.vendorName}>{service.vendor.businessName}</Text>
                  <Text style={styles.vendorLocation}>
                    📍 {service.vendor.city}, {service.vendor.state}
                  </Text>
                  {service.vendor.phone && (
                    <Text style={styles.vendorPhone}>
                      📞 {service.vendor.phone}
                    </Text>
                  )}
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
                      latitude,
                      longitude,
                    })
                  }
                >
                  <Text style={styles.viewVendorBtnText}>View Profile →</Text>
                </TouchableOpacity>
              </View>

              {/* Vendor Quick Contact Action Buttons */}
              <View style={styles.vendorContactRow}>
                <TouchableOpacity
                  style={styles.contactCallBtn}
                  activeOpacity={0.8}
                  onPress={() => openDialer(service.vendor?.phone || '')}
                >
                  <Text style={styles.contactCallBtnText}>📞 Call Provider</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.contactWhatsAppBtn}
                  activeOpacity={0.8}
                  onPress={() =>
                    openWhatsApp(
                      service.vendor?.phone || '',
                      `Hello ${service.vendor?.businessName}, I found your service "${service.name}" on Shubh Mangalam and would like to check availability and pricing.`
                    )
                  }
                >
                  <Text style={styles.contactWhatsAppBtnText}>💬 WhatsApp</Text>
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

        <View style={styles.bottomActionsGroup}>
          <TouchableOpacity
            style={styles.bottomCallBtn}
            activeOpacity={0.8}
            onPress={() => openDialer(service.vendor?.phone || '')}
          >
            <Text style={styles.bottomCallIcon}>📞</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomWhatsAppBtn}
            activeOpacity={0.8}
            onPress={() =>
              openWhatsApp(
                service.vendor?.phone || '',
                `Hello ${service.vendor?.businessName}, I found your service "${service.name}" on Shubh Mangalam and would like to check availability and pricing.`
              )
            }
          >
            <Text style={styles.bottomWhatsAppText}>💬 WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleAction}>
            <Text style={styles.actionBtnText}>
              {service.pricingType === 'CUSTOM_QUOTE' ? 'Custom Quote' : 'Inquire'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Inquiry Modal Form */}
      {service.vendor && (
        <InquiryModal
          visible={inquiryModalVisible}
          onClose={() => setInquiryModalVisible(false)}
          vendorId={service.vendor.id}
          vendorName={service.vendor.businessName}
          serviceId={service.id}
          serviceName={service.name}
          onSuccess={() => navigation.navigate('CustomerInquiriesScreen')}
        />
      )}
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
  vendorCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vendorCardHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  distanceBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  distanceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
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
  vendorPhone: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
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
  vendorContactRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  contactCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 10,
  },
  contactCallBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  contactWhatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  contactWhatsAppBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomPriceWrap: {
    flex: 1,
  },
  bottomLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  bottomPrice: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.primary,
  },
  bottomActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomCallBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bottomCallIcon: {
    fontSize: 18,
  },
  bottomWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
  },
  bottomWhatsAppText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 11,
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
    fontSize: 13,
  },
});

export default ServiceDetailsScreen;
