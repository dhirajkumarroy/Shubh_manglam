import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import colors from '../theme/colors';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useUnreadCount } from '../hooks/useNotifications';

export const CustomerBottomBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { data: unreadCountData } = useUnreadCount();
  const unreadCount = unreadCountData?.count || 0;

  const getTabDetails = (routeName: string) => {
    switch (routeName) {
      case 'HomeTab':
        return { label: 'Home', icon: '🏠' };
      case 'InquiriesTab':
        return { label: 'Requests', icon: '📋' };
      case 'EventsTab':
        return { label: 'Events', icon: '🎪' };
      case 'NotificationTab':
        return {
          label: 'Alerts',
          icon: '🔔',
          badge: unreadCount > 0 ? unreadCount : undefined,
        };
      case 'ProfileTab':
        return { label: 'Profile', icon: '👤' };
      default:
        return { label: routeName, icon: '⭐' };
    }
  };

  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const { label, icon, badge } = getTabDetails(route.name);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={[styles.tabBtn, isFocused && styles.tabBtnActive]}
            activeOpacity={0.7}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={options.tabBarAccessibilityLabel || label}
          >
            {/* Active Indicator Top Pill */}
            {isFocused && <View style={styles.activeTopPill} />}

            <View style={styles.iconWrap}>
              <Text style={[styles.tabIcon, isFocused && styles.tabIconActive]}>
                {icon}
              </Text>
              {badge !== undefined && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>
                    {Number(badge) > 9 ? '9+' : badge}
                  </Text>
                </View>
              )}
            </View>

            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E7E0D8',
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 22 : 8,
    paddingTop: 6,
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
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 2,
  },
  tabBtnActive: {},
  activeTopPill: {
    position: 'absolute',
    top: -6,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 26,
    width: 32,
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.65,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
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
  tabBadge: {
    position: 'absolute',
    top: -3,
    right: -4,
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
});

export default CustomerBottomBar;
