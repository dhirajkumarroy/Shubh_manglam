import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AppIcon from '../../components/AppIcon';
import HomeSearchBar from '../../components/HomeSearchBar';
import EventTypeCarousel, { EventTypeItem } from '../../components/EventTypeCarousel';
import RecommendedVendorsSection from '../../components/RecommendedVendorsSection';
import colors from '../../theme/colors';
import {
  useEventTypes,
  useMarketplaceCategories,
  useMarketplaceVendors,
} from '../../hooks/useEventPlanning';

export const ExploreScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventTypeId, setSelectedEventTypeId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const { data: eventTypes = [], isLoading: eventTypesLoading } = useEventTypes();
  const { data: categories = [], isLoading: categoriesLoading } = useMarketplaceCategories();
  const { data: vendorData, isLoading: vendorsLoading } = useMarketplaceVendors({
    categoryId: selectedCategoryId || undefined,
    limit: 10,
  });

  const vendors = vendorData?.vendors || [];

  const handleSearchSubmit = () => {
    navigation.navigate('VendorDiscoveryScreen', {
      search: searchQuery.trim(),
      categoryId: selectedCategoryId || undefined,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Screen Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Explore Marketplace</Text>
          <Text style={styles.subtitle}>Discover verified vendors, packages & celebration venues</Text>
        </View>

        {/* Search Bar with Location */}
        <HomeSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={handleSearchSubmit}
          selectedLocationText="Kharar, Punjab"
          onPressLocation={() => navigation.navigate('LocationSelectionScreen')}
        />

        {/* 1. Event Types Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Filter by Event</Text>
          <TouchableOpacity onPress={() => navigation.navigate('EventTypesScreen')}>
            <Text style={styles.seeAllText}>All Events →</Text>
          </TouchableOpacity>
        </View>

        <EventTypeCarousel
          eventTypes={eventTypes}
          selectedEventTypeId={selectedEventTypeId}
          onSelectEventType={(et) => setSelectedEventTypeId(et?.id || null)}
          onViewAll={() => navigation.navigate('EventTypesScreen')}
        />

        {/* 2. Celebration Categories Grid */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Celebration Categories</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CategoryDiscoveryScreen')}>
            <Text style={styles.seeAllText}>Browse All →</Text>
          </TouchableOpacity>
        </View>

        {categoriesLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.categoryGrid}>
            <TouchableOpacity
              style={[styles.categoryChip, selectedCategoryId === null && styles.categoryChipActive]}
              activeOpacity={0.7}
              onPress={() => setSelectedCategoryId(null)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategoryId === null && styles.categoryChipTextActive,
                ]}
              >
                ✨ All Categories
              </Text>
            </TouchableOpacity>

            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedCategoryId(isSelected ? null : cat.id);
                    navigation.navigate('VendorDiscoveryScreen', {
                      categoryId: cat.id,
                      categoryName: cat.name,
                    });
                  }}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat.icon ? `${cat.icon} ` : '🎪 '}
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* 3. Recommended Vendors */}
        <RecommendedVendorsSection
          vendors={vendors}
          onSelectVendor={(v) => navigation.navigate('VendorDetailsScreen', { vendorId: v.id })}
          onSeeAll={() =>
            navigation.navigate('VendorDiscoveryScreen', {
              categoryId: selectedCategoryId || undefined,
            })
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#881337', // Brand Royal Maroon
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#881337',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E0D8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  categoryChipActive: {
    backgroundColor: '#881337',
    borderColor: '#881337',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1917',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
});

export default ExploreScreen;
