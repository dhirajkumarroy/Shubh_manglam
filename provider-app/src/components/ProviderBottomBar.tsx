import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import colors from '../theme/colors';

export type ProviderTabType = 'DASHBOARD' | 'SERVICES' | 'PACKAGES' | 'INQUIRIES' | 'PROFILE';

interface ProviderBottomBarProps {
  activeTab: ProviderTabType;
  onTabPress: (tab: ProviderTabType) => void;
  servicesCount?: number;
  inquiriesCount?: number;
}

export const ProviderBottomBar: React.FC<ProviderBottomBarProps> = ({
  activeTab,
  onTabPress,
  servicesCount = 5,
  inquiriesCount = 2,
}) => {
  const tabs: { key: ProviderTabType; label: string; icon: string; badge?: string | number }[] = [
    {
      key: 'DASHBOARD',
      label: 'Dashboard',
      icon: '📊',
    },
    {
      key: 'SERVICES',
      label: 'Services',
      icon: '🎪',
      badge: servicesCount > 0 ? servicesCount : undefined,
    },
    {
      key: 'PACKAGES',
      label: 'Packages',
      icon: '📦',
    },
    {
      key: 'INQUIRIES',
      label: 'Inquiries',
      icon: '📋',
      badge: inquiriesCount > 0 ? 'New' : undefined,
    },
    {
      key: 'PROFILE',
      label: 'Profile',
      icon: '👤',
    },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, isActive && styles.tabBtnActive]}
            activeOpacity={0.7}
            onPress={() => onTabPress(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            {/* Active Indicator Top Pill */}
            {isActive && <View style={styles.activeTopPill} />}

            <View style={styles.iconWrap}>
              <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                {tab.icon}
              </Text>
              {tab.badge && (
                <View
                  style={[
                    styles.tabBadge,
                    typeof tab.badge === 'string' ? styles.tabBadgePill : null,
                  ]}
                >
                  <Text style={styles.tabBadgeText}>{tab.badge}</Text>
                </View>
              )}
            </View>

            <Text
              style={[styles.tabLabel, isActive && styles.tabLabelActive]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
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
    borderTopColor: '#E7E0D8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  tabBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  tabBtnActive: {
    backgroundColor: '#FFFDF9',
  },
  activeTopPill: {
    position: 'absolute',
    top: 0,
    width: 36,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: colors.primary,
  },
  iconWrap: {
    position: 'relative',
    marginBottom: 2,
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
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
  tabBadgePill: {
    backgroundColor: '#16A34A',
    minWidth: 24,
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#78716C',
    marginTop: 2,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
});

export default ProviderBottomBar;
