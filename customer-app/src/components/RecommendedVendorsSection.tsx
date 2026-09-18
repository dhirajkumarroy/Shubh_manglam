import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import AppIcon from './AppIcon';
import colors from '../theme/colors';

export interface VendorItemData {
  id: string;
  businessName: string;
  primaryCategory?: string;
  city?: string;
  state?: string;
  ratingAverage?: number;
  ratingCount?: number;
  coverImage?: string | null;
  categories?: { id: string; name: string }[];
  distanceKm?: number | null;
}

interface RecommendedVendorsSectionProps {
  vendors: VendorItemData[];
  onSelectVendor: (vendor: VendorItemData) => void;
  onSeeAll?: () => void;
}

export const RecommendedVendorsSection: React.FC<RecommendedVendorsSectionProps> = ({
  vendors,
  onSelectVendor,
  onSeeAll,
}) => {
  const [favoriteMap, setFavoriteMap] = useState<Record<string, boolean>>({});

  const toggleFavorite = (vendorId: string) => {
    setFavoriteMap((prev) => ({
      ...prev,
      [vendorId]: !prev[vendorId],
    }));
  };

  const getFallbackImage = (categoryName?: string) => {
    const lower = (categoryName || '').toLowerCase();
    if (lower.includes('cater') || lower.includes('halwai') || lower.includes('food')) {
      return 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&auto=format&fit=crop&q=80';
    }
    if (lower.includes('music') || lower.includes('dj') || lower.includes('sound')) {
      return 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80';
    }
    if (lower.includes('photo') || lower.includes('video')) {
      return 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=80';
  };

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Recommended Vendors Near You</Text>
        {onSeeAll && (
          <TouchableOpacity activeOpacity={0.7} onPress={onSeeAll} style={styles.seeAllBtn}>
            <Text style={styles.seeAllText}>See All →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Vendor Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {vendors.map((vendor) => {
          const isFav = !!favoriteMap[vendor.id];
          const primaryCat =
            vendor.primaryCategory || vendor.categories?.[0]?.name || 'Celebration Services';
          const imageUri = vendor.coverImage || getFallbackImage(primaryCat);
          const location = [vendor.city, vendor.state].filter(Boolean).join(', ') || 'Punjab';
          const rating = vendor.ratingAverage ? Number(vendor.ratingAverage).toFixed(1) : '4.8';
          const reviews = vendor.ratingCount || 120;

          // Tags
          const tags = (vendor.categories || []).slice(0, 3).map((c) => c.name);
          if (tags.length === 0) tags.push('Verified', 'Events');

          return (
            <TouchableOpacity
              key={vendor.id}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => onSelectVendor(vendor)}
            >
              {/* Cover Image Container */}
              <View style={styles.imageWrap}>
                <Image source={{ uri: imageUri }} style={styles.coverImage} resizeMode="cover" />

                {/* Floating Favorite Heart Button */}
                <TouchableOpacity
                  style={styles.heartBtn}
                  activeOpacity={0.8}
                  onPress={() => toggleFavorite(vendor.id)}
                  accessibilityLabel="Save to favorites"
                >
                  <AppIcon
                    type="ionicons"
                    name={isFav ? 'heart' : 'heart-outline'}
                    size={18}
                    color={isFav ? '#DC2626' : '#FFFFFF'}
                  />
                </TouchableOpacity>

                {/* Floating Rating Pill */}
                <View style={styles.ratingPill}>
                  <Text style={styles.starText}>★</Text>
                  <Text style={styles.ratingText}>{rating}</Text>
                  <Text style={styles.reviewCountText}>({reviews})</Text>
                </View>
              </View>

              {/* Card Body */}
              <View style={styles.body}>
                <Text style={styles.vendorName} numberOfLines={1}>
                  {vendor.businessName}
                </Text>
                <Text style={styles.categoryText} numberOfLines={1}>
                  {primaryCat}
                </Text>
                <View style={styles.locationRow}>
                  <AppIcon type="ionicons" name="location-sharp" size={12} color="#E65100" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {location}
                  </Text>
                </View>

                {/* Tags Pill Row */}
                <View style={styles.tagsRow}>
                  {tags.map((tag, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.tagPill,
                        idx === 0 && styles.tagPillFirst,
                        idx === 1 && styles.tagPillSecond,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          idx === 0 && styles.tagTextFirst,
                          idx === 1 && styles.tagTextSecond,
                        ]}
                      >
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerRow: {
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
  seeAllBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#881337', // Brand Royal Maroon
  },
  scrollList: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
  },
  card: {
    width: 235,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7E0D8',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  imageWrap: {
    height: 132,
    width: '100%',
    position: 'relative',
    backgroundColor: '#FAF8F5',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  heartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingPill: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  starText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '900',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1C1917',
  },
  reviewCountText: {
    fontSize: 10,
    color: '#78716C',
  },
  body: {
    padding: 12,
  },
  vendorName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 11.5,
    color: '#57534E',
    fontWeight: '500',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 11,
    color: '#78716C',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E7E0D8',
  },
  tagPillFirst: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  tagPillSecond: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FFE4E6',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78716C',
  },
  tagTextFirst: {
    color: '#92400E',
  },
  tagTextSecond: {
    color: '#9F1239',
  },
});

export default RecommendedVendorsSection;
