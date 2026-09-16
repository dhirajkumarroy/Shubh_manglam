import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useVehicles } from '../../hooks/useVehicles';
import colors from '../../theme/colors';
import { VehicleStackParamList } from '../../navigation/types';
import Config from '../../config';
import { Vehicle } from '../../types/vehicle';

export const VehicleListScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<VehicleStackParamList>>();
  const [search, setSearch] = useState('');
  const [selectedFuelType, setSelectedFuelType] = useState<string | undefined>(undefined);

  // Invoke React Query hook with search and category filters
  const { data, isLoading, isError, error, refetch, isFetching } = useVehicles({
    search: search || undefined,
    fuelType: selectedFuelType || undefined,
  });

  const vehicles = data?.vehicles || [];

  // Helper function to resolve dynamic image endpoints
  const getFullImageUrl = (imagePath?: string): string => {
    const fallbackImage = 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=500&auto=format&fit=crop';
    if (!imagePath) return fallbackImage;
    if (imagePath.startsWith('http')) return imagePath;

    // Extract base URL (e.g., http://localhost:8000) from Config.API_URL
    const baseUrl = Config.API_URL.split('/api/v1')[0];
    return `${baseUrl}/${imagePath.replace(/^\//, '')}`;
  };

  const renderItem = ({ item }: { item: Vehicle }) => {
    // Determine thumbnail image
    const primaryImageObj = item.images.find(img => img.isPrimary) || item.images[0];
    const imageUri = getFullImageUrl(primaryImageObj?.imageUrl);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('VehicleDetails', { id: item.id })}
      >
        <Image source={{ uri: imageUri }} style={styles.cardImage} />
        <View style={styles.cardInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <View style={[styles.availabilityBadge, item.isAvailable ? styles.badgeAvailable : styles.badgeUnavailable]}>
              <Text style={[styles.availabilityText, { color: item.isAvailable ? '#22c55e' : '#ef4444' }]}>
                {item.isAvailable ? 'Available' : 'Booked'}
              </Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>{item.brand} • {item.model}</Text>
          
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.fuelType}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.transmission}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.city}</Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}><Text style={styles.priceAmount}>₹{item.pricePerDay}</Text>/day</Text>
            <Text style={styles.bookNow}>View Details →</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const fuelTypes = ['ALL', 'PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'HYBRID'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Your Ride</Text>
        <Text style={styles.subtitle}>Rent premium vehicles verified locally</Text>
        
        <TextInput
          style={styles.searchInput}
          placeholder="Search brand, model or city..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Fuel Type Filters */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {fuelTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterTab,
                ((type === 'ALL' && selectedFuelType === undefined) || selectedFuelType === type) && styles.filterTabActive
              ]}
              onPress={() => setSelectedFuelType(type === 'ALL' ? undefined : type)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  ((type === 'ALL' && selectedFuelType === undefined) || selectedFuelType === type) && styles.filterTabTextActive
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={(item) => String(item)}
          renderItem={() => <SkeletonLoader />}
          contentContainerStyle={styles.listContainer}
        />
      ) : isError ? (
        <ErrorState onRetry={refetch} message={error?.message} />
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor="#8b5cf6"
              colors={['#8b5cf6']}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No vehicles found"
              message="Try adjusting your search query or filters."
              icon="🚗"
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  searchInput: {
    backgroundColor: colors.card,
    borderColor: colors.borderLight,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    marginTop: 16,
  },
  filterWrapper: {
    marginTop: 14,
    marginBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 24,
  },
  filterTab: {
    backgroundColor: colors.card,
    borderColor: colors.borderLight,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: colors.primary,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 10,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardInfo: {
    padding: 18,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeAvailable: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  badgeUnavailable: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  badge: {
    backgroundColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
  },
  price: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  priceAmount: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '800',
  },
  bookNow: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '700',
  },
  errorSub: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: colors.card,
    borderColor: colors.borderLight,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMuted,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
});

export default VehicleListScreen;
