import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import colors from '../../theme/colors';
import { useMarketplaceCategories } from '../../hooks/useEventPlanning';

export const CategoryDiscoveryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const eventTypeId = route.params?.eventTypeId;
  const eventId = route.params?.eventId;

  const [search, setSearch] = useState('');
  const { data: categories = [], isLoading, refetch } = useMarketplaceCategories({
    eventTypeId,
    search: search.trim() || undefined,
  });

  const handleSelectCategory = (cat: any) => {
    navigation.navigate('VendorDiscoveryScreen', {
      categoryId: cat.id,
      categoryName: cat.name,
      eventId,
    });
  };

  const handleSelectSubcategory = (cat: any, sub: any) => {
    navigation.navigate('VendorDiscoveryScreen', {
      categoryId: cat.id,
      categoryName: cat.name,
      subcategoryId: sub.id,
      subcategoryName: sub.name,
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
          <Text style={styles.title}>Celebration Categories</Text>
          <Text style={styles.subTitle}>Explore verified local services</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search catering, decoration, DJ, makeup..."
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
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centerText}>Loading categories...</Text>
        </View>
      ) : categories.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyIcon}>🎪</Text>
          <Text style={styles.emptyTitle}>No Categories Found</Text>
          <Text style={styles.emptySub}>Try searching for another service category.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {categories.map((cat) => (
              <View key={cat.id} style={styles.cardContainer}>
                <TouchableOpacity
                  style={styles.card}
                  activeOpacity={0.7}
                  onPress={() => handleSelectCategory(cat)}
                >
                  <View style={styles.iconBox}>
                    <Text style={styles.iconText}>{cat.icon || '🎪'}</Text>
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{cat.name}</Text>
                    {cat.description && (
                      <Text style={styles.cardDesc} numberOfLines={2}>
                        {cat.description}
                      </Text>
                    )}
                    <View style={styles.metaRow}>
                      <Text style={styles.metaText}>
                        🏢 {cat.vendorCount} Vendor{cat.vendorCount !== 1 ? 's' : ''}
                      </Text>
                      <Text style={styles.metaTextDot}>•</Text>
                      <Text style={styles.metaText}>
                        📦 {cat.serviceCount} Service{cat.serviceCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardArrow}>›</Text>
                </TouchableOpacity>

                {/* Subcategories chips if present */}
                {cat.subcategories && cat.subcategories.length > 0 && (
                  <View style={styles.subcatSection}>
                    <Text style={styles.subcatLabel}>Subcategories:</Text>
                    <View style={styles.subcatChipGrid}>
                      {cat.subcategories.slice(0, 5).map((sub: any) => (
                        <TouchableOpacity
                          key={sub.id}
                          style={styles.subcatChip}
                          onPress={() => handleSelectSubcategory(cat, sub)}
                        >
                          <Text style={styles.subcatChipText}>{sub.name}</Text>
                        </TouchableOpacity>
                      ))}
                      {cat.subcategories.length > 5 && (
                        <TouchableOpacity
                          style={styles.subcatChipMore}
                          onPress={() => handleSelectCategory(cat)}
                        >
                          <Text style={styles.subcatChipMoreText}>+{cat.subcategories.length - 5} more</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </View>
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
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  clearIcon: {
    fontSize: 14,
    color: '#9CA3AF',
    padding: 4,
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
    marginTop: 4,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  grid: {
    gap: 12,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconText: {
    fontSize: 24,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  cardDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  metaText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
  },
  metaTextDot: {
    fontSize: 10,
    color: '#9CA3AF',
    marginHorizontal: 6,
  },
  cardArrow: {
    fontSize: 22,
    color: '#9CA3AF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  subcatSection: {
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  subcatLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  subcatChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  subcatChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subcatChipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  subcatChipMore: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subcatChipMoreText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '600',
  },
});

export default CategoryDiscoveryScreen;
