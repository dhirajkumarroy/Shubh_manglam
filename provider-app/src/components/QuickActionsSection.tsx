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

interface QuickActionsSectionProps {
  onManageServices: () => void;
  onManagePackages: () => void;
  onManageProfile: () => void;
  onManageCalendar: () => void;
  onSeeAll?: () => void;
}

export const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({
  onManageServices,
  onManagePackages,
  onManageProfile,
  onManageCalendar,
  onSeeAll,
}) => {
  const actions = [
    {
      key: 'SERVICES',
      title: 'Manage\nServices',
      icon: 'briefcase-outline',
      iconType: 'ionicons' as const,
      iconColor: '#BE123C',
      iconBg: '#FFE4E6',
      bg: '#FFF1F2',
      border: '#FFE4E6',
      btnBg: '#FECDD3',
      btnChevron: '#9F1239',
      onPress: onManageServices,
    },
    {
      key: 'PACKAGES',
      title: 'Manage\nPackages',
      icon: 'cube-outline',
      iconType: 'ionicons' as const,
      iconColor: '#C2410C',
      iconBg: '#FFEDD5',
      bg: '#FFF7ED',
      border: '#FFEDD5',
      btnBg: '#FED7AA',
      btnChevron: '#C2410C',
      onPress: onManagePackages,
    },
    {
      key: 'PROFILE',
      title: 'Business\nProfile & Docs',
      icon: 'document-text-outline',
      iconType: 'ionicons' as const,
      iconColor: '#854D0E',
      iconBg: '#FEF08A',
      bg: '#FEFCE8',
      border: '#FEF08A',
      btnBg: '#FDE047',
      btnChevron: '#854D0E',
      onPress: onManageProfile,
    },
    {
      key: 'CALENDAR',
      title: 'Availability\nCalendar',
      icon: 'calendar-outline',
      iconType: 'ionicons' as const,
      iconColor: '#9D174D',
      iconBg: '#FCE7F3',
      bg: '#FDF2F8',
      border: '#FCE7F3',
      btnBg: '#FBCFE8',
      btnChevron: '#9D174D',
      onPress: onManageCalendar,
    },
  ];

  return (
    <View style={styles.sectionContainer}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {onSeeAll && (
          <TouchableOpacity activeOpacity={0.7} onPress={onSeeAll} style={styles.seeAllBtn}>
            <Text style={styles.seeAllText}>See All →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 4 Cards Carousel / Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsRow}
      >
        {actions.map((act) => (
          <TouchableOpacity
            key={act.key}
            style={[styles.card, { backgroundColor: act.bg, borderColor: act.border }]}
            activeOpacity={0.8}
            onPress={act.onPress}
          >
            {/* Top Icon */}
            <View style={[styles.iconWrap, { backgroundColor: act.iconBg }]}>
              <AppIcon
                type={act.iconType}
                name={act.icon}
                size={20}
                color={act.iconColor}
              />
            </View>

            {/* Bottom Content & Chevron Button */}
            <View style={styles.cardBottomRow}>
              <Text style={styles.cardTitle}>{act.title}</Text>
              <View style={[styles.chevronBtn, { backgroundColor: act.btnBg }]}>
                <AppIcon
                  type="ionicons"
                  name="chevron-forward"
                  size={12}
                  color={act.btnChevron}
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 20,
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
    color: '#881337', // Brand maroon
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 10,
  },
  card: {
    width: 108,
    height: 114,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1C1917',
    lineHeight: 14,
    flex: 1,
    marginRight: 2,
  },
  chevronBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default QuickActionsSection;
