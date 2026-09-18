import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import AppIcon from './AppIcon';
import colors from '../theme/colors';

export interface EventTypeItem {
  id: string;
  name: string;
  slug?: string;
  icon?: string | null;
}

interface EventTypeCarouselProps {
  eventTypes: EventTypeItem[];
  selectedEventTypeId?: string | null;
  onSelectEventType: (et: EventTypeItem | null) => void;
  onViewAll?: () => void;
}

export const EventTypeCarousel: React.FC<EventTypeCarouselProps> = ({
  eventTypes,
  selectedEventTypeId,
  onSelectEventType,
  onViewAll,
}) => {
  // Helper to map event type to icon if not given
  const getEventIcon = (name: string, icon?: string | null) => {
    if (icon) return icon;
    const lower = name.toLowerCase();
    if (lower.includes('wedding')) return '💍';
    if (lower.includes('birthday')) return '🎂';
    if (lower.includes('puja') || lower.includes('religious')) return '🪷';
    if (lower.includes('corporate')) return '💼';
    if (lower.includes('anniversary')) return '❤️';
    return '🎉';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {eventTypes.map((et) => {
          const isSelected = selectedEventTypeId === et.id;
          const displayIcon = getEventIcon(et.name, et.icon);

          return (
            <TouchableOpacity
              key={et.id}
              style={[
                styles.itemCard,
                isSelected && styles.itemCardSelected,
              ]}
              activeOpacity={0.75}
              onPress={() => onSelectEventType(isSelected ? null : et)}
            >
              <View
                style={[
                  styles.iconCircle,
                  isSelected && styles.iconCircleSelected,
                ]}
              >
                <Text style={styles.iconText}>{displayIcon}</Text>
              </View>
              <Text
                style={[
                  styles.itemTitle,
                  isSelected && styles.itemTitleSelected,
                ]}
                numberOfLines={2}
              >
                {et.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* "All Events" item at the end */}
        {onViewAll && (
          <TouchableOpacity
            style={[
              styles.itemCard,
              selectedEventTypeId === 'ALL' && styles.itemCardSelected,
            ]}
            activeOpacity={0.75}
            onPress={onViewAll}
          >
            <View style={styles.iconCircle}>
              <AppIcon type="ionicons" name="grid-outline" size={20} color="#881337" />
            </View>
            <Text style={styles.itemTitle} numberOfLines={2}>
              All Events
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  scrollList: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 16,
  },
  itemCard: {
    width: 72,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E0D8',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },
  itemCardSelected: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  iconCircleSelected: {
    backgroundColor: '#FFE4E6',
  },
  iconText: {
    fontSize: 20,
  },
  itemTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1C1917',
    textAlign: 'center',
    lineHeight: 13,
  },
  itemTitleSelected: {
    color: '#881337', // Brand Royal Maroon
    fontWeight: '900',
  },
});

export default EventTypeCarousel;
