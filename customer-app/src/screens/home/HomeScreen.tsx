import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '../../store';
import colors from '../../theme/colors';
import {
  useEventTypes,
  useCustomerEvents,
  useMarketplaceVendors,
  useMarketplaceCategories,
  useMarketplaceServices,
  useMarketplacePackages,
} from '../../hooks/useEventPlanning';

// Redesigned Components
import UserGreetingCard from '../../components/UserGreetingCard';
import HomeSearchBar from '../../components/HomeSearchBar';
import EventTypeCarousel, { EventTypeItem } from '../../components/EventTypeCarousel';
import HeroPromoBanner from '../../components/HeroPromoBanner';
import YourEventsCard from '../../components/YourEventsCard';
import QuickActionGrid from '../../components/QuickActionGrid';
import RecommendedVendorsSection from '../../components/RecommendedVendorsSection';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);

  const [selectedEventTypeId, setSelectedEventTypeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{
    city?: string;
    latitude?: number;
    longitude?: number;
    label?: string;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // 100% Database-Driven Marketplace Data
  const { data: eventTypes = [] } = useEventTypes();
  const { data: userEvents = [] } = useCustomerEvents();
  const { data: categories = [] } = useMarketplaceCategories();
  const { data: vendorData } = useMarketplaceVendors({
    city: selectedLocation?.city,
    latitude: selectedLocation?.latitude,
    longitude: selectedLocation?.longitude,
    sort: selectedLocation?.latitude ? 'nearest' : 'rating',
    limit: 8,
  });
  const { data: serviceData, isLoading: servicesLoading } = useMarketplaceServices({
    city: selectedLocation?.city,
    latitude: selectedLocation?.latitude,
    longitude: selectedLocation?.longitude,
    sortBy: selectedLocation?.latitude ? 'nearest' : 'newest',
    limit: 6,
  });

  const vendors = vendorData?.vendors || [];
  const services = serviceData?.services || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['event-types'] }),
      queryClient.invalidateQueries({ queryKey: ['customer-events'] }),
      queryClient.invalidateQueries({ queryKey: ['marketplace-categories'] }),
      queryClient.invalidateQueries({ queryKey: ['marketplace-vendors'] }),
      queryClient.invalidateQueries({ queryKey: ['marketplace-services'] }),
    ]);
    setRefreshing(false);
  };

  const handleSelectEventType = (et: EventTypeItem | null) => {
    if (!et) {
      setSelectedEventTypeId(null);
      return;
    }
    setSelectedEventTypeId(et.id);
    navigation.navigate('CreateEventScreen', { selectedEventType: et });
  };

  const handleSearchSubmit = () => {
    navigation.navigate('VendorDiscoveryScreen', {
      search: searchQuery.trim(),
      city: selectedLocation?.city,
      latitude: selectedLocation?.latitude,
      longitude: selectedLocation?.longitude,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* 1. Personalized Greeting Card */}
        <UserGreetingCard userName={user?.name || 'Priya Sharma'} />

        {/* 2. Search + Location Bar */}
        <HomeSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={handleSearchSubmit}
          selectedLocationText={selectedLocation?.city ? `${selectedLocation.city}, Punjab` : 'Kharar, Punjab'}
          onPressLocation={() =>
            navigation.navigate('LocationSelectionScreen', {
              onSelectLocation: (loc: any) => {
                setSelectedLocation({
                  city: loc.city,
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                  label: loc.city || loc.label || 'Selected Venue',
                });
              },
            })
          }
        />

        {/* 3. Event Types Carousel ("What are you celebrating?") */}
        <EventTypeCarousel
          eventTypes={eventTypes}
          selectedEventTypeId={selectedEventTypeId}
          onSelectEventType={handleSelectEventType}
          onViewAll={() => navigation.navigate('EventTypesScreen')}
        />

        {/* 4. Hero Promotional Banner */}
        <HeroPromoBanner
          onPressExplore={() =>
            navigation.navigate('VendorDiscoveryScreen', {
              city: selectedLocation?.city,
              latitude: selectedLocation?.latitude,
              longitude: selectedLocation?.longitude,
            })
          }
        />

        {/* 5. "Your Events" Card */}
        <YourEventsCard
          eventsCount={userEvents.length}
          onPressManage={() => navigation.navigate('EventsTab')}
          onCreateEvent={() => navigation.navigate('CreateEventScreen')}
        />

        {/* 6. Quick Actions Grid */}
        <QuickActionGrid
          onFindVendors={() =>
            navigation.navigate('VendorDiscoveryScreen', {
              city: selectedLocation?.city,
            })
          }
          onRequestQuote={() =>
            navigation.navigate('VendorDiscoveryScreen', {
              city: selectedLocation?.city,
            })
          }
          onMyQuotes={() => navigation.navigate('QuotesListScreen')}
          onMyBookings={() => navigation.navigate('MyBookingsScreen')}
        />

        {/* 7. Recommended Vendors Near You */}
        <RecommendedVendorsSection
          vendors={vendors}
          onSelectVendor={(vendor) =>
            navigation.navigate('VendorDetailsScreen', {
              vendorId: vendor.id,
              latitude: selectedLocation?.latitude,
              longitude: selectedLocation?.longitude,
            })
          }
          onSeeAll={() =>
            navigation.navigate('VendorDiscoveryScreen', {
              city: selectedLocation?.city,
              latitude: selectedLocation?.latitude,
              longitude: selectedLocation?.longitude,
            })
          }
        />

        {/* 8. Celebration Services Snapshot */}
        {services.length > 0 && (
          <View style={styles.servicesSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Popular Celebration Services</Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('CategoryDiscoveryScreen')
                }
              >
                <Text style={styles.seeAllText}>Explore All →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.servicesGrid}>
              {services.map((svc) => (
                <TouchableOpacity
                  key={svc.id}
                  style={styles.serviceMiniCard}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate('ServiceDetailsScreen', {
                      serviceId: svc.id,
                      latitude: selectedLocation?.latitude,
                      longitude: selectedLocation?.longitude,
                    })
                  }
                >
                  {svc.primaryImage ? (
                    <Image
                      source={{ uri: svc.primaryImage }}
                      style={styles.serviceMiniImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.serviceFallback}>
                      <Text style={styles.serviceFallbackIcon}>🌸</Text>
                    </View>
                  )}
                  <View style={styles.serviceMiniBody}>
                    <Text style={styles.serviceMiniTitle} numberOfLines={1}>
                      {svc.name}
                    </Text>
                    {svc.vendor && (
                      <Text style={styles.serviceMiniVendor} numberOfLines={1}>
                        by {svc.vendor.businessName}
                      </Text>
                    )}
                    <Text style={styles.serviceMiniPrice}>
                      {svc.pricingType === 'CUSTOM_QUOTE'
                        ? 'Custom Quote'
                        : `₹${svc.basePrice?.toLocaleString() || 0}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F5', // Warm Ivory / Cream
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#881337', // Brand Royal Maroon
  },
  servicesSection: {
    marginBottom: 20,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceMiniCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E0D8',
    overflow: 'hidden',
  },
  serviceMiniImage: {
    width: '100%',
    height: 100,
  },
  serviceFallback: {
    width: '100%',
    height: 100,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceFallbackIcon: {
    fontSize: 28,
  },
  serviceMiniBody: {
    padding: 10,
  },
  serviceMiniTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 2,
  },
  serviceMiniVendor: {
    fontSize: 11,
    color: '#78716C',
    marginBottom: 4,
  },
  serviceMiniPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E65100', // Saffron Orange
  },
});

export default HomeScreen;
