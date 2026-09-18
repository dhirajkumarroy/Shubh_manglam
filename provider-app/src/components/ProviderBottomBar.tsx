import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import AppIcon from './AppIcon';
import colors from '../theme/colors';

export type ProviderTabType =
  | 'DASHBOARD'
  | 'QUOTES'
  | 'BOOKINGS'
  | 'SERVICES'
  | 'PACKAGES'
  | 'INQUIRIES'
  | 'PROFILE';

interface ProviderBottomBarProps {
  activeTab: ProviderTabType;
  onTabPress: (tab: ProviderTabType) => void;
  servicesCount?: number;
  quotesCount?: number;
  bookingsCount?: number;
  inquiriesCount?: number;
}

export const ProviderBottomBar: React.FC<ProviderBottomBarProps> = ({
  activeTab,
  onTabPress,
  servicesCount = 0,
  bookingsCount = 0,
  inquiriesCount = 0,
}) => {
  const tabs = [
    {
      key: 'DASHBOARD' as ProviderTabType,
      label: 'Home',
      iconActive: 'home',
      iconInactive: 'home-outline',
      iconType: 'ionicons' as const,
      badge: undefined,
    },
    {
      key: 'INQUIRIES' as ProviderTabType,
      label: 'Leads',
      iconActive: 'people',
      iconInactive: 'people-outline',
      iconType: 'ionicons' as const,
      badge: inquiriesCount > 0 ? inquiriesCount : undefined,
    },
    {
      key: 'BOOKINGS' as ProviderTabType,
      label: 'Bookings',
      iconActive: 'calendar',
      iconInactive: 'calendar-outline',
      iconType: 'ionicons' as const,
      badge: bookingsCount > 0 ? bookingsCount : undefined,
    },
    {
      key: 'SERVICES' as ProviderTabType,
      label: 'Services',
      iconActive: 'briefcase',
      iconInactive: 'briefcase-outline',
      iconType: 'ionicons' as const,
      badge: servicesCount > 0 ? servicesCount : undefined,
    },
    {
      key: 'PROFILE' as ProviderTabType,
      label: 'Profile',
      iconActive: 'person',
      iconInactive: 'person-outline',
      iconType: 'ionicons' as const,
      badge: undefined,
    },
  ];

  const isTabActive = (tabKey: ProviderTabType) => {
    if (tabKey === 'DASHBOARD') return activeTab === 'DASHBOARD';
    if (tabKey === 'INQUIRIES') return activeTab === 'INQUIRIES' || activeTab === 'QUOTES';
    if (tabKey === 'BOOKINGS') return activeTab === 'BOOKINGS';
    if (tabKey === 'SERVICES') return activeTab === 'SERVICES' || activeTab === 'PACKAGES';
    if (tabKey === 'PROFILE') return activeTab === 'PROFILE';
    return false;
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = isTabActive(tab.key);
        const iconName = active ? tab.iconActive : tab.iconInactive;
        const iconColor = active ? '#881337' : '#78716C';

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabBtn}
            activeOpacity={0.7}
            onPress={() => onTabPress(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            {/* Icon Wrap with optional badge */}
            <View style={styles.iconWrap}>
              <AppIcon
                type={tab.iconType}
                name={iconName}
                size={22}
                color={iconColor}
              />
              {tab.badge !== undefined && (
                <View style={styles.badgeWrap}>
                  <Text style={styles.badgeText}>
                    {typeof tab.badge === 'number' && tab.badge > 9 ? '9+' : tab.badge}
                  </Text>
                </View>
              )}
            </View>

            {/* Label */}
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
              {tab.label}
            </Text>

            {/* Active Saffron Pill Indicator under label */}
            {active ? (
              <View style={styles.activePillIndicator} />
            ) : (
              <View style={styles.inactivePlaceholder} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EBE5DC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 10,
      },
      default: {},
    }),
  },
  tabBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 4,
  },
  iconWrap: {
    position: 'relative',
    marginBottom: 2,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrap: {
    position: 'absolute',
    top: -3,
    right: -8,
    backgroundColor: '#DC2626',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#78716C',
    marginTop: 1,
  },
  tabLabelActive: {
    color: '#881337', // Brand maroon
    fontWeight: '800',
  },
  activePillIndicator: {
    width: 16,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#E65100', // Saffron orange indicator
    marginTop: 3,
  },
  inactivePlaceholder: {
    width: 16,
    height: 3,
    marginTop: 3,
  },
});

export default ProviderBottomBar;
